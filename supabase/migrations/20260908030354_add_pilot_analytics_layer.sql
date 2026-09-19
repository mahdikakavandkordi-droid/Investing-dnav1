-- Investing DNA: internal pilot analytics layer
-- Purpose: validate questionnaire quality without duplicating raw responses or exposing analytics publicly.

create or replace view public.v_pilot_assessment_quality
with (security_invoker = true)
as
select
  a.id as assessment_id,
  a.questionnaire_version,
  a.model_version,
  a.status,
  a.started_at,
  a.completed_at,
  count(ans.id)::integer as answered_count,
  q.expected_count,
  round(100.0 * count(ans.id) / nullif(q.expected_count,0), 2) as completion_pct,
  case
    when a.started_at is not null and a.completed_at is not null
      then extract(epoch from (a.completed_at - a.started_at))::integer
    else null
  end as duration_seconds,
  r.risk_tolerance,
  r.risk_capacity,
  r.archetype,
  fp.fingerprint_code,
  (n.id is not null) as narrative_generated
from public.assessments a
left join public.answers ans on ans.assessment_id = a.id
left join lateral (
  select count(*)::integer as expected_count
  from public.question_bank qb
  where qb.version = coalesce(a.questionnaire_version,'v1')
    and qb.active = true
) q on true
left join lateral (
  select rr.*
  from public.results rr
  where rr.assessment_id = a.id
  order by rr.created_at desc, rr.id desc
  limit 1
) r on true
left join lateral (
  select ff.*
  from public.fingerprint_profiles ff
  where ff.assessment_id = a.id
  order by ff.created_at desc
  limit 1
) fp on true
left join lateral (
  select nn.id
  from public.narratives nn
  where nn.assessment_id = a.id
  order by nn.created_at desc
  limit 1
) n on true
group by a.id, a.questionnaire_version, a.model_version, a.status, a.started_at, a.completed_at,
         q.expected_count, r.risk_tolerance, r.risk_capacity, r.archetype, fp.fingerprint_code, n.id;

create or replace view public.v_pilot_question_stats
with (security_invoker = true)
as
with base as (
  select
    q.question_id,
    q.version,
    q.section,
    q.construct,
    q.question_type,
    q.sort_order,
    q.prompt_en,
    q.prompt_fa,
    a.assessment_id,
    a.answer_value,
    case
      when q.question_type = 'scale'
        and (a.answer_value->>'value') ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
        then case
          when q.scoring->'scale'->>'direction' = 'reverse'
            then 100 - ((a.answer_value->>'value')::numeric * 10)
          else ((a.answer_value->>'value')::numeric * 10)
        end
      when q.question_type <> 'scale'
        and (q.scoring->>(a.answer_value->>'value')) ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
        then (q.scoring->>(a.answer_value->>'value'))::numeric
      else null
    end as item_score
  from public.question_bank q
  left join public.answers a
    on a.question_id = q.question_id
   and a.assessment_id in (
     select id from public.assessments where status = 'completed'
   )
  where q.active = true
), valid as (
  select * from base where item_score between 0 and 100
)
select
  question_id,
  version,
  section,
  construct,
  question_type,
  sort_order,
  prompt_en,
  prompt_fa,
  count(*)::integer as response_n,
  round(avg(item_score),2) as mean_score,
  round(stddev_samp(item_score),2) as sd_score,
  round(min(item_score),2) as min_score,
  round(max(item_score),2) as max_score,
  round(
    100.0 * count(*) filter (where item_score >= 0 and item_score <= 100)
    / nullif((select count(*) from public.assessments where status='completed'),0),
    2
  ) as response_rate_pct
from valid
group by question_id, version, section, construct, question_type, sort_order, prompt_en, prompt_fa;

create or replace view public.v_pilot_construct_stats
with (security_invoker = true)
as
with scored as (
  select
    a.assessment_id,
    q.version,
    q.section,
    q.construct,
    case
      when q.question_type = 'scale'
        and (a.answer_value->>'value') ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
        then case
          when q.scoring->'scale'->>'direction' = 'reverse'
            then 100 - ((a.answer_value->>'value')::numeric * 10)
          else ((a.answer_value->>'value')::numeric * 10)
        end
      when q.question_type <> 'scale'
        and (q.scoring->>(a.answer_value->>'value')) ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
        then (q.scoring->>(a.answer_value->>'value'))::numeric
      else null
    end as item_score
  from public.answers a
  join public.assessments ass on ass.id = a.assessment_id and ass.status='completed'
  join public.question_bank q on q.question_id=a.question_id and q.version=ass.questionnaire_version and q.active=true
)
select
  version,
  section,
  construct,
  count(*)::integer as response_n,
  count(distinct assessment_id)::integer as respondent_n,
  round(avg(item_score),2) as mean_score,
  round(stddev_samp(item_score),2) as sd_score,
  round(min(item_score),2) as min_score,
  round(max(item_score),2) as max_score
