# Investing DNA — Milestone 3: Pilot & Launch Readiness

**Date:** 15 September 2026  
**Status:** Complete — controlled-pilot engineering acceptance gates passed.  
**Verified implementation head:** `b7cd64794fab6ea32986a5ca8fb25759bc82e331`  
**Canonical assessment:** `v1.10-cognitive-candidate` / `dna-v1.10-research`  
**Canonical match model:** `investment-dna-match-v6`

## What “complete” means

Milestone 3 turns the trusted engine and connected product from Milestones 1–2 into an instrumented, privacy-minimized product that can be tested with real participants without mixing development traffic, cognitive-study evidence and product-behavior evidence.

The milestone establishes:

`Controlled participant entry → Assessment → Result → Match/Fund/Screener/Compare → Save/Account/Return → First-party funnel evidence + structured feedback`

Milestone 3 is an **engineering and research-operations readiness milestone**. It does not mean the v1.10 questionnaire is psychometrically validated, that a real pilot has already produced sufficient evidence, or that the product is approved for public regulated-advice use.

The acceptance decision at this milestone is therefore:

- **GO for a controlled cognitive/product pilot.**
- **NO-GO for validation claims or unrestricted public launch.**

## Baseline problems addressed

Before Milestone 3, the product could be exercised end-to-end but could not answer basic pilot questions reliably:

1. There was no first-party funnel showing where users started, completed, explored, saved or returned.
2. Product feedback was qualitative/ad hoc rather than captured in a structured schema.
3. Cognitive-study traffic and normal development traffic could be mixed.
4. A public cognitive cohort name alone was not a sufficient recruitment boundary; the study needed controlled participant entry.
5. Product analytics needed to avoid becoming a second store of personally identifying or questionnaire-answer data.
6. Raw analytics/feedback needed a server-only write/read boundary rather than direct browser table access.
7. Founder/admin reporting needed stable summary read models instead of one-off SQL every time.
8. Browser regression needed to understand the new analytics/feedback requests so instrumentation could not silently break CI.
9. The checked-in migration filenames for the final M3 migrations briefly diverged from the actual Supabase migration versions and needed reconciliation before closeout.

## Changes completed

### 1. Privacy-minimized first-party product analytics

Milestone 3 adds a dedicated product-event model for pilot learning.

Tracked events include:

- `app_session_started`
- `explore_viewed`
- `assessment_started`
- `assessment_completed`
- `dna_result_viewed`
- `secure_link_requested`
- `signup_requested`
- `dna_claimed`
- `investment_context_saved`
- `match_viewed`
- `fund_viewed`
- `screener_viewed`
- `compare_viewed`
- `watchlist_saved`
- `watchlist_removed`
- `watchlist_viewed`
- `profile_viewed`
- `feedback_submitted`

The analytics contract intentionally excludes email addresses, names, IP addresses and questionnaire-answer text.

The browser supplies only random identifiers:

- `visitor_id` — random browser identifier,
- `browser_session_id` — random per-session identifier.

When a signed-in identity exists, user/profile linkage is attached server-side rather than trusting client-supplied ownership fields.

Metadata is allow-listed and length-limited in the Edge Function instead of accepting arbitrary JSON from the browser.

### 2. Backend-authoritative milestone events

Important lifecycle events are recorded at the server boundary where possible rather than relying only on UI JavaScript:

- assessment start,
- assessment completion,
- DNA claim,
- investment-context save.

Page/product interactions such as Explore, Match, Fund, Screener, Compare, Watchlist and Profile are recorded by the centralized client analytics component.

This split makes pilot evidence more robust than scattering custom analytics calls throughout unrelated page code.

### 3. Structured pilot feedback

A dedicated `/feedback` flow captures a compact post-use research signal:

- ease score (1–5),
- trust score (1–5),
- usefulness score (1–5),
- whether the user understood the Match explanation,
- whether the user would return,
- optional open feedback.

Scores are constrained at the database and Edge Function layers. Open feedback is length-limited.

Feedback updates are one-row-per-browser-session so repeated submits do not create artificial response inflation for the same session.

### 4. Analytics/feedback access boundary

`pilot_product_events` and `pilot_feedback` are protected with RLS and do not expose browser-readable/browser-writable policies.

Writes pass through the `investing-dna-pilot` Edge Function. Raw tables and founder summary views are not exposed to `anon` or ordinary authenticated browser roles.

A regression explicitly verifies that anonymous clients cannot read or directly insert into the analytics/feedback tables.

### 5. Controlled cognitive-study route

A dedicated route now exists for the v1.10 cognitive study:

`/pilot/cognitive`

It clears an existing development draft before entering the cognitive cohort so a participant cannot accidentally continue a `DEV_V1_10` assessment inside research data.

