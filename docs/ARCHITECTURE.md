# Investor DNA architecture

Status: canonical engineering reference  
Last reviewed: 2026-09-17

## 1. Product vocabulary

Use these names consistently:

- **Investor DNA** — platform/product brand.
- **Investing DNA** — investor assessment experience.
- **Investment DNA** — structured research profile of an investment/instrument.
- **DNA Match** — compatibility layer between Investor DNA + money context and eligible investments.

Do not call the whole platform `Investing DNA`. Do not call every instrument a fund now that the research catalog is cross-asset.

## 2. High-level system

Investor DNA is a Next.js application backed by Supabase. The browser is intentionally thin: it renders returned state and invokes approved server contracts; it does not own canonical scoring, safety gates, authorization or account ownership.

```text
Browser / Next.js
  |-- public/read RPCs ---------------------> Supabase Postgres read models
  |-- authenticated RPCs ------------------> profile / watchlist / account state
  `-- investing-dna-pilot Edge Function ---> assessment sessions, answers,
                                             submit/claim/context,
                                             analytics and feedback

Supabase Postgres
  |-- Investing DNA assessment + scoring
  |-- Investment DNA research models
  |-- DNA Match v7 + Goal Fit v1
  |-- account/profile/watchlist retention
  `-- pilot analytics/research operations
```

## 3. Repository ownership map

### `app/`
Next.js routes and route-level orchestration. Pages may compose helpers/components but must not recreate canonical scoring or asset taxonomy.

### `components/`
Reusable UI. Components can own presentation state but not server-trust decisions.

### `lib/`
Browser-side contracts/adapters and small deterministic helpers.

Important modules:

- `lib/dna.ts` — assessment/result/Match browser contracts and guest recovery/claim state.
- `lib/instrument-model.ts` — canonical cross-asset taxonomy and display/Match eligibility rules.
- `lib/instruments.ts` — generic cross-asset research/watchlist adapter.
- `lib/investments.ts` — ETF-specific research/compatibility adapter.
- `lib/product-risk/` — modular Product Risk DNA contracts: consumer dimensions, asset-module registry and public read adapter. Asset-specific sensors and canonical risk calculation stay server-side.
- `lib/supabase.ts` — browser Supabase transport.
- `lib/analytics.ts`, `lib/browser-session.ts` — privacy-minimized pilot events/session IDs.
- `lib/use-account.ts` — auth-session hook.

### `supabase/migrations/`
Append-only database evolution. Once a migration is applied, corrections are made with a later migration rather than rewriting applied history.

### `supabase/functions/investing-dna-pilot/`
Privileged assessment/pilot server boundary. Browser input is untrusted and must be validated before service-role work.

### `supabase/tests/`
Transactional/live database regressions for ownership, scoring/Match behavior, data boundaries and M4 hardening.

### `tests/`
Browser/contract regressions using deterministic fixtures. They prove frontend behavior, not live database/deployment evidence.

## 4. Core product flows

### Guest assessment

```text
/dna/assessment
  -> Edge: start
  -> questionnaire
  -> save_answers
  -> submit
  -> /dna/result
```

A completed guest result is available for the current experience; only a limited claim ticket is retained for optional account attachment.

### Optional account / claim

```text
Guest result
  -> /profile?mode=signup&save=dna
  -> Supabase Magic Link
  -> authenticated profile
  -> claim_assessment
  -> persisted current Investor DNA
```

Account creation is optional.

### Cross-asset research

```text
/explore
  -> app_search_instruments
  -> /investment/[id]
  -> app_get_instrument
  -> generic structure/terms
  -> ETF only: fund-specific research + Investment DNA
```

Public research catalog currently includes ETF, GIC, T-Bill, Bond, Commercial Paper and ABCP references.

### Product Risk DNA shadow calibration

```text
verified research facts
  -> service-only asset input adapters
  -> asset evaluator
  -> four consumer dimensions + overall band
  -> draft Product Risk DNA profile
  -> explicit review/publication gate
  -> app_get_product_risk
  -> ProductRiskCard on /investment/[id]
```

The current calibration engine covers ETF, GIC, T-Bill and Bond directly; Commercial Paper and ABCP remain Unknown/Insufficient reference profiles until issue-level evidence is adequate. Direct-bond outputs are confidence-capped at Medium while credit rating, duration and market-liquidity evidence are still structural/partial; current T-Bill outputs also cap Overall confidence at Medium until direct liquidity evidence exists, even though remaining term can support High-confidence Price Movement; GIC High confidence requires an explicit deposit source/as-of date plus term, redeemability and deposit-insurance structure; a missing verified issue rating is surfaced for non-federal bonds. The investment-detail Product Risk card is already wired but renders only an explicitly published profile; shadow drafts remain invisible. ETF Price Movement reads the verified `investment_official_risk_ratings` source directly rather than the generic risk-metric field; ETF diversification uses underlying/direct holdings breadth plus a sector-focus cap, and verified bid-ask spread can upgrade the Access-to-Money evidence quality. Draft refreshes are service-only. `investor_private.v_product_risk_review_queue` classifies drafts for internal evidence review only and is not browser-readable. No draft is visible through the public RPC.

The consumer dimensions have explicit polarity: higher Loss Potential/Price Movement is worse, while higher Access to Money/Diversification is better. UI must not treat all four as a single “higher risk” scale. Overall Risk is produced server-side from versioned asset-module calibration weights; the internal numeric pressure score is never a consumer output.

### DNA Match

