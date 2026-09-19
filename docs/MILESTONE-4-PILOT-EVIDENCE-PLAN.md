# Investing DNA — Milestone 4: Pilot Evidence & Pre-Launch Hardening

**Status:** Active  
**Start date:** 15 September 2026  
**Entry baseline:** M1 Engine Trust ✅ · M2 Product Value ✅ · M3 Pilot & Launch Readiness ✅

## Goal

Milestone 4 must answer a different question from the first three milestones:

> Do real people understand the assessment and Match experience, perceive useful value, and complete the product loop without creating launch-level security, privacy or regulatory risk?

This milestone is evidence-led. Feature expansion is out of scope unless a repeated pilot finding requires a targeted fix.

## Workstreams

### A. Cognitive evidence — 12 participants

Use the controlled `COGNITIVE_V1_10` route only.

- Round 1: 6 moderated participants.
- Review item-level interpretation and response-option issues.
- Revise only when repeated evidence justifies a change.
- Round 2: 6 participants on the frozen revised candidate when applicable.
- Separate question-comprehension evidence from opinions about the product UI.

Exit gate:

- 12 planned sessions completed, or a documented stop/revision decision.
- No repeated major interpretation problem remains unresolved.
- Risk Tolerance and Financial Capacity are not routinely confused.
- Behavioral questions are not routinely answered as knowledge tests.
- Any material wording revision receives a new numbered questionnaire candidate before quantitative product-pilot use.

### B. Product pilot — initial 20–50 users

Do not start the quantitative product pilot until the cognitive gate is complete/frozen.

Primary funnel:

`Assessment start → Assessment complete → DNA result → Match/Fund → Screener/Compare → Save/Account → Return`

Pilot review signals:

- assessment completion rate,
- result-to-research continuation,
- Match comprehension,
- explanation trust,
- perceived usefulness,
- return intent,
- claim/watchlist/save behavior,
- actual returning sessions.

M3 operating targets remain provisional internal targets rather than scientific cutoffs.

### C. Pre-launch security & reliability hardening

Priorities at M4 start:

1. Classify all Supabase Security Advisor findings into: fix before pilot, fix before public launch, intentional/accepted, legacy/dead path.
2. Remove duplicate/obsolete RLS policies and preserve one canonical ownership rule per user-owned table.
3. Convert or isolate privileged public read paths where safe; do not blindly switch security-definer views if that would break intended public research access.
4. Remove public `SECURITY DEFINER` RPC exposure where a narrow security-invoker wrapper/private implementation can be used.
5. Add covering indexes on launch-critical foreign keys and fix RLS init-plan warnings on current account paths.
6. Keep M1–M3 regression suites green after each hardening batch.

### D. Real auth/email canary

Before public launch:

- verify Site URL and allowed redirect URLs for the intended deployed domain,
- send one real magic link to a controlled external inbox,
- click the real received email,
- verify callback/session hydration,
- verify guest DNA claim continuity,
- verify sign-out and return sign-in,
- document SMTP/provider/rate-limit configuration.

Deterministic browser mocks are not substitutes for this gate.

### E. Regulatory/privacy launch review

The product must continue to describe Match as research compatibility, not as an investment-quality score or expected-return forecast.

A disclaimer alone does not determine regulatory status. Before broader public positioning, obtain appropriate Canadian legal/compliance review of the actual tailored experience, including whether the business activity can constitute advising in securities.

Pilot-facing transparency surfaces:

- `/research` — methodology/limitations summary,
- `/privacy` — privacy-minimized pilot data summary,
- `/feedback` — structured pilot feedback.

The pilot privacy page is not a substitute for a final public-launch privacy policy.

### F. Data integrity

Keep the M2 truthfulness rules:

- do not infer missing fund data,
- do not convert unknown values to zero,
- label partial holdings/exposure coverage,
- preserve official risk-source provenance,
- track data freshness.

Broader universe expansion remains lower priority than reliable depth for the current universe during M4.

## M4 acceptance decision

At closeout, assign one of:

- **GO** — controlled evidence and launch hardening support a beta/public V1 decision.
- **CONDITIONAL GO** — product evidence is acceptable but named launch blockers remain.
- **NO-GO** — a material questionnaire, Match, security, trust or retention problem requires another iteration.

## What M4 must not claim prematurely

Until real evidence exists, do not claim:

- psychometric validation,
- product-market fit,
- proven retention,
- regulatory approval,
- personalized regulated advice capability,
- real-world email reliability,
- successful 20–50 user pilot.

## First implementation batch

Started at M4 entry:

- current Supabase security/performance advisor baseline captured,
- launch-critical RLS/index hardening batch designed,
- research/limitations disclosure surface added,
- pilot privacy summary added,
- global footer links added,
- Canadian registration/advice positioning identified as a formal pre-launch review gate.

Portfolio Builder remains frozen during Milestone 4.
