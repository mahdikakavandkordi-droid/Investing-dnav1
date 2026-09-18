# Product Risk DNA — Cross-Asset Research Model

Status: **research design / pre-validation**  
Date: 2026-09-17

## 1. Purpose

Product Risk DNA describes the risk profile of an investment product **independently of any specific investor**. It is not a recommendation, not a suitability determination and not DNA Match.

The model is intentionally two-layered:

1. a common cross-asset risk language that can be compared across products;
2. asset-specific sensors that measure those common risks using the facts that matter for each asset class.

Principle: **same risk concept, different measurement engine by asset class.**

This model should sit beside the existing Investment DNA structure/role profile. It does not replace official issuer/regulatory risk disclosure and it does not replace DNA Match.

## 2. Separation of concepts

### Product Risk DNA
Intrinsic product/instrument risks such as market loss, credit, liquidity, concentration, leverage, complexity and custody/structure.

### Product Role / Structure DNA
What the product is structurally designed to do: growth participation, income predictability, capital-protection mechanism, time structure and similar role characteristics.

### Official risk disclosure
Any official issuer/regulatory risk category remains displayed as its own source-backed field. It is not silently converted into an Investor DNA proprietary score.

### DNA Match
Investor DNA + money context + verified product facts. Match remains a separate compatibility model.

## 3. Common cross-asset risk families

The common layer uses seven primary risk families. A product can have `N/A` for a genuinely non-applicable family; missing data is `Unknown`, never `Low`.

| Code | Risk family | Meaning |
|---|---|---|
| MKT | Market / Value Risk | Potential for adverse changes in market value or economically relevant value before exit/maturity. |
| CRD | Credit / Counterparty Risk | Risk that an issuer, guarantor, counterparty or support provider fails to perform. |
| LIQ | Liquidity / Exit Risk | Difficulty accessing cash or exiting near fair value when desired. Includes lock-up/redemption constraints. |
| CON | Concentration Risk | Dependence on a single issuer, asset, sector, geography, borrower pool or other narrow exposure. |
| LEV | Leverage / Non-linearity Risk | Amplification, margin, embedded options, path dependency or asymmetric payoff risk. |
| CMP | Complexity / Transparency Risk | Difficulty understanding payoff, valuation, holdings, structure or the drivers of return/loss. |
| OPS | Operational / Custody / Structural Risk | Custody, settlement, platform, sponsor, legal-vehicle, collateral, operational and structural dependencies. |

### Cross-asset modifiers

These are stored separately because forcing them into every product's universal score would create false precision:

- `RATE` — interest-rate / duration sensitivity;
- `FX` — currency risk;
- `INF` — inflation / purchasing-power risk;
- `TIME` — maturity / lock-up / roll / reinvestment characteristics;
- `PROTECT` — contractual, insured or conditional principal-protection basis;
- `VAL` — valuation uncertainty / stale-pricing risk where relevant.

## 4. Output scale

Consumer-facing Product Risk DNA should initially use bands rather than a fake precise number:

- Low
- Low to Medium
- Medium
- Medium to High
- High
- Unknown
- N/A

Internally, sensors may map to `0..4` for testing and calibration:

- 0 = Low
- 1 = Low to Medium
- 2 = Medium
- 3 = Medium to High
- 4 = High

An internal composite may be calculated for research, but **must not be consumer-facing until calibrated and reviewed**.

## 5. Measurement pipeline

```text
verified source facts
  -> asset-specific sensors
  -> common risk-family bands
  -> hard floors / overrides
  -> confidence + freshness
  -> consumer Risk DNA vector
```

Every scored family stores:

- band;
- raw sensor inputs;
- reason/explanation;
- source provenance;
- as-of date;
- confidence;
- model version.

Unknown critical facts must reduce confidence or withhold a result; they must never be interpreted as low risk.

## 6. Asset-class modules

The tables below define the first research design. Weight suggestions are priors for internal calibration only.

### 6.1 ETF / Mutual Fund

#### Common families used
- MKT
- CRD
- LIQ
- CON
- LEV
- CMP
- OPS

