import assert from 'node:assert/strict';
import test from 'node:test';
import packageJson from './package.json';

test('uses webpack for production builds', () => {
  assert.equal(packageJson.scripts.build, 'next build --webpack');
});
