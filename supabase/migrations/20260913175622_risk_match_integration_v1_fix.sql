drop view if exists public.v_investment_match_intelligence;
create view public.v_investment_match_intelligence as
select r.id,r.assessment_id,r.investment_id,r.symbol,r.name,r.asset_type,r.category,r.model_version,r.match_score,r.risk_band,r.recommendation_tier,r.match_rank,r.universe_count,r.explanation,
case when r.match_score>=85 then 'best_match' when r.match_score>=70 then 'strong_alternative' when r.match_score>=55 then 'situational' else 'low_compatibility' end compatibility_class,
case when ((r.explanation->'investment'->>'equity_pct')::numeric)>=80 then 'growth' when ((r.explanation->'investment'->>'equity_pct')::numeric)<=40 then 'stability_income' else 'balanced' end style_class,
case when ((r.explanation->'scores'->>'context_fit')::numeric)>=90 then 'context_strong' when ((r.explanation->'scores'->>'context_fit')::numeric)<60 then 'context_weak' else 'context_neutral' end context_class
from public.v_investment_match_ranked r;

create or replace function public.refresh_blueprint_risk_and_match(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_blueprints jsonb; v_intelligence jsonb;
begin
 perform public.generate_portfolio_blueprints(p_assessment_id);
 perform public.calculate_investment_match(p_assessment_id);
 select coalesce(jsonb_agg(to_jsonb(b) order by b.overall_fit_score desc),'[]'::jsonb) into v_blueprints from public.investment_portfolio_blueprints b where b.assessment_id=p_assessment_id;
 begin select public.get_investment_match_intelligence(p_assessment_id) into v_intelligence; exception when others then v_intelligence='{}'::jsonb; end;
 return jsonb_build_object('assessment_id',p_assessment_id,'blueprints',v_blueprints,'match_intelligence',v_intelligence,'model_version','risk-match-v1.0','disclaimer','Portfolio and match outputs are analytical estimates, not investment advice.');
end;$$;
revoke all on function public.refresh_blueprint_risk_and_match(uuid) from public,anon,authenticated;
grant execute on function public.refresh_blueprint_risk_and_match(uuid) to service_role;

create or replace view public.v_portfolio_intelligence as
select b.assessment_id,b.id blueprint_id,b.blueprint_type,b.title,b.target_equity_pct,b.target_fixed_income_pct,b.overall_fit_score,coalesce(p.risk_quality,'limited') risk_quality,coalesce(p.lookthrough_coverage_pct,0) lookthrough_coverage_pct,coalesce(p.pairwise_overlap_pct,0) pairwise_overlap_pct,coalesce(p.top10_concentration_pct,0) top10_concentration_pct,coalesce(p.diversification_score,0) risk_diversification_score,p.risk_notes
from public.investment_portfolio_blueprints b left join public.portfolio_risk_analysis p on p.blueprint_id=b.id;
