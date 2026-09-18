-- M4 launch hardening: move account-state privilege behind a non-exposed implementation and keep the public RPC invoker-only.
-- Portfolio Builder is frozen during M4, and the current browser AppState contract does not consume portfolio blueprint fields.
create or replace function investor_private.current_investor_app_state()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  p public.profiles;
  ip public.investor_profiles;
  report jsonb;
  m jsonb;
  r jsonb;
  c jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;

  select * into p from public.profiles where user_id=auth.uid() limit 1;
  if p.id is null then
    return jsonb_build_object('has_profile',false,'dna',null);
  end if;

  select * into ip from public.investor_profiles where profile_id=p.id limit 1;
  if ip.latest_assessment_id is null then
    return jsonb_build_object('has_profile',true,'dna',null);
  end if;

  if not exists(
    select 1 from public.assessments
    where id=ip.latest_assessment_id and profile_id=p.id
  ) then
    raise exception 'assessment_not_owned' using errcode='42501';
  end if;

  select to_jsonb(x) into r
  from public.results x
  where assessment_id=ip.latest_assessment_id
  order by created_at desc,id desc
  limit 1;

  if r is null then
    return jsonb_build_object('has_profile',true,'dna',null);
  end if;

  select rs.report into report
  from public.report_snapshots rs
  where rs.assessment_id=ip.latest_assessment_id
  order by rs.generated_at desc,rs.created_at desc
  limit 1;

  select to_jsonb(x) into c
  from public.investment_context x
  where x.assessment_id=ip.latest_assessment_id;

  report:=coalesce(report,r)||jsonb_build_object(
    'investment_context',c,
    'capacity_profile',r->'capacity_profile'
  );

  m:=investor_private.current_match(ip.latest_assessment_id);

  return jsonb_build_object(
    'authenticated',true,
    'has_profile',true,
    'profile_id',p.id,
    'investor_profile_id',ip.id,
    'assessment_id',ip.latest_assessment_id,
    'dna',r,
    'report',report,
    'matches',m
  );
end;
$$;
revoke all on function investor_private.current_investor_app_state() from public;
grant execute on function investor_private.current_investor_app_state() to authenticated,service_role;

create or replace function public.get_current_investor_app_state()
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select investor_private.current_investor_app_state();
$$;
revoke all on function public.get_current_investor_app_state() from public,anon;
grant execute on function public.get_current_investor_app_state() to authenticated,service_role;