#### ETF/fund-specific sensors

**MKT**
- official issuer/CSA risk category from `investment_official_risk_ratings` — the canonical ETF volatility/Price Movement input, never the generic historical `risk_level` field;
- realized volatility;
- maximum drawdown;
- beta / market sensitivity where appropriate;
- equity/fixed-income/commodity exposure mix;
- duration and credit profile for bond ETFs;
- currency exposure and hedging status.

**CRD**
- weighted portfolio credit quality for bond funds;
- counterparty exposure from swaps/derivatives;
- securities-lending counterparty/collateral framework where material.

**LIQ**
- bid/ask spread;
- median trading volume / dollar volume;
- premium/discount to NAV;
- creation/redemption mechanism;
- underlying holdings liquidity;
- AUM / fund size as a secondary sensor, not a direct risk score.

**CON**
- top-10 holdings weight;
- HHI or similar concentration measure;
- sector concentration;
- geography concentration;
- single-theme/single-commodity exposure.

**LEV**
- leveraged/inverse flag;
- target leverage multiple;
- derivative notional exposure;
- reset frequency / path dependency.

**CMP**
- physical vs synthetic replication;
- derivatives complexity;
- active rule complexity;
- holdings transparency;
- strategy complexity.

**OPS**
- issuer/fund structure;
- index/benchmark dependency;
- custody/administrator/provider concentration where material;
- fund closure/liquidation state.

#### ETF-only overlay
- tracking error / tracking difference;
- premium/discount volatility;
- authorized-participant / underlying-liquidity dependence.

#### Mutual-fund-only overlay
- redemption frequency;
- redemption gates/suspension terms;
- NAV valuation frequency;
- stale/illiquid underlying valuation exposure.

#### Suggested research weights
MKT 30 / LIQ 15 / CON 15 / LEV 10 / CMP 10 / CRD 10 / OPS 10.

### 6.2 Public Equity / Common Stock

#### Common families used
MKT, CRD, LIQ, CON, LEV, CMP, OPS.

#### Stock-specific sensors

**MKT**
- realized volatility;
- max drawdown;
- beta;
- earnings/event gap history;
- cyclicality/sector sensitivity.

**CRD / Financial resilience**
- net debt / EBITDA or comparable leverage;
- interest coverage;
- debt maturity profile;
- cash-flow stability;
- balance-sheet liquidity.

**LIQ**
- average daily dollar volume;
- bid/ask spread;
- free float;
- market capitalization.

**CON**
- single-company concentration is structurally high at the security level;
- customer/revenue concentration;
- geography/segment concentration.

**LEV**
- corporate financial leverage;
- embedded derivative/warrant structures if material.

**CMP**
- business model complexity;
- accounting complexity;
- disclosure quality;
- related-party complexity.

**OPS**
- governance/key-person dependence;
- legal/regulatory operational exposure;
- custody/market infrastructure only as secondary factors for listed shares.

#### Suggested research weights
MKT 30 / CRD 20 / LIQ 15 / CON 15 / LEV 10 / CMP 5 / OPS 5.

### 6.3 Government T-Bill / Short Sovereign Money Market

#### Common families used
MKT, CRD, LIQ, CON, CMP; LEV normally N/A; OPS generally low.

#### T-Bill-specific sensors

**MKT**
- remaining term;
- price sensitivity to yield changes;
- discount-rate movement.

**CRD**
- sovereign issuer quality;
- currency/settlement jurisdiction.

**LIQ**
- secondary-market depth;
- dealer access;
- bid/ask spread if available.

**CON**
- single sovereign issuer.

**CMP**
- plain discount instrument vs unusual structure.

**Modifiers**
- RATE: remaining term / rate sensitivity;
- INF: expected real-return erosion risk;
- TIME: maturity and reinvestment risk.

#### Suggested research weights
CRD 30 / LIQ 25 / MKT 20 / CON 15 / CMP 5 / OPS 5.

### 6.4 Bond — Government / Provincial / Corporate

#### Common families used
MKT, CRD, LIQ, CON, LEV, CMP, OPS.

