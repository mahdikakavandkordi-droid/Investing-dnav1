-- Report explainability layer for the 28-question Investing DNA assessment.
-- Presentation/reporting only: does not alter scoring, thresholds, archetype assignment or Match.

create or replace function public.build_assessment_dimension_profile(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  v_version text;
  r public.results%rowtype;
  v_question_count int:=0;
  v_rt_count int:=0;
  v_bd_count int:=0;
  v_rc_count int:=0;
  v_ex_count int:=0;
  v_rt jsonb:='{}'::jsonb;
  v_bd jsonb:='{}'::jsonb;
  v_rc jsonb:='{}'::jsonb;
  v_ex_decision text;
  v_ex_downturn text;
  v_ex_products jsonb:='[]'::jsonb;
begin
  select a.questionnaire_version into v_version
  from public.assessments a where a.id=p_assessment_id;

  if v_version is null then
    raise exception 'Assessment not found';
  end if;

  select * into r
  from public.results
  where assessment_id=p_assessment_id
  order by created_at desc,id desc
  limit 1;

  if r.id is null then
    raise exception 'Result not found for assessment';
  end if;

  select
    count(*) filter(where section='risk_tolerance'),
    count(*) filter(where section='behavioral_dna'),
    count(*) filter(where section='risk_capacity'),
    count(*) filter(where section='investment_experience'),
    count(*)
  into v_rt_count,v_bd_count,v_rc_count,v_ex_count,v_question_count
  from public.question_bank
  where version=v_version and active=true;

  with numeric_answers as (
    select
      q.section,
      q.construct,
      case
        when q.question_type='scale' then
          case when q.scoring->'scale'->>'direction'='reverse'
            then 100-((a.answer_value->>'value')::numeric*10)
            else ((a.answer_value->>'value')::numeric*10)
          end
        when q.question_type='single_choice' and q.scoring ? (a.answer_value->>'value')
          then (q.scoring->>(a.answer_value->>'value'))::numeric
        else null
      end as score
    from public.answers a
    join public.question_bank q
      on q.question_id=a.question_id
     and q.version=v_version
     and q.active=true
    where a.assessment_id=p_assessment_id
  ),
  dims as (
    select section,construct,round(avg(score),2) score
    from numeric_answers
    where score is not null
    group by section,construct
  )
  select
    coalesce(jsonb_object_agg(construct,to_jsonb(score)) filter(where section='risk_tolerance'),'{}'::jsonb),
    coalesce(jsonb_object_agg(construct,to_jsonb(score)) filter(where section='behavioral_dna'),'{}'::jsonb),
    coalesce(jsonb_object_agg(construct,to_jsonb(score)) filter(where section='risk_capacity'),'{}'::jsonb)
  into v_rt,v_bd,v_rc
  from dims;

  select o->>'label'
  into v_ex_decision
  from public.answers a
  join public.question_bank q
    on q.question_id=a.question_id
   and q.version=v_version
   and q.active=true
  cross join lateral jsonb_array_elements(q.options) o
  where a.assessment_id=p_assessment_id
    and q.construct='decision_experience'
    and o->>'value'=a.answer_value->>'value'
  limit 1;

  select o->>'label'
  into v_ex_downturn
  from public.answers a
  join public.question_bank q
    on q.question_id=a.question_id
   and q.version=v_version
   and q.active=true
  cross join lateral jsonb_array_elements(q.options) o
  where a.assessment_id=p_assessment_id
    and q.construct='downturn_experience'
    and o->>'value'=a.answer_value->>'value'
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(o->>'label') order by o->>'label'),'[]'::jsonb)
  into v_ex_products
  from public.answers a
  join public.question_bank q
    on q.question_id=a.question_id
   and q.version=v_version
   and q.active=true
  cross join lateral jsonb_array_elements(q.options) o
  where a.assessment_id=p_assessment_id
    and q.construct='product_exposure'
    and a.answer_value->'value' ? (o->>'value');

  return jsonb_build_object(
    'question_count',v_question_count,
    'questionnaire_version',v_version,
    'risk_tolerance',jsonb_build_object(
      'answer_count',v_rt_count,
      'overall_score',r.risk_tolerance,
      'dimensions',v_rt
    ),
    'behavioral_dna',jsonb_build_object(
      'answer_count',v_bd_count,
      'dimensions',coalesce(r.behavioral_profile,v_bd)
    ),
    'risk_capacity',jsonb_build_object(
      'answer_count',v_rc_count,
      'overall_score',r.risk_capacity,
      'raw_score',r.capacity_profile->'raw_index',
      'dimensions',v_rc,
      'guard',r.capacity_profile
    ),
    'investment_experience',jsonb_build_object(
      'answer_count',v_ex_count,
      'overall_score',r.experience_profile->'overall_score',
      'dimensions',r.experience_profile->'dimensions',
      'decision_experience',v_ex_decision,
      'downturn_experience',v_ex_downturn,
      'owned_products',v_ex_products,
      'role',coalesce(r.experience_profile->>'role','context_only')
    )
  );
