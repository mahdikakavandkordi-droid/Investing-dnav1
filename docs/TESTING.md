# Investor DNA testing guide

Status: canonical verification reference  
Last reviewed: 2026-09-16

Investor DNA uses multiple test layers because no single test proves product correctness, repository cleanliness, database security and deployed behavior.

## 1. Client contract tests

```sh
npm test
```

Source: `tests/contracts.mjs`.

Purpose includes assessment envelopes, scale behavior, zero-vs-missing semantics, guest/account isolation, storage expiry/cleanup and the narrow public questionnaire DTO.

These are deterministic and do not start a browser.

## 2. Repository / unused-code hygiene

```sh
npm run test:hygiene
npm run typecheck:hygiene
```

`tests/repo-hygiene.mjs` protects architecture invariants that TypeScript alone cannot express. `typecheck:hygiene` runs strict no-unused checks.

Historical migration SQL is not scanned as current runtime: applied migrations must preserve the historical definitions that existed at the time.

When a hygiene rule finds real dead code, remove/migrate the dead path rather than weakening the rule.

## 3. Type/build verification

```sh
npm run typecheck
npm run build
```

A green build proves compilation/integration only. It does not prove browser flows, live database state or deployment.

## 4. Browser integration regressions

The browser runner starts local Next.js and intercepts Supabase calls with deterministic fixtures.

```sh
npm run test:flow
npm run test:funds
npm run test:m4
npm run test:assets
```

### `test:flow`

Covers v1.10 assessment recovery, answer persistence/back navigation, submit retry/result handling, feedback, mocked auth/claim continuity, cognitive invite behavior, privacy-safe events and browser runtime errors.

It also protects the guest journey as a connected in-app flow:

- Result points investment-context entry forward to Match through the allowlisted `returnTo=/match` path;
- Context saves the four required money inputs and returns directly to Match;
- a review-required Context result lands on the Match review state without leaking a numeric score;
- global `My DNA` navigation reaches the neutral `/dna` hub, which exposes `View my current DNA` when a one-session guest result still exists;
- following that in-app continuation returns to Result without persisting the full guest report in local storage.

A deliberate full reload is different: a completed guest result is not promised across reloads. Persistent continuity belongs to the optional account flow.

### `test:funds`

Covers ETF Detail research, retry/error state, account intent continuity, watchlist behavior, DNA Match presentation/navigation, Screener -> Compare, returning profile flow, analytics and mobile viewport.

The connected browser flow also protects the Match v7 context transition end to end:

- a saved DNA with missing money context renders `context_required` rows as **DNA-only**;
- numeric overall Match scores remain absent before context is complete;
- context-required rows must not be mislabeled as **Review**;
- the Context form exposes `major_purchase` and `wealth_preservation` in addition to the other current v7 goals;
- signed-in Context entry from Match carries `returnTo=/match`, keeps ownership server-scoped and returns the same account/session directly to a numeric context-aware Match after save;
- Result, Match, investment Detail and Screener all use the same Match presentation semantics before and after that transition;
- the resulting ETF selection still flows through Detail and Screener -> Compare.

The browser test therefore protects this UI contract:

```text
context_required -> DNA-only
review_required  -> Review
available        -> numeric context-aware Match
```

### `test:m4`

Covers research/limitations wording, privacy contract, global disclosure and mobile/runtime health.

### `test:assets`

Covers cross-asset Explore taxonomy, GIC terms/protection context, T-Bill yield/discount semantics, cross-asset Compare, disabled non-ETF Match, missing-value semantics and mobile/runtime health.

Browser mocks do **not** prove production migrations, live RLS, real email delivery, deployment success, user comprehension or scientific validity.

## 5. Database regressions

SQL regressions live in `supabase/tests/` and mutation-heavy suites run inside rollback transactions where practical.

Important suites:

- `investor_platform_connections.sql`
- `milestone_1_engine_trust.sql`
- `milestone_2_product_value.sql`
- `milestone_3_pilot_readiness.sql`
- `m4_cross_asset_research.sql`
- `m4_security_hardening.sql`
- `m4_match_hard_stress.sql`

### `milestone_1_engine_trust.sql`

Current canonical engine regression. It verifies:

- Match v7 is the current engine and Match v6 remains historical/reproducible;
- temporary candidate runtime is absent after promotion;
- Goal Fit v1 helper exists;
- Match universe/payload is ETF-only;
- unchanged inputs reuse a stamped run;
- scoring-relevant ETF data changes invalidate the run/data version;
- safety gates stop ranking and preserve null scores;
- no-suitable-options is explicit rather than force-fit;
- long-horizon low-tolerance Education preserves a zero-equity path after calibration;
- one-item Investor DNA sensitivity remains bounded.

### `m4_match_hard_stress.sql`

A deliberately adversarial Match v7 suite. It exercises 18 named scenarios covering:

- high/mid/low-tolerance Investor DNA profiles;
- Growth, Retirement, Income, Wealth Preservation, Education and House Purchase behavior;
- 12y / 7y / 4y / 2y horizons;
- principal-protection, essential-spending and emergency-reserve gates;
- no-context behavior;
- ETF-only universe integrity;
- eligible-row hard limits;
- horizon monotonicity;
- zero-equity paths for low-tolerance Income/Education;
- goal differentiation so distinct goals do not collapse to the same ordering.

