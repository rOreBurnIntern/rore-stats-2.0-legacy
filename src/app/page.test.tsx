import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import Home from './page';

const originalFetch = global.fetch;
const originalDateNow = Date.now;

test.afterEach(() => {
  global.fetch = originalFetch;
  Date.now = originalDateNow;
});

test('renders stats from the upstream data sources during prerender', async () => {
  const lastUpdated = Date.parse('2026-03-09T12:34:56.000Z');
  const endTime = Date.now() + 10 * 60 * 1000;
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
  assert.match(markup, /43,210/);
  assert.match(markup, /246/);
  assert.match(markup, /Current Round #12/);
  assert.match(markup, /777/);
  assert.match(markup, /88/);
  assert.match(markup, new RegExp(`id="last-update">${new Date(lastUpdated).toLocaleTimeString()}<\\/span>`));
});

test('renders fallback UI when the stats request fails', async () => {
  global.fetch = async () => new Response(null, { status: 500 });

  const markup = renderToStaticMarkup(await Home());

  assert.match(markup, /id="last-update">N\/A<\/span>/);
  assert.doesNotMatch(markup, /Current Round #/);
});
