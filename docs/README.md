# Investor DNA documentation map

This directory contains three different kinds of documentation. Keep them separate when reading or changing the system.

## Canonical engineering documentation

These files describe how the product works **now** and are the first place a new engineer should read.

1. [`../README.md`](../README.md) — repository entry point, local setup and current product state.
2. [`CODE-MAP.md`](CODE-MAP.md) — concrete route → module → RPC/Edge action → database → test navigation map; start here when returning to a specific feature.
3. [`ARCHITECTURE.md`](ARCHITECTURE.md) — end-to-end system architecture, product flows and code ownership boundaries.
4. [`ENGINEERING-GUIDE.md`](ENGINEERING-GUIDE.md) — coding rules, naming rules, change checklist and documentation policy.
5. [`DATABASE-AND-API.md`](DATABASE-AND-API.md) — Supabase schemas, trust boundaries, RPC/Edge Function conventions and migration rules.
6. [`TESTING.md`](TESTING.md) — contract, browser, database and CI verification strategy.
7. [`RUNTIME-RETIREMENTS.md`](RUNTIME-RETIREMENTS.md) — intentional runtime removals, their replacements, and historical data that must not be mistaken for live code.
8. [`INVESTOR-DNA-ASSET-ARCHITECTURE.md`](INVESTOR-DNA-ASSET-ARCHITECTURE.md) — cross-asset taxonomy and Investment DNA extension contract.
9. [`ASSESSMENT-METHODOLOGY.md`](ASSESSMENT-METHODOLOGY.md) — assessment methodology and research-version rules.
10. [`INVESTMENT-DNA-METHODOLOGY.md`](INVESTMENT-DNA-METHODOLOGY.md) — investment-profile methodology and source-of-truth rules.
11. [`../DEPLOY.md`](../DEPLOY.md) — deployment and environment checklist.
12. [`../CONTINUE-HERE.md`](../CONTINUE-HERE.md) — current work state and immediate blockers. Keep this short and current.

Folder-level maps also exist in `app/README.md`, `components/README.md`, `lib/README.md`, `supabase/README.md` and `tests/README.md`.

## Product/research operating documentation

These are active operating documents rather than source-code architecture:

- `COGNITIVE-TEST-PROTOCOL.md`
- `PILOT-OPERATIONS.md`
- `M4-COGNITIVE-SESSION-WORKSHEET.md`
- `M4-PILOT-SCORECARD.md`
- `M4-PRELAUNCH-CHECKLIST.md`
- `M4-COMPLIANCE-REVIEW-BRIEF.md`
- `MILESTONE-4-PILOT-EVIDENCE-PLAN.md`

## Historical evidence and milestone reports

These files are evidence of what was tested or accepted at a point in time. They are **not the canonical architecture reference** when they conflict with current code or the engineering docs above.

- `MILESTONE-1-ENGINE-TRUST-REPORT.md`
- `MILESTONE-2-PRODUCT-VALUE-REPORT.md`
- `MILESTONE-3-PILOT-LAUNCH-READINESS-REPORT.md`
- `M4-CROSS-ASSET-RESEARCH-EXPANSION.md`

Do not silently rewrite historical reports to make them look current. Add a new report only when it records a real acceptance/evidence checkpoint; otherwise update the canonical engineering documentation.

## Version hygiene

Git history is the archive for ordinary source/docs. Do **not** keep convenience copies such as:

- `*-old.*`
- `*-backup.*`
- `*-copy.*`
- `*-final-final.*`
- `*-v2.*` / `*-v3.*` when the number is not a persisted product contract

Delete the superseded file after callers/references have moved to the canonical implementation.

Versioned artifacts are retained only when the version is materially required for reproducibility or evidence, including:

- applied Supabase migrations;
- persisted questionnaire/scoring/Match versions;
- controlled research protocols tied to the currently active research candidate;
- milestone/evidence reports that document a real historical acceptance state.

A historical convenience snapshot such as the former `HARD-TEST-V1.9.md` does not belong in the live tree once its useful content is covered by `TESTING.md` and milestone evidence.

## Documentation rule

A code change is not complete if it changes any of the following without updating its canonical documentation:

- a product flow or route;
- a public/internal API contract;
- a database table/view/RPC or ownership rule;
- an asset type or Investment DNA dimension;
- a questionnaire/scoring/Match version;
- a security/privacy boundary;
- a deployment requirement;
- a test or acceptance gate.

When retiring a runtime path, also update `RUNTIME-RETIREMENTS.md` so an engineer reading older migrations can distinguish historical creation from current architecture.

Prefer updating an existing canonical document over creating another overlapping document.
