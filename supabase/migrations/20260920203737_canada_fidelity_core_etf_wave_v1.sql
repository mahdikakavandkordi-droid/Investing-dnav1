
insert into public.investment_issuers(name,website,country_code)
values ('Fidelity Investments Canada ULC','https://www.fidelity.ca/','CA')
on conflict (name) do update
set website=excluded.website,country_code=excluded.country_code,updated_at=now();

with rows(symbol,name,category,subcategory,strategy,region,description,inception_date) as (
  values
  ('FEQT','Fidelity All-in-One Equity ETF','Equity','All-in-one','Global multi-asset all-equity allocation','Global','Global all-in-one portfolio with approximately 97% equity and 3% cryptocurrency at its neutral mix.','2022-01-20'::date),
  ('FGRO','Fidelity All-in-One Growth ETF','Asset Allocation','All-in-one','Global growth asset allocation','Global','Global growth portfolio with approximately 82% equity, 15% fixed income and 3% cryptocurrency at its neutral mix.','2021-01-21'::date),
  ('FBAL','Fidelity All-in-One Balanced ETF','Asset Allocation','All-in-one','Global balanced asset allocation','Global','Global balanced portfolio with approximately 59% equity, 39% fixed income and 2% cryptocurrency at its neutral mix.','2021-01-21'::date),
  ('FCNS','Fidelity All-in-One Conservative ETF','Asset Allocation','All-in-one','Global conservative asset allocation','Global','Global conservative portfolio with approximately 40% equity, 59% fixed income and 1% cryptocurrency at its neutral mix.','2022-01-20'::date),
  ('FFIX','Fidelity All-in-One Fixed Income ETF','Fixed Income','Global Fixed Income','Global multi-sector fixed-income allocation','Global','One-ticket fixed-income ETF investing through actively managed and systematic fixed-income ETFs.','2025-05-30'::date),
  ('FCCA','Fidelity All-Canadian Equity ETF','Equity','Canada','Multi-factor Canadian equity allocation','Canada','Canadian equity ETF allocating across Fidelity Canadian value, low-volatility, momentum and high-quality factor ETFs.','2024-02-01'::date),
  ('FCAM','Fidelity All-American Equity ETF','Equity','United States','Multi-factor U.S. equity allocation','United States','U.S. equity ETF allocating across Fidelity U.S. momentum, value, high-quality and low-volatility factor ETFs.','2024-02-01'::date),
  ('FCIN','Fidelity All-International Equity ETF','Equity','International Developed','Multi-factor international equity allocation','International','International equity ETF allocating across Fidelity international high-quality, value, low-volatility and momentum factor ETFs.','2024-02-01'::date)
)
insert into public.investments(
  symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,
  country_code,currency,exchange,description,inception_date,is_active,is_featured,data_status
)
select r.symbol,r.name,r.name,'ETF',iss.id,r.category,r.subcategory,r.strategy,r.region,
       'CA','CAD','Cboe CA',r.description,r.inception_date,true,false,'verified_partial'
from rows r
join public.investment_issuers iss on iss.name='Fidelity Investments Canada ULC'
on conflict (symbol,exchange) do update set
  name=excluded.name,legal_name=excluded.legal_name,issuer_id=excluded.issuer_id,
  category=excluded.category,subcategory=excluded.subcategory,strategy=excluded.strategy,
  region=excluded.region,country_code='CA',currency='CAD',description=excluded.description,
  inception_date=excluded.inception_date,is_active=true,data_status='verified_partial',updated_at=now();

with facts(symbol,product_url,facts_url,mer_pct) as (
  values
  ('FEQT','https://www.fidelity.ca/en/products/etfs/feqt/','https://www.fidelity.ca/en/fundfacts/?text-filter=FEQT',0.43::numeric),
  ('FGRO','https://www.fidelity.ca/en/products/etfs/fgro/','https://www.fidelity.ca/en/fundfacts/?text-filter=FGRO',0.42),
  ('FBAL','https://www.fidelity.ca/en/products/etfs/fbal/','https://www.fidelity.ca/en/fundfacts/?text-filter=FBAL',0.40),
  ('FCNS','https://www.fidelity.ca/en/products/etfs/fcns/','https://www.fidelity.ca/en/fundfacts/?text-filter=FCNS',0.39),
  ('FFIX','https://www.fidelity.ca/en/products/etfs/ffix/','https://www.fidelity.ca/en/fundfacts/?text-filter=FFIX',0.37),
  ('FCCA','https://www.fidelity.ca/en/products/etfs/fcca/','https://www.fidelity.ca/en/fundfacts/?text-filter=FCCA',0.39),
  ('FCAM','https://www.fidelity.ca/en/products/etfs/fcam/','https://www.fidelity.ca/en/fundfacts/?text-filter=FCAM',0.38),
  ('FCIN','https://www.fidelity.ca/en/products/etfs/fcin/','https://www.fidelity.ca/en/fundfacts/?text-filter=FCIN',0.50)
)
insert into public.investment_official_facts(
  investment_id,source_name,product_url,etf_facts_url,etf_facts_date,
  management_fee_pct,mer_pct,fee_source_note,verified_at
)
select i.id,'Fidelity Investments Canada ULC',f.product_url,f.facts_url,null,0,f.mer_pct,
       'MER from official Fidelity product page (MER date 2026-03-31). ETF Facts are accessed through Fidelity’s official ticker-filtered regulatory document portal; exact ETF Facts document date was not exposed in the indexed page and remains null.',
       now()
