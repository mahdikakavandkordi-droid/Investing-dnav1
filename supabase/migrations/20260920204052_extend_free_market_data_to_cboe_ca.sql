
-- Extend temporary zero-cost Canadian ETF market-data route to Cboe Canada.
-- Yahoo Finance is an unofficial research feed and remains lower priority than verified issuer/internal data.

insert into public.market_data_source_routing(
  source_id,asset_type,country_code,exchange,symbol_pattern,priority_override,is_active
)
select s.id,'ETF','CA','Cboe CA',null,90,true
from public.market_data_sources s
where s.source_key='yahoo_free'
  and not exists (
    select 1
    from public.market_data_source_routing r
    where r.source_id=s.id
      and r.asset_type='ETF'
      and r.country_code='CA'
      and r.exchange='Cboe CA'
      and r.symbol_pattern is null
  );

update public.market_data_provider_adapters a
set endpoint_template='https://query1.finance.yahoo.com/v8/finance/chart/{symbol}{exchange_suffix}?period1={period1}&period2={period2}&interval=1d&events=history',
    symbol_transform='TSX=>append:.TO; Cboe CA=>append:.NE',
    updated_at=now()
from public.market_data_sources s
where a.source_id=s.id
  and s.source_key='yahoo_free'
  and a.adapter_version='adapter-v1.0';
