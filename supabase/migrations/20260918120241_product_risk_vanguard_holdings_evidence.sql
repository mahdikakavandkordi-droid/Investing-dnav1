-- Add official Vanguard ETF Facts diversification evidence using each fund's
-- total number of investments reported for May 31, 2026.

with expected(symbol,number_of_holdings,source_url) as (
 values
 ('VAB',1310::integer,'https://fund-docs.vanguard.com/VAB_Canadian_Aggregate_Bond_Index_ETF_ETF_9552_EN_FACTS.pdf'),
 ('VBAL',30948,'https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf'),
 ('VCB',855,'https://fund-docs.vanguard.com/VCB_Canadian_Corporate_Bond_Index_ETF_ETF_1936_EN_FACTS.pdf'),
 ('VCN',215,'https://fund-docs.vanguard.com/VCN_FTSE_Canada_All_Cap_Index_ETF_ETF_9561_EN_FACTS.pdf'),
 ('VCNS',30948,'https://fund-docs.vanguard.com/9577-a-en-US_20260730.pdf'),
 ('VDY',61,'https://fund-docs.vanguard.com/VDY_FTSE_Canadian_High_Dividend_Yield_Index_ETF_ETF_9560_EN_FACTS.pdf'),
 ('VEE',6348,'https://fund-docs.vanguard.com/VEE_FTSE_Emerging_Markets_All_Cap_Index_ETF_ETF_9556_EN_FACTS.pdf'),
 ('VEQT',13706,'https://fund-docs.vanguard.com/VEQT_All_Equity_ETF_Portfolio_ETF_9692_EN_FACTS.pdf'),
 ('VFV',505,'https://fund-docs.vanguard.com/VFV_SnP_500_Index_ETF_ETF_9563_EN_FACTS.pdf'),
 ('VGRO',30948,'https://fund-docs.vanguard.com/VGRO_Growth_ETF_Portfolio_ETF_9579_EN_FACTS.pdf'),
 ('VIU',3659,'https://fund-docs.vanguard.com/VIU_FTSE_Developed_All_Cap_ex_North_America_Index_ETF_ETF_9569_EN_FACTS.pdf'),
 ('VRE',19,'https://fund-docs.vanguard.com/9559-a-en-US_20260730.pdf'),
 ('VSB',576,'https://fund-docs.vanguard.com/VSB_Canadian_Short_Term_Bond_Index_ETF_ETF_9553_EN_FACTS.pdf'),
 ('VUN',3484,'https://fund-docs.vanguard.com/ETF-Facts-VUN-VUS-E.pdf'),
 ('VXC',11725,'https://fund-docs.vanguard.com/VXC_FTSE_Global_All_Cap_ex_Canada_Index_ETF_ETF_9548_EN_FACTS.pdf')
),
src as (
 select i.id investment_id,e.symbol,e.number_of_holdings,
        (select s.id
         from public.investment_data_sources s
         where s.investment_id=i.id
           and s.source_url=e.source_url
           and s.source_name='Vanguard Canada ETF Facts'
         order by s.retrieved_at desc,s.created_at desc
         limit 1) source_id
 from expected e
 join public.investments i on i.symbol=e.symbol
)
insert into public.investment_portfolio_characteristics(
  investment_id,as_of_date,number_of_holdings,source_id
)
select investment_id,date '2026-05-31',number_of_holdings,source_id
from src
on conflict(investment_id,as_of_date) do update
set number_of_holdings=excluded.number_of_holdings,
    source_id=coalesce(excluded.source_id,public.investment_portfolio_characteristics.source_id);

do $$
declare n integer;
begin
  select count(*) into n
  from public.investment_portfolio_characteristics pc
  join public.investments i on i.id=pc.investment_id
  where i.symbol=any(array['VAB','VBAL','VCB','VCN','VCNS','VDY','VEE','VEQT','VFV','VGRO','VIU','VRE','VSB','VUN','VXC'])
    and pc.as_of_date=date '2026-05-31'
    and pc.number_of_holdings is not null
    and pc.source_id is not null;
  if n<>15 then raise exception 'Expected 15 source-backed Vanguard holdings counts, found %',n; end if;
end $$;

select investor_private.refresh_product_risk_draft(i.id)
from public.investments i
where i.symbol=any(array['VAB','VBAL','VCB','VCN','VCNS','VDY','VEE','VEQT','VFV','VGRO','VIU','VRE','VSB','VUN','VXC']);