#### Bond-specific sensors

**MKT**
- duration;
- convexity where available;
- yield volatility;
- spread volatility;
- maturity.

**CRD**
- credit rating and outlook;
- issuer financial strength;
- credit spread;
- seniority/security;
- guarantor;
- covenant quality where available.

**LIQ**
- secondary-market trading activity;
- bid/ask spread;
- issue size;
- dealer depth.

**CON**
- single issuer;
- sector/issuer dependence for a single bond.

**LEV**
- normally low for plain bonds;
- higher if embedded leverage/structured exposure exists.

**CMP**
- plain bullet bond vs callable/putable/convertible/structured;
- embedded options;
- covenant complexity.

**OPS**
- settlement/legal structure;
- collateral/trustee/guarantee structure if relevant.

**Modifiers**
- RATE: duration/convexity;
- INF: real purchasing-power risk;
- FX: non-CAD exposure;
- TIME: call/reinvestment/refunding risk.

#### Suggested research weights
CRD 25 / MKT 25 / LIQ 15 / CON 10 / CMP 10 / LEV 5 / OPS 10.

### 6.5 GIC / Term Deposit

#### Common families used
CRD, LIQ, CON, CMP, OPS; MKT is usually low or N/A for a plain held-to-term fixed GIC.

#### GIC-specific sensors

**CRD**
- issuing institution;
- deposit-insurance eligibility;
- insurer/scheme;
- whether protection is conditional on category/member status.

Important: whether a particular investor is fully covered by a deposit-insurance limit is investor-specific and belongs in Match/context, not intrinsic Product Risk DNA.

**LIQ**
- redeemable/cashable/non-redeemable;
- lock-up term;
- early redemption rules;
- penalty/reduced-rate terms.

**CON**
- single financial institution exposure.

**CMP**
- plain fixed-rate GIC = low;
- market-linked/index-linked GIC should be routed to a structured-product overlay.

**OPS**
- issuer / broker / nominee arrangement;
- trust/beneficiary record requirements when relevant.

**Modifiers**
- INF: purchasing-power risk;
- TIME: term and reinvestment risk;
- PROTECT: contractual principal + deposit insurance eligibility where applicable.

#### Suggested research weights
CRD 35 / LIQ 30 / CON 15 / OPS 10 / CMP 10.

### 6.6 Commercial Paper (CP)

#### Common families used
CRD, LIQ, CON, MKT, CMP, OPS.

#### CP-specific sensors

**CRD**
- short-term issuer rating;
- issuer financial quality;
- unsecured vs secured status;
- parent/guarantor support.

**LIQ**
- dealer market depth;
- secondary trading availability;
- time to maturity.

**CON**
- single issuer;
- funding dependence.

**MKT**
- spread movement;
- very short duration generally limits rate sensitivity but does not eliminate price/liquidity stress.

**CMP**
- plain unsecured CP vs extendible/structured variant.

**OPS**
- settlement/dealer dependence;
- documentation/support structure.

**Modifiers**
- TIME: maturity and rollover/refinancing conditions;
- FX if foreign currency.

#### Suggested research weights
CRD 40 / LIQ 25 / CON 15 / MKT 10 / CMP 5 / OPS 5.

### 6.7 ABCP / Asset-Backed Short-Term Paper

#### Common families used
CRD, LIQ, CON, LEV, CMP, OPS, MKT.

#### ABCP-specific sensors

**CRD**
- program short-term rating;
- asset-pool quality;
- arrears/default performance;
- credit enhancement / overcollateralization;
- sponsor strength;
- liquidity-provider strength;
- seniority/priority of payment.

**LIQ**
- secondary-market depth;
- liquidity facility terms;
- maturity mismatch between assets and paper;
- rollover/refinancing dependence.

**CON**
- asset-pool obligor concentration;
- seller concentration;
- sponsor concentration;
- asset-class concentration.

**LEV**
- conduit financing leverage;
- structural subordination;
- derivative/hedging leverage where applicable.

**CMP**
- number of structural layers;
- transparency of asset pools;
- second-level assets;
- waterfall complexity;
- triggers and support arrangements.

