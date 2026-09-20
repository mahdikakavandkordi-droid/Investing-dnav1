
-- Canada ETF research enrichment v1
-- Adds only issuer-sourced performance, income, holdings, exposures and characteristics.
-- Missing values remain null. No Match validation is granted here.

with src(symbol,source_name,url,source_version,notes) as (
  values
  ('TTP','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TPU','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TDB','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TCSH','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7114&fundname=TD-Cash-Management-ETF','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TGRO','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TEQT','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7418&fundname=TD-All-Equity-ETF-Portfolio','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TEC','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TQCD','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF','2026-09-20','Official TD fund card / TDAM spotlight performance source.'),
  ('THE','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6905&fundname=TD-International-Equity-CAD-Hedged-Index-ETF','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.'),
  ('TCOM','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7471&fundname=TD-Alternative-Commodities-Pool-ETF-Series','2026-09-20','Official TD fund card; current holdings/portfolio analysis captured in September 2026.')
)
insert into public.investment_data_sources(
 investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,s.source_name,'official',s.url,'current_holdings,portfolio_analysis,performance',now(),s.source_version,s.notes
from src s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
where not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id and x.source_url=s.url and x.source_version=s.source_version
);

-- Verified issuer total returns.
with perf(symbol,as_of_date,r1m,r3m,r1y,r3y,r5y,si,source_url,source_note) as (
 values
 ('CASH','2026-08-31'::date,0.17::numeric,0.53::numeric,2.13::numeric,3.36::numeric,null::numeric,3.29::numeric,'https://www.globalx.ca/product/cash','Global X annualized performance table as at 2026-08-31.'),
 ('CBIL','2026-08-31',0.18,0.56,2.26,3.43,null,3.54,'https://www.globalx.ca/product/cbil','Global X annualized performance table as at 2026-08-31.'),
 ('HXT','2026-08-31',2.29,5.79,28.29,23.85,14.86,10.35,'https://www.globalx.ca/product/hxt','Global X annualized performance table as at 2026-08-31.'),
 ('HXS','2026-08-31',1.51,2.06,20.74,21.41,14.37,16.45,'https://www.globalx.ca/product/hxs','Global X annualized performance table as at 2026-08-31.'),
 ('HXQ','2026-08-31',3.01,-2.31,27.28,25.29,16.17,21.32,'https://www.globalx.ca/product/hxq','Global X annualized performance table as at 2026-08-31.'),
 ('AIQ','2026-08-31',7.95,-3.93,44.19,null,null,33.62,'https://www.globalx.ca/product/aiq','Global X annualized performance table as at 2026-08-31; 3-year and 5-year returns are unavailable because of fund age.'),
 ('PSA','2026-08-31',0.19,0.56,2.26,3.48,3.25,2.03,'https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund/performance','Purpose ETF compound returns as at 2026-08-31.'),
 ('TQCD','2026-06-30',null,7.05,34.77,27.56,18.34,14.91,'https://www.td.com/ca/en/asset-management/spotlight','TDAM spotlight performance table as at 2026-06-30.')
)
insert into public.investment_performance_history(
 investment_id,as_of_date,return_1m_pct,return_3m_pct,return_1y_pct,return_3y_annualized_pct,
 return_5y_annualized_pct,since_inception_annualized_pct,return_basis,source_id,source_note,verification_status
)
select i.id,p.as_of_date,p.r1m,p.r3m,p.r1y,p.r3y,p.r5y,p.si,'issuer_total_return',
       (select s.id from public.investment_data_sources s
        where s.investment_id=i.id and s.source_url=p.source_url order by s.created_at desc limit 1),
       p.source_note,'issuer_verified'
from perf p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,return_basis) do update set
 return_1m_pct=excluded.return_1m_pct,
 return_3m_pct=excluded.return_3m_pct,
 return_1y_pct=excluded.return_1y_pct,
 return_3y_annualized_pct=excluded.return_3y_annualized_pct,
 return_5y_annualized_pct=excluded.return_5y_annualized_pct,
 since_inception_annualized_pct=excluded.since_inception_annualized_pct,
 source_id=excluded.source_id,
 source_note=excluded.source_note,
 verification_status='issuer_verified';

