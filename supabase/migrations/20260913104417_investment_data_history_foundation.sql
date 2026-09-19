create table if not exists public.investment_price_history (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  price_date date not null,
  open_price numeric,
  high_price numeric,
  low_price numeric,
  close_price numeric,
  nav numeric,
  volume numeric,
  currency text not null default 'CAD',
  source_id uuid references public.investment_data_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(investment_id, price_date)
);

create index if not exists investment_price_history_investment_date_idx on public.investment_price_history(investment_id, price_date desc);

create table if not exists public.investment_distributions (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  ex_date date not null,
  record_date date,
  payment_date date,
  distribution_type text,
  amount_per_unit numeric,
  currency text not null default 'CAD',
  source_id uuid references public.investment_data_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(investment_id, ex_date, distribution_type)
);

create index if not exists investment_distributions_investment_date_idx on public.investment_distributions(investment_id, ex_date desc);

create table if not exists public.investment_holdings (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  holding_symbol text,
  holding_name text not null,
  country_code text,
  sector text,
  asset_type text,
  weight_pct numeric,
  market_value numeric,
  source_id uuid references public.investment_data_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(investment_id, as_of_date, holding_name)
);

create index if not exists investment_holdings_investment_date_idx on public.investment_holdings(investment_id, as_of_date desc);

create table if not exists public.investment_data_refresh_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_type text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  records_seen integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  error_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists investment_data_refresh_runs_started_idx on public.investment_data_refresh_runs(started_at desc);

alter table public.investment_price_history enable row level security;
alter table public.investment_distributions enable row level security;
alter table public.investment_holdings enable row level security;
alter table public.investment_data_refresh_runs enable row level security;

create policy "public can read price history for active investments" on public.investment_price_history for select to anon, authenticated using (exists (select 1 from public.investments i where i.id=investment_price_history.investment_id and i.is_active=true));
create policy "public can read distributions for active investments" on public.investment_distributions for select to anon, authenticated using (exists (select 1 from public.investments i where i.id=investment_distributions.investment_id and i.is_active=true));
create policy "public can read holdings for active investments" on public.investment_holdings for select to anon, authenticated using (exists (select 1 from public.investments i where i.id=investment_holdings.investment_id and i.is_active=true));

create or replace view public.v_investment_latest_prices as
select distinct on (p.investment_id)
  p.investment_id,
  p.price_date,
  p.open_price,
  p.high_price,
  p.low_price,
  p.close_price,
  p.nav,
  p.volume,
  p.currency
from public.investment_price_history p
join public.investments i on i.id=p.investment_id
where i.is_active=true
order by p.investment_id, p.price_date desc;

create or replace view public.v_investment_latest_holdings as
select h.*
from public.investment_holdings h
join public.investments i on i.id=h.investment_id
where i.is_active=true
  and h.as_of_date=(select max(h2.as_of_date) from public.investment_holdings h2 where h2.investment_id=h.investment_id);
