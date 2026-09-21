# Investor DNA database and API guide

Status: canonical backend contract reference  
Last reviewed: 2026-09-17

This document explains how the browser reaches Supabase and where backend responsibilities live. Migration history records how the schema got here; this document describes the current runtime.

## 1. Backend layers

The backend has four conceptual layers:

1. **identity / persisted entities** — users, profiles, assessments, investments, watchlists;
2. **research/scoring models** — question bank, DNA results, Match results and investment research facts;
3. **browser-facing contracts** — narrow RPCs and the assessment/pilot Edge Function;
4. **private/service/admin implementation** — privileged ownership helpers, Match internals, ingestion, validation and pilot operations.

Browser code should depend on layer 3, not arbitrary tables or private implementation details.

## 2. Identity and ownership

### Accounts and profiles

Supabase Auth owns the authenticated user. `public.profiles.user_id` links product state to that identity.

Ownership rule: server code derives the current profile from authenticated identity. A browser-supplied profile or assessment ID is never ownership proof.

### Assessments

An assessment is a versioned Investing DNA run. A guest assessment is authorized by its server-issued session token. Once claimed, account ownership also applies.

### Investments

`public.investments` is the canonical cross-asset identity table.

Current extensions include:

- `investment_structure_profiles` — common cross-asset Investment DNA structure;
- `investment_fixed_income_terms` — bond/T-Bill/money-market terms;
- `investment_deposit_terms` — GIC/deposit terms;
- ETF/fund research tables for performance, holdings, exposure, official facts and characteristics.

Do not create a second identity table for each asset class.

### Watchlists

Watchlists are account/profile owned and asset-neutral. Public UI should say “investment” unless a surface is explicitly ETF-only.

## 3. Browser API families

### 3.1 Generic cross-asset research

Preferred browser contracts:

- `app_search_instruments`
- `app_get_instrument`
- `app_compare_instruments`

Client adapter: `lib/instruments.ts`.

These power Explore/Detail/Compare and preserve unavailable fields as null/unavailable rather than inventing zeros.

### 3.2 ETF-specific research

ETF-only research additionally uses:

- `app_get_investment_dna`
- `app_get_official_fund_facts`
- `app_get_investment_research_context`
- current ETF screener/search contract

Client adapter: `lib/investments.ts`.

MER, holdings and ETF risk disclosures must not be projected onto GICs/bonds merely to reuse a UI shape.

### 3.3 Account and Match

Primary persisted account state:

- `get_current_investor_app_state()` — authenticated public invoker wrapper over private current-state logic.

Current account-owned context write:

- `app_save_current_investment_context(p_context jsonb)` — authenticated public `SECURITY INVOKER` wrapper;
- `investor_private.save_current_investment_context(p_context jsonb)` — privileged implementation that derives the profile/current completed assessment from `auth.uid()` before delegating to the canonical context service.

Why this exists: a returning signed-in user can edit context without a guest session token, while the browser still cannot choose which account/assessment it owns.

Canonical Match runtime:

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v7(assessment_id)
 -> investor_private.goal_role_fit_v7(...)
 -> current Match run/results
