export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

type HeaderTarget = Headers | { setHeader(name: string, value: string): void };

export function setCorsHeaders(target: HeaderTarget) {
  for (const [name, value] of Object.entries(CORS_HEADERS)) {
    if ('set' in target) {
      target.set(name, value);
      continue;
    }

    target.setHeader(name, value);
  }
}

export function withCors<T extends Response>(response: T) {
  setCorsHeaders(response.headers);
  return response;
}
