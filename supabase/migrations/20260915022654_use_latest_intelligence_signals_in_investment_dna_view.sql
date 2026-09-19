create or replace view public.v_investment_dna_v1 as
select i.id AS investment_id,
    i.symbol,
    i.name,
    i.asset_type,
    i.category,
    i.subcategory,
    s.model_version AS suitability_model_version,
    COALESCE(orisk.official_risk_rating, s.risk_band) AS risk_band,
    s.normalized_risk_score AS risk_score,
    COALESCE(ip.growth_score,s.growth_score) AS growth_score,
    COALESCE(ip.income_score,s.income_score) AS income_score,
    ip.stability_score,
    COALESCE(ip.diversification_score,s.diversification_score) AS diversification_score,
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
    GREATEST(COALESCE(s.as_of_date, '1900-01-01'::date), COALESCE(ip.as_of_date, '1900-01-01'::date), COALESCE(orisk.source_date, '1900-01-01'::date)) AS as_of_date,
    orisk.official_risk_rating,
    orisk.band_min AS official_risk_band_min,
    orisk.band_max AS official_risk_band_max,
    orisk.issuer AS official_risk_issuer,
    orisk.source_type AS official_risk_source_type,
    orisk.source_title AS official_risk_source_title,
    orisk.source_url AS official_risk_source_url,
    orisk.source_date AS official_risk_source_date,
    orisk.effective_date AS official_risk_effective_date,
    orisk.methodology AS official_risk_methodology,
    orisk.verification_note AS official_risk_verification_note,
    orisk.verified_at AS official_risk_verified_at,
    ip.model_version AS intelligence_model_version
from investments i
left join lateral (
  select x.* from investment_suitability_profiles_v2 x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last, x.created_at desc nulls last
  limit 1
) s on true
left join lateral (
  select x.* from investment_intelligence_profiles x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last, x.created_at desc nulls last
  limit 1
) ip on true
left join v_investment_screener sc on sc.id=i.id
left join investment_official_risk_ratings orisk on orisk.investment_id=i.id
where i.is_active=true;