-- Cash / ultra-short income snapshots.
with inc(symbol,as_of_date,trailing_yield,distribution_yield,last_dist,source_url,note) as (
 values
 ('CASH','2026-08-31'::date,2.06::numeric,2.02::numeric,0.08430::numeric,'https://www.globalx.ca/product/cash','Global X: 12-month trailing yield at month-end; annualized distribution yield observed 2026-09-10.'),
 ('CBIL','2026-08-31',2.23,2.15,0.08970,'https://www.globalx.ca/product/cbil','Global X: 12-month trailing yield at month-end; annualized distribution yield observed 2026-09-09.'),
 ('PSA','2026-08-31',null,2.18,0.0866,'https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund','Purpose: net yield observed 2026-09-10 and August 2026 regular distribution.')
)
insert into public.investment_income_history(
 investment_id,as_of_date,trailing_yield_pct,distribution_yield_pct,distribution_frequency,
 last_distribution_per_unit,source_id,source_note
)
select i.id,x.as_of_date,x.trailing_yield,x.distribution_yield,'Monthly',x.last_dist,
       (select s.id from public.investment_data_sources s
        where s.investment_id=i.id and s.source_url=x.source_url order by s.created_at desc limit 1),
       x.note
from inc x join public.investments i on i.symbol=x.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 trailing_yield_pct=excluded.trailing_yield_pct,
 distribution_yield_pct=excluded.distribution_yield_pct,
 distribution_frequency=excluded.distribution_frequency,
 last_distribution_per_unit=excluded.last_distribution_per_unit,
 source_id=excluded.source_id,
 source_note=excluded.source_note;

