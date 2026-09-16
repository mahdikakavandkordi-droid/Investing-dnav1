-- Immutable response snapshots unify guest, account and fund-detail reads.
-- Research rules: gates precede ranking; scores are not suitability certification.
create table if not exists investor_private.match_runs (
 id uuid primary key default gen_random_uuid(),
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 model_version text not null,
 input_fingerprint text not null,
 payload jsonb not null,
 created_at timestamptz not null default clock_timestamp()
);
create index if not exists match_runs_assessment_time on investor_private.match_runs(assessment_id,created_at desc,id desc);
alter table investor_private.match_runs enable row level security;
revoke all on investor_private.match_runs from public,anon,authenticated;
grant all on investor_private.match_runs to service_role;

alter table public.investment_context
 add column if not exists horizon_months integer check(horizon_months between 0 and 1200),
 add column if not exists principal_required text check(principal_required in ('yes','no','unsure')),
 add column if not exists investment_share text check(investment_share in ('under_10','10_25','25_50','over_50','unsure'));
alter table public.investment_context drop constraint if exists investment_context_goal_check;
alter table public.investment_context add constraint investment_context_goal_check check(goal in ('growth','retirement','house_purchase','education','income','wealth_preservation','preservation','major_purchase','other','emergency_reserve'));

create or replace function investor_private.match_input_fingerprint(p_assessment_id uuid)
returns text language sql stable set search_path='' as $$
 select md5(jsonb_build_object(
 'dna',(select to_jsonb(r) from public.results r where r.assessment_id=p_assessment_id order by r.created_at desc,r.id desc limit 1),
 'context',(select to_jsonb(c) from public.investment_context c where c.assessment_id=p_assessment_id),
 'answers',(select jsonb_agg(jsonb_build_array(a.question_id,a.answer_value) order by a.question_id) from public.answers a where a.assessment_id=p_assessment_id))::text);
$$;

create or replace function investor_private.match_constraints(p_assessment_id uuid)
returns jsonb language plpgsql stable set search_path='' as $$
declare r public.results; c public.investment_context; v_version text; v_loss numeric; v_reserve numeric; v_months int; v_codes jsonb:='[]'; v_reasons jsonb:='[]'; v_ceiling numeric; v_complete boolean;
begin
 select * into r from public.results where assessment_id=p_assessment_id order by created_at desc,id desc limit 1;
 if r.id is null or r.risk_tolerance is null or r.risk_capacity is null then raise exception 'dna_result_not_found'; end if;
 select questionnaire_version into v_version from public.assessments where id=p_assessment_id;
 select * into c from public.investment_context where assessment_id=p_assessment_id;
 select min((q.scoring->>(a.answer_value->>'value'))::numeric) into v_loss
 from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_version
 where a.assessment_id=p_assessment_id and q.construct='loss_impact' and q.scoring ? (a.answer_value->>'value');
 select min((q.scoring->>(a.answer_value->>'value'))::numeric) into v_reserve
 from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_version
 where a.assessment_id=p_assessment_id and q.construct='emergency_reserve' and q.scoring ? (a.answer_value->>'value');
 if v_loss is null or v_reserve is null then
  v_codes:=v_codes||'"financial_answers_missing"'::jsonb;
  v_reasons:=v_reasons||jsonb_build_array('Confirm your loss impact and emergency savings before using investment matches.');
 end if;
 if v_loss<=33 then
  v_codes:=v_codes||'"essential_spending_at_risk"'::jsonb;
  v_reasons:=v_reasons||jsonb_build_array('You indicated that a loss could disrupt essential spending or an important commitment. Review that need before investing this money.');
 end if;
 if v_reserve=0 then
  v_codes:=v_codes||'"emergency_buffer_short"'::jsonb;
  v_reasons:=v_reasons||jsonb_build_array('Your emergency savings cover less than one month. Keep essential reserves separate before comparing investments for this money.');
 end if;
 v_months:=coalesce(c.horizon_months,case c.time_horizon when 'under_2' then 0 when 'lt_1y' then 0 when '1_3y' then 12 when '2_5' then 24 when '3_5y' then 36 when '5_10' then 60 when '5_10y' then 60 when '10_plus' then 120 when 'gt_10y' then 120 else null end);
 v_complete:=c.id is not null and v_months is not null and c.principal_required is not null and c.goal is not null and c.liquidity_need is not null;
 if c.goal='emergency_reserve' or c.principal_required in ('yes','unsure') then
  v_codes:=v_codes||'"principal_protection_needed"'::jsonb;
  v_reasons:=v_reasons||jsonb_build_array('This money may need to be available without a loss. The current ETF collection does not establish that protection.');
 end if;
 if v_months is not null and v_months<36 then
  v_codes:=v_codes||'"short_horizon"'::jsonb;
  v_reasons:=v_reasons||jsonb_build_array('Your withdrawal may be within three years. The current collection lacks verified cash-like or capital-protected options for that need; bond ETFs can also lose value.');
 end if;
 v_ceiling:=greatest(0,least(100,r.risk_tolerance,r.risk_capacity,
   case when v_months is null then 100 when v_months<36 then 0 when v_months<60 then 40 when v_months<120 then 70 else 100 end));
 return jsonb_build_object('risk_tolerance',r.risk_tolerance,'risk_capacity',r.risk_capacity,'financial_review_required',jsonb_array_length(v_codes)>0,'codes',v_codes,'reasons',v_reasons,'context_complete',v_complete,'horizon_months',v_months,'equity_ceiling',v_ceiling,'context',case when c.id is null then null else to_jsonb(c) end,'questionnaire_version',v_version,'scoring_version',r.scoring_version);
