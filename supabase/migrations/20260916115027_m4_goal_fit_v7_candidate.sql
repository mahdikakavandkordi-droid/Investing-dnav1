-- M4 candidate: goal-aware Match v7.
--
-- v6 remains the canonical runtime until the candidate passes side-by-side
-- regression and stress comparison. This migration adds a versioned Goal Fit
-- model plus a non-browser-callable v7 candidate engine. Safety gates,
-- exposure ceilings and verified-data requirements remain unchanged.

create or replace function investor_private.goal_role_fit_v7(
  p_goal text,
  p_horizon_months integer,
  p_growth numeric,
  p_income numeric,
  p_stability numeric,
  p_liquidity numeric
) returns jsonb
language plpgsql
stable
set search_path=''
as $$
declare
  v_score numeric;
  v_components jsonb := '{}'::jsonb;
  v_summary text;
begin
  if p_goal is null then
    return jsonb_build_object('model_version','goal-fit-v1','score',null,'components','{}'::jsonb,'summary','Investment goal is required before goal-role fit can be scored.');
  end if;
  if p_growth is null or p_income is null or p_stability is null or p_liquidity is null then
    return jsonb_build_object('model_version','goal-fit-v1','score',null,'components','{}'::jsonb,'summary','Verified Growth, Income, Stability and Liquidity signals are required for goal-role fit.');
  end if;
  case p_goal
    when 'growth' then
      v_score := p_growth; v_components := jsonb_build_object('growth',1.00);
      v_summary := 'Growth prioritizes long-term growth participation; risk and horizon limits remain separate hard constraints.';
    when 'retirement' then
      if coalesce(p_horizon_months,0) >= 120 then v_score := .55*p_growth + .25*p_stability + .20*p_income; v_components := jsonb_build_object('growth',.55,'stability',.25,'income',.20);
      elsif coalesce(p_horizon_months,0) >= 60 then v_score := .40*p_growth + .35*p_stability + .25*p_income; v_components := jsonb_build_object('growth',.40,'stability',.35,'income',.25);
      else v_score := .25*p_growth + .45*p_stability + .30*p_income; v_components := jsonb_build_object('growth',.25,'stability',.45,'income',.30); end if;
      v_summary := 'Retirement balances growth, stability and income, with stability receiving more weight as the withdrawal horizon shortens.';
    when 'income' then
      v_score := .70*p_income + .30*p_stability; v_components := jsonb_build_object('income',.70,'stability',.30);
      v_summary := 'Income prioritizes the investment income role while retaining a stability component; it is not a forecast of distributions or yield.';
    when 'preservation', 'wealth_preservation' then
      v_score := .80*p_stability + .20*p_income; v_components := jsonb_build_object('stability',.80,'income',.20);
      v_summary := 'Wealth preservation prioritizes structural stability and secondarily income; this does not imply contractual capital protection.';
    when 'education' then
      if coalesce(p_horizon_months,0) >= 120 then v_score := .60*p_growth + .30*p_stability + .10*p_liquidity; v_components := jsonb_build_object('growth',.60,'stability',.30,'liquidity',.10);
      elsif coalesce(p_horizon_months,0) >= 60 then v_score := .45*p_growth + .45*p_stability + .10*p_liquidity; v_components := jsonb_build_object('growth',.45,'stability',.45,'liquidity',.10);
      else v_score := .20*p_growth + .65*p_stability + .15*p_liquidity; v_components := jsonb_build_object('growth',.20,'stability',.65,'liquidity',.15); end if;
      v_summary := 'Education uses a horizon-sensitive blend: growth matters more when the goal is distant and stability matters more as use of the money approaches.';
    when 'house_purchase' then
      if coalesce(p_horizon_months,0) >= 120 then v_score := .45*p_growth + .40*p_stability + .15*p_liquidity; v_components := jsonb_build_object('growth',.45,'stability',.40,'liquidity',.15);
      elsif coalesce(p_horizon_months,0) >= 60 then v_score := .25*p_growth + .60*p_stability + .15*p_liquidity; v_components := jsonb_build_object('growth',.25,'stability',.60,'liquidity',.15);
      else v_score := .10*p_growth + .70*p_stability + .20*p_liquidity; v_components := jsonb_build_object('growth',.10,'stability',.70,'liquidity',.20); end if;
      v_summary := 'House purchase becomes increasingly stability- and liquidity-oriented as the purchase horizon approaches.';
    when 'major_purchase' then
      if coalesce(p_horizon_months,0) >= 120 then v_score := .50*p_growth + .35*p_stability + .15*p_liquidity; v_components := jsonb_build_object('growth',.50,'stability',.35,'liquidity',.15);
      elsif coalesce(p_horizon_months,0) >= 60 then v_score := .30*p_growth + .55*p_stability + .15*p_liquidity; v_components := jsonb_build_object('growth',.30,'stability',.55,'liquidity',.15);
      else v_score := .15*p_growth + .65*p_stability + .20*p_liquidity; v_components := jsonb_build_object('growth',.15,'stability',.65,'liquidity',.20); end if;
      v_summary := 'Major purchase uses a horizon-sensitive balance of growth, stability and liquidity without treating the purchase goal as guaranteed capital.';
    else
      v_score := .50*p_growth + .50*p_stability; v_components := jsonb_build_object('growth',.50,'stability',.50);
      v_summary := 'Unrecognized goals use a neutral growth/stability research blend and should be reviewed before production use.';
  end case;
  return jsonb_build_object('model_version','goal-fit-v1','score',round(greatest(0,least(100,v_score)),2),'components',v_components,'summary',v_summary);
