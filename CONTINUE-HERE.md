# Continue here — 2026-09-16

This file is the short-lived project handoff snapshot. Canonical architecture belongs in `docs/ARCHITECTURE.md`; concrete navigation belongs in `docs/CODE-MAP.md`; intentional runtime removals belong in `docs/RUNTIME-RETIREMENTS.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open and draft; do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

Still missing for M4 closeout: real cognitive participants, subsequent product-pilot evidence, external email/account canary, remaining launch hardening and formal Canadian compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Generic research universe: 55 active instruments (40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 CP reference, 1 ABCP reference).
- Explore/Detail/Compare: cross-asset.
- Screener/Match: ETF-scoped.
- Watchlist/Profile: asset-neutral.
- Portfolio Builder: frozen during M4 and no longer exists as a callable runtime subsystem. Only the historical `investment_portfolio_blueprints` table is retained, browser-inaccessible, with prior developer evidence.

## Canonical runtime boundaries

### Investing DNA assessment

Browser routes call the `investing-dna-pilot` Edge Function for:

- `start`
- `questionnaire`
- `save_answers`
- `submit`
- `save_context`
- `claim_assessment`
- `track_event`
- `submit_feedback`

The public questionnaire DTO is deliberately narrow; scoring weight, construct metadata, raw alternate-language fields and internal version fields stay behind the service boundary.

### DNA Match

The live Match chain is intentionally singular:

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v6(assessment_id)
 -> match runs/results
```

Retired live Match paths include v3, v4, v5, v5.1, the unversioned wrapper, old Investment DNA v1 view, and unused recommendation/explainability/intelligence/snapshot helpers. Historical Match result rows and applied migrations remain for audit/reproducibility.

See `docs/RUNTIME-RETIREMENTS.md` before restoring anything created by an older migration.

## Recent engine / repository cleanup

### Runtime retirement

Applied and source-controlled retirement migrations:

- `20260916000718_m4_retire_frozen_portfolio_runtime.sql`
- `20260916001531_m4_retire_legacy_app_views_and_home.sql`
- `20260916001822_m4_retire_legacy_match_runtimes.sql`
- `20260916002108_m4_retire_unused_match_helpers.sql`

Removed dead/parallel runtime includes:

- Portfolio Builder generation/risk functions and views;
- empty portfolio risk-analysis table;
- legacy `v_app_*`/current-DNA/home shell views and `get_investor_home()`;
- Match v3/v4/v5/v5.1 and the unused unversioned Match wrapper;
- `v_investment_dna_v1`;
- unused Match recommendations/explainability/intelligence/snapshot/cleanup helpers;
- empty `investor_match_snapshots` table.

Current research views that still have real dependencies, including `v_investment_catalog`, `v_investment_detail`, `v_investment_screener` and `v_investment_intelligence`, were explicitly retained.

### Client/source cleanup

- duplicate `FundConnection.tsx` removed; `InstrumentConnection.tsx` is canonical;
- old ETF-specific Watchlist aliases/types were removed from `lib/investments.ts`; asset-neutral Watchlist lives in `lib/instruments.ts`;
- browser `Question` type no longer advertises internal construct/scoring fields that the public API does not return;
- unused `MatchContent` state prop removed;
- obsolete `docs/HARD-TEST-V1.9.md` removed;
- convenience `old`/`backup`/parallel-version copies are prohibited after callers migrate.

### Hygiene enforcement

Current CI includes:

- contract tests;
- `tests/repo-hygiene.mjs`;
- normal TypeScript check;
- `tsc --noEmit --noUnusedLocals --noUnusedParameters` hygiene check;
- Next.js build;
- browser flow/fund/M4/cross-asset regressions.

The unused-code gate already caught and led to removal of a real dead prop in `/match`; it should be fixed rather than weakened when future dead code is detected.

## Verification status

### Database

- anonymous generic research search/detail/compare and ETF search/DNA/official-facts/research-context smoke tests passed after legacy-view retirement;
- `supabase/tests/milestone_1_engine_trust.sql` was updated to require legacy Match runtimes to be absent and canonical v6/current_match to be present;
- final M1 engine trust regression passed on the live database after all Match/runtime helper removals;
- synthetic DB regression data is transactionally rolled back.

### GitHub CI

- full CI run 200 passed on commit `eb874160a256749bf2ce789ffd45b18ab271b3f3`, including the new unused-code gate and all browser suites;
- documentation commits were added after that success. Confirm CI on the eventual final head before calling the branch fully engineering-green.

### Vercel

The last observed deployment state before this handoff refresh was provider rate limiting (`Deployment rate limited — retry in 24 hours`), not an application compile failure. Re-check Vercel on the final head before claiming deployment verification.

## Current Supabase Advisor state

Latest security audit after runtime retirement:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2:
  - `get_or_create_current_profile`
  - `is_current_profile`
- `SECURITY DEFINER` views: 20 (down from 28 during this cleanup pass);
- RLS-enabled/no-policy INFO findings: 32 (down from 33).

Do not batch-convert the remaining 20 views to `security_invoker`. Several current research/read-model paths depend on privileged reads and must be classified individually.

Latest Performance Advisor currently reports only `unused_index` INFO findings (47). Because this is a young/pilot database, zero observed index usage is not enough reason to remove an index; trace expected query/FK workload first.

## Documentation system

Start here when returning to the codebase:

1. `README.md`
2. `docs/README.md`
3. `docs/CODE-MAP.md` — route → module → RPC/Edge → DB → test map
4. `docs/ARCHITECTURE.md`
5. `docs/ENGINEERING-GUIDE.md`
6. `docs/DATABASE-AND-API.md`
7. `docs/RUNTIME-RETIREMENTS.md` — what was intentionally removed and what replaced it
8. `docs/TESTING.md`
9. `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md`
10. `docs/ASSESSMENT-METHODOLOGY.md`
11. `docs/INVESTMENT-DNA-METHODOLOGY.md`

Folder-level maps also exist under `app/`, `components/`, `lib/`, `supabase/`, `supabase/migrations/`, `supabase/tests/` and `tests/`.

## High-priority follow-ups

1. Confirm final-head GitHub CI after the documentation/handoff commits.
2. Re-check final-head Vercel deployment once provider rate limiting permits a build.
3. Classify the remaining 20 `SECURITY DEFINER` views individually; do not batch-change security mode without tracing grants/RLS/dependencies.
4. Run a real external magic-link/account canary and use that real authenticated flow before changing the two remaining authenticated definer helpers solely to reduce Advisor counts.
5. Keep source/as-of dates real; never manufacture freshness.
6. Keep historical persisted model results/migrations only where reproducibility or evidence requires them; do not reintroduce duplicate live implementations.
7. Complete M4 human evidence gates: 6 cognitive sessions, review/revision decision, 6 further sessions, candidate freeze, then the 20–50 user product pilot.
8. Formal Canadian compliance/privacy review remains a launch gate.

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
