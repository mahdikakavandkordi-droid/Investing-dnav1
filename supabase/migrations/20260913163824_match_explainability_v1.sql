alter table public.investment_match_results add column if not exists explanation jsonb not null default '{}'::jsonb;

create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare a record; r record; c record; i record; s record; v_rt numeric; v_rc numeric; v_total numeric; v_rtfit numeric; v_rcfit numeric; v_riskfit numeric; v_alloc numeric; v_vol numeric; v_dd numeric; v_context numeric; v_target numeric; v_eq numeric; v_risk numeric; v_model text:='suitability-v2.2'; v_count int:=0; v_json jsonb:='[]'::jsonb; v_reasons jsonb; v_strengths jsonb; v_cautions jsonb; v_fit text; v_horizon text; v_liquidity text; v_loss text;
begin
 select * into a from assessments where id=p_assessment_id; if not found then raise exception 'assessment_not_found'; end if;
 select * into r from results where assessment_id=p_assessment_id and risk_tolerance is not null and risk_capacity is not null order by created_at desc limit 1; if not found then raise exception 'dna_result_not_found'; end if;
 v_rt:=r.risk_tolerance; v_rc:=r.risk_capacity; v_target:=greatest(0,least(100,v_rt*.60+v_rc*.40));
 select * into c from investment_context where assessment_id=p_assessment_id order by updated_at desc limit 1;
 delete from investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
 for i in select * from v_investment_detail where data_quality_status='verified' order by symbol loop
   select * into s from investment_suitability_profiles_v2 where investment_id=i.id and model_version='suitability-v2.0' limit 1;
   v_risk:=coalesce(s.normalized_risk_score,case lower(coalesce(i.risk_level,'')) when 'low' then 25 when 'medium' then 55 when 'medium to high' then 72 when 'high' then 90 else 55 end);
   v_rtfit:=greatest(0,100-abs(v_rt-v_risk)*1.15); v_rcfit:=greatest(0,100-greatest(0,v_risk-v_rc)*1.75-greatest(0,v_rc-v_risk)*.35); v_riskfit:=v_rtfit*.60+v_rcfit*.40;
   v_eq:=case when i.profile_target_allocation ? 'equity' then (i.profile_target_allocation->>'equity')::numeric else null end;
   v_alloc:=case when v_eq is not null then greatest(0,100-abs(v_eq-v_target)*1.10) else 65 end;
   v_vol:=case when i.volatility_1y_pct is not null then greatest(0,100-abs(i.volatility_1y_pct-greatest(4,least(18,v_target*.12)))*4) else 50 end;
   v_dd:=case when i.max_drawdown_1y_pct is not null then greatest(0,100-abs(abs(i.max_drawdown_1y_pct)-greatest(8,least(30,v_target*.22)))*2.5) else 50 end;
   v_context:=case when c.id is null then 70 else 100 end;
   v_horizon:=lower(coalesce(c.time_horizon,'')); v_liquidity:=lower(coalesce(c.liquidity_need,'')); v_loss:=lower(coalesce(c.loss_consequence,''));
   if c.id is not null then
     if (v_loss like '%high%' or v_loss like '%critical%') and v_risk>=72 then v_context:=v_context-20; end if;
     if v_horizon like '%short%' and coalesce(v_eq,0)>=80 then v_context:=v_context-20; end if;
     if v_liquidity like '%high%' and coalesce(v_eq,0)>=80 then v_context:=v_context-15; end if;
   end if;
   v_total:=least(100,greatest(0,v_riskfit*.55+v_alloc*.15+v_vol*.10+v_dd*.10+v_context*.10));
   v_reasons:='[]'::jsonb; v_strengths:='[]'::jsonb; v_cautions:='[]'::jsonb;
   if abs(v_rt-v_risk)<=15 then v_reasons:=v_reasons||jsonb_build_array('Your risk tolerance is closely aligned with this investment.'); elsif v_rt>v_risk then v_reasons:=v_reasons||jsonb_build_array('This investment is more conservative than your risk appetite.'); else v_cautions:=v_cautions||jsonb_build_array('This investment carries more risk than your stated risk tolerance.'); end if;
   if abs(v_rc-v_risk)<=15 then v_strengths:=v_strengths||jsonb_build_array('Your financial capacity is broadly compatible with this risk level.'); elsif v_rc<v_risk then v_cautions:=v_cautions||jsonb_build_array('Your current financial capacity provides less room for this level of risk.'); end if;
   if v_eq is not null and abs(v_eq-v_target)<=15 then v_reasons:=v_reasons||jsonb_build_array('The equity mix is close to your DNA-based target.'); elsif v_eq is not null and v_eq>v_target+15 then v_cautions:=v_cautions||jsonb_build_array('The equity exposure is higher than your DNA-based target.'); elsif v_eq is not null then v_reasons:=v_reasons||jsonb_build_array('The equity exposure is lower than your DNA-based target, which may reduce growth exposure.'); end if;
   if s.minimum_horizon_months>=60 then v_cautions:=v_cautions||jsonb_build_array('This strategy is better suited to a long investment horizon.'); elsif s.minimum_horizon_months>=48 then v_cautions:=v_cautions||jsonb_build_array('This strategy benefits from a multi-year investment horizon.'); end if;
   if c.id is null then v_cautions:=v_cautions||jsonb_build_array('Investment context has not been provided, so the match is based mainly on Investor DNA.'); end if;
   v_fit:=case when v_total>=85 then 'Strong fit' when v_total>=70 then 'Good fit' when v_total>=55 then 'Moderate fit' else 'Lower fit' end;
   insert into investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale,explanation) values(p_assessment_id,i.id,v_model,round(v_total,2),round(v_rtfit,2),round(v_rcfit,2),i.risk_level,jsonb_build_object('engine',v_model,'signal_type','compatibility_signal','not_investment_advice',true),jsonb_build_object('fit_label',v_fit,'summary',case when v_total>=85 then 'Strong alignment with your current Investor DNA.' when v_total>=70 then 'Good overall alignment with your current Investor DNA.' when v_total>=55 then 'Some alignment, but important trade-offs remain.' else 'Limited alignment with your current Investor DNA.' end,'why_it_fits',v_reasons,'strengths',v_strengths,'watchouts',v_cautions,'scores',jsonb_build_object('overall',round(v_total,2),'risk_fit',round(v_riskfit,2),'allocation_fit',round(v_alloc,2),'volatility_fit',round(v_vol,2),'drawdown_fit',round(v_dd,2),'context_fit',round(v_context,2)),'dna',jsonb_build_object('risk_tolerance',round(v_rt,2),'risk_capacity',round(v_rc,2),'target_equity_pct',round(v_target,2)),'investment',jsonb_build_object('risk_band',i.risk_level,'equity_pct',v_eq,'minimum_horizon_months',s.minimum_horizon_months),'disclaimer','Compatibility signal only; not investment advice.'));
   v_json:=v_json||jsonb_build_array(jsonb_build_object('investment_id',i.id,'symbol',i.symbol,'match_score',round(v_total,2),'fit_label',v_fit,'explanation',jsonb_build_object('why_it_fits',v_reasons,'strengths',v_strengths,'watchouts',v_cautions))); v_count:=v_count+1;
 end loop;
 return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'count',v_count,'results',v_json);
end; $$;
revoke all on function public.calculate_investment_match(uuid) from anon,authenticated; grant execute on function public.calculate_investment_match(uuid) to service_role;