-- Investor DNA — M4 product-pilot evidence queries
-- Last reviewed: 2026-09-19
--
-- Purpose:
--   Produce privacy-minimized aggregate inputs for docs/M4-PILOT-SCORECARD.md.
--
-- IMPORTANT:
--   Replace the cohort code below with the FROZEN PRODUCT-PILOT cohort.
--   Do not use DEV_* or cognitive cohorts as product-pilot evidence.
--   These queries intentionally avoid email addresses, auth tokens, raw answer
--   content and open-text feedback. Review qualitative feedback separately
--   under the pilot protocol.

-- ---------------------------------------------------------------------------
-- 1. Cohort progress
-- ---------------------------------------------------------------------------
with params as (
  select 'REPLACE_WITH_FROZEN_PRODUCT_PILOT_COHORT'::text as cohort_code
)
select
  c.code,
  c.questionnaire_version,
  c.model_version,
  c.target_n,
  c.status,
  count(distinct p.id) filter (where p.withdrawn_at is null) as participants,
  count(distinct a.id) filter (where a.status='completed' and p.withdrawn_at is null) as completed_assessments
from public.pilot_cohorts c
left join public.pilot_participants p on p.cohort_id=c.id
left join public.assessments a on a.pilot_participant_id=p.id
join params x on x.cohort_code=c.code
group by c.code,c.questionnaire_version,c.model_version,c.target_n,c.status;

-- ---------------------------------------------------------------------------
-- 2. Visitor-level funnel
--
-- Cohort membership is anchored through an assessment linked to the selected
-- pilot cohort. Once a visitor is anchored, later product events from that same
-- visitor_id are included so the post-assessment research journey is visible.
--
-- "Returning visit" requires both a new browser-session ID and at least six
-- hours between the visitor's first and latest recorded event. This avoids
-- counting a refresh/new tab during one sitting as retention.
-- ---------------------------------------------------------------------------
with params as (
  select 'REPLACE_WITH_FROZEN_PRODUCT_PILOT_COHORT'::text as cohort_code
),
cohort_assessments as (
  select a.id as assessment_id
  from public.assessments a
  join public.pilot_participants p on p.id=a.pilot_participant_id
  join public.pilot_cohorts c on c.id=p.cohort_id
  join params x on x.cohort_code=c.code
  where p.withdrawn_at is null
),
cohort_visitors as (
  select distinct e.visitor_id
  from public.pilot_product_events e
  join cohort_assessments a on a.assessment_id=e.assessment_id
  where e.visitor_id is not null
),
visitor_flags as (
  select
    e.visitor_id,
    bool_or(e.event_name='assessment_started') as assessment_started,
    bool_or(e.event_name='assessment_completed') as assessment_completed,
    bool_or(e.event_name='dna_result_viewed') as dna_result_viewed,
    bool_or(e.event_name in ('match_viewed','fund_viewed')) as match_or_fund_reached,
    bool_or(e.event_name in ('screener_viewed','compare_viewed')) as screener_or_compare_reached,
    bool_or(e.event_name in ('watchlist_saved','signup_requested','dna_claimed')) as claim_or_watchlist_save,
    count(distinct e.browser_session_id)>1
      and max(e.created_at)-min(e.created_at)>=interval '6 hours' as returning_visit
  from public.pilot_product_events e
  join cohort_visitors v using(visitor_id)
  group by e.visitor_id
),
counts as (
  select
    count(*) filter(where assessment_started) as assessment_started,
    count(*) filter(where assessment_completed) as assessment_completed,
    count(*) filter(where dna_result_viewed) as dna_result_viewed,
    count(*) filter(where match_or_fund_reached) as match_or_fund_reached,
    count(*) filter(where screener_or_compare_reached) as screener_or_compare_reached,
    count(*) filter(where claim_or_watchlist_save) as claim_or_watchlist_save,
    count(*) filter(where returning_visit) as returning_visit
  from visitor_flags
)
select
  assessment_started,
  assessment_completed,
  round(100.0*assessment_completed/nullif(assessment_started,0),1) as assessment_completion_pct,
  dna_result_viewed,
  round(100.0*dna_result_viewed/nullif(assessment_completed,0),1) as result_from_completed_pct,
  match_or_fund_reached,
  round(100.0*match_or_fund_reached/nullif(dna_result_viewed,0),1) as research_from_result_pct,
  screener_or_compare_reached,
  round(100.0*screener_or_compare_reached/nullif(match_or_fund_reached,0),1) as deeper_research_from_match_or_fund_pct,
  claim_or_watchlist_save,
  returning_visit
from counts;

