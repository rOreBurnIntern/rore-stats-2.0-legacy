import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import Loading from './loading';
import Home from './page';
import InteractiveBarChart from './components/InteractiveBarChart';
import MotherlodeCard from './components/MotherlodeCard';
import ProtocolStatCards from './components/ProtocolStatCards';
import StatCard from './components/StatCard';
import WinnerTypePieChart from './components/WinnerTypePieChart';

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
          rore: 0.688758947368421,
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
        protocolStats: {
          motherlode: 43210,
          totalValue: 1.2345,
          participants: 246,
          blockPerformance: {
            1: 2,
            3: 1,
            25: 4,
          },
          winnerTypes: {
            winnerTakeAll: 9,
            split: 3,
          },
        },
        roundsData: [
          {
            roundId: 12,
            status: 'active',
            prize: 777,
            entries: 88,
            endTime,
          },
        ],
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
    'https://api.rore.supply/api/explore',
  ]);
  assert.match(markup, /rORE Stats Dashboard/);
  assert.match(markup, /Motherlode/);
  assert.match(markup, /\$3210\.45/);
  assert.match(markup, /\$0\.688759/);
  assert.match(markup, /1\.2345<\/p><span[^>]*>rORE<\/span>/);
  assert.match(markup, /43,210 ORE locked across 246 participants/);
  assert.match(markup, /Current upstream WETH spot price in USD\./);
  assert.match(markup, /Current upstream rORE spot price in USD\./);
  assert.match(markup, /43,210<\/p><span[^>]*>ORE<\/span>/);
  assert.match(markup, /246/);
  assert.match(markup, /Current Round #12/);
  assert.match(markup, /777<\/p><span[^>]*>rORE<\/span>/);
  assert.match(markup, /88<\/p><span[^>]*>Users<\/span>/);
  assert.match(markup, /Market Snapshot/);
  assert.match(markup, /Protocol Snapshot/);
  assert.match(markup, /Block Performance/);
  assert.match(markup, /Winner Types/);
  assert.match(markup, /Winner Take All/);
  assert.match(markup, /Split/);
  assert.match(markup, /12 total rounds/);
  assert.match(markup, /Burncoin signal board/);
  assert.match(markup, /Burncoin spread/);
  assert.match(markup, /Burncoin outcomes/);
  assert.match(markup, /Burncoin reserves/);
  assert.match(markup, /Motherlode Over Time/);
  assert.match(markup, /Recent total value history in rORE\./);
  assert.match(markup, /Motherlode history is not available from the upstream payload yet\./);
  assert.match(markup, /Burncoin countdown/);
  assert.match(markup, /Hover or focus a bar for exact values\./);
  assert.match(markup, /dashboard-chip/);
  assert.match(markup, /aria-label="Winner type pie chart for Winner Take All and Split rounds"/);
  assert.match(markup, /aria-label="Market snapshot bar chart for WETH\/USD and rORE prices"/);
  assert.match(markup, /aria-label="Protocol snapshot bar chart for Motherlode and round metrics"/);
  assert.match(markup, /aria-label="Block performance bar chart for wins per block 1 through 25"/);
  assert.match(markup, /aria-label="Amount: 1\.2345 rORE\. Total rORE currently locked in Motherlode\."/);
  assert.match(markup, /aria-label="1: 2 wins\. Completed wins ending on block 1\."/);
  assert.match(markup, /Scroll to view all 25 blocks\./);
  assert.match(markup, /Last updated <time id="last-update" dateTime="2026-03-09T12:34:56\.000Z"[^>]*>Mar 9, 2026, 12:34:56 PM UTC<\/time> <span[^>]*>\(0 seconds ago\)<\/span>/);
  assert.doesNotMatch(markup, /24h Volume/);
  assert.doesNotMatch(markup, /Transactions/);
});

