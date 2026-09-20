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

The live `investing-dna-pilot` Edge Function is ACTIVE at version 23. Sprint 4 adds structured safety feedback plus server-enforced pilot cohort prerequisite checks.

Current Advisor snapshot:

- Security: 38 `rls_enabled_no_policy` INFO findings. The market refresh, returning-workspace and pilot cohort dependency tables are intentionally service-only with RLS and no browser policy. Existing service/internal findings still must be classified, not blindly opened.
- Security: leaked-password protection WARN is present. The current product is passwordless Magic Link, so this is not an active password-flow blocker; revisit if password auth is introduced.
- Security also reports one `extension_in_public` WARN for `pg_net`; the extension is non-relocatable in the current install, so it is classified as a scheduler-extension warning rather than worked around by weakening permissions.
- Performance: 41 `unused_index` INFO findings. The new refresh/retention indexes are young operational indexes; do not drop young/pilot indexes solely because the Advisor has not observed usage yet. The retention foreign-key coverage warning was fixed with `investor_workspace_item_state_investment_idx`.
- The browser-safe market status RPC was moved behind a SECURITY INVOKER public wrapper plus a private SECURITY DEFINER implementation; the Advisor no longer reports the public security-definer warnings for that endpoint.

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

## Daily market-data refresh workstream — 2026-09-19

A new branch `codex/daily-market-refresh-v1` adds the V1 post-close refresh infrastructure:

- live migrations `20260919162529_market_data_refresh_policy_v1` and `20260919162631_market_data_worker_audit_v1`;
- service-only asset/data cadence matrix;
- due-plan and automated-source-resolution RPCs;
- live `market-data-refresh` Edge Function v1 with service-role enforcement;
- canonical ingestion through the existing source-priority-aware `ingest_price_history_batch` contract;
- gated GitHub schedule at 01:30 UTC Tue-Sat;
- backend regression and operational documentation.

Update: the temporary zero-cost Canadian ETF route `yahoo_free` is now operational using Yahoo Finance `.TO` symbols. Supabase Cron owns the post-close schedule via a Vault-held random worker token; no paid data credential or GitHub secret is required. The controlled VFV canary completed with 4/4 rows and 0 errors, then the full 40-ETF catch-up completed with 200/200 rows and 0 errors. All 40 ETFs now have latest price-history date 2026-09-18. The source is priority 90 and cannot replace higher-priority verified rows for the same date. Treat it as a pre-funding research bridge, not launch-grade licensed market data.

## Maturity Sprint 1 — 2026-09-19

Branch `codex/maturity-sprint-1` / Draft PR #9 is stacked on the daily market refresh branch.

Implemented so far:

- signed-in Home now becomes a returning-user workspace with restored Investor DNA, goal/context state, Watchlist count and current Match;
- authenticated workspace state is loaded from server-owned account state and survives page reload;
- new live migration `20260919175743_browser_market_price_status_v1.sql` exposes only browser-safe latest price/date/source provenance for requested active investments;
- Explore / Detail / Compare overlay the latest audited daily close/volume/change from price history and fall back to the older research snapshot if the market-status read is unavailable;
- Explore shows `Price updated after close · <date>` for ETFs;
- Detail separates market-price freshness from slower research-input dates and labels the temporary free feed without presenting it as an official issuer source;
- Funds E2E now covers latest-price provenance plus returning Home reload continuity;
- Supabase regression passes with the new browser read model while operational ingestion tables/functions remain private.

Live VFV market status currently resolves to 2026-09-18, CAD 190.070007..., source `yahoo_free`.

The real hosted Magic Link canary is still partial. Mocked browser continuity is stronger now, but it is not a substitute for proving sign-out/fresh-sign-in persistence against the deployed app.

## Maturity Sprint 2 — 2026-09-19

Branch `codex/maturity-sprint-2-retention` / Draft PR #10 is stacked on Maturity Sprint 1.

Implemented:

- authenticated **Since your last visit** return loop on Home;
- server-owned `investor_workspace_state` and per-saved-investment `investor_workspace_item_state`;
- authenticated `app_open_returning_workspace()` ownership boundary using `auth.uid()`;
- per-item price-date baselines so a lagging ETF that catches up is not missed by a global max-date shortcut;
- Match change detection uses the canonical input fingerprint, not a regenerated run ID;
- current-session browser caching prevents repeated Home visits in one sitting from advancing the baseline;
- sign-out clears the cache;
- live pilot analytics now allow `workspace_viewed` and `workspace_resume_clicked` with narrow non-PII metadata;
- `investing-dna-pilot` is ACTIVE at version 21;
- pilot evidence query defines an actual return as a distinct browser session at least six hours later and adds workspace-resume metrics;
- pilot data dictionary promoted to v1.2 with explicit operational/non-psychometric classification for analytics and returning-workspace state;
- pilot privacy page now explains the signed-in continuity snapshot and same-session browser cache;
- public market-status RPC hardened to SECURITY INVOKER wrapper + private implementation;
- retention FK now has a covering index.

