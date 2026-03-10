import { logError } from '../../lib/log';

export const PRICES_API_URL = 'https://api.rore.supply/api/prices';
export const PRICES_ERROR_RESPONSE = { error: 'Failed to fetch prices' };
export const PRICES_REQUEST_INIT: RequestInit = {
  cache: 'no-store',
  headers: {
    Accept: 'application/json',
  },
};

interface ProxyResponse {
  body: unknown;
  status: number;
}

export async function getPricesProxyResponse(): Promise<ProxyResponse> {
  try {
    const res = await fetch(PRICES_API_URL, PRICES_REQUEST_INIT);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return { body: data, status: 200 };
  } catch (error) {
    logError('Failed to fetch prices', error, {
      route: '/api/prices',
      upstreamUrl: PRICES_API_URL,
    });
    return { body: PRICES_ERROR_RESPONSE, status: 500 };
  }
}
