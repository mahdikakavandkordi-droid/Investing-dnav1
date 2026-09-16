# Investing DNA — Milestone 2: Product Is Valuable

**Date:** 15 September 2026  
**Status:** Complete — product-value acceptance gates passed.  
**Verified implementation head:** `7843f1af76ecaacff874c338d570d013862c4020`  
**Acceptance CI run:** GitHub Actions `35018488630` — all jobs passed.  
**Deployment:** Vercel deployment completed successfully for the verified implementation head.  
**Canonical assessment:** `v1.10-cognitive-candidate` / `dna-v1.10-research`  
**Canonical match model:** `investment-dna-match-v6`

## What “complete” means

Milestone 2 establishes a connected product-value loop on top of the trusted engine from Milestone 1:

`Investor DNA → investment context → Match → Fund research → Screener/Compare → Watchlist → returning-user continuity`

A user can now discover their Investor DNA, understand why a fund may or may not fit, inspect the evidence and coverage behind the fund, compare alternatives, save funds, create an optional account without losing intent, and return to a concrete next step.

Milestone 2 does **not** mean that the questionnaire is psychometrically validated, that the platform provides regulated investment advice, or that the 40-fund research universe has complete look-through data. The product explicitly preserves those limitations.

## Baseline problems addressed

The Milestone 2 audit found that the core engine was substantially stronger than the product layer around it:

1. The database already contained much more performance data than the Screener/Compare UI exposed. The old read path showed one-year return for only a small subset because it depended on a legacy metrics table.
2. MER and AUM could appear missing when the newest metrics row did not contain those fields, even though a valid recent value existed in history.
3. Holdings meant different things for different products. Asset-allocation ETFs often held other ETFs, while direct funds contained securities; treating all holdings as equivalent would overstate look-through coverage.
4. Match existed technically but was not yet the product’s hero explanation layer.
5. Screener and Compare were not sufficiently connected to a user’s saved DNA.
6. The returning-user loop needed a clearer next step rather than a collection of disconnected pages.
7. Guest-to-account continuity and browser regression coverage were not strong enough to call the flow complete.
8. The assessment entry page was still starting a stale v1.9 cohort while the backend canonical model had already moved to v1.10.

## Changes completed

### 1. Canonical product-data read model

A new product read model now uses canonical performance history and the most recent valid value for sparse fields such as MER and AUM rather than blindly reading the latest row.

The result is materially better usable coverage without inventing or backfilling false values. Unknown values remain `NULL`/unavailable.

Applied migrations:

- `20260915165513_milestone_2_product_data_read_model`
- `20260915170500_milestone_2_research_rpc_hardening`

### 2. Research transparency and honest look-through

Fund Detail now separates:

- official fund facts,
- official risk-source coverage,
- verified/issuer-linked historical performance and as-of dates,
- portfolio characteristics,
- holdings coverage,
- exposure coverage,
- and the type of holdings information actually available.

Holdings are explicitly classified as:

- `fund_of_funds_structure`
- `full_holdings`
- `top_holdings_sample`
- `no_holdings`

For fund-of-funds structures, known underlying ETFs in the Investing DNA universe are linked to their own research pages. This provides useful look-through where supported without implying complete transparency where it is not available.

VBAL is a regression fixture for this behavior: latest holdings coverage is approximately 99.97% and approximately 84.54% of portfolio weight links to known underlying investments in the current universe.

### 3. Match became the explanation layer

The Match experience now treats compatibility as an explainable research result rather than a leaderboard.

The page exposes:

- current state: `available`, `context_required`, `review_required`, or `no_suitable_options`,
- compatibility score only where ranking is appropriate,
- component-level fit signals,
- “Why it may fit”,
- “What conflicts”,
- “What would change this comparison?”,
- official fund risk where available,
- and the current match/data version context.

The copy explicitly states that a higher compatibility score is **not** a better investment, a return forecast, or a recommendation to buy.

### 4. DNA-powered Screener

The Screener remains facts-first and layers personal compatibility on top when saved DNA exists.

Users can:

- search by symbol/name,
- filter by official risk,
- sort by one-year return, lowest MER, largest AUM, or DNA compatibility,
- optionally show only currently eligible matches when the match state permits it,
- select up to three funds,
- and move directly into Compare.

Personal fit does not replace risk, MER or historical performance facts.

### 5. Fact-first Compare

