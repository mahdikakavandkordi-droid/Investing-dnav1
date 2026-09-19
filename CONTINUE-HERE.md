# Continue here — 2026-09-19

This is the short-lived project handoff snapshot. Canonical references remain `docs/ARCHITECTURE.md`, `docs/PRODUCT-UX.md`, `docs/TESTING.md`, `docs/INVESTMENT-DNA-METHODOLOGY.md`, `docs/MATCH-UX-REVIEW.md`, `docs/AUTH-CANARY.md` and `docs/MOBILE-DEVICE-CANARY.md`.

## Current branch / merge state

- integration branch: `codex/integration-product-risk-platform-v1`
- mobile PR #7: merged
- mobile V1 squash merge: `7e4d165087c3c5e1e8411a24b3cb490cd06f9bf7`
- current integration head: `c5b411d87753ab6713a3227e5fd5c56af997eb75`
- current product/runtime code head before the docs-only canary checklist commit: `210ff15beea6759f7d12f191a1fbbabefde760a7`

Post-merge cleanup updated legacy browser regressions to the current mobile-first flow rather than weakening the assertions.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active; engineering alone cannot close it.

M4 still needs real cognitive participants, later product-pilot evidence, completion of the real hosted account persistence canary, production-grade transactional email setup and formal Canadian compliance/privacy review.

## Current product shape

- Platform: **Investor DNA**.
- Assessment: **Investing DNA**.
- Investment structural research profile: **Investment DNA**.
- Compatibility layer: **DNA Match**.
- Explore / Detail / Compare: cross-asset.
- Screener / DNA Match: ETF-only.
- Watchlist / Profile: asset-neutral.
- Portfolio Builder remains out of current V1 runtime.

## Mobile V1 status

The mobile experience is now merged into the integration branch.

Implemented:

- compact branded top bar;
- fixed five-tab navigation: Home / DNA / Explore / Watchlist / Profile;
- dedicated mobile Home/workspace;
- focused assessment with bottom app navigation hidden during questions;
- mobile-first Explore, Detail, Watchlist, Match, Compare and Screener;
- progressive disclosure for deeper investment research;
- compact Match money-context disclosure;
- signed-out/loading/empty/error states;
- mobile save-intent continuity after account entry;
- real-device viewport hardening for safe areas, iOS form zoom, touch interactions and landscape height.

Automated screenshot review is not a substitute for a real-device product judgment. Use `docs/MOBILE-DEVICE-CANARY.md` when Mahdi tests on his phone.

## Engineering verification

Latest fully completed repository CI before the real-device hardening pass:

- workflow run `35443174026` — PASS
- `npm test` — PASS
- Product Risk contract — PASS
- repository hygiene — PASS
- TypeScript + unused checks — PASS
- production build — PASS
- main flow — PASS
- assessment flow — PASS
- ETF/fund flow — PASS
- M4 launch flow — PASS
- cross-asset flow — PASS
- hard-user flow — PASS

The latest mobile real-device hardening commits must remain green under the same gates before they are treated as engineering-accepted.

## Deployment state

Vercel Git status may show build-rate-limit failures on some exact commits; do not interpret those as application compile failures.

A branch deployment on commit `c8fb2fcf1bd67b7022d73da78d1de790b27cc41a` reached Vercel `READY`. Later commits through the fully green `168895f...` head were test-only. The subsequent real-device hardening changes require a fresh accepted Vercel build before calling that exact head deployed.

Keep these states separate:

- repository CI green;
- Vercel build success;
- deployed preview canary passed;
- real email/account canary passed.

## Real hosted Auth canary

The real Magic Link/account canary remains incomplete. Do not claim it passed.

Canary A still needs:

```text
authenticated /profile in the app
 -> save an investment to real Watchlist
 -> sign out
 -> fresh sign in
 -> confirm persistence
```

Canary B still needs a real guest Investing DNA claim and persistence round trip.

Do not change the two deferred account ownership helpers until those canaries prove the intended hosted account path.

## Immediate follow-ups

1. Keep the real-device mobile hardening green in CI/visual audit.
2. Mahdi performs the real mobile-device canary later using `docs/MOBILE-DEVICE-CANARY.md`.
3. Fix only observed device/product issues from that pass rather than redesigning blindly from screenshots.
4. Finish hosted Auth Canary A and B in one real browser/session.
5. Configure controlled transactional email/custom SMTP before public pilot onboarding.
6. Run the first six cognitive sessions and revise only on documented evidence triggers.
7. Complete the 12-session cognitive gate before the 20–50 user product pilot.
8. Formal Canadian compliance/privacy review remains a launch gate.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
