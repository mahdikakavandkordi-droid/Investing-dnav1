# Investment DNA & DNA Match Methodology

Status: research-stage / pre-validation methodology  
Last reviewed: 2026-09-16  
Canonical Match: `investment-dna-match-v7`  
Goal model: `goal-fit-v1`

This document separates three concepts that must not be conflated:

1. **Official ETF risk disclosure** — issuer-reported Canadian risk category from official product disclosure.
2. **Investment DNA** — Investor DNA's research-stage interpretation of an investment's structure and role.
3. **DNA Match** — a compatibility signal between Investor DNA, the money context and an ETF's verified research profile.

These outputs are research/discovery signals, not a recommendation to buy or sell a security and not a regulatory suitability determination.

## 1. Current product boundary

The public research catalog is cross-asset, but personalized DNA Match is currently **ETF-only**.

- Research catalog: ETF, GIC, T-Bill, Bond, Commercial Paper and ABCP reference instruments.
- Match universe: active ETFs in `public.v_investment_dna_v2` only.
- Non-ETF instruments remain research-only until a separate compatibility model is designed and tested.

The Match universe, Match payload `universe_count`, persisted Match result rows and fund-data fingerprint must all refer to the same ETF-only boundary.

## 2. Official risk is not an Investment DNA score

For ETFs in the current Match universe, the public-facing risk category comes from issuer disclosure or an official issuer risk-rating notice. Stored provenance includes:

- official risk category;
- issuer;
- source title and URL;
- source/effective date where available;
- verification timestamp.

Canadian issuer categories used by the engine are:

- Low
- Low to Medium
- Medium
- Medium to High
- High

The engine does not present these labels as a fake regulatory 0–100 score. Match v7 uses an internal compatibility demand mapping only to compare the disclosed category with the lower of Risk Tolerance and Risk Capacity. That mapping is a research implementation detail, not an official rating conversion.

## 3. Investment DNA signals

Current verified ETF research signals include:

- Growth orientation;
- Income orientation;
- Stability orientation;
- Diversification / exposure breadth;
- Liquidity;
- Complexity;
- Equity and fixed-income exposure;
- minimum horizon research signal;
- concentration/geography/style/objective metadata.

The current `intelligence-v1.1` signal methodology is source-backed and versioned. Missing data remains unavailable; the engine must not manufacture zeroes or freshness.

A higher signal is not intrinsically better. Its usefulness depends on the investor and the role of the money.

## 4. Safety and context gates are evaluated before ranking

Match v7 preserves the v6 safety architecture. The engine first derives `investor_private.match_constraints(assessment_id)` from Investor DNA, critical financial answers and money context.

Important stop/review conditions include:

- essential spending or an important commitment could be disrupted by loss;
- emergency reserve is critically short;
- principal protection is required/uncertain for the money;
- withdrawal horizon is under three years for the current ETF-only universe;
- required financial/context inputs are missing;
- current verified ETF data is incomplete;
- unsupported product complexity or missing official risk data.

`review_required` is a stop state. It produces no eligible/top Match and no numeric overall Match score.

Risk Capacity is a guardrail, never a reason to seek more risk. The exposure ceiling is bounded by the minimum of Risk Tolerance, Risk Capacity and the horizon ceiling.

Current horizon ceilings are research rules:

- under 36 months: 0% equity and `short_horizon` review gate;
- 36–<60 months: 40% equity;
- 60–<120 months: 70% equity;
- 120+ months: up to the Investor DNA risk/capacity ceiling.

## 5. Match v7 scoring structure

For complete money context, the current research score is:

```text
20% Official Risk Fit
40% Market Exposure Fit
25% Goal Role Fit
15% Exposure Breadth / Diversification
```

These weights remain research-stage and are not statistically validated suitability weights.

### Official Risk Fit

The engine compares the issuer-disclosed risk demand with the lower of the investor's Risk Tolerance and Risk Capacity. Capacity can only constrain the fit; it never raises the target risk.

### Market Exposure Fit

Equity exposure is compared with the current equity ceiling from Investor DNA plus withdrawal horizon. Exposure above the ceiling is penalized and cannot become eligible.

### Exposure Breadth

The current verified diversification signal is used as an interpretable breadth component. It is not a guarantee against loss.

## 6. Goal Role Fit (`goal-fit-v1`)

Match v6 treated several non-growth goals too similarly because they were primarily mapped to fixed-income share. Match v7 introduces a separately versioned Goal Fit layer that uses verified Investment DNA signals and, where appropriate, the time remaining until use of the money.

The goal function returns a 0–100 research-role score plus its component weights and a plain-language explanation.

