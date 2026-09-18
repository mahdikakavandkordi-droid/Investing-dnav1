create table if not exists public.market_data_sources (
 id uuid primary key default gen_random_uuid(),
 source_key text not null unique,
 source_name text not null,
 market_scope text not null,
 priority integer not null default 100,
 is_active boolean not null default true,
 supports_history boolean not null default false,
 supports_current boolean not null default false,
 supports_adjusted_prices boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

insert into public.market_data_sources(source_key,source_name,market_scope,priority,is_active,supports_history,supports_current,supports_adjusted_prices)
values
 ('massive','Massive','US',10,true,true,true,true),
 ('internal_verified','Investing DNA Verified Foundation','CA',20,true,true,true,false),
 ('issuer_primary','Issuer Primary Source','CA,US',30,true,false,true,false)
on conflict(source_key) do update set source_name=excluded.source_name, market_scope=excluded.market_scope, priority=excluded.priority, updated_at=now();

create table if not exists public.market_data_source_routing (
 id uuid primary key default gen_random_uuid(),
 source_id uuid not null references public.market_data_sources(id) on delete cascade,
 asset_type text,
 country_code text,
 exchange text,
 symbol_pattern text,
 priority_override integer,
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);

create table if not exists public.market_data_refresh_runs (
 id uuid primary key default gen_random_uuid(),
 source_id uuid references public.market_data_sources(id) on delete set null,
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

create table if not exists public.market_data_ingestion_log (
 id uuid primary key default gen_random_uuid(),
 refresh_run_id uuid references public.market_data_refresh_runs(id) on delete cascade,
 investment_id uuid references public.investments(id) on delete cascade,
 source_id uuid references public.market_data_sources(id) on delete set null,
 data_type text not null,
 period_start date,
 period_end date,
 records_seen integer not null default 0,
 records_inserted integer not null default 0,
 records_updated integer not null default 0,
 status text not null default 'completed',
 error_message text,
 created_at timestamptz not null default now()
);

create index if not exists market_data_routing_lookup_idx on public.market_data_source_routing(asset_type,country_code,exchange,is_active,priority_override);
create index if not exists market_data_refresh_source_idx on public.market_data_refresh_runs(source_id,started_at desc);
create index if not exists market_data_ingestion_investment_idx on public.market_data_ingestion_log(investment_id,created_at desc);

alter table public.market_data_sources enable row level security;
alter table public.market_data_source_routing enable row level security;
alter table public.market_data_refresh_runs enable row level security;
alter table public.market_data_ingestion_log enable row level security;

create or replace view public.v_market_data_source_status as
select mds.source_key,mds.source_name,mds.market_scope,mds.priority,mds.is_active,mds.supports_history,mds.supports_current,
       max(mrr.completed_at) as last_completed_at,
       coalesce(sum(case when mrr.status='completed' then mrr.records_inserted else 0 end),0) as total_records_inserted,
       coalesce(sum(mrr.error_count),0) as total_errors
from public.market_data_sources mds
left join public.market_data_refresh_runs mrr on mrr.source_id=mds.id
group by mds.id;

create or replace function public.resolve_market_data_source(p_investment_id uuid,p_data_type text default 'price_history')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_symbol text; v_asset text; v_country text; v_exchange text; v_source jsonb;
begin
 select symbol,asset_type,country_code,exchange into v_symbol,v_asset,v_country,v_exchange from investments where id=p_investment_id;
 if v_symbol is null then raise exception 'Investment not found'; end if;
 select jsonb_build_object('source_key',s.source_key,'source_name',s.source_name,'priority',coalesce(r.priority_override,s.priority),'reason',case when s.source_key='massive' then 'US market-data route' when s.source_key='internal_verified' then 'verified Canadian foundation route' else 'primary issuer route' end)
 into v_source
 from market_data_sources s left join market_data_source_routing r on r.source_id=s.id and r.is_active and (r.asset_type is null or r.asset_type=v_asset) and (r.country_code is null or r.country_code=v_country) and (r.exchange is null or r.exchange=v_exchange) and (r.symbol_pattern is null or v_symbol ilike r.symbol_pattern)
 where s.is_active and s.supports_history and (s.market_scope='US' or s.market_scope='CA' or s.market_scope='CA,US')
 order by coalesce(r.priority_override,s.priority),s.priority limit 1;
 return coalesce(v_source,jsonb_build_object('source_key',null,'reason','no eligible source'));
end;$$;
revoke all on function public.resolve_market_data_source(uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_market_data_source(uuid,text) to service_role;

create or replace view public.v_market_data_coverage as
select i.symbol,i.asset_type,i.country_code,i.exchange,
       coalesce(ph.cnt,0) price_history_records,
       ph.min_date,ph.max_date,
       case when ph.cnt is null or ph.cnt=0 then 'missing' when ph.cnt < 60 then 'limited' when ph.cnt < 252 then 'developing' else 'historical' end as history_depth
from investments i
left join lateral (select count(*) cnt,min(price_date) min_date,max(price_date) max_date from investment_price_history h where h.investment_id=i.id) ph on true
where i.is_active=true;