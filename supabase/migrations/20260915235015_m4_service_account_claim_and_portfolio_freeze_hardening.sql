-- M4 hardening: account claim/completion must not depend on a browser auth.uid() inside service-role execution.
-- Portfolio Builder is frozen and is removed from live completion/context contracts while historical functions/tables remain preserved.

create or replace function investor_private.promote_assessment_to_profile(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_a public.assessments;
  v_p public.profiles;
  v_r public.results;
  v_ip public.investor_profiles;
  v_s public.investor_profile_snapshots;
  v_f public.fingerprint_profiles;
begin
  select * into v_a from public.assessments where id=p_assessment_id;
  if v_a.id is null then raise exception 'assessment_not_found'; end if;
  if v_a.profile_id is null then raise exception 'assessment_profile_required'; end if;

  select * into v_p from public.profiles where id=v_a.profile_id;
  if v_p.id is null then raise exception 'profile_not_found'; end if;
  if v_a.status <> 'completed' then raise exception 'assessment_not_completed'; end if;

  select * into v_r
  from public.results
  where assessment_id=p_assessment_id
  order by created_at desc,id desc
  limit 1;
  if v_r.id is null then raise exception 'dna_result_not_found'; end if;

  select * into v_f
  from public.fingerprint_profiles
  where assessment_id=p_assessment_id
  order by created_at desc,id desc
  limit 1;

  update public.assessments
  set is_current=false
  where profile_id=v_p.id and id<>p_assessment_id and is_current=true;

  update public.assessments set is_current=true where id=p_assessment_id;

  insert into public.investor_profiles(profile_id,latest_assessment_id,display_name,created_at,updated_at)
  values(v_p.id,p_assessment_id,coalesce(v_p.first_name,v_r.archetype),now(),now())
  on conflict(profile_id) do update
    set latest_assessment_id=excluded.latest_assessment_id,updated_at=now()
  returning * into v_ip;

  insert into public.investor_profile_snapshots(
    investor_profile_id,assessment_id,model_version,archetype,risk_tolerance,risk_capacity,
    fingerprint_code,decision_style,pressure_style,behavioral_profile,strengths,watchouts,narrative
  )
  values(
    v_ip.id,p_assessment_id,v_r.model_version,v_r.archetype,v_r.risk_tolerance,v_r.risk_capacity,
    v_f.fingerprint_code,v_f.decision_style,v_f.pressure_style,v_r.behavioral_profile,v_f.strengths,v_f.watchouts,v_r.narrative
  )
  on conflict do nothing
  returning * into v_s;

  return jsonb_build_object(
    'profile_id',v_p.id,
    'assessment_id',p_assessment_id,
    'investor_profile_id',v_ip.id,
    'is_current',true,
    'snapshot_id',v_s.id,
    'model_version',v_r.model_version
  );
end;
$$;
revoke all on function investor_private.promote_assessment_to_profile(uuid) from public,anon,authenticated;
grant execute on function investor_private.promote_assessment_to_profile(uuid) to service_role;

create or replace function public.complete_dna_assessment(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  a public.assessments;
  r jsonb;
  q jsonb;
  f jsonb;
  n jsonb;
  report jsonb;
  m jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_assessment_id::text,600));
  select * into a from public.assessments where id=p_assessment_id for update;
  if a.id is null or a.status not in ('in_progress','completed') then raise exception 'assessment_unavailable';end if;

  if a.status='in_progress' then
    r:=public.calculate_investing_dna(p_assessment_id);
  else
    select to_jsonb(x) into r
    from public.results x
    where assessment_id=p_assessment_id
    order by created_at desc,id desc
    limit 1;
  end if;
  if r is null then raise exception 'dna_result_not_found';end if;

  q:=public.calculate_assessment_quality(p_assessment_id);
  f:=public.calculate_investing_fingerprint(p_assessment_id);
  n:=public.generate_investing_narrative(p_assessment_id);

  if a.profile_id is not null then
    perform investor_private.promote_assessment_to_profile(p_assessment_id);
  end if;

  report:=public.create_report_snapshot(p_assessment_id);
  m:=investor_private.current_match(p_assessment_id);

  return jsonb_build_object(
    'result',r||jsonb_build_object('quality_profile',q),
    'quality',q,
    'fingerprint',f,
    'narrative',n,
    'report',report,
    'match',m,
    'account_linked',a.profile_id is not null,
    'language_code',a.language_code
  );
end;
$$;
revoke all on function public.complete_dna_assessment(uuid) from public,anon,authenticated;
grant execute on function public.complete_dna_assessment(uuid) to service_role;

create or replace function public.service_save_investment_context(p_assessment_id uuid, p_context jsonb)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  a public.assessments;
  c public.investment_context;
  v_months int;
  v_time text;
  v_name text;
  report jsonb;
  m jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_assessment_id::text,600));
  select * into a from public.assessments where id=p_assessment_id for update;
  if a.id is null or a.status<>'completed' then raise exception 'Complete your assessment first.';end if;
  if p_context->>'goal' is null or p_context->>'liquidity_need' is null then raise exception 'Choose your goal and access needs.';end if;

  v_months:=(p_context->>'horizon_months')::int;
  if v_months is not null and (v_months<0 or v_months>1200) then raise exception 'Withdrawal horizon must be 0 to 1200 months.';end if;
  v_time:=coalesce(p_context->>'time_horizon',case when v_months<12 then 'lt_1y' when v_months<36 then '1_3y' when v_months<60 then '3_5y' when v_months<120 then '5_10y' else 'gt_10y' end);
  if v_months is null and p_context->>'time_horizon' is null then raise exception 'Choose when you may first need this money.';end if;
  v_name:=nullif(trim(p_context->>'first_name'),'');

  insert into public.investment_context(
    assessment_id,goal,time_horizon,liquidity_need,horizon_months,principal_required,investment_share,
    first_name,age,amount_to_invest,amount_currency,required_return,loss_consequence,experience
  )
  values(
    p_assessment_id,p_context->>'goal',v_time,p_context->>'liquidity_need',v_months,
    p_context->>'principal_required',p_context->>'investment_share',v_name,
    (p_context->>'age')::int,(p_context->>'amount_to_invest')::numeric,'CAD',null,null,null
  )
  on conflict(assessment_id) do update set
    goal=excluded.goal,
    time_horizon=excluded.time_horizon,
    liquidity_need=excluded.liquidity_need,
    horizon_months=excluded.horizon_months,
    principal_required=excluded.principal_required,
    investment_share=excluded.investment_share,
    first_name=excluded.first_name,
    age=excluded.age,
    amount_to_invest=excluded.amount_to_invest,
    required_return=null,
    loss_consequence=null,
    experience=null,
    updated_at=clock_timestamp()
  returning * into c;

  report:=public.create_report_snapshot(p_assessment_id);
  m:=public.calculate_investment_match_v6(p_assessment_id);

  return jsonb_build_object(
    'investment_context',to_jsonb(c),
    'report',report,
    'match',m
  );
end;
$$;
revoke all on function public.service_save_investment_context(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.service_save_investment_context(uuid,jsonb) to service_role;

-- These are now service/internal-only legacy helpers rather than browser APIs.
revoke execute on function public.get_investment_recommendations(uuid,integer) from public,anon,authenticated;
grant execute on function public.get_investment_recommendations(uuid,integer) to service_role;

revoke execute on function public.promote_assessment_to_current_dna(uuid) from public,anon,authenticated;
grant execute on function public.promote_assessment_to_current_dna(uuid) to service_role;
