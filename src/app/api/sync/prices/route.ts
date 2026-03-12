import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '../../../lib/cors';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { checkCronSecret, logSync } from '../../../lib/sync-helpers';

const PRICES_API_URL = 'https://api.rore.supply/api/prices';

export async function POST(req: NextRequest) {
  const startedAt = new Date();

  // Auth
  if (!checkCronSecret(req)) {
    await logSync(startedAt, 'prices', 'error', 0, 'Unauthorized: invalid cron secret');
    return withCors(NextResponse.json({ status: 'error', error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    // Fetch upstream
    const res = await fetch(PRICES_API_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const errorMsg = `Upstream fetch failed: ${res.status}`;
      await logSync(startedAt, 'prices', 'error', 0, errorMsg);
      return withCors(NextResponse.json({ status: 'error', error: errorMsg }, { status: 502 }));
    }

    const data = await res.json() as { weth: number; ore: number };

    // Insert into Supabase 'prices' table
    const { error: insertError } = await supabaseAdmin
      .from('prices')
      .insert({
        weth_price: data.weth,
        rore_price: data.ore,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    await logSync(startedAt, 'prices', 'success', 1);
    return withCors(NextResponse.json({ status: 'success', records: 1 }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await logSync(startedAt, 'prices', 'error', 0, message);
    return withCors(NextResponse.json({ status: 'error', error: message }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return withCors(NextResponse.json({}));
}

// Also allow GET for easier manual testing (still require secret as query param)
export async function GET(req: NextRequest) {
  return POST(req);
}
