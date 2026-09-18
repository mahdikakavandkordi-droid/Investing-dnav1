create table if not exists public.market_data_provider_adapters (
 id uuid primary key default gen_random_uuid(), source_id uuid not null references public.market_data_sources(id) on delete cascade,
 provider_type text not null, adapter_version text not null default 'adapter-v1.0',
 endpoint_template text, symbol_transform text, timezone text default 'America/Toronto',
 price_field text not null default 'close', adjustment_policy text not null default 'adjusted',
 is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(source_id,adapter_version)
);

create table if not exists public.market_data_normalization_rules (
 id uuid primary key default gen_random_uuid(), provider_adapter_id uuid not null references public.market_data_provider_adapters(id) on delete cascade,
 canonical_field text not null, provider_field text not null, transform_rule text, is_required boolean not null default false,
 created_at timestamptz not null default now(), unique(provider_adapter_id,canonical_field)
);

insert into public.market_data_provider_adapters(source_id,provider_type,adapter_version,endpoint_template,symbol_transform,price_field,adjustment_policy)
select id,'massive','adapter-v1.0','/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}','identity','c','adjusted'
from public.market_data_sources where source_key='massive'
on conflict(source_id,adapter_version) do update set endpoint_template=excluded.endpoint_template,updated_at=now();

insert into public.market_data_provider_adapters(source_id,provider_type,adapter_version,endpoint_template,symbol_transform,price_field,adjustment_policy)
select id,'internal_foundation','adapter-v1.0','internal:investment_price_history','identity','close_price','as_provided'
from public.market_data_sources where source_key='internal_verified'
on conflict(source_id,adapter_version) do update set endpoint_template=excluded.endpoint_template,updated_at=now();

create or replace view public.v_market_data_provider_matrix as
select s.source_key,s.source_name,s.market_scope,s.priority,a.provider_type,a.adapter_version,a.endpoint_template,a.symbol_transform,a.price_field,a.adjustment_policy,a.is_active
from public.market_data_sources s left join public.market_data_provider_adapters a on a.source_id=s.id;

create or replace function public.get_market_data_ingestion_plan(p_data_type text default 'price_history')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
 select jsonb_agg(jsonb_build_object('symbol',x.symbol,'investment_id',x.investment_id,'country_code',x.country_code,'exchange',x.exchange,'selected_source',x.source_key,'provider_type',x.provider_type,'adapter_version',x.adapter_version,'endpoint_template',x.endpoint_template,'price_field',x.price_field,'history_depth',x.history_depth) order by x.symbol) into v
 from (
  select i.id investment_id,i.symbol,i.country_code,i.exchange,coalesce(r->>'source_key','') source_key,a.provider_type,a.adapter_version,a.endpoint_template,a.price_field,c.history_depth
  from public.investments i
  join public.v_market_data_coverage c on c.symbol=i.symbol
  left join lateral (select public.resolve_market_data_source(i.id,p_data_type) r) q on true
  left join public.market_data_sources s on s.source_key=q.r->>'source_key'
  left join public.market_data_provider_adapters a on a.source_id=s.id and a.is_active
  where i.is_active=true
 ) x;
 return coalesce(v,'[]'::jsonb);
end;$$;
revoke all on function public.get_market_data_ingestion_plan(text) from public,anon,authenticated;
grant execute on function public.get_market_data_ingestion_plan(text) to service_role;

alter table public.market_data_provider_adapters enable row level security;
alter table public.market_data_normalization_rules enable row level security;
