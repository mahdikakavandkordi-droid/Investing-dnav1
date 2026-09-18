drop function if exists public.calculate_investment_match(uuid);
create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare a record; c record; i record; v_rt numeric; v_rc numeric; v_score numeric; v_rtfit numeric; v_rcfit numeric; v_riskfit numeric; v_alloc numeric; v_vol numeric; v_dd numeric; v_context numeric; v_total numeric; v_model text:='suitability-v2.0'; v_count int:=0; v_json jsonb:='[]'::jsonb;
begin
 select * into a from public.assessments where id=p_assessment_id; if not found then raise exception 'assessment_not_found'; end if;
 select s.risk_tolerance,s.risk_capacity into v_rt,v_rc from public.investor_profile_snapshots s where s.assessment_id=p_assessment_id order by s.created_at desc limit 1;
 if v_rt is null or v_rc is null then raise exception 'dna_result_not_found'; end if;
 select * into c from public.investment_context where assessment_id=p_assessment_id order by updated_at desc limit 1;
 delete from public.investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
 for i in select * from public.v_investment_detail where data_quality_status='verified' order by symbol loop
  v_score:=case lower(coalesce(i.risk_level,'')) when 'low' then 25 when 'medium' then 55 when 'medium to high' then 80 when 'high' then 90 else 55 end;
  v_rtfit:=greatest(0,100-abs(v_rt-v_score)*1.15); v_rcfit:=greatest(0,100-abs(v_rc-v_score)*1.05); v_riskfit:=v_rtfit*.45+v_rcfit*.35;
  v_vol:=case when i.volatility_1y_pct is not null then greatest(0,100-abs(i.volatility_1y_pct-10)*4) else 50 end;
  v_dd:=case when i.max_drawdown_1y_pct is not null then greatest(0,100-abs(abs(i.max_drawdown_1y_pct)-20)*3) else 50 end;
  v_alloc:=50;
  if i.profile_target_allocation is not null and i.profile_target_allocation ? 'equity' then v_alloc:=greatest(0,100-abs((i.profile_target_allocation->>'equity')::numeric-v_rt*1.1)*.45); end if;
  v_context:=50;
  if c.id is not null then
   if lower(coalesce(c.loss_consequence,'')) like '%high%' or lower(coalesce(c.loss_consequence,'')) like '%critical%' then v_context:=v_context-15; end if;
   if lower(coalesce(c.time_horizon,'')) like '%short%' then v_context:=v_context-10; end if;
   if lower(coalesce(c.liquidity_need,'')) like '%high%' then v_context:=v_context-10; end if;
  end if;
  v_total:=least(100,greatest(0,v_riskfit*.55+v_alloc*.15+v_vol*.10+v_dd*.10+v_context*.10));
  insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale) values(p_assessment_id,i.id,v_model,round(v_total,2),round(v_rtfit,2),round(v_rcfit,2),i.risk_level,jsonb_build_object('engine',v_model,'components',jsonb_build_object('risk_fit',round(v_riskfit,2),'allocation_fit',round(v_alloc,2),'volatility_fit',round(v_vol,2),'drawdown_fit',round(v_dd,2),'context_fit',round(v_context,2)),'signal_type','compatibility_signal','not_investment_advice',true));
  v_json:=v_json||jsonb_build_array(jsonb_build_object('investment_id',i.id,'symbol',i.symbol,'match_score',round(v_total,2),'risk_tolerance_fit',round(v_rtfit,2),'risk_capacity_fit',round(v_rcfit,2),'risk_band',i.risk_level)); v_count:=v_count+1;
 end loop;
 return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'count',v_count,'results',v_json);
end; $$;
revoke all on function public.calculate_investment_match(uuid) from public; grant execute on function public.calculate_investment_match(uuid) to service_role;
create or replace view public.v_investment_match as select m.id,m.assessment_id,m.investment_id,i.symbol,i.name,m.model_version,m.match_score,m.risk_tolerance_fit,m.risk_capacity_fit,m.risk_band,m.rationale,m.created_at from public.investment_match_results m join public.investments i on i.id=m.investment_id;
