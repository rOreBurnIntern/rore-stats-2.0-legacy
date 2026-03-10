import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';
import { logError } from '../../lib/log';
import { parseMotherlodeData } from '../../lib/motherlode';

const MOTHERLODE_API_URL = 'https://api.rore.supply/api/motherlode';
const ROUND_API_URL = 'https://api.rore.supply/api/rounds/current';
const ERROR_RESPONSE = { error: 'Failed to fetch motherlode data' };
const REQUEST_INIT = {
  cache: 'no-store' as const,
  headers: {
    Accept: 'application/json',
  },
};

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, REQUEST_INIT);

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function GET() {
  try {
    const data = await fetchJson(MOTHERLODE_API_URL);

    try {
      return withCors(NextResponse.json(parseMotherlodeData(data)));
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'Invalid motherlode totalValue') {
        throw error;
      }

      const currentRoundData = await fetchJson(ROUND_API_URL);
      return withCors(NextResponse.json(parseMotherlodeData(data, currentRoundData)));
    }
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
