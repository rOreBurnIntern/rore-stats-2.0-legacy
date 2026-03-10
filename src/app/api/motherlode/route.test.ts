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
  const payload = { totalValue: 98765, totalORELocked: 43210, participants: 246 };
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

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), payload);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  assert.equal(requestedUrl, 'https://api.rore.supply/api/motherlode');
  assert.deepEqual(requestedInit, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });
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
