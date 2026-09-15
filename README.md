# Investing DNA — platform continuity + trusted engine baseline

The Next.js application runs from the repository root and uses the existing Supabase project. Registration remains optional: visitors can browse funds and take the assessment before creating an account. Signed-in users can retain their Investor DNA, watchlist and account context.

## Current product baseline

- Current research assessment: `v1.10-cognitive-candidate` / `dna-v1.10-research`.
- Current canonical match engine: `investment-dna-match-v6`.
- Fund View, Explore, Compare, optional account, Profile, Watchlist and Match are connected to the persisted platform layer.
- Match is context-aware and can return `review_required`, `context_required`, `no_suitable_options` or `available` rather than forcing a recommendation.
- Critical capacity/context gates cover essential-spending risk, insufficient emergency reserve, principal-protection needs and short horizons.
- Match runs now carry a run ID plus questionnaire, DNA, scoring, match and fund-data versions. Scoring-relevant fund-data changes invalidate the cached run.
- Review-required match scores are stored as `NULL`, not a fabricated zero.
- Historical match calculators remain for reproducibility but browser roles cannot invoke them directly.

See `docs/MILESTONE-1-ENGINE-TRUST-REPORT.md` for the completed Milestone 1 audit, fixes, regression evidence and limitations.

## Run and deploy

Requires Node.js 22.18+. Copy `.env.example` to `.env.local`, supply the Supabase public/publishable key, then run `npm ci` and `npm run dev`. Never use a service-role key in public environment variables. See `DEPLOY.md`.

The checked-in Supabase migration history is synchronized through `20260915163427_milestone_1_match_engine_canonicalization`, which has already been applied to the existing DNA project. Apply the migrations before deploying this frontend to a different backend.

Vercel Git integration creates deployments from repository commits. Direct Vercel API access from the current ChatGPT connector is not authorized for the project scope, so deployment state is also verified through the GitHub/Vercel commit status.

## Verification

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:flow
npm run test:funds
```

The browser runners start a local server on port 3001 with intercepted Supabase responses. They send no emails or production assessments. Set `CHROME_BIN=/absolute/path/to/chrome` to use an existing browser. Screenshots go to ignored `tests/artifacts`.

Database regression files:

- `supabase/tests/investor_platform_connections.sql` — account/fund isolation and canonical v1.10/v6 fit path.
- `supabase/tests/milestone_1_engine_trust.sql` — canonical version/run behavior, fund-data invalidation, legacy-engine ACL, safety gates, null semantics, no-suitable state and sensitivity sanity checks.

Both suites were executed against the real database using synthetic fixtures/mutations inside transactions that were rolled back.

## Scientific/validation status

The v1.10 instrument is a structured **research candidate**, not a validated psychometric test. Engineering trustworthiness is not the same as psychometric validation.

Still required before making validation claims:

1. cognitive testing,
2. real-user pilot data,
3. reliability/structure analysis,
4. calibration and retest/criterion work.

See `docs/ASSESSMENT-METHODOLOGY.md`.

## Known work outside Milestone 1

- Supabase advisors still report broader platform-level security/performance findings (for example security-definer view/RPC warnings, index issues and RLS performance warnings). Some application RPC exposure is intentional and guarded, but every finding should be classified before public production launch.
- The questionnaire API still exposes internal question `weight` fields; use an explicit public DTO if those should remain server-only.
- Real email delivery and real-user guest-to-account claim flows still need end-to-end launch verification.
- Match UX, ETF data depth/look-through, DNA-powered Screener/Compare and returning-user value are Milestone 2 product work.

The browser must not compute scores, override account ownership or bypass server checks. Server authorization remains authoritative.