from facts f join public.investments i on i.symbol=f.symbol and i.exchange='Cboe CA'
on conflict (investment_id) do update set
 source_name=excluded.source_name,product_url=excluded.product_url,etf_facts_url=excluded.etf_facts_url,
 etf_facts_date=null,management_fee_pct=excluded.management_fee_pct,mer_pct=excluded.mer_pct,
 fee_source_note=excluded.fee_source_note,verified_at=now();

with src(symbol,url,scope) as (
  values
  ('FEQT','https://www.fidelity.ca/en/products/etfs/feqt/','identity,current_metrics,performance,risk,allocation,holdings'),
  ('FGRO','https://www.fidelity.ca/en/products/etfs/fgro/','identity,current_metrics,performance,risk,allocation,holdings'),
  ('FBAL','https://www.fidelity.ca/en/products/etfs/fbal/','identity,current_metrics,performance,risk,allocation,holdings'),
  ('FCNS','https://www.fidelity.ca/en/products/etfs/fcns/','identity,current_metrics,performance,risk,allocation,holdings'),
  ('FFIX','https://www.fidelity.ca/en/products/etfs/ffix/','identity,current_metrics,performance,risk,income,allocation,holdings'),
  ('FCCA','https://www.fidelity.ca/en/products/etfs/fcca/','identity,current_metrics,performance,risk,allocation,holdings'),
  ('FCAM','https://www.fidelity.ca/en/products/etfs/fcam/','identity,current_metrics,performance,risk,allocation,holdings'),
  ('FCIN','https://www.fidelity.ca/en/products/etfs/fcin/','identity,current_metrics,performance,risk,allocation,holdings')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Fidelity Investments Canada ULC','official',s.url,s.scope,now(),'2026-09-20',
       'Official Fidelity product page; individual data fields retain the as-of dates shown by the issuer.'
from src s join public.investments i on i.symbol=s.symbol and i.exchange='Cboe CA'
where not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id and x.source_url=s.url and x.source_version='2026-09-20'
);

with m(symbol,as_of_date,price,mer,aum,frequency) as (
  values
  ('FEQT','2026-09-18'::date,19.08::numeric,0.43::numeric,5846000000::numeric,'Annual'),
  ('FGRO','2026-09-18',19.20,0.42,5392000000,'Annual'),
  ('FBAL','2026-09-18',15.61,0.40,10252000000,'Annual'),
  ('FCNS','2026-09-18',12.77,0.39,2392000000,'Annual'),
  ('FFIX','2026-09-17',9.69,0.37,83300000,'Monthly'),
  ('FCCA','2026-09-18',17.80,0.39,222400000,'Annual'),
  ('FCAM','2026-09-17',16.55,0.38,344200000,'Annual'),
  ('FCIN','2026-09-18',16.09,0.50,1115000000,'Annual')
)
insert into public.investment_metrics(investment_id,as_of_date,price,mer_pct,aum,distribution_frequency)
select i.id,m.as_of_date,m.price,m.mer,m.aum,m.frequency
from m join public.investments i on i.symbol=m.symbol and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date) do update set
 price=excluded.price,mer_pct=excluded.mer_pct,aum=excluded.aum,distribution_frequency=excluded.distribution_frequency;

with p(symbol,r1m,r3m,r1y,r3y,r5y,si) as (
  values
  ('FEQT',1.55::numeric,4.08::numeric,22.96::numeric,23.36::numeric,null::numeric,16.22::numeric),
  ('FGRO',1.45,3.37,19.66,20.72,13.06,13.74),
  ('FBAL',0.99,2.01,14.47,15.90,9.40,9.79),
  ('FCNS',0.62,0.94,10.40,11.92,null,7.18),
  ('FFIX',0.02,-1.26,1.92,null,null,2.02),
  ('FCCA',1.80,4.34,31.43,null,null,26.32),
  ('FCAM',1.15,3.10,21.27,null,null,22.00),
  ('FCIN',0.06,5.03,25.08,null,null,21.51)
)
insert into public.investment_performance_history(
 investment_id,as_of_date,return_1m_pct,return_3m_pct,return_1y_pct,return_3y_annualized_pct,
 return_5y_annualized_pct,since_inception_annualized_pct,return_basis,source_id,source_note,verification_status
)
select i.id,'2026-08-31',p.r1m,p.r3m,p.r1y,p.r3y,p.r5y,p.si,'issuer_total_return',
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url='https://www.fidelity.ca/en/products/etfs/'||lower(i.symbol)||'/' order by s.created_at desc limit 1),
       'Official Fidelity standard-period ETF NAV returns as at 2026-08-31. Periods unavailable because of fund age remain null.',
       'issuer_verified'