end;
$$;

revoke all on function public.build_assessment_dimension_profile(uuid) from public,anon,authenticated;
grant execute on function public.build_assessment_dimension_profile(uuid) to service_role;

create or replace function public.create_report_snapshot(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
declare
  r public.results%rowtype;
  f public.fingerprint_profiles%rowtype;
  n public.narratives%rowtype;
  c public.investment_context%rowtype;
  p jsonb;
  rid uuid;
  v_report_version text;
  v_dimensions jsonb;
begin
  select * into r from public.results where assessment_id=p_assessment_id order by created_at desc limit 1;
  if not found then raise exception 'Result not found for assessment %',p_assessment_id; end if;
  select * into f from public.fingerprint_profiles where assessment_id=p_assessment_id order by created_at desc limit 1;
  if not found then raise exception 'Fingerprint not found for assessment %',p_assessment_id; end if;
  select * into n from public.narratives where assessment_id=p_assessment_id order by created_at desc limit 1;
  if not found then raise exception 'Narrative not found for assessment %',p_assessment_id; end if;
  select * into c from public.investment_context where assessment_id=p_assessment_id limit 1;

  v_dimensions:=public.build_assessment_dimension_profile(p_assessment_id);
  v_report_version:=case
    when r.model_version like 'dna-v1.10-%' then 'report-v1.5'
    when r.model_version like 'dna-v1.9-%' then 'report-v1.3'
    else 'report-v1.2'
  end;

  p := jsonb_build_object(
    'assessment_id',p_assessment_id,
    'report_version',v_report_version,
    'model_version',r.model_version,
    'generated_at',now(),
    'archetype',r.archetype,
    'risk_tolerance',r.risk_tolerance,
    'risk_capacity',r.risk_capacity,
    'capacity_profile',r.capacity_profile,
    'behavioral_profile',r.behavioral_profile,
    'experience_profile',r.experience_profile,
    'assessment_dimensions',v_dimensions,
    'quality_profile',r.quality_profile,
    'fingerprint_code',f.fingerprint_code,
    'decision_style',f.decision_style,
    'pressure_style',f.pressure_style,
    'strengths',f.strengths,
    'watchouts',f.watchouts,
    'narrative',n.narrative,
    'investment_context',case when c.id is null then null else jsonb_build_object(
      'first_name',c.first_name,
      'age',c.age,
      'amount_to_invest',c.amount_to_invest,
      'amount_currency',c.amount_currency,
      'goal',c.goal,
      'time_horizon',c.time_horizon,
      'horizon_months',c.horizon_months,
      'principal_required',c.principal_required,
      'investment_share',c.investment_share,
      'liquidity_need',c.liquidity_need,
      'required_return',c.required_return,
      'loss_consequence',c.loss_consequence,
      'experience',c.experience
    ) end
  );

  insert into public.report_snapshots(assessment_id,report_version,model_version,report)
  values(p_assessment_id,v_report_version,r.model_version,p)
  on conflict (assessment_id,report_version,model_version)
  do update set report=excluded.report,generated_at=now()
  returning id into rid;

  return jsonb_build_object('id',rid,'report',p);
end;
$function$;

revoke all on function public.create_report_snapshot(uuid) from public,anon,authenticated;
grant execute on function public.create_report_snapshot(uuid) to service_role;

-- Refresh completed v1.10 reports into report-v1.5 so saved profiles gain the
-- richer reporting data without changing any scores or archetypes.
do $$
declare x record;
begin
  for x in
    select id from public.assessments
    where status='completed' and questionnaire_version like 'v1.10-%'
  loop
    perform public.create_report_snapshot(x.id);
  end loop;
end $$;
