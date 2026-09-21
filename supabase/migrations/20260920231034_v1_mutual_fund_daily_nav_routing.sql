-- Daily NAV refresh route for Canadian mutual funds.
create table if not exists public.market_data_symbol_aliases (
 id uuid primary key default gen_random_uuid(),
 investment_id uuid not null references public.investments(id) on delete cascade,
 source_id uuid not null references public.market_data_sources(id) on delete cascade,
 provider_symbol text not null,
 is_active boolean not null default true,
 notes text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(investment_id,source_id)
);
alter table public.market_data_symbol_aliases enable row level security;
revoke all on public.market_data_symbol_aliases from public,anon,authenticated;
grant all on public.market_data_symbol_aliases to service_role;

insert into public.market_data_source_routing(source_id,asset_type,country_code,exchange,priority_override,is_active)
select s.id,'MUTUAL_FUND','CA','FUND',90,true from public.market_data_sources s where s.source_key='yahoo_free'
and not exists(select 1 from public.market_data_source_routing r where r.source_id=s.id and r.asset_type='MUTUAL_FUND' and r.country_code='CA' and r.exchange='FUND' and r.is_active);

insert into public.market_data_refresh_policies(asset_type,data_type,cadence,cadence_hours,refresh_after_local_time,market_timezone,automation_enabled,max_staleness_hours,notes)
values('MUTUAL_FUND','price_history','daily',24,'19:00:00','America/Toronto',true,36,'Daily post-close NAV/price refresh for the curated Canadian mutual-fund research universe.')
on conflict(asset_type,data_type) do update set cadence=excluded.cadence,cadence_hours=excluded.cadence_hours,refresh_after_local_time=excluded.refresh_after_local_time,
market_timezone=excluded.market_timezone,automation_enabled=excluded.automation_enabled,max_staleness_hours=excluded.max_staleness_hours,notes=excluded.notes,updated_at=now();

insert into public.market_data_symbol_aliases(investment_id,source_id,provider_symbol,notes)
select i.id,s.id,v.provider_symbol,'Yahoo Finance research symbol; provider-specific and intentionally separated from the public fund code.'
from (values('RBF461','0P00007067.TO'),('RBF460','0P0000706A.TO'),('RBF459','0P00007069.TO'))v(symbol,provider_symbol)
join public.investments i on i.symbol=v.symbol and i.exchange='FUND'
join public.market_data_sources s on s.source_key='yahoo_free'
on conflict(investment_id,source_id) do update set provider_symbol=excluded.provider_symbol,is_active=true,notes=excluded.notes,updated_at=now();

create or replace function public.get_due_price_history_ingestion_plan(p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_plan jsonb;
begin
 select jsonb_agg(jsonb_build_object(
   'investment_id',x.investment_id,'symbol',x.symbol,'asset_type',x.asset_type,'country_code',x.country_code,'exchange',x.exchange,'currency',x.currency,
   'provider_symbol',x.provider_symbol,'latest_price_date',x.latest_price_date,'target_price_date',x.target_price_date,'cadence',x.cadence,
   'max_staleness_hours',x.max_staleness_hours,'selected_source',x.selected_source
 ) order by x.symbol) into v_plan
 from (
  select i.id investment_id,i.symbol,i.asset_type,i.country_code,i.exchange,i.currency,ph.latest_price_date,(timezone(p.market_timezone,p_now))::date target_price_date,
         p.cadence,p.max_staleness_hours,src.selected_source,alias.provider_symbol
  from public.investments i
  join public.market_data_refresh_policies p on p.asset_type=i.asset_type and p.data_type='price_history' and p.automation_enabled
  left join lateral(select max(h.price_date) latest_price_date from public.investment_price_history h where h.investment_id=i.id)ph on true
  left join lateral(select public.resolve_automated_market_data_source(i.id,'price_history') selected_source)src on true
  left join public.market_data_symbol_aliases alias on alias.investment_id=i.id and alias.is_active and alias.source_id=nullif(src.selected_source->>'source_id','')::uuid
  where i.is_active and (timezone(p.market_timezone,p_now))::time>=p.refresh_after_local_time
    and (ph.latest_price_date is null or ph.latest_price_date<(timezone(p.market_timezone,p_now))::date)
 )x;
 return coalesce(v_plan,'[]'::jsonb);
end;$$;
revoke all on function public.get_due_price_history_ingestion_plan(timestamptz) from public,anon,authenticated;
grant execute on function public.get_due_price_history_ingestion_plan(timestamptz) to service_role;
