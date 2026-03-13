import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const themesPath = path.join(repoRoot, 'public/vendor/daisyui/themes.css');
const styledPath = path.join(repoRoot, 'public/vendor/daisyui/styled.css');
const readmePath = path.join(repoRoot, 'README.md');

const originalVendoredBytes = 229842;
const maxVendoredBytes = Math.floor(originalVendoredBytes * 0.7);

test('keeps only the documented DaisyUI theme and component subset', () => {
  const themesSource = readFileSync(themesPath, 'utf8');
  const styledSource = readFileSync(styledPath, 'utf8');

  assert.match(themesSource, /\[data-theme="coffee"\]/);
  assert.match(styledSource, /\.bg-base-200\b/);
  assert.match(styledSource, /\.text-base-content\b/);
  assert.match(styledSource, /\.alert\b/);
  assert.match(styledSource, /\.card\b/);
  assert.match(styledSource, /\.navbar\b/);

  assert.doesNotMatch(themesSource, /\[data-theme="light"\]/);
  assert.doesNotMatch(themesSource, /\[data-theme="dark"\]/);
  assert.doesNotMatch(styledSource, /\.btn\b/);
  assert.doesNotMatch(styledSource, /\.modal\b/);
  assert.doesNotMatch(styledSource, /\.drawer\b/);
  assert.doesNotMatch(styledSource, /\.dropdown\b/);
  assert.doesNotMatch(styledSource, /\.tabs\b/);
});

test('shrinks the vendored DaisyUI payload by at least 30 percent', () => {
  const currentVendoredBytes = statSync(themesPath).size + statSync(styledPath).size;

  assert.ok(
    currentVendoredBytes <= maxVendoredBytes,
    `Expected vendored DaisyUI CSS to be <= ${maxVendoredBytes} bytes, received ${currentVendoredBytes} bytes`
  );
});

test('documents the retained DaisyUI subset in the README', () => {
  const readmeSource = readFileSync(readmePath, 'utf8');

  assert.match(readmeSource, /Vendored DaisyUI Subset/);
  assert.match(readmeSource, /Theme:\s*`coffee` only/);
  assert.match(readmeSource, /Components:\s*`alert`, `card`, and `navbar`/);
  assert.match(readmeSource, /Utilities:\s*`bg-base-200` and `text-base-content`/);
});
