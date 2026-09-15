# Continue here — 2026-09-15

This file is the short-lived project handoff snapshot. Canonical architecture belongs in `docs/ARCHITECTURE.md`; do not turn this file into another architecture document.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open and draft; do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

Still missing for M4 closeout: real cognitive participants, subsequent product-pilot evidence, external email canary, remaining launch hardening and formal compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Generic research universe: 55 active instruments (40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 CP reference, 1 ABCP reference).
- Explore/Detail/Compare: cross-asset.
- Screener/Match: ETF-scoped.
- Watchlist/Profile: asset-neutral.

## Recent engineering work

The repository/onboarding cleanup is substantially complete:

- canonical README/architecture/database/testing/engineering guides are in place;
- folder-level README maps exist for `app`, `components`, `lib`, `supabase` and `tests`;
- major route/component readability hotspots were split into named helpers/components;
- assessment localized copy moved to `lib/assessment-copy.ts`;
- Investor DNA report presentation helpers moved to `lib/dna-presentation.ts`;
- duplicate `FundConnection.tsx` was removed; `InstrumentConnection.tsx` is the single canonical implementation;
- obsolete `docs/HARD-TEST-V1.9.md` was removed because its useful coverage is represented by current testing docs/milestone evidence;
- repository version-hygiene rules now forbid convenience `old`/`backup`/parallel-version copies after migration of callers.

Cross-asset research architecture remains in place:

- shared structure profile;
- fixed-income terms;
- deposit/GIC terms;
- generic instrument read RPCs;
- centralized asset taxonomy in `lib/instrument-model.ts`;
- cross-asset browser and DB regressions;
- Watchlist RLS duplicate-policy cleanup.

## Verification status

GitHub Actions run `35033432475` on head `a0fc03c7d16a8f4dde0496264e3e745984019763` completed successfully after the major readability refactors. It covered contracts, typecheck, build and the browser suites in CI.

Additional cleanup/deletion commits were made after that verified head. Confirm CI again on the final cleanup head before calling the branch engineering-green.

The most recent Vercel build previously observed was blocked by a provider `build-rate-limit`; that was not an application compile failure, but a final deployed-preview verification is still required when hosting accepts a build.

## Known high-priority technical follow-ups

1. Make the questionnaire Edge Function return an explicit public DTO and stop exposing internal `weight`/raw localized fields to the browser.
2. Continue classifying/fixing the launch-relevant Supabase Advisor backlog; do not blindly change security-definer views without tracing permission dependencies.
3. Verify a real deployed magic-link round trip with an external inbox when hosting can build the final head.
4. Keep source/as-of dates real; never manufacture freshness.
5. Preserve historical questionnaire/scoring/Match data and applied migrations only where reproducibility requires them; do not reintroduce duplicate live implementations.

## Where to read next

- `README.md`
- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/ENGINEERING-GUIDE.md`
- `docs/DATABASE-AND-API.md`
- `docs/TESTING.md`
- `docs/MILESTONE-4-PILOT-EVIDENCE-PLAN.md`

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.