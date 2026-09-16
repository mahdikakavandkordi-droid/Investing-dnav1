# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical architecture lives in `docs/ARCHITECTURE.md`; route/runtime navigation in `docs/CODE-MAP.md`; product-journey invariants in `docs/PRODUCT-UX.md`; intentional runtime removals in `docs/RUNTIME-RETIREMENTS.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR is open, draft and mergeable.
- Do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

M4 still needs real cognitive participants, later product-pilot evidence, a real external magic-link/account canary and formal Canadian compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Research universe: 55 active instruments — 40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 Commercial Paper reference, 1 ABCP reference.
- Explore / Detail / Compare: cross-asset.
- Screener / Match: ETF-scoped.
- Watchlist / Profile: asset-neutral.
- Stocks remain intentionally out of M4 scope.
- Portfolio Builder remains frozen and is not a callable runtime subsystem.

## Accepted audience journey after UX polish

```text
Landing
 -> Investing DNA assessment
 -> Result
 -> Investment Context
 -> ETF DNA Match
 -> Explore / Detail / Compare
 -> optional Watchlist / Account persistence
```

Canonical UX rules are in `docs/PRODUCT-UX.md`. Current invariants:

- deliver value before asking for an account;
- guest users can continue through same-session Result, Context, Match, Detail and Compare;
- account creation is for persistence/Watchlist/return visits, not a prerequisite for research value;
- do not expose archetype outcomes before assessment completion;
- Investment Context is separate from Investor DNA and must not alter Risk Tolerance;
- goal, time horizon, liquidity and principal-protection inputs are explicit with no realistic defaults;
- canonical time-horizon buckets match the backend contract;
- missing/NULL Match scores remain unavailable/review, never `0/100`;
- `review_required` pauses ranking and does not render a normal ranked ETF preview;
- same-session guest ETF fit persists across Match -> Detail and Match/Screener -> Compare;
- full guest result state is intentionally ephemeral; a hard refresh may lose the unsaved full result while the narrow claim ticket remains available for optional account attachment.

Explore now has client-side research search and uses the shared Investment DNA language rather than internal-model language.

## Context backend correction discovered during UX review

Match v6 requires `principal_required` for complete money context. The signed-in path is now ownership-scoped rather than relying on the guest Edge session flow.

```text
guest same-session DNA
 -> investing-dna-pilot / save_context
 -> assessment_id + server-issued session token validation

signed-in saved DNA
 -> public.app_save_current_investment_context(...)
 -> investor_private.save_current_investment_context(...)
 -> ownership derived from auth.uid()
```

Applied/source-controlled migration:

- `20260916004811_m4_current_account_context_rpc.sql`

Live verification confirmed the invoker wrapper, authenticated-only execute grant, private implementation and unchanged 55-instrument universe.

## Runtime / security boundaries

Assessment browser actions use `investing-dna-pilot` for `start`, `questionnaire`, `save_answers`, `submit`, guest `save_context`, `claim_assessment`, `track_event` and `submit_feedback`.

The public questionnaire DTO stays narrow; scoring weights, construct metadata and non-selected/internal model fields remain server-side.

The live Match chain remains singular:

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v6(assessment_id)
 -> match runs/results
```

Retired v3/v4/v5/v5.1 and unused parallel Match/portfolio/app-shell paths remain retired.

### M4 view-hardening pass

Three applied/source-controlled hardening migrations were added after caller/grant/dependency review:

- `20260916013121_m4_harden_internal_diagnostic_views.sql`
- `20260916021927_m4_harden_unused_reference_views.sql`
- `20260916022221_m4_harden_internal_research_helper_views.sql`

These removed direct browser grants and switched 14 low-risk/internal views to `security_invoker` without changing public product behavior. Live role-based smoke tests and the full browser suites pass after the changes.

Supabase `security_definer_view` Advisor findings moved **19 -> 5**.

The five remaining views are active core-path boundaries and must not be bulk-converted merely to zero an Advisor count:

- `v_investment_catalog`
- `v_investment_detail`
- `v_investment_screener`
- `v_investment_dna_v2`
- `v_investment_latest_income`

A transactional dry-run proved that converting `v_investment_latest_income` to `security_invoker` with browser grants removed breaks anonymous Explore because its source metadata includes `investment_data_sources`, which is intentionally not browser-readable. The other four sit directly in the live research/Match read chain. Reducing 5 -> 0 therefore requires a deliberate private-read-model/public-RPC boundary redesign, not more blind `ALTER VIEW` changes.

Latest security state:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2 — `get_or_create_current_profile`, `is_current_profile`;
- `SECURITY DEFINER` views: 5;
- RLS-enabled/no-policy INFO findings: 32.

The two authenticated definer helpers remain deferred until a real authenticated magic-link/account canary verifies current ownership/RLS behavior. Do not change them merely to reduce Advisor counts.

## Verification status

### Database

- live Context migration/permission smoke: PASS;
- live view-hardening role/grant checks: PASS;
- anon product RPC smoke after all three hardening batches: PASS for search, generic detail, Investment DNA, research context and compare;
- active universe counts remain ETF 40, GIC 4, T-Bill 3, Bond 6, Commercial Paper 1, ABCP 1;
- synthetic DB regression data is transactionally rolled back.

### GitHub CI

Full CI run **242** passed on commit:

`b2878001aca4c220abe381c205d8eb7f7ebf5478`

Passed gates:

- contract tests;
- repository hygiene;
- normal + strict unused-code TypeScript checks;
- optimized production build;
- guest Investing DNA / Context / claim browser flow;
- connected ETF / Match / Watchlist / Compare flow;
- M4 launch/trust surfaces;
- cross-asset Explore / Detail / Compare flow.

### Vercel

Vercel status on `b2878001aca4c220abe381c205d8eb7f7ebf5478` is **SUCCESS**.

## Documentation order when returning

1. `README.md`
2. `docs/README.md`
3. `docs/PRODUCT-UX.md`
4. `docs/CODE-MAP.md`
5. `docs/ARCHITECTURE.md`
6. `docs/ENGINEERING-GUIDE.md`
7. `docs/DATABASE-AND-API.md`
8. `docs/RUNTIME-RETIREMENTS.md`
9. `docs/TESTING.md`
10. `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md`
11. `docs/ASSESSMENT-METHODOLOGY.md`
12. `docs/INVESTMENT-DNA-METHODOLOGY.md`

## High-priority follow-ups

1. Run a real external magic-link/account canary before touching the two remaining authenticated definer helpers.
2. Design the private read-model/public RPC boundary required to harden the final five active `SECURITY DEFINER` views; do not bulk-convert them.
3. Treat the 32 RLS-enabled/no-policy INFO findings individually; many are intentionally service/admin/internal surfaces, so do not add meaningless permissive policies merely to clear the lint.
4. Start M4 human evidence: first 6 cognitive sessions, analyze, revise only if evidence requires it, then 6 more and candidate freeze.
5. After cognitive freeze, run the planned 20–50 user product pilot.
6. Formal Canadian compliance/privacy review remains a launch gate.
7. Keep new non-ETF assets research-only for personalized Match until user evidence justifies asset-specific Match adapters.
8. Keep Stocks out of the current M4 scope.

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