end;
$$;
revoke all on function investor_private.goal_role_fit_v7(text,integer,numeric,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function investor_private.goal_role_fit_v7(text,integer,numeric,numeric,numeric,numeric) to service_role;

create or replace function public.calculate_investment_match_v7(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare
  d record; g jsonb; v_goal_fit jsonb; v_run uuid := gen_random_uuid(); v_inputs text; v_rows jsonb := '[]'::jsonb; v_row jsonb; v_payload jsonb;
  v_codes jsonb; v_watch jsonb; v_strength jsonb; v_eq numeric; v_risk numeric; v_exposure numeric; v_role numeric; v_total numeric; v_demand numeric; v_ceiling numeric;
  v_fit text; v_elig text; v_tier text; v_complete boolean; v_goal text; v_horizon integer; v_eligible integer := 0;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_assessment_id::text,700));
  g := investor_private.match_constraints(p_assessment_id); v_inputs := investor_private.match_input_fingerprint(p_assessment_id);
  v_ceiling := (g->>'equity_ceiling')::numeric; v_complete := (g->>'context_complete')::boolean; v_goal := g#>>'{context,goal}'; v_horizon := nullif(g->>'horizon_months','')::integer;
  delete from public.investment_match_results where assessment_id=p_assessment_id and model_version='investment-dna-match-v7';
  for d in select * from public.v_investment_dna_v2 order by symbol loop
    v_codes := coalesce(g->'codes','[]'::jsonb); v_watch := coalesce(g->'reasons','[]'::jsonb); v_strength := '[]'::jsonb; v_eq := d.equity_pct;
    if d.data_quality_status is distinct from 'verified' or d.intelligence_model_version is distinct from 'intelligence-v1.1' or v_eq is null or d.fixed_income_pct is null or abs(v_eq+d.fixed_income_pct-100)>1 or d.diversification_score is null or d.official_risk_rating is null or d.official_risk_source_url is null or d.official_risk_verified_at is null or d.official_risk_verified_at<now()-interval '180 days' or d.official_risk_verified_at>now()+interval '1 day' then
      v_codes := v_codes || jsonb_build_array('fund_data_incomplete'); v_watch := v_watch || jsonb_build_array('Current verified fund structure and official risk information are required before assessing compatibility.');
    end if;
    if d.complexity_score is null or d.complexity_score>20 then v_codes := v_codes || jsonb_build_array('complexity_review'); v_watch := v_watch || jsonb_build_array('This product needs a separate complexity and investment-knowledge review.'); end if;
    v_demand := case d.official_risk_rating when 'Low' then 10 when 'Low to Medium' then 35 when 'Medium' then 55 when 'Medium to High' then 80 when 'High' then 95 else null end;
    if v_demand is null then v_codes := v_codes || jsonb_build_array('official_risk_unknown'); end if;
    v_risk := greatest(0,100-2*greatest(0,v_demand-least((g->>'risk_tolerance')::numeric,(g->>'risk_capacity')::numeric)));
    v_exposure := greatest(0,100-2*greatest(0,v_eq-v_ceiling));
    v_goal_fit := investor_private.goal_role_fit_v7(v_goal,v_horizon,d.growth_score,d.income_score,d.stability_score,d.liquidity_score);
    v_role := nullif(v_goal_fit->>'score','')::numeric;
    if v_complete and v_role is null then v_codes := v_codes || jsonb_build_array('goal_fit_unavailable'); v_watch := v_watch || jsonb_build_array('Verified goal-role signals are incomplete, so this investment cannot receive a personalized goal fit.'); end if;
    v_total := case when v_complete then v_risk*.20 + v_exposure*.40 + coalesce(v_role,0)*.25 + d.diversification_score*.15 else v_risk*.30 + v_exposure*.55 + d.diversification_score*.15 end;
    v_total := round(greatest(0,least(100,v_total)),2);
    if v_eq>v_ceiling then v_watch := v_watch || jsonb_build_array('Its equity allocation exceeds the research exposure limit from your risk profile and withdrawal horizon.'); end if;
    if v_risk<70 then v_watch := v_watch || jsonb_build_array('The official risk category calls for more loss capacity or risk comfort than your profile indicates.'); end if;
    if v_complete and v_role<40 then v_watch := v_watch || jsonb_build_array('Its Investment DNA is not closely aligned with the role and horizon you selected for this money.'); end if;
    if d.fixed_income_pct>0 then v_watch := v_watch || jsonb_build_array('Its bond allocation can fall in value as interest rates or credit conditions change; it is not a guarantee of capital.'); end if;
    if d.diversification_score<45 then v_watch := v_watch || jsonb_build_array('Exposure is concentrated in a limited set of markets or asset classes.'); end if;
    if v_risk>=85 then v_strength := v_strength || jsonb_build_array('The issuer-disclosed risk category is broadly aligned with your risk profile.'); end if;
    if v_eq<=v_ceiling then v_strength := v_strength || jsonb_build_array('Its equity allocation is within the research exposure limit for your current inputs.'); end if;
    if v_complete and v_role>=70 then v_strength := v_strength || jsonb_build_array('Its Investment DNA is strongly aligned with the role and horizon selected for this money.'); end if;
    if d.diversification_score>=75 then v_strength := v_strength || jsonb_build_array('It provides exposure across several markets or asset classes.'); end if;
    if jsonb_array_length(v_codes)>0 then v_elig := 'review_required'; v_fit := 'Review needed'; v_tier := 'mismatch';
    elsif not v_complete then v_elig := 'context_required'; v_fit := 'DNA-only comparison'; v_tier := 'consider';
    elsif v_eq>v_ceiling or v_risk<60 or v_total<70 or v_role<40 then v_elig := 'limited'; v_fit := 'Outside current fit limits'; v_tier := 'mismatch';
    else v_elig := 'eligible'; v_eligible := v_eligible+1; v_fit := case when v_total>=85 then 'Closer fit' else 'Possible fit' end; v_tier := case when v_total>=85 then 'top_match' else 'alternative' end; end if;
    v_row := jsonb_build_object('run_id',v_run,'model_version','investment-dna-match-v7','investment_id',d.investment_id,'symbol',d.symbol,'name',d.name,'match_score',case when jsonb_array_length(v_codes)>0 then null else v_total end,'fit_label',v_fit,'eligibility',v_elig,'recommendation_tier',v_tier,'risk_band',d.official_risk_rating,'official_risk_rating',d.official_risk_rating,'strengths',v_strength,'watchouts',v_watch,'explanation',jsonb_build_object('fit_label',v_fit,'eligibility',v_elig,'gate_codes',v_codes,'summary',case when jsonb_array_length(v_codes)>0 then 'Resolve the review points before using a compatibility ranking.' when not v_complete then 'Add the goal, withdrawal horizon and capital needs for this money.' else 'Research compatibility using your Investor DNA, money context and goal-specific Investment DNA role fit.' end,'strengths',v_strength,'watchouts',v_watch,'scores',jsonb_build_object('official_risk_fit',v_risk,'market_exposure_fit',v_exposure,'goal_role_fit',case when v_complete then v_role else null end,'exposure_breadth',d.diversification_score),'goal_fit',case when v_complete then v_goal_fit else null end,'investment_dna',to_jsonb(d),'investor_constraints',g));
    insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale,explanation) values(p_assessment_id,d.investment_id,'investment-dna-match-v7',case when jsonb_array_length(v_codes)>0 then null else v_total end,v_risk,v_exposure,d.official_risk_rating,jsonb_build_object('run_id',v_run,'eligibility',v_elig,'inputs',v_inputs,'goal_model','goal-fit-v1'),v_row->'explanation');
    v_rows := v_rows || jsonb_build_array(v_row);
  end loop;
  select coalesce(jsonb_agg(x order by case x->>'eligibility' when 'eligible' then 0 when 'context_required' then 1 else 2 end,(x->>'match_score')::numeric desc nulls last,x->>'symbol'),'[]'::jsonb) into v_rows from jsonb_array_elements(v_rows) x;
  v_payload := jsonb_build_object('run_id',v_run,'model_version','investment-dna-match-v7','goal_model_version','goal-fit-v1','assessment_id',p_assessment_id,'context_applied',v_complete,'constraints',g,'status',case when (g->>'financial_review_required')::boolean then 'review_required' when not v_complete then 'context_required' when v_eligible=0 then 'no_suitable_options' else 'available' end,'confidence',case when v_complete then 'research_complete_inputs' else 'incomplete_context' end,'count',jsonb_array_length(v_rows),'universe_count',jsonb_array_length(v_rows),'eligible_count',v_eligible,'results',v_rows,'top_matches',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='top_match'),'alternatives',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='alternative'),'consider',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='consider'),'mismatch',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(v_rows)x where x->>'recommendation_tier'='mismatch'));
  insert into investor_private.match_runs(id,assessment_id,model_version,input_fingerprint,payload) values(v_run,p_assessment_id,'investment-dna-match-v7',v_inputs,v_payload);
  return v_payload;
end;
$$;
revoke all on function public.calculate_investment_match_v7(uuid) from public,anon,authenticated;
grant execute on function public.calculate_investment_match_v7(uuid) to service_role;

create or replace function investor_private.current_match_v7_candidate(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare r investor_private.match_runs;
begin
  select * into r from investor_private.match_runs where assessment_id=p_assessment_id and model_version='investment-dna-match-v7' order by created_at desc,id desc limit 1;
  if r.id is null or r.input_fingerprint is distinct from investor_private.match_input_fingerprint(p_assessment_id) or r.created_at<now()-interval '1 day' then
    perform public.calculate_investment_match_v7(p_assessment_id);
    select * into r from investor_private.match_runs where assessment_id=p_assessment_id and model_version='investment-dna-match-v7' order by created_at desc,id desc limit 1;
  end if;
  if r.id is null then raise exception 'match_v7_candidate_run_not_created'; end if;
  return r.payload;
end;
$$;
revoke all on function investor_private.current_match_v7_candidate(uuid) from public,anon,authenticated;
grant execute on function investor_private.current_match_v7_candidate(uuid) to service_role;