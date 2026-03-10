import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const layoutSource = readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8');

test('exposes dashboard metadata for the Next.js app shell', () => {
  assert.match(layoutSource, /title:\s*"rORE Stats Dashboard"/);
  assert.match(layoutSource, /description:\s*"Next\.js 14 dashboard initialized with Tailwind CSS and DaisyUI\."/);
});

test('applies the DaisyUI theme to the root layout', () => {
  assert.match(layoutSource, /<html lang="en" data-theme="coffee">/);
  assert.match(layoutSource, /href="\/vendor\/daisyui\/themes\.css"/);
  assert.match(layoutSource, /href="\/vendor\/daisyui\/styled\.css"/);
  assert.match(layoutSource, /<body className="bg-base-200 text-base-content antialiased">/);
  assert.match(layoutSource, /className="app-shell flex min-h-screen flex-col overflow-x-auto bg-base-200 font-sans"/);
  assert.match(layoutSource, /<header className="border-b border-white\/10">/);
  assert.match(layoutSource, /<main className="flex-1">/);
  assert.match(layoutSource, /<footer className="dashboard-footer border-t border-white\/10">/);
  assert.match(layoutSource, /Data sourced from rORE Protocol API/);
});
