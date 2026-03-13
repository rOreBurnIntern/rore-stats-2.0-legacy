# PRD — Round 2 fix for production /api/stats runtime 500

## Goal
Identify and fix the remaining live production failure where `/api/stats` still returns 500 after the nullable-field patch.

## Context
- Production URL: https://rore-stats-v2-rebuild.vercel.app/api/stats
- Previous patch for nullable optional fields has already been deployed and did NOT fully resolve the issue.
- Need the next root cause, not a repeat of the previous one.

## Constraints
- Work in a separate branch/worktree, not main.
- Keep the diff minimal and targeted.
- Add or update regression tests for the newly found failure.
- Must leave a commit on the branch before stopping.
- Do not merge.

## Tasks
- [ ] Inspect current production/runtime failure and identify the next root cause behind `/api/stats` 500.
- [ ] Reproduce locally against current mainline codepath.
- [ ] Implement the smallest safe fix.
- [ ] Add regression tests covering this exact failure mode.
- [ ] Run `npm test` and `npm run build` successfully.
- [ ] Verify the targeted `/api/stats` path no longer errors in local verification.
- [ ] Commit with a clear message.
- [ ] Stop after verified commit and report root cause + files changed.