Compare now supports two or three funds selected from Screener or Match. It presents side-by-side:

- official risk,
- one-year return,
- three-year annualized return,
- five-year annualized return,
- MER,
- distribution yield,
- strategic allocation when available,
- DNA compatibility,
- key fit reasons,
- and key conflicts.

The comparison uses the canonical performance summary rather than the obsolete legacy return path.

### 6. Returning-user value and optional account continuity

Profile now acts as a continuation surface rather than only an account page. Depending on state, it can surface:

- the closest current comparison,
- a missing-context next step,
- a `no_suitable_options` explanation path,
- a review-required path,
- the saved watchlist,
- or an assessment revisit prompt.

Optional account creation preserves fund intent. A user can browse and take the assessment as a guest, then create/sign in to an account when they choose.

The guest assessment stores only a limited claim ticket after completion rather than keeping the full completed answer draft in local storage. Magic-link callback continuity automatically attempts to attach the completed DNA to the authenticated account; a failed claim keeps the ticket available for a safe manual retry.

### 7. Authentication hydration hardened

The account hook now resolves the initial Supabase session with `getSession()` while also subscribing to `onAuthStateChange`. This makes session hydration more robust after magic-link redirects and reloads instead of relying only on an auth event race.

### 8. Canonical v1.10 assessment entry restored

The browser assessment now starts `DEV_V1_10` and records `prepilot-v1.10-*` consent metadata. New users no longer enter the obsolete v1.9 cohort from the current frontend.

### 9. Security hardening for the new research RPC

The privileged research-context implementation was moved into the private schema. The public RPC is now a narrow security-invoker wrapper. This removed the new security-definer exposure warning introduced during initial M2 work rather than leaving additional security debt.

### 10. Continuous browser verification added

GitHub Actions now runs on the working branch/PR and verifies:

- dependency install,
- contract/unit tests,
- TypeScript,
- production Next.js build,
- canonical assessment browser flow,
- and the connected product-value browser flow.

The browser flows use intercepted backend responses and do not create production assessments or send live emails.

## Data coverage snapshot

The real Supabase database was queried after the Milestone 2 migrations.

| Coverage area | Current usable coverage | Notes |
| --- | ---: | --- |
| Active research universe | 40 / 40 | Current V1 universe |
| Official fund-facts source coverage | 40 / 40 | Coverage source exists |
| Official risk-source coverage | 40 / 40 | Four funds still lack a normalized display `risk_level` in the catalog |
| 1-year performance | 40 / 40 | Canonical performance history |
| 3-year annualized performance | 40 / 40 | Canonical performance history |
| 5-year annualized performance | 40 / 40 | Canonical performance history |
| MER | 40 / 40 | Latest valid field value |
| AUM | 40 / 40 | Latest valid field value |
| Portfolio characteristics | 33 / 40 | Still incomplete |
| Complete exposure set | 9 / 40 | Depth gap remains |
| Full holdings detail | 5 / 40 | Partial holdings are labelled as partial |

The four funds whose current catalog row has no normalized risk label are `ZDV`, `ZEB`, `ZFL`, and `ZRE`. The product must continue to display these as unavailable rather than inferring a value.

## Verification evidence

### Real-database M2 regression — PASS

`supabase/tests/milestone_2_product_value.sql` was executed against the real Supabase project inside a rollback transaction.

It verified:

- 40 usable Screener rows with 1Y/3Y/5Y performance, MER and AUM,
- Screener performance exactly matches the canonical performance summary,
- VBAL is detected as a fund-of-funds structure,
- VBAL holdings/known-underlying coverage remains above the regression thresholds,
- unknown research context returns `NULL`,
- Compare uses canonical performance history,
- anonymous research access works through the intended public RPC,
- anonymous Screener access returns the complete usable universe,
- and the protected helper view remains inaccessible to anonymous clients.

Result: **PASS: M2 product-value data regression suite**.

### GitHub CI acceptance run — PASS

Acceptance run: `35018488630` on implementation head `7843f1af76ecaacff874c338d570d013862c4020`.

Passed steps:

- `npm ci`
- `npm test`
- `npm run typecheck`
- `npm run build`
- runner Chrome availability
- `npm run test:flow`
- `npm run test:funds`

The assessment browser flow verifies:

