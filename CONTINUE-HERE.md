# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical references: `docs/ARCHITECTURE.md`, `docs/PRODUCT-UX.md`, `docs/TESTING.md`, `docs/INVESTMENT-DNA-METHODOLOGY.md`, `docs/MATCH-UX-REVIEW.md`.

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

The Result / Context / Match portion is now implemented as one continuous journey rather than a Result -> Context -> Result loop:

```text
Result without context
 -> Context (returnTo=/match)
 -> Match
```

If context already exists, Result exposes the context-aware Match as the primary next step and keeps Edit Context secondary. Entering Context from Match also returns to Match after save.

`returnTo` is restricted to known internal routes; arbitrary destinations are not accepted.

## Journey continuity / My DNA hub

Global `My DNA` still points to `/dna`, but `/dna` now acts as a continuity hub rather than always pretending the person is new.

- if the same browser session still has a guest result in memory, the primary action becomes `View my current DNA`;
- if a signed-in account has saved DNA, the primary action becomes `View my saved DNA`;
- if neither exists, the normal `Start as guest` / account entry choices remain;
- the pre-assessment explanatory copy remains neutral and unchanged, so this continuity work does not introduce archetype/result priming.

Guest privacy semantics are intentionally unchanged: the full guest report is not persisted in localStorage just to make navigation easier. Same-session client navigation can recover the in-memory result, while a full reload does not turn the guest report into durable persistence.

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

Browser presentation is centralized in `lib/match-presentation.ts`:

```text
context_required -> DNA-only
review_required  -> Review
available        -> numeric context-aware Match
```

The presentation helper is defensive: context/review state takes precedence over any accidental numeric score in the browser payload. Result, Match, ETF Screener and investment Detail consume the same semantics.

## Context UI alignment with v7

The Context form exposes every current v7 goal that the model can distinguish, including:

- `major_purchase`;
- `wealth_preservation`.

`emergency_reserve` remains a separate safety-sensitive goal rather than a synonym for wealth preservation.

Legacy stored `preservation` is presented as `wealth_preservation`, not emergency reserve. Legacy horizon values remain visible when editing rather than being silently remapped into a newer bucket. Current and historical context labels are formatted in `lib/dna-presentation.ts`.

## Match v7 UX hardening

The pre-pilot Match surface was reviewed from the user's perspective without changing Match v7 weights or Goal Fit formulas. Canonical review notes are in `docs/MATCH-UX-REVIEW.md`.

Current Match behavior:

- before ETF cards, the page restates the exact money context driving the comparison: Goal, Time horizon, Access need and Principal protection;
- the user can edit that context directly from Match;
- `How this goal changes Match` displays the canonical `goal-fit-v1` summary from the Match payload, so the frontend does not invent a second explanation model;
- DNA-only rows hide both overall `/100` scores and the context-aware component-score block;
- available Match component labels are plain-language: `Risk level`, `Equity exposure`, `Goal fit`, `Diversification`;
- available cards no longer repeat a generic model summary that says the same thing for every ETF;
- card language is research-oriented: `Compare these more closely`, `Closest current fit`, `What to watch`, `What could change the fit?`, `Open ETF research`;
- valid no-match and review states still remain explicit rather than being softened into recommendations.

Goal Lens is sourced from `explanation.goal_fit.summary`. If Goal Fit text/formulas change in a future model version, update the versioned backend model rather than hard-coding parallel goal explanations in the UI.

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
- `tests/flow.cjs` — assessment recovery, Result -> Context -> Match continuity, guest `My DNA` hub continuity, account claim and pilot/browser contracts.
- `tests/funds-flow.cjs` — browser E2E covering DNA-only -> Context save -> context-aware Match -> Detail -> Screener -> Compare, account/watchlist continuity, visible money-context summary and Goal Lens.
- `docs/TESTING.md` — records browser coverage and the 168-scenario v6/v7 A-B acceptance evidence.
- `docs/PRODUCT-UX.md` — canonical DNA-only/Review/numeric semantics, journey continuity, explanation hierarchy and current goal set.
- `docs/MATCH-UX-REVIEW.md` — user-facing Match v7 UX findings and implemented fixes.
- `docs/INVESTMENT-DNA-METHODOLOGY.md` — canonical v7 / `goal-fit-v1` formulas and limitations.

## Browser E2E hardening result

The connected Chrome/Playwright tests now explicitly verify:

1. before context, Match/Screener/Detail show `DNA-only`, no numeric overall `/100` score and no false `Review` label;
2. DNA-only Match cards do not expose context-aware component scores;
3. Result without context points the user into Context with a safe `returnTo=/match` target;
4. Context exposes `Major purchase` and `Wealth preservation`;
5. guest and signed-in Context saves send goal/horizon/liquidity/principal fields through the correct ownership contract;
6. after Context save, the user lands directly on `/match` instead of looping back through Result;
7. safety-sensitive saved context can land directly in the review-required Match state without leaking a numeric score;
8. the same account/session becomes context-aware after a normal valid context save;
9. Match visibly restates Major Purchase / More than 10 years / Low access need / no principal-protection requirement in the fixture;
10. the canonical Goal Fit summary is visible under `How this goal changes Match`;
11. the four plain-language component labels, watchout language and research CTA are present;
12. `My DNA` -> `/dna` exposes `View my current DNA` when a guest result still exists in memory and returns to Result without creating durable guest persistence;
13. Match -> Detail and Screener -> Compare remain connected;
14. account/watchlist retry and funnel analytics remain intact;
15. mobile viewport remains free of horizontal overflow/runtime errors.

Exact branch head `28201468c113610fbaa14bed8ba60170f2075c00` passed the full GitHub Actions verification after the journey/documentation updates: build, contract/hygiene/type checks, `test:flow`, `test:assessment`, `test:funds`, `test:m4` and `test:assets`.

Several intermediate browser-test failures during the journey change were useful contract discoveries rather than hidden application-build failures: one assertion accidentally matched `/match` inside the Context query string, one asserted before the Match loading state settled, one attempted a full guest reload that correctly discarded the in-memory report, and one still expected the retired Context -> Result path. Those regressions were corrected to test the intended privacy and navigation contracts rather than weakening the product behavior.

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

GitHub CI is green for the latest verified branch head above, including localhost Next.js + real Chrome/Playwright flows.

A fresh Vercel verification was attempted on 2026-09-16 after the journey changes, but the Vercel connector returned `403 Forbidden` and explicitly requires re-authentication for the project/team scope. Therefore the previous provider build-rate-limit observation should not be treated as the current verified deployment state.

Until Vercel access is re-authenticated, local/CI browser verification remains the engineering acceptance path. A deployed-preview canary must still be run separately once connector access is restored.

Do not claim Magic Link canary PASS until a real external inbox/link round trip succeeds.

## High-priority follow-ups

1. Re-authenticate the Vercel connection for the project scope, confirm the latest branch deployment and exercise the deployed preview.
2. Continue targeted UX/product hardening in CI/local browser while deployment access is being restored.
3. Run real external Magic Link Canary A/B.
4. Run first 6 cognitive sessions.
5. Analyze Round 1 and revise only on documented evidence triggers.
6. Run 6 more cognitive sessions and freeze quantitative-pilot candidate.
7. Run planned 20–50 user product pilot after cognitive freeze.
8. Formal Canadian compliance/privacy review remains a launch gate.
9. Keep non-ETF assets research-only for personalized Match until a separately designed model exists.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
