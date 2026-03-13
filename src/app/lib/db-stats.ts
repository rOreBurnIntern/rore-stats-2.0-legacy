import { supabaseAdmin } from './supabase/admin';
import type { MotherlodeHistoryPoint } from './motherlode';

export interface StatsData {
  wethPrice: number;
  rorePrice: number;
  blockPerformance?: {
    block: number;
    wins: number;
  }[];
  winnerTypes?: {
    winnerTakeAll: number;
    split: number;
  };
  motherlode: {
    totalValue: number;
    totalORELocked: number;
    participants: number;
    history?: MotherlodeHistoryPoint[];
  };
  currentRound: {
    number: number;
    status: string;
    prize: number;
    entries: number;
    endTime: number;
  };
  lastUpdated: number;
}

export async function getDbStatsData(): Promise<StatsData | null> {
  try {
    // 1. Get latest prices
    const { data: latestPrices, error: priceError } = await supabaseAdmin
      .from('prices')
      .select('weth_price, rore_price, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (priceError || !latestPrices) {
      console.error('Failed to fetch latest prices:', priceError);
      return null;
    }

    // 2. Get current round (Active status or latest by round_id)
    let { data: currentRoundData, error: roundError } = await supabaseAdmin
      .from('rounds')
      .select('round_id, status, prize, entries, end_time, block')
      .eq('status', 'Active')
      .maybeSingle();

    if (roundError || !currentRoundData) {
      // Fallback: get latest round by round_id
      ({ data: currentRoundData, error: roundError } = await supabaseAdmin
        .from('rounds')
        .select('round_id, status, prize, entries, end_time, block')
        .order('round_id', { ascending: false })
        .limit(1)
        .maybeSingle());
    }

    if (roundError || !currentRoundData) {
      console.error('Failed to fetch current round:', roundError);
      return null;
    }

    // 3. Compute block performance: count motherlode_hit wins per block (only blocks with hits)
    const { data: hitRounds, error: hitsError } = await supabaseAdmin
      .from('rounds')
      .select('block')
      .not('block', 'is', null)
      .eq('motherlode_hit', true);

    if (hitsError) {
      console.error('Failed to fetch hit rounds:', hitsError);
    }

    const blockPerformance = hitRounds
      ? (() => {
          const counts = new Map<number, number>();
          for (const r of hitRounds) {
            if (r.block && r.block >= 1 && r.block <= 25) {
              counts.set(r.block, (counts.get(r.block) ?? 0) + 1);
            }
          }
          return Array.from({ length: 25 }, (_, i) => ({
            block: i + 1,
            wins: counts.get(i + 1) ?? 0,
          }));
        })()
      : undefined;

    // 4. Winner types: count hits vs non-hits within the last 1,044 rounds (per PRD spec)
    let hitCount: number | null = null;
    let totalCount: number | null = null;
    let hitCountErr: any = null;
    let totalErr: any = null;

    // First, get the maximum round_id to calculate the cutoff
    const { data: maxRoundResult, error: maxRoundErr } = await supabaseAdmin
      .from('rounds')
      .select('round_id')
      .order('round_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxRoundErr || !maxRoundResult) {
      console.error('Failed to fetch max round_id:', maxRoundErr);
      // Fallback to using all rounds if we can't get max
      const hitCountResult = await supabaseAdmin
        .from('rounds')
        .select('*', { count: 'exact', head: true })
        .eq('motherlode_hit', true);
      hitCount = hitCountResult.count;
      hitCountErr = hitCountResult.error;

      const totalCountResult = await supabaseAdmin
        .from('rounds')
        .select('*', { count: 'exact', head: true });
      totalCount = totalCountResult.count;
      totalErr = totalCountResult.error;
    } else {
      const maxRoundId = maxRoundResult.round_id;
      const cutoffRoundId = maxRoundId - 1043; // Include last 1044 rounds (inclusive)

      // Count hits in the last 1044 rounds
      const hitCountResult = await supabaseAdmin
        .from('rounds')
        .select('*', { count: 'exact', head: true })
        .eq('motherlode_hit', true)
        .gte('round_id', cutoffRoundId);
      hitCount = hitCountResult.count;
      hitCountErr = hitCountResult.error;

      // Count total rounds in the last 1044 rounds
      const totalCountResult = await supabaseAdmin
        .from('rounds')
        .select('*', { count: 'exact', head: true })
        .gte('round_id', cutoffRoundId);
      totalCount = totalCountResult.count;
      totalErr = totalCountResult.error;
    }

    let winnerTypes;
    if (!hitCountErr && !totalErr && totalCount !== null) {
      const splitCount = totalCount - (hitCount ?? 0);
      winnerTypes = {
        winnerTakeAll: hitCount ?? 0,
        split: splitCount >= 0 ? splitCount : 0,
      };
    }

    // 5. Motherlode: we need totalValue (current running value), totalORELocked, participants.
    // These might come from protocol_stats table. If not present, derive from latest round and rounds table.
    let motherlode = { totalValue: 0, totalORELocked: 0, participants: 0, history: [] as MotherlodeHistoryPoint[] };

    // Try protocol_stats first
    const { data: protoStats, error: protoErr } = await supabaseAdmin
      .from('protocol_stats')
      .select('total_value, total_ore_locked, participants')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (protoStats) {
      motherlode = {
        totalValue: Number(protoStats.total_value) || 0,
        totalORELocked: Number(protoStats.total_ore_locked) || 0,
        participants: Number(protoStats.participants) || 0,
        history: [],
      };
    } else {
      // Fallback: compute totalORELocked as sum of motherlode values from all rounds? Not accurate.
      // But we have totalORELocked perhaps from rounds aggregate: sum of prize? Actually ORE locked is total supply staked. Not stored per round.
      // We'll set to 0 if not available. But the frontend expects something.
      motherlode = {
        totalValue: 0,
        totalORELocked: 0,
        participants: 0,
        history: [],
      };
    }

    // 6. Motherlode history: Use motherlode_running values from rounds, ordered by round_id.
    // All historical data should be available (zoom handles viewport).
    const { data: historyRounds, error: histErr } = await supabaseAdmin
      .from('rounds')
      .select('round_id, motherlode_running')
      .order('round_id', { ascending: true });

    let history: MotherlodeHistoryPoint[] = [];
    if (historyRounds) {
      history = historyRounds.map((r: { round_id: number; motherlode_running: number | null }) => ({
        label: `R${r.round_id}`,
        value: Number(r.motherlode_running) || 0,
        timestamp: undefined,
      }));
    }

    motherlode.history = history;

    // 7. Build response
    return {
      wethPrice: Number(latestPrices.weth_price),
      rorePrice: Number(latestPrices.rore_price),
      blockPerformance,
      winnerTypes,
      motherlode,
      currentRound: {
        number: currentRoundData.round_id,
        status: currentRoundData.status,
        prize: Number(currentRoundData.prize),
        entries: Number(currentRoundData.entries),
        endTime: Number(new Date(currentRoundData.end_time).getTime()),
      },
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch DB stats:', error);
    return null;
  }
}
