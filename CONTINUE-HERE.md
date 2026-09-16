# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical references remain `docs/ARCHITECTURE.md`, `docs/PRODUCT-UX.md`, `docs/TESTING.md`, `docs/INVESTMENT-DNA-METHODOLOGY.md` and `docs/MATCH-UX-REVIEW.md`.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open/draft.
- Do **not** merge without an explicit merge decision from Mahdi.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active; engineering alone cannot close it.

M4 still needs real cognitive participants, later product-pilot evidence, a real external Magic Link/account round trip and formal Canadian compliance/privacy review.

## Current product shape

- Platform: **Investor DNA**.
- Assessment: **Investing DNA** (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v7`.
- Goal model: `goal-fit-v1`.
- Historical Match v6 remains server-side for reproducibility/A-B evidence only.
- Research catalog: 55 active instruments — 40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 Commercial Paper reference, 1 ABCP reference.
- Explore / Detail / Compare: cross-asset.
- Screener / DNA Match: ETF-only.
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
 -> Explore / Detail / Screener / Compare
 -> optional Watchlist / Account persistence
```

Result -> Context -> Match is a continuous journey:

```text
Result without context
 -> Context (returnTo=/match)
 -> Match
```

If context already exists, Result exposes the context-aware Match as the primary next step and keeps Edit Context secondary. Context entered from Match also returns directly to Match after save. `returnTo` is allowlisted to internal product routes.

## Guest continuity and privacy contract

A guest can receive core product value before creating an account. Same-session client navigation keeps the completed guest result in memory so Result, Match, ETF Detail, Screener and the `/dna` continuity hub can use it.

The full guest report is intentionally **not** persisted in localStorage after completion. A full reload is therefore allowed to discard the guest result. Durable continuity belongs to the optional account flow.

The `/dna` hub now behaves as follows:

- same-session guest result -> `View my current DNA`;
- signed-in saved DNA -> `View my saved DNA`;
- no current/saved DNA -> normal assessment start choices.

The ETF Screener consumes the same in-memory guest Match state as Match and ETF Detail, so a guest who navigates there through the SPA keeps the current-session DNA compatibility layer without being forced to create an account.

## Match v7 contract

Match v7 is ETF-only and uses `goal-fit-v1`. The Match v7 consumer contract keeps these states distinct:

```text
context_required -> DNA-only; numeric overall score hidden
review_required  -> Review; ranking paused; numeric score hidden
available        -> numeric context-aware Match
```

`current_match()` returns `context_only_score_policy = hidden_until_context_complete` for the no-context consumer state. Internal persisted comparison values may still exist for ordering/reproducibility; they are not exposed as a personalized overall Match score.

When context is complete, the UI shows the exact money context driving Match before ETF cards: Goal, Time horizon, Access need and Principal protection. Goal Lens text comes from `explanation.goal_fit.summary` in the backend payload rather than a second frontend model.

The browser contract in `lib/dna.ts` now explicitly includes `goal_model_version`, `context_only_score_policy` and `explanation.goal_fit` so the TypeScript contract matches the canonical Match v7 payload.

Match language remains compatibility/research language, not a recommendation or return forecast.

## Final Result -> Context -> Match UX audit

The latest audience-flow audit found and fixed the remaining continuity/presentation issues rather than changing Match weights or Goal Fit formulas:

- Result without context points directly to Context with `returnTo=/match`;
- saving Context returns directly to Match;
- same-session guest DNA now remains available in Screener just as it does in Match and ETF Detail;
- Screener no longer says only a saved DNA can add compatibility;
- `Closest DNA fit` sorting is available only when Match status is actually `available`; it is hidden in DNA-only/review states;
- Screener review/no-suitable states use warning presentation instead of the available/OK treatment;
- full reload still intentionally discards the completed guest report, preserving the privacy contract.

## Match v7 engineering evidence

The v6 -> v7 A/B acceptance grid used identical inputs across:

```text
6 Investor DNA profiles x 7 goals x 4 horizons = 168 scenarios
```

After Education calibration:

- status mismatches: 0;
- safety-review mismatches: 0;
- non-ETF/universe violations: 0;
- eligible hard-limit violations: 0;
- review-required score leaks: 0;
- tested non-growth goal groups with identical top-3 ordering dropped from 15 to 3.

Permanent SQL regressions include:

- `supabase/tests/milestone_1_engine_trust.sql`
- `supabase/tests/m4_match_hard_stress.sql`

The Match universe is exactly the 40 active ETFs in `v_investment_dna_v2`; non-ETF research assets remain research-only for personalized compatibility.

## Browser and deployed-preview verification

Local/CI Chrome coverage includes:

- assessment and guest recovery;
- Result -> Context -> Match continuity;
- DNA-only vs Review vs numeric Match semantics;
- guest `My DNA` continuity;
- signed-in Context ownership path;
- Match -> ETF Detail;
- same-session guest Match -> Screener continuity;
- Screener -> Compare;
- account/watchlist retry behavior;
- cross-asset Explore/Detail/Compare;
- mobile overflow/runtime checks.

A protected Vercel Preview canary is source-controlled in:

- `.github/workflows/preview-canary.yml`
- `tests/run-deployed-preview-canary.cjs`
- `tests/deployed-preview-flow.cjs`

The repository secret `VERCEL_PREVIEW_SHARE_TOKEN` is used at runtime to enter the protected Preview; the share credential is not committed or printed.

The deployed canary uses real Chrome against the Vercel branch Preview while intercepting Supabase requests, so it does not create real assessments, send email or mutate the live database.

Latest product-code head `eff0f498a9d5939f181c5cf8f1a9cf2a6a349810` passed:

- `preview-canary` — run `35127527010`;
- full repository `verify` — run `35127527097`.

The deployed journey passed:

```text
Assessment -> Result -> DNA-only Match -> Context -> context-aware Match
-> ETF Detail -> Match -> Screener -> Compare -> My DNA
```

This proves deployed frontend/routes/SPA continuity plus the mocked browser/backend contract for that exact product-code head. It does **not** prove live Supabase RLS/data mutations or real email delivery.

## Security state

Current intended M4 boundary:

- anonymous browser-callable `SECURITY DEFINER` functions: 0;
- authenticated browser-callable `SECURITY DEFINER` functions: 2 account helpers;
- `SECURITY DEFINER` views: 0;
- RLS-enabled/no-policy INFO findings: 32, including service/admin tables.

The two authenticated helpers remain intentionally deferred until the real Magic Link ownership canary:

- `get_or_create_current_profile()`
- `is_current_profile(p_profile_id uuid)`

Do not change those ownership semantics before the real external account canary.

## Account / Magic Link readiness

The first real account must come from Supabase Auth, not manual inserts. Use `docs/AUTH-CANARY.md`.

The external inbox/link round trip is still **not verified**. Do not claim Magic Link canary PASS until a real email is delivered, opened and returns to an authenticated session that can exercise the intended ownership flow.

The pre-canary live account baseline is intentionally empty unless a real canary has since been run:

```text
auth users: 0
profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

## Cognitive pilot readiness

`COGNITIVE_V1_10` remains planned/invite-gated with zero real participants before recruitment. Use the backend `P-...` participant code on moderator worksheets. Do not silently mutate v1.10 wording after evidence collection begins; revise through a new candidate version if evidence requires changes.

## Immediate follow-ups

1. Run the real external Magic Link Canary A/B from `docs/AUTH-CANARY.md`.
2. Review the two deferred authenticated SECURITY DEFINER helpers only after that ownership evidence exists.
3. Run the first 6 cognitive sessions.
4. Analyze Round 1 and revise only on documented evidence triggers.
5. Run 6 more cognitive sessions and freeze the quantitative-pilot candidate.
6. Run the planned 20–50 user product pilot after cognitive freeze.
7. Formal Canadian compliance/privacy review remains a launch gate.
8. Keep non-ETF assets research-only for personalized Match until a separately designed model exists.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
