import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { supabaseAdmin } from '../../lib/supabase/admin';

export async function GET() {
  try {
    // Get the active round or latest
    let { data, error } = await supabaseAdmin
      .from('rounds')
      .select('round_id, status, prize, entries, end_time')
      .eq('status', 'Active')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback to latest by round_id
      ({ data, error } = await supabaseAdmin
        .from('rounds')
        .select('round_id, status, prize, entries, end_time')
        .order('round_id', { ascending: false })
        .limit(1)
        .maybeSingle());
    }

    if (error || !data) {
      return withCors(NextResponse.json({ error: 'No round data available' }, { status: 404 }));
    }

    return withCors(NextResponse.json({
      roundId: data.round_id,
      status: data.status,
      prize: Number(data.prize),
      entries: Number(data.entries),
      endTime: new Date(data.end_time).getTime(),
    }));
  } catch (e) {
    return withCors(NextResponse.json({ error: 'Failed to fetch round data' }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
