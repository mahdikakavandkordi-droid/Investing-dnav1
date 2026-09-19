create table if not exists public.investment_profiles (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  objective text,
  benchmark text,
  methodology text,
  portfolio_construction text,
  target_allocation jsonb,
  geographic_exposure jsonb,
  currency_hedging text,
  distribution_policy text,
  management_style text,
  replication_method text,
  ideal_for text,
  key_risks jsonb,
  profile_summary text,
  source_id uuid references public.investment_data_sources(id) on delete set null,
  as_of_date date,
  model_version text not null default 'profile-v1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(investment_id, model_version)
);

create index if not exists idx_investment_profiles_investment on public.investment_profiles(investment_id);

alter table public.investment_profiles enable row level security;
create policy "Public can read investment profiles" on public.investment_profiles
  for select to anon, authenticated using (true);

create or replace view public.v_investment_detail as
select
  c.*,
  q.overall_status as data_quality_status,
  q.quality_score as data_quality_score,
  q.latest_metric_date as quality_metrics_date,
  q.latest_price_date as quality_price_date,
  q.latest_risk_date as quality_risk_date,
  q.latest_holdings_date as quality_holdings_date,
  p.objective as profile_objective,
  p.benchmark as profile_benchmark,
  p.methodology as profile_methodology,
  p.portfolio_construction as profile_portfolio_construction,
  p.target_allocation as profile_target_allocation,
  p.geographic_exposure as profile_geographic_exposure,
  p.currency_hedging as profile_currency_hedging,
  p.distribution_policy as profile_distribution_policy,
  p.management_style as profile_management_style,
  p.replication_method as profile_replication_method,
  p.ideal_for as profile_ideal_for,
  p.key_risks as profile_key_risks,
  p.profile_summary,
  p.as_of_date as profile_as_of_date,
  p.model_version as profile_model_version
from public.v_investment_catalog c
left join lateral (
  select q.* from public.investment_data_quality q
  where q.investment_id = c.id
  order by q.checked_at desc, q.created_at desc
  limit 1
) q on true
left join lateral (
  select p.* from public.investment_profiles p
  where p.investment_id = c.id
  order by p.updated_at desc
  limit 1
) p on true;