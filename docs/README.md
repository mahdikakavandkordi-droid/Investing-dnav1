# Investor DNA documentation map

This directory contains two different kinds of documentation. Keep them separate when reading or changing the system.

## Canonical engineering documentation

These files describe how the product works **now** and are the first place a new engineer should read.

1. [`../README.md`](../README.md) — repository entry point, local setup and current product state.
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) — end-to-end system architecture, product flows and code ownership boundaries.
3. [`ENGINEERING-GUIDE.md`](ENGINEERING-GUIDE.md) — coding rules, naming rules, change checklist and documentation policy.
4. [`DATABASE-AND-API.md`](DATABASE-AND-API.md) — Supabase schemas, trust boundaries, RPC/Edge Function conventions and migration rules.
5. [`TESTING.md`](TESTING.md) — contract, browser, database and CI verification strategy.
6. [`INVESTOR-DNA-ASSET-ARCHITECTURE.md`](INVESTOR-DNA-ASSET-ARCHITECTURE.md) — cross-asset taxonomy and Investment DNA extension contract.
7. [`ASSESSMENT-METHODOLOGY.md`](ASSESSMENT-METHODOLOGY.md) — assessment methodology and research-version rules.
8. [`INVESTMENT-DNA-METHODOLOGY.md`](INVESTMENT-DNA-METHODOLOGY.md) — investment-profile methodology and source-of-truth rules.
9. [`../DEPLOY.md`](../DEPLOY.md) — deployment and environment checklist.
10. [`../CONTINUE-HERE.md`](../CONTINUE-HERE.md) — current work state and immediate blockers. Keep this short and current.

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

- `HARD-TEST-V1.9.md`
- `MILESTONE-1-ENGINE-TRUST-REPORT.md`
- `MILESTONE-2-PRODUCT-VALUE-REPORT.md`
- `MILESTONE-3-PILOT-LAUNCH-READINESS-REPORT.md`
- `M4-CROSS-ASSET-RESEARCH-EXPANSION.md`

Do not silently rewrite historical reports to make them look current. Add a new report or update the canonical engineering documents instead.

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

Prefer updating an existing canonical document over creating another overlapping document.