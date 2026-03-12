import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { supabaseAdmin } from '../../lib/supabase/admin';

export async function GET() {
  try {
    // Try protocol_stats first
    const { data: proto, error: protoErr } = await supabaseAdmin
      .from('protocol_stats')
      .select('total_value, total_ore_locked, participants')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proto) {
      return withCors(NextResponse.json({
        totalValue: Number(proto.total_value) || 0,
        totalORELocked: Number(proto.total_ore_locked) || 0,
        participants: Number(proto.participants) || 0,
      }));
    }

    // Fallback: compute from rounds
    const { data: rounds, error: roundsErr } = await supabaseAdmin
      .from('rounds')
      .select('prize')
      .limit(1)
      .order('prize', { ascending: false });

    // Not a great fallback; return zeros
    return withCors(NextResponse.json({
      totalValue: 0,
      totalORELocked: 0,
      participants: 0,
    }));
  } catch (e) {
    return withCors(NextResponse.json({ error: 'Failed to fetch motherlode data' }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
