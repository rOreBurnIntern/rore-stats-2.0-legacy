export interface StatsData {
  wethPrice: number;
  rorePrice: number;
  motherlode: {
    totalValue: number;
    totalORELocked: number;
    participants: number;
  };
  currentRound: {
    number: number;
    status: string;
    prize: number;
    entries: number;
    endTime: number;
  };
  lastUpdated: number;
}

const PRICES_API_URL = 'https://api.rore.supply/api/prices';
const MOTHERLODE_API_URL = 'https://api.rore.supply/api/motherlode';
const ROUND_API_URL = 'https://api.rore.supply/api/rounds/current';
const REQUEST_INIT: RequestInit & { next: { revalidate: number } } = {
  headers: {
    Accept: 'application/json',
  },
  next: { revalidate: 30 },
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, REQUEST_INIT);

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.json();
}

export async function getStatsData(): Promise<StatsData | null> {
  try {
    const [pricesData, motherlodeData, roundData] = await Promise.all([
      fetchJson<{ weth: number; ore: number }>(PRICES_API_URL),
      fetchJson<{ totalValue: number; totalORELocked: number; participants: number }>(MOTHERLODE_API_URL),
      fetchJson<{ round: number; status: string; prize: number; entries: number; endTime: number }>(ROUND_API_URL),
    ]);

    return {
      wethPrice: pricesData.weth,
      rorePrice: pricesData.ore * 0.95,
      motherlode: motherlodeData,
      currentRound: {
        number: roundData.round,
        status: roundData.status,
        prize: roundData.prize,
        entries: roundData.entries,
        endTime: roundData.endTime,
      },
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}
