# Product Risk Model Research

Status: research draft v0.1 — not canonical, not production scoring  
Date: 2026-09-17

## Purpose

Define a cross-asset Product Risk architecture for Investor DNA before implementing any new scoring engine.

The design goal is to support one common risk language across asset classes while allowing each asset class to use its own measurement logic.

Key rule:

> Same risk concept, different measurement engine by asset class.

This model is separate from Investor DNA and DNA Match:

- Investor DNA describes the investor.
- Product Risk DNA describes the investment itself.
- Money Context describes the purpose and constraints of the money.
- DNA Match compares eligible investments with Investor DNA + Money Context.

## Evidence from existing frameworks

### Canada — CSA mutual fund / ETF risk classification

CSA requires a standardized risk classification for mutual funds and ETFs using a five-category scale from Low to High. The methodology uses historical standard deviation based on 10 years of performance, with a reference index permitted when the fund lacks sufficient history.

Implication: volatility is an accepted primary risk measure for pooled funds, but this methodology is asset-class specific and should not be generalized to GICs, direct bonds, options, private assets or other structures.

Sources:
- https://www.securities-administrators.ca/news/canadian-securities-administrators-publish-final-amendments-mandating-a-csa-mutual-fund-risk-classification-methodology-for-use-in-fund-facts-and-etf-facts/
- https://www.securities-administrators.ca/news/canadian-securities-regulators-seek-comments-on-a-mutual-fund-risk-classification-methodology/

### Canada — CIRO KYP / product due diligence

CIRO product due diligence expects assessment of product structure, features, risks, liquidity, complexity, leverage, principal-loss possibility, underlying investments, significant counterparties/guarantors and concentration controls. CIRO explicitly allows risk-based differences in the depth of review between simpler and more complex products.

Implication: a defensible retail product model should be multi-dimensional and asset-aware rather than based only on historical volatility.

Source:
- https://www.ciro.ca/newsroom/publications/product-due-diligence-and-know-your-product

### Europe — PRIIPs Summary Risk Indicator

PRIIPs uses a 1–7 Summary Risk Indicator. Market Risk is measured through a VaR-equivalent volatility framework and is combined with a Credit Risk Measure. Material liquidity risk is not simply collapsed into the same number; it can generate a separate warning. Currency and recommended-holding-period effects also receive separate disclosure treatment.

Implication: even a mature cross-product regulatory framework does not treat every important risk as one homogeneous score.

Sources:
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=consolidation%3A2017R0653%2F20220714_0040010
- https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A32021R2268R%2802%29

### CFA risk taxonomy

CFA identifies market, credit and liquidity risk as the core financial-risk families. Market risk includes equity prices, interest rates, exchange rates and commodity prices.

Implication: these three families are a strong foundation for a universal cross-asset taxonomy, with additional product-structure dimensions layered around them.

Source:
- https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/introduction-risk-management

## Proposed architecture

### Layer 1 — Universal Risk Families

These are common concepts across asset classes. A factor may be `not_applicable` for a specific product, but the vocabulary remains stable.

1. **Market Risk**
   - price variability / drawdown
   - interest-rate sensitivity
   - FX sensitivity
   - commodity-price sensitivity

2. **Credit / Counterparty Risk**
   - issuer default risk
   - guarantor / counterparty dependence
   - recovery / loss-given-default where relevant

3. **Liquidity / Exit Risk**
   - ability to sell or redeem
   - spread / market depth
   - redemption windows, penalties and lock-ups

4. **Concentration Risk**
   - single issuer
   - sector / geography / security concentration
   - underlying portfolio breadth

5. **Leverage / Non-linearity Risk**
   - leverage
   - short exposure
   - derivatives
   - convex / path-dependent payoff
   - potential loss beyond initial investment where applicable

6. **Complexity / Transparency Risk**
   - payoff complexity
   - valuation transparency
   - data/disclosure quality
   - dependence on models or opaque structures

7. **Operational / Custody / Structural Risk**
   - custody dependence
   - platform / settlement / operational dependence
   - legal or structural claims on assets
   - smart-contract / technical risk for digital assets

### Cross-cutting modifiers

These are not always independent risk families and should not automatically be summed into an overall score:

