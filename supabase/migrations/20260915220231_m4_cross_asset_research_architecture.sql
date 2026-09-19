create table public.investment_structure_profiles (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  model_version text not null default 'structure-v1',
  capital_protection text check (capital_protection is null or capital_protection in ('none','conditional','contractual','insured_deposit')),
  liquidity_level text check (liquidity_level is null or liquidity_level in ('low','medium','high','locked')),
  price_volatility text check (price_volatility is null or price_volatility in ('none','very_low','low','medium','high','very_high')),
  income_predictability text check (income_predictability is null or income_predictability in ('none','low','medium','high','very_high')),
  growth_participation text check (growth_participation is null or growth_participation in ('none','low','medium','high')),
  interest_rate_sensitivity text check (interest_rate_sensitivity is null or interest_rate_sensitivity in ('not_applicable','low','medium','high')),
  credit_exposure text,
  diversification_level text check (diversification_level is null or diversification_level in ('single_issuer','limited','diversified')),
  complexity_level text check (complexity_level is null or complexity_level in ('low','medium','high')),
  time_structure text check (time_structure is null or time_structure in ('open_ended','fixed_maturity','locked_term','short_term')),
  principal_protection_basis text,
  source_basis jsonb not null default '{}'::jsonb,
  as_of_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investment_id, model_version)
);

create index investment_structure_profiles_investment_idx on public.investment_structure_profiles(investment_id);
alter table public.investment_structure_profiles enable row level security;
revoke all on public.investment_structure_profiles from anon, authenticated;
grant select on public.investment_structure_profiles to anon, authenticated;
grant select, insert, update, delete on public.investment_structure_profiles to service_role;
drop policy if exists investment_structure_profiles_public_read on public.investment_structure_profiles;
create policy investment_structure_profiles_public_read on public.investment_structure_profiles for select to anon, authenticated using (true);

create table public.investment_fixed_income_terms (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  instrument_subtype text not null,
  coupon_pct numeric,
  yield_to_maturity_pct numeric,
  issue_date date,
  maturity_date date,
  remaining_term_months integer check (remaining_term_months is null or remaining_term_months >= 0),
  duration_years numeric check (duration_years is null or duration_years >= 0),
  face_value numeric check (face_value is null or face_value > 0),
  credit_rating text,
  credit_rating_agency text,
  discount_instrument boolean not null default false,
  market_access_note text,
  source_name text not null,
  source_url text,
  as_of_date date not null,
  created_at timestamptz not null default now(),
  unique (investment_id, instrument_subtype, as_of_date)
);

create index investment_fixed_income_terms_latest_idx on public.investment_fixed_income_terms(investment_id, as_of_date desc);
alter table public.investment_fixed_income_terms enable row level security;
revoke all on public.investment_fixed_income_terms from anon, authenticated;
grant select on public.investment_fixed_income_terms to anon, authenticated;
grant select, insert, update, delete on public.investment_fixed_income_terms to service_role;
drop policy if exists investment_fixed_income_terms_public_read on public.investment_fixed_income_terms;
create policy investment_fixed_income_terms_public_read on public.investment_fixed_income_terms for select to anon, authenticated using (true);

create table public.investment_deposit_terms (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  annual_rate_pct numeric,
  term_months integer not null check (term_months > 0),
  redeemability text not null check (redeemability in ('non_redeemable','redeemable','conditionally_redeemable')),
  minimum_deposit numeric check (minimum_deposit is null or minimum_deposit >= 0),
  interest_payment_frequency text,
  registered_account_eligibility text[] not null default '{}'::text[],
  deposit_insurance_scheme text,
  deposit_insurance_eligible boolean,
  lockup_note text,
  source_name text not null,
  source_url text,
  as_of_date date not null,
  created_at timestamptz not null default now(),
  unique (investment_id, term_months, redeemability, as_of_date)
);