- canonical v1.10 start/resume,
- back-navigation answer persistence,
- save-error retry,
- ephemeral guest result semantics,
- limited claim-ticket retention,
- email-link failure/success distinction,
- magic-link callback authentication,
- automatic claim failure safety,
- manual claim retry,
- claim-ticket clearing after a successful save,
- sign out,
- mobile viewport fit,
- and no browser runtime errors.

The M2 fund browser flow verifies:

- Fund Detail failure/retry,
- verified performance and partial-coverage messaging,
- optional account registration with preserved fund intent,
- magic-link account continuity,
- watchlist failure/retry and persistence,
- canonical v6 fund compatibility,
- Match explanation and research linking,
- DNA-powered Screener,
- Screener → Compare selection,
- fact-first side-by-side comparison,
- returning Profile next step,
- mobile viewport fit,
- and no browser runtime errors.

### Vercel deployment — PASS

The Vercel commit status for the verified implementation head is `success` with “Deployment has completed”.

### Branch ancestry — clean

The working branch is ahead of `main` and was not behind at the M2 closeout check; there was no ancestry conflict requiring a rebase before closeout.

## Known limitations and intentionally deferred work

Milestone 2 improves truthfulness and connected product value; it does not hide remaining gaps.

1. **Universe breadth:** V1 currently contains 40 researched investments. Milestone 2 deliberately prioritized usable depth and coherent flows over rapidly expanding the catalog.
2. **Exposure depth:** only 9/40 currently have complete exposure sets and 5/40 have full holdings detail. Partial data is labelled rather than treated as complete look-through.
3. **Normalized risk labels:** four funds currently lack a normalized catalog risk label despite risk-source coverage.
4. **Characteristics coverage:** portfolio-characteristic coverage is 33/40.
5. **Psychometrics:** v1.10 remains a research candidate. Cognitive testing, real-user pilot data, reliability/structure work, calibration and retest/criterion work remain required before validation claims.
6. **Regulatory scope:** compatibility signals are not personalized regulated investment advice. Compliance/legal launch work remains separate.
7. **Real external email/user launch test:** deterministic E2E verifies the email and magic-link product logic with intercepted responses. Actual delivery to live external inboxes and a real-user cohort remains a launch/pilot gate.
8. **Platform hardening:** broader Supabase advisor findings such as index/RLS/performance classifications remain a production-hardening backlog. M2’s new research RPC was hardened so this milestone did not leave its own new public security-definer warning.
9. **Portfolio Builder:** intentionally remains out of V1 until the current research/match loop has real-user evidence and the allocation methodology is rebuilt against the canonical engine.

## Go / No-Go decision

**GO: Milestone 2 is complete from the current V1 product-value and engineering acceptance perspective.**

The platform now has a coherent reason for a user to return: understand their Investor DNA, add context, discover compatible structures, inspect evidence, compare alternatives, save funds and continue from a persistent profile.

**NO-GO for describing the product as scientifically validated, regulated advice, or production-launch complete.** The remaining gates are validation, launch/compliance hardening, real-user pilot evidence and deeper/broader fund data — not additional feature sprawl.

## Key files changed for Milestone 2

- `supabase/migrations/20260915165513_milestone_2_product_data_read_model.sql`
- `supabase/migrations/20260915170500_milestone_2_research_rpc_hardening.sql`
- `supabase/tests/milestone_2_product_value.sql`
- `components/ResearchContextCard.tsx`
- `components/FundConnection.tsx`
- `app/investment/[id]/page.tsx`
- `app/match/page.tsx`
- `app/screener/page.tsx`
- `app/compare/page.tsx`
- `app/profile/page.tsx`
- `app/dna/assessment/page.tsx`
- `lib/use-account.ts`
- `tests/flow.cjs`
- `tests/funds-flow.cjs`
- `.github/workflows/ci.yml`
- `docs/MILESTONE-2-PRODUCT-VALUE-REPORT.md`

## Recommended next milestone

The next milestone should be **Pilot & Launch Readiness**, not Portfolio Builder expansion.

Primary goals should be:

- cognitive testing and an initial real-user cohort,
- production email/magic-link verification with real accounts,
- analytics for funnel/return behavior and Match usefulness,
- classification/resolution of remaining Supabase security/performance advisor findings,
- systematic completion of risk labels/exposures/holdings for the current universe,
- compliance/legal wording and launch review,
- and evidence-driven iteration before expanding the fund universe or introducing portfolio construction.
