create or replace function public.calculate_investment_match_v4(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path to 'public','extensions'
as $function$
declare
  r record; c record; d record;
  v_rt numeric; v_rc numeric; v_exp numeric:=50; v_rt_level text; v_rc_level text;
  v_horizon int:=null; v_goal text:=null; v_liquidity text:=null;
  v_pref_fit numeric; v_cap_guard numeric; v_risk_fit numeric; v_exposure_pref numeric; v_exposure_cap numeric; v_exposure_fit numeric; v_goal_fit numeric; v_horizon_fit numeric; v_access_fit numeric; v_div_fit numeric; v_complexity_fit numeric; v_total numeric;
  v_growth numeric; v_income numeric; v_stability numeric; v_liq numeric; v_div numeric; v_complexity numeric; v_min_horizon int; v_eq numeric;
  v_official text; v_strengths jsonb; v_watchouts jsonb; v_fit text; v_json jsonb:='[]'::jsonb; v_count int:=0;
  v_model text:='investment-dna-match-v4.2';
begin
  select * into r from public.results where assessment_id=p_assessment_id and risk_tolerance is not null and risk_capacity is not null order by created_at desc limit 1;
  if not found then raise exception 'dna_result_not_found'; end if;
  v_rt:=r.risk_tolerance; v_rc:=r.risk_capacity;
  v_rt_level:=case when v_rt<40 then 'low' when v_rt<70 then 'moderate' else 'high' end;
  v_rc_level:=case when v_rc<40 then 'low' when v_rc<70 then 'moderate' else 'high' end;
  if r.experience_profile ? 'overall_score' then v_exp:=coalesce((r.experience_profile->>'overall_score')::numeric,50); end if;
  select * into c from public.investment_context where assessment_id=p_assessment_id order by updated_at desc limit 1;
  if c.id is not null then
    v_goal:=c.goal; v_liquidity:=c.liquidity_need;
    v_horizon:=case when c.time_horizon in ('under_2','lt_1y') then 12 when c.time_horizon in ('1_3y','1_3') then 30 when c.time_horizon in ('2_5','3_5y','3_5') then 48 when c.time_horizon in ('5_10','5_10y') then 84 when c.time_horizon in ('10_plus','gt_10y') then 144 else null end;
  end if;
  delete from public.investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
  for d in select * from public.v_investment_dna_v1 where data_quality_status='verified' and official_risk_rating is not null order by symbol loop
    v_official:=d.official_risk_rating; v_eq:=coalesce(d.equity_pct,50);
    v_growth:=coalesce(d.growth_score,50); v_income:=coalesce(d.income_score,50); v_stability:=coalesce(d.stability_score,50); v_liq:=coalesce(d.liquidity_score,70); v_div:=coalesce(d.diversification_score,50); v_complexity:=coalesce(d.complexity_score,50); v_min_horizon:=coalesce(d.minimum_horizon_months,36);
    v_pref_fit:=case v_rt_level when 'low' then case v_official when 'Low' then 100 when 'Low to Medium' then 90 when 'Medium' then 55 when 'Medium to High' then 25 else 5 end when 'moderate' then case v_official when 'Low' then 75 when 'Low to Medium' then 95 when 'Medium' then 95 when 'Medium to High' then 65 else 30 end else case v_official when 'Low' then 55 when 'Low to Medium' then 75 when 'Medium' then 95 when 'Medium to High' then 95 else 85 end end;
    v_cap_guard:=case v_rc_level when 'low' then case v_official when 'Low' then 100 when 'Low to Medium' then 90 when 'Medium' then 60 when 'Medium to High' then 25 else 5 end when 'moderate' then case v_official when 'Low' then 100 when 'Low to Medium' then 100 when 'Medium' then 95 when 'Medium to High' then 70 else 35 end else case v_official when 'High' then 90 else 100 end end;
    v_risk_fit:=v_pref_fit*.80+v_cap_guard*.20;
    v_exposure_pref:=case v_rt_level when 'low' then greatest(0,100-greatest(0,v_eq-40)*1.50) when 'moderate' then greatest(0,100-greatest(0,v_eq-60)*.75) else 100 end;
    v_exposure_cap:=case v_rc_level when 'low' then greatest(0,100-greatest(0,v_eq-40)*1.50) when 'moderate' then greatest(0,100-greatest(0,v_eq-70)*1.00) else 100 end;
    v_exposure_fit:=v_exposure_pref*.70+v_exposure_cap*.30;
    if c.id is null or v_goal is null then v_goal_fit:=70; else v_goal_fit:=case when v_goal='growth' then v_growth when v_goal='retirement' then v_growth*.65+v_stability*.35 when v_goal='income' then v_income when v_goal in ('preservation','wealth_preservation','emergency_reserve') then v_stability when v_goal in ('house_purchase','education','major_purchase') then v_stability*.80+(100-v_eq)*.20 else 70 end; end if;
    if v_horizon is null then v_horizon_fit:=70; elsif v_horizon>=v_min_horizon then v_horizon_fit:=100; else v_horizon_fit:=greatest(0,100-((v_min_horizon-v_horizon)::numeric/greatest(v_min_horizon,1))*150); end if;
    if c.id is null or v_liquidity is null then v_access_fit:=70; elsif v_liquidity in ('very_high','high') then v_access_fit:=v_stability*.80+v_liq*.20; elsif v_liquidity='medium' then v_access_fit:=v_stability*.50+v_liq*.50; else v_access_fit:=95; end if;
    v_div_fit:=greatest(0,least(100,v_div)); v_complexity_fit:=greatest(0,least(100,100-greatest(0,v_complexity-(v_exp+20))*1.50));
    v_total:=v_risk_fit*.30+v_exposure_fit*.15+v_goal_fit*.20+v_horizon_fit*.15+v_access_fit*.10+v_div_fit*.05+v_complexity_fit*.05;
    if v_horizon is not null and v_min_horizon>0 and v_horizon < v_min_horizon*.60 then v_total:=least(v_total,54); end if;
    if v_cap_guard<50 then v_total:=least(v_total,54); elsif v_cap_guard<70 then v_total:=least(v_total,69); end if;
    if v_exposure_cap<50 then v_total:=least(v_total,54); elsif v_exposure_cap<70 then v_total:=least(v_total,69); end if;
    if v_rt_level='low' and v_eq>=90 then v_total:=least(v_total,54); elsif v_rt_level='low' and v_eq>=75 then v_total:=least(v_total,69); elsif v_rt_level='low' and v_eq>=55 then v_total:=least(v_total,84); end if;
    if c.id is null then v_total:=least(v_total,79); end if;
    v_total:=greatest(0,least(100,v_total));
    v_strengths:='[]'::jsonb; v_watchouts:='[]'::jsonb;
    if v_risk_fit>=85 then v_strengths:=v_strengths||jsonb_build_array('The issuer’s official risk rating is broadly compatible with your risk profile.'); end if;
    if v_exposure_fit>=90 and v_eq>=60 then v_strengths:=v_strengths||jsonb_build_array('Its level of equity exposure is broadly compatible with how much market movement you indicated you can live with.'); end if;
    if c.id is not null and v_goal_fit>=80 then v_strengths:=v_strengths||jsonb_build_array('Its growth, income or stability role lines up well with the goal you selected.'); end if;
    if v_horizon_fit>=90 then v_strengths:=v_strengths||jsonb_build_array('Your time horizon gives this investment enough room.'); end if;
    if v_pref_fit<65 then v_watchouts:=v_watchouts||jsonb_build_array('The issuer’s official risk rating may not line up closely with your comfort with investment risk.'); end if;
    if v_exposure_fit<70 or (v_rt_level='low' and v_eq>=75) then v_watchouts:=v_watchouts||jsonb_build_array('Its equity exposure may create more market movement than your answers suggest you would be comfortable with.'); end if;
    if v_cap_guard<70 or v_exposure_cap<70 then v_watchouts:=v_watchouts||jsonb_build_array('The combination of its official risk category and market exposure may be more than your current financial capacity can comfortably absorb.'); end if;
    if v_horizon_fit<70 then v_watchouts:=v_watchouts||jsonb_build_array('Your stated time horizon may be short for this investment.'); end if;
    if v_access_fit<60 then v_watchouts:=v_watchouts||jsonb_build_array('Your need for access to this money may conflict with this investment’s stability profile.'); end if;
    if v_complexity_fit<70 then v_watchouts:=v_watchouts||jsonb_build_array('This product may be more complex than your current investing experience suggests.'); end if;
    v_fit:=case when v_total>=85 then 'Strong fit' when v_total>=70 then 'Good fit' when v_total>=55 then 'Mixed fit' else 'Lower fit' end;
    insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale,explanation)
    values(p_assessment_id,d.investment_id,v_model,round(v_total,2),round(v_pref_fit,2),round(v_cap_guard,2),v_official,jsonb_build_object('engine',v_model,'signal_type','official-risk-plus-investment-dna-compatibility','not_investment_advice',true,'weights',jsonb_build_object('official_risk_compatibility',30,'market_exposure_fit',15,'goal_role',20,'horizon',15,'access_stability',10,'diversification',5,'complexity',5),'risk_method','issuer risk rating kept separate from proprietary market-exposure signals; capacity and low-tolerance exposure are guardrails'),jsonb_build_object('fit_label',v_fit,'summary',case when v_total>=85 then 'Strong overall compatibility with your Investor DNA and current investment context.' when v_total>=70 then 'Good overall compatibility, with some trade-offs still worth reviewing.' when v_total>=55 then 'A mixed fit: some characteristics align, while others need a closer look.' else 'Lower compatibility with your current Investor DNA or investment context.' end,'strengths',v_strengths,'watchouts',v_watchouts,'scores',jsonb_build_object('overall',round(v_total,2),'official_risk_fit',round(v_risk_fit,2),'risk_preference_compatibility',round(v_pref_fit,2),'capacity_guard',round(v_cap_guard,2),'market_exposure_fit',round(v_exposure_fit,2),'market_exposure_capacity_guard',round(v_exposure_cap,2),'goal_fit',round(v_goal_fit,2),'horizon_fit',round(v_horizon_fit,2),'access_fit',round(v_access_fit,2),'diversification_fit',round(v_div_fit,2),'complexity_fit',round(v_complexity_fit,2)),'investor',jsonb_build_object('risk_tolerance_level',v_rt_level,'risk_capacity_level',v_rc_level,'experience',round(v_exp,2),'goal',v_goal,'horizon_months',v_horizon,'liquidity_need',v_liquidity),'investment_dna',jsonb_build_object('official_risk_rating',v_official,'official_risk_source',d.official_risk_source_title,'official_risk_source_date',d.official_risk_source_date,'equity_pct',v_eq,'growth',v_growth,'income',v_income,'stability',v_stability,'diversification',v_div,'complexity',v_complexity,'minimum_horizon_months',v_min_horizon),'disclaimer','Compatibility signal for discovery and comparison only; not investment advice.'));
    v_json:=v_json||jsonb_build_array(jsonb_build_object('investment_id',d.investment_id,'symbol',d.symbol,'name',d.name,'match_score',round(v_total,2),'fit_label',v_fit,'official_risk_rating',v_official,'strengths',v_strengths,'watchouts',v_watchouts)); v_count:=v_count+1;
  end loop;
  return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'count',v_count,'context_applied',c.id is not null,'results',(select coalesce(jsonb_agg(x order by (x->>'match_score')::numeric desc),'[]'::jsonb) from jsonb_array_elements(v_json)x));
end;$function$;

create or replace function public.get_investment_recommendations(p_assessment_id uuid,p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
declare v_limit int:=greatest(1,least(coalesce(p_limit,10),25)); v_model text:='investment-dna-match-v4.2'; v_count int; v_top jsonb; v_alt jsonb; v_consider jsonb; v_mismatch jsonb;
begin
 if not exists(select 1 from assessments where id=p_assessment_id) then raise exception 'assessment_not_found'; end if;
 select count(*) into v_count from investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
 if v_count=0 then raise exception 'match_results_not_found'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_top from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='top_match' order by match_rank limit v_limit)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_alt from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='alternative' order by match_rank limit v_limit)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_consider from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='consider' order by match_rank limit v_limit)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_mismatch from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='mismatch' order by match_rank limit v_limit)x;
 return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'universe_count',v_count,'top_matches',v_top,'alternatives',v_alt,'consider',v_consider,'mismatch',v_mismatch,'disclaimer','Compatibility signals use issuer-disclosed risk ratings plus Investment DNA and your stated context; not investment advice.');
end;$function$;