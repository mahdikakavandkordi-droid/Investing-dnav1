# Investing DNA — Pilot Operations Runbook

**Current research assessment:** `v1.10-cognitive-candidate` / `dna-v1.10-research`  
**Current Match engine:** `investment-dna-match-v6`

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

See `docs/COGNITIVE-TEST-PROTOCOL.md` for the moderator procedure and revision rules.

### Product pilot

Normal product testing continues on `DEV_V1_10` until a separate quantitative-pilot version is frozen. Do not use old cohort evidence as validation evidence for v1.10.

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
- `feedback_submitted`

`visitor_id` is a random browser identifier and `browser_session_id` is a random per-session identifier. Signed-in identity and profile IDs are attached server-side when available.

Raw analytics and feedback tables are not browser-readable or browser-writable. The Edge Function is the write boundary.

## Founder/admin summary queries

### Funnel totals

```sql
select *
from public.v_pilot_product_funnel
order by event_name;
```

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
select created_at,ease_score,trust_score,usefulness_score,understood_match,would_return,open_feedback
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
| Save intent (claim/watchlist) | Observe first; do not optimize prematurely | Establish a real baseline before setting a conversion target |

Do not change the questionnaire merely to improve product funnel metrics.

## Session checklist

Before each moderated cognitive session:

- open `/pilot/cognitive`
- enter the moderator-only invite code privately; do not send a URL containing the code
- confirm the next page shows `Cognitive research session · v1.10`
- do not explain scoring or expected archetype
- allow unaided completion first
- run the cognitive debrief from the protocol
- keep UI/product feedback separate from item-comprehension feedback
- ask the participant to complete `/feedback` after they have seen the product result/Match experience

## Data review cadence

For a small controlled pilot, review after each cognitive round and after every 5–10 product-pilot users. Do not optimize individual events after every single participant; look for repeated patterns.

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
