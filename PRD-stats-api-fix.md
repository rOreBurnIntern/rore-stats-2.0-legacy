# PRD — Fix production /api/stats runtime 500

## Goal
Fix the live production failure where `https://rore-stats-v2-rebuild.vercel.app/api/stats` returns 500 and causes the homepage to fall back to the loading state.

## Constraints
- Work in a separate branch/worktree, not main.
- Keep the diff minimal and targeted to the runtime failure.
- Write or update regression tests for the failing stats path.
- Do not change unrelated UI or product behavior.

## Tasks
- [ ] Reproduce the `/api/stats` runtime failure locally against the current production codepath.
- [ ] Inspect the exact server/runtime error and identify the root cause.
- [ ] Implement the smallest safe fix.
- [ ] Add or update regression tests covering the failing `/api/stats` path.
- [ ] Run `npm test` and `npm run build` successfully.
- [ ] Verify `/api/stats` returns 200 in local verification or targeted route test.
- [ ] Commit changes with a clear message on the fix branch.
- [ ] Do not merge; stop after verified commit and report root cause + files changed.