from scored
where item_score between 0 and 100
group by version, section, construct;

create or replace view public.v_pilot_item_total_stats
with (security_invoker = true)
as
with scored as (
  select
    ass.id as assessment_id,
    q.version,
    q.section,
    q.construct,
    q.question_id,
    case
      when q.question_type = 'scale'
        and (ans.answer_value->>'value') ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
        then case
          when q.scoring->'scale'->>'direction' = 'reverse'
            then 100 - ((ans.answer_value->>'value')::numeric * 10)
          else ((ans.answer_value->>'value')::numeric * 10)
        end
      when q.question_type <> 'scale'
        and (q.scoring->>(ans.answer_value->>'value')) ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
        then (q.scoring->>(ans.answer_value->>'value'))::numeric
      else null
    end as item_score
  from public.assessments ass
  join public.answers ans on ans.assessment_id=ass.id
  join public.question_bank q
    on q.question_id=ans.question_id
   and q.version=ass.questionnaire_version
   and q.active=true
  where ass.status='completed'
), construct_totals as (
  select
    s1.assessment_id,
    s1.question_id,
    s1.version,
    s1.section,
    s1.construct,
    s1.item_score,
    sum(s2.item_score) as construct_total_excluding_item
  from scored s1
  join scored s2
    on s2.assessment_id=s1.assessment_id
   and s2.construct=s1.construct
   and s2.question_id<>s1.question_id
   and s2.item_score between 0 and 100
  where s1.item_score between 0 and 100
  group by s1.assessment_id,s1.question_id,s1.version,s1.section,s1.construct,s1.item_score
), stats as (
  select
    question_id,
    version,
    section,
    construct,
    count(*)::integer as respondent_n,
    corr(item_score, construct_total_excluding_item) as item_total_corr
  from construct_totals
  group by question_id, version, section, construct
)
select
  question_id,
  version,
  section,
  construct,
  respondent_n,
  case when respondent_n >= 30 then round(item_total_corr::numeric,3) else null end as item_total_corr,
  case when respondent_n >= 30 then true else false end as sufficient_n_for_metric
from stats;

-- Option-level distribution, useful for spotting ceiling/floor effects and poorly used distractors.
create or replace view public.v_pilot_option_distribution
with (security_invoker = true)
as
select
  ass.questionnaire_version as version,
  q.question_id,
  q.section,
  q.construct,
  q.sort_order,
  ans.answer_value->>'value' as answer_key,
  count(*)::integer as response_n,
  round(
    100.0 * count(*) / nullif(sum(count(*)) over (partition by ass.questionnaire_version,q.question_id),0),
    2
  ) as response_pct
from public.assessments ass
join public.answers ans on ans.assessment_id=ass.id
join public.question_bank q
  on q.question_id=ans.question_id
 and q.version=ass.questionnaire_version
 and q.active=true
where ass.status='completed'
group by ass.questionnaire_version,q.question_id,q.section,q.construct,q.sort_order,ans.answer_value->>'value';

-- Keep all analytics internal. They are deliberately not reachable through the public Data API.
revoke all on table public.answers from anon, authenticated;
revoke all on table public.assessments from anon, authenticated;
revoke all on table public.results from anon, authenticated;
revoke all on table public.fingerprint_profiles from anon, authenticated;
revoke all on table public.narratives from anon, authenticated;
revoke all on table public.narrative_rules from anon, authenticated;
revoke all on table public.question_bank from anon, authenticated;
revoke all on table public.scoring_dimensions from anon, authenticated;
revoke all on table public.behavioral_traits from anon, authenticated;
revoke all on table public.archetype_profiles from anon, authenticated;
revoke all on table public.fingerprint_rules from anon, authenticated;

revoke all on table public.v_pilot_assessment_quality from anon, authenticated;
revoke all on table public.v_pilot_question_stats from anon, authenticated;
revoke all on table public.v_pilot_construct_stats from anon, authenticated;
revoke all on table public.v_pilot_item_total_stats from anon, authenticated;
revoke all on table public.v_pilot_option_distribution from anon, authenticated;

comment on view public.v_pilot_assessment_quality is 'Internal pilot quality metrics. Do not expose through client Data API.';
comment on view public.v_pilot_question_stats is 'Internal item-level descriptive statistics for completed pilot assessments.';
comment on view public.v_pilot_construct_stats is 'Internal construct-level descriptive statistics for completed pilot assessments.';
comment on view public.v_pilot_item_total_stats is 'Internal item-total correlation diagnostics; metrics withheld until n >= 30.';
comment on view public.v_pilot_option_distribution is 'Internal option usage distribution for completed pilot assessments.';