create index investment_deposit_terms_latest_idx on public.investment_deposit_terms(investment_id, as_of_date desc);
alter table public.investment_deposit_terms enable row level security;
revoke all on public.investment_deposit_terms from anon, authenticated;
grant select on public.investment_deposit_terms to anon, authenticated;
grant select, insert, update, delete on public.investment_deposit_terms to service_role;
drop policy if exists investment_deposit_terms_public_read on public.investment_deposit_terms;
create policy investment_deposit_terms_public_read on public.investment_deposit_terms for select to anon, authenticated using (true);

create or replace view public.v_instrument_research_catalog with (security_invoker=true) as
select
  s.*,
  sp.model_version as structure_model_version,
  sp.capital_protection,
  sp.liquidity_level,
  sp.price_volatility,
  sp.income_predictability,
  sp.growth_participation,
  sp.interest_rate_sensitivity,
  sp.credit_exposure,
  sp.diversification_level,
  sp.complexity_level,
  sp.time_structure,
  sp.principal_protection_basis,
  sp.as_of_date as structure_as_of_date,
  fi.instrument_subtype,
  fi.coupon_pct,
  fi.yield_to_maturity_pct,
  fi.issue_date,
  fi.maturity_date,
  fi.remaining_term_months,
  fi.duration_years,
  fi.face_value,
  fi.credit_rating,
  fi.credit_rating_agency,
  fi.discount_instrument,
  fi.market_access_note,
  fi.source_name as fixed_income_source_name,
  fi.source_url as fixed_income_source_url,
  fi.as_of_date as fixed_income_as_of_date,
  dep.annual_rate_pct as deposit_rate_pct,
  dep.term_months,
  dep.redeemability,
  dep.minimum_deposit,
  dep.interest_payment_frequency,
  dep.registered_account_eligibility,
  dep.deposit_insurance_scheme,
  dep.deposit_insurance_eligible,
  dep.lockup_note,
  dep.source_name as deposit_source_name,
  dep.source_url as deposit_source_url,
  dep.as_of_date as deposit_as_of_date
from public.v_investment_screener s
left join public.investment_structure_profiles sp on sp.investment_id=s.id and sp.model_version='structure-v1'
left join lateral (
  select x.* from public.investment_fixed_income_terms x
  where x.investment_id=s.id
  order by x.as_of_date desc, x.created_at desc
  limit 1
) fi on true
left join lateral (
  select x.* from public.investment_deposit_terms x
  where x.investment_id=s.id
  order by x.as_of_date desc, x.created_at desc
  limit 1
) dep on true;

revoke all on public.v_instrument_research_catalog from public;
grant select on public.v_instrument_research_catalog to anon, authenticated, service_role;

create or replace function public.app_search_instruments(
  p_asset_type text default null,
  p_search text default null,
  p_limit integer default 100
) returns setof public.v_instrument_research_catalog
language sql stable security invoker set search_path='' as $$
  select * from public.v_instrument_research_catalog v
  where (p_asset_type is null or v.asset_type=p_asset_type)
    and (p_search is null or v.symbol ilike '%'||p_search||'%' or v.name ilike '%'||p_search||'%')
  order by v.is_featured desc nulls last, v.asset_type, v.name
  limit least(greatest(coalesce(p_limit,100),1),250);
$$;
revoke all on function public.app_search_instruments(text,text,integer) from public;
grant execute on function public.app_search_instruments(text,text,integer) to anon, authenticated, service_role;

create or replace function public.app_get_instrument(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
  select to_jsonb(v) from public.v_instrument_research_catalog v where v.id=p_investment_id limit 1;
$$;
revoke all on function public.app_get_instrument(uuid) from public;
grant execute on function public.app_get_instrument(uuid) to anon, authenticated, service_role;

create or replace function public.app_compare_instruments(p_investment_ids uuid[])
returns setof public.v_instrument_research_catalog
language sql stable security invoker set search_path='' as $$
  select v.* from public.v_instrument_research_catalog v
  where v.id=any(p_investment_ids)
  order by array_position(p_investment_ids,v.id);
$$;
revoke all on function public.app_compare_instruments(uuid[]) from public;
grant execute on function public.app_compare_instruments(uuid[]) to anon, authenticated, service_role;
