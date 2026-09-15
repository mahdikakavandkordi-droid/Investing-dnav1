# Investment DNA & Match Methodology

Status: research-stage / pre-validation product methodology

This document separates three things that must never be conflated in Investing DNA:

1. **Official fund/ETF risk disclosure** — an issuer-reported Canadian risk category from the product's official disclosure.
2. **Investment DNA signals** — Investing DNA's research-stage interpretation of the investment's role and structure.
3. **Investor ↔ Investment Match** — a compatibility signal combining the investor profile, the investment context, official risk, and Investment DNA signals.

None of these outputs is a recommendation to buy or sell a security.

## 1. Official risk is not an Investing DNA score

For Canadian ETFs in the current research universe, the public-facing risk category must come from the issuer's current official disclosure or an official issuer risk-rating change notice. We store:

- official risk category
- issuer
- source document title
- source URL
- source date / effective date where available
- verification timestamp

The five Canadian categories are:

- Low
- Low to Medium
- Medium
- Medium to High
- High

Investing DNA does **not** convert this public label into a fake consumer-facing score such as 60/100. Internally, the Match engine uses a categorical compatibility matrix because the Investor DNA risk-tolerance score and the issuer's regulatory risk category are different measurement systems.

## 2. Investment DNA signals

Investment DNA adds interpretable product signals that official risk alone cannot express. Current research-stage dimensions are:

- Growth orientation
- Income orientation
- Stability orientation
- Diversification
- Complexity
- Equity exposure
- Minimum suggested horizon
- Concentration
- Style / role

These signals come from the product profile, target allocation, suitability metadata, and available verified fund data. They are not regulatory ratings and are explicitly labelled as Investing DNA research signals.

A higher score is not automatically better. For example, higher Growth can be useful for a long-horizon growth goal but inappropriate for a short-horizon capital-preservation goal.

## 3. Why official risk and market exposure are both used

Official Canadian risk classifications are intentionally standardized and useful, but they can be broad. Two products with the same official risk category can have materially different asset mixes. For example, a balanced ETF and an 80% equity growth ETF can both sit in the same issuer-disclosed category.

Therefore Match v4.2 keeps the official risk category intact and adds a **separate proprietary Market Exposure Fit** based primarily on equity exposure. This is not presented as an official risk rating.

## 4. Match v4.2

Current research weights:

- 30% Official risk compatibility
- 15% Market exposure fit
- 20% Goal / investment role fit
- 15% Time-horizon fit
- 10% Access / stability fit
- 5% Diversification
- 5% Complexity vs investor experience

These weights are provisional and must be calibrated with real user and outcome research before any claim of validation.

### Official risk compatibility

Investor Risk Tolerance is grouped provisionally as:

- Low: <40
- Moderate: 40–<70
- High: >=70

The engine uses a categorical matrix rather than subtracting the Investor DNA score from a regulatory risk label.

### Risk Capacity is a guardrail, not a target

Financial Risk Capacity never tells the engine to seek more risk simply because the user can afford it. It only restricts products whose official risk category and/or market exposure appear high relative to the user's financial capacity.

### Market Exposure Fit

Equity exposure is evaluated separately from official risk. Low Risk Tolerance receives progressively stronger caution as equity exposure increases. Low Financial Capacity also acts as an exposure guardrail.

Current engineering guardrails include caps for combinations such as:

- low capacity + very high equity exposure
- low tolerance + 80–100% equity exposure
- investment horizon materially shorter than the product's minimum-horizon signal
- missing investment context (cannot receive the highest confidence tier)

These are research rules, not regulatory suitability determinations.

## 5. Investment context

Context is kept separate from Investor DNA. Current context inputs are:

- Goal
- Time horizon
- Liquidity / access need

Optional identity/reporting fields such as first name, age and amount do not alter the core Investor DNA score.

## 6. Explainability requirements

Every Match should be able to explain at least:

- the issuer's official risk category
- why that risk category is or is not broadly compatible with the investor
- whether market exposure creates an additional caution
- whether the investment role fits the user's goal
- whether the stated horizon is long enough
- whether access needs conflict with the product's stability profile
- any meaningful complexity mismatch

The UI should prefer plain-language reasons over raw sub-scores.

## 7. Data provenance rule

No investment should display an `Official risk rating` unless the source is stored and traceable. If the current official disclosure cannot be verified, the UI should show official risk as unavailable rather than substitute an internal score.

The current 16-ETF research universe has issuer-source metadata stored in `investment_official_risk_ratings`.

## 8. Validation status

Investment DNA and Match are currently engineering/research models. Synthetic and fixed-persona tests are used to detect collapse, impossible rankings, double-counting and guardrail failures. Synthetic tests do **not** establish investment suitability validity or psychometric validity.

Before launch, the Match model should undergo:

- source freshness checks
- scenario regression tests
- expert review of guardrails and explanations
- real-user comprehension testing
- calibration on a substantially larger investment universe
- Canadian securities/legal review of product wording and behavior

Version freeze for current demo work: `investment-dna-match-v4.2`.
