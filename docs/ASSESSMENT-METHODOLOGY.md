# Investing DNA Assessment Methodology

## Status

Current research instrument: **v1.10-cognitive-candidate**.

Current scoring model: **dna-v1.10-research**.

Current canonical match model: **investment-dna-match-v6**.

This is a **scientifically structured, pre-validation instrument**. Milestone 1 establishes engineering consistency, safety behavior and reproducibility; it does **not** establish psychometric validity. Investing DNA must not be described as scientifically validated until cognitive testing, real-user pilot data, reliability analysis and structural validation are complete.

## Clean-room design rule

Investing DNA uses published academic and industry methods to identify useful constructs and sound questionnaire-design practices. It does **not** reproduce, translate or closely paraphrase proprietary competitor questions, scoring systems or reports.

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

Risk Tolerance is not mechanically increased because a user is experienced, wealthy or has a long time horizon.

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

This is treated as a financial capacity index rather than as a single latent psychological scale. Internal-consistency statistics should not be forced onto it as if all items measured one latent trait.

### 4. Investment Experience — context only

Three indicators:

1. Decision Experience
2. Product Exposure
3. Downturn Experience

Experience affects explanation depth and product-complexity context. It does not increase Risk Tolerance or override a capacity/safety constraint.

## v1.10 guarded-capacity rule

The ordinary Financial Capacity score remains visible as a research signal, but v1.10 also applies a conservative guard to the capacity used by the current profile and match engine.

- If **Loss Impact** scores 33 or below, the guarded capacity cannot exceed 39.
- If **Emergency Reserve** scores 0, the guarded capacity cannot exceed 39.
- The result stores both the raw capacity index and the guarded capacity, plus a review flag and reason.

This rule exists to prevent a high average across other financial-capacity questions from masking a critical inability to absorb investment losses. It is an engineering safety rule pending empirical calibration; it is not claimed to be a validated regulatory suitability threshold.

## Investment Context is separate from Investor DNA

Current context variables include:

- Goal
- Time Horizon / Horizon Months
- Liquidity Need
- Principal Protection Requirement
- Investment Share / concentration context
- Optional reporting/personalization fields such as first name, age and amount being considered

Context does not rewrite the psychological Risk Tolerance score. It constrains what can reasonably be treated as a fit for the specific money under consideration.

## Response design

v1.10 uses fully labelled response choices rather than 0–10 sliders.

Current research scoring is intentionally simple:

- Most ordered four-category items: 0 / 33 / 67 / 100
- Experience items: ordinal context values rather than Risk Tolerance points
- Product exposure: categorical/multi-choice context

These values are provisional measurement coordinates, not claims that psychological distances are known precisely.

## Planned redundancy and consistency

Repeated concepts are retained only when they have a clear purpose, such as reliability or response-consistency checking. Paired items are separated in the questionnaire so users are less likely to simply remember and repeat the prior answer.

Current research consistency pairs include:

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

The existing v1.9 clarification bank remains a reserve research asset and is not part of the v1.10 28-item core. Clarifiers are not shown automatically. Adaptive clarification should be enabled only after cognitive testing confirms that each item resolves ambiguity rather than introducing a second construct.

## Archetypes

The 3x3 archetype system is a consumer communication layer over Risk Tolerance x guarded Financial Capacity.

For v1.10, the provisional low/mid/high boundaries are **40 and 70**. These cut points are engineering/research boundaries, not empirically validated population norms. Archetype language should be framed as a current profile description rather than a permanent identity.

A critical capacity guard can therefore move a user out of a high-capacity archetype even when their raw capacity average would otherwise be high.

## Canonical Match architecture

Investor DNA and Investment Context remain separate inputs. The canonical engine is **investment-dna-match-v6** and follows this sequence:

`Investor DNA -> Match constraints -> Safety/eligibility gates -> Compatibility scoring -> Explanation -> Ranked result`

Current safety/constraint codes include:

- `financial_answers_missing`
- `essential_spending_at_risk`
- `emergency_buffer_short`
- `principal_protection_needed`
- `short_horizon`

The context-aware equity ceiling is constrained by the lowest relevant ceiling across Risk Tolerance, guarded Financial Capacity and Time Horizon. Short horizons can reduce the equity ceiling to zero.

The engine can return explicit non-ranking states:

- `review_required`
- `context_required`
- `no_suitable_options`
- `available`

It is therefore not forced to recommend or rank an investment when the inputs do not support one.

A review-required match score is stored as **NULL**, not zero. Zero would incorrectly imply a measured poor fit when the correct meaning is that the investment should not be ranked under the current constraints.

## Reproducible match runs

Every new canonical match run records or returns:

- Run ID
- Questionnaire version
- Investor DNA model version
- Scoring version
- Match model version
- Fund-data fingerprint/version
- Fund-data as-of date
- Input fingerprint
- Run timestamp

The input fingerprint includes the user's DNA, answers, investment context **and the scoring-relevant fund universe**. A meaningful change to fund data therefore invalidates the cached match run and generates a new run.

Legacy v3/v4/v5/v5.1 calculators remain in the database for historical reproducibility but are not executable by anonymous or authenticated browser roles. Consumer-facing readers use the canonical current run.

## Explainability rule

A match result is not complete unless the engine can expose the reasons behind it. The current payload carries fit labels, strengths, watchouts, eligibility/gate information, component scores and the investment DNA inputs used by the calculation.

Compatibility is an educational discovery/comparison signal, not personalized investment advice.

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
- calibrate safety thresholds with appropriate evidence/governance
- calibrate consistency thresholds
- test stability/retest behavior
- test criterion/convergent validity against suitable external measures

## Data hygiene

Legacy v1.3 and other development responses are engineering/test data and must not be used as psychometric validation evidence.

Development traffic uses **DEV_V1_10**.

Human cognitive-testing traffic uses **COGNITIVE_V1_10**.

These cohorts must remain separate.
