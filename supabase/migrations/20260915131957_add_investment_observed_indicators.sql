create table if not exists public.investment_observed_indicators (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  observed_at timestamptz not null default now(),
  metric_key text not null,
  metric_value_numeric numeric,
  metric_value_text text,
  unit text,
  source_id uuid references public.investment_data_sources(id) on delete set null,
  source_as_of_date date,
  source_note text,
  created_at timestamptz not null default now(),
  unique(investment_id,observed_at,metric_key),
  check (metric_value_numeric is not null or metric_value_text is not null)
);
alter table public.investment_observed_indicators enable row level security;
drop policy if exists investment_observed_indicators_public_read on public.investment_observed_indicators;
create policy investment_observed_indicators_public_read on public.investment_observed_indicators for select using (true);
grant select on public.investment_observed_indicators to anon,authenticated;

create or replace view public.v_investment_latest_observed_indicators as
select distinct on (o.investment_id,o.metric_key)
 o.investment_id,i.symbol,o.metric_key,o.metric_value_numeric,o.metric_value_text,o.unit,o.observed_at,o.source_as_of_date,o.source_id,s.source_name,s.source_url,o.source_note
from public.investment_observed_indicators o
join public.investments i on i.id=o.investment_id
left join public.investment_data_sources s on s.id=o.source_id
order by o.investment_id,o.metric_key,o.observed_at desc,o.created_at desc;
grant select on public.v_investment_latest_observed_indicators to anon,authenticated;