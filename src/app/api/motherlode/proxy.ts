import { parseMotherlodeData } from '../../lib/motherlode';
import { logError } from '../../lib/log';

export const MOTHERLODE_API_URL = 'https://api.rore.supply/api/motherlode';
export const ROUND_API_URL = 'https://api.rore.supply/api/rounds/current';
export const MOTHERLODE_ERROR_RESPONSE = { error: 'Failed to fetch motherlode data' };
export const MOTHERLODE_REQUEST_INIT: RequestInit = {
  cache: 'no-store',
  headers: {
    Accept: 'application/json',
  },
};

interface ProxyResponse {
  body: unknown;
  status: number;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, MOTHERLODE_REQUEST_INIT);

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function getMotherlodeProxyResponse(): Promise<ProxyResponse> {
  try {
    const data = await fetchJson(MOTHERLODE_API_URL);

    try {
      return { body: parseMotherlodeData(data), status: 200 };
    } catch (error) {
      if (!(error instanceof Error) || error.message !== 'Invalid motherlode totalValue') {
        throw error;
      }

      const currentRoundData = await fetchJson(ROUND_API_URL);
      return { body: parseMotherlodeData(data, currentRoundData), status: 200 };
    }
  } catch (error) {
    logError('Failed to fetch motherlode data', error, {
      route: '/api/motherlode',
      upstreamUrl: MOTHERLODE_API_URL,
    });
    return { body: MOTHERLODE_ERROR_RESPONSE, status: 500 };
  }
}
