create or replace view public.v_investment_match_intelligence as
select r.*, 
 case when r.match_score>=85 then 'best_match' when r.match_score>=70 then 'strong_alternative' when r.match_score>=55 then 'situational' else 'low_compatibility' end as compatibility_class,
 case when (r.explanation->'investment'->>'equity_pct')::numeric >= 80 then 'growth' when (r.explanation->'investment'->>'equity_pct')::numeric <= 40 then 'stability_income' else 'balanced' end as style_class,
 case when r.explanation->'scores'->>'context_fit' is not null and (r.explanation->'scores'->>'context_fit')::numeric >= 90 then 'context_strong' when r.explanation->'scores'->>'context_fit' is not null and (r.explanation->'scores'->>'context_fit')::numeric < 60 then 'context_weak' else 'context_neutral' end as context_class
from public.v_investment_match_ranked r;

create or replace function public.get_investment_match_intelligence(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_model text:='suitability-v2.3'; v_best jsonb; v_growth jsonb; v_stable jsonb; v_income jsonb; v_alt jsonb; v_count int;
begin
 select count(*) into v_count from investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
 if v_count=0 then raise exception 'match_results_not_found'; end if;
 select to_jsonb(x) into v_best from (select symbol,name,match_score,risk_band,compatibility_class,explanation from v_investment_match_intelligence where assessment_id=p_assessment_id and model_version=v_model order by match_score desc, symbol limit 1)x;
 select to_jsonb(x) into v_growth from (select symbol,name,match_score,risk_band,explanation from v_investment_match_intelligence where assessment_id=p_assessment_id and model_version=v_model and style_class='growth' order by match_score desc limit 1)x;
 select to_jsonb(x) into v_stable from (select symbol,name,match_score,risk_band,explanation from v_investment_match_intelligence where assessment_id=p_assessment_id and model_version=v_model and style_class in ('stability_income','balanced') order by match_score desc limit 1)x;
 select to_jsonb(x) into v_income from (select symbol,name,match_score,risk_band,explanation from v_investment_match_intelligence where assessment_id=p_assessment_id and model_version=v_model and style_class='stability_income' order by match_score desc limit 1)x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.match_score desc),'[]'::jsonb) into v_alt from (select symbol,name,match_score,risk_band,explanation from v_investment_match_intelligence where assessment_id=p_assessment_id and model_version=v_model order by match_score desc offset 1 limit 4)x;
 return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'universe_count',v_count,'best_match',v_best,'best_for_growth',v_growth,'best_for_stability',v_stable,'best_for_income',v_income,'alternatives',v_alt,'disclaimer','These are compatibility signals for discovery and comparison, not personalized investment advice.');
end; $$;
revoke all on function public.get_investment_match_intelligence(uuid) from public,anon,authenticated; grant execute on function public.get_investment_match_intelligence(uuid) to service_role;