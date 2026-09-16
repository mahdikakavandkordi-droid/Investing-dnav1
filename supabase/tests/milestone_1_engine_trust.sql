-- Milestone 1 engine-trust regression suite.
-- All synthetic records and mutations are rolled back.
begin;

create or replace function pg_temp.m1_make_assessment(
  p_mode text,
  p_goal text default 'growth',
  p_horizon text default '10_plus',
  p_months int default 144,
  p_principal text default 'no'
) returns uuid language plpgsql as $$
declare aid uuid:=gen_random_uuid();
begin
 insert into public.assessments(id,assessment_version,questionnaire_version,model_version,scoring_version,status,language_code)
 values(aid,'v1.10-cognitive-candidate','v1.10-cognitive-candidate','dna-v1.10-research','dna-v1.10-research','in_progress','en');
 insert into public.answers(assessment_id,question_id,answer_value)
 select aid,q.question_id,
   case
    when q.question_type='multi_choice' then jsonb_build_object('value',jsonb_build_array('funds'))
    when p_mode='loss_gate' and q.question_id='RC05' then jsonb_build_object('value','A')
    when p_mode='reserve_gate' and q.question_id='RC03' then jsonb_build_object('value','A')
    when p_mode='low_tolerance' and q.section='risk_tolerance' then jsonb_build_object('value','A')
    when p_mode='one_step_lower' and q.question_id='RT01' then jsonb_build_object('value','C')
    else jsonb_build_object('value','D') end
 from public.question_bank q
 where q.version='v1.10-cognitive-candidate' and q.active=true;
 perform public.calculate_investing_dna(aid);
 insert into public.investment_context(assessment_id,goal,time_horizon,horizon_months,principal_required,investment_share,liquidity_need,experience)
 values(aid,p_goal,p_horizon,p_months,p_principal,'under_10','low','experienced');
 return aid;
end $$;

create temp table m1_state(key text primary key,val text) on commit drop;

-- Legacy Match runtimes/readers are retired, not parallel live implementations.
do $$ begin
 if to_regprocedure('public.calculate_investment_match_v3(uuid)') is not null then raise exception 'legacy Match v3 still exists'; end if;
 if to_regprocedure('public.calculate_investment_match_v4(uuid)') is not null then raise exception 'legacy Match v4 still exists'; end if;
 if to_regprocedure('public.calculate_investment_match_v5(uuid)') is not null then raise exception 'legacy Match v5 still exists'; end if;
 if to_regprocedure('public.calculate_investment_match_v51(uuid)') is not null then raise exception 'legacy Match v5.1 still exists'; end if;
 if to_regprocedure('public.calculate_investment_match(uuid)') is not null then raise exception 'unversioned Match wrapper still exists'; end if;
 if to_regclass('public.v_investment_dna_v1') is not null then raise exception 'legacy Investment DNA v1 view still exists'; end if;
 if to_regprocedure('public.get_investment_recommendations(uuid,integer)') is not null then raise exception 'legacy recommendations reader still exists'; end if;
 if to_regprocedure('public.get_explainable_match(uuid,integer)') is not null then raise exception 'legacy explainable reader still exists'; end if;
 if to_regprocedure('public.get_investment_match_intelligence(uuid)') is not null then raise exception 'legacy intelligence reader still exists'; end if;
 if to_regprocedure('public.capture_current_match_snapshot(uuid)') is not null then raise exception 'unused Match snapshot writer still exists'; end if;
 if to_regprocedure('public.cleanup_match_result_versions(uuid,text)') is not null then raise exception 'unused Match cleanup helper still exists'; end if;
 if to_regclass('public.investor_match_snapshots') is not null then raise exception 'empty legacy Match snapshot table still exists'; end if;
 if to_regprocedure('public.calculate_investment_match_v6(uuid)') is null then raise exception 'canonical Match v6 missing'; end if;
 if to_regprocedure('investor_private.current_match(uuid)') is null then raise exception 'canonical current_match missing'; end if;
 if to_regclass('public.v_investment_dna_v2') is null then raise exception 'canonical Investment DNA v2 view missing'; end if;
end $$;

-- Match v6 is an ETF-only product boundary even though Explore/Detail/Compare are cross-asset.
do $$ declare v_match_count int; v_active_etf_count int; begin
 select count(*) into v_match_count from public.v_investment_dna_v2;
 select count(*) into v_active_etf_count from public.investments where is_active=true and asset_type='ETF';
 if exists(select 1 from public.v_investment_dna_v2 where asset_type is distinct from 'ETF') then
  raise exception 'non-ETF instrument leaked into Match research view';
 end if;
 if v_match_count<>v_active_etf_count then
  raise exception 'Match universe count % differs from active ETF count %',v_match_count,v_active_etf_count;
 end if;
end $$;

