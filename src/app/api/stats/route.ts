/* v2.0.0 */ import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { getDbStatsData } from '../../lib/db-stats';

export async function GET() {
  const stats = await getDbStatsData();

  if (!stats) {
    return withCors(NextResponse.json(
      { error: 'Failed to load stats from database' },
      { status: 500 }
    ));
  }

  return withCors(NextResponse.json(stats));
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
