import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { supabaseAdmin } from '../../lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('prices')
      .select('weth_price, rore_price, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return withCors(NextResponse.json({ error: 'No price data available' }, { status: 404 }));
    }

    return withCors(NextResponse.json({
      weth: Number(data.weth_price),
      ore: Number(data.rore_price),
      lastUpdate: new Date(data.created_at).getTime(),
    }));
  } catch (e) {
    return withCors(NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
