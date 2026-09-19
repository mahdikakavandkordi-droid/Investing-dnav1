create or replace function public.calculate_investment_match(p_assessment_id uuid) returns jsonb language plpgsql security definer set search_path='public','extensions' as $function$
declare a record; r record; c record; i record; s record; v_rt numeric; v_rc numeric; v_target numeric; v_riskfit numeric; v_rtfit numeric; v_rcfit numeric; v_alloc numeric; v_vol numeric; v_dd numeric; v_context numeric; v_total numeric; v_count int:=0; v_json jsonb:='[]'::jsonb; v_model text:='suitability-v2.2'; v_horizon_months int;
begin
select * into a from public.assessments where id=p_assessment_id; if not found then raise exception 'assessment_not_found'; end if;
select * into r from public.results where assessment_id=p_assessment_id and risk_tolerance is not null and risk_capacity is not null order by created_at desc limit 1; if not found then raise exception 'dna_result_not_found'; end if;
v_rt:=r.risk_tolerance; v_rc:=r.risk_capacity; v_target:=greatest(0,least(100,v_rt*.60+v_rc*.40));
select * into c from public.investment_context where assessment_id=p_assessment_id order by updated_at desc limit 1;
delete from public.investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
for i in select * from public.v_investment_detail where data_quality_status='verified' order by symbol loop
select * into s from public.investment_suitability_profiles_v2 where investment_id=i.id and model_version='suitability-v2.0' limit 1;
if s.id is null then continue; end if;
v_rtfit:=greatest(0,100-abs(v_rt-s.normalized_risk_score)*1.25);
v_rcfit:=greatest(0,100-abs(v_rc-s.normalized_risk_score)*1.10);
v_riskfit:=v_rtfit*.55+v_rcfit*.45;
v_alloc:=greatest(0,100-abs(v_target-s.growth_score)*1.05);
v_vol:=case when i.volatility_1y_pct is null then 65 else greatest(0,least(100,100-abs(i.volatility_1y_pct-s.volatility_tolerance_required)*3.0)) end;
v_dd:=case when i.max_drawdown_1y_pct is null then 65 else greatest(0,least(100,100-abs(abs(i.max_drawdown_1y_pct)-s.drawdown_tolerance_required)*2.0)) end;
v_context:=100;
if c.id is null then v_context:=70; else
if lower(coalesce(c.time_horizon,'')) like '%short%' then v_horizon_months:=24; elsif lower(coalesce(c.time_horizon,'')) like '%medium%' then v_horizon_months:=48; else v_horizon_months:=84; end if;
if v_horizon_months < s.minimum_horizon_months then v_context:=v_context-30; end if;
if lower(coalesce(c.liquidity_need,'')) like '%high%' and s.concentration_level='High' then v_context:=v_context-10; end if;
if lower(coalesce(c.loss_consequence,'')) like '%high%' or lower(coalesce(c.loss_consequence,'')) like '%critical%' then if s.normalized_risk_score>=70 then v_context:=v_context-20; else v_context:=v_context-5; end if; end if;
end if;
v_total:=least(100,greatest(0,v_riskfit*.55+v_alloc*.15+v_vol*.10+v_dd*.10+v_context*.10));
insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale) values(p_assessment_id,i.id,v_model,round(v_total,2),round(v_rtfit,2),round(v_rcfit,2),s.risk_band,jsonb_build_object('engine',v_model,'components',jsonb_build_object('risk_fit',round(v_riskfit,2),'allocation_fit',round(v_alloc,2),'volatility_fit',round(v_vol,2),'drawdown_fit',round(v_dd,2),'context_fit',round(v_context,2)),'target_equity_pct',round(v_target,2),'investment_suitability_score',s.normalized_risk_score,'minimum_horizon_months',s.minimum_horizon_months,'signal_type','compatibility_signal','not_investment_advice',true));
v_json:=v_json||jsonb_build_array(jsonb_build_object('investment_id',i.id,'symbol',i.symbol,'match_score',round(v_total,2),'risk_tolerance_fit',round(v_rtfit,2),'risk_capacity_fit',round(v_rcfit,2),'risk_band',s.risk_band)); v_count:=v_count+1;
end loop;
return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'count',v_count,'results',v_json);
end;$function$;
revoke execute on function public.calculate_investment_match(uuid) from anon,authenticated; grant execute on function public.calculate_investment_match(uuid) to service_role;