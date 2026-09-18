create table if not exists public.investment_income_history (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  trailing_yield_pct numeric,
  distribution_yield_pct numeric,
  distribution_frequency text,
  last_distribution_per_unit numeric,
  source_id uuid references public.investment_data_sources(id) on delete set null,
  source_note text,
  created_at timestamptz not null default now(),
  unique(investment_id,as_of_date)
);
alter table public.investment_income_history enable row level security;
drop policy if exists investment_income_public_read on public.investment_income_history;
create policy investment_income_public_read on public.investment_income_history for select using (true);
grant select on public.investment_income_history to anon,authenticated;

insert into public.investment_income_history(investment_id,as_of_date,trailing_yield_pct,distribution_frequency,source_note)
select investment_id,as_of_date,yield_pct,distribution_frequency,'Backfilled from investment_metrics; issuer source date may need field-level re-verification.'
from public.investment_metrics
where yield_pct is not null or distribution_frequency is not null
on conflict (investment_id,as_of_date) do update set trailing_yield_pct=coalesce(excluded.trailing_yield_pct,investment_income_history.trailing_yield_pct),distribution_frequency=coalesce(excluded.distribution_frequency,investment_income_history.distribution_frequency);

create or replace view public.v_investment_latest_income as
select distinct on (h.investment_id) h.investment_id,i.symbol,h.as_of_date,h.trailing_yield_pct,h.distribution_yield_pct,h.distribution_frequency,h.last_distribution_per_unit,h.source_id,s.source_name,s.source_url,h.source_note
from public.investment_income_history h join public.investments i on i.id=h.investment_id left join public.investment_data_sources s on s.id=h.source_id
order by h.investment_id,h.as_of_date desc,h.created_at desc;
grant select on public.v_investment_latest_income to anon,authenticated;