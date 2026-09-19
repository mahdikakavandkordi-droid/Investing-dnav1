# Investing DNA — Pilot Operations Runbook

**Current research assessment:** `v1.10-cognitive-candidate` / `dna-v1.10-research`  
**Current Match engine:** `investment-dna-match-v7`

## Purpose

Run a controlled pilot without mixing three different questions:

1. **Question comprehension** — do people understand v1.10 as intended?
2. **Product value** — does the result help them understand and research investments?
3. **Product behavior** — where do people complete, drop, save and return?

None of these alone establishes scientific validity or regulated suitability.

## Cohorts

### Cognitive study

Use `/pilot/cognitive` only.

Database cohort: `COGNITIVE_V1_10`  
Target: **12 participants**, recommended as 6 + review + 6.

The dedicated route requires a **moderator-only research invite code**, clears any development draft and then routes into `COGNITIVE_V1_10`, so regular DEV responses cannot silently contaminate the cognitive cohort. The raw code must not be committed to source control, embedded in a participant URL, posted publicly, or copied into analytics. The backend stores only its SHA-256 hash.

After the protected session starts, the assessment displays the backend-generated pseudonymous research code (`P-...`). Copy that exact code into the cognitive worksheet before proceeding. That code, not a participant name or the moderator’s `C01`–`C12` sequence, is the canonical join key to the database record.

See `docs/COGNITIVE-TEST-PROTOCOL.md` for the moderator procedure and revision rules.

### Product pilot

Normal product testing continues on `DEV_V1_10` until a separate quantitative-pilot version is frozen. Do not use old cohort evidence as validation evidence for v1.10.

Current live gate on 2026-09-19:

- `COGNITIVE_V1_10`: planned, target 12, **0 participants / 0 completed**;
- `DEV_V1_10`: engineering-only, 6 participants / 4 completed;
- no frozen `PRODUCT_PILOT_*` cohort exists.

Therefore the quantitative 20–50 user product pilot is **not open**.

Future product-pilot cohorts can be protected by `pilot_cohort_dependencies`. The Edge Function checks `service_pilot_cohort_gate(...)` before creating a participant/session. A gated cohort with an incomplete prerequisite returns a closed-state response even if its cohort code is known.

## First-party product funnel

The app records only privacy-minimized product events. It does not put email, name, IP address or questionnaire answer text into the analytics tables.

Tracked events:

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
- `workspace_viewed`
- `workspace_resume_clicked`
- `auth_callback_session_established`
- `account_state_restored`
- `feedback_submitted`

`visitor_id` is a random browser identifier and `browser_session_id` is a random per-session identifier. Signed-in identity and profile IDs are attached server-side when available.

Raw analytics and feedback tables are not browser-readable or browser-writable. The Edge Function is the write boundary.

## Founder/admin summary queries

These queries are for trusted database/admin use, not browser exposure.

### Cognitive session lookup by pseudonymous research code

Use the `P-...` value written on the worksheet. Do not join using a participant name or email.

```sql
select
  p.anonymous_code as research_code,
  a.id as assessment_id,
  a.status,
  a.started_at,
  a.completed_at,
  a.language_code,
  a.questionnaire_version,
  a.model_version
from public.pilot_participants p
join public.assessments a on a.pilot_participant_id = p.id
where p.anonymous_code = 'P-XXXXXXXX';
```

### Funnel totals

```sql
select *
from public.v_pilot_product_funnel
order by event_name;
```

### Service-only pilot measurement snapshot

Use the canonical aggregate measurement function for a frozen cohort:

```sql
select public.service_pilot_measurement_snapshot('PRODUCT_PILOT_CODE');
```

It returns cohort/version state, progress, average completion time, funnel counts, returning-session/workspace counts, structured feedback, event coverage and stop/review flags. It does not return email, raw answers, auth credentials or open feedback text.

A mismatch between completed assessments and instrumented funnel events is an instrumentation-coverage signal, not a conversion result. Current DEV history contains records from before the present event layer, so DEV rates must not be copied into the pilot scorecard.

### Feedback summary

