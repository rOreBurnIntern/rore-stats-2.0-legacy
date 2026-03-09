import { NextResponse } from 'next/server';

const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
const ERROR_RESPONSE = { error: 'Failed to fetch explore data' };

export async function GET(request: Request) {
  const upstreamUrl = new URL(EXPLORE_API_URL);
  upstreamUrl.search = new URL(request.url).search;

  try {
    const res = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching explore data:', error);
    return NextResponse.json(ERROR_RESPONSE, { status: 500 });
  }
}
