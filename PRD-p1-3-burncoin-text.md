# PRD: P1-3 — Remove Legacy Burncoin Text

## Objective
Remove all remaining references to "Burncoin" from the rORE Stats Dashboard v2 codebase and replace with appropriate rORE branding where needed.

## Scope
- Search entire codebase for strings containing "Burncoin" (case-insensitive)
- Update or remove such references in:
  - React components (tsx/ts)
  - HTML templates
  - Tests (test.ts, test.tsx)
  - Configuration files (tailwind.config.ts, next.config.js, etc.)
  - Documentation (README, PRDs, comments)
  - Static assets (public folder if any)
- Ensure any remaining branding aligns with rORE (use "rORE", "rORE Stats", or neutral terms)
- Do not modify functionality; purely textual changes.

## Success Criteria
- No occurrences of "Burncoin" remain in the codebase after the changes (except possibly in this PRD or commit messages).
- All tests continue to pass (npm run test).
- Application builds successfully (npm run build).
- No introduction of new linting errors.

## Constraints
- Do not change component structure or logic unless required for textual update.
- Do not alter data fetching or API contracts.
- Commit changes with clear message: "feat: remove legacy Burncoin text references"

## Notes
- Use ripgrep (`rg`) to find all matches: `rg -i "burncoin" --type-add 'web:*.{ts,tsx,js,jsx,html,css,md,json}'`
- Be thorough: include comments, docstrings, and alt text.
- If a reference is part of a variable name or key that affects functionality (e.g., database column), coordinate with backend; but likely none exist after previous cleanup.
