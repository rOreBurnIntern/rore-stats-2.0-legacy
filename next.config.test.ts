import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from './next.config.js';

test('does not rely on Next.js 16-only experimental webpack settings', () => {
  assert.equal('experimental' in nextConfig, false);
});
