create or replace view public.v_investment_match_explainable as
select r.id,r.assessment_id,r.investment_id,inv.symbol,inv.name,r.model_version,r.match_score,r.risk_band,
case when r.match_score>=85 then 'best_match' when r.match_score>=70 then 'strong_alternative' when r.match_score>=55 then 'situational' else 'low_compatibility' end fit_label,
coalesce((r.explanation->'scores'->>'risk_fit')::numeric, r.risk_tolerance_fit) risk_fit,
coalesce((r.explanation->'scores'->>'allocation_fit')::numeric,0) allocation_fit,
coalesce((r.explanation->'scores'->>'context_fit')::numeric,0) context_fit,
coalesce((r.explanation->'scores'->>'volatility_fit')::numeric,0) volatility_fit,
coalesce((r.explanation->'scores'->>'drawdown_fit')::numeric,0) drawdown_fit,
r.explanation->>'summary' summary,
r.explanation->'why_it_fits' why_it_fits,
r.explanation->'strengths' strengths,
r.explanation->'watchouts' watchouts,
r.explanation->'dna' dna,
r.explanation->'investment' investment,
ip.style_class,ip.objective_class,ip.ideal_investor,ip.best_use_cases,ip.key_tradeoffs
from public.investment_match_results r join public.investments inv on inv.id=r.investment_id
left join public.investment_intelligence_profiles ip on ip.investment_id=r.investment_id and ip.model_version='intelligence-v1.0'
where r.model_version='suitability-v2.3';

create or replace function public.get_explainable_match(p_assessment_id uuid,p_limit integer default 10)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
 if p_limit<1 or p_limit>50 then raise exception 'limit must be 1..50'; end if;
 select jsonb_build_object('model_version','suitability-v2.3','assessment_id',p_assessment_id,'matches',coalesce(jsonb_agg(to_jsonb(x) order by x.match_score desc),'[]'::jsonb),'disclaimer','Compatibility signals for discovery and comparison only; not investment advice.') into v
 from (select * from public.v_investment_match_explainable where assessment_id=p_assessment_id order by match_score desc, symbol limit p_limit)x;
 return v;
end;$$;
revoke all on function public.get_explainable_match(uuid,integer) from public,anon,authenticated;
grant execute on function public.get_explainable_match(uuid,integer) to service_role;

create or replace function public.cleanup_match_result_versions(p_assessment_id uuid,p_keep_model_version text default 'suitability-v2.3')
returns integer language plpgsql security definer set search_path=public as $$
declare v_deleted integer;
begin
 delete from public.investment_match_results where assessment_id=p_assessment_id and model_version<>p_keep_model_version;
 get diagnostics v_deleted=row_count;
 return v_deleted;
end;$$;
revoke all on function public.cleanup_match_result_versions(uuid,text) from public,anon,authenticated;
grant execute on function public.cleanup_match_result_versions(uuid,text) to service_role;

create unique index if not exists investment_match_results_current_uidx on public.investment_match_results(assessment_id,investment_id,model_version);