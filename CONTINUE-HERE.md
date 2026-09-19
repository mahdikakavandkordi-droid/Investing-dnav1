# Continue here — 2026-09-19

This is the short-lived project handoff snapshot. Canonical references remain `docs/ARCHITECTURE.md`, `docs/PRODUCT-UX.md`, `docs/TESTING.md`, `docs/INVESTMENT-DNA-METHODOLOGY.md`, `docs/MATCH-UX-REVIEW.md`, `docs/AUTH-CANARY.md` and `docs/MOBILE-DEVICE-CANARY.md`.

## Current branch / merge state

- integration branch: `codex/integration-product-risk-platform-v1`
- mobile PR #7: merged
- mobile V1 squash merge: `7e4d165087c3c5e1e8411a24b3cb490cd06f9bf7`
- latest application/account-continuity runtime head: `df037a528490fdb5d39a19b8bf81d75d9ffe0795`
- commits after that runtime head are deployment-workflow/documentation hardening.

Post-merge cleanup updated legacy browser regressions to the mobile-first product flow rather than weakening the assertions.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active; engineering alone cannot close it.

M4 still needs real cognitive participants, later product-pilot evidence, completion of the real hosted account persistence canary, production-grade transactional email setup and formal Canadian compliance/privacy review.

## Mobile V1 / product state

Mobile V1 is merged and includes:

- compact branded top bar and five-tab app navigation;
- dedicated mobile Home/workspace;
- focused assessment flow;
- mobile-first Explore, Detail, Watchlist, Match, Compare and Screener;
- progressive disclosure for deep research and Match context;
- loading/empty/error/signed-out states;
- save-intent continuity through optional account entry;
- iPhone safe-area, input-zoom, touch and landscape hardening.

Automated screenshot review is not a substitute for a real-device product judgment. Use `docs/MOBILE-DEVICE-CANARY.md` when Mahdi tests on his phone.

## Engineering verification

The mobile/device hardening head `228a7f5acab95cf78a79126b2b7b652a8ca99216` passed:

- full repository CI: run `35443635055` — PASS;
- Visual UI Audit: run `35443635036` — PASS.

The later account-continuity runtime head `df037a528490fdb5d39a19b8bf81d75d9ffe0795` also passed:

- full repository CI: run `35443984755` — PASS;
- Visual UI Audit: run `35443984749` — PASS.

Its Vercel deployment `dpl_DsfHBE4CAj7nGpLLzRAq8Z9ZXh6X` is `READY`.

## Deployment canary

The old push-triggered Preview canary was prone to testing a stale branch alias when Vercel rate-limited a build. It has been replaced with a deployment-driven gate:

```text
Vercel successful deployment
 -> GitHub deployment_status event
 -> checkout exact deployment SHA
 -> use exact deployment target_url
 -> establish Vercel automation bypass
 -> run deployed Playwright journey
```

This canary should not be called green until a successful deployment event runs the new workflow to completion. Provider build-rate-limit is a deployment-state issue, not evidence of an application compile failure.

## Live Supabase state — 2026-09-19

Project `bxjjannguzzzqsamnhem` is `ACTIVE_HEALTHY`.

Aggregate account-canary state:

```text
auth users: 1
profiles: 0
investor profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
pilot feedback rows: 0
```

The real Magic Link/account canary therefore remains **PARTIAL, not PASS**.

The live `investing-dna-pilot` Edge Function is ACTIVE at version 20, and its live `index.ts` plus `deno.json` exactly match the repository copies.

Current Advisor snapshot:

- Security: 32 `rls_enabled_no_policy` INFO findings. Many are service/internal tables and must be classified, not blindly opened with browser policies.
- Security: leaked-password protection WARN is present. The current product is passwordless Magic Link, so this is not an active password-flow blocker; revisit if password auth is introduced.
- Performance: 38 `unused_index` INFO findings. Do not drop young-pilot indexes solely because the Advisor has not observed usage yet.

No ownership/RLS semantics should be changed merely to make Advisor counts smaller.

## Real hosted Auth canary

Canary A still needs:

```text
authenticated /profile in the app
 -> save an investment to real Watchlist
 -> sign out
 -> fresh sign in
 -> confirm persistence
```

Canary B still needs:

```text
guest Investing DNA result
 -> account email link in the same browser/device
 -> claim assessment
 -> sign out
 -> fresh sign in
 -> confirm saved DNA is restored
```

The Profile email flow now explicitly tells the user to keep the current tab open, use the newest link in the same browser/device, exposes a 60-second resend cooldown, and lets the user change the email address.

Do not change the two deferred authenticated ownership helpers until Canary A/B prove the intended hosted path.

## Immediate follow-ups

1. Let the next successful Vercel deployment exercise the new deployment-status Preview canary.
2. Run real hosted Canary A and B in one browser/device using a controlled external inbox.
3. Configure controlled transactional email/custom SMTP before public pilot onboarding.
4. Mahdi performs the real mobile-device canary later; fix observed device issues rather than redesigning from screenshots.
5. Run the first six cognitive sessions and revise only on documented evidence triggers.
6. Complete the 12-session cognitive gate before the 20–50 user product pilot.
7. Formal Canadian compliance/privacy review remains a launch gate.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
