import assert from 'node:assert/strict';
import test from 'node:test';

import { logError } from './log';

const originalConsoleError = console.error;

test.afterEach(() => {
  console.error = originalConsoleError;
});

test('logs structured details for Error instances', () => {
  let loggedMessage = '';
  let loggedPayload: Record<string, unknown> | undefined;

  console.error = (message: unknown, payload: unknown) => {
    loggedMessage = String(message);
    loggedPayload = payload as Record<string, unknown>;
  };

  logError('Failed to fetch prices', new Error('network down'), {
    route: '/api/prices',
    upstreamUrl: 'https://api.rore.supply/api/prices',
  });

  assert.equal(loggedMessage, 'Failed to fetch prices');
  assert.equal(loggedPayload?.route, '/api/prices');
  assert.equal(loggedPayload?.upstreamUrl, 'https://api.rore.supply/api/prices');
  assert.equal(
    (loggedPayload?.error as Record<string, unknown>).message,
    'network down'
  );
  assert.equal((loggedPayload?.error as Record<string, unknown>).name, 'Error');
  assert.equal(typeof (loggedPayload?.error as Record<string, unknown>).stack, 'string');
});

test('logs non-Error throw values without crashing', () => {
  let loggedPayload: Record<string, unknown> | undefined;

  console.error = (_message: unknown, payload: unknown) => {
    loggedPayload = payload as Record<string, unknown>;
  };

  logError('Failed to aggregate stats from rORE API', { reason: 'invalid payload' }, {
    route: '/api/stats',
  });

  assert.deepEqual(loggedPayload, {
    route: '/api/stats',
    error: {
      message: 'Unexpected error value thrown',
      value: { reason: 'invalid payload' },
    },
  });
});
