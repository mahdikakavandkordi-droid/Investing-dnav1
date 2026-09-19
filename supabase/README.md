# `supabase/` backend map

This folder is the source-controlled backend history and verification layer for Investor DNA.

## Structure

### `migrations/`
Append-only database evolution: schema, functions, views, RLS, grants, seed/reference data and corrective changes.

Rules:

- never rewrite an already-applied migration to change live behavior;
- use a new corrective migration;
- verify live migration/state before applying;
- if a tooling call fails, treat state as unknown until re-read;
- check the exact live migration version/name into the repository after applying through the migration system.

### `functions/investing-dna-pilot/`
Privileged Edge Function used for assessment and controlled-pilot operations.

Current action family includes start/questionnaire/save/submit/context/claim plus analytics/feedback. The function can hold service-role capability, so every action must validate untrusted browser input/session/ownership before privileged access.

### `functions/market-data-refresh/`

Service-only post-close market-data worker. It asks the database for due work, calls only implemented/approved provider adapters, normalizes provider rows and writes through the canonical ingestion RPC. The current TSX MVP route is a temporary zero-cost Yahoo Finance bridge with deliberately low source priority. Supabase Cron invokes the worker using a Vault-held random token; the browser cannot invoke ingestion.

See `docs/MARKET-DATA-REFRESH.md`.

### `tests/`
SQL regressions that prove backend contracts against a real schema. Prefer rollback transactions for fixtures/mutations so tests do not contaminate research/pilot data.

## Trust boundary

The browser should normally reach database behavior through approved RPCs or the Edge Function. Do not make a table browser-writable simply because a UI needs a new action.

## Cross-asset data shape

`public.investments` remains the canonical identity table.

Shared cross-asset structure:

- `investment_structure_profiles`

Asset-specific extensions:

- `investment_fixed_income_terms`
- `investment_deposit_terms`
- existing ETF/fund research tables for performance, holdings, exposures, official facts and characteristics

Generic read API:

- `app_search_instruments`
- `app_get_instrument`
- `app_compare_instruments`

ETF-specific research/Match contracts remain separate where the semantics are fund-specific.

## Security checklist for a migration

Before considering a migration complete:

1. confirm intended roles and ownership model;
2. enable/retain RLS where user data is involved;
3. inspect grants on tables/views/functions;
4. use explicit `search_path` for privileged functions;
5. add/adjust an SQL regression;
6. run relevant Supabase security/performance advisors;
7. update `docs/DATABASE-AND-API.md` if the browser/server contract changed.

## Source-data rule

Research data must preserve provenance and real as-of/effective dates when applicable. Missing data stays null. Do not synthesize yield, return, risk rating or freshness merely to populate a card.

See `docs/DATABASE-AND-API.md`, `docs/ARCHITECTURE.md` and `docs/TESTING.md`.