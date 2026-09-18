create table if not exists public.investment_portfolio_characteristics (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  number_of_holdings integer,
  number_of_stocks integer,
  number_of_bonds integer,
  yield_to_maturity_pct numeric,
  average_duration_years numeric,
  average_maturity_years numeric,
  average_credit_quality text,
  pe_ratio numeric,
  pb_ratio numeric,
  roe_pct numeric,
  earnings_growth_pct numeric,
  source_id uuid references public.investment_data_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(investment_id,as_of_date)
);

create table if not exists public.investment_exposure_breakdown (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  dimension text not null check (dimension in ('sector','country','region','asset_class','credit_quality','maturity')),
  bucket text not null,
  weight_pct numeric not null check (weight_pct>=0 and weight_pct<=100),
  source_id uuid references public.investment_data_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(investment_id,as_of_date,dimension,bucket)
);

alter table public.investment_portfolio_characteristics enable row level security;
alter table public.investment_exposure_breakdown enable row level security;
drop policy if exists investment_portfolio_characteristics_public_read on public.investment_portfolio_characteristics;
create policy investment_portfolio_characteristics_public_read on public.investment_portfolio_characteristics for select using (true);
drop policy if exists investment_exposure_breakdown_public_read on public.investment_exposure_breakdown;
create policy investment_exposure_breakdown_public_read on public.investment_exposure_breakdown for select using (true);
grant select on public.investment_portfolio_characteristics,public.investment_exposure_breakdown to anon,authenticated;