-- Pilot Readiness measurement layer.
-- Adds structured safety-comprehension feedback and a service-only aggregate snapshot.
-- No browser-facing administrative dashboard is introduced.

alter table public.pilot_feedback
  add column if not exists interpreted_match_as_buy_recommendation boolean,
  add column if not exists interpreted_match_score_as_return_forecast boolean;

insert into public.pilot_data_dictionary(
  version,field_key,source_table,classification,allowed_for_validation,retention_note
)
select
  'v1.3',d.field_key,d.source_table,d.classification,d.allowed_for_validation,d.retention_note
from public.pilot_data_dictionary d
where d.version='v1.2'
on conflict(version,field_key) do nothing;

insert into public.pilot_data_dictionary(
  version,field_key,source_table,classification,allowed_for_validation,retention_note
)
values
  ('v1.3','feedback_ease_score','pilot_feedback','operational',false,'Structured product-experience rating for pilot review; not a questionnaire scoring input.'),
  ('v1.3','feedback_trust_score','pilot_feedback','operational',false,'Structured explanation-trust rating for pilot review; not a questionnaire scoring input.'),
  ('v1.3','feedback_usefulness_score','pilot_feedback','operational',false,'Structured perceived-usefulness rating for pilot review; not a questionnaire scoring input.'),
  ('v1.3','feedback_understood_match','pilot_feedback','operational',false,'Self-reported Match comprehension signal for product-pilot review.'),
  ('v1.3','feedback_would_return','pilot_feedback','operational',false,'Self-reported return-intent signal for product-pilot review.'),
  ('v1.3','feedback_match_as_buy_recommendation','pilot_feedback','operational',false,'Safety comprehension flag: participant interpreted Match as telling them what to buy.'),
  ('v1.3','feedback_score_as_return_forecast','pilot_feedback','operational',false,'Safety comprehension flag: participant interpreted Match score as expected future return.'),
  ('v1.3','feedback_open_text','pilot_feedback','operational',false,'Optional qualitative product feedback; review under pilot protocol and exclude from automated psychometric analysis.')
on conflict(version,field_key) do update
set source_table=excluded.source_table,
    classification=excluded.classification,
    allowed_for_validation=excluded.allowed_for_validation,
    retention_note=excluded.retention_note;

