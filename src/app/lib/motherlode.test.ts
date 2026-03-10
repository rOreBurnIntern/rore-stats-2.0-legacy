import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMotherlodeData } from './motherlode';

test('parses motherlode totalValue from wei', () => {
  assert.deepEqual(
    parseMotherlodeData({
      totalValue: '1234500000000000000',
      totalORELocked: 43210,
      participants: 246,
    }),
    {
      totalValue: 1.2345,
      totalORELocked: 43210,
      participants: 246,
    }
  );
});

test('accepts an already-normalized motherlode totalValue', () => {
  assert.deepEqual(
    parseMotherlodeData({
      totalValue: 12.5,
      totalORELocked: 43210,
      participants: 246,
    }),
    {
      totalValue: 12.5,
      totalORELocked: 43210,
      participants: 246,
    }
  );
});

test('calculates motherlode totalValue from rounds since hit', () => {
  assert.deepEqual(
    parseMotherlodeData({
      roundsSinceHit: 3,
      totalORELocked: 43210,
      participants: 246,
    }),
    {
      totalValue: 0.6,
      totalORELocked: 43210,
      participants: 246,
    }
  );
});

test('calculates motherlode totalValue from the current round and last hit round', () => {
  assert.deepEqual(
    parseMotherlodeData(
      {
        lastHitRound: 12,
        totalORELocked: 43210,
        participants: 246,
      },
      {
        round: 15,
      }
    ),
    {
      totalValue: 0.6,
      totalORELocked: 43210,
      participants: 246,
    }
  );
});

test('resets the motherlode totalValue to zero after a hit', () => {
  assert.deepEqual(
    parseMotherlodeData(
      {
        totalORELocked: 43210,
        participants: 246,
      },
      {
        round: 15,
        motherlodeHit: true,
      }
    ),
    {
      totalValue: 0,
      totalORELocked: 43210,
      participants: 246,
    }
  );
});
