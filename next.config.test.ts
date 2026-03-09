import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from './next.config';

test('pins output tracing to this app directory', () => {
  assert.equal(nextConfig.outputFileTracingRoot, process.cwd());
});