- maturity / recommended holding period
- lock-up / redemption structure
- principal protection / guarantee / deposit insurance
- inflation / purchasing-power exposure
- currency denomination and hedging
- source quality / evidence freshness

## Separate Role / Return Profile from Risk

The current `structure-v1` mixes true risk dimensions with product-role dimensions.

Current field -> proposed home:

- `capital_protection` -> risk mitigant / structure
- `liquidity_level` -> Liquidity Risk
- `price_volatility` -> Market Risk
- `income_predictability` -> Role / Cash-flow Profile
- `growth_participation` -> Role / Return Profile
- `interest_rate_sensitivity` -> Market Risk > Rate Risk
- `credit_exposure` -> Credit / Counterparty Risk
- `diversification_level` -> Concentration Risk
- `complexity_level` -> Complexity / Transparency Risk
- `time_structure` -> maturity / lock-up modifier
- `principal_protection_basis` -> risk mitigant / structure evidence

This means the existing model is reusable; it should be reorganized rather than discarded.

## Asset-specific measurement engines

### ETF / Mutual Fund

Common-family inputs:
- official CSA risk category
- realized volatility
- max drawdown
- equity / fixed-income / cash exposures
- portfolio concentration
- underlying liquidity
- bid-ask spread and premium/discount behavior for ETFs
- tracking error for index products
- leverage / inverse flag
- derivatives usage
- currency exposure / hedge status
- duration and credit quality for bond funds

Special ETF risks supported by external research include premium/discount to NAV, trading-spread/liquidity risk, tracking error and additional risks for leveraged/inverse products.

### Direct Equity

Inputs:
- realized volatility and drawdown
- market capitalization
- trading liquidity / spread / volume
- issuer concentration by definition
- financial leverage / balance-sheet fragility
- earnings / business cyclicality
- currency exposure where relevant

### Government / Corporate Bond

Inputs:
- duration / modified duration
- maturity
- convexity where available
- issuer / seniority
- credit rating
- credit spread
- callability
- liquidity / trading activity
- currency
- inflation linkage

FINRA identifies interest-rate, duration, credit/default, inflation, liquidity, call, reinvestment and event risks as important bond risks.

Source:
- https://www.finra.org/investors/investing/investment-products/bonds

### Treasury Bill / Commercial Paper / ABCP

Inputs:
- issuer / program credit quality
- maturity / rollover horizon
- market depth / liquidity
- asset backing where applicable
- liquidity support / credit enhancement for ABCP
- concentration in issuer / program
- structure transparency

Bank of Canada material supports treating short-term paper through explicit credit-quality and market-liquidity lenses rather than assuming low maturity means no risk.

Sources:
- https://www.bankofcanada.ca/markets/market-operations-liquidity-provision/market-operations-programs-and-facilities/commercial-paper-purchase-program/
- https://www.bankofcanada.ca/2024/06/cfif-batvn-publishes-educational-primer-canadian-asset-backed-commercial-paper/

### GIC / Term Deposit

Inputs:
- issuing institution
- CDIC membership / eligibility
- applicable insurance category and coverage context
- redeemability
- term / lock-up
- rate type: fixed, cashable, market-linked
- early-redemption penalties or rate reset
- inflation / reinvestment exposure

CDIC confirms eligible GICs can be protected subject to member-institution and coverage-category rules. Product liquidity and inflation exposure remain separate from deposit-insurance protection.

Sources:
- https://www.cdic.ca/depositors/whats-covered/guaranteed-investment-certificates-gics/
- https://www.cdic.ca/depositors/whats-covered/debentures-principal-protected-notes-and-term-deposits/

### Structured Notes / Principal-Protected Notes

Inputs:
- issuer credit
- degree and conditions of principal protection
- barrier / cap / participation / autocall mechanics
- payoff non-linearity
- underlying asset risk
- maturity / holding-period dependence
- secondary-market liquidity
- valuation transparency

Structured-note guidance repeatedly highlights issuer credit, liquidity and payoff complexity. Principal protection can depend on holding to maturity and on the issuer remaining solvent.

Sources:
- https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-76
- https://www.investor.gov/introduction-investing/investing-basics/investment-products/structured-notes-principal-protection

### Options

Inputs:
- underlying risk
- long vs short position
- defined vs potentially unlimited loss
- moneyness
- expiration
- implied volatility
- delta / gamma / vega / theta where appropriate
- liquidity / spread / open interest
- margin obligation
- assignment risk

