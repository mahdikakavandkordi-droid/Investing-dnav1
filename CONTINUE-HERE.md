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

The UX pass exposed a real contract gap: Match v6 requires `principal_required` for complete money context, while the old UI did not collect it consistently and signed-in returning users lacked a clean account-owned context update path.

Current paths:

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

Live smoke verification confirmed:

- migration ledger contains `20260916004811 / m4_current_account_context_rpc`;
- public `app_save_current_investment_context` exists and is `SECURITY INVOKER`;
- anon execute: false;
- authenticated execute: true;
- private implementation exists;
- active research universe remains 55 instruments with expected asset counts.

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

Latest security state:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2 — `get_or_create_current_profile`, `is_current_profile`;
- `SECURITY DEFINER` views: 19;
- RLS-enabled/no-policy INFO findings: 32.

The new signed-in Context wrapper did not add a public definer function. Do not batch-convert the remaining 19 views; classify each against callers, grants and RLS first.

## Verification status

### Database

- live Context migration/permission smoke: PASS;
- active universe counts: PASS — ETF 40, GIC 4, T-Bill 3, Bond 6, Commercial Paper 1, ABCP 1;
- prior M1/M4 security/runtime-retirement regressions remain the canonical DB proof set;
- synthetic DB regression data is transactionally rolled back.

### GitHub CI

Full final-head CI run **238** passed on commit:

`562f3b7ea4503fd91c88eb4ed98f1d01466b96ef`

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

Vercel commit status on `562f3b7ea4503fd91c88eb4ed98f1d01466b96ef` is **SUCCESS**. The earlier provider build-rate-limit is no longer the current deployment state.

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

1. Run a real external magic-link/account canary before changing the two remaining authenticated definer helpers merely to reduce Advisor counts.
2. Classify the remaining 19 `SECURITY DEFINER` views individually; do not batch-change them.
3. Start M4 human evidence: first 6 cognitive sessions, analyze, revise only if evidence requires it, then 6 more and candidate freeze.
4. After cognitive freeze, run the planned 20–50 user product pilot.
5. Formal Canadian compliance/privacy review remains a launch gate.
6. Keep new non-ETF assets research-only for personalized Match until user evidence justifies asset-specific Match adapters.
7. Keep Stocks out of the current M4 scope.

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
