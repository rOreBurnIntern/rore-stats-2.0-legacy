# rORE Stats Dashboard — v2 Rebuild (ARCHIVED / LEGACY)

> ⚠️ **SUPERSEDED** — This repository is archived and no longer maintained.
>
> This was a broken rebuild attempt (Next.js 14 + Vercel) that encountered persistent deployment and API issues.
>
> **The active project is [rORE-Stats-Dashboard-2.0](https://github.com/rOreBurnIntern/rORE-Stats-Dashboard-2.0).**

---

This was a [Next.js 14](https://nextjs.org) project for the rORE Protocol, initialized with Tailwind CSS and DaisyUI, providing real-time insights into protocol metrics including:

- WETH and rORE token prices
- Motherlode total locked value and participants
- Current round analytics (prize, entries, time remaining)

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Stack

- Next.js 14
- React 18
- Tailwind CSS
- DaisyUI

## Vendored DaisyUI Subset

Theme: `coffee` only

Components: `alert`, `card`, and `navbar`

Utilities: `bg-base-200` and `text-base-content`

The vendored DaisyUI CSS in `public/vendor/daisyui/themes.css` and `public/vendor/daisyui/styled.css` is intentionally trimmed to the selectors above to keep the shipped CSS small without changing the current dashboard presentation.

## Data Flow

- Prices: `/api/prices` → fetches from `https://api.rore.supply/api/prices`
- Motherlode: `/api/motherlode` → fetches from `https://api.rore.supply/api/motherlode`
- Rounds: `/api/rounds` → fetches from `https://api.rore.supply/api/rounds/current`

## Deployment

Deployed via Vercel. The site automatically revalidates data every 30 seconds.

GitHub Actions now handles the deployment pipeline:

- Pull requests run `npm test`, `npm run lint`, and `npm run build`, then create a Vercel preview deployment.
- Pushes to `main` run the same verification steps, then publish a production deployment to Vercel.

Required repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
