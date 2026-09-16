# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical architecture lives in `docs/ARCHITECTURE.md`; concrete route/runtime navigation lives in `docs/CODE-MAP.md`; product-journey invariants live in `docs/PRODUCT-UX.md`; intentional runtime removals live in `docs/RUNTIME-RETIREMENTS.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open and draft; do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

M4 still needs real cognitive participants, product-pilot evidence, an external magic-link/account canary, remaining launch hardening and formal Canadian compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Generic research universe: 55 active instruments: 40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 Commercial Paper reference, 1 ABCP reference.
- Explore / Detail / Compare: cross-asset.
- Screener / Match: ETF-scoped.
- Watchlist / Profile: asset-neutral.
- Stocks remain intentionally out of the current M4 scope.
- Portfolio Builder remains frozen and no longer exists as a callable runtime subsystem. Only historical evidence/data required for reproducibility is retained.

## Product UX pass — current accepted journey

A full audience-first polish pass was completed before further backend expansion. The current intended journey is:

```text
Landing
 -> Investing DNA assessment
 -> Result
 -> Investment Context
 -> ETF DNA Match
 -> Explore / Detail / Compare
 -> optional Watchlist / Account persistence
```

Canonical UX rules are in `docs/PRODUCT-UX.md`. The most important current invariants are:

- deliver value before asking for an account;
- guest users can complete the assessment and continue through same-session Result, Context, Match, Detail and Compare;
- account creation is for persistence, Watchlist and returning later, not a gate in front of research value;
- do not expose archetype outcomes before the assessment;
- Investment Context is separate from Investor DNA and must not modify Risk Tolerance;
- goal, time horizon, liquidity and principal-protection choices are explicit; do not preselect realistic answers;
- canonical time-horizon buckets must match the backend contract;
- missing/NULL Match scores remain unavailable/review, never `0/100`;
- `review_required` pauses ranking and must not render a normal ranked ETF preview;
- same-session guest ETF fit must not disappear when moving Match -> Detail or Match/Screener -> Compare;
- full guest result state is intentionally ephemeral; a hard refresh may lose the unsaved full report while the narrow claim ticket remains available for optional account attachment.

User-facing copy and hierarchy were also simplified across Landing, `/dna`, Result, Context, Match, Explore, Detail and Compare. Explore now includes client-side research search and uses the shared Investment DNA language rather than internal-model language.

## Context backend correction discovered during UX review

The UX pass exposed a real contract gap: Match v6 needs `principal_required` for complete money context, while the old form did not collect it consistently and signed-in returning users lacked a clean account-owned context update path.

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

Live smoke verification confirms:

- migration `20260916004811 / m4_current_account_context_rpc` exists in the migration ledger;
- public `app_save_current_investment_context` exists and is `SECURITY INVOKER`;
- anon execute: false;
- authenticated execute: true;
- private implementation exists;
- live active research universe remains 55 instruments with the expected asset counts.

## Current runtime boundaries

### Investing DNA assessment

Browser routes call `investing-dna-pilot` for `start`, `questionnaire`, `save_answers`, `submit`, guest `save_context`, `claim_assessment`, `track_event` and `submit_feedback`.

The public questionnaire DTO stays narrow; scoring weights, construct metadata and non-selected localized/internal model fields remain server-side.

### DNA Match

The live Match chain is intentionally singular:

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v6(assessment_id)
 -> match runs/results
```

Retired v3/v4/v5/v5.1 and unused parallel Match/portfolio/app-shell paths remain retired. See `docs/RUNTIME-RETIREMENTS.md` before restoring anything created by an older migration.

## Security / Advisor state

Latest post-UX backend security check:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2:
  - `get_or_create_current_profile`
  - `is_current_profile`
- `SECURITY DEFINER` views: 19;
- RLS-enabled/no-policy INFO findings: 32.

The new signed-in Context wrapper did **not** add a public definer function.

Do not batch-convert the remaining 19 views to `security_invoker`; classify each against current callers, underlying grants and RLS semantics first.

## Verification status

### Database

- live Context migration/permission smoke passed;
- active research universe counts passed: ETF 40, GIC 4, T-Bill 3, Bond 6, Commercial Paper 1, ABCP 1;
- prior M1/M4 security and runtime-retirement regressions remain the canonical DB proof set;
- synthetic DB regression data is transactionally rolled back.

### GitHub CI

Full CI run **237** passed on commit:

`58818e7484d3f75e021b08a6eb395739373a3d40`

Passed gates:

- contract tests;
- repository hygiene;
- TypeScript;
- strict unused-code TypeScript gate;
- optimized production build;
- guest Investing DNA / Context / claim browser flow;
- connected ETF / Match / Watchlist / Compare flow;
- M4 launch/trust surfaces;
- cross-asset Explore / Detail / Compare flow.

This handoff update is a docs-only commit after that green run. Confirm CI on the final handoff head before calling the branch final-head green.

### Vercel

Git integration is still being rejected by provider build-rate limiting (`build-rate-limit`). GitHub production build is green, so this is not currently an application compile failure, but the newest head is not Vercel deployment-verified until the provider accepts a build.

## Documentation system

Start here when returning:

1. `README.md`
2. `docs/README.md`
3. `docs/PRODUCT-UX.md` — audience journey and UX invariants
4. `docs/CODE-MAP.md` — route -> module -> RPC/Edge -> DB -> test map
5. `docs/ARCHITECTURE.md`
6. `docs/ENGINEERING-GUIDE.md`
7. `docs/DATABASE-AND-API.md`
8. `docs/RUNTIME-RETIREMENTS.md`
9. `docs/TESTING.md`
10. `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md`
11. `docs/ASSESSMENT-METHODOLOGY.md`
12. `docs/INVESTMENT-DNA-METHODOLOGY.md`

## High-priority follow-ups

1. Confirm CI on this final handoff head.
2. Re-check Vercel when provider rate limiting permits a deployment.
3. Run a real external magic-link/account canary before changing the two remaining authenticated definer helpers merely to reduce Advisor counts.
4. Classify the remaining 19 `SECURITY DEFINER` views individually; do not batch-change them.
5. Start M4 human evidence: first 6 cognitive sessions, analyze, revise only if evidence requires it, then 6 more and candidate freeze.
6. After cognitive freeze, run the planned 20–50 user product pilot.
7. Formal Canadian compliance/privacy review remains a launch gate.
8. Keep new non-ETF assets research-only for personalized Match until user evidence justifies asset-specific Match adapters.
9. Keep Stocks out of the current scope; do not reopen them during M4.

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
