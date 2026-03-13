import assert from 'node:assert/strict';
import test from 'node:test';

import { GET, OPTIONS } from './route';

const originalFetch = global.fetch;
const originalConsoleError = console.error;
const originalDateNow = Date.now;

function mockFetch(implementation: typeof fetch) {
  global.fetch = implementation;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

test.afterEach(() => {
  global.fetch = originalFetch;
  console.error = originalConsoleError;
  Date.now = originalDateNow;
});

test('returns aggregated stats with CORS headers', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async (input) => {
    requestCount += 1;

    if (requestCount === 1) {
      assert.equal(input.toString(), 'https://api.rore.supply/api/prices');
      return jsonResponse({ weth: 1234.56, rore: 0.8 });
    }

    assert.equal(input.toString(), 'https://api.rore.supply/api/explore');
    return jsonResponse({
      protocolStats: {
        motherlode: '1234500000000000000',
        totalValue: 456.7,
        participants: 42,
      },
      roundsData: [
        {
          roundId: 7,
          status: 'active',
          prize: 999,
          entries: 77,
          endTime: 1_741_526_200_000,
        },
      ],
    });
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    wethPrice: 1234.56,
    rorePrice: 0.8,
    motherlode: {
      totalValue: 456.7,
      totalORELocked: 1.2345,
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

test('falls back to aliases from the upstream prices payload', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return jsonResponse({ usd: 1234.56, ore: 0.8 });
    }

    return jsonResponse({
      protocolStats: {
        motherlode: 12,
        totalValue: 456.7,
        participants: 42,
      },
      roundsData: [
        {
          roundId: 7,
          status: 'active',
          prize: 999,
          entries: 77,
          endTime: 1_741_526_200_000,
        },
      ],
    });
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    wethPrice: 1234.56,
    rorePrice: 0.8,
    motherlode: {
      totalValue: 456.7,
      totalORELocked: 12,
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

test('returns valid JSON when explore fields are missing', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return jsonResponse({ weth: 1234.56, rore: 0.8 });
    }

    return jsonResponse({
      protocolStats: {
        blockPerformance: {
          1: 3,
          5: '2',
          25: 1,
        },
        winnerTypes: [
          {
            type: 'Winner Take All',
            count: 9,
          },
          {
            type: 'Split',
            count: 3,
          },
        ],
      },
      roundsData: [
        {
          roundId: 17,
        },
      ],
    });
  });

  const response = await GET();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    wethPrice: 1234.56,
    rorePrice: 0.8,
    blockPerformance: Array.from({ length: 25 }, (_, index) => ({
      block: index + 1,
      wins: index === 0 ? 3 : index === 4 ? 2 : index === 24 ? 1 : 0,
    })),
    winnerTypes: {
      winnerTakeAll: 9,
      split: 3,
    },
    motherlode: {
      totalValue: 0,
      totalORELocked: 0,
      participants: 0,
    },
    currentRound: {
      number: 17,
      status: 'Unknown',
      prize: 0,
      entries: 0,
      endTime: 1_741_525_600_000,
    },
    lastUpdated: 1_741_525_600_000,
  });
});

test('ignores nullable optional explore stats fields instead of returning 500', async () => {
  Date.now = () => 1_741_525_600_000;

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return jsonResponse({ weth: 1234.56, rore: 0.8 });
    }

    return jsonResponse({
      protocolStats: {
        motherlode: null,
        totalValue: null,
        participants: null,
        winnerTypes: [
          {
            type: 'Split',
            count: 3,
          },
        ],
      },
      roundsData: [
        {
          roundId: 17,
          status: 'active',
          prize: null,
          entries: null,
          endTime: null,
        },
      ],
    });
  });

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    wethPrice: 1234.56,
    rorePrice: 0.8,
    winnerTypes: {
      winnerTakeAll: 0,
      split: 3,
    },
    motherlode: {
      totalValue: 0,
      totalORELocked: 0,
      participants: 0,
    },
    currentRound: {
      number: 17,
      status: 'active',
      prize: 0,
      entries: 0,
      endTime: 1_741_525_600_000,
    },
    lastUpdated: 1_741_525_600_000,
  });
});

test('returns a 500 response when optional explore stats fields are malformed', async () => {
  let loggedMessage = '';
  let loggedPayload: Record<string, unknown> | undefined;
  console.error = (message: unknown, payload: unknown) => {
    loggedMessage = String(message);
    loggedPayload = payload as Record<string, unknown>;
  };

  let requestCount = 0;
  mockFetch(async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return jsonResponse({ weth: 1234.56, rore: 0.8 });
    }

    return jsonResponse({
      protocolStats: {
        participants: 'not-a-number',
      },
      roundsData: [
        {
          roundId: 17,
        },
      ],
    });
  });

  const response = await GET();

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Failed to aggregate stats from rORE API' });
  assert.equal(loggedMessage, 'Failed to fetch stats');
  assert.equal(
    (loggedPayload?.error as Record<string, unknown>).message,
    'Invalid numeric field: participants'
  );
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
  assert.equal(loggedMessage, 'Failed to fetch stats');
  assert.equal(loggedPayload?.route, '/api/stats');
  assert.equal(
    (loggedPayload?.error as Record<string, unknown>).message,
    'Prices failed: 503'
  );
});

test('returns CORS headers for preflight requests', () => {
  const response = OPTIONS();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'GET, POST, PUT, DELETE, OPTIONS');
  assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
});