### Growth

```text
100% Growth signal
```

Risk and horizon are still enforced separately; the goal model cannot override those limits.

### Retirement

Retirement blends Growth, Stability and Income, with more Stability/Income weight as the withdrawal horizon shortens.

```text
120+ months: 55% Growth / 25% Stability / 20% Income
60–119 months: 40% Growth / 35% Stability / 25% Income
36–59 months: 25% Growth / 45% Stability / 30% Income
```

### Income

```text
70% Income / 30% Stability
```

The Income signal describes investment role; it is **not** a distribution/yield forecast.

### Wealth Preservation

```text
80% Stability / 20% Income
```

A high preservation score does not imply contractual principal protection. Principal-protection requirements remain a separate safety gate.

### Education

Education is horizon-sensitive so Growth matters more when the goal is distant and Stability matters more as use of the money approaches.

```text
120+ months: 55% Growth / 35% Stability / 10% Liquidity
60–119 months: 45% Growth / 45% Stability / 10% Liquidity
36–59 months: 20% Growth / 65% Stability / 15% Liquidity
```

The long-horizon blend was calibrated during M4 stress testing so a zero-equity ceiling does not create a false no-option state solely because Goal Fit is slightly below the generic role floor.

### House Purchase

```text
120+ months: 45% Growth / 40% Stability / 15% Liquidity
60–119 months: 25% Growth / 60% Stability / 15% Liquidity
36–59 months: 10% Growth / 70% Stability / 20% Liquidity
```

### Major Purchase

```text
120+ months: 50% Growth / 35% Stability / 15% Liquidity
60–119 months: 30% Growth / 55% Stability / 15% Liquidity
36–59 months: 15% Growth / 65% Stability / 20% Liquidity
```

Unrecognized goals fall back to a neutral Growth/Stability blend and should be treated as a research-review condition before launch expansion.

## 7. Eligibility and Match states

After safety/data gates:

- `review_required` — ranking is paused;
- `context_required` — Investor DNA exists but the money context is incomplete;
- `no_suitable_options` — no ETF in the current verified universe passes the current limits;
- `available` — at least one ETF passes all current research limits.

An ETF is not eligible when any of the following apply:

- equity exposure exceeds the current ceiling;
- Official Risk Fit is below 60;
- overall Match score is below 70;
- complete-context Goal Role Fit is below 40;
- a safety/data review code is present.

`Closer fit` currently begins at 85; other eligible rows are `Possible fit`.

## 8. Incomplete context score policy

When money context is incomplete, the engine can internally order DNA-only comparisons for continuity/research, but the consumer-facing canonical payload redacts the overall `/100` Match score.

The public contract marks:

```text
status = context_required
context_only_score_policy = hidden_until_context_complete
```

This prevents an internal DNA-only comparison value from being mistaken for a personalized Match score. Component research signals may still be shown with explicit limited-context wording.

## 9. Explainability requirements

A Match row should be able to explain:

- official issuer risk and its compatibility with Investor DNA;
- equity exposure versus the current ceiling;
- goal-role score and the goal model used;
- meaningful strengths and conflicts;
- exposure breadth;
- data/safety review gates;
- what genuine input or product change could change the comparison.

For Match v7, the explanation payload includes `goal_fit` with `model_version`, `score`, component weights and a goal-specific summary.

## 10. Versioning and reproducibility

Current versions:

- questionnaire: `v1.10-cognitive-candidate`;
- Investor DNA: `dna-v1.10-research`;
- Investment DNA intelligence: `intelligence-v1.1`;
- Match: `investment-dna-match-v7`;
- Goal Fit: `goal-fit-v1`.

`investment-dna-match-v6` is retained server-side as historical/reproducible behavior but is no longer the canonical current Match. Browser callers consume only the singular `investor_private.current_match()` chain through approved app contracts.

Behavior-changing model revisions must receive a new version; historical versions must not be silently mutated.

## 11. Validation status

Match v7 passed engineering stress/regression acceptance, including:

- ETF-only universe checks;
- safety-gate invariants;
- null-score review behavior;
- horizon monotonicity;
- low-tolerance/no-forced-match behavior;
- goal differentiation A/B versus v6;
- 168-scenario synthetic grid comparison with no safety/status regression after calibration.

This does **not** establish psychometric validity, regulatory suitability validity or investment outcome validity.

Before launch, Match still requires:

- real-user comprehension testing;
- expert review of goal assumptions and guardrails;
- larger-universe calibration;
- source-freshness monitoring;
- Canadian securities/legal review of wording and behavior;
- privacy/compliance review of the full product flow.
