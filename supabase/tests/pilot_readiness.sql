-- Investor DNA — pilot readiness regression
begin;

do $$
declare
  v_count integer;
  v_gate jsonb;
  v_cognitive_id uuid;
  v_temp_id uuid := extensions.gen_random_uuid();
begin
  if has_table_privilege('anon','public.pilot_cohort_dependencies','SELECT')
     or has_table_privilege('authenticated','public.pilot_cohort_dependencies','SELECT')
  then
    raise exception 'pilot cohort dependency table must remain service-only';
  end if;

  if has_function_privilege('anon','public.service_pilot_measurement_snapshot(text)','EXECUTE')
     or has_function_privilege('authenticated','public.service_pilot_measurement_snapshot(text)','EXECUTE')
  then
    raise exception 'pilot measurement snapshot must remain service-only';
  end if;

  if has_function_privilege('anon','public.service_pilot_cohort_gate(uuid)','EXECUTE')
     or has_function_privilege('authenticated','public.service_pilot_cohort_gate(uuid)','EXECUTE')
  then
    raise exception 'pilot cohort gate must remain service-only';
  end if;

  select count(*) into v_count
  from information_schema.columns
  where table_schema='public'
    and table_name='pilot_feedback'
    and column_name in (
      'interpreted_match_as_buy_recommendation',
      'interpreted_match_score_as_return_forecast'
    );

  if v_count <> 2 then
    raise exception 'expected both structured safety-comprehension feedback fields';
  end if;

  select count(*) into v_count
  from public.pilot_data_dictionary
  where version='v1.3'
    and field_key in (
      'feedback_match_as_buy_recommendation',
      'feedback_score_as_return_forecast'
    )
    and classification='operational'
    and allowed_for_validation=false;

  if v_count <> 2 then
    raise exception 'pilot data dictionary v1.3 must classify both safety feedback fields as operational';
  end if;

  select id into v_cognitive_id
  from public.pilot_cohorts
  where code='COGNITIVE_V1_10'
    and target_n=12
  limit 1;

  if v_cognitive_id is null then
    raise exception 'COGNITIVE_V1_10 target-12 prerequisite fixture missing';
  end if;

  insert into public.pilot_cohorts(
    id,code,questionnaire_version,model_version,target_n,min_n_for_basic_stats,min_n_for_reliability,status,notes
  )
  values(
    v_temp_id,
    'TEST_PRODUCT_PILOT_GATE_'||replace(v_temp_id::text,'-',''),
    'v1.10-cognitive-candidate',
    'dna-v1.10-research',
    30,5,20,'planned','rollback-only readiness regression'
  );

  insert into public.pilot_cohort_dependencies(
    cohort_id,prerequisite_cohort_id,minimum_completed,required_status,notes
  )
  values(
    v_temp_id,v_cognitive_id,12,'closed','rollback-only readiness regression'
  );

  v_gate := public.service_pilot_cohort_gate(v_temp_id);

  if coalesce((v_gate->>'gated')::boolean,false) is not true then
    raise exception 'temporary product pilot must be recognized as gated';
  end if;

  if coalesce((v_gate->>'allowed')::boolean,false) is true then
    raise exception 'cognitive prerequisite gate unexpectedly allowed product pilot';
  end if;

  if (public.service_pilot_measurement_snapshot('DEV_V1_10')->'cohort'->>'code') <> 'DEV_V1_10' then
    raise exception 'pilot measurement snapshot did not resolve DEV_V1_10';
  end if;
end $$;

rollback;

select 'PASS: pilot readiness measurement, safety feedback and prerequisite gate' as result;
