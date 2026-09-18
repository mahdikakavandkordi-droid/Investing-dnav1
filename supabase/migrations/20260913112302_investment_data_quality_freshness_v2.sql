create or replace function public.refresh_investment_data_quality() returns integer language plpgsql security definer set search_path=public as $function$
declare n integer;
begin
 insert into public.investment_data_quality (
  investment_id, overall_status, identity_complete, metrics_complete, risk_complete,
  price_history_complete, holdings_complete, source_complete, latest_metric_date,
  latest_price_date, latest_risk_date, latest_holdings_date, missing_fields, quality_score, notes)
 select z.id,
  case
    when not z.identity_complete or not z.source_complete then 'incomplete'
    when z.metrics_complete and z.risk_complete and z.price_history_complete and z.holdings_complete then 'verified'
    when z.any_data and z.stale_core_data then 'stale'
    when z.any_data then 'verified_partial'
    else 'incomplete'
  end,
  z.identity_complete, z.metrics_complete, z.risk_complete, z.price_history_complete, z.holdings_complete, z.source_complete,
  z.latest_metric_date, z.latest_price_date, z.latest_risk_date, z.latest_holdings_date,
  z.missing_fields, z.quality_score,
  'Automated Data Quality Check v2: freshness windows metrics<=45d, price<=5d, risk<=90d, holdings<=90d'
 from (
  select i.id,
   (i.symbol is not null and i.name is not null and i.asset_type is not null and i.currency is not null) identity_complete,
   (m.investment_id is not null and m.as_of_date >= current_date - 45) metrics_complete,
   (r.investment_id is not null and r.as_of_date >= current_date - 90) risk_complete,
   (ph.investment_id is not null and ph.price_date >= current_date - 5) price_history_complete,
   (h.investment_id is not null and h.as_of_date >= current_date - 90) holdings_complete,
   (s.investment_id is not null) source_complete,
   (m.investment_id is not null or r.investment_id is not null or ph.investment_id is not null or h.investment_id is not null) any_data,
   ((m.investment_id is not null and m.as_of_date < current_date - 45)
    or (r.investment_id is not null and r.as_of_date < current_date - 90)
    or (ph.investment_id is not null and ph.price_date < current_date - 5)
    or (h.investment_id is not null and h.as_of_date < current_date - 90)) stale_core_data,
   m.as_of_date latest_metric_date, ph.price_date latest_price_date, r.as_of_date latest_risk_date, h.as_of_date latest_holdings_date,
   to_jsonb(array_remove(array[
    case when m.investment_id is null then 'metrics_missing' when m.as_of_date < current_date - 45 then 'metrics_stale' end,
    case when r.investment_id is null then 'risk_metrics_missing' when r.as_of_date < current_date - 90 then 'risk_metrics_stale' end,
    case when ph.investment_id is null then 'price_history_missing' when ph.price_date < current_date - 5 then 'price_history_stale' end,
    case when h.investment_id is null then 'holdings_missing' when h.as_of_date < current_date - 90 then 'holdings_stale' end,
    case when s.investment_id is null then 'source_missing' end
   ],null)) missing_fields,
   round((100.0 * (
    (case when i.symbol is not null and i.name is not null and i.asset_type is not null and i.currency is not null then 1 else 0 end)+
    (case when m.investment_id is not null and m.as_of_date >= current_date - 45 then 1 else 0 end)+
    (case when r.investment_id is not null and r.as_of_date >= current_date - 90 then 1 else 0 end)+
    (case when ph.investment_id is not null and ph.price_date >= current_date - 5 then 1 else 0 end)+
    (case when h.investment_id is not null and h.as_of_date >= current_date - 90 then 1 else 0 end)+
    (case when s.investment_id is not null then 1 else 0 end))/6.0)::numeric,2) quality_score
  from public.investments i
  left join lateral (select investment_id, as_of_date from public.investment_metrics where investment_id=i.id order by as_of_date desc limit 1) m on true
  left join lateral (select investment_id, as_of_date from public.investment_risk_metrics where investment_id=i.id order by as_of_date desc limit 1) r on true
  left join lateral (select investment_id, price_date from public.investment_price_history where investment_id=i.id order by price_date desc limit 1) ph on true
  left join lateral (select investment_id, as_of_date from public.investment_holdings where investment_id=i.id order by as_of_date desc limit 1) h on true
  left join lateral (select investment_id from public.investment_data_sources where investment_id=i.id order by retrieved_at desc limit 1) s on true
  where i.is_active=true
 ) z;
 get diagnostics n=row_count;
 return n;
end; $function$;