```

Current versions are Match `investment-dna-match-v7` and Goal Fit `goal-fit-v1`. Match remains ETF-only. Historical v6 remains server-side for reproducibility; older Match generations and parallel recommendation/explainability helpers were intentionally retired from runtime; see `RUNTIME-RETIREMENTS.md`.

When money context is incomplete, the persisted v7 run can retain an internal comparison value for reproducibility and ordering, but `investor_private.current_match()` redacts the consumer-facing overall score and returns `context_only_score_policy = hidden_until_context_complete`. Browser presentation must also treat the payload status as authoritative so stale row-level values cannot surface a numeric score in `context_required` or `review_required` states.

## 4. Assessment / pilot Edge Function

Entry point:

`supabase/functions/investing-dna-pilot/index.ts`

Browser transport:

`lib/supabase.ts` -> `pilot(action, body)`

Allowlisted actions:

- `start`
- `questionnaire`
- `save_answers`
- `submit`
- `save_context`
- `claim_assessment`
- `track_event`
- `submit_feedback`

### Guest assessment authorization

After `start`:

1. browser sends `assessment_id` + server-issued `session_token`;
2. Edge Function hashes and verifies the token against the pilot participant;
3. assessment linkage/status is checked;
4. if the assessment is account-linked, authenticated ownership is also verified;
5. only then may privileged operations run.

Guest `save_context` continues through this capability path.

### Account claim

For completed guest DNA claim, the Edge Function establishes the authenticated current profile, then invokes the service claim path. Promotion does not assume browser `auth.uid()` survives inside service-role execution.

### Questionnaire DTO

The browser receives only:

- `question_id`
- `section`
- `question_type`
- selected-language `prompt`
- selected-language `options`

Scoring weights, construct configuration, internal versions and alternate-language raw fields stay server-side.

## 5. Investment-context contract

Investor DNA and money context are deliberately separate.

Core context fields required for a context-aware Match are:

- `goal`
- `time_horizon` or equivalent horizon months
- `liquidity_need`
- `principal_required`

Canonical UI horizon buckets for new input:

- `lt_1y`
- `1_3y`
- `3_5y`
- `5_10y`
- `gt_10y`

Legacy persisted values can remain readable for backward compatibility, but new UI must not create overlapping convenience buckets such as `under_2`.

`principal_required` is not optional to Match completeness. The Match constraint engine treats a missing value as incomplete context; `yes`/`unsure` can trigger a principal-protection review gate.

UI rules are documented in `PRODUCT-UX.md`: do not silently preselect the core context answers, and preload existing values when editing.

## 6. Pilot analytics boundary

The browser calls `track_event` through the Edge Function and does not write pilot event tables directly.

Identifiers are privacy-minimized random visitor/browser-session IDs plus optional authenticated/profile/assessment/investment linkage where permitted. Metadata is allowlisted and bounded; questionnaire answer text must not be copied into analytics metadata.

Feedback also uses the Edge write boundary.

## 7. RLS, grants and privileged code

Rules:

- keep RLS on user/account-owned data;
- derive account ownership from authenticated identity;
- avoid duplicate permissive policies;
- give browser roles only required RPC/view access;
- service/admin-only tables may intentionally expose no anon/authenticated policy;
- a Supabase Advisor finding is a prompt to inspect semantics, not a target score to blindly zero.

For `SECURITY DEFINER` code:

- use it only when elevated access is actually required;
- set an explicit safe `search_path`;
- keep privileged implementation private where practical;
- expose a narrow public `SECURITY INVOKER` wrapper;
- validate ownership inside the privileged implementation;
- add a regression around the permission boundary.

Do not convert current privileged views/functions to invoker without tracing underlying RLS/grants and real callers.

## 8. Current M4 security state

After runtime/API hardening:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable public `SECURITY DEFINER` helpers remaining: 2 (`get_or_create_current_profile`, `is_current_profile`), pending real-account canary before changing semantics;
- the account context public wrapper is `SECURITY INVOKER`; its privileged implementation is private and owner-derived;
- legacy browser RPCs / old app shells / old Match engines were retired rather than left as parallel public paths;
- Portfolio Builder callable runtime is retired during M4.

Current Supabase security Advisor output should be interpreted against these boundaries. RLS-with-no-policy findings are expected for service/internal tables that intentionally expose no browser policy. The two authenticated `SECURITY DEFINER` helper warnings remain a tracked canary item rather than something to change blindly.

## 9. Portfolio Builder freeze

Portfolio construction is outside current M4/V1 runtime.

Callable builder/risk functions, old portfolio views and the empty risk-analysis runtime table were retired. Historical migrations remain, and `investment_portfolio_blueprints` retains historical developer rows as non-browser-accessible evidence.

No assessment/context/account-state path should execute Portfolio Builder as a side effect.

## 10. Market-data refresh service

Market-data ingestion remains private/service-only.

Core operational contracts:

- `market_data_refresh_policies` — asset/data cadence and automation switch;
- `get_due_price_history_ingestion_plan()` — returns only stale, post-close ETF price-history work;
- `resolve_automated_market_data_source()` — selects only active network-capable provider routes, excluding the internal verified foundation;
- `market-data-refresh` Edge Function — provider fetch/normalization boundary;
- Supabase Cron + `pg_net` — primary post-close scheduler;
- Supabase Vault + `verify_market_data_worker_token(...)` — scheduler-to-Edge authentication without exposing a browser credential;
- `ingest_price_history_batch()` — canonical, idempotent, source-priority-aware write path;
- `market_data_worker_runs` — worker-level outcome audit;
- `market_data_refresh_runs` / `market_data_ingestion_log` — provider/batch and row-level ingestion audit.

The browser has no execute/read/write privileges on these operational contracts. Provider credentials belong in runtime secrets. The scheduled call uses a random Vault-held worker token; only its hash is stored in the service-only auth table.

Only ETF price history is automation-enabled in V1. The current Canadian/TSX implementation uses the temporary low-priority `yahoo_free` research route and has completed a live canary/catch-up. Replace it with a licensed provider after funding. See `MARKET-DATA-REFRESH.md`.

## 10. Migration policy

Applied migrations are append-only historical evidence.

For a new database change:

1. inspect live schema and migration ledger;
2. trace current dependencies/grants;
3. apply a focused migration;
4. verify resulting behavior/permissions;
5. run relevant Advisor/regression checks;
6. add the migration source using the exact live ledger version/name;
7. update canonical documentation if the runtime contract changed.

A timeout/connector error is unknown state, not success. Re-read live state before retrying.

If an already-applied migration is missing from source control, restore its exact historical source without re-running it. Source filenames and contents for applied migrations must match the live ledger rather than a reconstructed convenience timestamp.

## 12. Data provenance

For investment research:

- identity may exist before all facts are available;
- source name/URL/as-of date are preserved where relevant;
- stale real dates stay stale real dates;
- missing values stay null;
- educational/reference instruments do not receive invented live yields/prices.

## 13. Verification map

Database regressions live in `supabase/tests/` and cover:

- account/profile/watchlist ownership;
- M1 model/version/safety/null semantics;
- M2 research/product read models;
- M3 pilot privacy/write boundaries;
- M4 cross-asset structure/source integrity;
- M4 security/account/runtime-retirement boundaries.

Browser flows prove client integration, not live database permissions. Real external email/account canary remains a separate M4 gate.

## 14. Backend change checklist

Before calling backend work complete, answer:

- What is the browser-facing contract?
- Is it generic or asset-specific?
- Who owns the data?
- Which roles can read/write/execute it?
- Does privileged access remain private?
- How are session/identity/IDs validated?
- What is the null/missing-data behavior?
- What version/source/as-of metadata matters?
- Which DB/browser regression proves the changed boundary?
- Which canonical document changed with it?


## Returning-user retention boundary

Signed-in return continuity is server-owned rather than inferred from browser identity.

- `public.investor_workspace_state` stores the previous workspace snapshot for one profile.
- `public.investor_workspace_item_state` stores the last seen price date per saved investment.
- both tables are RLS-enabled, have no browser policies and are not directly readable by anon/authenticated clients;
- `public.app_open_returning_workspace()` is authenticated-only and resolves ownership from `auth.uid()`;
- the RPC returns only continuity facts required by Home: prior visit time, current Watchlist count, number/list of saved items with newer sourced market data and whether DNA/Match inputs changed;
- the browser caches that one summary for the current session so navigating away and back does not redefine the baseline.

Market-price browser reads follow the same split-boundary pattern as the rest of the app: `public.app_market_data_status(...)` is SECURITY INVOKER and delegates to the private SECURITY DEFINER implementation. This keeps the exposed wrapper narrow while operational price-history tables remain inaccessible.

## Questionnaire clarity revision

New ordinary frontend sessions use `DEV_V1_10_CLARITY` / `v1.10-clarity-1`, with unchanged `dna-v1.10-research` scoring. Older drafts and cognitive sessions retain their original version. See [assessment clarity](ASSESSMENT-CLARITY.md) for wording scope, deployment order and comparability limits.
