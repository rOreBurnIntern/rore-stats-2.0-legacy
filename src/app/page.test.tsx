import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import Loading from './loading';
import Home from './page';
import InteractiveBarChart from './components/InteractiveBarChart';
import StatCard from './components/StatCard';

const originalFetch = global.fetch;
const originalDateNow = Date.now;

test.afterEach(() => {
  global.fetch = originalFetch;
  Date.now = originalDateNow;
});

test('renders stats from the upstream data sources during prerender', async () => {
  const lastUpdated = Date.parse('2026-03-09T12:34:56.000Z');
  const endTime = lastUpdated + 10 * 60 * 1000;
  const requestedUrls: string[] = [];
  Date.now = () => lastUpdated;

  global.fetch = async (input) => {
    requestedUrls.push(input.toString());

    if (input.toString() === 'https://api.rore.supply/api/prices') {
      return new Response(
        JSON.stringify({
          weth: 3210.45,
          ore: 0.688758947368421,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    if (input.toString() === 'https://api.rore.supply/api/motherlode') {
      return new Response(
        JSON.stringify({
          totalValue: 98765,
          totalORELocked: 43210,
          participants: 246,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        round: 12,
        status: 'active',
        prize: 777,
        entries: 88,
        endTime,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  };

  const markup = renderToStaticMarkup(await Home());

  assert.deepEqual(requestedUrls, [
    'https://api.rore.supply/api/prices',
    'https://api.rore.supply/api/motherlode',
    'https://api.rore.supply/api/rounds/current',
  ]);
  assert.match(markup, /rORE Stats Dashboard/);
  assert.match(markup, /\$3210\.45/);
  assert.match(markup, /\$0\.654321/);
  assert.match(markup, /\$98,765/);
  assert.match(markup, /43,210<\/p><span[^>]*>ORE<\/span>/);
  assert.match(markup, /246/);
  assert.match(markup, /Current Round #12/);
  assert.match(markup, /777<\/p><span[^>]*>rORE<\/span>/);
  assert.match(markup, /88<\/p><span[^>]*>Users<\/span>/);
  assert.match(markup, /Market Snapshot/);
  assert.match(markup, /Protocol Snapshot/);
  assert.match(markup, /Hover or focus a bar for exact values\./);
  assert.match(markup, /aria-label="Market snapshot bar chart for WETH and rORE prices"/);
  assert.match(markup, /aria-label="Protocol snapshot bar chart for Motherlode and round metrics"/);
  assert.match(markup, /Last updated <time id="last-update" dateTime="2026-03-09T12:34:56\.000Z"[^>]*>Mar 9, 2026, 12:34:56 PM UTC<\/time> <span[^>]*>\(0 seconds ago\)<\/span>/);
  assert.match(markup, /Data sourced from rORE Protocol API/);
});

test('renders fallback UI when the stats request fails', async () => {
  global.fetch = async () => new Response(null, { status: 500 });

  const markup = renderToStaticMarkup(await Home());

  assert.match(markup, /role="alert"/);
  assert.match(markup, /We could not load the latest stats right now\. Please try again in a few minutes\./);
  assert.match(markup, /id="last-update"[^>]*>N\/A<\/span>/);
  assert.doesNotMatch(markup, /Current Round #/);
});

test('renders mobile overflow safeguards in the page shell', async () => {
  global.fetch = async () => new Response(null, { status: 500 });

  const markup = renderToStaticMarkup(await Home());

  assert.match(markup, /class="[^"]*app-shell[^"]*min-h-screen[^"]*overflow-x-auto[^"]*"/);
  assert.match(markup, /<main class="[^"]*max-w-7xl[^"]*min-w-0[^"]*"/);
  assert.match(markup, /class="[^"]*dashboard-panel[^"]*"/);
  assert.match(markup, /class="[^"]*dashboard-alert[^"]*"/);
});

test('renders stat card content with wrapping classes for narrow screens', () => {
  const markup = renderToStaticMarkup(
    <StatCard
      title="Long Value"
      value="123456789012345678901234567890"
      valueLabel="rORE"
      change="+99.99%"
    />
  );

  assert.match(markup, /class="[^"]*w-full[^"]*min-w-0[^"]*"/);
  assert.match(markup, /class="[^"]*flex[^"]*flex-wrap[^"]*gap-x-2[^"]*gap-y-1[^"]*"/);
  assert.match(markup, /class="[^"]*break-words[^"]*text-2xl[^"]*"/);
  assert.match(markup, /aria-label="up trend \+99\.99%"/);
  assert.match(markup, /text-green-500/);
  assert.match(markup, /↑/);
});

test('renders negative stat card trends as down indicators', () => {
  const markup = renderToStaticMarkup(
    <StatCard
      title="Drawdown"
      value="12"
      change="-4.20%"
    />
  );

  assert.match(markup, /aria-label="down trend -4\.20%"/);
  assert.match(markup, /text-red-400/);
  assert.match(markup, /↓/);
});

test('renders interactive chart bars with hover detail content', () => {
  const markup = renderToStaticMarkup(
    <InteractiveBarChart
      title="Protocol Snapshot"
      subtitle="Normalized to the largest value in this chart."
      ariaLabel="Protocol snapshot demo chart"
      points={[
        {
          label: 'Value',
          value: 100,
          formattedValue: '$100',
          detail: 'Total WETH locked.',
        },
        {
          label: 'Users',
          value: 25,
          formattedValue: '25 participants',
        },
      ]}
    />
  );

  assert.match(markup, /aria-label="Protocol snapshot demo chart"/);
  assert.match(markup, /aria-label="Value: \$100\. Total WETH locked\."/);
  assert.match(markup, /aria-label="Users: 25 participants"/);
  assert.match(markup, /role="tooltip"/);
  assert.match(markup, /Hover or focus a bar for exact values\./);
});

test('renders loading state while the dashboard is fetching', () => {
  const markup = renderToStaticMarkup(<Loading />);

  assert.match(markup, /class="[^"]*app-shell[^"]*min-h-screen[^"]*overflow-x-auto[^"]*"/);
  assert.match(markup, /class="[^"]*dashboard-muted[^"]*text-lg[^"]*"/);
  assert.match(markup, /Loading\.\.\./);
});
