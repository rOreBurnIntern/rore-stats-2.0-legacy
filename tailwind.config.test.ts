import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const tailwindConfigSource = readFileSync(path.join(process.cwd(), 'tailwind.config.ts'), 'utf8');

test('scans the app directory for Tailwind classes', () => {
  assert.match(tailwindConfigSource, /"\.\/src\/pages\/\*\*\/\*\.\{js,ts,jsx,tsx,mdx\}"/);
  assert.match(tailwindConfigSource, /"\.\/src\/components\/\*\*\/\*\.\{js,ts,jsx,tsx,mdx\}"/);
  assert.match(tailwindConfigSource, /"\.\/src\/app\/\*\*\/\*\.\{js,ts,jsx,tsx,mdx\}"/);
});

test('registers DaisyUI with the custom rore theme', () => {
  assert.match(tailwindConfigSource, /import daisyui from "daisyui"/);
  assert.match(tailwindConfigSource, /plugins:\s*\[daisyui\]/);
  assert.match(tailwindConfigSource, /rore:\s*\{/);
  assert.match(tailwindConfigSource, /primary:\s*"#ff9b45"/);
  assert.match(tailwindConfigSource, /"base-content":\s*"#f5e7d7"/);
});
