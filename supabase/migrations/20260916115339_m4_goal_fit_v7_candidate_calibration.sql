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
    when 'growth' then v_score := p_growth; v_components := jsonb_build_object('growth',1.00); v_summary := 'Growth prioritizes long-term growth participation; risk and horizon limits remain separate hard constraints.';
    when 'retirement' then
      if coalesce(p_horizon_months,0) >= 120 then v_score := .55*p_growth + .25*p_stability + .20*p_income; v_components := jsonb_build_object('growth',.55,'stability',.25,'income',.20);
      elsif coalesce(p_horizon_months,0) >= 60 then v_score := .40*p_growth + .35*p_stability + .25*p_income; v_components := jsonb_build_object('growth',.40,'stability',.35,'income',.25);
      else v_score := .25*p_growth + .45*p_stability + .30*p_income; v_components := jsonb_build_object('growth',.25,'stability',.45,'income',.30); end if;
      v_summary := 'Retirement balances growth, stability and income, with stability receiving more weight as the withdrawal horizon shortens.';
    when 'income' then v_score := .70*p_income + .30*p_stability; v_components := jsonb_build_object('income',.70,'stability',.30); v_summary := 'Income prioritizes the investment income role while retaining a stability component; it is not a forecast of distributions or yield.';
    when 'preservation', 'wealth_preservation' then v_score := .80*p_stability + .20*p_income; v_components := jsonb_build_object('stability',.80,'income',.20); v_summary := 'Wealth preservation prioritizes structural stability and secondarily income; this does not imply contractual capital protection.';
    when 'education' then
      if coalesce(p_horizon_months,0) >= 120 then v_score := .55*p_growth + .35*p_stability + .10*p_liquidity; v_components := jsonb_build_object('growth',.55,'stability',.35,'liquidity',.10);
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
    else v_score := .50*p_growth + .50*p_stability; v_components := jsonb_build_object('growth',.50,'stability',.50); v_summary := 'Unrecognized goals use a neutral growth/stability research blend and should be reviewed before production use.';
  end case;
  return jsonb_build_object('model_version','goal-fit-v1','score',round(greatest(0,least(100,v_score)),2),'components',v_components,'summary',v_summary);
end;
$$;
revoke all on function investor_private.goal_role_fit_v7(text,integer,numeric,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function investor_private.goal_role_fit_v7(text,integer,numeric,numeric,numeric,numeric) to service_role;