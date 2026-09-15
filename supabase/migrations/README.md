# Supabase migrations

This directory is the append-only source-controlled history of database evolution for Investor DNA.

## Rules

1. Applied migrations are historical evidence. Do not delete, rename, squash, reorder, or silently rewrite them after they have reached a shared/live Supabase project.
2. The filename version must match the version recorded in `supabase_migrations.schema_migrations` for an applied migration.
3. If repository history and the live migration ledger drift, reconcile the repository to the live applied history before creating more migrations. Restoring a missing applied migration file is a source-control repair; do not re-apply it to the database.
4. Create new schema changes as new migrations. Never edit an older applied migration to make the current schema look cleaner.
5. Historical functions/models may appear inside old migrations even after newer migrations supersede them. That is expected and necessary for reproducibility; current behavior is defined by the full ordered migration chain, not by reading one historical file in isolation.
6. Convenience copies such as `old`, `backup`, `v2-final`, or renamed duplicate migrations are not allowed. Versioned historical migrations are the exception because their exact identity matters.
7. Before claiming a database change is applied, verify it against the project migration ledger and the resulting schema/behavior.

## Current reconciliation note

On 2026-09-15, source control was reconciled with the live Supabase migration ledger for these already-applied migrations that had been missing from the active branch:

- `20260915084212_guarded_match_runs_v6.sql`
- `20260915084213_assessment_v110_and_context.sql`
- `20260915084957_protect_official_risk_ratings_and_legacy_claim.sql`

These files were restored as historical source artifacts only. No migration was re-run as part of the repository repair.

## Workflow for new changes

Use the Supabase migration workflow described in `docs/DATABASE-AND-API.md`. Keep migrations focused, verify the resulting behavior, run relevant database regressions/advisors, and commit the new migration with the code/docs/tests it supports.