Options are a clear example of why asset-specific engines are mandatory: the same universal families apply, but payoff and leverage risks depend heavily on contract position and strategy.

Sources:
- https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-63
- https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document

### Futures / Commodity-linked Products

Inputs:
- underlying commodity / financial market risk
- leverage / margin
- contract expiry
- roll / basis exposure
- liquidity
- gap risk
- settlement / delivery structure

Source:
- https://www.cftc.gov/LearnAndProtect/EducationCenter/FuturesMarketBasics/index2.htm

### REIT / Real Estate

Public REIT inputs resemble listed equity plus property-specific leverage, tenant/sector concentration and rate sensitivity. Non-traded real estate requires an additional illiquidity and valuation-transparency layer.

Source:
- https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-89

### Crypto / Digital Assets

Inputs:
- volatility / drawdown
- liquidity / market depth
- custody model
- platform / counterparty dependence
- protocol / smart-contract risk
- concentration / token economics
- regulatory / legal uncertainty
- leverage if derivatives are involved

Canadian regulators explicitly identify volatility, liquidity, cybersecurity, platform and custody risks as material.

Sources:
- https://www.ciro.ca/office-investor/understanding-risk/learn-about-risk-crypto-assets
- https://www.securities-administrators.ca/investor-tools/crypto-assets/recognizing-crypto-risks/

### Private Equity / Private Placements

Inputs:
- illiquidity / transfer restrictions
- valuation opacity / stale pricing
- limited disclosure
- concentration
- leverage
- manager / key-person dependence
- capital-call structure where relevant
- long holding period

Sources:
- https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-31
- https://www.investor.gov/introduction-investing/investing-basics/investment-products/private-investment-funds/private-equity

## Proposed data contract — research stage

Do not create an overall `/100` Product Risk score yet.

Each risk family should eventually store:

```text
risk_family
level              # not_applicable | low | low_medium | medium | medium_high | high
measurement_method # official | quantitative | rule_based | expert_curated
raw_metrics         # asset-specific evidence
confidence          # low | medium | high
source_basis
as_of_date
model_version
```

A product may therefore have a risk fingerprint such as:

```text
Market Risk              medium
Credit Risk              low
Liquidity Risk           high
Concentration Risk       medium
Leverage/Non-linearity   not_applicable
Complexity Risk          low
Operational/Custody      low
```

This is more informative than forcing every product into one number before calibration.

## Aggregation policy — not decided yet

Before any overall Product Risk score is introduced, we need to answer:

1. Should a high score in one severe dimension dominate the summary?
2. Which dimensions are additive versus non-compensatory?
3. Should liquidity remain a separate warning, following the PRIIPs logic?
4. Should official risk ratings override, constrain or merely coexist with our research classification?
5. How should `not_applicable` differ from missing data?
6. How should source confidence affect display or scoring?
7. Which factor mappings can be quantitative and which require rule-based classification?

No production score should be implemented until these questions are tested against representative products from every supported asset class.

## Proposed research sequence

### R1 — Common-factor taxonomy
Freeze definitions and prevent double counting between Market, Credit, Liquidity, Concentration, Leverage, Complexity and Operational/Structural risk.

### R2 — Asset-class sensor map
For every supported asset class, map real measurable fields into the common risk families.

### R3 — Benchmark set
Create a small labelled reference universe containing obvious low/medium/high examples inside each asset class and several intentionally tricky cross-asset comparisons.

### R4 — Rule calibration
Test whether factor rules produce intuitive ordering without hiding severe single-factor risks.

### R5 — Consumer presentation
Test whether users understand a multi-axis fingerprint better than a single risk label and whether a summary band adds value or creates false precision.

### R6 — Match integration
Only after Product Risk is stable should DNA Match consume it. Product Risk must remain investor-independent; Match remains investor/context dependent.

## Current conclusion

The strongest architecture for Investor DNA is not one universal formula applied identically to every asset.

It is:

```text
Universal risk vocabulary
        +
Asset-specific measurement engines
        +
Source/confidence/versioning
        +
Optional calibrated summary later
```

This preserves cross-asset comparability without pretending that ETF volatility, GIC lock-up risk, bond duration, option convexity and crypto custody risk can be measured by the same raw formula.