```sql
select *
from public.v_pilot_feedback_summary;
```

### Returning browser sessions

```sql
select
  count(distinct browser_session_id) as returning_sessions,
  count(distinct visitor_id) as returning_visitors
from public.pilot_product_events
where event_name = 'app_session_started'
  and coalesce((metadata->>'returning')::boolean, false) = true;
```

### Funnel by day

```sql
select
  created_at::date as day,
  event_name,
  count(distinct browser_session_id) as sessions,
  count(distinct visitor_id) as visitors
from public.pilot_product_events
group by 1,2
order by 1 desc,2;
```

### Open feedback for qualitative review

```sql
select created_at,ease_score,trust_score,usefulness_score,understood_match,
       interpreted_match_as_buy_recommendation,
       interpreted_match_score_as_return_forecast,
       would_return,open_feedback
from public.pilot_feedback
where open_feedback is not null
order by created_at desc;
```

## Provisional product-pilot decision targets

These are **internal operating targets**, not scientific cutoffs. Revisit them after the first real pilot batch.

| Signal | Initial target | Why it matters |
|---|---:|---|
| Assessment completion / assessment start | >= 70% | Questionnaire flow is not losing most users |
| Result viewers who reach Match or a Fund page | >= 50% | Result leads into product discovery |
| Match comprehension in feedback | >= 70% yes | Explainability is doing its job |
| Average explanation trust | >= 3.5 / 5 | Users broadly trust how results are presented |
| Average usefulness | >= 3.5 / 5 | Product is creating perceived value |
| Would return | >= 60% yes | Early evidence of retention potential |
| Interpreted Match as telling them what to buy | Stop/review if repeated | Direct safety/comprehension signal |
| Interpreted Match score as future return/performance | Stop/review if repeated | Prevent score-as-forecast misunderstanding |
| Save intent (claim/watchlist) | Observe first; do not optimize prematurely | Establish a real baseline before setting a conversion target |

Do not change the questionnaire merely to improve product funnel metrics.

## Session checklist

Before each moderated cognitive session:

- open `/pilot/cognitive`
- enter the moderator-only invite code privately; do not send a URL containing the code
- confirm the next page shows `Cognitive research session · v1.10`
- start the protected assessment
- copy the displayed backend `P-...` Research code exactly into the worksheet
- do not record unnecessary PII in the worksheet
- do not explain scoring or expected archetype
- allow unaided completion first
- run the cognitive debrief from the protocol
- keep UI/product feedback separate from item-comprehension feedback
- ask the participant to complete `/feedback` after they have seen the product result/Match experience

## Data review cadence

For a small controlled pilot, review after each cognitive round and after every 5–10 product-pilot users. Do not optimize individual events after every single participant; look for repeated patterns.

For each product-pilot batch:

1. run `service_pilot_measurement_snapshot(...)`;
2. run `docs/M4-PILOT-EVIDENCE-QUERIES.sql`;
3. review qualitative comments separately;
4. classify any instrumentation gap before interpreting rates;
5. record keep / targeted fix / stop-research-further in `docs/M4-PILOT-SCORECARD.md`.

Do not create or open the product-pilot cohort until the accepted cognitive cohort is closed/frozen, the hosted Auth canary passes on the intended app head, and the product cohort has an explicit prerequisite dependency.

## Launch gates still outside automated engineering checks

Before a public launch, explicitly verify:

- one real Supabase magic-link email arrives in an intended test inbox and returns to the deployed domain
- redirect URLs are allow-listed for production and preview domains as intended
- privacy/terms/compliance wording is reviewed for the target launch jurisdiction
- v1.10 cognitive testing is completed before any claim of validated measurement
- ETF deep-data coverage gaps are either filled or remain clearly disclosed

## Stop conditions

Pause expansion/recruitment if:

- a critical safety or ownership regression appears
- multiple users materially misunderstand the same risk/capacity item
- Match explanations are repeatedly interpreted as a guaranteed return or directive to buy
- account/claim continuity loses user results
- analytics begins collecting data outside the documented privacy-minimized event contract
