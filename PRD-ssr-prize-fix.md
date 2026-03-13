# PRD: Fix SSR 500 + Prize Parsing

## Background
Production site at https://rore-stats-v2-rebuild.vercel.app returns HTTP 500 on every request.
The RSC flight data renders in the browser anyway, but the 500 is a real server error.

Additionally, the prize field in the Current Round stat card shows "0 rORE" instead of the correct amount.

## Bug 1: SSR HTTP 500

**Root cause:** `src/app/page.tsx` fetches `/api/stats` using a relative URL inside a Next.js Server Component. On Vercel Lambda, this internal fetch hits the same cold-start Lambda and can fail with a tracing/instrumentation error (OpenTelemetry `startActiveSpan` in Next.js internals).

**Fix:** Remove the HTTP fetch entirely. Import `getStatsData` from `../lib/stats` and call it directly in the Server Component. This eliminates the internal HTTP round-trip and the instrumentation error.

```tsx
// BEFORE
const res = await fetch('/api/stats', { next: { revalidate: 0 } });
const statsData = res.ok ? await res.json() : null;

// AFTER
import { getStatsData } from './lib/stats';
// ...
const statsData = await getStatsData().catch(() => null);
```

Keep the `/api/stats` route intact (it's used by external callers and cron jobs).

## Bug 2: Prize shows "0 rORE"

**Root cause:** The rORE explore API returns `prize` as a serialized JSON string:
```json
"prize": "{\"amount\":\"0.00001100\",\"currency\":\"rORE\"}"
```

`readOptionalNumber(round, 'prize')` receives a string, not a number, so it returns null → defaults to 0.

**Fix in `src/app/lib/stats.ts`:** Add a helper to parse the prize field before passing to `readOptionalNumber`:

```ts
function parsePrizeAmount(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    // Try JSON parse first: {"amount":"0.00001100","currency":"rORE"}
    try {
      const parsed = JSON.parse(raw);
      if (isRecord(parsed) && parsed.amount !== undefined) {
        return Number(parsed.amount) || 0;
      }
    } catch {
      // Fall through to direct parse
    }
    return Number(raw) || 0;
  }
  return 0;
}
```

Apply it in `roundsList` map:
```ts
prize: isRecord(round) ? parsePrizeAmount(round.prize) : 0,
```

## Acceptance Criteria
- [ ] All existing tests pass (`npm test`)
- [ ] `npm run build` succeeds
- [ ] Homepage returns HTTP 200 (not 500)
- [ ] Prize field shows correct amount (e.g. 0.000011 rORE), not 0
- [ ] `/api/stats` route still works (returns 200 with correct data)
- [ ] Changes committed to branch `fix/ssr-500-prize-display`
- [ ] Branch pushed to origin

## Scope
Only touch:
- `src/app/page.tsx` (remove internal fetch, call getStatsData directly)
- `src/app/lib/stats.ts` (add parsePrizeAmount, apply it to prize field)
- Tests as needed to cover new prize parsing logic

Do NOT touch any other files unless a test file requires updating.
