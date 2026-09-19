-- Asset-aware refresh policy and service-only due plan for the daily market-data worker.
-- This migration does not schedule network traffic and does not activate a paid data provider.

create table if not exists public.market_data_refresh_policies (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null,
  data_type text not null,
  cadence text not null check (cadence in ('daily','weekly','monthly','manual')),
  cadence_hours integer check (cadence_hours is null or cadence_hours > 0),
  refresh_after_local_time time not null default '19:00',
  market_timezone text not null default 'America/Toronto',
  automation_enabled boolean not null default false,
  max_staleness_hours integer check (max_staleness_hours is null or max_staleness_hours > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asset_type,data_type)
);

insert into public.market_data_refresh_policies(
  asset_type,data_type,cadence,cadence_hours,refresh_after_local_time,market_timezone,
  automation_enabled,max_staleness_hours,notes
)
values
  ('ETF','price_history','daily',24,'19:00','America/Toronto',true,36,
   'Daily close/NAV/volume path. Automated worker scope for V1.'),
  ('ETF','holdings','weekly',168,'19:00','America/Toronto',false,240,
   'Desired cadence only; provider-specific holdings automation is not enabled in V1.'),
  ('ETF','issuer_metadata','monthly',720,'19:00','America/Toronto',false,1080,
   'MER, mandate and slow-moving issuer facts should not be fetched daily.'),
  ('GIC','deposit_terms','weekly',168,'19:00','America/Toronto',false,240,
   'Posted rates/terms are source-specific and remain outside the daily price worker.'),
  ('T_BILL','fixed_income_terms','daily',24,'19:00','America/Toronto',false,48,
   'Daily cadence is appropriate once an official automated Government of Canada source adapter is implemented.'),
  ('BOND','fixed_income_terms','daily',24,'19:00','America/Toronto',false,48,
   'Daily cadence is appropriate for market yield/price fields once a licensed automated source is implemented.'),
  ('COMMERCIAL_PAPER','fixed_income_terms','daily',24,'19:00','America/Toronto',false,48,
   'Reference-only in the current catalog; no automated issue-level source is enabled.'),
  ('ABCP','reference_metadata','manual',null,'19:00','America/Toronto',false,null,
   'Educational/reference instrument; do not synthesize live pricing.')
on conflict(asset_type,data_type) do update
set cadence=excluded.cadence,
    cadence_hours=excluded.cadence_hours,
    refresh_after_local_time=excluded.refresh_after_local_time,
    market_timezone=excluded.market_timezone,
    automation_enabled=excluded.automation_enabled,
    max_staleness_hours=excluded.max_staleness_hours,
    notes=excluded.notes,
    updated_at=now();

alter table public.market_data_refresh_policies enable row level security;

revoke all on table public.market_data_refresh_policies from public,anon,authenticated;
grant select on table public.market_data_refresh_policies to service_role;

create or replace function public.resolve_automated_market_data_source(
  p_investment_id uuid,
  p_data_type text default 'price_history'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_symbol text;
  v_asset text;
  v_country text;
  v_exchange text;
  v_source jsonb;
begin
  select i.symbol,i.asset_type,i.country_code,i.exchange
    into v_symbol,v_asset,v_country,v_exchange
  from public.investments i
  where i.id=p_investment_id and i.is_active;

  if v_symbol is null then
    return jsonb_build_object('source_key',null,'reason','investment_not_found');
  end if;

  select jsonb_build_object(
           'source_key',s.source_key,
           'source_name',s.source_name,
           'source_id',s.id,
           'priority',coalesce(r.priority_override,s.priority),
           'provider_type',a.provider_type,
           'adapter_version',a.adapter_version,
           'endpoint_template',a.endpoint_template,
           'symbol_transform',a.symbol_transform,
           'timezone',a.timezone,
           'price_field',a.price_field,
           'adjustment_policy',a.adjustment_policy,
           'reason','automated_provider_route'
         )
    into v_source
  from public.market_data_source_routing r
  join public.market_data_sources s
    on s.id=r.source_id
   and s.is_active
  join public.market_data_provider_adapters a
    on a.source_id=s.id
   and a.is_active
  where r.is_active
    and (r.asset_type is null or r.asset_type=v_asset)
    and (r.country_code is null or r.country_code=v_country)
    and (r.exchange is null or r.exchange=v_exchange)
    and (r.symbol_pattern is null or v_symbol ilike r.symbol_pattern)
    and (
      (p_data_type='price_history' and s.supports_history)
      or (p_data_type<>'price_history' and s.supports_current)
    )
    and a.provider_type <> 'internal_foundation'
  order by coalesce(r.priority_override,s.priority),s.priority
  limit 1;

  return coalesce(
    v_source,
    jsonb_build_object(
      'source_key',null,
      'source_name',null,
      'provider_type',null,
      'reason','no_automated_provider'
    )
  );
end;
$$;

revoke all on function public.resolve_automated_market_data_source(uuid,text)
  from public,anon,authenticated;
grant execute on function public.resolve_automated_market_data_source(uuid,text)
  to service_role;

create or replace function public.get_due_price_history_ingestion_plan(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_plan jsonb;
begin
  select jsonb_agg(
           jsonb_build_object(
             'investment_id',x.investment_id,
             'symbol',x.symbol,
             'asset_type',x.asset_type,
             'country_code',x.country_code,
             'exchange',x.exchange,
             'currency',x.currency,
             'latest_price_date',x.latest_price_date,
             'target_price_date',x.target_price_date,
             'cadence',x.cadence,
             'max_staleness_hours',x.max_staleness_hours,
             'selected_source',x.selected_source
           )
           order by x.symbol
         )
    into v_plan
  from (
    select
      i.id as investment_id,
      i.symbol,
      i.asset_type,
      i.country_code,
      i.exchange,
      i.currency,
      ph.latest_price_date,
      (timezone(p.market_timezone,p_now))::date as target_price_date,
      p.cadence,
      p.max_staleness_hours,
      public.resolve_automated_market_data_source(i.id,'price_history') as selected_source
    from public.investments i
    join public.market_data_refresh_policies p
      on p.asset_type=i.asset_type
     and p.data_type='price_history'
     and p.automation_enabled
    left join lateral (
      select max(h.price_date) as latest_price_date
      from public.investment_price_history h
      where h.investment_id=i.id
    ) ph on true
    where i.is_active
      and (timezone(p.market_timezone,p_now))::time >= p.refresh_after_local_time
      and (
        ph.latest_price_date is null
        or ph.latest_price_date < (timezone(p.market_timezone,p_now))::date
      )
  ) x;

  return coalesce(v_plan,'[]'::jsonb);
end;
$$;

revoke all on function public.get_due_price_history_ingestion_plan(timestamptz)
  from public,anon,authenticated;
grant execute on function public.get_due_price_history_ingestion_plan(timestamptz)
  to service_role;

create index if not exists market_data_refresh_policies_automation_idx
  on public.market_data_refresh_policies(automation_enabled,asset_type,data_type)
  where automation_enabled;
