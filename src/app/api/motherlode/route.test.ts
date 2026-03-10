import assert from 'node:assert/strict';
import test from 'node:test';

import { GET, OPTIONS } from './route';

const originalFetch = global.fetch;
const originalConsoleError = console.error;

function mockFetch(implementation: typeof fetch) {
  global.fetch = implementation;
}

test.afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;
});

test('returns the upstream motherlode payload', async () => {
  const payload = {
    totalValue: '1234500000000000000',
    totalORELocked: 43210,
    participants: 246,
  };
  const requestedUrls: string[] = [];
  const requestedInits: Array<RequestInit | undefined> = [];

  mockFetch(async (input, init) => {
    requestedUrls.push(input.toString());
    requestedInits.push(init);

    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    totalValue: 1.2345,
    totalORELocked: 43210,
    participants: 246,
  });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  assert.deepEqual(requestedUrls, ['https://api.rore.supply/api/motherlode']);
  assert.deepEqual(requestedInits[0], {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });
});

test('calculates the motherlode totalValue from round progress when the upstream payload omits it', async () => {
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
        {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        round: 15,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    totalValue: 0.6,
    totalORELocked: 43210,
    participants: 246,
  });
  assert.deepEqual(requestedUrls, [
    'https://api.rore.supply/api/motherlode',
    'https://api.rore.supply/api/rounds/current',
  ]);
});

test('returns a 500 response when the upstream motherlode API fails', async () => {
  console.error = () => {};

  mockFetch(async () => new Response(null, { status: 503 }));

  const response = await GET();

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to fetch motherlode data' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('returns a 500 response when the motherlode fetch throws', async () => {
  console.error = () => {};

  mockFetch(async () => {
    throw new Error('network down');
  });

  const response = await GET();

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to fetch motherlode data' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
});

test('returns CORS headers for preflight requests', () => {
  const response = OPTIONS();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
});
