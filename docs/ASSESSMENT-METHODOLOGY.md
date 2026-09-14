# Investing DNA Assessment Methodology

## Status

Current research instrument: **v1.9-cognitive-candidate**.

This is a **scientifically structured, pre-validation instrument**. It must not be described as validated until cognitive testing, real-user pilot data, reliability analysis and structural validation are complete.

## Clean-room design rule

Investing DNA uses published academic and industry methods to identify useful constructs and good questionnaire-design practices. It does **not** reproduce, translate or closely paraphrase proprietary competitor questions, scoring systems or reports.

Every item should be defensible through this chain:

`construct -> measurement purpose -> original Investing DNA wording -> response design -> provisional scoring rationale`

A shared concept such as loss tolerance, financial capacity or investment experience is not treated as competitor-owned. Wording and product architecture must remain original.

## Why 28 core questions

The number 28 is an output of the current construct map, not a target number and not an attempt to mirror another provider.

- Risk Tolerance: 10 items
- Behavioral DNA: 10 items
- Financial Capacity: 5 items
- Investment Experience: 3 items

Total: **28 core items**.

The count can change after real pilot evidence. Item retention is based on information value, construct coverage, clarity, redundancy and reliability rather than a fixed questionnaire length.

## Measurement layers

### 1. Risk Tolerance — psychological willingness

Five dimensions, generally represented by two differently worded signals:

1. Growth–Risk Trade-off
2. Loss Tolerance
3. Uncertainty & Volatility
4. Risk Emotion
5. Crash Resilience

Risk Tolerance should not be mechanically increased because a user is experienced, wealthy or has a long time horizon.

### 2. Behavioral DNA — decision process

Five dimensions:

1. Decision Independence
2. Long-Term Orientation
3. Reference Flexibility
4. Evidence Discipline
5. Emotional Decision Control

These dimensions describe how investment decisions may be influenced. They are not clinical personality traits and should not be presented as diagnoses.

### 3. Financial Capacity — ability to absorb loss

Five financial indicators:

1. Financial Buffer
2. Income Stability
3. Emergency Reserve
4. Financial Responsibility
5. Loss Impact

This is better treated as a financial capacity index than as a single latent psychological scale. Internal-consistency statistics should not be forced onto it as if all items measured the same latent trait.

### 4. Investment Experience — context only

Three indicators:

1. Decision Experience
2. Product Exposure
3. Downturn Experience

Experience affects explanation depth and product-complexity context. It does not increase Risk Tolerance.

## Investment Context is separate from Investor DNA

Current context variables:

- Goal
- Time Horizon
- Liquidity Need

Optional reporting/personalization:

- First name
- Age
- Amount being considered

Return objective, loss consequence and self-rated experience were removed from the post-assessment context because they duplicated or contaminated constructs already measured in the core assessment.

Investment concentration may be useful later, but it belongs to the specific investment decision rather than stable Investor DNA.

## Response design

v1.9 uses fully labelled single-choice responses rather than 0–10 sliders.

Current research scoring is intentionally simple:

- 4-category ordered items: 0 / 33 / 67 / 100
- 5-category agreement items: 0 / 25 / 50 / 75 / 100, reversed when necessary

These values are provisional measurement coordinates, not claims that psychological distances are known precisely.

## Planned redundancy and consistency

Repeated concepts are retained only when they have a clear purpose, such as reliability or response-consistency checking. Paired items are separated in the questionnaire so users are less likely to simply remember and repeat the prior answer.

Current research consistency pairs:

- RT01 / RT02 — Growth–Risk Trade-off
- RT03 / RT04 — Loss Tolerance
- RT07 / RT08 — Risk Emotion
- RT09 / RT10 — Crash Resilience
- BD01 / BD02 — Decision Independence
- BD03 / BD04 — Long-Term Orientation
- BD05 / BD06 — Reference Flexibility
- BD07 / BD08 — Evidence Discipline

RT05/RT06 and BD09/BD10 are treated as related facets, not strict consistency pairs.

### Provisional consistency heuristic

Normalized pair difference:

- <= 25: aligned
- 26–50: mixed
- > 50: conflict

The consistency result is stored separately from Risk Tolerance and Financial Capacity. It **must not alter the underlying risk scores**.

These thresholds are pre-validation heuristics and may change after real-user data.

## Clarification bank

Version: **v1.9-cognitive-candidate-clarifiers**.

Nine reserve items exist for research and future adaptive assessment. They are not part of the 28-item core and are not yet shown automatically to users. Adaptive clarification should be enabled only after cognitive testing confirms that each clarifier resolves ambiguity rather than introducing a second construct.

## Archetypes

The 3x3 archetype system remains a consumer communication layer over Risk Tolerance x Financial Capacity.

Current boundaries for v1.9 are provisional thirds, not empirically validated cut points. Archetype language should be framed as a current profile description rather than a permanent identity.

## Match model separation

Investor DNA and Investment Context remain separate inputs.

Current compatibility architecture uses:

- Risk Fit
- Allocation Fit
- Volatility Fit
- Drawdown Fit
- Context Fit

Post-assessment context no longer re-scores loss capacity or risk preference through duplicate questions.

Compatibility is an educational signal, not investment advice.

## Validation roadmap

### Stage 1 — Cognitive testing

Target: 10–15 participants, initially 12 across two rounds.

Goal: establish comprehension and response-process validity before statistical calibration.

### Stage 2 — Real pilot

At approximately n >= 100:

- item distributions
- missingness/completion
- corrected item-total relationships
- pair relationships
- floor/ceiling effects
- response-quality patterns

### Stage 3 — Reliability and structure

Prefer approximately n >= 150 for stronger reliability work and larger samples for stable factor analysis.

Planned methods include:

- McDonald’s omega for Risk Tolerance
- alpha as a secondary statistic
- inter-item correlation + Spearman–Brown for two-item behavioral dimensions
- ordinal/polychoric methods where appropriate
- exploratory/confirmatory factor analysis only when sample size supports it

### Stage 4 — Calibration

Only after sufficient evidence:

- revise item set
- revise response scoring if supported
- calibrate archetype boundaries
- calibrate consistency thresholds
- test stability/retest behavior
- test criterion/convergent validity against suitable external measures

## Data hygiene

Legacy v1.3 responses are engineering/test data and must not be used as psychometric validation evidence.

Development traffic uses **DEV_V1_9**.

Human cognitive-testing traffic uses **COGNITIVE_V1_9**.

These cohorts must remain separate.
