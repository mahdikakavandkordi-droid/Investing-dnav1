create table if not exists public.investment_issuers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  country_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name)
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  legal_name text,
  asset_type text not null,
  issuer_id uuid references public.investment_issuers(id),
  category text,
  subcategory text,
  strategy text,
  sector text,
  region text,
  country_code text,
  currency text not null default 'CAD',
  exchange text,
  description text,
  inception_date date,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  data_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(symbol, exchange)
);

create index if not exists investments_active_idx on public.investments(is_active);
create index if not exists investments_asset_type_idx on public.investments(asset_type);
create index if not exists investments_category_idx on public.investments(category);
create index if not exists investments_issuer_idx on public.investments(issuer_id);
create index if not exists investments_symbol_idx on public.investments(symbol);

create table if not exists public.investment_metrics (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  price numeric,
  daily_change_pct numeric,
  return_1m_pct numeric,
  return_3m_pct numeric,
  return_1y_pct numeric,
  return_3y_annualized_pct numeric,
  return_5y_annualized_pct numeric,
  yield_pct numeric,
  distribution_frequency text,
  mer_pct numeric,
  aum numeric,
  volume numeric,
  shares_outstanding numeric,
  created_at timestamptz not null default now(),
  unique(investment_id, as_of_date)
);

create index if not exists investment_metrics_latest_idx on public.investment_metrics(investment_id, as_of_date desc);

create table if not exists public.investment_risk_metrics (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  risk_level text,
  volatility_1y_pct numeric,
  volatility_3y_pct numeric,
  max_drawdown_1y_pct numeric,
  max_drawdown_3y_pct numeric,
  beta numeric,
  sharpe_ratio numeric,
  standard_deviation_pct numeric,
  created_at timestamptz not null default now(),
  unique(investment_id, as_of_date)
);

create index if not exists investment_risk_metrics_latest_idx on public.investment_risk_metrics(investment_id, as_of_date desc);

create table if not exists public.investment_data_sources (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  source_name text not null,
  source_type text not null,
  source_url text,
  metric_scope text,
  retrieved_at timestamptz not null default now(),
  source_version text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists investment_data_sources_investment_idx on public.investment_data_sources(investment_id, retrieved_at desc);

create table if not exists public.investment_tags (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  tag text not null,
  tag_group text,
  created_at timestamptz not null default now(),
  unique(investment_id, tag)
);

create index if not exists investment_tags_tag_idx on public.investment_tags(tag);
create index if not exists investment_tags_group_idx on public.investment_tags(tag_group);

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
  m.as_of_date as metrics_as_of_date,
  m.price,
  m.daily_change_pct,
  m.return_1m_pct,
  m.return_3m_pct,
  m.return_1y_pct,
  m.return_3y_annualized_pct,
  m.return_5y_annualized_pct,
  m.yield_pct,
  m.distribution_frequency,
  m.mer_pct,
  m.aum,
  m.volume,
  r.risk_level,
  r.volatility_1y_pct,
  r.volatility_3y_pct,
  r.max_drawdown_1y_pct,
  r.max_drawdown_3y_pct,
  r.beta,
  r.sharpe_ratio,
  r.standard_deviation_pct
from public.investments i
left join public.investment_issuers issuer on issuer.id = i.issuer_id
left join lateral (
  select * from public.investment_metrics x
  where x.investment_id = i.id
  order by x.as_of_date desc
  limit 1
) m on true
left join lateral (
  select * from public.investment_risk_metrics x
  where x.investment_id = i.id
  order by x.as_of_date desc
  limit 1
) r on true
where i.is_active = true;

alter table public.investment_issuers enable row level security;
alter table public.investments enable row level security;
alter table public.investment_metrics enable row level security;
alter table public.investment_risk_metrics enable row level security;
alter table public.investment_data_sources enable row level security;
alter table public.investment_tags enable row level security;

create policy "public can read active issuers" on public.investment_issuers for select to anon, authenticated using (exists (select 1 from public.investments i where i.issuer_id = investment_issuers.id and i.is_active = true));
create policy "public can read active investments" on public.investments for select to anon, authenticated using (is_active = true);
create policy "public can read metrics for active investments" on public.investment_metrics for select to anon, authenticated using (exists (select 1 from public.investments i where i.id = investment_metrics.investment_id and i.is_active = true));
create policy "public can read risk metrics for active investments" on public.investment_risk_metrics for select to anon, authenticated using (exists (select 1 from public.investments i where i.id = investment_risk_metrics.investment_id and i.is_active = true));
create policy "public can read tags for active investments" on public.investment_tags for select to anon, authenticated using (exists (select 1 from public.investments i where i.id = investment_tags.investment_id and i.is_active = true));

revoke all on public.investment_data_sources from anon, authenticated;
revoke insert, update, delete on public.investment_issuers from anon, authenticated;
revoke insert, update, delete on public.investments from anon, authenticated;
revoke insert, update, delete on public.investment_metrics from anon, authenticated;
revoke insert, update, delete on public.investment_risk_metrics from anon, authenticated;
revoke insert, update, delete on public.investment_tags from anon, authenticated;

create index if not exists investments_search_idx on public.investments using gin (to_tsvector('simple', coalesce(symbol,'') || ' ' || coalesce(name,'') || ' ' || coalesce(category,'') || ' ' || coalesce(subcategory,'')));
