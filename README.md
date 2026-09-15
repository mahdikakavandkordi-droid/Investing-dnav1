# Investor DNA

Investor DNA is a Canadian investment-research platform that connects an investor profile to a structured investment research universe.

The current product is a **research/pilot system**, not a public investment-advice service and not a validated psychometric instrument.

## Product vocabulary

Use these terms consistently:

- **Investor DNA** — platform/product brand.
- **Investing DNA** — investor assessment.
- **Investment DNA** — structured profile of an investment.
- **DNA Match** — personalized compatibility layer.

## Current engineering baseline

- Next.js 16 / React 19 frontend.
- Supabase Auth, Postgres, RPCs and one privileged assessment/pilot Edge Function.
- Optional account: users can browse and complete the assessment without registration.
- Current research assessment: `v1.10-cognitive-candidate`.
- Current Investor DNA model: `dna-v1.10-research`.
- Current canonical Match model: `investment-dna-match-v6`.
- DNA Match is currently **ETF-only**.
- Generic research universe currently contains **55 active instruments**:
  - 40 ETFs
  - 4 GICs
  - 3 Government of Canada T-Bills
  - 6 bonds
  - 1 Commercial Paper research reference
  - 1 ABCP research reference
- Explore, generic Detail and Compare are cross-asset.
- ETF Screener and personalized Match remain intentionally ETF-scoped.
- Watchlist/Profile language and persistence are asset-neutral.
- Portfolio Builder remains outside the current V1/M4 scope.

## Start here if you are joining the engineering team

Read these in order:

1. [`docs/README.md`](docs/README.md) — documentation map and canonical-vs-historical distinction.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — end-to-end product/system architecture.
3. [`docs/ENGINEERING-GUIDE.md`](docs/ENGINEERING-GUIDE.md) — coding, naming, security and Definition-of-Done rules.
4. [`docs/DATABASE-AND-API.md`](docs/DATABASE-AND-API.md) — Supabase/API/trust-boundary map.
5. [`docs/TESTING.md`](docs/TESTING.md) — verification layers and CI.
6. The README inside the folder you are modifying (`app/`, `components/`, `lib/`, `supabase/`, `tests/`).
7. [`CONTINUE-HERE.md`](CONTINUE-HERE.md) — immediate current state/blockers only.

Historical milestone reports remain in `docs/` as evidence, but they are not the canonical architecture reference.

## Repository map

```text
app/                Next.js routes and route-level orchestration
components/         reusable UI/product components
lib/                browser-side domain contracts, adapters and helpers
docs/               canonical architecture + research/operating/history docs
supabase/
  functions/        privileged Edge Function boundary
  migrations/       append-only database evolution
  tests/            database/RLS/RPC regressions
tests/              frontend contract + Playwright browser regressions
.github/workflows/  CI
```

## Local setup

Requires Node.js **22.18+**.

```sh
cp .env.example .env.local
npm ci
npm run dev
```

Environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a legacy public-key fallback. Never put a Supabase service-role key in a public/browser environment variable.

See [`DEPLOY.md`](DEPLOY.md) for hosting/auth callback requirements.

## Verification

Fast/client checks:

```sh
npm test
npm run typecheck
npm run build
```

Browser regressions:

```sh
npm run test:flow
npm run test:funds
npm run test:m4
npm run test:assets
```

Everything locally:

```sh
npm run test:all
```

Playwright flows intercept Supabase calls and therefore do **not** prove live migrations, real email delivery or deployment health. Database regressions live in `supabase/tests/`.

## Architecture rules that must not be broken casually

- Browser code does not calculate canonical Investor DNA or Match scores.
- Browser-provided IDs are not proof of account/profile ownership.
- Raw pilot analytics/feedback tables are not direct browser write targets.
- Missing investment data remains unavailable/null, not zero.
- Official/verified source data takes precedence over inferred data.
- Do not manufacture current `as_of_date` values to make stale data appear fresh.
- `public.investments` remains the canonical identity table across asset classes.
- New asset classes extend the generic structure model plus specialized terms rather than adding page-specific condition chains.
- Questionnaire/scoring/Match behavior is versioned; do not silently mutate an existing research version.
- A code change that changes architecture/API/schema/test gates must update the canonical docs in the same change.

## Current milestone status

- **M1 — Engine Trust:** complete.
- **M2 — Product Value / connected research loop:** complete from engineering acceptance perspective.
- **M3 — Controlled Pilot Readiness:** complete from engineering/operations perspective.
- **M4 — Pilot Evidence & Pre-Launch Hardening:** active.

M4 still requires real human cognitive/product-pilot evidence, a real external email canary, remaining launch hardening and formal compliance/privacy review. Engineering work alone cannot close it.

## Current deployment note

The current branch has had green GitHub CI for the cross-asset implementation. The most recent Vercel attempt was blocked by a provider **build-rate-limit**, not an application compile failure. Treat the latest commit as deployed only after Vercel accepts/builds it and the deployed URL is canary-tested.

## Contribution rule

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making non-trivial changes. The short version: put rules in the correct domain module, keep server trust server-side, test the boundary you changed, and update documentation at the same time.