The cognitive study uses the dedicated cohort:

`COGNITIVE_V1_10`

Target: **12 participants**, operationally planned as 6 + review + 6.

### 6. Cognitive invite gate

The cognitive cohort is now protected by a moderator access code.

The raw code is not committed to the repository and is not written to analytics. Only a SHA-256 digest is stored as operational configuration on the cohort.

The frontend keeps the code only in session storage long enough to start the controlled session; the Edge Function verifies the digest before creating the participant/assessment.

This prevents a shared route or discovered cohort name from silently contaminating the cognitive-study sample.

### 7. Research protocol and pilot operations runbook

`docs/COGNITIVE-TEST-PROTOCOL.md` was updated to v1.10 and separates:

- item comprehension,
- construct contamination,
- response-option problems,
- product feedback,
- and psychometric claims.

`docs/PILOT-OPERATIONS.md` now defines:

- controlled cohort entry,
- moderator handling of the invite code,
- founder/admin funnel queries,
- structured feedback review,
- provisional internal product-pilot targets,
- data-review cadence,
- stop conditions,
- and launch gates that remain outside automated engineering checks.

### 8. Founder/admin summary read models

Service/admin-only views provide stable pilot summaries:

- `v_pilot_product_funnel`
- `v_pilot_feedback_summary`

These views aggregate counts and feedback statistics without exposing raw analytics tables to the browser.

### 9. Index and advisor cleanup for M3 tables

Foreign-key covering indexes were added for the new analytics/feedback relations after the Supabase performance advisor identified the missing indexes.

The new M3 tables therefore did not leave known unindexed-FK debt introduced by this milestone.

Broader pre-existing advisor findings elsewhere in the platform remain explicitly tracked rather than being mislabeled as resolved by M3.

### 10. Supabase migration history reconciled

The checked-in M3 migration versions now match the versions already applied to the live Supabase project:

- `20260915203405_milestone_3_pilot_analytics_feedback`
- `20260915203446_milestone_3_anonymous_visitor_link`
- `20260915204503_milestone_3_analytics_fk_indexes`
- `20260915204620_milestone_3_pilot_summary_views`
- `20260915204943_milestone_3_cognitive_invite_gate`

This closes the temporary migration-version drift that would otherwise make later migration synchronization ambiguous.

### 11. Edge Function upgraded and source-controlled

The deployed `investing-dna-pilot` Edge Function was upgraded to include analytics, feedback and controlled cognitive-entry behavior.

Its source and import map are checked into the repository so the deployed behavior is reproducible rather than existing only as an out-of-band Supabase edit.

### 12. Browser and CI regression expanded

The automated browser flows now understand the analytics contract and verify milestone behavior without sending live emails or creating real production pilot evidence.

The canonical assessment flow covers:

- v1.10 assessment start/resume,
- answer persistence,
- save retry,
- guest result semantics,
- secure-link request behavior,
- guest-to-account claim continuity,
- structured feedback submission,
- cognitive-study controlled entry,
- privacy-safe analytics identifiers,
- mobile viewport fit,
- and no runtime browser errors.

The connected fund/product flow covers:

- Explore → Fund,
- optional account continuity,
- Watchlist,
- Match,
- Screener,
- Compare,
- Profile/returning-user path,
- and corresponding product funnel events.

## Real-database verification — PASS

`supabase/tests/milestone_3_pilot_readiness.sql` was executed against the real Supabase project inside a rollback transaction at closeout.

It verified:

- valid synthetic product-event insertion,
- valid synthetic feedback insertion,
- event-name constraints,
- feedback-score constraints,
- anonymous analytics read denial,
- anonymous analytics insert denial,
- anonymous feedback read denial,
- and rollback-safe test isolation.

Result: **PASS: M3 pilot analytics privacy and constraints**.

## Current pre-pilot data snapshot

The real database was queried at Milestone 3 closeout.

| Signal | Current state | Interpretation |
| --- | ---: | --- |
| `COGNITIVE_V1_10` target | 12 | Planned cognitive sample |
| `COGNITIVE_V1_10` participants | 0 | Real study has not started yet |
| `COGNITIVE_V1_10` completed | 0 | No validation inference is permitted |
| `DEV_V1_10` participants | 4 | Development/pre-pilot traffic only |
| `DEV_V1_10` completed | 2 | Not a validation sample |
| Product events currently stored | 2 | Instrumentation has begun recording; too small to interpret |
| Distinct analytics visitors | 1 | Too small to interpret |
| Distinct analytics sessions | 2 | Too small to interpret |
| Structured feedback responses | 0 | Real feedback baseline begins with pilot recruitment |

These counts are deliberately reported as **pre-pilot operational state**, not evidence of product-market fit, reliability, validity or retention.

## CI acceptance

