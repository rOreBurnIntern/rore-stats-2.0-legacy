import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const globalsSource = readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');

test('defines the Burncoin dark theme tokens and shell overlays', () => {
  assert.match(globalsSource, /--background:\s*#090402;/);
  assert.match(globalsSource, /--accent:\s*#ff8a2a;/);
  assert.match(globalsSource, /color-scheme:\s*dark;/);
  assert.match(globalsSource, /\.dashboard-burncoin-shell::before/);
  assert.match(globalsSource, /\.dashboard-burncoin-shell::after/);
  assert.match(globalsSource, /\.dashboard-chip/);
  assert.match(globalsSource, /\.dashboard-ember/);
});

test('defines responsive breakpoints for mobile and desktop chart layouts', () => {
  assert.match(globalsSource, /@media \(max-width:\s*640px\)/);
  assert.match(
    globalsSource,
    /@media \(max-width:\s*640px\)\s*{[\s\S]*\.interactive-chart\s*{[\s\S]*min-height:\s*16rem;[\s\S]*}/
  );
  assert.match(
    globalsSource,
    /@media \(max-width:\s*640px\)\s*{[\s\S]*\.interactive-chart__bars\s*{[\s\S]*height:\s*14rem;[\s\S]*}/
  );
  assert.match(globalsSource, /@media \(min-width:\s*960px\)/);
  assert.match(
    globalsSource,
    /@media \(min-width:\s*960px\)\s*{[\s\S]*\.winner-type-chart\s*{[\s\S]*grid-template-columns:\s*minmax\(0,\s*18rem\)\s*minmax\(0,\s*1fr\);[\s\S]*}/
  );
});