**OPS**
- sponsor;
- trustee;
- servicer;
- liquidity provider;
- swap counterparties;
- bankruptcy remoteness.

**MKT**
- rate/spread movement is secondary to credit/liquidity/structural risk for short maturities.

#### Suggested research weights
CRD 30 / LIQ 25 / CMP 15 / OPS 10 / CON 10 / LEV 5 / MKT 5.

### 6.8 Structured Notes — Principal Protected / Principal at Risk

#### Common families used
MKT, CRD, LIQ, CON, LEV, CMP, OPS.

#### Structured-note-specific sensors

**MKT**
- underlying asset volatility;
- barrier distance;
- participation rate/cap;
- autocall triggers;
- downside formula;
- term.

**CRD**
- issuer/guarantor credit risk;
- protection is only as strong as the contractual obligor.

**LIQ**
- secondary-market availability;
- issuer market-making commitment;
- early redemption terms.

**CON**
- single issuer + underlying basket concentration.

**LEV**
- leveraged participation;
- knock-in/knock-out;
- digital/binary payoff;
- path dependence;
- contingent loss formula.

**CMP**
- payoff complexity;
- number of conditions/triggers;
- valuation opacity;
- embedded derivative structure.

**OPS**
- issuer/counterparty;
- calculation agent;
- underlying benchmark governance.

**Modifiers**
- PROTECT: none / conditional / contractual-at-maturity;
- TIME: maturity/autocall;
- FX where applicable.

#### Suggested research weights
MKT 20 / CRD 20 / LIQ 15 / LEV 15 / CMP 15 / OPS 10 / CON 5.

### 6.9 Options

Options require **position-level** rather than instrument-only risk because a long call, covered call, vertical spread and naked short call have fundamentally different loss profiles.

#### Common families used
MKT, LIQ, CON, LEV, CMP, OPS; CRD is generally low for exchange-cleared listed options but higher for OTC structures.

#### Option-specific sensors

**MKT**
- underlying volatility;
- delta;
- gamma;
- vega;
- strike/moneyness;
- gap risk.

**LIQ**
- bid/ask spread;
- open interest;
- trading volume;
- underlying liquidity.

**LEV**
- max loss / capital at risk;
- notional exposure;
- margin requirement;
- uncovered short flag;
- possibility of loss exceeding initial premium/capital.

**CMP**
- strategy legs;
- early exercise/assignment exposure;
- payoff shape;
- Greeks sensitivity;
- American vs European exercise.

**CON**
- single underlying/expiry/strike concentration.

**OPS**
- exchange/clearing vs OTC;
- settlement and exercise mechanics.

**Modifiers**
- TIME: days to expiry / theta;
- FX if underlying/settlement currency differs.

#### Suggested research weights
LEV 30 / MKT 25 / LIQ 15 / CMP 15 / CON 10 / OPS 5.

### 6.10 Futures / Forwards

#### Common families used
MKT, LIQ, CON, LEV, CMP, OPS, CRD.

#### Futures/forward-specific sensors

**MKT**
- underlying volatility;
- gap/limit-move behavior;
- basis risk.

**LEV**
- notional / margin ratio;
- maintenance margin;
- margin-call sensitivity;
- potential loss beyond posted margin.

**LIQ**
- contract volume/open interest;
- bid/ask spread;
- expiry-month liquidity.

**CRD**
- exchange-cleared futures: generally lower direct counterparty risk;
- OTC forwards: counterparty credit exposure.

**CMP**
- settlement method;
- delivery terms;
- basis/roll mechanics;
- hedge mismatch.

**OPS**
- exchange/clearing broker;
- delivery/settlement mechanics.

**Modifiers**
- TIME: expiry/roll;
- FX for currency exposures.

#### Suggested research weights
LEV 30 / MKT 25 / LIQ 15 / CRD 10 / CMP 10 / OPS 5 / CON 5.

### 6.11 Commodities / Commodity ETPs

Direct physical commodity and futures-based ETPs must be distinguished.

