import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import ProtocolStatCards from './ProtocolStatCards';

test('renders the rORE price as USD with a dollar prefix', () => {
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

  assert.match(markup, />rORE</);
  assert.match(markup, /\$0\.688759/);
  assert.match(markup, /Current upstream rORE spot price in USD\./);
  assert.doesNotMatch(markup, />0\.688759<\/p>/);
});
