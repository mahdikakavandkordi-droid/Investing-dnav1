drop function if exists public.calculate_investment_match(uuid, uuid);
create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  a record;
  r record;
  c record;
  i record;
  v_rt numeric;
  v_rc numeric;
  v_score numeric;
  v_rtfit numeric;
  v_rcfit numeric;
  v_riskfit numeric;
  v_alloc numeric;
  v_vol numeric;
  v_dd numeric;
  v_context numeric;
  v_total numeric;
  v_target_equity numeric;
  v_investment_equity numeric;
  v_risk_score numeric;
  v_model text := 'suitability-v2.1';
  v_count int := 0;
  v_json jsonb := '[]'::jsonb;
begin
  select * into a from public.assessments where id = p_assessment_id;
  if not found then raise exception 'assessment_not_found'; end if;

  select * into r
  from public.results
  where assessment_id = p_assessment_id
    and risk_tolerance is not null
    and risk_capacity is not null
  order by created_at desc
  limit 1;
  if not found then raise exception 'dna_result_not_found'; end if;

  v_rt := r.risk_tolerance;
  v_rc := r.risk_capacity;
  v_target_equity := greatest(0, least(100, v_rt * 0.60 + v_rc * 0.40));

  select * into c from public.investment_context
  where assessment_id = p_assessment_id
  order by updated_at desc limit 1;

  delete from public.investment_match_results
  where assessment_id = p_assessment_id and model_version = v_model;

  for i in select * from public.v_investment_detail where data_quality_status = 'verified' order by symbol loop
    v_risk_score := case lower(coalesce(i.risk_level,''))
      when 'low' then 25
      when 'medium' then 55
      when 'medium to high' then 72
      when 'high' then 90
      else 55 end;

    v_rtfit := greatest(0, 100 - abs(v_rt - v_risk_score) * 1.15);
    v_rcfit := greatest(0, 100 - greatest(0, v_risk_score - v_rc) * 1.75 - greatest(0, v_rc - v_risk_score) * 0.35);
    v_riskfit := v_rtfit * 0.60 + v_rcfit * 0.40;

    v_investment_equity := null;
    if i.profile_target_allocation is not null and i.profile_target_allocation ? 'equity' then
      begin v_investment_equity := (i.profile_target_allocation->>'equity')::numeric; exception when others then v_investment_equity := null; end;
    end if;
    if v_investment_equity is not null then
      v_alloc := greatest(0, 100 - abs(v_investment_equity - v_target_equity) * 1.10);
    else
      v_alloc := 65;
    end if;

    v_vol := case when i.volatility_1y_pct is not null
      then greatest(0, 100 - abs(i.volatility_1y_pct - greatest(4, least(18, v_target_equity * 0.12))) * 4)
      else 50 end;
    v_dd := case when i.max_drawdown_1y_pct is not null
      then greatest(0, 100 - abs(abs(i.max_drawdown_1y_pct) - greatest(8, least(30, v_target_equity * 0.22))) * 2.5)
      else 50 end;

    v_context := 100;
    if c.id is not null then
      if lower(coalesce(c.loss_consequence,'')) like '%high%' or lower(coalesce(c.loss_consequence,'')) like '%critical%' then
        if v_risk_score >= 72 then v_context := v_context - 20; else v_context := v_context - 5; end if;
      end if;
      if lower(coalesce(c.time_horizon,'')) like '%short%' and v_investment_equity is not null and v_investment_equity >= 80 then v_context := v_context - 20; end if;
      if lower(coalesce(c.liquidity_need,'')) like '%high%' and v_investment_equity is not null and v_investment_equity >= 80 then v_context := v_context - 15; end if;
    else
      v_context := 70;
    end if;

    v_total := least(100, greatest(0,
      v_riskfit * 0.55 +
      v_alloc * 0.15 +
      v_vol * 0.10 +
      v_dd * 0.10 +
      v_context * 0.10));

    insert into public.investment_match_results
      (assessment_id, investment_id, model_version, match_score, risk_tolerance_fit, risk_capacity_fit, risk_band, rationale)
    values
      (p_assessment_id, i.id, v_model, round(v_total,2), round(v_rtfit,2), round(v_rcfit,2), i.risk_level,
       jsonb_build_object(
         'engine', v_model,
         'components', jsonb_build_object(
           'risk_fit', round(v_riskfit,2),
           'allocation_fit', round(v_alloc,2),
           'volatility_fit', round(v_vol,2),
           'drawdown_fit', round(v_dd,2),
           'context_fit', round(v_context,2)
         ),
         'target_equity_pct', round(v_target_equity,2),
         'investment_equity_pct', v_investment_equity,
         'signal_type', 'compatibility_signal',
         'not_investment_advice', true
       ));

    v_json := v_json || jsonb_build_array(jsonb_build_object(
      'investment_id', i.id,
      'symbol', i.symbol,
      'match_score', round(v_total,2),
      'risk_tolerance_fit', round(v_rtfit,2),
      'risk_capacity_fit', round(v_rcfit,2),
      'risk_band', i.risk_level
    ));
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'count',v_count,'results',v_json);
end;
$$;
revoke all on function public.calculate_investment_match(uuid) from public;
grant execute on function public.calculate_investment_match(uuid) to authenticated, service_role;