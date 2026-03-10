import { NextResponse } from 'next/server';
import { withCors } from '../../lib/cors';

const ROUND_API_URL = 'https://api.rore.supply/api/rounds/current';
const ERROR_RESPONSE = { error: 'Failed to fetch current round data' };

export async function GET() {
  try {
    const res = await fetch(ROUND_API_URL, {
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
    console.error('Error fetching current round:', error);
    return withCors(NextResponse.json(ERROR_RESPONSE, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(NextResponse.json({}));
}
