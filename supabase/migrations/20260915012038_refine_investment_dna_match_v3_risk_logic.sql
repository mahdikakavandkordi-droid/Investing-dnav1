create or replace function public.calculate_investment_match_v3(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path to 'public','extensions'
as $$
declare
  r record; c record; d record;
  v_rt numeric; v_rc numeric; v_exp numeric:=50;
  v_horizon int:=null; v_goal text:=null; v_liquidity text:=null;
  v_tol_fit numeric; v_cap_fit numeric; v_risk_fit numeric; v_goal_fit numeric; v_horizon_fit numeric; v_access_fit numeric; v_div_fit numeric; v_complexity_fit numeric; v_total numeric;
  v_risk numeric; v_growth numeric; v_income numeric; v_stability numeric; v_liq numeric; v_div numeric; v_complexity numeric; v_min_horizon int;
  v_strengths jsonb; v_watchouts jsonb; v_fit text; v_json jsonb:='[]'::jsonb; v_count int:=0; v_model text:='investment-dna-match-v3.0';
begin
  select * into r from public.results where assessment_id=p_assessment_id and risk_tolerance is not null and risk_capacity is not null order by created_at desc limit 1;
  if not found then raise exception 'dna_result_not_found'; end if;
  v_rt:=r.risk_tolerance; v_rc:=r.risk_capacity;
  if r.experience_profile ? 'overall_score' then v_exp:=coalesce((r.experience_profile->>'overall_score')::numeric,50); end if;

  select * into c from public.investment_context where assessment_id=p_assessment_id order by updated_at desc limit 1;
  if c.id is not null then
    v_goal:=c.goal; v_liquidity:=c.liquidity_need;
    v_horizon:=case
      when c.time_horizon in ('under_2','lt_1y') then 12
      when c.time_horizon in ('1_3y','1_3') then 30
      when c.time_horizon in ('2_5','3_5y','3_5') then 48
      when c.time_horizon in ('5_10','5_10y') then 84
      when c.time_horizon in ('10_plus','gt_10y') then 144
      else null end;
  end if;

  delete from public.investment_match_results where assessment_id=p_assessment_id and model_version=v_model;

  for d in select * from public.v_investment_dna_v1 where data_quality_status='verified' order by symbol loop
    v_risk:=coalesce(d.risk_score,50); v_growth:=coalesce(d.growth_score,50); v_income:=coalesce(d.income_score,50); v_stability:=coalesce(d.stability_score,50);
    v_liq:=coalesce(d.liquidity_score,70); v_div:=coalesce(d.diversification_score,50); v_complexity:=coalesce(d.complexity_score,50); v_min_horizon:=coalesce(d.minimum_horizon_months,36);

    -- Risk tolerance is a preference alignment signal. Capacity is a guardrail, not a target.
    v_tol_fit:=greatest(0,least(100,100-abs(v_risk-v_rt)*1.10));
    v_cap_fit:=greatest(0,least(100,100-greatest(0,v_risk-v_rc)*2.20));
    v_risk_fit:=v_tol_fit*.75+v_cap_fit*.25;

    if c.id is null or v_goal is null then v_goal_fit:=70;
    else v_goal_fit:=case
      when v_goal='growth' then v_growth
      when v_goal='retirement' then v_growth*.65+v_stability*.35
      when v_goal='income' then v_income
      when v_goal in ('preservation','wealth_preservation','emergency_reserve') then v_stability
      when v_goal in ('house_purchase','education','major_purchase') then v_stability*.70+(100-v_risk)*.30
      else 70 end;
    end if;

    if v_horizon is null then v_horizon_fit:=70;
    elsif v_horizon>=v_min_horizon then v_horizon_fit:=100;
    else v_horizon_fit:=greatest(0,100-((v_min_horizon-v_horizon)::numeric/greatest(v_min_horizon,1))*150); end if;

    if c.id is null or v_liquidity is null then v_access_fit:=70;
    elsif v_liquidity='high' then v_access_fit:=v_stability*.80+v_liq*.20;
    elsif v_liquidity='medium' then v_access_fit:=v_stability*.50+v_liq*.50;
    else v_access_fit:=95; end if;

    v_div_fit:=greatest(0,least(100,v_div));
    v_complexity_fit:=greatest(0,least(100,100-greatest(0,v_complexity-(v_exp+20))*1.50));

    v_total:=v_risk_fit*.45+v_goal_fit*.20+v_horizon_fit*.15+v_access_fit*.10+v_div_fit*.05+v_complexity_fit*.05;
    if v_horizon is not null and v_min_horizon>0 and v_horizon < v_min_horizon*.60 then v_total:=least(v_total,54); end if;
    v_total:=greatest(0,least(100,v_total));

    v_strengths:='[]'::jsonb; v_watchouts:='[]'::jsonb;
    if v_risk_fit>=80 then v_strengths:=v_strengths||jsonb_build_array('Its risk level is broadly compatible with your comfort level and financial guardrails.'); end if;
    if c.id is not null and v_goal_fit>=80 then v_strengths:=v_strengths||jsonb_build_array('Its growth, income or stability profile lines up well with your stated goal.'); end if;
    if v_horizon_fit>=90 then v_strengths:=v_strengths||jsonb_build_array('Your time horizon gives this investment enough room.'); end if;
    if v_div>=80 then v_strengths:=v_strengths||jsonb_build_array('It offers broad diversification within its role.'); end if;

    if v_risk>v_rt+15 then v_watchouts:=v_watchouts||jsonb_build_array('This investment may feel more volatile than your comfort level suggests.'); end if;
    if v_risk>v_rc+15 then v_watchouts:=v_watchouts||jsonb_build_array('Its risk level may be more than your current finances can comfortably absorb.'); end if;
    if v_horizon_fit<70 then v_watchouts:=v_watchouts||jsonb_build_array('Your stated time horizon may be short for this investment.'); end if;
    if v_access_fit<60 then v_watchouts:=v_watchouts||jsonb_build_array('Your need for access to this money may conflict with this investment’s stability profile.'); end if;
    if v_complexity_fit<70 then v_watchouts:=v_watchouts||jsonb_build_array('This product may be more complex than your current investing experience suggests.'); end if;

    v_fit:=case when v_total>=85 then 'Strong fit' when v_total>=70 then 'Good fit' when v_total>=55 then 'Mixed fit' else 'Lower fit' end;

    insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale,explanation)
    values(p_assessment_id,d.investment_id,v_model,round(v_total,2),round(v_tol_fit,2),round(v_cap_fit,2),d.risk_band,
      jsonb_build_object('engine',v_model,'signal_type','investment_dna_compatibility','not_investment_advice',true,'weights',jsonb_build_object('risk',45,'goal',20,'horizon',15,'access',10,'diversification',5,'complexity',5)),
      jsonb_build_object('fit_label',v_fit,
        'summary',case when v_total>=85 then 'Strong overall compatibility with your Investor DNA and current investment context.' when v_total>=70 then 'Good overall compatibility, with some trade-offs still worth reviewing.' when v_total>=55 then 'A mixed fit: some characteristics align, while others need a closer look.' else 'Lower compatibility with your current Investor DNA or investment context.' end,
        'strengths',v_strengths,'watchouts',v_watchouts,
        'scores',jsonb_build_object('overall',round(v_total,2),'risk_fit',round(v_risk_fit,2),'risk_preference_fit',round(v_tol_fit,2),'capacity_guard',round(v_cap_fit,2),'goal_fit',round(v_goal_fit,2),'horizon_fit',round(v_horizon_fit,2),'access_fit',round(v_access_fit,2),'diversification_fit',round(v_div_fit,2),'complexity_fit',round(v_complexity_fit,2)),
        'investor',jsonb_build_object('risk_tolerance',round(v_rt,2),'risk_capacity',round(v_rc,2),'experience',round(v_exp,2),'goal',v_goal,'horizon_months',v_horizon,'liquidity_need',v_liquidity),
        'investment_dna',jsonb_build_object('risk',v_risk,'growth',v_growth,'income',v_income,'stability',v_stability,'diversification',v_div,'complexity',v_complexity,'minimum_horizon_months',v_min_horizon,'equity_pct',d.equity_pct),
        'disclaimer','Compatibility signal for discovery and comparison only; not investment advice.'));

    v_json:=v_json||jsonb_build_array(jsonb_build_object('investment_id',d.investment_id,'symbol',d.symbol,'name',d.name,'match_score',round(v_total,2),'fit_label',v_fit,'strengths',v_strengths,'watchouts',v_watchouts));
    v_count:=v_count+1;
  end loop;

  return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'count',v_count,'context_applied',c.id is not null,'results',(select coalesce(jsonb_agg(x order by (x->>'match_score')::numeric desc),'[]'::jsonb) from jsonb_array_elements(v_json) x));
end;
$$;