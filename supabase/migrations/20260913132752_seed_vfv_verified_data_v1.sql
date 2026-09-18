insert into public.investment_data_sources (investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes)
select id,'Vanguard Canada','official','https://www.vanguard.ca/en/product/etf/equity/9563/vanguard-sp-500-index-etf','metrics,risk,price,holdings,profile',now(),'2026-09','Official Vanguard Canada product page; performance/risk as of Jul-Aug 2026 and price as of Sep 10 2026.' from public.investments where symbol='VFV'
on conflict do nothing;

insert into public.investment_metrics (investment_id,as_of_date,price,return_1m_pct,return_3m_pct,return_1y_pct,return_3y_annualized_pct,return_5y_annualized_pct,yield_pct,distribution_frequency,mer_pct,aum,shares_outstanding)
select id,'2026-08-31',186.55,1.49,2.13,21.08,21.72,14.59,0.84,'quarterly',0.08,35160000000,185910000 from public.investments where symbol='VFV';

insert into public.investment_risk_metrics (investment_id,as_of_date,risk_level,standard_deviation_pct,beta,sharpe_ratio)
select id,'2026-07-31','High',12.15,1.00,1.37 from public.investments where symbol='VFV';

insert into public.investment_price_history (investment_id,price_date,close_price,nav,currency,source_id)
select i.id,v.d,v.p,v.p,'CAD',s.id from public.investments i cross join (values
('2026-08-31'::date,189.16::numeric),('2026-09-01'::date,188.33),('2026-09-02'::date,188.39),('2026-09-03'::date,189.58),('2026-09-04'::date,189.54),('2026-09-08'::date,187.76),('2026-09-09'::date,187.27),('2026-09-10'::date,186.50)) v(d,p)
join public.investment_data_sources s on s.investment_id=i.id and s.source_name='Vanguard Canada'
where i.symbol='VFV';

insert into public.investment_holdings (investment_id,as_of_date,holding_symbol,holding_name,country_code,sector,asset_type,weight_pct,source_id)
select i.id,'2026-07-31',v.sym,v.nm,'US',v.sec,'Equity',v.w,s.id from public.investments i cross join (values
('NVDA','NVIDIA Corp','Information Technology',7.54532::numeric),('AAPL','Apple Inc','Information Technology',7.04107),('MSFT','Microsoft Corp','Information Technology',5.35735),('AMZN','Amazon.com Inc','Consumer Discretionary',4.12577),('GOOGL','Alphabet Inc','Communication Services',3.24070)) v(sym,nm,sec,w)
join public.investment_data_sources s on s.investment_id=i.id and s.source_name='Vanguard Canada'
where i.symbol='VFV';

update public.investments set data_status='verified_partial',updated_at=now() where symbol='VFV';