-- ---------------------------------------------------------------------------
-- 3. Structured experience evidence
-- ---------------------------------------------------------------------------
with params as (
  select 'REPLACE_WITH_FROZEN_PRODUCT_PILOT_COHORT'::text as cohort_code
),
cohort_assessments as (
  select a.id as assessment_id
  from public.assessments a
  join public.pilot_participants p on p.id=a.pilot_participant_id
  join public.pilot_cohorts c on c.id=p.cohort_id
  join params x on x.cohort_code=c.code
  where p.withdrawn_at is null
)
select
  count(*) as feedback_responses,
  round(avg(f.ease_score)::numeric,2) as avg_ease,
  round(avg(f.trust_score)::numeric,2) as avg_explanation_trust,
  round(avg(f.usefulness_score)::numeric,2) as avg_usefulness,
  round(100.0*avg(case when f.understood_match then 1 else 0 end),1) as understood_match_yes_pct,
  round(100.0*avg(case when f.would_return then 1 else 0 end),1) as would_return_yes_pct
from public.pilot_feedback f
join cohort_assessments a on a.assessment_id=f.assessment_id;

-- ---------------------------------------------------------------------------
-- 4. Event coverage sanity check
--
-- Use this to spot missing instrumentation before interpreting funnel rates.
-- ---------------------------------------------------------------------------
with params as (
  select 'REPLACE_WITH_FROZEN_PRODUCT_PILOT_COHORT'::text as cohort_code
),
cohort_assessments as (
  select a.id as assessment_id
  from public.assessments a
  join public.pilot_participants p on p.id=a.pilot_participant_id
  join public.pilot_cohorts c on c.id=p.cohort_id
  join params x on x.cohort_code=c.code
  where p.withdrawn_at is null
),
cohort_visitors as (
  select distinct e.visitor_id
  from public.pilot_product_events e
  join cohort_assessments a on a.assessment_id=e.assessment_id
  where e.visitor_id is not null
)
select
  e.event_name,
  count(*) as event_count,
  count(distinct e.visitor_id) as unique_visitors,
  count(distinct e.browser_session_id) as unique_sessions
from public.pilot_product_events e
join cohort_visitors v using(visitor_id)
group by e.event_name
order by e.event_name;

-- Validation note:
-- The visitor-level funnel query was executed against DEV_V1_10 on 2026-09-19
-- to verify SQL shape only. DEV traffic is engineering evidence, not pilot
-- evidence, and must never be copied into the product-pilot scorecard.


-- ---------------------------------------------------------------------------
-- 5. Returning-workspace loop
--
-- This measures whether returning pilot visitors actually reach the persisted
-- workspace and where they choose to resume. It remains aggregate and excludes
-- email, answer content and other direct identifiers.
-- ---------------------------------------------------------------------------
with params as (
  select 'REPLACE_WITH_FROZEN_PRODUCT_PILOT_COHORT'::text as cohort_code
),
cohort_assessments as (
  select a.id as assessment_id
  from public.assessments a
  join public.pilot_participants p on p.id=a.pilot_participant_id
  join public.pilot_cohorts c on c.id=p.cohort_id
  join params x on x.cohort_code=c.code
  where p.withdrawn_at is null
),
cohort_visitors as (
  select distinct e.visitor_id
  from public.pilot_product_events e
  join cohort_assessments a on a.assessment_id=e.assessment_id
  where e.visitor_id is not null
)
select
  count(distinct e.visitor_id) filter(where e.event_name='workspace_viewed') as workspace_viewers,
  count(distinct e.visitor_id) filter(
    where e.event_name='workspace_viewed'
      and coalesce((e.metadata->>'returning')::boolean,false)
  ) as returning_workspace_viewers,
  count(*) filter(where e.event_name='workspace_resume_clicked') as resume_clicks,
  count(distinct e.visitor_id) filter(where e.event_name='workspace_resume_clicked') as visitors_resuming
from public.pilot_product_events e
join cohort_visitors v using(visitor_id);

with params as (
  select 'REPLACE_WITH_FROZEN_PRODUCT_PILOT_COHORT'::text as cohort_code
),
cohort_assessments as (
  select a.id as assessment_id
  from public.assessments a
  join public.pilot_participants p on p.id=a.pilot_participant_id
  join public.pilot_cohorts c on c.id=p.cohort_id
  join params x on x.cohort_code=c.code
  where p.withdrawn_at is null
),
cohort_visitors as (
  select distinct e.visitor_id
  from public.pilot_product_events e
  join cohort_assessments a on a.assessment_id=e.assessment_id
  where e.visitor_id is not null
)
select
  coalesce(e.metadata->>'target','unknown') as resume_target,
  count(*) as clicks,
  count(distinct e.visitor_id) as unique_visitors
from public.pilot_product_events e
join cohort_visitors v using(visitor_id)
where e.event_name='workspace_resume_clicked'
group by 1
order by clicks desc,resume_target;