#### Common families used
MKT, LIQ, CON, LEV, CMP, OPS.

#### Commodity-specific sensors

**MKT**
- spot/futures volatility;
- drawdown;
- supply/demand shock sensitivity;
- weather/geopolitical sensitivity where relevant.

**LIQ**
- physical market depth or futures-contract liquidity;
- spread;
- ability to roll exposure.

**CON**
- single commodity vs diversified basket.

**LEV**
- futures leverage;
- leveraged ETP multiple.

**CMP**
- physical-backed vs futures-based;
- contango/backwardation;
- roll methodology;
- collateral policy.

**OPS**
- storage/custody for physical assets;
- futures counterparty/clearing structure;
- sponsor/trust structure.

**Modifiers**
- FX because most commodities are globally priced;
- TIME through futures roll/expiry.

#### Suggested research weights
MKT 35 / LIQ 15 / CON 15 / LEV 15 / CMP 10 / OPS 10.

### 6.12 REIT / Real-Estate Securities

Publicly traded REIT and non-traded/private REIT require separate liquidity/valuation treatment.

#### Common families used
MKT, CRD, LIQ, CON, LEV, CMP, OPS.

#### REIT-specific sensors

**MKT**
- share/NAV volatility for traded REITs;
- property valuation sensitivity;
- sector/property-type cycle.

**CRD**
- debt maturity profile;
- interest coverage;
- secured/unsecured borrowing;
- tenant credit quality where concentrated.

**LIQ**
- exchange liquidity for public REITs;
- redemption program/gates/lock-up for non-traded REITs.

**CON**
- property type;
- geography;
- tenant concentration;
- top assets.

**LEV**
- debt/assets or debt/EBITDA;
- mortgage leverage;
- derivative hedging.

**CMP**
- externally managed structure;
- related-party arrangements;
- mortgage REIT / hybrid complexity.

**OPS**
- property manager/external manager;
- valuation process;
- sponsor/conflict structure.

**Modifiers**
- RATE: financing and cap-rate sensitivity;
- VAL: private/non-traded appraisal uncertainty.

#### Suggested research weights
LEV 20 / MKT 20 / CRD 15 / LIQ 15 / CON 15 / OPS 10 / CMP 5.

### 6.13 Crypto Asset / Crypto ETP

Direct crypto and regulated crypto ETP exposure should share market-risk sensors but differ materially in custody/operational structure.

#### Common families used
MKT, LIQ, CON, LEV, CMP, OPS, CRD.

#### Crypto-specific sensors

**MKT**
- realized volatility;
- max drawdown;
- jump/gap risk;
- correlation regime instability.

**LIQ**
- market depth;
- spread;
- exchange concentration;
- 24/7 liquidity quality under stress.

**CON**
- token concentration;
- holder concentration;
- ecosystem/protocol dependence.

**LEV**
- derivatives/perpetual leverage;
- liquidation mechanics;
- rehypothecation where applicable.

**CMP**
- protocol mechanics;
- tokenomics;
- smart-contract dependencies;
- stablecoin reserve/redemption design where relevant.

**OPS**
- custody model;
- private-key risk;
- platform registration/status;
- cyber/hacking risk;
- bankruptcy/client-asset segregation;
- protocol/bridge/oracle risk.

**CRD**
- platform/counterparty/stablecoin issuer risk where applicable.

#### Crypto ETP overlay
- regulated fund/trust custody;
- premium/discount;
- ETF liquidity;
- underlying crypto-market liquidity;
- tracking difference.

#### Suggested research weights
MKT 25 / OPS 20 / LIQ 15 / CMP 15 / CON 10 / LEV 10 / CRD 5.

### 6.14 Private Equity / Private Debt / Private Real Estate

Private assets need an especially strong `Unknown`/confidence model because public market data can be sparse.

#### Common families used
MKT, CRD, LIQ, CON, LEV, CMP, OPS.

#### Private-asset-specific sensors

**MKT / Economic value**
- underlying business/property/loan exposure;
- economic sensitivity;
- comparable-market movements;
- valuation marks are not treated as equivalent to liquid-market volatility.

