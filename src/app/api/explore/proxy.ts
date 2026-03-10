import { logError } from '../../lib/log';

export const EXPLORE_API_URL = 'https://api.rore.supply/api/explore';
export const EXPLORE_ERROR_RESPONSE = { error: 'Failed to fetch explore data' };
export const EXPLORE_REQUEST_INIT: RequestInit = {
  cache: 'no-store',
  headers: {
    Accept: 'application/json',
  },
};

type SearchParamsValue = string | readonly string[] | undefined;
type SearchParamsInput = URLSearchParams | Record<string, SearchParamsValue> | undefined;

interface ProxyResponse {
  body: unknown;
  status: number;
}

function appendSearchParams(target: URLSearchParams, source: SearchParamsInput) {
  if (!source) {
    return;
  }

  if (source instanceof URLSearchParams) {
    for (const [key, value] of source.entries()) {
      target.append(key, value);
    }

    return;
  }

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      target.append(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        target.append(key, entry);
      }
    }
  }
}

export function buildExploreApiUrl(searchParams?: SearchParamsInput) {
  const upstreamUrl = new URL(EXPLORE_API_URL);
  appendSearchParams(upstreamUrl.searchParams, searchParams);
  return upstreamUrl;
}

export async function getExploreProxyResponse(
  searchParams?: SearchParamsInput
): Promise<ProxyResponse> {
  const upstreamUrl = buildExploreApiUrl(searchParams);

  try {
    const res = await fetch(upstreamUrl, EXPLORE_REQUEST_INIT);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return { body: data, status: 200 };
  } catch (error) {
    logError('Failed to fetch explore data', error, {
      route: '/api/explore',
      upstreamUrl: upstreamUrl.toString(),
    });
    return { body: EXPLORE_ERROR_RESPONSE, status: 500 };
  }
}
