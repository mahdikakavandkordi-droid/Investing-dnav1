# Investing DNA — Milestone 1: Engine Is Trustworthy

**Date:** 15 September 2026  
**Status:** Engineering milestone complete; ready to proceed to Milestone 2 with the limitations below.  
**Canonical assessment:** `v1.10-cognitive-candidate` / `dna-v1.10-research`  
**Canonical match model:** `investment-dna-match-v6`  
**Applied migration:** `20260915163427_milestone_1_match_engine_canonicalization`

## What “complete” means

Milestone 1 establishes that the current engineering path produces one traceable match run, applies the intended financial/context safety gates, can refuse to rank investments, preserves unknown/review states instead of converting them into false numeric scores, and prevents browser clients from invoking obsolete match engines.

It does **not** mean that the questionnaire is psychometrically validated or that the product is ready to make regulated personalized investment recommendations. Those require real-user validation, compliance work and later launch hardening.

## Baseline audit findings

The audit found that the newest engine already contained important safety improvements, but the surrounding system was not fully canonical:

1. `calculate_investment_match` already routed to v6 and `investor_private.current_match` existed.
2. v1.10 already capped guarded Financial Capacity at 39 when Loss Impact was <=33 or Emergency Reserve was 0.
3. `get_investment_recommendations` and account/fund fit paths already used `current_match`.
4. `get_explainable_match` and `get_investment_match_intelligence` still hard-coded legacy `suitability-v2.3` results.
5. `capture_current_match_snapshot` stored the legacy model label `suitability-v2.3`.
6. `cleanup_match_result_versions` defaulted to preserving `suitability-v2.3`, creating a risk that a cleanup could remove the current v6 result set.
7. Legacy calculators v3/v4/v5/v5.1 were still executable by anonymous and authenticated browser roles.
8. Match cache invalidation fingerprinted user DNA/context/answers but did not include scoring-relevant fund data.
9. Review-required rows were returned to clients with a null score but stored in `investment_match_results` as `0`, conflating “not rankable” with a measured zero fit.
10. `supabase/tests/investor_platform_connections.sql` used a manually inserted fake `qa-rollback-only` match result. Once the current engine was enforced, that test correctly failed with `dna_result_not_found`, exposing a false-confidence test fixture.

## Changes completed

### 1. One canonical match source of truth

`investor_private.current_match(assessment_id)` is now the canonical read path. When a recalculation is needed it runs v6, then re-reads the persisted run and returns that stamped payload.

The public `calculate_investment_match` wrapper now routes through `current_match` rather than returning a separate unstamped calculation path.

### 2. Legacy readers moved to the current run

`get_explainable_match` and `get_investment_match_intelligence` now consume `current_match` and return the same `run_id`, `model_version`, fund-data version and version metadata as the rest of the application.

`capture_current_match_snapshot` now records the actual model version from the canonical payload.

`cleanup_match_result_versions` defaults to `investment-dna-match-v6` and refuses a non-current keep-model argument.

### 3. Obsolete browser-callable engines closed

Execute permission was revoked from `anon` and `authenticated` for the historical v3/v4/v5/v5.1 calculators and direct v6/current internal calculation functions. Historical functions remain available to trusted server/database roles for reproducibility.

### 4. Reproducible run metadata

New match runs are stamped with:

- questionnaire version
- Investor DNA model version
- scoring version
- match model version
- fund-data version/fingerprint
- fund-data as-of date
- run timestamp
- run ID

The payload exposes the same version bundle.

### 5. Fund-data-aware cache invalidation

A deterministic fingerprint of the scoring-relevant `v_investment_dna_v2` universe is now part of the match input fingerprint. A change to a scoring-relevant fund input invalidates the old cached run and generates a new run with a new `data_version`.

### 6. Correct null semantics

`investment_match_results.match_score` is now nullable. For v6 rows with `eligibility = review_required`, a database trigger preserves `match_score = NULL` rather than storing a fabricated zero.

### 7. v1.10 methodology documented

`docs/ASSESSMENT-METHODOLOGY.md` now reflects the live v1.10 engineering/research model, guarded-capacity rule, 40/70 provisional archetype boundaries, safety-gate architecture, explicit no-suitable state, reproducible run metadata and the distinction between engineering validation and psychometric validation.

### 8. Existing platform test repaired

The account/fund regression test now creates a real synthetic v1.10 assessment, calculates DNA, supplies complete investment context and verifies the canonical v6 fit. It no longer passes by manually inserting a fake match row.

## Regression tests executed against the real database

All test fixtures and data mutations below were wrapped in transactions and rolled back.

