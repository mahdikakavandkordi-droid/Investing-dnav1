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

Still missing for M4 closeout: real cognitive participants, subsequent product-pilot evidence, external email canary, remaining launch hardening and formal compliance/privacy review.

## Current product shape

- Platform brand: Investor DNA.
- Assessment: Investing DNA (`v1.10-cognitive-candidate`, `dna-v1.10-research`).
- Canonical Match: `investment-dna-match-v6`, currently ETF-only.
- Generic research universe: 55 active instruments (40 ETF, 4 GIC, 3 T-Bill, 6 Bond, 1 CP reference, 1 ABCP reference).
- Explore/Detail/Compare: cross-asset.
- Screener/Match: ETF-scoped.
- Watchlist/Profile: asset-neutral.

## Recent engineering work

Cross-asset research architecture was added without replacing the existing ETF Match path:

- shared structure profile;
- fixed-income terms;
- deposit/GIC terms;
- generic instrument read RPCs;
- centralized asset taxonomy in `lib/instrument-model.ts`;
- cross-asset browser and DB regressions;
- Watchlist RLS duplicate-policy cleanup.

A documentation/onboarding cleanup is now in progress. Canonical engineering docs live under `docs/README.md`.

## Verification status before the documentation-only commits

The cross-asset implementation reached a GitHub Actions run where contracts, typecheck, build and all browser suites (assessment, ETF flow, M4 transparency and cross-asset flow) passed.

The newest Vercel attempt at that point was blocked by a provider `build-rate-limit`; this was not an application compile failure, but it also means the newest head was not deployment-verified.

After documentation/code-readability commits, re-run/confirm CI on the final head before calling the branch engineering-green again.

## Known high-priority technical follow-ups

1. Make the questionnaire Edge Function return an explicit public DTO and stop exposing internal `weight`/raw localized fields to the browser.
2. Continue classifying/fixing the launch-relevant Supabase Advisor backlog; do not blindly change security-definer views without tracing permission dependencies.
3. Remove or fully deprecate legacy ETF-specific client/component names only after confirming no route/test dependency.
4. Verify a real deployed magic-link round trip with an external inbox when hosting can build the final head.
5. Keep source/as-of dates real; never manufacture freshness.

## Where to read next

- `README.md`
- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/ENGINEERING-GUIDE.md`
- `docs/DATABASE-AND-API.md`
- `docs/TESTING.md`
- `docs/MILESTONE-4-PILOT-EVIDENCE-PLAN.md`

If this snapshot conflicts with current code or canonical engineering docs, update this snapshot rather than preserving stale handoff text.