-- Current official portfolio characteristics.
with pc(symbol,as_of_date,nh,ns,nb,ytm,dur,mat,pe,pb,source_url) as (
 values
 ('TTP','2026-09-15'::date,327,327,null::int,null::numeric,null::numeric,null::numeric,21.3::numeric,2.7::numeric,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF'),
 ('TPU','2026-09-10',503,503,null,null,null,null,27.1,5.4,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF'),
 ('TDB','2026-09-10',1582,null,1582,3.76,6.78,9.36,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF'),
 ('TCSH','2026-09-10',174,null,174,null,null,null,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7114&fundname=TD-Cash-Management-ETF'),
 ('TGRO','2026-09-10',5,null,null,0.56,0.99,1.37,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio'),
 ('TEQT','2026-09-10',4,null,null,null,null,null,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7418&fundname=TD-All-Equity-ETF-Portfolio'),
 ('TEC','2026-09-10',241,241,null,null,null,null,31.1,9.0,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF'),
 ('THE','2026-09-10',4,null,null,null,null,null,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6905&fundname=TD-International-Equity-CAD-Hedged-Index-ETF')
)
insert into public.investment_portfolio_characteristics(
 investment_id,as_of_date,number_of_holdings,number_of_stocks,number_of_bonds,
 yield_to_maturity_pct,average_duration_years,average_maturity_years,pe_ratio,pb_ratio,source_id
)
select i.id,p.as_of_date,p.nh,p.ns,p.nb,p.ytm,p.dur,p.mat,p.pe,p.pb,
       (select s.id from public.investment_data_sources s
        where s.investment_id=i.id and s.source_url=p.source_url order by s.created_at desc limit 1)
from pc p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 number_of_holdings=coalesce(excluded.number_of_holdings,public.investment_portfolio_characteristics.number_of_holdings),
 number_of_stocks=coalesce(excluded.number_of_stocks,public.investment_portfolio_characteristics.number_of_stocks),
 number_of_bonds=coalesce(excluded.number_of_bonds,public.investment_portfolio_characteristics.number_of_bonds),
 yield_to_maturity_pct=coalesce(excluded.yield_to_maturity_pct,public.investment_portfolio_characteristics.yield_to_maturity_pct),
 average_duration_years=coalesce(excluded.average_duration_years,public.investment_portfolio_characteristics.average_duration_years),
 average_maturity_years=coalesce(excluded.average_maturity_years,public.investment_portfolio_characteristics.average_maturity_years),
 pe_ratio=coalesce(excluded.pe_ratio,public.investment_portfolio_characteristics.pe_ratio),
 pb_ratio=coalesce(excluded.pb_ratio,public.investment_portfolio_characteristics.pb_ratio),
 source_id=coalesce(excluded.source_id,public.investment_portfolio_characteristics.source_id);

-- Sourced top/full holdings. These are intentionally not expanded beyond what the official page exposed.
with h(symbol,as_of_date,name,weight,asset_type,source_url) as (
 values
 ('TTP','2026-09-15'::date,'Royal Bank of Canada - Common',7.75::numeric,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF'),
 ('TTP','2026-09-15','Toronto-Dominion Bank - Common',5.46,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF'),
 ('TTP','2026-09-15','Shopify Inc - Common Cl A',4.17,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF'),
 ('TTP','2026-09-15','Bank of Montreal - Common',3.35,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF'),
 ('TTP','2026-09-15','Bank of Nova Scotia - Common',3.14,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6901&fundname=TD-Canadian-Equity-Index-ETF'),
 ('TPU','2026-09-10','NVIDIA Corp - Common',7.73,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF'),
 ('TPU','2026-09-10','Apple Inc - Common',7.12,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF'),
 ('TPU','2026-09-10','Microsoft Corp - Common',5.50,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF'),
 ('TPU','2026-09-10','Amazon.com Inc - Common',3.69,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF'),
 ('TPU','2026-09-10','Alphabet Inc - Common Cl A',2.96,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6902&fundname=TD-U.S.-Equity-Index-ETF'),
 ('TDB','2026-09-10','Canadian Government Bond',1.55,'Fixed Income','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF'),
 ('TDB','2026-09-10','Canada Government 3.25% 01-Jun-2036',1.54,'Fixed Income','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF'),
 ('TDB','2026-09-10','Canada Government 2.75% 01-Sep-2030',1.49,'Fixed Income','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF'),
 ('TDB','2026-09-10','Canada Government 1.50% 01-Jun-2031',1.43,'Fixed Income','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF'),
 ('TDB','2026-09-10','Canada Government 1.50% 01-Dec-2031',1.33,'Fixed Income','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6900&fundname=TD-Canadian-Aggregate-Bond-Index-ETF'),
 ('TEQT','2026-09-10','TD U.S. Equity Index ETF (TPU)',54.96,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7418&fundname=TD-All-Equity-ETF-Portfolio'),
 ('TEQT','2026-09-10','TD Canadian Equity Index ETF (TTP)',24.97,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7418&fundname=TD-All-Equity-ETF-Portfolio'),
 ('TEQT','2026-09-10','TD International Equity Index ETF (TPE)',20.02,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7418&fundname=TD-All-Equity-ETF-Portfolio'),
 ('TEQT','2026-09-10','CASH',0.05,'Cash','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7418&fundname=TD-All-Equity-ETF-Portfolio'),
 ('TGRO','2026-09-10','TD U.S. Equity Index ETF (TPU)',39.95,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio'),
 ('TGRO','2026-09-10','TD Canadian Equity Index ETF (TTP)',24.86,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio'),
 ('TGRO','2026-09-10','TD International Equity Index ETF (TPE)',20.01,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio'),
 ('TGRO','2026-09-10','TD Canadian Aggregate Bond Index ETF (TDB)',15.11,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio'),
 ('TGRO','2026-09-10','CASH',0.08,'Cash','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7151&fundname=TD-Growth-ETF-Portfolio'),
 ('THE','2026-09-10','TD International Equity Index ETF (TPE)',100.35,'ETF','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6905&fundname=TD-International-Equity-CAD-Hedged-Index-ETF'),
 ('THE','2026-09-10','CASH',0.57,'Cash','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6905&fundname=TD-International-Equity-CAD-Hedged-Index-ETF'),
 ('THE','2026-09-10','JPY Currency',0.01,'Currency','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6905&fundname=TD-International-Equity-CAD-Hedged-Index-ETF'),
 ('THE','2026-09-10','CAD Currency',-0.93,'Currency','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=6905&fundname=TD-International-Equity-CAD-Hedged-Index-ETF'),
 ('TEC','2026-09-10','NVIDIA Corp - Common',12.70,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF'),
 ('TEC','2026-09-10','Apple Inc - Common',11.68,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF'),
 ('TEC','2026-09-10','Microsoft Corp - Common',9.02,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF'),
 ('TEC','2026-09-10','Amazon.com Inc - Common',6.05,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF'),
 ('TEC','2026-09-10','Alphabet Inc - Common Cl A',4.86,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7113&fundname=TD-Global-Technology-Leaders-Index-ETF'),
 ('TQCD','2026-08-31','Bank of Nova Scotia - Common',3.93,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','Royal Bank of Canada - Common',3.91,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','Canadian Imperial Bank of Commerce - Common',3.79,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','National Bank of Canada - Common',3.59,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','Bank of Montreal - Common',3.58,'Equity','https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('CASH','2026-08-31','NATIONAL BANK CASH ACCT',49.53,'Cash','https://www.globalx.ca/product/cash'),
 ('CASH','2026-08-31','SCOTIABANK CASH ACCOUNT',28.03,'Cash','https://www.globalx.ca/product/cash'),
 ('CASH','2026-08-31','CIBC CASH ACCOUNT',14.76,'Cash','https://www.globalx.ca/product/cash'),
 ('CASH','2026-08-31','SCOTIABANK CASH ACCT 2',4.52,'Cash','https://www.globalx.ca/product/cash'),
 ('CASH','2026-08-31','CIBC MELLON CASH ACCOUNT',3.17,'Cash','https://www.globalx.ca/product/cash'),
 ('CBIL','2026-08-31','CANADIAN TREASURY BILL 02-12-2026',28.34,'Fixed Income','https://www.globalx.ca/product/cbil'),
 ('CBIL','2026-08-31','CANADIAN TREASURY BILL 21-10-2026',19.16,'Fixed Income','https://www.globalx.ca/product/cbil'),
 ('CBIL','2026-08-31','CANADIAN TREASURY BILL 09-09-2026',17.40,'Fixed Income','https://www.globalx.ca/product/cbil'),
 ('CBIL','2026-08-31','CANADIAN TREASURY BILL 23-09-2026',14.35,'Fixed Income','https://www.globalx.ca/product/cbil'),
 ('CBIL','2026-08-31','CANADIAN TREASURY BILL 04-11-2026',12.91,'Fixed Income','https://www.globalx.ca/product/cbil'),
 ('HXT','2026-08-31','ROYAL BANK OF CANADA',9.56,'Equity','https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','TORONTO-DOMINION BANK/THE',6.76,'Equity','https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','SHOPIFY INC',6.01,'Equity','https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','BANK OF MONTREAL',4.00,'Equity','https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','BANK OF NOVA SCOTIA/THE',3.76,'Equity','https://www.globalx.ca/product/hxt'),
 ('HXS','2026-08-31','NVIDIA CORP',8.09,'Equity','https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','APPLE INC',7.04,'Equity','https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','MICROSOFT CORP',5.70,'Equity','https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','ALPHABET INC',5.41,'Equity','https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','AMAZON.COM INC',3.85,'Equity','https://www.globalx.ca/product/hxs'),
 ('HXQ','2026-08-31','GLOBAL X NASDAQ-100 INDEX ETF (QQQX.U)',49.85,'ETF','https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','NVIDIA CORP',4.27,'Equity','https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','APPLE INC',3.72,'Equity','https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','ALPHABET INC',3.04,'Equity','https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','MICROSOFT CORP',3.02,'Equity','https://www.globalx.ca/product/hxq'),
 ('AIQ','2026-08-31','GLOBAL X ARTIFICIAL INTELLIGENCE & TECHNOLOGY ETF (AIQ)',99.89,'ETF','https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','CASH & CASH EQUIVALENTS',0.11,'Cash','https://www.globalx.ca/product/aiq'),
 ('PSA','2026-03-31','National Bank of Canada Cash Account',49.18,'Cash','https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund'),
 ('PSA','2026-03-31','Manulife Bank of Canada Cash Account',13.91,'Cash','https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund'),
 ('PSA','2026-03-31','Scotiabank Cash Account II',10.73,'Cash','https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund'),
 ('PSA','2026-03-31','Scotiabank Notice Deposit Account',9.83,'Cash','https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund'),
 ('PSA','2026-03-31','Canadian Treasury Bill 2.226% Due May 06 2026',5.33,'Fixed Income','https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund')
)
insert into public.investment_holdings(
 investment_id,as_of_date,holding_name,asset_type,weight_pct,source_id
)
select i.id,h.as_of_date,h.name,h.asset_type,h.weight,
       (select s.id from public.investment_data_sources s
        where s.investment_id=i.id and s.source_url=h.source_url order by s.created_at desc limit 1)
from h join public.investments i on i.symbol=h.symbol and i.exchange='TSX'
where h.weight >= 0
on conflict (investment_id,as_of_date,holding_name) do update set
 asset_type=excluded.asset_type,
 weight_pct=excluded.weight_pct,
 source_id=excluded.source_id;

-- Complete or explicitly partial exposure sets from issuer portfolio analysis.
with e(symbol,as_of_date,dimension,bucket,weight,coverage,is_complete,source_url) as (
 values
 ('CASH','2026-08-31'::date,'sector','CANADIAN CASH SWEEP',96.83::numeric,100::numeric,true,'https://www.globalx.ca/product/cash'),
 ('CASH','2026-08-31','sector','CHARTERED BANKS',3.17,100,true,'https://www.globalx.ca/product/cash'),
 ('CASH','2026-08-31','country','CANADA',100,100,true,'https://www.globalx.ca/product/cash'),
 ('CBIL','2026-08-31','sector','GOVERNMENTS',100,100,true,'https://www.globalx.ca/product/cbil'),
 ('CBIL','2026-08-31','country','CANADA',100,100,true,'https://www.globalx.ca/product/cbil'),
 ('HXT','2026-08-31','sector','FINANCIALS',40.38,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','ENERGY',17.08,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','MATERIALS',14.49,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','INFORMATION TECHNOLOGY',9.45,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','INDUSTRIALS',7.77,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','CONSUMER STAPLES',3.32,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','CONSUMER DISCRETIONARY',3.16,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','UTILITIES',2.44,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','COMMUNICATION SERVICES',1.72,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXT','2026-08-31','sector','REAL ESTATE',0.19,99.99,true,'https://www.globalx.ca/product/hxt'),
 ('HXS','2026-08-31','country','UNITED STATES',98.37,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','country','IRELAND',0.99,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','country','SWITZERLAND',0.29,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','country','UNITED KINGDOM',0.17,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','country','NETHERLANDS',0.09,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','country','BERMUDA',0.07,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXS','2026-08-31','country','CANADA',0.02,100,true,'https://www.globalx.ca/product/hxs'),
 ('HXQ','2026-08-31','sector','TECHNOLOGY',58.76,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','COMMUNICATION SERVICES',13.43,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','CONSUMER SERVICES',11.27,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','CONSUMER PRODUCTS',6.22,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','HEALTH CARE SERVICES',4.02,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','INDUSTRIAL PRODUCTS',3.24,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','UTILITIES',1.14,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','MATERIALS',1.00,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','ENERGY',0.52,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('HXQ','2026-08-31','sector','FINANCIALS SERVICES',0.31,99.91,true,'https://www.globalx.ca/product/hxq'),
 ('AIQ','2026-08-31','sector','INFORMATION TECHNOLOGY',67.87,100,true,'https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','sector','COMMUNICATION SERVICES',16.60,100,true,'https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','sector','CONSUMER DISCRETIONARY',9.05,100,true,'https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','sector','INDUSTRIALS',5.71,100,true,'https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','sector','HEALTH CARE',0.62,100,true,'https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','sector','FINANCIALS',0.11,100,true,'https://www.globalx.ca/product/aiq'),
 ('AIQ','2026-08-31','sector','CASH & CASH EQUIVALENTS',0.04,100,true,'https://www.globalx.ca/product/aiq'),
 ('TQCD','2026-08-31','sector','Financial Services',37.10,100,true,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','sector','Energy',20.50,100,true,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','sector','Basic Materials',18.10,100,true,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF'),
 ('TQCD','2026-08-31','sector','Other sectors',24.30,100,true,'https://www.td.com/ca/en/asset-management/funds/solutions/etfs/fundcard?fundId=7130&fundname=TD-Q-Canadian-Dividend-ETF')
)
insert into public.investment_exposure_breakdown(
 investment_id,as_of_date,dimension,bucket,weight_pct,source_id,set_coverage_pct,is_complete_set
)
select i.id,e.as_of_date,e.dimension,e.bucket,e.weight,
       (select s.id from public.investment_data_sources s
        where s.investment_id=i.id and s.source_url=e.source_url order by s.created_at desc limit 1),
       e.coverage,e.is_complete
from e join public.investments i on i.symbol=e.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,dimension,bucket) do update set
 weight_pct=excluded.weight_pct,
 source_id=excluded.source_id,
 set_coverage_pct=excluded.set_coverage_pct,
 is_complete_set=excluded.is_complete_set;
