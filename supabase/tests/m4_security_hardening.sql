-- Milestone 4 security/account hardening regression. All mutations roll back.
begin;

do $$
declare
  bad_count int;
  claim_assessment_id uuid;
  temp_profile_id uuid;
  claimed jsonb;
  completion jsonb;
  current_ok boolean;
  snapshot_ok boolean;
begin
  -- Public research RPCs must remain invoker-side at the exposed API boundary.
  select count(*) into bad_count
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in (
      'app_search_investments',
      'app_compare_investments',
      'app_get_investment_dna',
      'app_get_official_fund_facts',
      'get_current_investor_app_state'
    )
    and p.prosecdef;
  if bad_count<>0 then
    raise exception 'Expected exposed research/app-state RPCs to be SECURITY INVOKER; % remain definer',bad_count;
  end if;

  -- The five remaining core read-model views are read-only browser surfaces
  -- while their SECURITY DEFINER boundary is being deliberately redesigned.
  select count(*) into bad_count
  from information_schema.role_table_grants g
  where g.table_schema='public'
    and g.table_name in (
      'v_investment_catalog',
      'v_investment_detail',
      'v_investment_screener',
      'v_investment_dna_v2',
      'v_investment_latest_income'
    )
    and g.grantee in ('anon','authenticated')
    and g.privilege_type<>'SELECT';
  if bad_count<>0 then
    raise exception 'Core read-model views expose % non-SELECT browser grants',bad_count;
  end if;

  select count(*) into bad_count
  from information_schema.role_table_grants g
  where g.table_schema='public'
    and g.table_name in (
      'v_investment_catalog',
      'v_investment_detail',
      'v_investment_screener',
      'v_investment_dna_v2',
      'v_investment_latest_income'
    )
    and g.grantee in ('anon','authenticated')
    and g.privilege_type='SELECT';
  if bad_count<>10 then
    raise exception 'Expected SELECT-only access for 5 views x 2 browser roles; got % grants',bad_count;
  end if;

  -- Retired browser RPCs stay in history but must not remain callable by browser roles.
  if has_function_privilege('anon','public.app_save_investment_context(uuid,jsonb)','execute')
     or has_function_privilege('authenticated','public.app_save_investment_context(uuid,jsonb)','execute') then
    raise exception 'Legacy app_save_investment_context is still browser executable';
  end if;
  if has_function_privilege('anon','public.get_investor_home()','execute')
     or has_function_privilege('authenticated','public.get_investor_home()','execute') then
    raise exception 'Legacy get_investor_home is still browser executable';
  end if;
  if has_function_privilege('authenticated','public.get_investment_recommendations(uuid,integer)','execute') then
    raise exception 'Legacy get_investment_recommendations is still browser executable';
  end if;
  if has_function_privilege('authenticated','public.promote_assessment_to_current_dna(uuid)','execute') then
    raise exception 'Legacy promote_assessment_to_current_dna is still browser executable';
  end if;

  -- Portfolio Builder is frozen: current live completion/context/app-state paths must not invoke it.
  if pg_get_functiondef('public.complete_dna_assessment(uuid)'::regprocedure) ilike '%generate_portfolio_blueprints%'
     or pg_get_functiondef('public.service_save_investment_context(uuid,jsonb)'::regprocedure) ilike '%generate_portfolio_blueprints%'
     or pg_get_functiondef('investor_private.current_investor_app_state()'::regprocedure) ilike '%generate_portfolio_blueprints%' then
    raise exception 'Frozen Portfolio Builder leaked back into a live M4 path';
  end if;

  -- A completed guest assessment must be claimable by the service path without browser auth.uid().
  select a.id into claim_assessment_id
  from public.assessments a
  where a.status='completed'
    and a.profile_id is null
    and exists(select 1 from public.results r where r.assessment_id=a.id)
    and exists(select 1 from public.fingerprint_profiles f where f.assessment_id=a.id)
  order by a.completed_at desc nulls last,a.started_at desc
  limit 1;

  if claim_assessment_id is null then
    raise exception 'No completed guest assessment available for rollback claim regression';
  end if;

  insert into public.profiles default values returning id into temp_profile_id;
  claimed:=public.service_claim_assessment(claim_assessment_id,temp_profile_id);
  if coalesce((claimed->>'claimed')::boolean,false) is not true then
    raise exception 'Service claim did not report success';
  end if;

  select a.profile_id=temp_profile_id and a.is_current
    into current_ok
  from public.assessments a
  where a.id=claim_assessment_id;
  if current_ok is not true then
    raise exception 'Claimed assessment was not promoted to current profile state';
  end if;

  select exists(
    select 1
    from public.investor_profiles ip
    join public.investor_profile_snapshots s on s.investor_profile_id=ip.id
    where ip.profile_id=temp_profile_id
      and ip.latest_assessment_id=claim_assessment_id
      and s.assessment_id=claim_assessment_id
  ) into snapshot_ok;
  if snapshot_ok is not true then
    raise exception 'Claim regression did not create/retain current Investor DNA snapshot';
  end if;

  completion:=public.complete_dna_assessment(claim_assessment_id);
  if completion ? 'portfolio' then
    raise exception 'Frozen Portfolio Builder key unexpectedly returned from completion contract';
  end if;
end $$;

rollback;
select 'PASS: M4 security/account hardening and portfolio freeze' as verification;
