import assert from 'node:assert/strict';
import test from 'node:test';

import { formatTimeAgo, formatTimestamp } from './time';

test('formats elapsed seconds', () => {
  assert.equal(formatTimeAgo(1_000, 31_000), '30 seconds ago');
  assert.equal(formatTimeAgo(1_000, 2_000), '1 second ago');
});

test('formats elapsed minutes', () => {
  assert.equal(formatTimeAgo(1_000, 121_000), '2 minutes ago');
  assert.equal(formatTimeAgo(1_000, 61_000), '1 minute ago');
});

test('formats elapsed hours', () => {
  assert.equal(formatTimeAgo(1_000, 7_201_000), '2 hours ago');
  assert.equal(formatTimeAgo(1_000, 3_601_000), '1 hour ago');
});

test('clamps future timestamps to zero seconds ago', () => {
  assert.equal(formatTimeAgo(10_000, 9_000), '0 seconds ago');
});

test('formats timestamps in UTC', () => {
  assert.equal(formatTimestamp(Date.parse('2026-03-09T12:34:56.000Z')), 'Mar 9, 2026, 12:34:56 PM UTC');
});
