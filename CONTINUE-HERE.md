# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical references: `docs/ARCHITECTURE.md`, `docs/PRODUCT-UX.md`, `docs/TESTING.md`, `docs/INVESTMENT-DNA-METHODOLOGY.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open/draft; do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active; engineering alone cannot close it.

M4 still needs real cognitive participants, later product-pilot evidence, a real external Magic Link/account canary and formal Canadian compliance/privacy review.

## Current product shape

- Platform: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v7`.
- Goal model: `goal-fit-v1`.
- Historical Match v6 remains server-side for reproducibility/A-B evidence only.
- Research catalog: 55 active instruments — 40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 Commercial Paper reference, 1 ABCP reference.
- Explore / Detail / Compare: cross-asset.
- Screener / DNA Match: explicitly ETF-only.
- Watchlist / Profile: asset-neutral.
- Stocks remain out of M4 scope.
- Portfolio Builder remains frozen/retired from callable runtime.

## Canonical audience journey

```text
Landing
 -> Investing DNA assessment
 -> Result
 -> Investment Context
 -> ETF DNA Match
 -> Explore / Detail / Compare
 -> optional Watchlist / Account persistence
```

## Match v7 — what changed

M4 hard testing found that v6 was safe/consistent but collapsed several distinct money goals into almost the same fixed-income ordering.

A versioned candidate was built instead of silently mutating v6:

- `20260916120500_m4_goal_fit_v7_candidate.sql`
- `20260916122500_m4_goal_fit_v7_candidate_calibration.sql`
- `20260916124500_m4_promote_match_v7.sql`
- `20260916130500_m4_redact_context_only_match_scores.sql`

`goal-fit-v1` now gives distinct structural role logic to:

- Growth;
- Retirement;
- Income;
- Wealth Preservation;
- Education;
- House Purchase;
- Major Purchase.

Education / House Purchase / Major Purchase are horizon-sensitive. Risk/safety gates remain separate and cannot be overridden by Goal Fit.

### v6 -> v7 A/B acceptance

Same assessment/context rows were run through both engines across:

```text
6 Investor DNA profiles x 7 goals x 4 horizons = 168 scenarios
```

After one Education edge-case calibration:

- status mismatches: 0;
- safety-review mismatches: 0;
- non-ETF/universe violations: 0;
- eligible hard-limit violations: 0;
- review-required score leaks: 0;
- tested non-growth goal groups with identical top-3 ordering dropped from 15 to 3.

A low-tolerance / long-horizon Education case initially became a false `no_suitable_options`; calibration shifted 5 percentage points from Growth to Stability in the 120+ month Education blend. The case then retained the verified zero-equity path without weakening the risk/exposure gate.

## Current Match runtime

```text
current app contracts
 -> investor_private.current_match(assessment_id)
 -> calculate_investment_match_v7(assessment_id)
 -> investor_private.goal_role_fit_v7(...)
 -> v_investment_dna_v2 (ETF-only)
 -> match_runs / investment_match_results