end;
$$;

create or replace function public.calculate_investment_match_v6(p_assessment_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare d record; g jsonb; v_run uuid:=gen_random_uuid(); v_inputs text; v_rows jsonb:='[]'; v_row jsonb; v_payload jsonb;
 v_codes jsonb; v_watch jsonb; v_strength jsonb; v_eq numeric; v_risk numeric; v_exposure numeric; v_role numeric; v_total numeric; v_demand numeric; v_ceiling numeric; v_fit text; v_elig text; v_tier text; v_complete boolean; v_goal text; v_eligible int:=0;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_assessment_id::text,600));
 g:=investor_private.match_constraints(p_assessment_id); v_inputs:=investor_private.match_input_fingerprint(p_assessment_id);
 v_ceiling:=(g->>'equity_ceiling')::numeric; v_complete:=(g->>'context_complete')::boolean; v_goal:=g#>>'{context,goal}';
 delete from public.investment_match_results where assessment_id=p_assessment_id and model_version='investment-dna-match-v6';
 for d in select * from public.v_investment_dna_v2 order by symbol loop
  v_codes:=g->'codes'; v_watch:=g->'reasons'; v_strength:='[]'; v_eq:=d.equity_pct;
  if d.data_quality_status is distinct from 'verified' or d.intelligence_model_version is distinct from 'intelligence-v1.1'
    or v_eq is null or d.fixed_income_pct is null or abs(v_eq+d.fixed_income_pct-100)>1
    or d.diversification_score is null or d.official_risk_rating is null or d.official_risk_source_url is null
    or d.official_risk_verified_at is null or d.official_risk_verified_at<now()-interval '180 days'
    or d.official_risk_verified_at>now()+interval '1 day' then
   v_codes:=v_codes||'"fund_data_incomplete"'::jsonb;
   v_watch:=v_watch||jsonb_build_array('Current verified fund structure and official risk information are required before assessing compatibility.');
  end if;
  -- No invented complexity score: complex/leveraged instruments remain outside this collection's supported scope.
  if d.complexity_score is null or d.complexity_score>20 then
   v_codes:=v_codes||'"complexity_review"'::jsonb;
   v_watch:=v_watch||jsonb_build_array('This product needs a separate complexity and investment-knowledge review.');
  end if;
  v_demand:=case d.official_risk_rating when 'Low' then 10 when 'Low to Medium' then 35 when 'Medium' then 55 when 'Medium to High' then 80 when 'High' then 95 else null end;
  if v_demand is null then v_codes:=v_codes||'"official_risk_unknown"'::jsonb; end if;
  -- Continuous distances, not the 40/70 archetype bands. Capacity never increases a risk target.
  v_risk:=greatest(0,100-2*greatest(0,v_demand-least((g->>'risk_tolerance')::numeric,(g->>'risk_capacity')::numeric)));
  v_exposure:=greatest(0,100-2*greatest(0,v_eq-v_ceiling));
  -- Objective text does not add points. These are structure-role signals, not forecasts of yield.
  v_role:=case when v_goal='growth' then v_eq when v_goal='retirement' then v_eq*.6+d.fixed_income_pct*.4
    when v_goal in ('income','preservation','wealth_preservation','house_purchase','education','major_purchase') then d.fixed_income_pct else 50 end;
  v_total:=case when v_complete then v_risk*.20+v_exposure*.40+v_role*.25+d.diversification_score*.15
    else v_risk*.30+v_exposure*.55+d.diversification_score*.15 end;
  v_total:=round(greatest(0,least(100,v_total)),2);
  if v_eq>v_ceiling then v_watch:=v_watch||jsonb_build_array('Its equity allocation exceeds the research exposure limit from your risk profile and withdrawal horizon.'); end if;
  if v_risk<70 then v_watch:=v_watch||jsonb_build_array('The official risk category calls for more loss capacity or risk comfort than your profile indicates.'); end if;
  if v_complete and v_role<40 then v_watch:=v_watch||jsonb_build_array('Its asset mix is not closely aligned with the role you selected for this money.'); end if;
  if d.fixed_income_pct>0 then v_watch:=v_watch||jsonb_build_array('Its bond allocation can fall in value as interest rates or credit conditions change; it is not a guarantee of capital.'); end if;
  if d.diversification_score<45 then v_watch:=v_watch||jsonb_build_array('Exposure is concentrated in a limited set of markets or asset classes.'); end if;
  if v_risk>=85 then v_strength:=v_strength||jsonb_build_array('The issuer-disclosed risk category is broadly aligned with your risk profile.'); end if;
  if v_eq<=v_ceiling then v_strength:=v_strength||jsonb_build_array('Its equity allocation is within the research exposure limit for your current inputs.'); end if;
  if d.diversification_score>=75 then v_strength:=v_strength||jsonb_build_array('It provides exposure across several markets or asset classes.'); end if;
  if jsonb_array_length(v_codes)>0 then v_elig:='review_required'; v_fit:='Review needed'; v_tier:='mismatch';
  elsif not v_complete then v_elig:='context_required'; v_fit:='DNA-only comparison'; v_tier:='consider';
  elsif v_eq>v_ceiling or v_risk<60 or v_total<70 or v_role<40 then v_elig:='limited';v_fit:='Outside current fit limits';v_tier:='mismatch';
  else v_elig:='eligible';v_eligible:=v_eligible+1;v_fit:=case when v_total>=85 then 'Closer fit' else 'Possible fit' end;v_tier:=case when v_total>=85 then 'top_match' else 'alternative' end; end if;
  v_row:=jsonb_build_object('run_id',v_run,'model_version','investment-dna-match-v6','investment_id',d.investment_id,'symbol',d.symbol,'name',d.name,
   'match_score',case when jsonb_array_length(v_codes)>0 then null else v_total end,'fit_label',v_fit,'eligibility',v_elig,'recommendation_tier',v_tier,
   'risk_band',d.official_risk_rating,'official_risk_rating',d.official_risk_rating,'strengths',v_strength,'watchouts',v_watch,
   'explanation',jsonb_build_object('fit_label',v_fit,'eligibility',v_elig,'gate_codes',v_codes,'summary',case when jsonb_array_length(v_codes)>0 then 'Resolve the review points before using a compatibility ranking.' when not v_complete then 'Add the goal, withdrawal horizon and capital needs for this money.' else 'Research compatibility, subject to the limits and trade-offs below.' end,
    'strengths',v_strength,'watchouts',v_watch,'scores',jsonb_build_object('official_risk_fit',v_risk,'market_exposure_fit',v_exposure,'goal_role_fit',case when v_complete then v_role else null end,'exposure_breadth',d.diversification_score),
    'investment_dna',to_jsonb(d),'investor_constraints',g));
  insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale,explanation)
   values(p_assessment_id,d.investment_id,'investment-dna-match-v6',case when jsonb_array_length(v_codes)>0 then 0 else v_total end,v_risk,v_exposure,d.official_risk_rating,jsonb_build_object('run_id',v_run,'eligibility',v_elig,'inputs',v_inputs),v_row->'explanation');
  v_rows:=v_rows||jsonb_build_array(v_row);
 end loop;
 select coalesce(jsonb_agg(x order by case x->>'eligibility' when 'eligible' then 0 when 'context_required' then 1 else 2 end,(x->>'match_score')::numeric desc nulls last,x->>'symbol'),'[]') into v_rows from jsonb_array_elements(v_rows)x;
 v_payload:=jsonb_build_object('run_id',v_run,'model_version','investment-dna-match-v6','assessment_id',p_assessment_id,'context_applied',v_complete,'constraints',g,
 'status',case when (g->>'financial_review_required')::boolean then 'review_required' when not v_complete then 'context_required' when v_eligible=0 then 'no_suitable_options' else 'available' end,
 'confidence',case when v_complete then 'research_complete_inputs' else 'incomplete_context' end,'count',jsonb_array_length(v_rows),'universe_count',jsonb_array_length(v_rows),'eligible_count',v_eligible,'results',v_rows,
 'top_matches',(select coalesce(jsonb_agg(x),'[]') from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='top_match'),
 'alternatives',(select coalesce(jsonb_agg(x),'[]') from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='alternative'),
 'consider',(select coalesce(jsonb_agg(x),'[]') from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='consider'),
 'mismatch',(select coalesce(jsonb_agg(x),'[]') from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='mismatch'));
 insert into investor_private.match_runs(id,assessment_id,model_version,input_fingerprint,payload) values(v_run,p_assessment_id,'investment-dna-match-v6',v_inputs,v_payload);
 return v_payload;
