/* v2.0.0 */ import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { getStatsData } from '../../lib/stats';

export async function GET() {
  const stats = await getStatsData();

  if (!stats) {
    return withCors(NextResponse.json(
      { error: 'Failed to aggregate stats from rORE API' },
      { status: 500 }
    ));
  }

  return withCors(NextResponse.json(stats));
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
