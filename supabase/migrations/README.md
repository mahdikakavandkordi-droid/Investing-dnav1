# Supabase migrations

This directory is the append-only source-controlled history of database evolution for Investor DNA.

## Rules

1. Applied migrations are historical evidence. Do not delete, rename, squash, reorder, or silently rewrite them after they have reached a shared/live Supabase project.
2. The filename version must match the version recorded in `supabase_migrations.schema_migrations` for an applied migration.
3. If repository history and the live migration ledger drift, reconcile the repository to the live applied history before creating more migrations. Restoring a missing applied migration file is a source-control repair; do not re-apply it to the database.
4. Create new schema changes as new migrations. Never edit an older applied migration to make the current schema look cleaner.
5. Historical functions/models may appear inside old migrations even after newer migrations retire them. That is expected and necessary for reproducibility; **an object appearing in an old migration does not mean it is still live runtime**.
6. Before restoring or calling an old function/view because you found it in migration history, check `docs/RUNTIME-RETIREMENTS.md`, `docs/CODE-MAP.md`, and the current database dependency graph.
7. Convenience copies such as `old`, `backup`, `v2-final`, or renamed duplicate migrations are not allowed. Versioned historical migrations are the exception because their exact identity matters.
8. Before claiming a database change is applied, verify it against the project migration ledger and the resulting schema/behavior.

## Current reconciliation note

On 2026-09-15, source control was reconciled with the live Supabase migration ledger for these already-applied migrations that had been missing from the active branch:

- `20260915084212_guarded_match_runs_v6.sql`
- `20260915084213_assessment_v110_and_context.sql`
- `20260915084957_protect_official_risk_ratings_and_legacy_claim.sql`

On 2026-09-17, the active redesign branch was checked directly against `supabase_migrations.schema_migrations`. Recent M2/M4 migration source had drifted in timestamp naming and one applied M4 research-boundary migration was absent from the repository. The exact applied SQL was restored from the live ledger under its recorded versions:

- `20260915170353_milestone_2_research_rpc_hardening.sql`
- `20260916101953_m4_private_research_read_boundary.sql`
- `20260916113224_m4_scope_match_to_etf_universe.sql`
- `20260916115027_m4_goal_fit_v7_candidate.sql`
- `20260916115339_m4_goal_fit_v7_candidate_calibration.sql`
- `20260916115610_m4_promote_match_v7.sql`
- `20260916115930_m4_redact_context_only_match_scores.sql`

The non-ledger timestamp copies on this branch were removed after the exact live versions were restored. These are source-control repairs only: none of these already-applied migrations were re-run against the live database.

Later on 2026-09-17, Product Risk DNA research migrations were applied and the repository was reconciled to the exact live ledger versions:

- `20260917232138_product_risk_dna_modular_foundation.sql`
- `20260917232316_product_risk_sensor_evidence_service_policy.sql`
- `20260917232555_product_risk_modular_input_adapters.sql`
- `20260917233349_product_risk_shadow_evaluators.sql`
- `20260917233435_product_risk_shadow_drafts_and_consumer_contract.sql`
- `20260917235755_product_risk_etf_source_of_truth_calibration.sql`
- `20260917235954_product_risk_cross_asset_overall_calibration.sql`
- `20260918002215_product_risk_confidence_calibration.sql`
- `20260918003711_product_risk_bond_confidence_calibration.sql`
- `20260918004145_product_risk_tbill_confidence_calibration.sql`
- `20260918004312_product_risk_private_review_queue.sql`
- `20260918011635_product_risk_gic_source_confidence_calibration.sql`

The Product Risk runtime is deliberately shadow-only at this stage: draft profiles may be refreshed service-side, while public reads return only explicitly published profiles.


## Runtime retirement migrations

On 2026-09-16, a dependency-audited cleanup retired parallel/dead runtime without deleting historical migration evidence:

- `20260916000718_m4_retire_frozen_portfolio_runtime.sql`
- `20260916001531_m4_retire_legacy_app_views_and_home.sql`
- `20260916001822_m4_retire_legacy_match_runtimes.sql`
- `20260916002108_m4_retire_unused_match_helpers.sql`
- `20260916003509_m4_retire_stale_investment_intelligence_view.sql`

The exact objects removed, replacements, verification, and intentionally retained historical data are documented in `docs/RUNTIME-RETIREMENTS.md`.

In particular, older migrations still contain Portfolio Builder, Match v3/v4/v5/v5.1/v6 and the superseded `v_investment_intelligence` definition because that is their historical purpose. The current canonical Match runtime is v7 through `investor_private.current_match`, with Goal Fit v1 as its goal-role layer; current ETF Investment DNA signals come through `v_investment_dna_v2`. Do not resurrect a superseded implementation merely because its creation SQL remains in migration history.

## Workflow for new changes

Use the Supabase migration workflow described in `docs/DATABASE-AND-API.md`.

For a new schema/runtime change:

1. trace current callers/dependencies and role grants;
2. create a new focused migration;
3. apply it through the supported Supabase migration path;
4. verify the resulting schema/permissions/behavior;
5. run the relevant database regressions and Advisors;
6. update current architecture/code-map documentation;
7. if the change intentionally retires a live object, also update `docs/RUNTIME-RETIREMENTS.md`;
8. commit the migration together with the code/docs/tests that define the new current contract.
