# Investing DNA v1.9 — Hard Test Notes

Date: 2026-09-15

This document records engineering stress tests for the pre-validation v1.9 assessment. These tests are **not psychometric validation**. They are intended to catch scoring collapse, unreachable archetypes, obvious threshold problems, response-pattern bugs, and misleading presentation logic before human cognitive testing and a real pilot.

## Current model under test

- 28 core questions
- 10 Risk Tolerance
- 10 Behavioral DNA
- 5 Financial Capacity
- 3 Investment Experience
- Risk/Capacity item scoring: `0 / 33 / 67 / 100`
- Provisional v1.9 Risk/Capacity band cut points: `<40`, `40–<70`, `>=70`
- 9 archetypes from a 3 × 3 Risk Tolerance × Financial Capacity matrix

## Issue found and fixed: accidental 33/67 cut points

The v1.9 scorer was falling back to generic `33.333 / 66.667` cut points. With the four-point response scores, this meant a profile answering mostly the third response category (`67`) could be classified as High rather than Moderate.

The v1.9 scorer now explicitly uses provisional `40 / 70` cut points. These cut points remain subject to real-pilot calibration.

Sanity check after the change:

| Same response on all scored Risk/Capacity items | RT | RC | Archetype |
| --- | ---: | ---: | --- |
| A | 0 | 0 | VAULT |
| B | 33 | 33 | VAULT |
| C | 67 | 67 | MAVERICK |
| D | 100 | 100 | JACKPOT |

## Actual Supabase scorer: 9-zone reachability test

Nine synthetic assessments were passed through the real `calculate_investing_dna` function inside a transaction and rolled back after testing.

All nine intended archetypes were reachable and returned correctly:

- VAULT — pass
- ANCHOR — pass
- COOLHAND — pass
- SCOUT — pass
- MAVERICK — pass
- STRIKER — pass
- HOTSHOT — pass
- HIGHROLLER — pass
- JACKPOT — pass

The function returned the expected v1.9 boundaries of 40 and 70 for both Risk Tolerance and Financial Capacity.

## Large coherent-profile simulation

A 250,000-profile simulation was run using latent Risk Tolerance and Financial Capacity tendencies, item-level noise, and the exact four-point item scoring. This is more representative of coherent human response patterns than independent random clicking.

Observed archetype distribution:

| Archetype | Share |
| --- | ---: |
| VAULT | 17.38% |
| ANCHOR | 12.72% |
| COOLHAND | 10.82% |
| SCOUT | 12.92% |
| MAVERICK | 9.52% |
| STRIKER | 8.02% |
| HOTSHOT | 12.20% |
| HIGHROLLER | 8.92% |
| JACKPOT | 7.50% |

Result: **no archetype collapse**. All nine zones were populated. The largest single zone represented 17.38% of the simulated population.

The simulated latent-to-scored correlations were approximately:

- Risk Tolerance: 0.972
- Financial Capacity: 0.963

These correlations only show that the scoring pipeline preserved the simulated signal; they do not establish real-world validity.

## Persona-center stress test

Nine coherent persona clusters were generated around Low / Moderate / High Risk Tolerance and Low / Moderate / High Financial Capacity. The intended archetype was the dominant result in every cluster.

Approximate dominant-zone rates ranged from ~81% to 100%, depending on proximity to the provisional thresholds and item noise.

## Random-click fuzz test

100,000 profiles with independent random answers were also tested.

As expected, averaging independent random clicks pulls many scores toward the middle. The archetype distribution therefore became much more concentrated around the central zones, with MAVERICK around 48.6%.

This is **not interpreted as archetype collapse**, because random independent clicking is not a coherent investor profile. It is a useful QA pattern for detecting careless-response behavior.

The Response Consistency engine helps distinguish this behavior: in a separate 100,000-profile random-pair simulation, approximately 86.6% of profiles were labelled Low consistency and ~97.6% triggered at least one clarification conflict.

## Issue found and fixed: decision-style priority bias

The previous narrative layer assigned a single Decision Style using a fixed priority order. Under broad synthetic behavioral profiles, the first low-scoring dimension could dominate the label, creating an artificial concentration in labels such as Socially Responsive.

The user-facing report no longer relies on that priority label. It now identifies the person's **most distinctive decision tendency** from the behavioral dimension scores and explains it in plain language. The underlying five Behavioral DNA dimensions are unchanged.

A 100,000-profile uniform behavioral simulation after this presentation change produced no single dominant user-facing tendency above roughly 20.4%.

## Response Consistency behavior

The current consistency heuristic remains pre-validation.

With coherent paired responses plus moderate simulated item noise, the engine generally returned High or Moderate consistency and only a small proportion of strong conflicts. With fully random paired responses, Low consistency dominated strongly.

The report therefore keeps consistency in the detail layer and only surfaces a prominent warning when clarification is actually recommended. Consistency does not alter Risk Tolerance or Financial Capacity scores.

## UI / interpretation safeguards added

- Archetype illustration restored for all nine zones.
- 3 × 3 zone matrix restored.
- Risk Tolerance and Financial Capacity explained separately in plain language.
- Five Behavioral DNA dimensions shown as tendencies, not grades.
- Raw detail scores moved into an expandable details section.
- Strength and watchpoint phrasing retained as plain-language interpretation.
- Investment Experience remains context-only and does not increase Risk Tolerance.
- Investment Context remains separate from Investor DNA scoring.
- Context form was rebuilt for mobile-friendly single-column input.

## What this test does not prove

This hard test does not validate:

- the questionnaire's construct validity,
- reliability in real respondents,
- the 40/70 cut points,
- archetype prevalence in the Canadian population,
- or predictive investment behavior.

Those require cognitive testing and real pilot data. The next scientific sequence remains:

1. Cognitive interviews
2. Real-user pilot
3. Item distributions and response-time QA
4. Pair consistency and corrected item-total analysis
5. Reliability analysis
6. Threshold calibration
7. Larger-sample factor analysis if justified