**CRD**
- underlying borrower/company leverage and default risk;
- fund-level borrowing;
- preferred/senior/subordinated position.

**LIQ**
- lock-up;
- redemption windows;
- secondary-market availability;
- transfer restrictions.

**CON**
- number of portfolio companies/assets;
- geography/sector;
- sponsor concentration.

**LEV**
- portfolio-company debt;
- fund-level subscription/NAV facilities;
- property leverage.

**CMP**
- partnership waterfall;
- carried interest;
- valuation policy;
- side letters/complex structures.

**OPS**
- manager/key-person risk;
- administrator/custodian;
- governance;
- capital-call process;
- conflicts.

**Modifiers**
- VAL: valuation uncertainty/staleness;
- TIME: fund life, lock-up, exit dependence.

#### Suggested research weights
LIQ 20 / LEV 20 / OPS 15 / CON 15 / CRD 10 / CMP 10 / MKT 10.

## 7. Hard rules / floors

These are candidate safety rules for research calibration:

1. Missing critical data never maps to Low; return `Unknown` or withhold the family.
2. A product with the possibility of loss beyond invested capital receives `LEV = High` and cannot receive a low overall research band if an aggregate is later introduced.
3. A non-traded product with no reliable redemption/secondary market receives at least `LIQ = Medium to High`, subject to product-specific evidence.
4. A principal-protected product does **not** bypass issuer credit risk. Protection at maturity is separate from CRD.
5. A leveraged/inverse daily-reset ETF receives elevated LEV and CMP even if historical volatility during a short sample was modest.
6. A structured product with barriers/autocall/path dependence receives at least elevated CMP.
7. Stale or model-valued private assets do not receive artificially low MKT merely because reported NAV volatility is smooth; VAL must reflect valuation uncertainty.
8. Crypto custody/platform risk is separate from price risk and must not be hidden inside MKT.

## 8. Confidence and freshness

Each Product Risk DNA output includes confidence:

- **High** — critical sensors current, source-backed and complete;
- **Medium** — usable but one or more meaningful secondary sensors missing or stale;
- **Low** — important facts missing, reference-only, modelled or stale;
- **Insufficient** — critical sensor missing; no family/overall conclusion should be produced.

Freshness windows must be asset-specific. Examples:

- prices/volatility/spreads: daily or near-daily;
- ETF holdings: issuer publication cadence;
- official risk rating: latest ETF/Fund Facts or issuer notice;
- GIC posted terms: current posted-rate date;
- bond ratings/terms: latest issuer/rating/source record;
- private asset valuations: latest valuation date with explicit lag;
- ABCP pool data/support: latest program disclosure.

## 9. Provisional internal composite

For calibration only:

```text
internal_risk_pressure =
  sum(asset_weight[d] * normalized_family_score[d])
  / sum(weights for applicable, known families)
```

Rules:

- do not impute Unknown as zero;
- do not compare raw composites across asset classes until calibration checks pass;
- hard floors override arithmetic averages;
- consumer UI should initially show the vector + dominant risks, not a single `/100`.

## 10. Consumer disclosure contract

The engine may remain detailed internally, but the default product page must stay simple.

### Default layer

Show only:

- **Overall Risk** — a plain-language overall band when calibrated;
- **Loss Potential** — how much invested value can realistically be at risk in adverse conditions;
- **Price Movement** — how much economically relevant value can move before exit or maturity;
- **Access to Money** — how easily the investor can exit or redeem without major delay or value concession;
- **Diversification** — how widely the product itself spreads exposure.

Each dimension has an info control that explains both **what it means** and **why it matters**. The scales have explicit direction: higher Loss Potential or Price Movement means more risk pressure; higher Access to Money or Diversification means more of a beneficial property. High diversification must never be described as protection against broad market losses.

### Asset-specific flags

Show only a few material flags in the default experience, such as `Locked until maturity`, `Single issuer exposure`, `Sensitive to interest rates`, `Uses leverage`, `Complex payoff`, `Currency exposure`, or `Custody/platform dependence`.