-- Canonical run, explicit versions and stable reuse.
do $$ declare aid uuid; m1 jsonb; m2 jsonb; v_etf_count int; begin
 aid:=pg_temp.m1_make_assessment('normal');
 m1:=investor_private.current_match(aid); m2:=investor_private.current_match(aid);
 select count(*) into v_etf_count from public.v_investment_dna_v2;
 if m1->>'model_version'<>'investment-dna-match-v6' then raise exception 'wrong canonical model'; end if;
 if m1->>'run_id' is null or m1->>'data_version' is null or m1->'versions' is null then raise exception 'missing run/version metadata'; end if;
 if m1#>>'{versions,questionnaire}'<>'v1.10-cognitive-candidate' or m1#>>'{versions,investor_dna}'<>'dna-v1.10-research' then raise exception 'wrong questionnaire/DNA metadata'; end if;
 if m1->>'run_id' is distinct from m2->>'run_id' then raise exception 'unchanged inputs should reuse run'; end if;
 if (m1->>'universe_count')::int<>v_etf_count then raise exception 'Match payload universe count is not ETF-scoped'; end if;
 if exists(select 1 from jsonb_array_elements(coalesce(m1->'results','[]'::jsonb)) x where x#>>'{explanation,investment_dna,asset_type}' is distinct from 'ETF') then
  raise exception 'non-ETF row leaked into Match payload';
 end if;
 if (m1->>'eligible_count')::int<1 or m1->>'status'<>'available' then raise exception 'normal scenario expected available options'; end if;
 insert into m1_state values('aid',aid::text),('old_run',m1->>'run_id'),('old_data_version',m1->>'data_version');
end $$;

-- A scoring-relevant fund-data change must invalidate the cached run.
update public.investment_intelligence_profiles ip
set growth_score=greatest(0,least(100,ip.growth_score-1))
where ip.id=(select ip2.id from public.investment_intelligence_profiles ip2 join public.v_investment_dna_v2 v on v.investment_id=ip2.investment_id where ip2.model_version='intelligence-v1.1' order by v.symbol limit 1);

do $$ declare aid uuid; m3 jsonb; begin
 aid:=(select val::uuid from m1_state where key='aid'); m3:=investor_private.current_match(aid);
 if m3->>'run_id' is not distinct from (select val from m1_state where key='old_run') then raise exception 'fund-data change did not invalidate run'; end if;
 if m3->>'data_version' is not distinct from (select val from m1_state where key='old_data_version') then raise exception 'fund-data version did not change'; end if;
end $$;

-- Critical capacity answer: guard the profile and suppress eligible recommendations.
do $$ declare aid uuid; r public.results; m jsonb; begin
 aid:=pg_temp.m1_make_assessment('loss_gate');
 select * into r from public.results where assessment_id=aid order by created_at desc limit 1;
 if r.risk_capacity>39 then raise exception 'loss guard failed'; end if;
 if r.archetype in ('JACKPOT','HIGHROLLER') then raise exception 'unsafe archetype'; end if;
 m:=investor_private.current_match(aid);
 if m->>'status'<>'review_required' or not (m#>'{constraints,codes}' ? 'essential_spending_at_risk') then raise exception 'loss gate missing'; end if;
 if (m->>'eligible_count')::int<>0 or jsonb_array_length(m->'top_matches')<>0 then raise exception 'loss gate exposed eligible/top matches'; end if;
 if exists(select 1 from public.investment_match_results where assessment_id=aid and model_version='investment-dna-match-v6' and match_score is not null) then raise exception 'review-required scores should be NULL'; end if;
end $$;

-- Emergency reserve gate.
do $$ declare aid uuid; m jsonb; begin
 aid:=pg_temp.m1_make_assessment('reserve_gate'); m:=investor_private.current_match(aid);
 if m->>'status'<>'review_required' or not (m#>'{constraints,codes}' ? 'emergency_buffer_short') then raise exception 'emergency reserve gate failed'; end if;
 if (m->>'eligible_count')::int<>0 then raise exception 'reserve gate exposed eligible options'; end if;
end $$;

-- Short-horizon gate.
do $$ declare aid uuid; m jsonb; begin
 aid:=pg_temp.m1_make_assessment('normal','growth','1_3y',24,'no'); m:=investor_private.current_match(aid);
 if m->>'status'<>'review_required' or not (m#>'{constraints,codes}' ? 'short_horizon') then raise exception 'short-horizon gate failed'; end if;
 if (m#>>'{constraints,equity_ceiling}')::numeric<>0 then raise exception 'short horizon equity ceiling should be 0'; end if;
end $$;

-- Principal-protection gate.
do $$ declare aid uuid; m jsonb; begin
 aid:=pg_temp.m1_make_assessment('normal','growth','10_plus',144,'yes'); m:=investor_private.current_match(aid);
 if m->>'status'<>'review_required' or not (m#>'{constraints,codes}' ? 'principal_protection_needed') then raise exception 'principal-protection gate failed'; end if;
end $$;

-- Explicit no-suitable-options state without a safety-review gate.
do $$ declare aid uuid; m jsonb; begin
 aid:=pg_temp.m1_make_assessment('low_tolerance','growth','10_plus',144,'no'); m:=investor_private.current_match(aid);
 if (m#>>'{constraints,financial_review_required}')::boolean then raise exception 'low-tolerance scenario unexpectedly review-gated'; end if;
 if m->>'status'<>'no_suitable_options' then raise exception 'expected no_suitable_options, got %',m->>'status'; end if;
 if (m->>'eligible_count')::int<>0 then raise exception 'no_suitable_options has eligible rows'; end if;
end $$;

-- Sensitivity sanity check: one non-critical answer step should move RT modestly.
do $$ declare a1 uuid; a2 uuid; r1 numeric; r2 numeric; begin
 a1:=pg_temp.m1_make_assessment('normal'); a2:=pg_temp.m1_make_assessment('one_step_lower');
 select risk_tolerance into r1 from public.results where assessment_id=a1 order by created_at desc limit 1;
 select risk_tolerance into r2 from public.results where assessment_id=a2 order by created_at desc limit 1;
 if r1-r2<=0 or r1-r2>5 then raise exception 'single-item sensitivity outside expected range: % vs %',r1,r2; end if;
end $$;

rollback;
select 'PASS: M1 engine trust regression suite' as verification;