The suite prints a compact scenario matrix before rollback for human review.

### v6 -> v7 A/B acceptance evidence

Before promotion, v6 and v7 were run on the same 168 synthetic combinations:

```text
6 Investor DNA profiles
x 7 money goals
x 4 horizons
= 168 identical-input A/B scenarios
```

Acceptance result after the Education calibration:

- status mismatches: 0;
- safety-review status mismatches: 0;
- non-ETF/universe violations: 0;
- eligible hard-limit violations: 0;
- review-required numeric score leaks: 0;
- formerly collapsed non-growth goal groups: reduced from 15 to 3 in the tested grid.

This A/B evidence supports an engineering/research promotion decision. It does **not** establish investment suitability or statistical validity.

## 6. Context-only score contract

`context_required` is not a personalized Match. The v7 persisted run may keep internal comparison values for ordering/reproducibility, but the canonical `current_match()` contract redacts the consumer-facing overall `match_score` and returns:

```text
context_only_score_policy = hidden_until_context_complete
```

Browser presentation of this state is centralized in `lib/match-presentation.ts`. Result, Match, Screener and Detail should consume that helper rather than independently interpreting a null score.

Regression work touching Match serialization or Match UI should preserve this rule.

## 7. Supabase Advisor checks

After material DDL/RLS/grant changes, review Security and Performance Advisors. Classify findings rather than eliminating them blindly.

Examples:

- RLS/no-policy can be intentional for service-only tables;
- unused-index INFO in a young pilot database is not enough by itself to drop an index;
- duplicate permissive account policies are usually real cleanup;
- security-definer changes require dependency/ownership tracing.

Document accepted launch-relevant findings in the current M4 handoff/checklist.

## 8. CI

GitHub Actions `.github/workflows/ci.yml` currently runs:

1. `npm ci`
2. `npm test`
3. `npm run test:hygiene`
4. `npm run typecheck`
5. `npm run typecheck:hygiene`
6. `npm run build`
7. Chrome availability check
8. `npm run test:flow`
9. `npm run test:assessment`
10. `npm run test:funds`
11. `npm run test:m4`
12. `npm run test:assets`

All applicable steps must be green before calling an exact head engineering-green.

Database SQL suites are additionally run against the target/live schema when backend behavior changes; a mocked frontend CI job is not a substitute for those checks.

## 9. Deployment verification

Keep these states separate:

- **CI green** — repository verification passed;
- **Vercel build success** — hosting provider built the commit;
- **preview/prod canary passed** — deployed URL was exercised;
- **real email canary passed** — Supabase email/callback round trip worked with an external inbox.

Do not collapse them into “deployed”.

### Protected Vercel Preview canary

`.github/workflows/preview-canary.yml` exercises the real branch Preview with headless Chrome on the active integration/preview branches. Vercel Deployment Protection is bypassed through the repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`; the credential is never committed or printed. Before running the browser journey, the workflow polls `/api/build-info` and reads the deployed `VERCEL_GIT_COMMIT_SHA`. It accepts either the exact workflow SHA or an older deployed SHA only when a full-history Git diff proves there is no change in runtime source paths (`app/`, `components/`, `lib/`, `public/` or build/package configuration). A stale runtime branch alias therefore fails instead of producing a false-positive canary, while workflow/docs-only commits do not require a redundant deployment.

`tests/run-deployed-preview-canary.cjs` bootstraps the protected-preview browser session, then runs `tests/deployed-preview-flow.cjs` against the deployed Next.js frontend while intercepting Supabase requests. This deliberately prevents the canary from creating real assessments, sending email or mutating the live database.

The canary follows the guest product journey through real client-side navigation rather than using full reloads that would intentionally discard the privacy-limited guest result:

```text
Assessment -> Result -> DNA-only Match -> Context -> context-aware Match
-> ETF Detail -> Match -> Screener -> Compare -> My DNA
```

Exact deployed branch head `d89cd1c0f2c6f41a3c553475cee1a06c15aee82f` passed `preview-canary` in workflow run `35126359360`. The full repository `verify` workflow also passed on the same exact head in run `35126359410`.

What this proves: the deployed Vercel frontend, routes, SPA continuity and mocked client/backend contracts work together on that exact head. What it does **not** prove: live Supabase data/RLS, a real external email round trip, user comprehension, scientific validity or regulatory suitability.

## 10. Human evidence is separate

Automated tests can prove implementation consistency; they cannot prove comprehension, trust, return intent, psychometric validity or regulatory suitability.

See:

- `COGNITIVE-TEST-PROTOCOL.md`
- `MILESTONE-4-PILOT-EVIDENCE-PLAN.md`
- `M4-PILOT-SCORECARD.md`

## 11. Before adding a test

Use the lowest layer that can prove the requirement:

- deterministic helper -> contract/unit test;
- source architecture invariant -> hygiene test;
- page/flow behavior -> browser test;
- RLS/RPC/schema/source/scoring behavior -> SQL regression;
- production-only integration -> controlled canary.

Do not duplicate the same assertion everywhere unless it protects a different boundary.

## 12. Full local repository verification

```sh
npm run test:all
```

Keep `test:all` synchronized with CI whenever CI changes.