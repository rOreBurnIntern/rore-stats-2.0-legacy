import assert from 'node:assert/strict';
import test from 'node:test';

import handler from './motherlode';

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

test('returns the normalized motherlode payload through the Vercel API handler', async () => {
  const requestedUrls: string[] = [];
  const requestedInits: Array<RequestInit | undefined> = [];

  mockFetch(async (input, init) => {
    requestedUrls.push(input.toString());
    requestedInits.push(init);

    return new Response(
      JSON.stringify({
        totalValue: '1234500000000000000',
        totalORELocked: 43210,
        participants: 246,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  });

  const response = createResponseRecorder();

  await handler({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    totalValue: 1.2345,
    totalORELocked: 43210,
    participants: 246,
  });
  assert.equal(response.headers['Access-Control-Allow-Origin'], '*');
  assert.equal(response.headers['Access-Control-Allow-Methods'], 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers['Access-Control-Allow-Headers'], 'Content-Type');
  assert.equal(response.headers['Content-Type'], 'application/json');
  assert.deepEqual(requestedUrls, ['https://api.rore.supply/api/motherlode']);
  assert.deepEqual(requestedInits[0], {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });
});

test('falls back to the current round API when the motherlode totalValue is missing', async () => {
  const requestedUrls: string[] = [];

  mockFetch(async (input) => {
    requestedUrls.push(input.toString());

    if (requestedUrls.length === 1) {
      return new Response(
        JSON.stringify({
          lastHitRound: 12,
          totalORELocked: 43210,
          participants: 246,
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        round: 15,
      }),
      { status: 200 }
    );
  });

  const response = createResponseRecorder();

  await handler({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    totalValue: 0.6,
    totalORELocked: 43210,
    participants: 246,
  });
  assert.deepEqual(requestedUrls, [
    'https://api.rore.supply/api/motherlode',
    'https://api.rore.supply/api/rounds/current',
  ]);
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

  await handler({ method: 'GET' }, response);

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { error: 'Failed to fetch motherlode data' });
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
