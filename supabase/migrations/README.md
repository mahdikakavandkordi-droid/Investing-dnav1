# Supabase migration history

This directory is append-only live database history.

## Naming

Use:

```text
YYYYMMDDHHMMSS_descriptive_snake_case.sql
```

Prefer the migration version/name returned by the live migration system when a migration has already been applied.

## Rules

1. Never rewrite an already-applied migration to change current behavior.
2. Fix mistakes with a new corrective migration.
3. Inspect live state/migration history before applying; repository assumptions are not enough.
4. A failed/timeout/502 apply call means state is unknown until verified.
5. Keep RLS/grants/function security semantics explicit.
6. Use an explicit `search_path` for privileged functions.
7. Keep research source/as-of semantics truthful; do not manufacture freshness.
8. Add or update a SQL regression when the migration changes a meaningful contract.

## Reading the history

The migration directory contains several generations of the product. Do not infer current architecture from an early migration alone. Use these first:

- `docs/ARCHITECTURE.md`
- `docs/DATABASE-AND-API.md`
- `docs/README.md`

Then use migrations to trace exactly how the current state evolved.

## Current major eras

The history broadly covers:

- assessment / scoring / narrative foundations;
- v1.x questionnaire and context evolution;
- investment universe + research data;
- suitability/Match iterations and canonicalization;
- identity/account/watchlist persistence;
- M1 engine trust;
- M2 product research/read model;
- M3 analytics/feedback/cognitive pilot;
- M4 cross-asset research and RLS cleanup.

Historical functions/models can remain for reproducibility even when browser execution is removed. Check grants and current canonical docs before deleting “old-looking” objects.