from p join public.investments i on i.symbol=p.symbol and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date,return_basis) do update set
 return_1m_pct=excluded.return_1m_pct,return_3m_pct=excluded.return_3m_pct,return_1y_pct=excluded.return_1y_pct,
 return_3y_annualized_pct=excluded.return_3y_annualized_pct,return_5y_annualized_pct=excluded.return_5y_annualized_pct,
 since_inception_annualized_pct=excluded.since_inception_annualized_pct,source_id=excluded.source_id,
 source_note=excluded.source_note,verification_status='issuer_verified';

with rr(symbol,rating,source_date) as (
 values
 ('FEQT','Medium','2026-09-18'::date),('FGRO','Medium','2026-09-18'),
 ('FBAL','Low to Medium','2026-09-18'),('FCNS','Low to Medium','2026-09-18'),
 ('FFIX','Low','2026-09-17'),('FCCA','Medium','2026-09-18'),
 ('FCAM','Medium','2026-09-17'),('FCIN','Medium','2026-09-18')
), mapped as (
 select rr.*,
   case rating when 'Low' then 0 when 'Low to Medium' then 20 when 'Medium' then 40 when 'Medium to High' then 60 when 'High' then 80 end::numeric band_min,
   case rating when 'Low' then 20 when 'Low to Medium' then 40 when 'Medium' then 60 when 'Medium to High' then 80 when 'High' then 100 end::numeric band_max
 from rr
)
insert into public.investment_official_risk_ratings(
 investment_id,official_risk_rating,band_min,band_max,issuer,source_type,source_title,source_url,
 source_date,effective_date,methodology,verification_note,verified_at,updated_at
)
select i.id,m.rating,m.band_min,m.band_max,'Fidelity Investments Canada ULC',
 'Official product page','Fidelity ETF product page','https://www.fidelity.ca/en/products/etfs/'||lower(i.symbol)||'/',
 m.source_date,m.source_date,'Issuer-disclosed Canadian five-band volatility classification.',
 'Verified against the official Fidelity Canada ETF product page.',now(),now()
from mapped m join public.investments i on i.symbol=m.symbol and i.exchange='Cboe CA'
on conflict (investment_id) do update set
 official_risk_rating=excluded.official_risk_rating,band_min=excluded.band_min,band_max=excluded.band_max,
 issuer=excluded.issuer,source_type=excluded.source_type,source_title=excluded.source_title,source_url=excluded.source_url,
 source_date=excluded.source_date,effective_date=excluded.effective_date,methodology=excluded.methodology,
 verification_note=excluded.verification_note,verified_at=now(),updated_at=now();

with rm(symbol,sd,beta,risk) as (
 values
 ('FEQT',9.66::numeric,0.90::numeric,'Medium'),('FGRO',8.86,0.92,'Medium'),
 ('FBAL',7.44,0.95,'Low to Medium'),('FCNS',6.41,0.99,'Low to Medium'),
 ('FFIX',null::numeric,null::numeric,'Low'),('FCCA',null,null,'Medium'),
 ('FCAM',null,null,'Medium'),('FCIN',null,null,'Medium')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level,standard_deviation_pct,beta)
select i.id,'2026-08-31',rm.risk,rm.sd,rm.beta
from rm join public.investments i on i.symbol=rm.symbol and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date) do update set
 risk_level=excluded.risk_level,standard_deviation_pct=excluded.standard_deviation_pct,beta=excluded.beta;

insert into public.investment_income_history(
 investment_id,as_of_date,trailing_yield_pct,distribution_frequency,source_id,source_note
)
select i.id,'2026-08-31',4.00,'Monthly',
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url='https://www.fidelity.ca/en/products/etfs/ffix/' order by s.created_at desc limit 1),
 'Official Fidelity trailing 12-month yield as at 2026-08-31.'
from public.investments i where i.symbol='FFIX' and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date) do update set
 trailing_yield_pct=excluded.trailing_yield_pct,distribution_frequency=excluded.distribution_frequency,
 source_id=excluded.source_id,source_note=excluded.source_note;

insert into public.investment_portfolio_characteristics(
 investment_id,as_of_date,yield_to_maturity_pct,average_duration_years,source_id
)
select i.id,'2026-07-31',4.72,6.6,
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url='https://www.fidelity.ca/en/products/etfs/ffix/' order by s.created_at desc limit 1)
from public.investments i where i.symbol='FFIX' and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date) do update set
 yield_to_maturity_pct=excluded.yield_to_maturity_pct,average_duration_years=excluded.average_duration_years,source_id=excluded.source_id;
