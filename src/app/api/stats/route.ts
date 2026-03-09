import { NextResponse } from 'next/server';
import { getStatsData } from '../../lib/stats';

export async function GET() {
  const stats = await getStatsData();

  if (!stats) {
    return NextResponse.json(
      { error: 'Failed to aggregate stats from rORE API' },
      { status: 500 }
    );
  }

  const response = NextResponse.json(stats);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}

export function OPTIONS() {
  const response = NextResponse.json({});
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
