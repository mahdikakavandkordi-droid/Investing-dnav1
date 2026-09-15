-- Run inside BEGIN/ROLLBACK; no real-user IDs or changes.
create temporary table v6_test_evidence(name text,payload jsonb) on commit drop;
do $test$
declare a uuid; b uuid; result jsonb; m jsonb; p jsonb; x jsonb; pre numeric; post numeric; q record; original_count int;
begin
 select count(*) into original_count from public.question_bank where version='v1.9-cognitive-candidate';
 if original_count<>28 then raise exception 'legacy question count changed';end if;
 for q in select * from (values ('healthy','D','D','D','growth',144,'no'),('essential_loss','D','A','D','growth',144,'no'),('no_reserve','D','D','A','growth',144,'no'),('emergency','D','D','D','emergency_reserve',12,'yes'),('bond_short','D','D','D','income',12,'no'),('no_context','D','D','D',null,null,null)) t(name,rt,loss,reserve,goal,months,principal) loop
  insert into public.assessments(questionnaire_version,model_version,scoring_version) values('v1.10-cognitive-candidate','dna-v1.10-research','scoring-v1.10-research') returning id into a;
  insert into public.answers(assessment_id,question_id,answer_value)
   select a,question_id,jsonb_build_object('value',case when question_id='EX02' then '["funds","stocks"]'::jsonb when question_id='RC05' then to_jsonb(q.loss) when question_id='RC03' then to_jsonb(q.reserve) else to_jsonb(q.rt) end)
   from public.question_bank where version='v1.10-cognitive-candidate' and active;
  result:=public.complete_dna_assessment(a);m:=result->'match';
  if q.goal is not null then
   result:=public.service_save_investment_context(a,jsonb_build_object('goal',q.goal,'horizon_months',q.months,'principal_required',q.principal,'liquidity_need','low'));
   m:=result->'match';p:=result->'portfolio';
  end if;
  if q.name='healthy' then
   if m->>'status'<>'available' then raise exception 'healthy failed: %',m->'constraints';end if;
   if (m->>'eligible_count')::int=0 then raise exception 'no healthy matches';end if;
   for x in select value from jsonb_array_elements(p->'blueprints') loop
    if abs((x->>'target_equity_pct')::numeric+(x->>'target_fixed_income_pct')::numeric-100)>.01 then raise exception 'invalid portfolio exposure';end if;
    if (x->>'target_equity_pct')::numeric<>(x#>>'{rationale,actual_equity_pct}')::numeric then raise exception 'declared exposure differs';end if;
   end loop;
   if (select public.calculate_investing_dna(a)->>'risk_tolerance')::numeric<>100 then raise exception 'scorer changed tolerance';end if;
  elsif q.name in ('essential_loss','no_reserve','emergency','bond_short') then
   if m->>'status'<>'review_required' or (m->>'eligible_count')::int<>0 then raise exception 'gate failed %',q.name;end if;
   if (p->>'count')::int<>0 then raise exception 'gated portfolio exists %',q.name;end if;
   if exists(select 1 from jsonb_array_elements(m->'results')v where v->>'match_score' is not null) then raise exception 'blocked fund given numeric fit';end if;
   if q.name in ('essential_loss','no_reserve') and (select risk_capacity from public.results where assessment_id=a)>39 then raise exception 'critical capacity averaged away';end if;
  else
   if m->>'status'<>'context_required' or jsonb_array_length(m->'top_matches')<>0 then raise exception 'context-free top matches';end if;
  end if;
  -- direct response and cached response share one snapshot, not hardcoded v4.2.
  if investor_private.current_match(a)->>'run_id'<>m->>'run_id' and q.name<>'healthy' then raise exception 'snapshot reader drift';end if;
  insert into v6_test_evidence values(q.name,jsonb_build_object('status',m->'status','eligible',m->'eligible_count','model',m->'model_version','portfolios',p->'count'));
 end loop;
 -- Continuous score behavior around the former 40 threshold.
 update public.results set risk_tolerance=39,risk_capacity=100 where assessment_id=a;
 perform public.service_save_investment_context(a,'{"goal":"growth","horizon_months":144,"liquidity_need":"low","principal_required":"no"}');
 m:=investor_private.current_match(a);select (v->>'match_score')::numeric into pre from jsonb_array_elements(m->'results')v where v->>'symbol'='XEQT';
 update public.results set risk_tolerance=40 where assessment_id=a;
 m:=investor_private.current_match(a);select (v->>'match_score')::numeric into post from jsonb_array_elements(m->'results')v where v->>'symbol'='XEQT';
 if abs(post-pre)>3 then raise exception '40 threshold cliff: % -> %',pre,post;end if;
 insert into v6_test_evidence values('threshold_39_40',jsonb_build_object('before',pre,'after',post));
 -- Wrong shapes and contradictory multi-select choices must never complete.
 insert into public.assessments(questionnaire_version,model_version,scoring_version) values('v1.10-cognitive-candidate','dna-v1.10-research','scoring-v1.10-research') returning id into b;
 insert into public.answers(assessment_id,question_id,answer_value) select b,question_id,case when question_id='EX02' then '{"value":["none","stocks"]}'::jsonb else '{"value":"D"}'::jsonb end from public.question_bank where version='v1.10-cognitive-candidate';
 begin
  perform public.complete_dna_assessment(b);
  raise exception 'invalid choices accepted';
 exception when others then if sqlerrm='invalid choices accepted' then raise;end if;
 end;
 if (select status from public.assessments where id=b)<>'in_progress' then raise exception 'partial submit was committed';end if;
 insert into v6_test_evidence values('invalid_multi_atomic',jsonb_build_object('passed',true));
end $test$;
select * from v6_test_evidence;