create or replace function public.service_pilot_measurement_snapshot(p_cohort_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_result jsonb;
begin
  if p_cohort_code is null or btrim(p_cohort_code)='' then
    raise exception 'cohort_code_required' using errcode='22023';
  end if;

  with cohort as (
    select c.id,c.code,c.questionnaire_version,c.model_version,c.target_n,c.status
    from public.pilot_cohorts c
    where c.code=p_cohort_code
    limit 1
  ),
  cohort_assessments as (
    select
      a.id as assessment_id,
      a.status,
      a.started_at,
      a.completed_at,
      p.id as participant_id
    from cohort c
    left join public.pilot_participants p
      on p.cohort_id=c.id and p.withdrawn_at is null
    left join public.assessments a
      on a.pilot_participant_id=p.id
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
      bool_or(e.event_name in ('screener_viewed','compare_viewed')) as deeper_research_reached,
      bool_or(e.event_name in ('watchlist_saved','signup_requested','dna_claimed')) as save_or_claim,
      count(distinct e.browser_session_id)>1
        and max(e.created_at)-min(e.created_at)>=interval '6 hours' as returning_visit,
      bool_or(e.event_name='workspace_viewed' and coalesce((e.metadata->>'returning')::boolean,false)) as returning_workspace_view
    from public.pilot_product_events e
    join cohort_visitors v using(visitor_id)
    group by e.visitor_id
  ),
  funnel as (
    select
      count(*) filter(where assessment_started) as assessment_started,
      count(*) filter(where assessment_completed) as assessment_completed,
      count(*) filter(where dna_result_viewed) as dna_result_viewed,
      count(*) filter(where match_or_fund_reached) as match_or_fund_reached,
      count(*) filter(where deeper_research_reached) as deeper_research_reached,
      count(*) filter(where save_or_claim) as save_or_claim,
      count(*) filter(where returning_visit) as returning_visit,
      count(*) filter(where returning_workspace_view) as returning_workspace_view
    from visitor_flags
  ),
  feedback as (
    select
      count(*) as responses,
      round(avg(f.ease_score)::numeric,2) as avg_ease,
      round(avg(f.trust_score)::numeric,2) as avg_trust,
      round(avg(f.usefulness_score)::numeric,2) as avg_usefulness,
      round(100.0*avg(case when f.understood_match then 1 else 0 end),1) as understood_match_yes_pct,
      round(100.0*avg(case when f.would_return then 1 else 0 end),1) as would_return_yes_pct,
      count(*) filter(where f.interpreted_match_as_buy_recommendation is true) as match_as_buy_count,
      round(100.0*avg(case
        when f.interpreted_match_as_buy_recommendation is null then null
        when f.interpreted_match_as_buy_recommendation then 1 else 0 end),1) as match_as_buy_pct,
      count(*) filter(where f.interpreted_match_score_as_return_forecast is true) as score_as_return_count,
      round(100.0*avg(case
        when f.interpreted_match_score_as_return_forecast is null then null
        when f.interpreted_match_score_as_return_forecast then 1 else 0 end),1) as score_as_return_pct
    from public.pilot_feedback f
    join cohort_assessments a on a.assessment_id=f.assessment_id
  ),
  events as (
    select coalesce(jsonb_object_agg(x.event_name,x.event_count),'{}'::jsonb) as counts
    from (
      select e.event_name,count(*) as event_count
      from public.pilot_product_events e
      join cohort_visitors v using(visitor_id)
      group by e.event_name
      order by e.event_name
    ) x
  ),
  progress as (
    select
      count(distinct participant_id) filter(where participant_id is not null) as participants,
      count(distinct assessment_id) filter(where status='completed') as completed_assessments,
      round(avg(extract(epoch from (completed_at-started_at))/60.0) filter(
        where status='completed' and completed_at is not null and started_at is not null
      )::numeric,1) as avg_completion_minutes
    from cohort_assessments
  )
  select jsonb_build_object(
    'cohort',jsonb_build_object(
      'code',c.code,
      'questionnaire_version',c.questionnaire_version,
      'model_version',c.model_version,
      'target_n',c.target_n,
      'status',c.status
    ),
    'progress',jsonb_build_object(
      'participants',p.participants,
      'completed_assessments',p.completed_assessments,
      'avg_completion_minutes',p.avg_completion_minutes
    ),
    'funnel',jsonb_build_object(
      'assessment_started',fn.assessment_started,
      'assessment_completed',fn.assessment_completed,
      'dna_result_viewed',fn.dna_result_viewed,
      'match_or_fund_reached',fn.match_or_fund_reached,
      'deeper_research_reached',fn.deeper_research_reached,
      'save_or_claim',fn.save_or_claim,
      'returning_visit',fn.returning_visit,
      'returning_workspace_view',fn.returning_workspace_view
    ),
    'feedback',jsonb_build_object(
      'responses',fb.responses,
      'avg_ease',fb.avg_ease,
      'avg_trust',fb.avg_trust,
      'avg_usefulness',fb.avg_usefulness,
      'understood_match_yes_pct',fb.understood_match_yes_pct,
      'would_return_yes_pct',fb.would_return_yes_pct,
      'match_as_buy_count',fb.match_as_buy_count,
      'match_as_buy_pct',fb.match_as_buy_pct,
      'score_as_return_count',fb.score_as_return_count,
      'score_as_return_pct',fb.score_as_return_pct
    ),
    'event_coverage',ev.counts,
    'review_flags',jsonb_build_object(
      'match_as_buy_stop_review',coalesce(fb.match_as_buy_count,0)>0,
      'score_as_return_stop_review',coalesce(fb.score_as_return_count,0)>0,
      'batch_review_ready',coalesce(p.completed_assessments,0)>0 and mod(p.completed_assessments,5)=0
    )
  )
  into v_result
  from cohort c
  cross join progress p
  cross join funnel fn
  cross join feedback fb
  cross join events ev;

  if v_result is null then
    raise exception 'pilot_cohort_not_found' using errcode='P0002';
  end if;

  return v_result;
end;
$$;

revoke all on function public.service_pilot_measurement_snapshot(text) from public,anon,authenticated;
grant execute on function public.service_pilot_measurement_snapshot(text) to service_role;

comment on function public.service_pilot_measurement_snapshot(text) is
'Service-only privacy-minimized product-pilot measurement snapshot. Never exposes raw answers, email, auth tokens or open feedback text.';
