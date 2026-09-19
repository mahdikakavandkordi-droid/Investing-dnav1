-- M4 hard-test correction: keep canonical Investment DNA / Match explicitly ETF-scoped.
-- Explore / Detail / Compare use the cross-asset research catalog. Match v6 and
-- fund_universe_version intentionally consume v_investment_dna_v2, so this
-- boundary must contain ETFs only.

create or replace view public.v_investment_dna_v2
with (security_invoker=true) as
select
    i.id as investment_id,
    i.symbol,
    i.name,
    i.asset_type,
    i.category,
    i.subcategory,
    s.model_version as suitability_model_version,
    ip.model_version as intelligence_model_version,
    coalesce(orisk.official_risk_rating, s.risk_band) as risk_band,
    s.normalized_risk_score as risk_score,
    ip.growth_score,
    ip.income_score,
    ip.stability_score,
    ip.diversification_score,
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
    ip.source_basis as intelligence_source_basis,
    greatest(coalesce(s.as_of_date,'1900-01-01'::date),coalesce(ip.as_of_date,'1900-01-01'::date),coalesce(orisk.source_date,'1900-01-01'::date)) as as_of_date,
    orisk.official_risk_rating,
    orisk.band_min as official_risk_band_min,
    orisk.band_max as official_risk_band_max,
    orisk.issuer as official_risk_issuer,
    orisk.source_type as official_risk_source_type,
    orisk.source_title as official_risk_source_title,
    orisk.source_url as official_risk_source_url,
    orisk.source_date as official_risk_source_date,
    orisk.effective_date as official_risk_effective_date,
    orisk.methodology as official_risk_methodology,
    orisk.verification_note as official_risk_verification_note,
    orisk.verified_at as official_risk_verified_at
from public.investments i
left join lateral (
  select x.* from public.investment_suitability_profiles_v2 x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last,x.created_at desc nulls last
  limit 1
) s on true
left join public.investment_intelligence_profiles ip on ip.investment_id=i.id and ip.model_version='intelligence-v1.1'
left join public.v_investment_screener sc on sc.id=i.id
left join public.investment_official_risk_ratings orisk on orisk.investment_id=i.id
where i.is_active=true and i.asset_type='ETF';

revoke all on public.v_investment_dna_v2 from public, anon, authenticated;
grant select on public.v_investment_dna_v2 to service_role;