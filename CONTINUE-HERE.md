# Continue here — 2026-09-15

This file is the short-lived project handoff snapshot. Canonical architecture belongs in `docs/ARCHITECTURE.md`; do not turn this file into another architecture document.

## Current branch / PR

- branch: `codex/platform-v4-account-continuity`
- PR: #2
- PR remains open and draft; do not merge without an explicit merge decision.

## Milestone state

- M1 Engine Trust: complete.
- M2 Product Value / connected research loop: complete from engineering acceptance perspective.
- M3 Controlled Pilot Readiness: complete from engineering/operations perspective.
- M4 Pilot Evidence & Pre-Launch Hardening: active and not closable by engineering alone.

Still missing for M4 closeout: real cognitive participants, subsequent product-pilot evidence, external email/account canary, remaining launch hardening and formal compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Generic research universe: 55 active instruments (40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 CP reference, 1 ABCP reference).
- Explore/Detail/Compare: cross-asset.
- Screener/Match: ETF-scoped.
- Watchlist/Profile: asset-neutral.
- Portfolio Builder: frozen during M4 and removed from current assessment/context/account-state response paths; historical migrations/functions remain preserved.

## Recent engineering work

Repository/version cleanup:

- duplicate `FundConnection.tsx` removed; `InstrumentConnection.tsx` is canonical;
- obsolete `docs/HARD-TEST-V1.9.md` removed;
- convenience `old`/`backup`/parallel-version copies are prohibited after callers migrate;
- applied migrations are explicitly treated as append-only reproducibility history rather than disposable old versions;
- three live-applied migrations that were missing from the active branch were restored under the exact Supabase ledger versions without re-running them:
  - `20260915084212_guarded_match_runs_v6.sql`
  - `20260915084213_assessment_v110_and_context.sql`
  - `20260915084957_protect_official_risk_ratings_and_legacy_claim.sql`

Browser/API boundary cleanup:

- questionnaire Edge Function returns only the narrow selected-language public DTO; scoring weight/internal construct/raw-localization fields stay server-side;
- public anonymous research RPC definer findings were reduced from 4 to 0 while anonymous search/compare/DNA/fund-facts reads were regression-verified;
- authenticated browser-callable definer findings were reduced from 11 to 2;
- legacy `app_save_investment_context`, `get_investor_home`, `get_investment_recommendations` and `promote_assessment_to_current_dna` no longer remain parallel browser APIs;
- `get_current_investor_app_state` is now a public authenticated invoker wrapper over `investor_private.current_investor_app_state`;
- official fund facts use a public invoker wrapper over a narrow private privileged implementation;
- completed guest claim/promotion no longer relies on browser `auth.uid()` inside the service-role path.

Account/Portfolio hardening:

- a completed guest assessment was transactionally claimed into a temporary profile against the live schema; current assessment pointer and Investor DNA snapshot were verified, then the transaction was rolled back;
- `complete_dna_assessment`, `service_save_investment_context` and current account-state no longer calculate/return Portfolio Builder output;
- the only remaining code reference to `generate_portfolio_blueprints` found in the live database is a service-role-only historical maintenance helper;
- `supabase/tests/m4_security_hardening.sql` passes on the live project with rollback and leaves no synthetic data behind.

## Security Advisor state

After the current M4 function/RPC hardening pass:

- anonymous browser-callable `SECURITY DEFINER` functions: 0 (was 4);
- authenticated browser-callable `SECURITY DEFINER` functions: 2 (was 11):
  - `get_or_create_current_profile`
  - `is_current_profile`
- `SECURITY DEFINER` views: 28 remain for individual classification;
- RLS-enabled/no-policy INFO findings: 33 remain, many intentionally service/admin/read-only and not to be changed blindly.

The two remaining authenticated helpers participate in current auth/ownership semantics and should be tested with a real account canary before changing solely to eliminate an Advisor count. No real `auth.users`/profile-linked users existed in the project at the time of this audit.

## Verification status

The last pre-hardening fully completed GitHub CI was green. Several database/source-control hardening commits have been added since; confirm CI on the final head before calling the branch engineering-green.

The latest observed Vercel status was blocked by the provider build-rate limit (`Deployment rate limited — retry in 24 hours`). This is not an application compile failure, but the current head is not deployment-verified until Vercel accepts a new build.

## Known high-priority follow-ups

1. Wait for/confirm final-head GitHub CI after the latest source/doc changes.
2. Classify the 28 `SECURITY DEFINER` views individually; do not batch-convert them without tracing underlying grants/RLS.
3. Run the real deployed magic-link/account canary with an external inbox when hosting can build the final head; use it to verify the remaining two auth helpers in real identity context.
4. Review remaining Performance Advisor findings after the current DB changes.
5. Keep source/as-of dates real; never manufacture freshness.
6. Preserve historical questionnaire/scoring/Match data and applied migrations only where reproducibility requires them; do not reintroduce duplicate live implementations.
7. Complete M4 human evidence gates: 6 cognitive sessions, review/revision decision, 6 further sessions, candidate freeze, then the 20–50 user product pilot.

## Where to read next

- `README.md`
- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/ENGINEERING-GUIDE.md`
- `docs/DATABASE-AND-API.md`
- `docs/TESTING.md`
- `docs/M4-PRELAUNCH-CHECKLIST.md`
- `docs/MILESTONE-4-PILOT-EVIDENCE-PLAN.md`

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.
