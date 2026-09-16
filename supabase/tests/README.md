# Supabase SQL regressions

These tests verify database/RPC/RLS/data contracts against a real schema. They complement, rather than duplicate, browser tests.

## Main suites

- `investor_platform_connections.sql` — account/profile/watchlist and current platform connection contracts.
- `milestone_1_engine_trust.sql` — canonical versions, run invalidation, safety gates, null semantics, no-suitable state and legacy-engine ACLs.
- `milestone_2_product_value.sql` — research read models, data coverage and product-facing read boundaries.
- `milestone_3_pilot_readiness.sql` — analytics/feedback constraints and browser denial boundaries.
- `m4_cross_asset_research.sql` — 55-instrument cross-asset structure/data/source integrity and browser write denial.
- `m4_security_hardening.sql` — M4 public RPC invoker boundaries, revoked legacy browser RPCs, frozen Portfolio Builder live contracts and rollback verification that a completed guest assessment can be claimed/promoted through the service path without browser `auth.uid()`.

## Rules

1. Prefer `begin ... rollback` for fixture-heavy tests.
2. Never leave synthetic assessment/pilot/investment records after a regression.
3. Test permissions explicitly when changing RLS/grants/RPC security.
4. Test null semantics for financial data when a missing value could be confused with zero.
5. Test source/as-of fields for source-backed sample data.
6. A passing browser mock is not a substitute for these tests after backend changes.
7. Do not remove applied historical migrations merely because current regressions target newer behavior; migration history and current acceptance tests serve different purposes.

## Running

Execute the relevant file against the intended Supabase project/schema using an administrative SQL runner/tool. Review the returned assertion result and ensure the transaction rolled back where designed.

After material RLS/DDL/grant changes, also run Supabase security/performance advisors and classify findings.

See `docs/TESTING.md` and `docs/DATABASE-AND-API.md`.