DNA Match remains **ETF-only**. Non-ETF instruments are research-only until a separately designed compatibility model exists.

Canonical chain:

```text
current app state / assessment submit
  -> investor_private.current_match(assessment_id)
  -> calculate_investment_match_v7(assessment_id)
  -> investor_private.goal_role_fit_v7(...)
  -> public.v_investment_dna_v2 (ETF-only)
  -> match_runs / investment_match_results
```

Current versions:

- Match: `investment-dna-match-v7`
- Goal Fit: `goal-fit-v1`
- Product Risk DNA: `product-risk-dna-v1-research` (shadow calibration; not publicly published)
- historical retained engine: `investment-dna-match-v6`

There is only one current read path: `investor_private.current_match()`. The temporary v7 candidate wrapper was removed after promotion.

Match states are product states, not transport errors:

- `review_required`
- `context_required`
- `no_suitable_options`
- `available`

`review_required` stops ranking and preserves null overall Match scores.

When context is incomplete, the persisted engine run may retain an internal comparison value for reproducibility/order, but `current_match()` redacts the consumer-facing overall `/100` score and returns:

```text
context_only_score_policy = hidden_until_context_complete
```

This prevents DNA-only ordering from being mistaken for personalized compatibility.

### Retention

Authenticated users may persist current Investor DNA linkage, investment context, watchlist items and returning profile state. Watchlist storage/language is asset-neutral even though Match is ETF-only.

## 5. Match v7 architecture

Match v7 intentionally separates three layers:

1. **Safety/context constraints** — `investor_private.match_constraints()` owns financial review gates and equity ceiling.
2. **Goal role model** — `investor_private.goal_role_fit_v7()` owns goal-specific structural role scoring and is separately versioned as `goal-fit-v1`.
3. **Match aggregation** — `calculate_investment_match_v7()` combines Official Risk Fit, Market Exposure Fit, Goal Role Fit and Exposure Breadth.

Do not move goal-specific weights back into UI code or duplicate them across routes. Behavior-changing revisions receive a new Match and/or Goal Fit version.

See `INVESTMENT-DNA-METHODOLOGY.md` for formulas and validation status.

## 6. Cross-asset model

Canonical asset taxonomy lives in `lib/instrument-model.ts`. Generic structure dimensions include liquidity, capital protection, price volatility, income predictability, growth participation, rate sensitivity, credit exposure, diversification, complexity and time structure.

Product Risk DNA is a separate modular domain. Its internal model can use detailed asset-specific sensors, while the default consumer contract is compact: Overall Risk plus Loss Potential, Price Movement, Access to Money and Diversification. Product Role / Structure DNA stays separate from Product Risk DNA.

Keep asset-specific facts in specialized models:

- MER/holdings -> fund research;
- coupon/YTM/maturity -> fixed-income terms;
- posted rate/redeemability/deposit insurance -> GIC/deposit terms.

Do not broaden DNA Match to another asset class by merely inserting it into the ETF view.

## 7. Data/source-of-truth hierarchy

Prefer, in order:

1. official issuer/regulator/central-bank data;
2. explicitly linked verified source data;
3. clearly labelled partial research data;
4. unavailable/null.

Never invent a market value or replace an older real source date with today just to make data look complete/fresh. Missing is different from zero.

`public.v_investment_dna_v2` is deliberately ETF-only and service-side. Cross-asset Explore/Detail/Compare use their own research read model instead.

## 8. Trust boundaries

Browser may:

- call approved public/authenticated RPCs;
- call the Edge Function with untrusted input;
- render returned data;
- keep limited recovery/session state;
- request Supabase Auth.

Browser must not:

- calculate canonical Investor DNA, Goal Fit or Match scores;
- decide ownership;
- bypass safety gates;
- write raw pilot/admin tables directly;
- use a service-role key;
- mutate historical model behavior.

Privileged service/Edge code must validate session/action/ownership/payload shape before privileged writes.

## 9. Versioning and reproducibility

Current research baseline:

- questionnaire: `v1.10-cognitive-candidate`
- Investor DNA: `dna-v1.10-research`
- Investment DNA intelligence: `intelligence-v1.1`
- Match: `investment-dna-match-v7`
- Goal Fit: `goal-fit-v1`

Historical Match v6 remains server-side for reproducibility/A-B evidence but is not a current app path. Earlier v3/v4/v5/v5.1 runtimes remain retired.

Never silently mutate a historical questionnaire/scoring/Match version after evidence has been collected.

## 10. Security model

- RLS remains enabled on user/account data.
- Browser-facing account writes derive ownership from authenticated identity, not caller-supplied profile IDs.
- Prefer narrow public `security invoker` wrappers over exposing privileged implementations.
- Public research reads may be anonymous; source tables are not generally writable.
- Service-only/admin/pilot tables may intentionally have RLS with no browser policy.
- Do not change a security mode merely to eliminate an Advisor warning without tracing dependencies.

Current M4 hardening has zero `SECURITY DEFINER` views; two authenticated account helper warnings remain intentionally pending real Magic Link canary verification.

## 11. Architecture change rule

A change that alters a domain boundary must update this document and the nearest relevant README/doc in the same change. Examples:

- new asset type;
- new canonical scoring/Goal/Match model;
- Match scope beyond ETFs;
- ownership/auth semantics;
- assessment persistence;
- new backend/service;
- deployment topology.

If a future engineer cannot answer “where does this rule belong?” from this document, the architecture documentation is incomplete.