test('renders fallback UI when the stats request fails', async () => {
  global.fetch = async () => new Response(null, { status: 500 });

  const markup = renderToStaticMarkup(await Home());

  assert.match(markup, /role="alert"/);
  assert.match(markup, /Stats unavailable/);
  assert.match(markup, /We could not load the latest stats right now\. Please try again in a few minutes\./);
  assert.match(markup, /id="last-update"[^>]*>N\/A<\/span>/);
  assert.doesNotMatch(markup, /Current Round #/);
});

test('renders mobile overflow safeguards in the page shell', async () => {
  global.fetch = async () => new Response(null, { status: 500 });

  const markup = renderToStaticMarkup(await Home());

  assert.match(markup, /class="[^"]*flex[^"]*flex-col[^"]*gap-8[^"]*"/);
  assert.match(markup, /class="[^"]*dashboard-panel[^"]*navbar[^"]*"/);
  assert.match(markup, /class="[^"]*dashboard-alert[^"]*alert[^"]*"/);
});

test('renders responsive layouts for dashboard features on mobile and desktop', async () => {
  const lastUpdated = Date.parse('2026-03-09T12:34:56.000Z');
  const endTime = lastUpdated + 10 * 60 * 1000;
  Date.now = () => lastUpdated;

  global.fetch = async (input) => {
    if (input.toString() === 'https://api.rore.supply/api/prices') {
      return new Response(
        JSON.stringify({
          weth: 3210.45,
          rore: 0.688758947368421,
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
        protocolStats: {
          motherlode: 43210,
          totalValue: 1.2345,
          participants: 246,
          blockPerformance: {
            1: 2,
            3: 1,
            25: 4,
          },
          winnerTypes: {
            winnerTakeAll: 9,
            split: 3,
          },
        },
        roundsData: [
          {
            roundId: 12,
            status: 'active',
            prize: 777,
            entries: 88,
            endTime,
          },
        ],
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

  assert.match(
    markup,
    /class="[^"]*dashboard-panel[^"]*navbar[^"]*flex[^"]*flex-col[^"]*sm:flex-row[^"]*sm:items-center[^"]*sm:justify-between[^"]*"/
  );
  assert.match(markup, /class="[^"]*grid[^"]*grid-cols-1[^"]*gap-6[^"]*md:grid-cols-3[^"]*"/);
  assert.match(markup, /class="[^"]*grid[^"]*grid-cols-1[^"]*gap-6[^"]*xl:grid-cols-2[^"]*"/);
  assert.match(markup, /class="[^"]*grid[^"]*grid-cols-1[^"]*gap-4[^"]*sm:grid-cols-3[^"]*"/);
  assert.match(markup, /class="[^"]*grid[^"]*grid-cols-1[^"]*gap-4[^"]*sm:grid-cols-4[^"]*"/);
  assert.match(markup, /class="interactive-chart"/);
  assert.match(
    markup,
    /style="grid-template-columns:repeat\(25,\s*minmax\(2\.5rem,\s*1fr\)\);min-width:calc\(25 \* 2\.5rem\)"/
  );
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

  assert.match(markup, /class="[^"]*card[^"]*w-full[^"]*min-w-0[^"]*"/);
  assert.match(markup, /class="[^"]*flex[^"]*flex-wrap[^"]*gap-x-2[^"]*gap-y-1[^"]*"/);
  assert.match(markup, /class="[^"]*break-words[^"]*text-2xl[^"]*"/);
  assert.match(markup, /dashboard-ember/);
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
  assert.match(markup, /dashboard-chart-note/);
  assert.match(markup, /Hover or focus a bar for exact values\./);
});

test('renders winner type pie chart legend and totals', () => {
  const markup = renderToStaticMarkup(<WinnerTypePieChart winnerTakeAll={9} split={3} />);

  assert.match(markup, /Winner type pie chart for Winner Take All and Split rounds/);
  assert.match(markup, /Winner Types/);
  assert.match(markup, /12 total rounds/);
  assert.match(markup, /9 rounds \/ 75%/);
  assert.match(markup, /3 rounds \/ 25%/);
  assert.match(markup, /conic-gradient/);
});

test('renders protocol stat cards for Motherlode, WETH, and rORE', () => {
  const markup = renderToStaticMarkup(
    <ProtocolStatCards
      statsData={{
        wethPrice: 3210.45,
        rorePrice: 0.688759,
        motherlode: {
          totalValue: 1.2345,
          totalORELocked: 43210,
          participants: 246,
        },
        currentRound: {
          number: 12,
          status: 'active',
          prize: 777,
          entries: 88,
          endTime: Date.parse('2026-03-09T12:44:56.000Z'),
        },
        lastUpdated: Date.parse('2026-03-09T12:34:56.000Z'),
      }}
    />
  );

  assert.match(markup, /class="[^"]*grid[^"]*md:grid-cols-3[^"]*"/);
  assert.match(markup, /Motherlode/);
  assert.match(markup, /1\.2345<\/p><span[^>]*>rORE<\/span>/);
  assert.match(markup, /43,210 ORE locked across 246 participants/);
  assert.match(markup, />WETH</);
  assert.match(markup, /Current upstream WETH spot price in USD\./);
  assert.match(markup, />rORE</);
  assert.match(markup, /Current upstream rORE spot price in USD\./);
});

test('renders a motherlode history fallback when upstream history is unavailable', () => {
  const markup = renderToStaticMarkup(
    <MotherlodeCard
      totalValue={1.2345}
      totalORELocked={43210}
      participants={246}
    />
  );

  assert.match(markup, /1\.2345<\/p><span[^>]*>rORE<\/span>/);
  assert.match(markup, /Motherlode history is not available from the upstream payload yet\./);
  assert.doesNotMatch(markup, /Motherlode history time filters/);
});

test('renders loading state while the dashboard is fetching', () => {
  const markup = renderToStaticMarkup(<Loading />);

  assert.match(markup, /aria-busy="true"/);
  assert.match(markup, /Loading dashboard statistics\./);
  assert.match(markup, /Burncoin signal board/);
  assert.match(markup, /rORE Stats Dashboard/);
  assert.match(markup, /Market Snapshot/);
  assert.match(markup, /Protocol Snapshot/);
  assert.match(markup, /Current Round/);
  assert.match(markup, /aria-label="Market Snapshot loading state"/);
  assert.match(markup, /aria-label="Protocol Snapshot loading state"/);
  assert.match(markup, /class="[^"]*dashboard-chip[^"]*"/);
  assert.match(markup, /class="[^"]*interactive-chart__bar[^"]*animate-pulse[^"]*"/);
  assert.ok((markup.match(/animate-pulse/g) || []).length >= 10);
});
