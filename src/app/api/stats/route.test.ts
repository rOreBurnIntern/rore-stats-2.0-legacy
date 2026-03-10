import assert from 'node:assert/strict';
import test from 'node:test';

import { GET, OPTIONS } from './route';

const originalFetch = global.fetch;
const originalConsoleError = console.error;
const originalDateNow = Date.now;

function mockFetch(implementation: typeof fetch) {
  global.fetch = implementation;
}

test.afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;
  Date.now = originalDateNow;
});

test('returns aggregated stats with CORS headers', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async (input, init) => {
    requestCount += 1;

    if (requestCount === 1) {
      assert.equal(input.toString(), 'https://api.rore.supply/api/prices');
      assert.deepEqual(init, {
        headers: {
          Accept: 'application/json',
        },
        next: { revalidate: 30 },
      });

      return new Response(JSON.stringify({ weth: 1234.56, rore: 0.8 }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    }

    if (requestCount === 2) {
      assert.equal(input.toString(), 'https://api.rore.supply/api/motherlode');
      return new Response(
        JSON.stringify({
          totalValue: '1234500000000000000',
          totalORELocked: 8910,
          participants: 42,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    assert.equal(input.toString(), 'https://api.rore.supply/api/rounds/current');
    return new Response(
      JSON.stringify({
        round: 7,
        status: 'active',
        prize: 999,
        entries: 77,
        endTime: 1_741_526_200_000,
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
    wethPrice: 1234.56,
    rorePrice: 0.8,
    motherlode: {
      totalValue: 1.2345,
      totalORELocked: 8910,
      participants: 42,
    },
    currentRound: {
      number: 7,
      status: 'active',
      prize: 999,
      entries: 77,
      endTime: 1_741_526_200_000,
    },
    lastUpdated: 1_741_525_600_000,
  });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
});

test('accepts usd and rore aliases from the upstream prices payload', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ usd: 1234.56, rore: 0.8 }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    }

    if (requestCount === 2) {
      return new Response(
        JSON.stringify({
          totalValue: '1234500000000000000',
          totalORELocked: 8910,
          participants: 42,
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
        round: 7,
        status: 'active',
        prize: 999,
        entries: 77,
        endTime: 1_741_526_200_000,
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
    wethPrice: 1234.56,
    rorePrice: 0.8,
    motherlode: {
      totalValue: 1.2345,
      totalORELocked: 8910,
      participants: 42,
    },
    currentRound: {
      number: 7,
      status: 'active',
      prize: 999,
      entries: 77,
      endTime: 1_741_526_200_000,
    },
    lastUpdated: 1_741_525_600_000,
  });
});

test('falls back to the ore field when the upstream rORE price is unavailable', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ usd: 1234.56, ore: 0.8 }), {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      });
    }

    if (requestCount === 2) {
      return new Response(
        JSON.stringify({
          totalValue: '1234500000000000000',
          totalORELocked: 8910,
          participants: 42,
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
        round: 7,
        status: 'active',
        prize: 999,
        entries: 77,
        endTime: 1_741_526_200_000,
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
    wethPrice: 1234.56,
    rorePrice: 0.8,
    motherlode: {
      totalValue: 1.2345,
      totalORELocked: 8910,
      participants: 42,
    },
    currentRound: {
      number: 7,
      status: 'active',
      prize: 999,
      entries: 77,
      endTime: 1_741_526_200_000,
    },
    lastUpdated: 1_741_525_600_000,
  });
});

test('returns a 500 response when aggregation fails', async () => {
  let loggedMessage = '';
  let loggedPayload: Record<string, unknown> | undefined;
  console.error = (message: unknown, payload: unknown) => {
    loggedMessage = String(message);
    loggedPayload = payload as Record<string, unknown>;
  };

  mockFetch(async () => new Response(null, { status: 503 }));

  const response = await GET();

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to aggregate stats from rORE API' });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(loggedMessage, 'Failed to aggregate stats from rORE API');
  assert.equal(loggedPayload?.route, '/api/stats');
  assert.deepEqual(loggedPayload?.upstreamUrls, [
    'https://api.rore.supply/api/prices',
    'https://api.rore.supply/api/motherlode',
    'https://api.rore.supply/api/rounds/current',
  ]);
  assert.equal(
    (loggedPayload?.error as Record<string, unknown>).message,
    'Request failed for https://api.rore.supply/api/prices: 503'
  );
});

test('returns a 500 response when the motherlode payload is invalid', async () => {
  console.error = () => {};

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ weth: 1234.56, rore: 0.8 }), { status: 200 });
    }

    if (requestCount === 2) {
      return new Response(JSON.stringify({ totalValue: 4567, totalORELocked: 8910 }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        round: 7,
        status: 'active',
        prize: 999,
        entries: 77,
        endTime: 1_741_526_200_000,
      }),
      { status: 200 }
    );
  });

  const response = await GET();

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to aggregate stats from rORE API' });
});

test('calculates the motherlode totalValue from the current round when the upstream payload omits it', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ weth: 1234.56, rore: 0.8 }), { status: 200 });
    }

    if (requestCount === 2) {
      return new Response(
        JSON.stringify({
          lastHitRound: 12,
          totalORELocked: 8910,
          participants: 42,
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        round: 15,
        status: 'active',
        prize: 999,
        entries: 77,
        endTime: 1_741_526_200_000,
      }),
      { status: 200 }
    );
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    wethPrice: 1234.56,
    rorePrice: 0.8,
    motherlode: {
      totalValue: 0.6,
      totalORELocked: 8910,
      participants: 42,
    },
    currentRound: {
      number: 15,
      status: 'active',
      prize: 999,
      entries: 77,
      endTime: 1_741_526_200_000,
    },
    lastUpdated: 1_741_525_600_000,
  });
});

test('returns a 500 response when the round payload is invalid', async () => {
  console.error = () => {};

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ weth: 1234.56, rore: 0.8 }), { status: 200 });
    }

    if (requestCount === 2) {
      return new Response(
        JSON.stringify({
          totalValue: '1234500000000000000',
          totalORELocked: 8910,
          participants: 42,
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        round: 'not-a-number',
        status: 'active',
        prize: 999,
        entries: 77,
        endTime: 1_741_526_200_000,
      }),
      { status: 200 }
    );
  });

  const response = await GET();

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to aggregate stats from rORE API' });
});

test('returns CORS headers for preflight requests', async () => {
  const response = OPTIONS();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
});
