# Investing DNA — trusted engine + connected product + controlled-pilot baseline

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
- First-party pilot analytics now track the product funnel with random visitor/session identifiers and do not store email, name, IP address or questionnaire-answer text in analytics tables.
- Structured pilot feedback captures ease, trust, usefulness, Match comprehension, return intent and optional open feedback.
- `/pilot/cognitive` provides a clean, invite-gated `COGNITIVE_V1_10` research entry so development traffic does not contaminate the planned 12-person cognitive cohort.
- Raw pilot analytics/feedback are not browser-readable or browser-writable; the Edge Function is the write boundary and founder summary views are service-role only.
- GitHub CI verifies contracts, TypeScript, production build, the canonical assessment + feedback + cognitive flow, and the connected fund/product funnel.

See:

- `docs/MILESTONE-1-ENGINE-TRUST-REPORT.md` — trusted-engine audit and safety/versioning evidence.
- `docs/MILESTONE-2-PRODUCT-VALUE-REPORT.md` — connected product-value work, data coverage, browser/database regressions and remaining limits.
- `docs/MILESTONE-3-PILOT-LAUNCH-READINESS-REPORT.md` — privacy-minimized analytics, structured feedback, controlled cognitive research, migration/CI/deployment evidence and pilot/public-launch gates.
- `docs/COGNITIVE-TEST-PROTOCOL.md` — moderator protocol for v1.10 cognitive testing.
- `docs/PILOT-OPERATIONS.md` — controlled-pilot operating rules and founder/admin summary queries.

## Run and deploy

Requires Node.js 22.18+. Copy `.env.example` to `.env.local`, supply the Supabase public/publishable key, then run `npm ci` and `npm run dev`. Never use a service-role key in public environment variables. See `DEPLOY.md`.

The checked-in Supabase migration history is synchronized through `20260915204943_milestone_3_cognitive_invite_gate`, which has already been applied to the existing DNA project. Apply the migrations before deploying this frontend to a different backend.

The live cognitive invite-code digest is operational configuration and is intentionally not stored in source control.

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

The browser runners start a local server on port 3001 with intercepted Supabase responses. They send no live emails and do not create production pilot evidence. Set `CHROME_BIN=/absolute/path/to/chrome` to use an existing browser. Screenshots go to ignored `tests/artifacts`.

Database regression files:

- `supabase/tests/investor_platform_connections.sql` — account/fund isolation and canonical v1.10/v6 fit path.
- `supabase/tests/milestone_1_engine_trust.sql` — canonical version/run behavior, fund-data invalidation, legacy-engine ACL, safety gates, null semantics, no-suitable state and sensitivity sanity checks.
- `supabase/tests/milestone_2_product_value.sql` — canonical Screener/Compare performance, 40-row usable data coverage, fund-of-funds research context and public/private read boundaries.
- `supabase/tests/milestone_3_pilot_readiness.sql` — pilot analytics/feedback constraints and anonymous read/write denial.

The M1/platform and M3 suites use synthetic fixtures/mutations inside rollback transactions. The M2 product-value data suite is also executed inside a rollback transaction and is safe to rerun against the current database.

## Scientific/validation status

The v1.10 instrument is a structured **research candidate**, not a validated psychometric test. Engineering trustworthiness, a coherent product experience and pilot instrumentation are not the same as psychometric validation.

Still required before making validation claims:

1. cognitive testing,
2. real-user quantitative pilot data,
3. reliability/structure analysis,
4. calibration and retest/criterion work.

The planned cognitive cohort is `COGNITIVE_V1_10`, target **12 participants**. Milestone 3 makes that study operationally safe to run; it does not claim that the study has already happened.

See `docs/ASSESSMENT-METHODOLOGY.md` and `docs/COGNITIVE-TEST-PROTOCOL.md`.

## Milestone status

- **M1 — Engine is trustworthy:** complete.
- **M2 — Product is valuable/connected:** complete from engineering/product-flow acceptance perspective.
- **M3 — Pilot & launch readiness:** complete from engineering and controlled-pilot-readiness perspective.
- **Public launch:** not yet approved. Real participant evidence, an external deployed magic-link canary, compliance/legal review and remaining launch hardening are still gates.

## Work after Milestone 3

The recommended next phase is **Milestone 4 — Pilot Evidence & Pre-Launch Hardening**, not feature expansion into Portfolio Builder.

- Run the planned 12-person cognitive study and document repeated wording/construct issues.
- Freeze any post-cognitive questionnaire revision under a new numbered version rather than silently changing v1.10.
- Recruit the initial 20–50 product-pilot users and review funnel/trust/usefulness/return evidence in batches.
- Verify a real deployed magic-link round trip with a controlled external inbox.
- Classify and resolve or explicitly accept remaining Supabase security/performance advisor findings that matter for launch.
- Complete normalized risk labels and continue deepening characteristics/exposure/holdings coverage across the current universe.
- Complete privacy/terms/compliance wording and launch review before positioning compatibility as anything beyond research/education.
- Keep Portfolio Builder out of V1 until the current profile → Match → research → save/return loop has real-user evidence.

The questionnaire API still exposes internal question `weight` fields; use an explicit public DTO if those should remain server-only.

The browser must not compute scores, override account ownership, write raw pilot tables or bypass server checks. Server authorization remains authoritative.
