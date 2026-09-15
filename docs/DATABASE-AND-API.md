# Investor DNA database and API guide

Status: canonical backend contract reference  
Last reviewed: 2026-09-15

This document explains how the browser is allowed to reach Supabase and where backend responsibilities live. It is a map, not a replacement for migration history.

## 1. Backend layers

The backend has four conceptual layers:

1. **identity / persisted entities** — users, profiles, assessments, investments, watchlists;
2. **research/scoring models** — question bank, DNA results, Match results, investment research facts;
3. **browser-facing read/write contracts** — RPCs and the pilot Edge Function;
4. **service/admin operations** — privileged functions, pilot tables, source ingestion and validation data.

The browser should depend on layer 3, not on arbitrary underlying tables.

## 2. Core identity entities

### Accounts and profiles

Supabase Auth owns the authenticated user. `public.profiles.user_id` links product state to that auth identity.

Ownership rule: server code derives the current profile from authenticated identity. The browser must not be trusted to say which profile it owns.

### Assessments

An assessment is a versioned run of the Investing DNA questionnaire. Important properties include questionnaire/model/scoring version, status, pilot participant/session linkage and optional profile ownership.

A guest assessment is authorized by its server-issued session token. Once claimed, account ownership also applies.

### Investments

`public.investments` is the canonical cross-asset identity table. Do not create a second identity table for each new asset class.

Current asset-specific extensions include:

- `public.investment_structure_profiles` — shared cross-asset Investment DNA structure layer;
- `public.investment_fixed_income_terms` — bond/T-Bill/money-market terms;
- `public.investment_deposit_terms` — GIC/deposit terms;
- existing ETF/fund research tables for performance, holdings, exposures, official facts and characteristics.

### Watchlists

Watchlists are account/profile owned and instrument-neutral. Public UI wording should use “investment”/“instrument” unless a screen is explicitly ETF-only.

## 3. Browser API families

### 3.1 Generic research RPCs

These are the preferred cross-asset research contracts:

- `app_search_instruments`
- `app_get_instrument`
- `app_compare_instruments`

Client adapter: `lib/instruments.ts`.

They expose the generic research catalog and asset-specific fields needed by Explore/Detail/Compare. They must preserve null/unavailable values rather than inventing zeros.

### 3.2 ETF/fund-specific research RPCs

ETF-specific screens additionally use contracts such as:

- `app_get_investment_dna`
- `app_get_official_fund_facts`
- `app_get_investment_research_context`

Client adapter: `lib/investments.ts`.

These exist because fund holdings, MER, official ETF risk disclosures and related research do not make sense for every asset class.

### 3.3 Match/account RPCs

Examples include:

- `get_current_investor_app_state`
- `app_investment_fit`
- `app_watchlist`
- profile/context helpers exposed through narrow wrappers.

The Match system is currently ETF-scoped. Generic research APIs must not imply that every instrument has a personalized Match result.

## 4. Edge Function contract

Entry point:

`supabase/functions/investing-dna-pilot/index.ts`

Browser client:

`lib/supabase.ts` -> `pilot(action, body)`

Currently allowlisted action family:

- `start`
- `questionnaire`
- `save_answers`
- `submit`
- `save_context`
- `claim_assessment`
- `track_event`
- `submit_feedback`

### Why the Edge Function exists

Some operations require a server-held service role, session-token validation, pilot isolation or a write boundary that must not be exposed as direct browser table access.

### Session/ownership flow

For assessment actions after `start`:

1. browser sends `assessment_id` + server-issued `session_token`;
2. Edge Function hashes the token;
3. participant/assessment session is verified;
4. if assessment is linked to a profile, authenticated account ownership is also verified;
5. only then may privileged operations run.

### Public questionnaire DTO

The questionnaire endpoint must return a narrow public DTO. Internal configuration fields such as scoring `weight` are server implementation details unless there is an explicit product reason to expose them.

When this DTO changes, update:

- `lib/dna.ts` `Question` type;
- assessment browser tests;
- this document.

## 5. Pilot analytics boundary

The browser calls `track_event` through the Edge Function. It does not write `pilot_product_events` directly.

Current privacy-minimized identifiers:

- random visitor ID;
- random browser-session ID;
- optional authenticated/profile/assessment/investment linkage where permitted.

The event metadata allowlist is deliberately narrow. Do not add arbitrary objects or questionnaire answer text to analytics metadata.

Feedback is also an Edge Function write, with bounded fields and optional bounded open text.

## 6. RLS and grants

Rules:

- RLS stays enabled on user/account-owned data.
- Authenticated policies should derive identity from `auth.uid()`/canonical ownership helpers.
- Avoid duplicate permissive policies.
- For frequently evaluated auth checks in RLS, prefer the optimized `(select auth.uid())` pattern when semantically equivalent.
- Browser roles receive only the grants needed for browser-facing APIs.
- Service-role-only tables may intentionally have no anon/authenticated policies.

A Supabase Advisor warning is a signal to investigate, not permission to blindly change security semantics.

## 7. Security-definer functions/views

`SECURITY DEFINER` is privileged code. Requirements:

- use only when necessary;
- set an explicit safe `search_path`;
- grant execution narrowly;
- validate identifiers/ownership before privileged mutation;
- prefer private implementation + narrow public wrapper when feasible;
- add a regression around the permission boundary.

Do not convert an existing view/function to `security invoker` without checking whether its underlying tables are intentionally hidden from browser roles.

## 8. Migration policy

### Append-only history

Once applied, a migration is historical evidence. Fixes go into a new migration.

### Before applying

1. inspect live migration history;
2. inspect relevant live schema/policies/functions;
3. confirm the migration is not already partially applied;
4. apply through the migration mechanism;
5. verify post-state;
6. check source file into `supabase/migrations/` using the live migration version/name.

### If tooling fails

A timeout/502/connector error is **unknown state**, not success. Re-read live state before retrying.

## 9. Data provenance contract

For investment research:

- identity can exist before all facts are available;
- source-specific tables preserve source name/URL/date when relevant;
- stale-but-real source dates remain stale-but-real;
- unavailable values remain null;
- reference/educational instruments must be labeled as such and must not receive invented live yields/prices.

## 10. Database regression suites

Important SQL regressions live in `supabase/tests/` and include:

- account/platform connection and ownership tests;
- Milestone 1 canonical engine/safety/version tests;
- Milestone 2 product/research coverage tests;
- Milestone 3 pilot privacy/read-write boundary tests;
- Milestone 4 cross-asset architecture/data integrity tests.

See `docs/TESTING.md` and `supabase/README.md`.

## 11. Change checklist for backend work

Before merging a backend change, answer:

- What is the browser-facing contract?
- Is this generic or asset-specific?
- Who owns the data?
- What role(s) can read/write/execute it?
- Does it require service-role access?
- How are IDs/session tokens validated?
- What is the null/missing-data behavior?
- What version/source/as-of metadata is required?
- Which SQL regression proves the boundary?
- Which canonical doc needs updating?