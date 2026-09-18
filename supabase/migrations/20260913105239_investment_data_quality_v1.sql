create table if not exists public.investment_data_quality (
 id uuid primary key default gen_random_uuid(),
 investment_id uuid not null references public.investments(id) on delete cascade,
 checked_at timestamptz not null default now(),
 overall_status text not null check (overall_status in ('verified','verified_partial','stale','incomplete','invalid')),
 identity_complete boolean not null default false,
 metrics_complete boolean not null default false,
 risk_complete boolean not null default false,
 price_history_complete boolean not null default false,
 holdings_complete boolean not null default false,
 source_complete boolean not null default false,
 latest_metric_date date,
 latest_price_date date,
 latest_risk_date date,
 latest_holdings_date date,
 missing_fields jsonb not null default '[]'::jsonb,
 quality_score numeric(5,2) not null default 0,
 rules_version text not null default 'dq-v1.0',
 notes text,
 created_at timestamptz not null default now()
);
create unique index if not exists investment_data_quality_investment_checked_idx on public.investment_data_quality(investment_id, checked_at desc);
create index if not exists investment_data_quality_status_idx on public.investment_data_quality(overall_status, quality_score desc);

create or replace view public.v_investment_data_quality as
select i.id, i.symbol, i.name, i.data_status,
 q.checked_at, q.overall_status, q.identity_complete, q.metrics_complete,
 q.risk_complete, q.price_history_complete, q.holdings_complete, q.source_complete,
 q.latest_metric_date, q.latest_price_date, q.latest_risk_date, q.latest_holdings_date,
 q.missing_fields, q.quality_score, q.rules_version
from public.investments i
left join lateral (
 select q.* from public.investment_data_quality q
 where q.investment_id=i.id order by q.checked_at desc limit 1
) q on true
where i.is_active=true;

create or replace function public.refresh_investment_data_quality()
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into public.investment_data_quality (
 investment_id, overall_status, identity_complete, metrics_complete, risk_complete,
 price_history_complete, holdings_complete, source_complete, latest_metric_date,
 latest_price_date, latest_risk_date, latest_holdings_date, missing_fields, quality_score, notes)
 select i.id,
 case when identity_complete and metrics_complete and risk_complete and price_history_complete and holdings_complete and source_complete then 'verified'
      when identity_complete and source_complete and (metrics_complete or risk_complete or price_history_complete or holdings_complete) then 'verified_partial'
      when latest_metric_date is not null and latest_metric_date < current_date - 30 then 'stale'
      else 'incomplete' end,
 identity_complete, metrics_complete, risk_complete, price_history_complete, holdings_complete, source_complete,
 latest_metric_date, latest_price_date, latest_risk_date, latest_holdings_date,
 missing_fields, quality_score, 'Automated Data Quality Check'
 from (
  select i.*,
   (i.symbol is not null and i.name is not null and i.asset_type is not null and i.currency is not null) identity_complete,
   (m.investment_id is not null) metrics_complete,
   (r.investment_id is not null) risk_complete,
   (ph.investment_id is not null) price_history_complete,
   (h.investment_id is not null) holdings_complete,
   (s.investment_id is not null) source_complete,
   m.as_of_date latest_metric_date, ph.price_date latest_price_date, r.as_of_date latest_risk_date, h.as_of_date latest_holdings_date,
   (select jsonb_agg(x) from jsonb_array_elements_text(array_to_json(array_remove(array[
     case when m.investment_id is null then 'metrics' end,
     case when r.investment_id is null then 'risk_metrics' end,
     case when ph.investment_id is null then 'price_history' end,
     case when h.investment_id is null then 'holdings' end,
     case when s.investment_id is null then 'source' end
   ],null))::jsonb) x) missing_fields,
   round((100.0 * ((case when i.symbol is not null and i.name is not null and i.asset_type is not null and i.currency is not null then 1 else 0 end)
   +(case when m.investment_id is not null then 1 else 0 end)+(case when r.investment_id is not null then 1 else 0 end)
   +(case when ph.investment_id is not null then 1 else 0 end)+(case when h.investment_id is not null then 1 else 0 end)+(case when s.investment_id is not null then 1 else 0 end))/6.0)::numeric,2) quality_score
  from public.investments i
  left join lateral (select investment_id, as_of_date from public.investment_metrics where investment_id=i.id order by as_of_date desc limit 1) m on true
  left join lateral (select investment_id, as_of_date from public.investment_risk_metrics where investment_id=i.id order by as_of_date desc limit 1) r on true
  left join lateral (select investment_id, price_date from public.investment_price_history where investment_id=i.id order by price_date desc limit 1) ph on true
  left join lateral (select investment_id, as_of_date from public.investment_holdings where investment_id=i.id order by as_of_date desc limit 1) h on true
  left join lateral (select investment_id from public.investment_data_sources where investment_id=i.id order by retrieved_at desc limit 1) s on true
  where i.is_active=true
 ) z
 on conflict do nothing;
 get diagnostics n = row_count;
 return n;
end; $$;
revoke all on function public.refresh_investment_data_quality() from public;
grant execute on function public.refresh_investment_data_quality() to service_role;
