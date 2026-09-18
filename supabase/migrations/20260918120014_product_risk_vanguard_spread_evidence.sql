-- Add source-backed Vanguard Canada ETF Facts bid-ask spread evidence.
-- Values are from the official ETF Facts pricing information for the 12 months ending May 31, 2026.
-- Also refresh VCN's official-risk evidence to the current July 16, 2026 ETF Facts.

with expected(symbol,spread_pct,source_url,source_version) as (
 values
 ('VAB',0.047::numeric,'https://fund-docs.vanguard.com/VAB_Canadian_Aggregate_Bond_Index_ETF_ETF_9552_EN_FACTS.pdf','2026-07-16'),
 ('VBAL',0.040::numeric,'https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf','2026-07-16'),
 ('VCB',0.087::numeric,'https://fund-docs.vanguard.com/VCB_Canadian_Corporate_Bond_Index_ETF_ETF_1936_EN_FACTS.pdf','2026-07-16'),
 ('VCN',0.031::numeric,'https://fund-docs.vanguard.com/VCN_FTSE_Canada_All_Cap_Index_ETF_ETF_9561_EN_FACTS.pdf','2026-07-16'),
 ('VCNS',0.051::numeric,'https://fund-docs.vanguard.com/9577-a-en-US_20260730.pdf','2026-07-30'),
 ('VDY',0.026::numeric,'https://fund-docs.vanguard.com/VDY_FTSE_Canadian_High_Dividend_Yield_Index_ETF_ETF_9560_EN_FACTS.pdf','2026-07-16'),
 ('VEE',0.035::numeric,'https://fund-docs.vanguard.com/VEE_FTSE_Emerging_Markets_All_Cap_Index_ETF_ETF_9556_EN_FACTS.pdf','2026-07-16'),
 ('VEQT',0.023::numeric,'https://fund-docs.vanguard.com/VEQT_All_Equity_ETF_Portfolio_ETF_9692_EN_FACTS.pdf','2026-07-16'),
 ('VFV',0.018::numeric,'https://fund-docs.vanguard.com/VFV_SnP_500_Index_ETF_ETF_9563_EN_FACTS.pdf','2026-07-16'),
 ('VGRO',0.031::numeric,'https://fund-docs.vanguard.com/VGRO_Growth_ETF_Portfolio_ETF_9579_EN_FACTS.pdf','2026-07-16'),
 ('VIU',0.036::numeric,'https://fund-docs.vanguard.com/VIU_FTSE_Developed_All_Cap_ex_North_America_Index_ETF_ETF_9569_EN_FACTS.pdf','2026-07-16'),
 ('VRE',0.138::numeric,'https://fund-docs.vanguard.com/9559-a-en-US_20260730.pdf','2026-07-30'),
 ('VSB',0.045::numeric,'https://fund-docs.vanguard.com/VSB_Canadian_Short_Term_Bond_Index_ETF_ETF_9553_EN_FACTS.pdf','2026-07-16'),
 ('VUN',0.027::numeric,'https://fund-docs.vanguard.com/ETF-Facts-VUN-VUS-E.pdf','2026-07-29'),
 ('VXC',0.034::numeric,'https://fund-docs.vanguard.com/VXC_FTSE_Global_All_Cap_ex_Canada_Index_ETF_ETF_9548_EN_FACTS.pdf','2026-07-16')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Vanguard Canada ETF Facts','issuer_official',e.source_url,
       'identity,profile,metrics,risk,official_facts,trading',
       now(),e.source_version,
       'Official Vanguard Canada ETF Facts; trading and pricing information for the 12 months ending May 31, 2026.'
from expected e
join public.investments i on i.symbol=e.symbol
where not exists (
  select 1 from public.investment_data_sources s
  where s.investment_id=i.id and s.source_url=e.source_url and s.source_name='Vanguard Canada ETF Facts'
);

with expected(symbol,spread_pct,source_url) as (
 values
 ('VAB',0.047::numeric,'https://fund-docs.vanguard.com/VAB_Canadian_Aggregate_Bond_Index_ETF_ETF_9552_EN_FACTS.pdf'),
 ('VBAL',0.040::numeric,'https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf'),
 ('VCB',0.087::numeric,'https://fund-docs.vanguard.com/VCB_Canadian_Corporate_Bond_Index_ETF_ETF_1936_EN_FACTS.pdf'),
 ('VCN',0.031::numeric,'https://fund-docs.vanguard.com/VCN_FTSE_Canada_All_Cap_Index_ETF_ETF_9561_EN_FACTS.pdf'),
 ('VCNS',0.051::numeric,'https://fund-docs.vanguard.com/9577-a-en-US_20260730.pdf'),
 ('VDY',0.026::numeric,'https://fund-docs.vanguard.com/VDY_FTSE_Canadian_High_Dividend_Yield_Index_ETF_ETF_9560_EN_FACTS.pdf'),
 ('VEE',0.035::numeric,'https://fund-docs.vanguard.com/VEE_FTSE_Emerging_Markets_All_Cap_Index_ETF_ETF_9556_EN_FACTS.pdf'),
 ('VEQT',0.023::numeric,'https://fund-docs.vanguard.com/VEQT_All_Equity_ETF_Portfolio_ETF_9692_EN_FACTS.pdf'),
 ('VFV',0.018::numeric,'https://fund-docs.vanguard.com/VFV_SnP_500_Index_ETF_ETF_9563_EN_FACTS.pdf'),
 ('VGRO',0.031::numeric,'https://fund-docs.vanguard.com/VGRO_Growth_ETF_Portfolio_ETF_9579_EN_FACTS.pdf'),
 ('VIU',0.036::numeric,'https://fund-docs.vanguard.com/VIU_FTSE_Developed_All_Cap_ex_North_America_Index_ETF_ETF_9569_EN_FACTS.pdf'),
 ('VRE',0.138::numeric,'https://fund-docs.vanguard.com/9559-a-en-US_20260730.pdf'),
 ('VSB',0.045::numeric,'https://fund-docs.vanguard.com/VSB_Canadian_Short_Term_Bond_Index_ETF_ETF_9553_EN_FACTS.pdf'),
 ('VUN',0.027::numeric,'https://fund-docs.vanguard.com/ETF-Facts-VUN-VUS-E.pdf'),
 ('VXC',0.034::numeric,'https://fund-docs.vanguard.com/VXC_FTSE_Global_All_Cap_ex_Canada_Index_ETF_ETF_9548_EN_FACTS.pdf')
)
insert into public.investment_observed_indicators(
  investment_id,observed_at,metric_key,metric_value_numeric,unit,
  source_id,source_as_of_date,source_note
)
select i.id,
       timestamptz '2026-05-31 23:59:59+00',
       'bid_ask_spread_pct',
       e.spread_pct,
       'percent',
       s.id,
       date '2026-05-31',
       'Vanguard Canada ETF Facts pricing information for the 12 months ending May 31, 2026.'
from expected e
join public.investments i on i.symbol=e.symbol
join lateral (
  select ds.id
  from public.investment_data_sources ds
  where ds.investment_id=i.id
    and ds.source_url=e.source_url
    and ds.source_name='Vanguard Canada ETF Facts'
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

update public.investment_official_risk_ratings rr
set source_type='ETF Facts',
    source_title='Vanguard FTSE Canada All Cap Index ETF — ETF Facts',
    source_url='https://fund-docs.vanguard.com/VCN_FTSE_Canada_All_Cap_Index_ETF_ETF_9561_EN_FACTS.pdf',
    source_date=date '2026-07-16',
    effective_date=date '2026-07-16',
    verification_note='Verified from Vanguard ETF Facts dated July 16, 2026; risk rating Medium.',
    verified_at=now(),
    updated_at=now()
from public.investments i
where rr.investment_id=i.id
  and i.symbol='VCN'
  and rr.official_risk_rating='Medium';

do $$
declare n integer;
begin
  select count(*) into n
  from public.investment_observed_indicators o
  join public.investments i on i.id=o.investment_id
  where i.symbol=any(array['VAB','VBAL','VCB','VCN','VCNS','VDY','VEE','VEQT','VFV','VGRO','VIU','VRE','VSB','VUN','VXC'])
    and o.metric_key='bid_ask_spread_pct'
    and o.observed_at=timestamptz '2026-05-31 23:59:59+00'
    and o.source_id is not null;
  if n<>15 then raise exception 'Expected 15 source-backed Vanguard spread indicators, found %',n; end if;
end $$;

select investor_private.refresh_product_risk_draft(i.id)
from public.investments i
where i.symbol=any(array['VAB','VBAL','VCB','VCN','VCNS','VDY','VEE','VEQT','VFV','VGRO','VIU','VRE','VSB','VUN','VXC']);
