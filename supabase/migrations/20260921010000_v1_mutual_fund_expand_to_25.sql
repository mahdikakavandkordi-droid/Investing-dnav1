-- Expand the focused Canadian mutual-fund research universe from 3 to 25.
-- Values are source-dated issuer snapshots. Missing fields remain null rather
-- than being inferred. These rows are research-visible but are not forced into
-- personalized Match until the existing evidence prerequisites are satisfied.

with fund(
  symbol,name,display_name,issuer_name,category,subcategory,strategy,region,
  series_name,fund_code,cifsc_category,minimum_initial,minimum_additional,
  distribution_frequency,source_url,as_of_date,nav,mer_pct,yield_pct,risk_level,
  return_1y_pct,return_3y_pct,return_5y_pct
) as (
 values
 ('TDB308','TD Canadian Equity Fund - A','Canadian Equity','TD Asset Management Inc.','Equity','Canadian Focused Equity','Actively managed Canadian equity','Canada','Advisor Series A','TDB308','Canadian Focused Equity',500::numeric,null::numeric,null,'https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=4935&fundname=TD-Canadian-Equity-Fund-A','2026-09-09'::date,30.78::numeric,2.19::numeric,null::numeric,'Medium',null::numeric,null::numeric,null::numeric),
 ('TDB2801','TD International Equity Fund - A','International Stocks','TD Asset Management Inc.','Equity','International Equity','Actively managed international equity','International','Advisor Series A','TDB2801','International Equity',500,null,'Annually','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=6610&fundname=TD-International-Equity-Fund-A','2026-09-10',16.70,2.34,null,'Medium',null,null,null),
 ('TDB306','TD Canadian Bond Fund - A','Canadian Bonds','TD Asset Management Inc.','Fixed Income','Canadian Fixed Income','Actively managed Canadian investment-grade bonds','Canada','Advisor Series A','TDB306','Canadian Fixed Income',500,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=4934&fundname=TD-Canadian-Bond-Fund-A','2026-09-10',10.63,1.11,null,'Low',null,null,null),
 ('TDB305','TD Canadian Money Market Fund - A','Canadian Money Market','TD Asset Management Inc.','Money Market','Canadian Money Market','Capital preservation and short-term income','Canada','Advisor Series A','TDB305','Canadian Money Market',500,null,null,'https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=4936','2026-09-10',10.00,0.39,2.15,'Low',null,null,null),
 ('TDB821','TD Monthly Income Fund - A','Monthly Income Balanced','TD Asset Management Inc.','Balanced','Canadian Neutral Balanced','Income-oriented balanced portfolio','Canada','Advisor Series A','TDB821','Canadian Neutral Balanced',500,null,'Monthly','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=6162&fundname=TD-Monthly-Income-Fund-A','2026-09-10',29.69,1.46,null,'Low to Medium',null,null,null),

 ('281','Fidelity Canadian Asset Allocation Fund - Series B','Canadian Balanced Portfolio','Fidelity Investments Canada ULC','Balanced','Canadian Equity Balanced','Actively managed Canadian balanced allocation','Canada','Series B','281','Canadian Equity Balanced',null,null,'Annually','https://www.fidelity.ca/en/products/funds/caa/','2026-09-09',36.96,2.22,null,null,null,null,null),
 ('9010','Fidelity Canadian Equity Private Pool - Series B','Canadian Equity','Fidelity Investments Canada ULC','Equity','Canadian Equity','Diversified Canadian equity','Canada','Series B','9010','Canadian Equity',null,null,'Annually','https://www.fidelity.ca/en/products/funds/ucep/','2026-09-10',36.15,2.07,null,null,null,null,null),
 ('3478','Fidelity North American Equity Class - Series B','North American Stocks','Fidelity Investments Canada ULC','Equity','North American Equity','Concentrated North American equity','North America','Series B','3478','North American Equity',null,null,'Annually','https://www.fidelity.ca/en/products/funds/unae/','2026-09-10',32.87,2.22,null,null,null,null,null),
 ('7601','Fidelity Global Equity Portfolio - Series B','Global Equity Portfolio','Fidelity Investments Canada ULC','Equity','Global Equity','Global equity fund-of-funds','Global','Series B','7601','Global Equity',null,null,'Annually','https://www.fidelity.ca/en/products/funds/gep/','2026-09-11',18.06,2.25,null,null,null,null,null),
 ('233','Fidelity Canadian Bond Fund - Series B','Canadian Bonds','Fidelity Investments Canada ULC','Fixed Income','Canadian Fixed Income','Canadian fixed income','Canada','Series B','233','Canadian Fixed Income',null,null,'Monthly','https://www.fidelity.ca/en/products/funds/cc/','2026-09-09',12.83,1.27,2.64,null,null,null,null),
 ('229','Fidelity Canadian Money Market Fund - Series B','Canadian Money Market','Fidelity Investments Canada ULC','Money Market','Canadian Money Market','High-quality short-term Canadian money market securities','Canada','Series B','229','Canadian Money Market',500,25,'Monthly','https://www.fidelity.ca/en/products/funds/staf/','2026-09-10',10.00,0.74,1.61,null,null,null,null),

 ('MFC2946','Mackenzie Canadian Equity Fund - Series A','Canadian Equity','Mackenzie Investments','Equity','Canadian Equity','Actively managed all-cap Canadian equity','Canada','Series A','MFC2946','Canadian Equity',null,null,'Annually','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-canadian-equity-fund-a-02946-en.pdf','2026-07-31',50.97,2.48,null,'Medium',24.9,18.5,12.9),
 ('MFC5401','Mackenzie Balanced ETF Portfolio - Series A','Balanced All-in-One Portfolio','Mackenzie Investments','Balanced','Managed Assets','Balanced ETF portfolio','Global','Series A','MFC5401','Global Neutral Balanced',null,null,'Annually','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-balanced-etf-portfolio-a-05401-en.pdf','2026-07-31',14.59,1.84,null,'Low to Medium',13.6,11.8,5.8),
 ('MFC7486','Mackenzie All-Equity ETF Portfolio - Series A','All-Equity Portfolio','Mackenzie Investments','Equity','Managed Assets','Growth-focused all-equity ETF portfolio','Global','Series A','MFC7486','Global Equity',null,null,null,'https://www.mackenzieinvestments.com/en/products/mutual-funds/mackenzie-all-equity-etf-portfolio','2026-07-31',null,1.90,null,null,null,null,null),
 ('MFC2710','Mackenzie Global Dividend Fund - Series A','Global Dividend Stocks','Mackenzie Investments','Equity','Global Equity','Global dividend-focused equity','Global','Series A','MFC2710','Global Equity',null,null,'Annually','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-global-dividend-fund-a-02710-en.pdf','2026-07-31',41.31,2.52,null,'Low to Medium',13.5,14.8,9.6),
 ('MFC8331','Mackenzie Betterworld Global Equity Fund - Series A','Global Equity — Sustainable Focus','Mackenzie Investments','Equity','Global Equity','Global equity with sustainability integration','Global','Series A','MFC8331','Global Equity',null,null,null,'https://www.mackenzieinvestments.com/en/products/mutual-funds/mackenzie-betterworld-global-equity-fund','2026-03-31',null,2.56,null,null,null,null,null),

 ('BMO70135','BMO Canadian Equity Fund - Series A','Canadian Equity','BMO Global Asset Management','Equity','Canadian Equity','Actively managed Canadian equity','Canada','Series A','BMO70135','Canadian Equity',500,50,'Annually','https://fundfacts.bmo.com/RetailEnglish/BMO_Canadian_Equity_Fund-EN-Series_A.pdf','2025-05-28',null,2.29,null,null,null,null,null),
 ('BMO70146','BMO Dividend Fund - Series A','Canadian Dividend Stocks','BMO Global Asset Management','Equity','Canadian Dividend & Income Equity','Dividend-focused Canadian equity','Canada','Series A','BMO70146','Canadian Dividend & Income Equity',500,50,'Quarterly','https://fundfacts.bmo.com/RetailEnglish/BMO_Dividend_Fund-EN-Series_A.pdf','2025-05-28',null,1.80,null,'Medium',null,null,null),
 ('BMO70743','BMO Global Equity Fund - Series A','Global Equity','BMO Global Asset Management','Equity','Global Equity','Actively managed global equity','Global','Series A','BMO70743','Global Equity',500,50,'Annually','https://fundfacts.bmo.com/RetailEnglish/BMO_Global_Equity_Fund-EN-Series_A.pdf','2025-05-28',null,1.93,null,null,null,null,null),
 ('BMO70160','BMO Core Bond Fund - Series A','Canadian Core Bonds','BMO Global Asset Management','Fixed Income','Canadian Fixed Income','Canadian investment-grade core bond portfolio','Canada','Series A','BMO70160','Canadian Fixed Income',500,50,'Monthly','https://fundfacts.bmo.com/RetailEnglish/BMO_Core_Bond_Fund-EN-Series_A.pdf','2026-05-26',null,1.05,null,'Low',null,null,null),
 ('BMO70703','BMO Balanced ETF Portfolio - Series A','Balanced All-in-One Portfolio','BMO Global Asset Management','Balanced','Global Neutral Balanced','Balanced ETF portfolio','Global','Series A','BMO70703','Global Neutral Balanced',500,50,'Annually','https://fundfacts.bmo.com/RetailEnglish/BMO_Balanced_ETF_Portfolio-EN-Series_A.pdf','2025-05-28',null,1.72,null,null,null,null,null),
 ('BMO70142','BMO Money Market Fund - Series A','Canadian Money Market','BMO Global Asset Management','Money Market','Canadian Money Market','Capital preservation, liquidity and short-term interest income','Canada','Series A','BMO70142','Canadian Money Market',500,50,'Monthly','https://fundfacts.bmo.com/RetailEnglish/BMO_Money_Market_Fund-EN-Series_A.pdf','2025-05-28',1.00,0.69,null,'Low',null,null,null)
),
upserted as (
 insert into public.investments(
   symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,
   country_code,currency,exchange,description,is_active,is_featured,data_status,display_name
 )
 select
   f.symbol,f.name,f.name,'MUTUAL_FUND',iss.id,f.category,f.subcategory,f.strategy,f.region,
   'CA','CAD','FUND',f.display_name,true,false,'verified_partial',f.display_name
 from fund f
 join public.investment_issuers iss on iss.name=f.issuer_name
 on conflict(symbol,exchange) do update set
   name=excluded.name,
   legal_name=excluded.legal_name,
   asset_type=excluded.asset_type,
   issuer_id=excluded.issuer_id,
   category=excluded.category,
   subcategory=excluded.subcategory,
   strategy=excluded.strategy,
   region=excluded.region,
   description=excluded.description,
   is_active=true,
   data_status=excluded.data_status,
   display_name=excluded.display_name,
   updated_at=now()
 returning id,symbol
)
insert into public.investment_mutual_fund_terms(
  investment_id,series_name,fund_code,cifsc_category,load_structure,sales_status,
  minimum_initial_investment,minimum_additional_investment,
  income_distribution_frequency,capital_gains_distribution_frequency,
  source_name,source_url,as_of_date
)
select
  i.id,f.series_name,f.fund_code,f.cifsc_category,'No Load','Open',
  f.minimum_initial,f.minimum_additional,
  f.distribution_frequency,f.distribution_frequency,
  f.issuer_name,f.source_url,f.as_of_date
from fund f
join public.investments i on i.symbol=f.symbol and i.exchange='FUND'
on conflict(investment_id) do update set
  series_name=excluded.series_name,
  fund_code=excluded.fund_code,
  cifsc_category=excluded.cifsc_category,
  load_structure=excluded.load_structure,
  sales_status=excluded.sales_status,
  minimum_initial_investment=excluded.minimum_initial_investment,
  minimum_additional_investment=excluded.minimum_additional_investment,
  income_distribution_frequency=excluded.income_distribution_frequency,
  capital_gains_distribution_frequency=excluded.capital_gains_distribution_frequency,
  source_name=excluded.source_name,
  source_url=excluded.source_url,
  as_of_date=excluded.as_of_date,
  updated_at=now();

with fund(symbol,as_of_date,nav,mer_pct,yield_pct,distribution_frequency,return_1y_pct,return_3y_pct,return_5y_pct) as (
 values
 ('TDB308','2026-09-09'::date,30.78::numeric,2.19::numeric,null::numeric,null,null::numeric,null::numeric,null::numeric),
 ('TDB2801','2026-09-10',16.70,2.34,null,'Annually',null,null,null),
 ('TDB306','2026-09-10',10.63,1.11,null,null,null,null,null),
 ('TDB305','2026-09-10',10.00,0.39,2.15,null,null,null,null),
 ('TDB821','2026-09-10',29.69,1.46,null,'Monthly',null,null,null),
 ('281','2026-09-09',36.96,2.22,null,'Annually',null,null,null),
 ('9010','2026-09-10',36.15,2.07,null,'Annually',null,null,null),
 ('3478','2026-09-10',32.87,2.22,null,'Annually',null,null,null),
 ('7601','2026-09-11',18.06,2.25,null,'Annually',null,null,null),
 ('233','2026-09-09',12.83,1.27,2.64,'Monthly',null,null,null),
 ('229','2026-09-10',10.00,0.74,1.61,'Monthly',null,null,null),
 ('MFC2946','2026-07-31',50.97,2.48,null,'Annually',24.9,18.5,12.9),
 ('MFC5401','2026-07-31',14.59,1.84,null,'Annually',13.6,11.8,5.8),
 ('MFC7486','2026-07-31',null,1.90,null,null,null,null,null),
 ('MFC2710','2026-07-31',41.31,2.52,null,'Annually',13.5,14.8,9.6),
 ('MFC8331','2026-03-31',null,2.56,null,null,null,null,null),
 ('BMO70135','2025-05-28',null,2.29,null,'Annually',null,null,null),
 ('BMO70146','2025-05-28',null,1.80,null,'Quarterly',null,null,null),
 ('BMO70743','2025-05-28',null,1.93,null,'Annually',null,null,null),
 ('BMO70160','2026-05-26',null,1.05,null,'Monthly',null,null,null),
 ('BMO70703','2025-05-28',null,1.72,null,'Annually',null,null,null),
 ('BMO70142','2025-05-28',1.00,0.69,null,'Monthly',null,null,null)
)
insert into public.investment_metrics(
  investment_id,as_of_date,price,return_1y_pct,return_3y_annualized_pct,
  return_5y_annualized_pct,yield_pct,distribution_frequency,mer_pct
)
select
  i.id,f.as_of_date,f.nav,f.return_1y_pct,f.return_3y_pct,f.return_5y_pct,
  f.yield_pct,f.distribution_frequency,f.mer_pct
from fund f
join public.investments i on i.symbol=f.symbol and i.exchange='FUND'
on conflict(investment_id,as_of_date) do update set
  price=coalesce(excluded.price,public.investment_metrics.price),
  return_1y_pct=coalesce(excluded.return_1y_pct,public.investment_metrics.return_1y_pct),
  return_3y_annualized_pct=coalesce(excluded.return_3y_annualized_pct,public.investment_metrics.return_3y_annualized_pct),
  return_5y_annualized_pct=coalesce(excluded.return_5y_annualized_pct,public.investment_metrics.return_5y_annualized_pct),
  yield_pct=coalesce(excluded.yield_pct,public.investment_metrics.yield_pct),
  distribution_frequency=coalesce(excluded.distribution_frequency,public.investment_metrics.distribution_frequency),
  mer_pct=coalesce(excluded.mer_pct,public.investment_metrics.mer_pct);

with risk(symbol,as_of_date,risk_level) as (
 values
 ('TDB308','2026-09-09'::date,'Medium'),
 ('TDB2801','2026-09-10','Medium'),
 ('TDB306','2026-09-10','Low'),
 ('TDB305','2026-09-10','Low'),
 ('TDB821','2026-09-10','Low to Medium'),
 ('MFC2946','2026-07-31','Medium'),
 ('MFC5401','2026-07-31','Low to Medium'),
 ('MFC2710','2026-07-31','Low to Medium'),
 ('BMO70146','2025-05-28','Medium'),
 ('BMO70160','2026-05-26','Low'),
 ('BMO70142','2025-05-28','Low')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level)
select i.id,r.as_of_date,r.risk_level
from risk r
join public.investments i on i.symbol=r.symbol and i.exchange='FUND'
on conflict(investment_id,as_of_date) do update set risk_level=excluded.risk_level;

with source(symbol,source_name,source_url) as (
 values
 ('TDB308','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=4935&fundname=TD-Canadian-Equity-Fund-A'),
 ('TDB2801','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=6610&fundname=TD-International-Equity-Fund-A'),
 ('TDB306','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=4934&fundname=TD-Canadian-Bond-Fund-A'),
 ('TDB305','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=4936'),
 ('TDB821','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/mutual-funds/fundcard?fundId=6162&fundname=TD-Monthly-Income-Fund-A'),
 ('281','Fidelity Investments Canada ULC','https://www.fidelity.ca/en/products/funds/caa/'),
 ('9010','Fidelity Investments Canada ULC','https://www.fidelity.ca/en/products/funds/ucep/'),
 ('3478','Fidelity Investments Canada ULC','https://www.fidelity.ca/en/products/funds/unae/'),
 ('7601','Fidelity Investments Canada ULC','https://www.fidelity.ca/en/products/funds/gep/'),
 ('233','Fidelity Investments Canada ULC','https://www.fidelity.ca/en/products/funds/cc/'),
 ('229','Fidelity Investments Canada ULC','https://www.fidelity.ca/en/products/funds/staf/'),
 ('MFC2946','Mackenzie Investments','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-canadian-equity-fund-a-02946-en.pdf'),
 ('MFC5401','Mackenzie Investments','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-balanced-etf-portfolio-a-05401-en.pdf'),
 ('MFC7486','Mackenzie Investments','https://www.mackenzieinvestments.com/en/products/mutual-funds/mackenzie-all-equity-etf-portfolio'),
 ('MFC2710','Mackenzie Investments','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-global-dividend-fund-a-02710-en.pdf'),
 ('MFC8331','Mackenzie Investments','https://www.mackenzieinvestments.com/en/products/mutual-funds/mackenzie-betterworld-global-equity-fund'),
 ('BMO70135','BMO Global Asset Management','https://fundfacts.bmo.com/RetailEnglish/BMO_Canadian_Equity_Fund-EN-Series_A.pdf'),
 ('BMO70146','BMO Global Asset Management','https://fundfacts.bmo.com/RetailEnglish/BMO_Dividend_Fund-EN-Series_A.pdf'),
 ('BMO70743','BMO Global Asset Management','https://fundfacts.bmo.com/RetailEnglish/BMO_Global_Equity_Fund-EN-Series_A.pdf'),
 ('BMO70160','BMO Global Asset Management','https://fundfacts.bmo.com/RetailEnglish/BMO_Core_Bond_Fund-EN-Series_A.pdf'),
 ('BMO70703','BMO Global Asset Management','https://fundfacts.bmo.com/RetailEnglish/BMO_Balanced_ETF_Portfolio-EN-Series_A.pdf'),
 ('BMO70142','BMO Global Asset Management','https://fundfacts.bmo.com/RetailEnglish/BMO_Money_Market_Fund-EN-Series_A.pdf')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,notes
)
select
  i.id,s.source_name,'issuer_official',s.source_url,
  'fund profile, fees, risk and/or NAV as available from issuer',now(),
  'Curated V1 mutual-fund source record'
from source s
join public.investments i on i.symbol=s.symbol and i.exchange='FUND'
where not exists(
  select 1
  from public.investment_data_sources d
  where d.investment_id=i.id
    and d.source_type='issuer_official'
    and d.source_url=s.source_url
);

select public.refresh_investment_data_quality();
