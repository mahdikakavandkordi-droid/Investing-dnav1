-- Missing allocation is unknown, never zero.
-- For Mutual Funds, derived Investment DNA signals are withheld until the
-- strategic allocation is complete enough to reconcile to ~100%.

create or replace view public.v_investment_dna_v2 as
select
  i.id as investment_id,
  i.symbol,
  i.name,
  i.asset_type,
  i.category,
  i.subcategory,
  s.model_version as suitability_model_version,
  ip.model_version as intelligence_model_version,
  coalesce(orisk.official_risk_rating,s.risk_band) as risk_band,
  s.normalized_risk_score as risk_score,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::numeric(5,2) else ip.growth_score end as growth_score,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::numeric(5,2) else ip.income_score end as income_score,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::numeric(5,2) else ip.stability_score end as stability_score,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::numeric(5,2) else ip.diversification_score end as diversification_score,
  s.liquidity_score,
  ip.complexity_score,
  s.minimum_horizon_months,
  s.concentration_level,
  s.geographic_scope,
  s.currency_exposure,
  sc.equity_pct,
  case
    when i.asset_type='MUTUAL_FUND' then
      case
        when sc.fixed_income_pct is null
         and nullif(sc.profile_target_allocation->>'cash','') is null
        then null::numeric
        else coalesce(sc.fixed_income_pct,0::numeric)
           + coalesce((sc.profile_target_allocation->>'cash')::numeric,0::numeric)
      end
    else sc.fixed_income_pct
  end as fixed_income_pct,
  sc.mer_pct,
  case
    when i.asset_type='MUTUAL_FUND'
      and ip.model_version='intelligence-v1.1'
      and alloc.mf_allocation_complete
      and orisk.official_risk_rating is not null
      and orisk.source_url is not null
      and orisk.verified_at is not null
      and facts.investment_id is not null
    then 'verified'::text
    else sc.data_quality_status
  end as data_quality_status,
  sc.data_quality_score,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::text else ip.style_class end as style_class,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::text else ip.objective_class end as objective_class,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::jsonb else ip.ideal_investor end as ideal_investor,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::jsonb else ip.best_use_cases end as best_use_cases,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::jsonb else ip.key_tradeoffs end as key_tradeoffs,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::jsonb else ip.explanation end as explanation,
  case when i.asset_type='MUTUAL_FUND' and not alloc.mf_allocation_complete then null::jsonb else ip.source_basis end as intelligence_source_basis,
  nullif(
    greatest(
      coalesce(s.as_of_date,'1900-01-01'::date),
      coalesce(ip.as_of_date,'1900-01-01'::date),
      coalesce(orisk.source_date,'1900-01-01'::date)
    ),
    '1900-01-01'::date
  ) as as_of_date,
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
  select x.*
  from public.investment_suitability_profiles_v2 x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last,x.created_at desc nulls last
  limit 1
) s on true
left join public.investment_intelligence_profiles ip
  on ip.investment_id=i.id and ip.model_version='intelligence-v1.1'
left join public.v_investment_screener sc on sc.id=i.id
left join lateral (
  select case
    when i.asset_type<>'MUTUAL_FUND' then true
    when sc.equity_pct is null then false
    when abs(
      sc.equity_pct
      + coalesce(sc.fixed_income_pct,0::numeric)
      + coalesce((sc.profile_target_allocation->>'cash')::numeric,0::numeric)
      - 100::numeric
    )<=1::numeric then true
    else false
  end as mf_allocation_complete
) alloc on true
left join public.investment_official_risk_ratings orisk on orisk.investment_id=i.id
left join public.investment_official_facts facts on facts.investment_id=i.id
where i.is_active=true
  and i.asset_type in ('ETF','MUTUAL_FUND');