### Canonical/version tests — PASS

- v6 is the canonical match model.
- every canonical run exposes a `run_id`.
- run payload exposes questionnaire, DNA, scoring, match and fund-data versions.
- unchanged inputs reuse the same run.
- `get_explainable_match` returns the same run/model as `current_match`.
- `get_investment_match_intelligence` returns the same run/model as `current_match`.
- a scoring-relevant fund-data change changes the fund-data fingerprint/version and generates a new run.

### Capacity/safety tests — PASS

**Loss impact:** A high-risk-tolerance synthetic user with `RC05=A` was tested. Guarded Financial Capacity stayed <=39, the profile did not remain in a high-capacity archetype, the Match status became `review_required`, `essential_spending_at_risk` was present, and zero investments were eligible.

**Emergency reserve:** `RC03=A` produced `emergency_buffer_short`, `review_required`, and zero eligible investments.

**Short horizon:** A 24-month horizon produced `short_horizon`, an equity ceiling of 0, and `review_required`.

**Principal protection:** `principal_required=yes` produced `principal_protection_needed` and `review_required`.

### No-suitable-result test — PASS

A low-Risk-Tolerance, high-capacity, long-horizon growth scenario with no financial safety gate produced the explicit `no_suitable_options` state and zero eligible investments. The engine therefore does not force a recommendation.

### Null semantics test — PASS

For a review-required run, persisted v6 match rows had `match_score IS NULL`; the engine no longer stores those states as zero-fit results.

### Sensitivity sanity test — PASS

Changing one ordinary Risk Tolerance response by one response step moved the aggregate Risk Tolerance score by a modest amount (within the test ceiling of 5 points), while the critical capacity answer triggered the expected hard guard. This confirms the intended distinction between ordinary score sensitivity and safety constraints for the tested cases.

### Access-control test — PASS

Anonymous/authenticated roles could not execute legacy v4/v5.1 engines directly.

### Existing account/fund integration regression — PASS after repair

The real-database rollback test passed for public detail, unknown fund, anonymous denial, required identity, duplicate watchlist add, cross-account isolation, removal, protected internal RPCs, canonical v1.10/v6 investment fit, private fit isolation and raw match-view denial.

## Database advisor review

Supabase security/performance advisors were run after the migration.

The Match-engine changes did not introduce a new direct browser path to legacy calculators, and the browser-role regression checks passed. The project still has broader platform-level advisor findings that predate/extend beyond this milestone, including security-definer views/RPC warnings, duplicate or missing indexes and RLS performance warnings. Several exposed application RPCs are intentionally security-definer wrappers with their own ownership checks, but each advisor finding should still be classified and resolved or explicitly accepted before public production launch.

These platform-wide advisor findings are **not evidence that Milestone 1 Match safety failed**, but they are a launch-hardening backlog and should not be hidden.

## Psychometric status

Milestone 1 does not turn `v1.10-cognitive-candidate` into a validated psychometric instrument.

Still required:

1. cognitive testing (roughly 10–15 people / two rounds),
2. real pilot data (approximately n >=100 for initial item diagnostics),
3. reliability and structure work (prefer approximately n >=150+ for stronger analyses),
4. calibration of boundaries and safety heuristics using appropriate evidence and governance.

Until then, wording should remain “research candidate”, “compatibility signal”, or similar—not “scientifically validated risk assessment”.

## Go / No-Go decision

**GO for Milestone 2 (Product Is Valuable) from an engineering-engine perspective.**

The current path now has a coherent safety/eligibility model, one canonical match run, explicit version provenance, fund-data-aware invalidation, explainability readers tied to that run, an honest no-suitable state, and regression coverage for the highest-risk scenarios found in the audit.

**NO-GO for claiming scientific validation or full public-production readiness.** Psychometric validation, broader security/performance hardening, real-user end-to-end testing and product UX work remain separate gates.

## Files changed for Milestone 1

- `supabase/migrations/20260915163427_milestone_1_match_engine_canonicalization.sql`
- `supabase/tests/milestone_1_engine_trust.sql`
- `supabase/tests/investor_platform_connections.sql`
- `docs/ASSESSMENT-METHODOLOGY.md`
- `docs/MILESTONE-1-ENGINE-TRUST-REPORT.md`

## Recommended next milestone

Milestone 2 should focus on the product value layer rather than adding breadth: improve ETF data quality/look-through, make the Match page the hero experience, expose clear “why it fits / what conflicts / what would change it” explanations, personalize Screener/Compare with DNA context, and complete the returning-user loop before expanding into Portfolio Builder.
