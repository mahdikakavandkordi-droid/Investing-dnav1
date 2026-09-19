-- Temporary zero-cost Canadian ETF market-data route for pre-funding research use.
-- Yahoo Finance is treated as an unofficial, replaceable research feed.
-- It must never outrank verified issuer/internal source rows for the same date.

insert into public.market_data_sources(
  source_key,source_name,market_scope,priority,is_active,
  supports_history,supports_current,supports_adjusted_prices
)
values(
  'yahoo_free',
  'Yahoo Finance (temporary free research feed)',
  'CA',
  90,
  true,
  true,
  true,
  false
)
on conflict(source_key) do update
set source_name=excluded.source_name,
    market_scope=excluded.market_scope,
    priority=excluded.priority,
    is_active=excluded.is_active,
    supports_history=excluded.supports_history,
    supports_current=excluded.supports_current,
    supports_adjusted_prices=excluded.supports_adjusted_prices,
    updated_at=now();

insert into public.market_data_provider_adapters(
  source_id,provider_type,adapter_version,endpoint_template,symbol_transform,
  timezone,price_field,adjustment_policy,is_active
)
select
  s.id,
  'yahoo_finance_unofficial',
  'adapter-v1.0',
  'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}.TO?period1={period1}&period2={period2}&interval=1d&events=history',
  'append:.TO',
  'America/Toronto',
  'close',
  'as_provided',
  true
from public.market_data_sources s
where s.source_key='yahoo_free'
on conflict(source_id,adapter_version) do update
set provider_type=excluded.provider_type,
    endpoint_template=excluded.endpoint_template,
    symbol_transform=excluded.symbol_transform,
    timezone=excluded.timezone,
    price_field=excluded.price_field,
    adjustment_policy=excluded.adjustment_policy,
    is_active=excluded.is_active,
    updated_at=now();

delete from public.market_data_source_routing r
using public.market_data_sources s
where r.source_id=s.id
  and s.source_key='yahoo_free'
  and r.asset_type='ETF'
  and r.country_code='CA'
  and r.exchange='TSX';

insert into public.market_data_source_routing(
  source_id,asset_type,country_code,exchange,symbol_pattern,priority_override,is_active
)
select
  s.id,'ETF','CA','TSX',null,90,true
from public.market_data_sources s
where s.source_key='yahoo_free';
