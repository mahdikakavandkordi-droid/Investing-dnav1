
-- Canada ETF expansion wave 3: Mackenzie core and allocation research set.
-- Uses official Mackenzie product pages, August 2026 ETF roadmap, current
-- official performance table, and dated official fund profiles where available.
-- Missing fields remain null and no Match-readiness is fabricated.

insert into public.investment_issuers(name,website,country_code)
values ('Mackenzie Investments','https://www.mackenzieinvestments.com/','CA')
on conflict (name) do update
set website=excluded.website,country_code=excluded.country_code,updated_at=now();

with rows(symbol,name,category,subcategory,strategy,region,description,inception_date) as (
 values
 ('QCN','Mackenzie Canadian Equity Index ETF','Equity','Canada','Canadian broad-market index tracking','Canada','Traditional index ETF tracking broad Canadian equities.','2018-01-24'::date),
 ('QUU','Mackenzie US Large Cap Equity Index ETF','Equity','United States','U.S. large-cap index tracking','United States','Traditional index ETF tracking U.S. large-cap equities.','2018-01-24'::date),
 ('QDX','Mackenzie International Equity Index ETF','Equity','International Developed','Developed ex-North-America index tracking','International','Traditional index ETF tracking developed markets outside North America.','2018-01-24'::date),
 ('QBB','Mackenzie Canadian Aggregate Bond Index ETF','Fixed Income','Aggregate Bond','Canadian investment-grade aggregate bond index','Canada','Traditional index ETF covering Canadian investment-grade government, quasi-government and corporate bonds.','2018-01-29'::date),
 ('MCON','Mackenzie Conservative Allocation ETF','Asset Allocation','All-in-one','Conservative global asset allocation','Global','One-ticket portfolio targeting 40% equity and 60% fixed income.','2020-09-29'::date),
 ('MBAL','Mackenzie Balanced Allocation ETF','Asset Allocation','All-in-one','Balanced global asset allocation','Global','One-ticket portfolio targeting 60% equity and 40% fixed income.','2020-09-29'::date),
 ('MGRW','Mackenzie Growth Allocation ETF','Asset Allocation','All-in-one','Growth global asset allocation','Global','One-ticket portfolio targeting 80% equity and 20% fixed income.','2020-09-29'::date),
 ('MEQT','Mackenzie All-Equity Allocation ETF','Equity','All-in-one','Global all-equity asset allocation','Global','One-ticket portfolio targeting 100% global equity.','2023-11-20'::date)
)
insert into public.investments(
 symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,
 country_code,currency,exchange,description,inception_date,is_active,is_featured,data_status
)
select r.symbol,r.name,r.name,'ETF',iss.id,r.category,r.subcategory,r.strategy,r.region,
 'CA','CAD','TSX',r.description,r.inception_date,true,false,'verified_partial'
from rows r
join public.investment_issuers iss on iss.name='Mackenzie Investments'
on conflict (symbol,exchange) do update set
 name=excluded.name,legal_name=excluded.legal_name,issuer_id=excluded.issuer_id,
 category=excluded.category,subcategory=excluded.subcategory,strategy=excluded.strategy,
 region=excluded.region,country_code='CA',currency='CAD',description=excluded.description,
 inception_date=excluded.inception_date,is_active=true,data_status='verified_partial',updated_at=now();

with f(symbol,url,mgmt_fee) as (
 values
 ('QCN','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-equity-index-etf-qcn',0.04::numeric),
 ('QUU','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-us-large-cap-equity-index-etf-quu',0.06),
 ('QDX','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-international-equity-index-etf-qdx',0.17),
 ('QBB','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-aggregate-bond-index-etf-qbb',0.07),
 ('MCON','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-conservative-allocation-etf-mcon',0.17),
 ('MBAL','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-balanced-allocation-etf-mbal',0.17),
 ('MGRW','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-growth-allocation-etf-mgrw',0.17),
 ('MEQT','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-all-equity-allocation-etf-meqt',0.17)
)
insert into public.investment_official_facts(
 investment_id,source_name,product_url,etf_facts_url,etf_facts_date,
 management_fee_pct,mer_pct,fee_source_note,verified_at
)
select i.id,'Mackenzie Investments',f.url,f.url,null,f.mgmt_fee,null,
 'Official Mackenzie product page links to the regulatory Fund Facts. Current August 2026 management fee is separately verified in Mackenzie’s ETF product roadmap. Exact current MER and ETF Facts document date are left null where not exposed in the public indexed source.',
 now()
