
create or replace view public.v_investment_catalog as
select
  i.id,
  i.symbol,
  i.name,
  i.legal_name,
  i.asset_type,
  i.category,
  i.subcategory,
  i.strategy,
  i.sector,
  i.region,
  i.country_code,
  i.currency,
  i.exchange,
  i.description,
  i.inception_date,
  i.is_featured,
  i.data_status,
  issuer.name as issuer_name,
  issuer.website as issuer_website,
  greatest(
    ms.latest_metric_date,
    ps.return_1m_as_of_date,
    ps.return_3m_as_of_date,
    ps.return_1y_as_of_date,
    ps.return_3y_as_of_date,
    ps.return_5y_as_of_date,
    inc.as_of_date
  ) as metrics_as_of_date,
  ms.price,
  ms.daily_change_pct,
  ps.return_1m_pct,
  ps.return_3m_pct,
  ps.return_1y_pct,
  ps.return_3y_annualized_pct,
  ps.return_5y_annualized_pct,
  coalesce(inc.distribution_yield_pct,inc.trailing_yield_pct,ms.legacy_yield_pct) as yield_pct,
  coalesce(inc.distribution_frequency,ms.legacy_distribution_frequency) as distribution_frequency,
  ms.mer_pct,
  ms.aum,
  ms.volume,
  coalesce(r.risk_level,orr.official_risk_rating) as risk_level,
  r.volatility_1y_pct,
  r.volatility_3y_pct,
  r.max_drawdown_1y_pct,
  r.max_drawdown_3y_pct,
  r.beta,
  r.sharpe_ratio,
  r.standard_deviation_pct
from public.investments i
left join public.investment_issuers issuer on issuer.id=i.issuer_id
left join public.v_investment_metric_snapshot_v2 ms on ms.investment_id=i.id
left join public.v_investment_performance_summary ps on ps.investment_id=i.id
left join public.v_investment_latest_income inc on inc.investment_id=i.id
left join lateral (
  select
    x.risk_level,
    x.volatility_1y_pct,
    x.volatility_3y_pct,
    x.max_drawdown_1y_pct,
    x.max_drawdown_3y_pct,
    x.beta,
    x.sharpe_ratio,
    x.standard_deviation_pct
  from public.investment_risk_metrics x
  where x.investment_id=i.id
  order by x.as_of_date desc,x.created_at desc
  limit 1
) r on true
left join public.investment_official_risk_ratings orr on orr.investment_id=i.id
where i.is_active=true;
