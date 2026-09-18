# Continue here — 2026-09-16

This is the short-lived project handoff snapshot. Canonical references remain `docs/ARCHITECTURE.md`, `docs/PRODUCT-UX.md`, `docs/TESTING.md`, `docs/INVESTMENT-DNA-METHODOLOGY.md`, `docs/MATCH-UX-REVIEW.md` and `docs/AUTH-CANARY.md`.

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

M4 still needs real cognitive participants, later product-pilot evidence, completion of the real hosted account persistence canary, production-grade transactional email setup and formal Canadian compliance/privacy review.

## Current product shape

- Platform: **Investor DNA**.
- Assessment: **Investing DNA** (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Investment structural research profile: **Investment DNA**.
- Compatibility layer: **DNA Match**.
- Canonical Match: `investment-dna-match-v7`.
- Goal model: `goal-fit-v1`.
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

Result -> Context -> Match is continuous. A guest can receive core value before account creation. Same-session client navigation keeps the completed guest result available across Result, Match, ETF Detail, Screener and the `/dna` continuity hub. The full guest report is intentionally not persisted across a full reload; durable continuity belongs to the optional account flow.

## Match v7 contract

```text
context_required -> DNA-only; numeric overall score hidden
review_required  -> Review; ranking paused; numeric score hidden
available        -> numeric context-aware Match
```

`current_match()` returns `context_only_score_policy = hidden_until_context_complete` for the no-context consumer state. Match language remains compatibility/research language, not a recommendation or return forecast.

When context is complete, Match shows Goal, Time horizon, Access need and Principal protection before ETF cards. Goal Lens comes from backend `explanation.goal_fit.summary` (`goal-fit-v1`).

## Latest audience-flow hardening

- Result without context points directly to Context with `returnTo=/match`.
- Saving Context returns directly to Match.
- Same-session guest DNA remains available in Screener as it does in Match and ETF Detail.
- `Closest DNA fit` sorting appears only when Match status is `available`.
- Review/no-suitable states use warning presentation rather than available/OK treatment.
- Full reload still intentionally discards the completed guest report.

## Account / email auth redesign

The Profile page no longer asks the user to decide between separate `Sign in` and `Create account` modes before entering an email.

Current signed-out flow:

```text
email
 -> one Continue/create-or-sign-in action
 -> newest one-time email link
 -> authenticated Profile
```

Behavior:

- existing email signs in;
- new email can create an account after confirmation;
- incoming investment and limited DNA-claim intent are preserved;
- after send, the UI explains that the newest one-time email must be used and should return in the same browser;
- if a mail app opens another browser, the UI tells the user to copy the link into the browser holding the app session;
- resend has a visible 60-second cooldown;
- expired/used-link and provider rate-limit errors are converted to recovery-oriented copy instead of raw provider text;
- successful auth token fragments are removed only after a real authenticated user exists.

Latest product/auth code head verified before the documentation-only evidence commits:

`ee262577a2b8bb4b3abb557f61228d327aa3092a`

Evidence on that exact code head:

- full repository `verify`: run `35143507907` — PASS;
- protected deployed `preview-canary`: run `35143507870` — PASS.

The deployed canary covers:

```text
Assessment -> Result -> DNA-only Match -> Context -> context-aware Match
-> ETF Detail -> Match -> Screener -> Compare -> My DNA
```

The deployed canary still intercepts Supabase requests; it proves deployed frontend/routes/SPA continuity, not real Auth/data persistence.

## Real hosted Auth canary — PARTIAL, not PASS

A controlled external attempt on 2026-09-16 proved:

- real Supabase Auth email request accepted: PASS;
- external inbox delivery: PASS;
- initial `localhost:3000` Site URL problem: found and remediated;
- protected Vercel branch Preview added to the Supabase redirect allow-list;
- subsequent email carried the intended deployed `/profile?investment=...` destination: PASS;
- Supabase consumed the confirmation link and recorded one confirmed Auth user plus a real sign-in timestamp: PASS.

The callback then reached Vercel Deployment Protection in a different browser that did not hold the Preview share cookie. That means the app session itself was not proven. Repeated engineering retries also exposed the heavily restricted built-in Supabase SMTP rate limit.

Current aggregate live account state after the attempt:

```text
auth users: 1
profiles: 0
investor profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

Therefore **do not claim the real Magic Link/account canary passed**.

Canary A still needs:

```text
authenticated /profile in the app
 -> save VAB to real Watchlist
 -> sign out
 -> fresh sign in
 -> confirm VAB persists
```

Canary B still needs a real guest Investing DNA claim and persistence round trip.

Use `docs/AUTH-CANARY.md` for exact pass/fail boundaries. Do not commit email addresses, email links, access/refresh tokens or cookies.

## Security boundary

The two authenticated account helpers remain intentionally deferred until the real ownership canary is complete:

- `get_or_create_current_profile()`
- `is_current_profile(p_profile_id uuid)`

Do not change those ownership semantics before Canary A/B prove the intended hosted account path.

## Email infrastructure

The current built-in Supabase email provider is suitable only for limited engineering testing and demonstrated rate limiting during the canary attempt. Before public pilot account onboarding, configure a controlled transactional email provider/custom SMTP and normal sender-domain authentication/deliverability controls. Do not work around this by disabling email confirmation.

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

Permanent SQL regressions include `supabase/tests/milestone_1_engine_trust.sql` and `supabase/tests/m4_match_hard_stress.sql`.

## Cognitive pilot readiness

`COGNITIVE_V1_10` remains planned/invite-gated with zero real participants before recruitment. Do not silently mutate v1.10 wording after evidence collection begins; revise through a new candidate version if evidence requires changes.

## Immediate follow-ups

1. Finish hosted Canary A in one browser/session: Profile auth -> save VAB -> sign out -> fresh sign in -> persistence proof.
2. Run hosted Canary B for guest DNA claim/persistence.
3. Review the two deferred authenticated ownership helpers only after those canaries pass.
4. Configure production transactional email/custom SMTP before public pilot onboarding.
5. Run the first 6 cognitive sessions.
6. Analyze Round 1 and revise only on documented evidence triggers.
7. Run 6 more cognitive sessions and freeze the quantitative-pilot candidate.
8. Run the planned 20–50 user product pilot after cognitive freeze.
9. Formal Canadian compliance/privacy review remains a launch gate.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
