import assert from 'node:assert/strict';
import test from 'node:test';

import handler from './explore';

const originalFetch = global.fetch;
const originalConsoleError = console.error;

function mockFetch(implementation: typeof fetch) {
  global.fetch = implementation;
}

function createResponseRecorder() {
  return {
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    statusCode: 200,
    json(body: unknown) {
      this.body = body;
      return body;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
  };
}

test.afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;
});

test('returns the upstream explore payload through the Vercel API handler', async () => {
  const payload = { items: [{ id: '1' }], page: 2 };
  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;

  mockFetch(async (input, init) => {
    requestedUrl = input.toString();
    requestedInit = init;

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  });

  const response = createResponseRecorder();

  await handler({ method: 'GET', query: { page: '2', limit: '25', sort: 'desc' } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, payload);
  assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(response.headers['Access-Control-Allow-Methods'], 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers['Access-Control-Allow-Headers'], 'Content-Type');
  assert.equal(response.headers['Content-Type'], 'application/json');
  assert.equal(requestedUrl, 'https://api.rore.supply/api/explore?page=2&limit=25&sort=desc');
  assert.deepEqual(requestedInit, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });
});

test('preserves repeated query params for paginated explore requests', async () => {
  let requestedUrl = '';

  mockFetch(async (input) => {
    requestedUrl = input.toString();
    return new Response(JSON.stringify({ items: [] }), { status: 200 });
  });

  const response = createResponseRecorder();

  await handler(
    { method: 'GET', query: { page: '3', filter: ['active', 'ended'] } },
    response
  );

  assert.equal(response.statusCode, 200);
  assert.equal(
    requestedUrl,
    'https://api.rore.supply/api/explore?page=3&filter=active&filter=ended'
  );
});

test('returns 405 for unsupported methods without calling the upstream API', async () => {
  let fetchCalled = false;

  mockFetch(async () => {
    fetchCalled = true;
    return new Response();
  });

  const response = createResponseRecorder();

  await handler({ method: 'POST' }, response);

  assert.equal(fetchCalled, false);
  assert.equal(response.statusCode, 405);
  assert.deepEqual(response.body, { error: 'Method not allowed' });
  assert.equal(response.headers.Allow, 'GET');
  assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
});

test('returns a 500 response when the upstream API fails', async () => {
  console.error = () => {};

  mockFetch(async () => new Response(null, { status: 503 }));

  const response = createResponseRecorder();

  await handler({ method: 'GET', query: { page: '1' } }, response);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { error: 'Failed to fetch explore data' });
  assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(response.headers['Content-Type'], 'application/json');
});

test('returns CORS headers for preflight requests', async () => {
  let fetchCalled = false;

  mockFetch(async () => {
    fetchCalled = true;
    return new Response();
  });

  const response = createResponseRecorder();

  await handler({ method: 'OPTIONS' }, response);

  assert.equal(fetchCalled, false);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {});
  assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(response.headers['Access-Control-Allow-Methods'], 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers['Access-Control-Allow-Headers'], 'Content-Type');
});
