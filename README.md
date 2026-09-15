# Investing DNA — trusted engine + connected product-value baseline

The Next.js application runs from the repository root and uses the existing Supabase project. Registration remains optional: visitors can browse funds and take the assessment before creating an account. Signed-in users can retain their Investor DNA, investment context, watchlist and returning-user state.

## Current product baseline

- Current research assessment: `v1.10-cognitive-candidate` / `dna-v1.10-research`.
- Current canonical match engine: `investment-dna-match-v6`.
- Fund View, Explore, Match, Screener, Compare, optional account, Profile and Watchlist are connected to the persisted platform layer.
- Match is context-aware and can return `review_required`, `context_required`, `no_suitable_options` or `available` rather than forcing a recommendation.
- Critical capacity/context gates cover essential-spending risk, insufficient emergency reserve, principal-protection needs and short horizons.
- Match runs carry a run ID plus questionnaire, DNA, scoring, match and fund-data versions. Scoring-relevant fund-data changes invalidate the cached run.
- Review-required match scores are stored as `NULL`, not a fabricated zero.
- Historical match calculators remain for reproducibility but browser roles cannot invoke them directly.
- Fund research separates verified facts/performance from partial holdings/exposure coverage; missing values remain missing rather than being shown as zero.
- The current 40-investment universe has usable 1Y/3Y/5Y performance, MER and AUM coverage across all 40 rows; deeper exposure/holdings coverage remains intentionally partial and labelled.
- Screener and Compare layer Investor DNA compatibility on top of fund facts rather than replacing those facts.
- Guest results use a limited claim ticket so a completed assessment can be attached to an optional account through a magic-link flow without retaining the full completed draft in browser storage.
- GitHub CI verifies contracts, TypeScript, production build, the canonical assessment browser flow and the connected M2 product flow.

See:

- `docs/MILESTONE-1-ENGINE-TRUST-REPORT.md` — trusted-engine audit and safety/versioning evidence.
- `docs/MILESTONE-2-PRODUCT-VALUE-REPORT.md` — connected product-value work, data coverage, browser/database regressions and remaining limits.

## Run and deploy

Requires Node.js 22.18+. Copy `.env.example` to `.env.local`, supply the Supabase public/publishable key, then run `npm ci` and `npm run dev`. Never use a service-role key in public environment variables. See `DEPLOY.md`.

The checked-in Supabase migration history is synchronized through `20260915170500_milestone_2_research_rpc_hardening`, which has already been applied to the existing DNA project. Apply the migrations before deploying this frontend to a different backend.

Vercel Git integration creates deployments from repository commits. Deployment state is verified through the GitHub/Vercel commit status.

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
- `supabase/tests/milestone_2_product_value.sql` — canonical Screener/Compare performance, 40-row usable data coverage, fund-of-funds research context and public/private read boundaries.

The M1 and platform suites use synthetic fixtures/mutations inside rollback transactions. The M2 product-value data suite is also executed inside a rollback transaction and is safe to rerun against the current database.

## Scientific/validation status

The v1.10 instrument is a structured **research candidate**, not a validated psychometric test. Engineering trustworthiness and a coherent product experience are not the same as psychometric validation.

Still required before making validation claims:

1. cognitive testing,
2. real-user pilot data,
3. reliability/structure analysis,
4. calibration and retest/criterion work.

See `docs/ASSESSMENT-METHODOLOGY.md`.

## Work after Milestone 2

The recommended next phase is **Pilot & Launch Readiness**, not feature expansion into Portfolio Builder.

- Run cognitive testing and an initial real-user cohort.
- Verify production email/magic-link delivery with real external accounts and monitor claim failures.
- Add funnel/return analytics to learn whether Match, Compare and Watchlist create repeat value.
- Classify and resolve or explicitly accept remaining Supabase security/performance advisor findings before a public production launch.
- Complete normalized risk labels for the four currently missing catalog rows and deepen characteristics/exposure/holdings coverage across the current universe.
- Complete compliance/legal wording and launch review before presenting compatibility as anything beyond research/education.
- Keep Portfolio Builder out of V1 until allocation methodology is rebuilt against the canonical engine and the current loop has real-user evidence.

The questionnaire API still exposes internal question `weight` fields; use an explicit public DTO if those should remain server-only.

The browser must not compute scores, override account ownership or bypass server checks. Server authorization remains authoritative.
