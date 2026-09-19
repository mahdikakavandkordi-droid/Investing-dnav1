
with expected(symbol,spread_pct,source_url) as (
 values
 ('XAW',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xaw-facts-en-ca.pdf'),
 ('XBAL',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xbal-facts-en-ca.pdf'),
 ('XCB',0.05::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xcb-facts-en-ca.pdf'),
 ('XEC',0.06::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xec-facts-en-ca.pdf'),
 ('XEF',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xef-facts-en-ca.pdf'),
 ('XEI',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xei-facts-en-ca.pdf'),
 ('XEQT',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xeqt-facts-en-ca.pdf'),
 ('XGRO',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xgro-facts-en-ca.pdf'),
 ('XIC',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xic-facts-en-ca.pdf'),
 ('XIT',0.16::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xit-facts-en-ca.pdf'),
 ('XIU',0.02::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xiu-facts-en-ca.pdf'),
 ('XRE',0.08::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xre-facts-en-ca.pdf'),
 ('XSB',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xsb-facts-en-ca.pdf'),
 ('XSH',0.06::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xsh-facts-en-ca.pdf'),
 ('XSP',0.02::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xsp-facts-en-ca.pdf'),
 ('XUS',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xus-facts-en-ca.pdf'),
 ('XUU',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xuu-facts-en-ca.pdf')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'BlackRock Canada ETF Facts','issuer_official',e.source_url,
       'identity,profile,metrics,risk,official_facts,trading',
       now(),'2026-06-19',
       'Official BlackRock ETF Facts dated June 19, 2026; includes trading and pricing information for the 12 months ending April 30, 2026.'
from expected e
join public.investments i on i.symbol=e.symbol
where not exists (
  select 1 from public.investment_data_sources s
  where s.investment_id=i.id and s.source_url=e.source_url
);

with expected(symbol,spread_pct,source_url) as (
 values
 ('XAW',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xaw-facts-en-ca.pdf'),
 ('XBAL',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xbal-facts-en-ca.pdf'),
 ('XCB',0.05::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xcb-facts-en-ca.pdf'),
 ('XEC',0.06::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xec-facts-en-ca.pdf'),
 ('XEF',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xef-facts-en-ca.pdf'),
 ('XEI',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xei-facts-en-ca.pdf'),
 ('XEQT',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xeqt-facts-en-ca.pdf'),
 ('XGRO',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xgro-facts-en-ca.pdf'),
 ('XIC',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xic-facts-en-ca.pdf'),
 ('XIT',0.16::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xit-facts-en-ca.pdf'),
 ('XIU',0.02::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xiu-facts-en-ca.pdf'),
 ('XRE',0.08::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xre-facts-en-ca.pdf'),
 ('XSB',0.04::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xsb-facts-en-ca.pdf'),
 ('XSH',0.06::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xsh-facts-en-ca.pdf'),
 ('XSP',0.02::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xsp-facts-en-ca.pdf'),
 ('XUS',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xus-facts-en-ca.pdf'),
 ('XUU',0.03::numeric,'https://www.blackrock.com/ca/investors/en/literature/etf-summary/xuu-facts-en-ca.pdf')
)
insert into public.investment_observed_indicators(
  investment_id,observed_at,metric_key,metric_value_numeric,unit,
  source_id,source_as_of_date,source_note
)
select i.id,
       timestamptz '2026-04-30 23:59:59+00',
       'bid_ask_spread_pct',
       e.spread_pct,
       'percent',
       s.id,
       date '2026-04-30',
       'BlackRock ETF Facts trading information for the 12 months ending April 30, 2026.'
from expected e
join public.investments i on i.symbol=e.symbol
join lateral (
  select ds.id
  from public.investment_data_sources ds
  where ds.investment_id=i.id and ds.source_url=e.source_url
  order by ds.retrieved_at desc,ds.created_at desc
  limit 1
) s on true
on conflict (investment_id,observed_at,metric_key)
do update set
  metric_value_numeric=excluded.metric_value_numeric,
  unit=excluded.unit,
  source_id=excluded.source_id,
  source_as_of_date=excluded.source_as_of_date,
  source_note=excluded.source_note;

do $$
declare n integer;
begin
  select count(*) into n
  from public.investment_observed_indicators o
  join public.investments i on i.id=o.investment_id
  where i.symbol=any(array['XAW','XBAL','XCB','XEC','XEF','XEI','XEQT','XGRO','XIC','XIT','XIU','XRE','XSB','XSH','XSP','XUS','XUU'])
    and o.metric_key='bid_ask_spread_pct'
    and o.observed_at=timestamptz '2026-04-30 23:59:59+00'
    and o.source_id is not null;
  if n<>17 then raise exception 'Expected 17 source-backed iShares spread indicators, found %',n; end if;
end $$;

select investor_private.refresh_product_risk_draft(i.id)
from public.investments i
where i.symbol=any(array['XAW','XBAL','XCB','XEC','XEF','XEI','XEQT','XGRO','XIC','XIT','XIU','XRE','XSB','XSH','XSP','XUS','XUU']);
