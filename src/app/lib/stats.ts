import { logError } from './log';

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

interface PricesApiResponse {
  weth: number;
  ore: number;
}

interface MotherlodeApiResponse {
  totalValue: number;
  totalORELocked: number;
  participants: number;
}

interface CurrentRoundApiResponse {
  round: number;
  status: string;
  prize: number;
  entries: number;
  endTime: number;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readNumber(source: Record<string, unknown>, key: string): number {
  const value = source[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  throw new Error(`Invalid numeric field: ${key}`);
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];

  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }

  throw new Error(`Invalid string field: ${key}`);
}

function parsePricesData(payload: unknown): PricesApiResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid prices payload');
  }

  return {
    weth: readNumber(payload, 'weth'),
    ore: readNumber(payload, 'ore'),
  };
}

function parseMotherlodeData(payload: unknown): MotherlodeApiResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid motherlode payload');
  }

  return {
    totalValue: readNumber(payload, 'totalValue'),
    totalORELocked: readNumber(payload, 'totalORELocked'),
    participants: readNumber(payload, 'participants'),
  };
}

function parseCurrentRoundData(payload: unknown): CurrentRoundApiResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid round payload');
  }

  return {
    round: readNumber(payload, 'round'),
    status: readString(payload, 'status'),
    prize: readNumber(payload, 'prize'),
    entries: readNumber(payload, 'entries'),
    endTime: readNumber(payload, 'endTime'),
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, REQUEST_INIT);

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.json();
}

export async function getStatsData(): Promise<StatsData | null> {
  try {
    const [pricesPayload, motherlodePayload, currentRoundPayload] = await Promise.all([
      fetchJson(PRICES_API_URL),
      fetchJson(MOTHERLODE_API_URL),
      fetchJson(ROUND_API_URL),
    ]);
    const pricesData = parsePricesData(pricesPayload);
    const motherlodeData = parseMotherlodeData(motherlodePayload);
    const currentRoundData = parseCurrentRoundData(currentRoundPayload);

    return {
      wethPrice: pricesData.weth,
      rorePrice: pricesData.ore * 0.95,
      motherlode: motherlodeData,
      currentRound: {
        number: currentRoundData.round,
        status: currentRoundData.status,
        prize: currentRoundData.prize,
        entries: currentRoundData.entries,
        endTime: currentRoundData.endTime,
      },
      lastUpdated: Date.now(),
    };
  } catch (error) {
    logError('Failed to aggregate stats from rORE API', error, {
      route: '/api/stats',
      upstreamUrls: [PRICES_API_URL, MOTHERLODE_API_URL, ROUND_API_URL],
    });
    return null;
  }
}
