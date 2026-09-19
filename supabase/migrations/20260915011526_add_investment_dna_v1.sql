create or replace view public.v_investment_dna_v1 with (security_invoker=true) as
select
  i.id as investment_id,
  i.symbol,
  i.name,
  i.asset_type,
  i.category,
  i.subcategory,
  s.model_version as suitability_model_version,
  s.risk_band,
  s.normalized_risk_score as risk_score,
  s.growth_score,
  s.income_score,
  ip.stability_score,
  s.diversification_score,
  s.liquidity_score,
  ip.complexity_score,
  s.minimum_horizon_months,
  s.concentration_level,
  s.geographic_scope,
  s.currency_exposure,
  sc.equity_pct,
  sc.fixed_income_pct,
  sc.mer_pct,
  sc.data_quality_status,
  sc.data_quality_score,
  ip.style_class,
  ip.objective_class,
  ip.ideal_investor,
  ip.best_use_cases,
  ip.key_tradeoffs,
  ip.explanation,
  greatest(coalesce(s.as_of_date, date '1900-01-01'), coalesce(ip.as_of_date, date '1900-01-01')) as as_of_date
from public.investments i
left join lateral (
  select x.* from public.investment_suitability_profiles_v2 x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last, x.created_at desc nulls last
  limit 1
) s on true
left join lateral (
  select x.* from public.investment_intelligence_profiles x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last, x.created_at desc nulls last
  limit 1
) ip on true
left join public.v_investment_screener sc on sc.id=i.id
where i.is_active=true;

create or replace function public.app_get_investment_dna(p_investment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select to_jsonb(v)
  from public.v_investment_dna_v1 v
  where v.investment_id=p_investment_id
  limit 1;
$$;

revoke all on function public.app_get_investment_dna(uuid) from public;
grant execute on function public.app_get_investment_dna(uuid) to anon, authenticated;