### Depth on demand

A `See full risk analysis` disclosure may reveal the internal risk families and asset-specific drivers. A separate methodology page explains the framework, sources, confidence/freshness rules and asset modules.

### Plain-language snapshot

The product page may show a short controlled summary generated only from verified Product Risk DNA plus Product Role / Structure DNA facts. It must not forecast returns or make a buy/sell recommendation. The narrative layer is deterministic/template-governed; generative AI must not invent or alter facts.

## 11. Research evidence used for this design

This design is informed by, but does not clone, existing regulatory/research frameworks:

- Canadian Securities Administrators standardized mutual-fund/ETF risk classification and ETF Facts risk disclosure.
- CIRO product due diligence / Know-Your-Product guidance emphasizing structure, complexity, leverage, liquidity, principal-loss, counterparties and concentration.
- EU PRIIPs methodology separating market risk and credit risk in the Summary Risk Indicator and using narrative liquidity warnings where relevant.
- FINRA bond-risk taxonomy including interest-rate/duration, credit/default, liquidity, reinvestment, call and inflation risks.
- CDIC GIC coverage rules separating the GIC product type from actual deposit-insurance eligibility/category limits.
- SEC/Investor.gov option, leveraged-product, REIT and private-placement risk guidance.
- CFTC futures/commodity guidance emphasizing leverage, margin, underlying volatility and market structure.
- CIRO Canadian crypto guidance emphasizing volatility, platform/custody, fraud/cyber and investor-protection differences.
- Bank of Canada CP/ABCP research and collateral criteria covering credit quality, liquidity support, asset pools, concentration, transparency, maturity mismatch and structural support.

## 12. Current shadow-calibration status

Implemented and live in shadow mode as of 2026-09-17:

- modular database foundation and service-only evidence boundary;
- asset-specific input adapters for all six current asset types;
- deterministic evaluators for ETF, GIC, T-Bill and Bond;
- conservative `Unknown / Insufficient` handling for identity-only Commercial Paper and ABCP references;
- four consumer dimensions with explicit direction;
- source-backed BMO ETF Facts observations for holdings count, average daily volume and bid-ask spread where used in calibration;
- service-only batch refresh of draft profiles;
- consumer UI contract and investment-detail card wired to the published-only RPC;
- public methodology surface explaining dimensions, confidence and separation from DNA Match;
- **55 draft profiles and 0 published Product Risk DNA profiles**.

### ETF calibration candidate

ETF measurement now separates four questions instead of copying a single risk label everywhere:

- **Price Movement** — uses the verified issuer/CSA risk rating from `investment_official_risk_ratings`. This is deliberate because the Canadian official category is fundamentally a volatility classification. Generic `investment_risk_metrics.risk_level` is not an ETF Product Risk source of truth.
- **Loss Potential** — derives from equity/fixed-income mix, sector concentration, principal structure and available credit-quality evidence. A broad 100% equity ETF can therefore have higher loss potential than its volatility band without changing the official disclosure.
- **Access to Money** — uses verified bid-ask spread when available. Current research bands are: <=0.10% High, <=0.25% Medium to High, <=0.50% Medium, <=1.00% Low to Medium, otherwise Low. When spread evidence is missing, the structure profile is only a lower-confidence fallback.
- **Diversification** — uses underlying-holdings count first, then direct holdings. Current research bands are: >=100 High, 50–99 Medium to High, 20–49 Medium, 10–19 Low to Medium, <10 Low. A single-sector ETF is capped at Medium. Missing counts fall back to the source-backed structure label with lower confidence.

The holdings rule measures breadth **inside the product**, not the diversification of an investor's whole portfolio.

### Hidden Overall Risk aggregation

The user never sees a numeric risk score. For calibration only, bands map internally to 0–4 and Access/Diversification are inverted into risk pressure. A versioned asset module combines the four consumer dimensions into the displayed Overall Risk band.

Current research weights:

