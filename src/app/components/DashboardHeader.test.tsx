import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import DashboardHeader from './DashboardHeader';

test('renders the last updated timestamp when stats are available', () => {
  const lastUpdatedAt = Date.parse('2026-03-09T12:34:56.000Z');
  const markup = renderToStaticMarkup(<DashboardHeader lastUpdatedAt={lastUpdatedAt} />);

  assert.match(markup, /Burncoin signal board/);
  assert.match(markup, /rORE Stats Dashboard/);
  assert.match(markup, /Live protocol analytics and market data/);
  assert.match(markup, /class="[^"]*dashboard-chip[^"]*"/);
  assert.match(markup, /Last updated <time id="last-update" dateTime="2026-03-09T12:34:56\.000Z"[^>]*>Mar 9, 2026, 12:34:56 PM UTC<\/time> <span[^>]*>\(0 seconds ago\)<\/span>/);
});

test('renders an N\\/A last updated state when stats are unavailable', () => {
  const markup = renderToStaticMarkup(<DashboardHeader lastUpdatedAt={null} />);

  assert.match(markup, /Last updated <span id="last-update" class="dashboard-accent">N\/A<\/span>/);
  assert.doesNotMatch(markup, /<time id="last-update"/);
});
