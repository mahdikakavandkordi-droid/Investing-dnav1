# Investor DNA — Cross-Asset Product & Code Architecture

Status: **M4 implementation contract**  
Date: 2026-09-15

## 1. Product naming contract

These names have different meanings and should not be used interchangeably in UI or code documentation:

- **Investor DNA** — the overall platform and brand.
- **Investing DNA** — the questionnaire/assessment that describes the investor's risk tolerance, capacity, behavioural tendencies and experience.
- **Investment DNA** — the structural profile of an investment instrument.
- **DNA Match** — the compatibility layer that combines saved Investor/Investing DNA, the context of the money and Investment DNA.

Current rule: only the ETF universe is eligible for personalized DNA Match. Non-ETF instruments are research/discovery instruments until asset-specific Match adapters have been separately validated.

## 2. V1 research universe

### In scope
- ETF — current core universe; full Match remains enabled.
- GIC — representative fixed/redeemable deposits.
- T-Bill — Government of Canada 3M / 6M / 12M examples.
- Bond — representative federal, provincial and investment-grade corporate examples.
- Commercial Paper — limited research examples only.
- ABCP — limited educational/research profile only.

### Explicitly out of scope for this phase
- Individual stocks.
- Stock valuation/ranking/recommendation.
- Personalized Match for GICs, bonds, T-Bills, CP or ABCP.
- Portfolio Builder.

Stocks are intentionally deferred because company-level valuation, financial-statement quality, business/sector analysis and single-security recommendation risk require a separate Stock DNA model.

## 3. Canonical taxonomy

`investments` stays the canonical instrument identity table. Do not create one top-level identity table per asset type.

Allowed initial `asset_type` values:

- `ETF`
- `GIC`
- `T_BILL`
- `BOND`
- `COMMERCIAL_PAPER`
- `ABCP`

`category` and `subcategory` refine the instrument without changing its top-level type. Example:

- `BOND / Government / Federal`
- `BOND / Government / Provincial`
- `BOND / Corporate / Investment Grade`

UI families are intentionally broader than database asset types:

- Funds → ETF
- Deposits → GIC
- Bonds → BOND
- Government money market → T_BILL
- Money Market → COMMERCIAL_PAPER, ABCP

The UI family mapping must live in one code module (`lib/instrument-model.ts`), not be duplicated across pages.

## 4. Data layering

Every instrument has three layers.

### Layer A — identity/common catalog
Stored in existing `investments` and issuer/source tables:
- name / legal name
- symbol or research code
- asset type
- category/subcategory
- issuer
- currency
- country/region
- description
- active / featured / data status

### Layer B — cross-asset Investment DNA
Stored in `investment_structure_profiles`.

The shared dimensions are descriptive research labels, not regulatory ratings:
- capital protection
- liquidity
- price volatility
- income predictability
- growth participation
- interest-rate sensitivity
- credit exposure
- diversification
- complexity
- time structure
- principal protection / insurance basis
- model version + source basis + as-of date

This is the only cross-asset layer. Asset-specific fields must not be stuffed into this table.

### Layer C — asset-specific facts

#### Fixed income / money market
`investment_fixed_income_terms`:
- instrument subtype
- coupon
- yield / YTM when appropriate
- issue / maturity dates
- remaining term
- duration where available
- face value
- credit rating + agency
- discount instrument flag
- market-access note
- source / as-of date

Used by BOND, T_BILL, COMMERCIAL_PAPER and ABCP where applicable.

#### GIC/deposit terms
`investment_deposit_terms`:
- annual rate
- term months
- redeemability
- minimum deposit
- interest payment frequency
- registered-account eligibility
- deposit-insurance scheme / eligibility
- maturity/lock-up note
- source / as-of date

ETF-specific facts continue to use the existing fund facts, performance, holdings, exposure and characteristics tables.

## 5. Read-model contract

Do not expand the existing ETF Match RPCs to pretend all assets have ETF metrics.

Keep current ETF endpoints for Match/Screener stability.

Create/consume a separate generic research read model for Explore/Detail/Compare:

- `app_search_instruments`
- `app_get_instrument`
- `app_compare_instruments`

Those responses may contain null asset-specific fields. UI must never render null as zero.

## 6. UI adapter contract

`lib/instrument-model.ts` is the single source of truth for:
- display name per asset type
- UI family/tab
- whether Match is enabled
- whether fund research sections apply
- hero metrics and labels
- safe fallback copy

Pages should ask the adapter what to show. Pages should not own asset taxonomy.

## 7. Match contract

`matchEligible(assetType)` returns true only for `ETF` in this phase.

For non-ETF instruments:
- Explore: enabled
- Detail: enabled
- Compare: research facts + shared Investment DNA enabled
- Watchlist: can be enabled after persistence regression confirms generic IDs are safe
- Personalized Match score: **disabled**

The UI must explicitly say `Research profile — personalized Match not enabled for this asset type yet` rather than showing a missing score as an error.

## 8. Source/freshness contract

Each asset-specific fact set must include source provenance and an as-of date where available.

Preferred Canadian sources:
- Government of Canada / Bank of Canada for T-Bills and federal bond reference data.
- Issuer/dealer official disclosures for GIC rates/terms and corporate/provincial fixed income.
- CDIC or the applicable provincial insurer only for the insurance rule; never infer insurance from the word `GIC` alone.

Do not synthesize a current rate/yield where a verified source is unavailable.

## 9. Historical/obsolete instruments

Do not add Bankers' Acceptances as an active sample. The Canadian BA market ceased new issuance after the CDOR transition in 2024.

Do not add a 1-month Government of Canada T-Bill as a current sample; the 1M program was discontinued in 2025.

## 10. Change-control rule

Before adding a new asset class later:
1. define its `asset_type` and UI family here;
2. list common Investment DNA dimensions that genuinely apply;
3. create one asset-specific facts model instead of adding unrelated columns to generic tables;
4. define source/freshness requirements;
5. define whether Match is disabled, experimental or validated;
6. add contract + browser regression tests;
7. only then expose it in Explore.

If a proposed field cannot be meaningfully compared across asset classes, it belongs in an asset-specific table/component — not the shared structure profile.