```

The temporary `current_match_v7_candidate()` wrapper was removed after promotion.

`v_investment_dna_v2`, Match payload `universe_count`, Match result rows and Match data-version fingerprint are ETF-only. The earlier M4 defect where all 55 cross-asset instruments entered Match/fingerprint is fixed by `20260916113000_m4_scope_match_to_etf_universe.sql`.

## Context-only score / browser presentation policy

No-context/DNA-only state remains `context_required`, but its internal ordering value is no longer exposed as an overall `/100` Match score through the canonical contract.

`current_match()` returns:

```text
context_only_score_policy = hidden_until_context_complete
```

and redacts row `match_score` values until money context is complete.

Browser presentation is now centralized in `lib/match-presentation.ts`:

```text
context_required -> DNA-only
review_required  -> Review
available        -> numeric context-aware Match
```

Result, Match, ETF Screener and investment Detail all consume the same semantics. Context-required rows are no longer mislabeled as `Review`, and the Match page no longer calls the first DNA-only row `Closest match`.

## Context UI alignment with v7

The Context form now exposes every current v7 goal that the model can distinguish, including:

- `major_purchase`;
- `wealth_preservation`.

`emergency_reserve` remains a separate safety-sensitive goal rather than a synonym for wealth preservation.

Legacy stored `preservation` is presented as `wealth_preservation`, not emergency reserve. Legacy horizon values remain visible when editing rather than being silently remapped into a newer bucket. Current and historical context labels are formatted in `lib/dna-presentation.ts`.

## Safety behavior that must not regress

- `review_required` stops ranking and overall Match scores are null.
- essential-spending-at-risk gate stops ranking.
- critically short emergency buffer stops ranking.
- under-3-year horizon stops ranking for the current ETF-only universe.
- principal-protection required/unsure stops ranking.
- Risk Capacity can constrain risk; it never raises a target.
- shorter horizons monotonically reduce/equal the equity ceiling.
- low Risk Tolerance Growth can return `no_suitable_options` rather than a forced match.
- low-tolerance Income/Education can still retain a verified zero-equity path when it passes the other limits.

## Current ETF Match universe

- 40 active ETFs total.
- 16 `verified` and rankable under current data requirements.
- 20 `verified_partial` -> review-required.
- 4 `stale` -> review-required.

Incomplete/stale ETF data is not converted into a fake score.

## Permanent regression coverage

- `supabase/tests/milestone_1_engine_trust.sql` — canonical v7/versioning/cache/safety/ETF-boundary checks.
- `supabase/tests/m4_match_hard_stress.sql` — 18 adversarial v7 scenarios plus goal-differentiation assertions.
- `tests/funds-flow.cjs` — browser E2E covering DNA-only -> Context save -> context-aware Match -> Detail -> Screener -> Compare, plus account/watchlist continuity.
- `docs/TESTING.md` — records browser coverage and the 168-scenario v6/v7 A-B acceptance evidence.
- `docs/PRODUCT-UX.md` — canonical DNA-only/Review/numeric semantics and current goal set.
- `docs/INVESTMENT-DNA-METHODOLOGY.md` — canonical v7 / `goal-fit-v1` formulas and limitations.

## Browser E2E hardening result

The connected browser test now explicitly verifies:

1. before context, Match/Screener/Detail show `DNA-only`, no numeric overall `/100` score and no false `Review` label;
2. Context exposes `Major purchase` and `Wealth preservation`;
3. signed-in Context save sends the selected goal/horizon/liquidity/principal fields through the authenticated RPC;
4. the same account/session becomes context-aware after save;
5. Result and Match expose v7 numeric compatibility only after context;
6. Match -> Detail and Screener -> Compare remain connected;
7. account/watchlist retry and funnel analytics remain intact;
8. mobile viewport remains free of horizontal overflow/runtime errors.

Exact-head GitHub Actions verification for `eb1ddbb9afefc16ca6faeb74b9471b18b669f1b9` passed every CI step, including build, `test:flow`, `test:assessment`, the expanded `test:funds`, `test:m4` and `test:assets`.

## Security state

Latest intended M4 boundary:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2 account helpers;
- `SECURITY DEFINER` views: 0;
- RLS-enabled/no-policy INFO findings: 32 (service/admin tables included).

The two authenticated helpers remain deferred until real Magic Link ownership canary:

- `get_or_create_current_profile()`
- `is_current_profile(p_profile_id uuid)`

Do not change those semantics before the real external account canary.

## Account / Magic Link readiness

The first real account must come from Supabase Auth, not manual inserts. External inbox/link round trip is still not verified. Use `docs/AUTH-CANARY.md`.

Live account baseline before that canary is intentionally empty:

```text
auth users: 0
profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

## Cognitive pilot readiness

`COGNITIVE_V1_10` remains planned/invite-gated with zero real participants before recruitment. Use backend `P-...` participant code on moderator worksheets. Do not mutate v1.10 wording after evidence collection begins without a revised candidate version.

## Deployment status

The latest application changes are engineering-green in GitHub CI, but the corresponding Vercel build is currently blocked by the provider `build-rate-limit`. Treat this as **not deployed on the exact latest head** even though the previous v7 head had a successful deployment.

The Vercel connector also returns 403 for direct preview fetching in this chat, so a visual deployed-preview canary was not claimed. Once a latest-head deployment exists, exercise the actual preview separately; a mocked/local browser E2E is not a production canary.

Do not claim Magic Link canary PASS until a real external inbox/link round trip succeeds.

## High-priority follow-ups

1. Re-run/confirm Vercel deployment of the exact latest head after the provider build-rate-limit clears.
2. Exercise the deployed preview on the real DNA -> Context -> Match -> Detail -> Compare path.
3. Run real external Magic Link Canary A/B.
4. Run first 6 cognitive sessions.
5. Analyze Round 1 and revise only on documented evidence triggers.
6. Run 6 more cognitive sessions and freeze quantitative-pilot candidate.
7. Run planned 20–50 user product pilot after cognitive freeze.
8. Formal Canadian compliance/privacy review remains a launch gate.
9. Keep non-ETF assets research-only for personalized Match until a separately designed model exists.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
