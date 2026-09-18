create or replace view public.v_investment_data_coverage_v2 as
with latest_holdings_date as (
  select investment_id,max(as_of_date) as as_of_date from public.investment_holdings group by investment_id
), holdings_coverage as (
  select h.investment_id,h.as_of_date,count(*) as holdings_rows,round(sum(coalesce(h.weight_pct,0)),2) as holdings_weight_coverage_pct
  from public.investment_holdings h join latest_holdings_date d on d.investment_id=h.investment_id and d.as_of_date=h.as_of_date
  group by h.investment_id,h.as_of_date
), perf as (
  select investment_id,
    max(as_of_date) filter(where return_1y_pct is not null) return_1y_date,
    max(as_of_date) filter(where return_3y_annualized_pct is not null) return_3y_date,
    max(as_of_date) filter(where return_5y_annualized_pct is not null) return_5y_date
  from public.investment_performance_history group by investment_id
), income as (
  select investment_id,max(as_of_date) filter(where source_id is not null) income_date from public.investment_income_history group by investment_id
), chars as (
  select investment_id,max(as_of_date) characteristics_date from public.investment_portfolio_characteristics group by investment_id
), exposure as (
  select investment_id,max(as_of_date) exposure_date,bool_or(is_complete_set) has_complete_exposure_set from public.investment_exposure_breakdown group by investment_id
), metric as (
  select investment_id,max(as_of_date) metrics_date from public.investment_metrics group by investment_id
)
select i.id investment_id,i.symbol,i.name,iss.name issuer,
  f.etf_facts_date,
  r.source_date official_risk_source_date,
  (f.investment_id is not null) has_official_facts,
  (r.investment_id is not null) has_official_risk,
  (p.return_1y_date is not null) has_return_1y,
  (p.return_3y_date is not null) has_return_3y,
  (p.return_5y_date is not null) has_return_5y,
  p.return_1y_date,p.return_3y_date,p.return_5y_date,
  (inc.income_date is not null) has_sourced_income,inc.income_date,
  (c.characteristics_date is not null) has_portfolio_characteristics,c.characteristics_date,
  coalesce(e.has_complete_exposure_set,false) has_complete_exposure_set,e.exposure_date,
  h.as_of_date holdings_date,h.holdings_rows,h.holdings_weight_coverage_pct,
  case when h.holdings_weight_coverage_pct>=95 then true else false end has_full_holdings_detail,
  m.metrics_date,i.data_status
from public.investments i
left join public.investment_issuers iss on iss.id=i.issuer_id
left join public.investment_official_facts f on f.investment_id=i.id
left join public.investment_official_risk_ratings r on r.investment_id=i.id
left join perf p on p.investment_id=i.id
left join income inc on inc.investment_id=i.id
left join chars c on c.investment_id=i.id
left join exposure e on e.investment_id=i.id
left join holdings_coverage h on h.investment_id=i.id
left join metric m on m.investment_id=i.id
where i.is_active=true;
grant select on public.v_investment_data_coverage_v2 to anon,authenticated;