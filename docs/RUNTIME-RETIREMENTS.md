# Investor DNA runtime retirement ledger

Status: canonical record of intentionally removed live/runtime paths  
Last reviewed: 2026-09-16

This file answers a specific maintenance question: **“Was this old object accidentally deleted, or was it intentionally retired — and what replaced it?”**

Use Git history and applied Supabase migrations for implementation history. Use `docs/ARCHITECTURE.md` and `docs/CODE-MAP.md` for the current system. This ledger records runtime removals that are easy to misread when looking at older migrations.

## Rules

- Applied migrations are immutable history; do not delete or rewrite them because a runtime object was later retired.
- Retiring a runtime path means removing the callable/current implementation, not erasing historical evidence.
- Historical rows may be retained when they support auditability/reproducibility, even after the code that produced them is no longer live.
- Do not restore an object listed here merely because an older migration created it. First verify that the current architecture actually requires it.

---

## 2026-09-16 — frozen Portfolio Builder runtime retired

Migration: `20260916000718_m4_retire_frozen_portfolio_runtime.sql`

Removed live objects:

- `public.generate_portfolio_blueprints(uuid)`
- `public.refresh_blueprint_risk_and_match(uuid)`
- `public.calculate_portfolio_risk_overlap(uuid)`
- `public.v_portfolio_intelligence`
- `public.v_portfolio_risk_analysis`
- empty table `public.portfolio_risk_analysis`

Also changed:

- browser-role access to `public.investment_portfolio_blueprints` was removed.

Why:

- Portfolio Builder is frozen during M4 and no current route/account-state/assessment flow calls it.
- keeping parallel callable portfolio logic increased security surface and made the active product boundary ambiguous.

Intentionally retained:

- `public.investment_portfolio_blueprints` with 37 historical developer rows at retirement time;
- historical migrations that originally created and evolved the Portfolio Builder.

Current replacement:

- none. Portfolio construction is not a current live product subsystem.

---

## 2026-09-16 — legacy app views/home shell retired

Migration: `20260916001531_m4_retire_legacy_app_views_and_home.sql`

Removed live objects:

- `public.v_app_dna`
- `public.v_app_investment_catalog`
- `public.v_app_investment_detail`
- `public.v_app_watchlist`
- `public.v_current_user_identity`
- `public.v_current_investor_dna`
- `public.v_investor_home`
- `public.get_investor_home()`

Why:

- dependency audit showed the `v_app_*` views and identity shell had no current function/view/RLS/trigger consumers;
- `get_investor_home()` had already been removed from browser access and was no longer part of the product contract;
- current account state is exposed through the canonical authenticated app-state contract instead.

Intentionally retained:

- `public.v_investment_catalog`
- `public.v_investment_detail`
- `public.v_investment_screener`
- `public.v_investment_intelligence`

Those views still participate in current research/screener/intelligence paths and were explicitly verified before retirement of the legacy shell.

Current replacement:

- `get_current_investor_app_state()` public authenticated wrapper backed by private current-state logic;
- current generic/ETF research RPCs documented in `docs/CODE-MAP.md`.

---

## 2026-09-16 — parallel legacy Match runtimes retired

Migration: `20260916001822_m4_retire_legacy_match_runtimes.sql`

Removed live objects:

- `public.calculate_investment_match_v3(uuid)`
- `public.calculate_investment_match_v4(uuid)`
- `public.calculate_investment_match_v5(uuid)`
- `public.calculate_investment_match_v51(uuid)`
- unversioned `public.calculate_investment_match(uuid)` wrapper
- `public.v_investment_dna_v1`

Why:

- exact-call dependency audit showed only Match v6 had current callers;
- v5 existed only to serve v5.1, and v5.1 had no current caller;
- v3/v4 had no current caller;
- the unversioned wrapper had no exact caller after canonicalization;
- keeping multiple live engines made it too easy for a future caller to bypass the canonical model by name.

Intentionally retained:

- historical `investment_match_results` rows for older model versions;
- historical migrations that define earlier Match generations.

At retirement time historical result rows included v3/v4/v5/v5.1 and older suitability versions. These rows are audit/reproducibility data, not live routing logic.

Current replacement:

- `public.calculate_investment_match_v6(uuid)`
- `investor_private.current_match(uuid)` as the canonical current-run/read entry point
- `public.v_investment_dna_v2` as the current Investment DNA view used by Match/research

Verification:

- `supabase/tests/milestone_1_engine_trust.sql` was updated to require legacy runtimes to be absent and canonical v6/current_match to be present;
- the full M1 regression passed against the live database after retirement.

---

## 2026-09-16 — unused Match helper/read layer retired

Migration: `20260916002108_m4_retire_unused_match_helpers.sql`

Removed live objects:

- `public.capture_current_match_snapshot(uuid)`
- `public.get_investment_recommendations(uuid, integer)`
- `public.get_explainable_match(uuid, integer)`
- `public.get_investment_match_intelligence(uuid)`
- `public.cleanup_match_result_versions(uuid, text)`
- empty table `public.investor_match_snapshots`

Why:

- exact-call audit found no live caller for the explainable/intelligence/cleanup helpers;
- `get_investment_recommendations` was only called by the dead snapshot helper;
- the snapshot table contained 0 rows and its only writer was the dead snapshot helper;
- current product screens already consume the canonical Match payload/current-state path instead of these side APIs.

Current replacement:

- canonical `investor_private.current_match(uuid)` payload and the account-state / investment-fit contracts that consume it.

Verification:

- the final M1 engine regression passed on the live database after these helpers were removed.

---

## Source/client cleanup in the same hygiene pass

The following were also intentionally removed from current source contracts:

- legacy ETF-specific Watchlist aliases `watchlist`, `saveFund`, `removeFund` and `WatchItem` from `lib/investments.ts`; generic Watchlist ownership now lives in `lib/instruments.ts`;
- internal questionnaire fields (`construct`, `construct_role`, scoring weight/version internals) from the public browser question DTO/type;
- unused `state` prop passed into `MatchContent`;
- duplicate `FundConnection.tsx` in favor of `InstrumentConnection.tsx`.

Repository safeguards now include:

- `tests/repo-hygiene.mjs` for retired runtime/name/secret/DTO boundaries;
- `npm run typecheck:hygiene` (`tsc --noEmit --noUnusedLocals --noUnusedParameters`) in CI;
- ordinary TypeScript/build/browser flow regressions.

---

## Current canonical Match chain

```text
Browser pages/components
  -> current authenticated/public app contracts
  -> investor_private.current_match(assessment_id)
  -> calculate_investment_match_v6(assessment_id)
  -> investment_match_results / investor_private.match_runs
```

Do not add a new unversioned parallel Match wrapper. A behavior-changing Match revision should introduce an explicit new model version, migrate the canonical `current_match` owner deliberately, update M1 regression/methodology docs, and retire the superseded callable runtime once no current callers remain.