The implementation head `b7cd64794fab6ea32986a5ca8fb25759bc82e331` triggered GitHub Actions run `35023332068` after migration-history reconciliation.

The milestone is accepted only if the standard pipeline remains green:

- `npm ci`
- `npm test`
- `npm run typecheck`
- `npm run build`
- Chrome availability
- `npm run test:flow`
- `npm run test:funds`

The prior M3 feature head `ea6c4d0c0c670a5af1a62946ae2c7d3b3a444739` passed the full pipeline, including both browser E2E suites, before the migration filename reconciliation. The final reconciliation changes migration filenames only; the closeout CI run is the acceptance run for the synchronized head.

## Deployment evidence

Vercel’s GitHub status for the M3 feature head reported:

- state: `success`
- description: `Deployment has completed`
- preview state: `Ready`

The PR’s Vercel bot comment exposes a ready Preview deployment for the branch.

The current ChatGPT Vercel connector is not authorized to the project’s `mahdikakavandkordi-9201` scope and returns HTTP 403 for direct project inspection. The execution environment also cannot resolve arbitrary external DNS, so an interactive live browser canary cannot honestly be claimed from this session.

That connector limitation is documented rather than treated as a product failure; deployment readiness is supported by the Vercel GitHub commit status and CI/build evidence.

## Known limitations and gates intentionally left outside M3 engineering acceptance

1. **Cognitive evidence:** the planned v1.10 cognitive cohort is still 0/12. M3 makes the study safe to run; it does not fabricate the study result.
2. **Psychometric validation:** cognitive interviews, quantitative pilot data, reliability/structure analysis, calibration and later retest/criterion work remain required before validity claims.
3. **Real external email delivery:** deterministic E2E covers secure-link request and guest-to-account continuity. Actual delivery to an external inbox on the deployed domain remains a controlled launch-operation canary.
4. **Compliance/legal launch review:** wording/privacy/regulatory review for the target launch jurisdiction remains a public-launch gate.
5. **Fund-data depth:** the M2 transparency limits remain. Partial holdings/exposure coverage must continue to be labeled honestly.
6. **Broader Supabase advisor backlog:** legacy platform findings outside the new M3 tables remain a hardening backlog and should be triaged before unrestricted public launch.
7. **Portfolio Builder:** still intentionally excluded from V1 until the current profile → Match → research → save/return loop has real-user evidence.

## Go / No-Go decision

**GO: Milestone 3 is complete from the engineering and controlled-pilot-readiness perspective.**

The platform now has the instrumentation, feedback schema, research separation, access control, operational runbook, migration reproducibility and automated regression coverage required to begin a controlled pilot without pretending that pilot results already exist.

**GO for controlled cognitive/product recruitment.**

**NO-GO for unrestricted public launch, scientific-validation claims or regulated-advice positioning.** Those depend on real participant evidence, real external delivery checks, compliance review and the remaining launch-hardening work.

## Key M3 files

- `app/feedback/page.tsx`
- `app/pilot/cognitive/page.tsx`
- `components/ProductAnalytics.tsx`
- `lib/analytics.ts`
- `lib/browser-session.ts`
- `lib/supabase.ts`
- `components/FundConnection.tsx`
- `app/dna/assessment/page.tsx`
- `app/dna/result/page.tsx`
- `supabase/functions/investing-dna-pilot/index.ts`
- `supabase/migrations/20260915203405_milestone_3_pilot_analytics_feedback.sql`
- `supabase/migrations/20260915203446_milestone_3_anonymous_visitor_link.sql`
- `supabase/migrations/20260915204503_milestone_3_analytics_fk_indexes.sql`
- `supabase/migrations/20260915204620_milestone_3_pilot_summary_views.sql`
- `supabase/migrations/20260915204943_milestone_3_cognitive_invite_gate.sql`
- `supabase/tests/milestone_3_pilot_readiness.sql`
- `tests/flow.cjs`
- `tests/funds-flow.cjs`
- `docs/COGNITIVE-TEST-PROTOCOL.md`
- `docs/PILOT-OPERATIONS.md`
- `docs/MILESTONE-3-PILOT-LAUNCH-READINESS-REPORT.md`

## Recommended next milestone

The next phase should be **Milestone 4 — Pilot Evidence & Pre-Launch Hardening**.

Primary goals:

- run the 12-person cognitive study and document item-level findings,
- freeze any post-cognitive questionnaire revision as a new numbered version,
- recruit the initial 20–50 product-pilot users,
- review funnel/trust/usefulness/return evidence after defined batches rather than per-user overreaction,
- verify one real deployed magic-link round trip using a controlled external inbox,
- triage remaining launch-relevant Supabase advisor findings,
- complete legal/privacy/compliance wording review,
- and make the public-launch decision from evidence rather than feature count.
