import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '../../../lib/cors';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { checkCronSecret, logSync } from '../../../lib/sync-helpers';

const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
const PAGE_LIMIT = 100;

function parseWeiToNumber(weiStr: string | number | undefined | null): number | null {
  if (typeof weiStr === 'number') return weiStr;
  if (typeof weiStr !== 'string' || !weiStr.trim()) return null;
  const normalized = weiStr.replace(/^0+/, '') || '0';
  const whole = normalized.length > 18 ? normalized.slice(0, -18) : '0';
  const fractional = normalized.slice(-18).padStart(18, '0').replace(/0+$/, '');
  const result = fractional ? Number(`${whole}.${fractional}`) : Number(whole);
  return Number.isFinite(result) ? result : null;
}

export async function POST(req: NextRequest) {
  const startedAt = new Date();

  if (!checkCronSecret(req)) {
    await logSync(startedAt, 'rounds', 'error', 0, 'Unauthorized: invalid cron secret');
    return withCors(NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    let page = 1;
    let totalInserted = 0;
    let allRounds: Array<{
      roundId: number;
      motherlode?: number | null;
      motherlodeHit: boolean;
      prize: number;
      entries: number;
      status: string;
      endTime: number;
      block?: number | null;
      motherlode_running?: number;
    }> = [];

    // Paginate through all rounds
    while (true) {
      const url = new URL(EXPLORE_API_URL);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(PAGE_LIMIT));

      const res = await fetch(url.toString(), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Upstream fetch failed (page ${page}): ${res.status}`);
      }

      const json = await res.json() as { roundsData?: Array<unknown> };
      const roundsData = json.roundsData ?? [];

      if (!Array.isArray(roundsData) || roundsData.length === 0) {
        break; // No more data
      }

      for (const raw of roundsData) {
        if (!raw || typeof raw !== 'object') continue;
        const r = raw as Record<string, unknown>;

        const roundId = typeof r.roundId === 'number' ? r.roundId : Number(r.roundId) || 0;
        const motherlodeRaw = r.motherlode;
        const motherlodeHit = Boolean(r.motherlodeHit);
        let motherlode: number | null = null;
        if (motherlodeHit && motherlodeRaw !== undefined && motherlodeRaw !== null) {
          motherlode = parseWeiToNumber(motherlodeRaw as string | number);
        }

        // Prize and entries may be wei strings or numbers
        const parseNum = (val: unknown): number => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const n = parseWeiToNumber(val);
            return n ?? 0;
          }
          return 0;
        };
        const prize = parseNum(r.prize);
        const entries = typeof r.entries === 'number' ? r.entries : Number(r.entries) || 0;
        const status = typeof r.status === 'string' ? r.status : 'Unknown';
        const endTime = typeof r.endTime === 'number' ? r.endTime : (Number(r.endTime) || Date.now());
        const block = typeof r.block === 'number' ? r.block : (r.block ? parseInt(String(r.block), 10) : null);

        allRounds.push({
          roundId,
          motherlode: motherlodeHit ? motherlode : null,
          motherlodeHit,
          prize,
          entries,
          status,
          endTime,
          block: block !== null && block >= 1 && block <= 25 ? block : null,
        });
      }

      if (roundsData.length < PAGE_LIMIT) {
        break; // Last page
      }
      page += 1;
    }

    // Sort by roundId ascending for motherlode calculation
    allRounds.sort((a, b) => a.roundId - b.roundId);

    // Compute motherlode_running
    let counter = 0;
    const INCREMENT = 0.2;
    for (const round of allRounds) {
      if (round.motherlodeHit) {
        round.motherlode_running = round.motherlode ?? 0;
        counter = 0;
      } else {
        counter += 1;
        round.motherlode_running = counter * INCREMENT;
      }
    }

    // Upsert into 'rounds' table in batches
    const batchSize = 100;
    for (let i = 0; i < allRounds.length; i += batchSize) {
      const batch = allRounds.slice(i, i + batchSize);
      const rows = batch.map(r => ({
        round_id: r.roundId,
        motherlode: r.motherlode,
        motherlode_hit: r.motherlodeHit,
        motherlode_running: r.motherlode_running,
        prize: r.prize,
        entries: r.entries,
        status: r.status,
        end_time: new Date(r.endTime).toISOString(),
        block: r.block,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabaseAdmin
        .from('rounds')
        .upsert(rows, { onConflict: 'round_id' });

      if (upsertError) {
        throw upsertError;
      }

      totalInserted += rows.length;
    }

    await logSync(startedAt, 'rounds', 'success', totalInserted);
    return withCors(NextResponse.json({ status: 'success', records: totalInserted }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await logSync(startedAt, 'rounds', 'error', 0, message);
    return withCors(NextResponse.json({ status: 'error', error: message }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return withCors(NextResponse.json({}));
}

// Allow GET for manual testing
export async function GET(req: NextRequest) {
  return POST(req);
}
