# Investor DNA — V1 Product & Asset Architecture

Status: **focused V1 contract**  
Updated: 2026-09-20

## 1. Naming contract

These names have different meanings and should not be used interchangeably:

- **Investor DNA** — the overall platform and brand.
- **Investing DNA** — the investor assessment describing risk tolerance, capacity, behavioural tendencies and experience.
- **Investment DNA** — the structural profile of an investment product.
- **DNA Match** — the compatibility layer combining Investor/Investing DNA, the context of the money and Investment DNA.

## 2. Focused V1 public universe

The public V1 product intentionally exposes only three product types:

- **ETF** — exchange-traded fund research + personalized DNA Match.
- **MUTUAL_FUND** — Canadian mutual-fund research + personalized DNA Match.
- **GIC** — deposit / capital-preservation research. Personalized DNA Match remains disabled in V1.

The database can retain previously researched T-Bills, individual bonds, commercial paper and ABCP for future versions. They are not part of the focused V1 Explore, Home rail or Compare picker.

Individual stocks remain out of scope. They require a separate company-level Stock DNA model.

## 3. Asset mix is not product mix

ETF and mutual fund are product vehicles, not asset classes.

The three Portfolio / Asset Mix scenarios therefore remain expressed as:

- **Equity**
- **Fixed income**
- **Cash / capital preservation**

The product layer can then help the user research ways to implement those exposures:

- Equity → equity ETFs and equity mutual funds.
- Fixed income → fixed-income ETFs and fixed-income mutual funds.
- Cash / capital preservation → GICs and eligible cash-like fund products.

V1 must never present a scenario such as “60% ETF / 30% Mutual Fund / 10% GIC” as if those were asset classes.

## 4. Compare contract

V1 Compare is intentionally same-type only:

- ETF ↔ ETF
- Mutual Fund ↔ Mutual Fund
- GIC ↔ GIC

The first selected product determines the available products in the second and third selectors. Cross-type Compare is rejected rather than silently mixing non-comparable metrics.

This replaces the earlier cross-asset Compare experiment in the public V1 UI. Shared cross-asset structural data may remain in the database for later research.

## 5. Canonical taxonomy

`investments` remains the canonical instrument identity table.

Supported database `asset_type` values include:

- `ETF`
- `MUTUAL_FUND`
- `GIC`
- `T_BILL`
- `BOND`
- `COMMERCIAL_PAPER`
- `ABCP`

Public V1 visibility is centralized in `lib/instrument-model.ts` through `PUBLIC_V1_ASSET_TYPES`.

Do not duplicate public-visibility or Match-eligibility rules inside individual pages.

## 6. Data layering

Every public product has common identity and structural data plus product-specific facts.

### Layer A — common identity

Stored in `investments` and issuer/source tables:

- name / legal name
- symbol or fund code
- asset type
- category / subcategory
- issuer
- currency
- region
- description
- active / featured / data status

### Layer B — Investment DNA structure

Stored in `investment_structure_profiles`:

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
- source basis + as-of date

### Layer C — product-specific facts

ETF research continues to use the existing official facts, performance, holdings, exposure and characteristics tables.

Mutual-fund dealing/series facts live in `investment_mutual_fund_terms`:

- series name
- fund code
- CIFSC category
- load structure
- sales status
- minimum initial / additional investment
- income distribution frequency
- capital-gains distribution frequency
- source + as-of date

GIC terms remain in `investment_deposit_terms`.

## 7. Mutual-fund series rule

A mutual fund can have multiple series with different fees, eligibility and dealing terms. V1 therefore treats the fund code / series as part of the investable research identity.

The UI must show Series prominently on the fund detail page and must not imply that a fee from one series applies to every series of the same fund family.

## 8. Match contract

`matchEligible(assetType)` returns true for:

- `ETF`
- `MUTUAL_FUND`

and false for GIC in V1.

The canonical Match engine consumes `v_investment_dna_v2`, which is scoped to ETFs + mutual funds. Mutual funds must meet the same safety prerequisites used for fund Match: a valid strategic allocation, official issuer risk classification, current intelligence model and source-backed fund facts.

GICs remain research products in V1. Their terms — rate, term, redeemability and deposit-insurance basis — are shown without a fabricated compatibility score.

## 9. Market-data freshness

ETF prices and mutual-fund NAV/price history use the audited daily market-data worker.

Mutual funds use provider-specific aliases stored in `market_data_symbol_aliases` so a public fund code such as `RBF460` is never conflated with a third-party provider symbol.

Current temporary Canadian route:

- provider: Yahoo Finance temporary research feed
- cadence: daily after the configured Toronto market-close threshold
- ETF mapping: TSX / Cboe suffix transforms
- Mutual Fund mapping: explicit provider alias
- mutual-fund canonical row stores provider close as both `close` and `nav`

Issuer disclosures remain the source of truth for Series, fees, objectives, strategic allocation and official risk classifications. The daily worker does not overwrite those slower-moving research facts.

## 10. V1 UI identity

Product type should remain visually recognizable across Explore, Detail, Compare and Home.

- ETF — existing teal identity.
- Mutual Fund — dedicated blue identity.
- GIC — existing gold identity.

The color is a navigation aid, not a risk signal.

## 11. Change-control rule

Before exposing a new product type in public V1 or a later release:

1. define its taxonomy and product-specific facts;
2. define verified source/freshness requirements;
3. decide whether Match is disabled, experimental or validated;
4. define same-type comparison metrics;
5. add contract + browser regression tests;
6. only then add it to the public visibility list.

The focused V1 rule is deliberate: product breadth in the database must not automatically become UI complexity.
