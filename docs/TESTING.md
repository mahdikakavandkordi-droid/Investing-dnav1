# Investor DNA testing guide

Status: canonical verification reference  
Last reviewed: 2026-09-16

Investor DNA has multiple test layers because no single test proves product correctness, repository cleanliness, database security and live deployment health at the same time.

## 1. Test layers

### A. Lightweight client contracts

Command:

```sh
npm test
```

Source: `tests/contracts.mjs`.

Purpose:

- assessment answer envelope behavior;
- scale option behavior;
- zero-vs-missing semantics;
- guest draft/account isolation;
- expiry/storage cleanup behavior;
- narrow public questionnaire DTO behavior.

These are fast deterministic checks and do not start a browser.

### B. Repository / unused-code hygiene

Commands:

```sh
npm run test:hygiene
npm run typecheck:hygiene
```

Sources/rules:

- `tests/repo-hygiene.mjs` protects architectural invariants that TypeScript alone cannot express;
- `typecheck:hygiene` runs `tsc --noEmit --noUnusedLocals --noUnusedParameters`.

Current hygiene checks include:

- no convenience `old`/`backup` source copies;
- no return of retired `FundConnection` or ETF-specific Watchlist compatibility aliases;
- no internal scoring/construct fields in the browser question DTO;
- no current browser/Edge dependency on runtime objects intentionally retired in `docs/RUNTIME-RETIREMENTS.md`;
- no service-role secret reference in browser source;
- no unused TypeScript locals/parameters.

When a hygiene gate identifies real dead code, remove/migrate it rather than weakening the rule. If an exception is genuinely architectural, document the boundary before changing the gate.

Historical migration SQL is not scanned as current runtime: old migrations must preserve the names/definitions that existed at the time.

### C. Type/build verification

```sh
npm run typecheck
npm run build
```

Purpose:

- TypeScript contract health;
- Next.js production compilation;
- route/build integration.

A green build does not prove browser flows or live deployment.

### D. Browser integration regressions

The runner starts a local Next.js server on port 3001 and intercepts Supabase network calls with deterministic fixtures.

```sh
npm run test:flow
npm run test:funds
npm run test:m4
npm run test:assets
```

What they cover:

#### `test:flow`
Assessment and controlled-pilot flow:

- v1.10 session recovery;
- answer persistence/back navigation;
- submit retry/result handling;
- feedback submission;
- magic-link/claim continuity behavior with mocked auth;
- cognitive invite flow;
- privacy-safe product event emission;
- browser runtime errors.

#### `test:funds`
Connected ETF/product loop:

- generic investment Detail shell + ETF-specific research;
- retry/error states;
- account intent continuity;
- watchlist persistence behavior;
- canonical ETF DNA Match presentation;
- Match -> Detail navigation;
- ETF Screener -> Compare flow;
- returning profile flow;
- analytics events and mobile viewport.

#### `test:m4`
Pre-launch transparency surfaces:

- research/limitations wording;
- pilot privacy contract;
- global disclosure;
- mobile/runtime health.

#### `test:assets`
Cross-asset research behavior:

- Explore asset taxonomy;
- GIC terms/protection context;
- T-Bill yield/discount semantics;
- cross-asset Compare shared dimensions;
- non-ETF Match remains disabled;
- missing money-market yield stays unavailable rather than zero;
- mobile/runtime health.

### What browser mocks do not prove

They do **not** prove:

- a production Supabase migration is applied;
- real email delivery works;
- a Vercel deployment completed;
- live RLS grants are correct;
- pilot users understand/value the product;
- scientific validity.

## 2. Database regressions

SQL tests live in `supabase/tests/`.

Important suites include:

- `investor_platform_connections.sql`
- `milestone_1_engine_trust.sql`
- `milestone_2_product_value.sql`
- `milestone_3_pilot_readiness.sql`
- `m4_cross_asset_research.sql`
- `m4_security_hardening.sql`

Most mutation-heavy suites are designed to run inside rollback transactions so they can verify real functions/policies without leaving synthetic state.

Database work should be verified against the live/target schema after migration. A frontend mock cannot replace a DB regression.

For runtime retirement, the relevant DB regression should also assert that the superseded callable path is absent and that the canonical replacement remains present/functional. See `docs/RUNTIME-RETIREMENTS.md`.

## 3. Supabase Advisor checks

After material DDL/RLS/grant changes, review:

- security advisor;
- performance advisor.

Classify findings rather than blindly eliminating them. Examples:

- RLS with no policy may be intentional for service-only tables;
- a security-definer view may be an architectural dependency;
- an unused-index INFO finding in a young/pilot database is not enough by itself to justify dropping the index;
- duplicate permissive account policies are normally a real cleanup issue.

Document accepted launch-relevant findings in the current M4 checklist/engineering notes.

## 4. CI

GitHub Actions workflow: `.github/workflows/ci.yml`.

Current branch CI runs:

1. `npm ci`
2. `npm test`
3. `npm run test:hygiene`
4. `npm run typecheck`
5. `npm run typecheck:hygiene`
6. `npm run build`
7. Chrome availability check
8. `npm run test:flow`
9. `npm run test:funds`
10. `npm run test:m4`
11. `npm run test:assets`

All applicable steps must be green before calling a head revision engineering-green.

## 5. Deployment verification

Deployment is a separate acceptance layer.

Distinguish these states:

- **CI green** — repository tests/build passed;
- **Vercel build success** — hosting provider built the commit;
- **preview/prod canary passed** — actual deployed URL was exercised;
- **real email canary passed** — Supabase email and callback round trip worked with an external inbox.

Do not collapse these into “deployed”.

A provider quota/rate-limit failure is not an application build failure, but it still means the new commit is not verified as deployed.

## 6. Human evidence is not automated testing

Cognitive and product-pilot evidence is a separate product/research gate. Automated tests can prove implementation consistency; they cannot prove comprehension, trust, return intent, reliability or validity.

See:

- `COGNITIVE-TEST-PROTOCOL.md`
- `MILESTONE-4-PILOT-EVIDENCE-PLAN.md`
- `M4-PILOT-SCORECARD.md`

## 7. Before adding a new test

Place the test at the lowest layer that can prove the requirement:

- pure deterministic helper -> contract/unit test;
- current-source architecture invariant -> repository hygiene test;
- page/flow behavior -> browser test;
- RLS/RPC/schema/source integrity -> SQL regression;
- production-only integration -> controlled canary.

Do not duplicate the same assertion across every suite unless it protects a genuinely different boundary.

## 8. Useful local command

Run the complete repository verification set with:

```sh
npm run test:all
```

`test:all` should remain synchronized with CI whenever the CI suite changes.
