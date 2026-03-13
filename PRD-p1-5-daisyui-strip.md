# PRD: P1-5 — Strip Unused DaisyUI Components

## Objective
Reduce bundle size by removing unused DaisyUI components and styles from the rORE Stats Dashboard.

## Scope
- Analyze current DaisyUI usage in the project to determine which components are actually used.
- Remove unused DaisyUI component CSS from the build by customizing the DaisyUI theme or using a custom build.
- Specifically, the project currently imports the full DaisyUI library; we want to only include the components we use (likely: btn, card, badge/chip, navbar, etc. but many others unused).
- The current theme is "coffee" but we may want to keep that or switch to a minimal custom theme after extracting only needed components.
- Ensure the build continues to work and UI appearance unchanged for used components.
- Run a bundle analyzer before and after to quantify size improvement.

## Success Criteria
- DaisyUI bundle size reduced by at least 30% (target).
- No visual regressions: all existing UI components (buttons, cards, navbar, etc.) retain styling.
- Build passes (`npm run build`) and tests pass (`npm run test`).
- Document which DaisyUI components are kept.

## Constraints
- Do not change component code structure; only adjust DaisyUI integration.
- Maintain the current design system (colors, rounded corners, etc.) based on rORE brand palette.

## Implementation Notes
- DaisyUI supports tree-shaking via custom builds or using the `daisyui` plugin with `include`/`exclude` lists in Tailwind config. See: https://daisyui.com/docs/install/#partial-imports
- Current `tailwind.config.ts` likely includes `require("daisyui")` in plugins. We can replace with a custom config that lists only needed components.
- Typical used components in this dashboard: `btn` (maybe), `card`, `badge` (chip), `navbar`, `stat` (stat cards), `skeleton`, `divider`, `tooltip` (if any), `progress` (maybe), `table` (if any). Need to audit.
- Steps:
  1. Run `npm run build` and check bundle size baseline.
  2. Use `@next/bundle-analyzer` or similar to inspect contents.
  3. Update `tailwind.config.ts` to use `daisyui` with `base: true`, `theme: true`, `utils: true`, and `styles: true` but `logs: false`? Actually we want to include only specific components. We'll list all used component names in `include`.
  4. Re-run build and compare.
  5. Verify UI in dev server matches previous.
- If needed, we can create a custom DaisyUI build by copying the source and importing only needed components, but the partial import method should suffice.

## Verification Checklist
- [ ] Bundle size reduced (measure gzip)
- [ ] All UI elements look correct
- [ ] No console errors in browser
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Document kept components in README or notes

## Not In Scope
- Redesigning any UI elements.
- Changing Tailwind configuration beyond DaisyUI import.
