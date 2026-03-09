import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.rore.supply/api/rounds/current', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching current round:', error);
    return NextResponse.json({ error: 'Failed to fetch current round data' }, { status: 500 });
  }
}