Live controlled retention regression (transaction rolled back) proved:
- first workspace open => returning=false, 1 saved item, 0 new market updates;
- after a newer VFV price row => returning=true, 1 new market update, VFV returned in updated_saved_items.

Backend regression remains PASS.

## Maturity Sprint 3 — 2026-09-19

Branch `codex/maturity-sprint-3-auth-canary` / Draft PR #11 is stacked on Sprint 2.

- hosted Magic Link callback now emits privacy-minimized `auth_callback_session_established` evidence after a real browser session exists;
- `account_state_restored` is emitted only after account state and Watchlist state both load successfully;
- Auth callback token fragments remain scrubbed from the visible URL;
- `docs/AUTH-CANARY-EVIDENCE.sql` provides privacy-minimized server-side evidence queries;
- exact-head CI for commit `8943603691c8c87b8e65b9ff65cac6bd0b7a3658` passed in run `35462289927`;
- the real hosted canary remains PARTIAL until the same-browser external-email sign-out/sign-in round trip is completed.

## Maturity Sprint 4 — 2026-09-19

Branch `codex/maturity-sprint-4-pilot-readiness` is stacked on Sprint 3.

Implemented:

- live migration `20260919185629_pilot_readiness_measurement_v1.sql` adds two structured Match-safety comprehension fields and service-only `service_pilot_measurement_snapshot(cohort_code)`;
- live migration `20260919185813_pilot_cohort_prerequisite_gate_v1.sql` adds generic cohort dependencies so a future product-pilot cohort cannot open before its prerequisite research cohort is complete/frozen;
- the Edge Function enforces the prerequisite gate before creating a pilot participant/session;
- `investing-dna-pilot` is ACTIVE at version 23;
- feedback now directly measures whether Match was interpreted as a directive to buy or its score as expected future return/performance;
- pilot data dictionary v1.3 classifies the new fields as operational product-validation evidence, excluded from psychometric scoring/validation;
- `supabase/tests/pilot_readiness.sql` passes live, including a rollback-only future product-pilot dependency test;
- `docs/PILOT-OPERATIONS.md`, scorecard and evidence query pack now use the canonical measurement/gating workflow.

Current live evidence gate:

```text
COGNITIVE_V1_10: planned, target 12, 0 participants, 0 completed
DEV_V1_10: engineering-only, 6 participants, 4 completed
PRODUCT_PILOT_*: not created
```

Therefore the 20–50 user quantitative product pilot remains intentionally unopened. DEV event/funnel counts are instrumentation checks only and must not be treated as product-pilot rates.

Current Advisor snapshot after Sprint 4:
- 38 RLS/no-policy INFO findings, with the new dependency table intentionally service-only;
- 41 unused-index INFO findings, including the new dependency index which is too new to judge by usage.

## Maturity Sprint 5 — 2026-09-19

Branch `codex/maturity-sprint-5-portfolio-blueprint` / Draft PR #13 is stacked on Sprint 4.

Implemented:

- final Investor DNA report now includes **Part 3 · Portfolio Blueprint** after Applied DNA;
- `portfolio-blueprint-v1` creates More Defensive / Core / More Growth using only Equity, Fixed income and Cash;
- no Canada/US/international, sector or security-level weights are inferred;
- financial capacity and goal constraints cap exposure; full-principal-protection and emergency-reserve contexts fail safe to the Cash bucket rather than receiving market-risk assets for cosmetic scenario variety;
- contract tests include named personas plus thousands of risk/context combinations and enforce 100% totals, five-point increments and monotonic scenario guardrails;
- public methodology is available at `/research/portfolio-blueprint`;
- result report now exposes Download PDF, Print and Email PDF actions without requiring account creation;
- dedicated `investor-dna-report` Edge Function is ACTIVE at version 3 and authorizes guest capability or signed-in ownership before PDF generation;
- live migration `20260919210203_report_delivery_events_v1.sql` adds a service-only email-delivery audit using a one-way email hash rather than storing the raw recipient address;
- live `supabase/tests/report_delivery.sql` passes;
- Email PDF code path is present but remains unavailable until a transactional sender/API credential is configured; Download PDF/Print do not depend on that provider.

Vercel continues to report the Hobby build-rate-limit on recent exact heads. Do not equate that provider quota with an application compile failure. PR #13 exact-head CI must be checked before calling Sprint 5 engineering-green.
## Immediate follow-ups

1. Let the next successful Vercel deployment exercise the new deployment-status Preview canary.
2. Run real hosted Canary A and B in one browser/device using a controlled external inbox.
3. Configure controlled transactional email/custom SMTP before public pilot onboarding.
4. Mahdi performs the real mobile-device canary later; fix observed device issues rather than redesigning from screenshots.
5. Run the first six cognitive sessions and revise only on documented evidence triggers.
6. Complete the 12-session cognitive gate before the 20–50 user product pilot.
7. Formal Canadian compliance/privacy review remains a launch gate.

If this snapshot conflicts with current code or canonical docs, update this snapshot rather than preserving stale handoff text.
