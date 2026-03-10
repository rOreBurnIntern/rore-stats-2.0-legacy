import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { logError } from '../../lib/log';

const MOTHERLODE_API_URL = 'https://api.rore.supply/api/motherlode';
const ERROR_RESPONSE = { error: 'Failed to fetch motherlode data' };

export async function GET() {
  try {
    const res = await fetch(MOTHERLODE_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return withCors(NextResponse.json(data));
  } catch (error) {
    logError('Failed to fetch motherlode data', error, {
      route: '/api/motherlode',
      upstreamUrl: MOTHERLODE_API_URL,
    });
    return withCors(NextResponse.json(ERROR_RESPONSE, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