from f join public.investments i on i.symbol=f.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
 source_name=excluded.source_name,product_url=excluded.product_url,etf_facts_url=excluded.etf_facts_url,
 etf_facts_date=null,management_fee_pct=excluded.management_fee_pct,mer_pct=null,
 fee_source_note=excluded.fee_source_note,verified_at=now();

-- Product / performance / roadmap provenance.
with src(symbol,url,scope,version,note) as (
 values
 ('QCN','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-equity-index-etf-qcn','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('QUU','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-us-large-cap-equity-index-etf-quu','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('QDX','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-international-equity-index-etf-qdx','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('QBB','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-aggregate-bond-index-etf-qbb','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('MCON','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-conservative-allocation-etf-mcon','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('MBAL','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-balanced-allocation-etf-mbal','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('MGRW','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-growth-allocation-etf-mgrw','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.'),
 ('MEQT','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-all-equity-allocation-etf-meqt','identity,regulatory_documents','2026-09-20','Official Mackenzie product page.')
)
insert into public.investment_data_sources(
 investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Mackenzie Investments','official',s.url,s.scope,now(),s.version,s.note
from src s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
where not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id and x.source_url=s.url and x.source_version=s.version
);

insert into public.investment_data_sources(
 investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Mackenzie Investments','official',
 'https://www.mackenzieinvestments.com/content/dam/mackenzie-investments/en/public-sites/mi/documents/etfs/mi-etf-product-listing-roadmap-en.pdf',
 'management_fee,risk_rating,distribution_frequency',now(),'2026-08',
 'Official Mackenzie ETF product roadmap, August 2026.'
from public.investments i
where i.symbol in ('QCN','QUU','QDX','QBB','MCON','MBAL','MGRW','MEQT') and i.exchange='TSX'
and not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id
   and x.source_url='https://www.mackenzieinvestments.com/content/dam/mackenzie-investments/en/public-sites/mi/documents/etfs/mi-etf-product-listing-roadmap-en.pdf'
   and x.source_version='2026-08'
);

insert into public.investment_data_sources(
 investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Mackenzie Investments','official',
 'https://www.mackenzieinvestments.com/mi/en/etfFundPerformance/renderSubTab',
 'performance',now(),'2026-08-31',
 'Official Mackenzie ETF performance table as of August 31, 2026.'
from public.investments i
where i.symbol in ('QCN','QUU','QDX','QBB','MCON','MBAL','MGRW','MEQT') and i.exchange='TSX'
and not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id
   and x.source_url='https://www.mackenzieinvestments.com/mi/en/etfFundPerformance/renderSubTab'
   and x.source_version='2026-08-31'
);

-- Current Mackenzie official performance table (August 31, 2026).
with p(symbol,r1y,r3y,r5y,si) as (
 values
 ('QCN',30.0::numeric,24.8::numeric,15.4::numeric,13.0::numeric),
 ('QUU',21.3,22.3,14.4,15.4),
 ('QDX',22.9,19.3,11.3,8.7),
 ('QBB',1.9,4.2,0.3,1.8),
 ('MCON',10.3,11.1,5.3,6.2),
 ('MBAL',15.3,14.9,8.2,9.5),
 ('MGRW',20.3,18.8,11.0,12.9),
 ('MEQT',25.4,null::numeric,null::numeric,23.7)
)
insert into public.investment_performance_history(
 investment_id,as_of_date,return_1y_pct,return_3y_annualized_pct,return_5y_annualized_pct,
 since_inception_annualized_pct,return_basis,source_id,source_note,verification_status
)
select i.id,'2026-08-31',p.r1y,p.r3y,p.r5y,p.si,'issuer_total_return',
 (select s.id from public.investment_data_sources s
  where s.investment_id=i.id and s.source_url='https://www.mackenzieinvestments.com/mi/en/etfFundPerformance/renderSubTab'
  order by s.created_at desc limit 1),
 'Official Mackenzie ETF performance table as of 2026-08-31. Periods not available because of fund age remain null.',
 'issuer_verified'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,return_basis) do update set
 return_1y_pct=excluded.return_1y_pct,
 return_3y_annualized_pct=excluded.return_3y_annualized_pct,
 return_5y_annualized_pct=excluded.return_5y_annualized_pct,
 since_inception_annualized_pct=excluded.since_inception_annualized_pct,
 source_id=excluded.source_id,source_note=excluded.source_note,verification_status='issuer_verified';

-- Current official risk classifications and distribution frequencies from the August 2026 roadmap.
with rr(symbol,rating,frequency) as (
 values
 ('QCN','Medium','Quarterly'),('QUU','Medium','Quarterly'),('QDX','Medium','Quarterly'),('QBB','Low','Monthly'),
 ('MCON','Low to Medium','Quarterly'),('MBAL','Low to Medium','Quarterly'),
 ('MGRW','Low to Medium','Quarterly'),('MEQT','Medium','Quarterly')
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
select i.id,m.rating,m.band_min,m.band_max,'Mackenzie Investments','Official issuer roadmap',
 'Mackenzie ETF product roadmap',
 'https://www.mackenzieinvestments.com/content/dam/mackenzie-investments/en/public-sites/mi/documents/etfs/mi-etf-product-listing-roadmap-en.pdf',
 '2026-08-01','2026-08-01','Issuer-disclosed Canadian standardized risk classification.',
 'Verified against Mackenzie’s August 2026 official ETF roadmap.',now(),now()
from mapped m join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
 official_risk_rating=excluded.official_risk_rating,band_min=excluded.band_min,band_max=excluded.band_max,
 issuer=excluded.issuer,source_type=excluded.source_type,source_title=excluded.source_title,
 source_url=excluded.source_url,source_date=excluded.source_date,effective_date=excluded.effective_date,
 methodology=excluded.methodology,verification_note=excluded.verification_note,verified_at=now(),updated_at=now();

with rr(symbol,rating,frequency) as (
 values
 ('QCN','Medium','Quarterly'),('QUU','Medium','Quarterly'),('QDX','Medium','Quarterly'),('QBB','Low','Monthly'),
 ('MCON','Low to Medium','Quarterly'),('MBAL','Low to Medium','Quarterly'),
 ('MGRW','Low to Medium','Quarterly'),('MEQT','Medium','Quarterly')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level)
select i.id,'2026-08-31',rr.rating
from rr join public.investments i on i.symbol=rr.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set risk_level=excluded.risk_level;

with rr(symbol,frequency) as (
 values
 ('QCN','Quarterly'),('QUU','Quarterly'),('QDX','Quarterly'),('QBB','Monthly'),
 ('MCON','Quarterly'),('MBAL','Quarterly'),('MGRW','Quarterly'),('MEQT','Quarterly')
)
insert into public.investment_metrics(investment_id,as_of_date,distribution_frequency)
select i.id,'2026-08-31',rr.frequency
from rr join public.investments i on i.symbol=rr.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set distribution_frequency=excluded.distribution_frequency;

-- Dated official characteristics for core exposures.
with pc(symbol,as_of_date,nh,ytm,dur,pe,pb,aum,source_url) as (
 values
 ('QCN','2025-10-31'::date,294,null::numeric,null::numeric,20.03::numeric,2.43::numeric,3510000000::numeric,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QUU','2025-09-30',511,null,null,28.07,5.17,4430000000,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-quu-en.pdf'),
 ('QDX','2026-04-30',null::int,null,null,null,null,1530000000,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QBB','2025-09-30',1080,3.72,6.87,null,null,1230000000,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf')
)
insert into public.investment_data_sources(
 investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Mackenzie Investments','official',pc.source_url,'portfolio_characteristics,holdings,exposures',
 now(),pc.as_of_date::text,'Dated official Mackenzie ETF fund profile.'
from pc join public.investments i on i.symbol=pc.symbol and i.exchange='TSX'
where not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id and x.source_url=pc.source_url and x.source_version=pc.as_of_date::text
);

with pc(symbol,as_of_date,nh,ytm,dur,pe,pb,aum,source_url) as (
 values
 ('QCN','2025-10-31'::date,294,null::numeric,null::numeric,20.03::numeric,2.43::numeric,3510000000::numeric,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QUU','2025-09-30',511,null,null,28.07,5.17,4430000000,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-quu-en.pdf'),
 ('QDX','2026-04-30',null::int,null,null,null,null,1530000000,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QBB','2025-09-30',1080,3.72,6.87,null,null,1230000000,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf')
)
insert into public.investment_portfolio_characteristics(
 investment_id,as_of_date,number_of_holdings,yield_to_maturity_pct,average_duration_years,pe_ratio,pb_ratio,source_id
)
select i.id,pc.as_of_date,pc.nh,pc.ytm,pc.dur,pc.pe,pc.pb,
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url=pc.source_url order by s.created_at desc limit 1)
from pc join public.investments i on i.symbol=pc.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 number_of_holdings=coalesce(excluded.number_of_holdings,public.investment_portfolio_characteristics.number_of_holdings),
 yield_to_maturity_pct=coalesce(excluded.yield_to_maturity_pct,public.investment_portfolio_characteristics.yield_to_maturity_pct),
 average_duration_years=coalesce(excluded.average_duration_years,public.investment_portfolio_characteristics.average_duration_years),
 pe_ratio=coalesce(excluded.pe_ratio,public.investment_portfolio_characteristics.pe_ratio),
 pb_ratio=coalesce(excluded.pb_ratio,public.investment_portfolio_characteristics.pb_ratio),
 source_id=coalesce(excluded.source_id,public.investment_portfolio_characteristics.source_id);

with pc(symbol,as_of_date,aum) as (
 values
 ('QCN','2025-09-30'::date,3510000000::numeric),
 ('QUU','2025-08-31',4430000000),
 ('QDX','2026-03-31',1530000000),
 ('QBB','2025-08-31',1230000000)
)
insert into public.investment_metrics(investment_id,as_of_date,aum)
select i.id,pc.as_of_date,pc.aum
from pc join public.investments i on i.symbol=pc.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set aum=excluded.aum;

-- Complete dated sector/country/credit exposures from official fund profiles.
with e(symbol,as_of_date,dimension,bucket,weight,source_url) as (
 values
 ('QCN','2025-10-31'::date,'sector','Financials',32.4::numeric,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Materials',16.2,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Energy',15.4,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Industrials',11.2,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Information Technology',11.0,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Consumer Staples',3.2,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Consumer Discretionary',3.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Utilities',3.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Communication Services',2.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Real Estate',1.6,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Health Care',0.4,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),
 ('QCN','2025-10-31','sector','Cash & Equivalents',0.3,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf'),

 ('QUU','2025-09-30','country','United States',99.2,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-quu-en.pdf'),
 ('QUU','2025-09-30','country','Ireland',0.7,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-quu-en.pdf'),
 ('QUU','2025-09-30','country','Cash & Equivalents',0.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-quu-en.pdf'),

 ('QDX','2026-04-30','sector','Financials',24.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Industrials',19.5,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Health Care',10.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Information Technology',9.7,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Consumer Discretionary',8.5,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Consumer Staples',6.8,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Materials',6.4,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Energy',4.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Communication Services',4.0,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Utilities',3.9,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Real Estate',2.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),
 ('QDX','2026-04-30','sector','Cash & Equivalents',0.8,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qdx-en.pdf'),

 ('QBB','2025-09-30','sector','Federal Bonds',38.3,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','sector','Provincial Bonds',31.2,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','sector','Corporates',26.7,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','sector','Municipal Bonds',1.9,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','sector','Cash & Equivalents',1.5,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','sector','Other',0.4,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','credit_quality','AAA',40.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','credit_quality','AA',16.9,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','credit_quality','A',22.4,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','credit_quality','BBB',12.0,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','credit_quality','NR',7.1,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf'),
 ('QBB','2025-09-30','credit_quality','Cash & Equivalents',1.5,'https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qbb-en.pdf')
)
insert into public.investment_exposure_breakdown(
 investment_id,as_of_date,dimension,bucket,weight_pct,source_id,set_coverage_pct,is_complete_set
)
select i.id,e.as_of_date,e.dimension,e.bucket,e.weight,
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url=e.source_url order by s.created_at desc limit 1),
 100,true
from e join public.investments i on i.symbol=e.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,dimension,bucket) do update set
 weight_pct=excluded.weight_pct,source_id=excluded.source_id,set_coverage_pct=100,is_complete_set=true;

-- Target allocation profiles for Mackenzie allocation suite and descriptive profiles for core ETFs.
with p(symbol,objective,benchmark,target,geo,frequency,style,replication,risks,summary,as_of_date) as (
 values
 ('QCN','Replicate the Solactive Canada Broad Market Index before fees and expenses.','Solactive Canada Broad Market Index','{"equity":100,"fixed_income":0}'::jsonb,'{"Canada":100}'::jsonb,'Quarterly','Passive index tracking','Index replication','["Canadian equity market risk","Sector concentration"]'::jsonb,'Broad Canadian equity index exposure.','2026-08-01'::date),
 ('QUU','Track the large-cap segment of the U.S. equity market.','Solactive US Large Cap CAD Index','{"equity":100,"fixed_income":0}','{"United_States":100}','Quarterly','Passive index tracking','Index replication','["U.S. equity market risk","Currency risk","Large-cap concentration"]','Broad U.S. large-cap equity index exposure.','2026-08-01'),
 ('QDX','Track developed equity markets outside the United States and Canada.','Solactive GBS Developed Markets ex North America Large & Mid Cap CAD Index','{"equity":100,"fixed_income":0}','{"International":100}','Quarterly','Passive index tracking','Index replication','["International equity market risk","Currency risk","Country concentration"]','Developed ex-North-America equity index exposure.','2026-08-01'),
 ('QBB','Track a broad Canadian investment-grade bond index.','Solactive Canadian Float Adjusted Universe Bond Index','{"equity":0,"fixed_income":100}','{"Canada":100}','Monthly','Passive index tracking','Index replication','["Interest-rate risk","Credit risk","Bond market price risk"]','Broad Canadian aggregate investment-grade bond exposure.','2026-08-01'),
 ('MCON','Provide a diversified conservative one-ticket portfolio.','Blended allocation benchmark','{"equity":40,"fixed_income":60}','{"Canada":47.2,"United_States":31.8,"International":21.0}','Quarterly','Strategic asset allocation with quarterly rebalancing','Underlying Mackenzie ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Conservative all-in-one portfolio targeting 40% equity and 60% fixed income.','2026-03-01'),
 ('MBAL','Provide a diversified balanced one-ticket portfolio.','Blended allocation benchmark','{"equity":60,"fixed_income":40}','{"Canada":41.3,"United_States":35.6,"International":23.1}','Quarterly','Strategic asset allocation with quarterly rebalancing','Underlying Mackenzie ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Balanced all-in-one portfolio targeting 60% equity and 40% fixed income.','2026-03-01'),
 ('MGRW','Provide a diversified growth-oriented one-ticket portfolio.','Blended allocation benchmark','{"equity":80,"fixed_income":20}','{"Canada":35.4,"United_States":39.4,"International":25.2}','Quarterly','Strategic asset allocation with quarterly rebalancing','Underlying Mackenzie ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Growth-oriented all-in-one portfolio targeting 80% equity and 20% fixed income.','2026-03-01'),
 ('MEQT','Provide broad global equity exposure in a one-ticket portfolio.','Blended global equity benchmark','{"equity":100,"fixed_income":0}','{"Canada":29.5,"United_States":44.0,"International":26.5}','Quarterly','Strategic global equity allocation with quarterly rebalancing','Underlying Mackenzie ETFs','["Equity market risk","Currency risk","Global market drawdowns"]','All-equity one-ticket portfolio targeting 100% equity.','2026-03-01')
)
insert into public.investment_profiles(
 investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
 currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,
 source_id,as_of_date,model_version
)
select i.id,p.objective,p.benchmark,'Official issuer structure summarized for Investor DNA research.',
 case when i.symbol in ('MCON','MBAL','MGRW','MEQT') then 'Target allocation across underlying Mackenzie ETFs; targets are rebalanced quarterly and may change.' else 'Single ETF index exposure' end,
 p.target,p.geo,null,p.frequency,p.style,p.replication,null,p.risks,p.summary,
 (select s.id from public.investment_data_sources s
  where s.investment_id=i.id
  order by case when s.source_version='2026-08' then 0 else 1 end,s.created_at desc limit 1),
 p.as_of_date,'profile-v1.0'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,model_version) do update set
 objective=excluded.objective,benchmark=excluded.benchmark,methodology=excluded.methodology,
 portfolio_construction=excluded.portfolio_construction,target_allocation=excluded.target_allocation,
 geographic_exposure=excluded.geographic_exposure,currency_hedging=excluded.currency_hedging,
 distribution_policy=excluded.distribution_policy,management_style=excluded.management_style,
 replication_method=excluded.replication_method,ideal_for=null,key_risks=excluded.key_risks,
 profile_summary=excluded.profile_summary,source_id=excluded.source_id,as_of_date=excluded.as_of_date,updated_at=now();

with s(symbol,vol,income,growth,rate,credit,diversification,complexity,basis,as_of_date) as (
 values
 ('QCN','medium','low','high','not_applicable','Canadian equity issuers','diversified','low','ETF units are not guaranteed or insured.','2026-08-01'::date),
 ('QUU','medium','low','high','not_applicable','U.S. equity issuers','diversified','low','ETF units are not guaranteed; foreign currency movements affect Canadian investors.','2026-08-01'),
 ('QDX','medium','low','high','not_applicable','Developed-market equity issuers','diversified','low','ETF units are not guaranteed; foreign equity and currency risks apply.','2026-08-01'),
 ('QBB','low','high','low','medium','Canadian government and investment-grade corporate issuers','diversified','low','Bond ETF units are not principal-guaranteed and market value can change.','2026-08-01'),
 ('MCON','low','high','medium','medium','Diversified global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed or insured.','2026-08-01'),
 ('MBAL','low','medium','medium','medium','Diversified global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed or insured.','2026-08-01'),
 ('MGRW','medium','medium','high','low','Diversified global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed or insured.','2026-08-01'),
 ('MEQT','medium','low','high','not_applicable','Diversified global equity issuers','diversified','low','All-equity ETF units are not guaranteed or insured.','2026-08-01')
)
insert into public.investment_structure_profiles(
 investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,
 growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,
 time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1','none','high',s.vol,s.income,s.growth,s.rate,s.credit,s.diversification,s.complexity,
 'open_ended',s.basis,
 jsonb_build_object(
   'source','Mackenzie Investments official ETF roadmap / product materials',
   'url','https://www.mackenzieinvestments.com/content/dam/mackenzie-investments/en/public-sites/mi/documents/etfs/mi-etf-product-listing-roadmap-en.pdf',
   'verified_on','2026-09-20'
 ),
 s.as_of_date
from s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
on conflict (investment_id,model_version) do update set
 capital_protection=excluded.capital_protection,liquidity_level=excluded.liquidity_level,
 price_volatility=excluded.price_volatility,income_predictability=excluded.income_predictability,
 growth_participation=excluded.growth_participation,interest_rate_sensitivity=excluded.interest_rate_sensitivity,
 credit_exposure=excluded.credit_exposure,diversification_level=excluded.diversification_level,
 complexity_level=excluded.complexity_level,time_structure=excluded.time_structure,
 principal_protection_basis=excluded.principal_protection_basis,source_basis=excluded.source_basis,
 as_of_date=excluded.as_of_date,updated_at=now();
