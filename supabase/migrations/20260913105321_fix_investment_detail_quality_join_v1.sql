create or replace view public.v_investment_detail as
select c.*, q.overall_status as data_quality_status, q.quality_score as data_quality_score,
 q.latest_metric_date as quality_metrics_date, q.latest_price_date as quality_price_date,
 q.latest_risk_date as quality_risk_date, q.latest_holdings_date as quality_holdings_date
from public.v_investment_catalog c
left join lateral (select q.* from public.v_investment_data_quality q where q.id=c.id or q.id is not null and false limit 1) q on true;

create or replace view public.v_investment_detail as
select c.*, q.overall_status as data_quality_status, q.quality_score as data_quality_score,
 q.latest_metric_date as quality_metrics_date, q.latest_price_date as quality_price_date,
 q.latest_risk_date as quality_risk_date, q.latest_holdings_date as quality_holdings_date
from public.v_investment_catalog c
left join lateral (
 select q.* from public.investment_data_quality q
 where q.investment_id=c.id order by q.checked_at desc limit 1
) q on true;