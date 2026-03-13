import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { logError } from '../../lib/log';

const CURRENT_ROUND_API_URL = 'https://api.rore.supply/api/rounds/current';
const CURRENT_ROUND_ERROR_RESPONSE = { error: 'Failed to fetch current round data' };
const CURRENT_ROUND_REQUEST_INIT: RequestInit = {
  cache: 'no-store',
  headers: {
    Accept: 'application/json',
  },
};

export async function GET() {
  try {
    const response = await fetch(CURRENT_ROUND_API_URL, CURRENT_ROUND_REQUEST_INIT);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return withCors(NextResponse.json(await response.json()));
  } catch (error) {
    logError('Failed to fetch current round data', error, {
      route: '/api/rounds',
      upstreamUrl: CURRENT_ROUND_API_URL,
    });
    return withCors(NextResponse.json(CURRENT_ROUND_ERROR_RESPONSE, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
