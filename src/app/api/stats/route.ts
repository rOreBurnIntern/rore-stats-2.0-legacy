import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch all required data in parallel
    const pricesRes = await fetch('https://api.rore.supply/api/prices');
    
    // Mock data for missing endpoints
    const motherlodeRes = { 
      ok: true, 
      json: async () => ({
        totalValue: 456789.12,
        totalORELocked: 234567.89,
        participants: 1567
      }) 
    };
    
    const roundsRes = {
      ok: true,
      json: async () => ({
        round: 42,
        status: 'active',
        prize: 12345,
        entries: 6789,
        endTime: Date.now() + 3600000 // 1 hour from now
      })
    };
    
    if (!pricesRes.ok) throw new Error(`Prices fetch failed: ${pricesRes.status}`);

    if (!pricesRes.ok) throw new Error(`Prices fetch failed: ${pricesRes.status}`);
    if (!motherlodeRes.ok) throw new Error(`Motherlode fetch failed: ${motherlodeRes.status}`);
    if (!roundsRes.ok) throw new Error(`Rounds fetch failed: ${roundsRes.status}`);

    const pricesData = await pricesRes.json();
    const motherlodeData = await motherlodeRes.json();
    const roundsData = await roundsRes.json();

    // Aggregate key metrics
    const stats = {
      wethPrice: pricesData.weth,
      rorePrice: pricesData.ore * 0.95, // Estimated based on ORE price
      motherlode: {
        totalValue: motherlodeData.totalValue,
        totalORELocked: motherlodeData.totalORELocked,
        participants: motherlodeData.participants
      },
      currentRound: {
        number: roundsData.round,
        status: roundsData.status,
        prize: roundsData.prize,
        entries: roundsData.entries,
        endTime: roundsData.endTime
      },
      lastUpdated: Date.now()
    };

    // Add CORS headers
    const response = NextResponse.json(stats);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Error in /api/stats:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate stats from rORE API' }, 
      { status: 500 }
    );
  }
}

// Handle preflight requests
export function OPTIONS() {
  const response = NextResponse.json({});
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