end;
$$;
create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns jsonb language sql set search_path='' as $$ select public.calculate_investment_match_v6(p_assessment_id); $$;

create or replace function investor_private.current_match(p_assessment_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare r investor_private.match_runs;begin
 select * into r from investor_private.match_runs where assessment_id=p_assessment_id and model_version='investment-dna-match-v6' order by created_at desc,id desc limit 1;
 if r.id is null or r.input_fingerprint is distinct from investor_private.match_input_fingerprint(p_assessment_id) or r.created_at<now()-interval '1 day' then
  return public.calculate_investment_match_v6(p_assessment_id);
 end if; return r.payload;
end; $$;

create or replace function public.get_investment_recommendations(p_assessment_id uuid,p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.assessments a join public.profiles p on p.id=a.profile_id where a.id=p_assessment_id and p.user_id=auth.uid()) then
  raise exception 'assessment_not_owned' using errcode='42501';
 end if;
 if p_limit<1 or p_limit>25 then raise exception 'invalid_limit'; end if;
 -- The research collection has 16 funds; preserve the complete, consistent run.
 return investor_private.current_match(p_assessment_id);
end; $$;

create or replace function public.generate_portfolio_blueprints(p_assessment_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare v_match jsonb; g jsonb; s record; a jsonb; e numeric; f numeric; breadth numeric; bad int; v_score numeric; v_count int:=0; v_run text;
begin
 v_match:=investor_private.current_match(p_assessment_id);g:=v_match->'constraints';v_run:=v_match->>'run_id';
 delete from public.investment_portfolio_blueprints where assessment_id=p_assessment_id and model_version='portfolio-v2-reference';
 if (g->>'financial_review_required')::boolean or not (g->>'context_complete')::boolean then
  return jsonb_build_object('model_version','portfolio-v2-reference','run_id',v_run,'count',0,'status',v_match->>'status','blueprints','[]'::jsonb);
 end if;
 for s in select * from (values ('stability','Stability reference','[{"symbol":"ZAG","weight_pct":70},{"symbol":"VCNS","weight_pct":30}]'::jsonb),('balanced','Balanced reference','[{"symbol":"VBAL","weight_pct":60},{"symbol":"ZAG","weight_pct":40}]'::jsonb),('growth','Growth reference','[{"symbol":"VGRO","weight_pct":80},{"symbol":"ZAG","weight_pct":20}]'::jsonb))v(kind,title,allocations) loop
  -- Evaluate the held exposures from the SAME fund snapshot used by Match.
  select sum((x->>'weight_pct')::numeric*(m#>>'{explanation,investment_dna,equity_pct}')::numeric/100),
   sum((x->>'weight_pct')::numeric*(m#>>'{explanation,investment_dna,fixed_income_pct}')::numeric/100),
   sum((x->>'weight_pct')::numeric*(m#>>'{explanation,investment_dna,diversification_score}')::numeric/100),
   count(*) filter(where m is null or m->>'eligibility'='review_required')
  into e,f,breadth,bad from jsonb_array_elements(s.allocations)x left join jsonb_array_elements(v_match->'results')m on m->>'symbol'=x->>'symbol';
  if bad>0 or e is null or f is null or abs(e+f-100)>.01 or e>(g->>'equity_ceiling')::numeric then continue; end if;
  -- Scope is transparent reference mixes, not an optimizer or a buy recommendation.
  v_score:=case when g#>>'{context,goal}'='growth' then e when g#>>'{context,goal}'='retirement' then e*.6+f*.4 else f end;
  if v_score<40 then continue;end if;
  insert into public.investment_portfolio_blueprints(assessment_id,model_version,blueprint_type,title,summary,target_equity_pct,target_fixed_income_pct,diversification_score,context_fit_score,overall_fit_score,allocations,rationale,disclaimer)
   values(p_assessment_id,'portfolio-v2-reference',s.kind,s.title,'A reference mix with calculated underlying equity and bond exposure; not a personalized allocation.',round(e,2),round(f,2),round(breadth,2),round(v_score,2),null,s.allocations,
   jsonb_build_object('run_id',v_run,'equity_ceiling',g->'equity_ceiling','actual_equity_pct',e,'actual_fixed_income_pct',f,'construction','fixed_reference_lookthrough','context_role_signal',v_score),
   'Research reference only. Bond and equity values can fall; this is not a recommendation or an optimized portfolio.');v_count:=v_count+1;
 end loop;
 return jsonb_build_object('model_version','portfolio-v2-reference','run_id',v_run,'count',v_count,'status',case when v_count=0 then 'no_suitable_options' else 'reference_only' end,'blueprints',(select coalesce(jsonb_agg(to_jsonb(p) order by p.target_equity_pct),'[]') from public.investment_portfolio_blueprints p where assessment_id=p_assessment_id and model_version='portfolio-v2-reference'));
end; $$;

create or replace function investor_private.investment_fit(p_investment_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a uuid; m jsonb; f jsonb;begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501';end if;
 select ip.latest_assessment_id into a from public.investor_profiles ip join public.profiles p on p.id=ip.profile_id where p.user_id=auth.uid() limit 1;
 if a is null then return jsonb_build_object('status','no_dna');end if;
 if not exists(select 1 from public.assessments aa join public.profiles p on p.id=aa.profile_id where aa.id=a and p.user_id=auth.uid()) then raise exception 'assessment_not_owned' using errcode='42501';end if;
 m:=investor_private.current_match(a);
 select x into f from jsonb_array_elements(m->'results')x where x->>'investment_id'=p_investment_id::text;
 return jsonb_build_object('status',case when f is null then 'unavailable' else 'available' end,'assessment_id',a,'run_id',m->'run_id','fit',f);
end; $$;
create or replace function public.app_investment_fit(p_investment_id uuid)
returns jsonb language sql set search_path='' as $$ select investor_private.investment_fit(p_investment_id); $$;

-- Numeric routines have no browser entry point. Definer wrappers above verify ownership.
revoke all on function investor_private.match_input_fingerprint(uuid),investor_private.match_constraints(uuid),investor_private.current_match(uuid),public.calculate_investment_match_v6(uuid),public.calculate_investment_match(uuid),public.generate_portfolio_blueprints(uuid) from public,anon,authenticated;
grant execute on function investor_private.match_input_fingerprint(uuid),investor_private.match_constraints(uuid),investor_private.current_match(uuid),public.calculate_investment_match_v6(uuid),public.calculate_investment_match(uuid),public.generate_portfolio_blueprints(uuid) to service_role;
revoke all on function public.get_investment_recommendations(uuid,integer),investor_private.investment_fit(uuid),public.app_investment_fit(uuid) from public,anon;
grant execute on function public.get_investment_recommendations(uuid,integer),investor_private.investment_fit(uuid),public.app_investment_fit(uuid) to authenticated,service_role;