| Asset module | Loss Potential | Price Movement | Access pressure | Concentration / low-diversification pressure |
|---|---:|---:|---:|---:|
| ETF / default | 40% | 45% | 10% | 5% |
| GIC | 80% | 10% | 10% | 0% |
| T-Bill | 65% | 20% | 10% | 5% |
| Bond | 35% | 55% | 5% | 5% |

These are **research calibration weights, not a regulatory standard**. They remain shadow-only until review. Asset-specific weighting is intentional: the same four consumer concepts are retained while the materiality of each risk differs by product structure.

Overall confidence is evidence-sensitive rather than cosmetic. For ETFs, a High overall confidence requires High-confidence evidence across all four consumer dimensions. Medium fallback evidence for Access or Diversification caps overall confidence at Medium; insufficient core Loss/Price evidence yields Insufficient. Direct-bond profiles follow the same principle: current structural issuer/rate/liquidity labels support Medium confidence, while High confidence requires direct issue-level evidence such as verified credit rating and duration/liquidity measurements.

Current ordering invariants include:

- cashable GIC access > otherwise comparable non-redeemable GIC access;
- Government of Canada 2Y overall risk < long-term Government of Canada bond overall risk;
- broad ETFs such as XEQT remain more diversified than concentrated sector ETFs such as XIT/ZEB;
- every ETF Price Movement band equals its current verified official issuer risk category when that category exists;
- CP/ABCP research references remain Unknown/Insufficient rather than being inferred as safe from low visible price volatility;
- public `app_get_product_risk` remains closed while publication count is zero.

### Remaining work before any publication

1. review all 55 draft summaries and ordering for consumer clarity;
2. extend source-backed ETF spread/holdings coverage beyond the current verified subset;
3. strengthen direct-bond credit-rating/duration evidence so the current Medium-confidence profiles can graduate only when direct issue-level evidence is present;
4. build issue-level CP/ABCP evidence before allowing non-Unknown outputs;
5. review the hidden weights/hard floors against external expert feedback;
6. only then publish a controlled pilot subset; the already-wired Product Risk card will remain hidden until the public RPC can read that reviewed subset.

## 13. Modular implementation contract

Runtime implementation is split so a new asset class does not force rewrites of the whole platform.

```text
verified source facts
  -> asset-specific sensor module
  -> internal common risk families
  -> consumer mapper
     -> Overall Risk
     -> Loss Potential
     -> Price Movement
     -> Access to Money
     -> Diversification
  -> material flags
  -> controlled summary
  -> optional full analysis
```

Code/data boundaries:

- `lib/product-risk/types.ts` — public contracts;
- `lib/product-risk/dimensions.ts` — the four consumer dimensions and help copy;
- `lib/product-risk/modules.ts` — asset-module registry and sensor contracts, with no scoring in UI;
- `lib/product-risk/api.ts` — thin browser read adapter;
- `product_risk_module_registry` — version/readiness metadata;
- `product_risk_profiles` — versioned draft/published product-level outputs;
- `product_risk_dimensions` — the four consumer dimensions;
- `product_risk_family_scores` — deeper optional analysis;
- `product_risk_sensor_evidence` — internal/source evidence, not browser-readable.

The foundation publishes no invented risk scores. Asset modules start in `research` readiness and calibrated profiles must be explicitly published before the public RPC returns them.


## 14. Evidence review queue

Shadow calibration now has a private, service-only review queue. It does **not** publish anything and it deliberately uses the label `evidence_ready_for_review`, not “ready to publish”.

A draft reaches `evidence_ready_for_review` only when:

- all four consumer dimensions exist;
- no consumer dimension is Unknown/N/A;
- Overall confidence is High;
- all four dimension confidences are High;
- the draft has a reported as-of date within the current 90-day internal review window.

Other drafts are classified as `needs_evidence` or `insufficient_evidence`. This queue is an operational calibration aid, not a consumer rating and not an automatic publication gate.

T-Bills illustrate the distinction between a stable band and evidence confidence: current Government of Canada T-Bill drafts remain Low Overall Risk, but Overall confidence is Medium because remaining term directly supports Price Movement while current research does not yet contain a direct bid-ask or market-depth measurement for Access to Money.
