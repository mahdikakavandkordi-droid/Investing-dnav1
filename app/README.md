# `app/` route map

This folder is the Next.js App Router layer. Pages should orchestrate product flows, not become the home of reusable business rules.

## Route ownership

- `/` — platform landing page.
- `/dna` — assessment entry/overview.
- `/dna/assessment` — Investing DNA questionnaire session.
- `/dna/context` — investment context captured after/around DNA for Match.
- `/dna/result` — Investor DNA result and optional account-save path.
- `/explore` — generic cross-asset research catalog.
- `/investment/[id]` — generic instrument detail shell; ETF-only research is composed conditionally through centralized asset rules.
- `/match` — personalized DNA Match; currently ETF-only.
- `/screener` — explicitly ETF-focused screener while Match remains ETF-only.
- `/compare` — structure-first comparison; supports cross-asset research and adds ETF Match where available.
- `/watchlist` — account-scoped saved investments; asset-neutral.
- `/profile` — auth, claim, return-state and saved-investment surface.
- `/feedback` — pilot feedback.
- `/pilot/cognitive` — controlled cognitive-study entry.
- `/research` — research/limitations transparency.
- `/privacy` — pilot privacy transparency.

## Rules for page code

1. Call `lib/` adapters instead of constructing Supabase calls inline when an adapter exists.
2. Ask `lib/instrument-model.ts` for asset labels/families/Match eligibility instead of repeating asset-type `if` chains.
3. Do not calculate canonical DNA or Match scores in the browser.
4. Treat `null` research values as unavailable, not zero.
5. Keep auth/ownership enforcement server-side.
6. Extract reusable UI into `components/` and reusable rules/contracts into `lib/`.
7. When a route changes meaning or a new route is added, update `docs/ARCHITECTURE.md` and this file.

## Styling

Global/product CSS currently lives beside the App Router under `app/*.css`. Before adding another global stylesheet, check whether the style belongs to an existing product surface. Avoid creating one-off page styling files without a clear boundary.

See `docs/ARCHITECTURE.md` and `docs/ENGINEERING-GUIDE.md`.