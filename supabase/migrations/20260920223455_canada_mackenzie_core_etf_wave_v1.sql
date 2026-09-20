
-- Canada ETF expansion wave 3: Mackenzie core + allocation research set.
-- Uses official Mackenzie product/fund profile evidence. Regulatory Fund Facts are linked through Mackenzie's official fund-facts library.
-- Missing regulatory document dates/MERs stay null rather than inferred.

insert into public.investment_issuers(name,website,country_code)
values ('Mackenzie Investments','https://www.mackenzieinvestments.com/','CA')
on conflict (name) do update
set website=excluded.website,country_code=excluded.country_code,updated_at=now();

with rows(symbol,name,category,subcategory,strategy,region,description,inception_date) as (
  values
  ('QCN','Mackenzie Canadian Equity Index ETF','Equity','Canada','Broad-market Canadian equity index tracking','Canada','Canadian broad-market equity ETF tracking the Solactive Canada Broad Market Index.','2018-01-24'::date),
  ('MKB','Mackenzie Canadian Strategic Fixed Income ETF','Fixed Income','Canadian Fixed Income','Active core-plus Canadian fixed income','Canada','Active Canadian core-plus fixed-income ETF investing across government and corporate debt.','2016-04-19'::date),
  ('MCON','Mackenzie Conservative Allocation ETF','Asset Allocation','All-in-one','Conservative global asset allocation','Global','All-in-one conservative allocation ETF targeting roughly 40% equity and 60% fixed income.','2020-09-29'::date),
  ('MBAL','Mackenzie Balanced Allocation ETF','Asset Allocation','All-in-one','Balanced global asset allocation','Global','All-in-one balanced allocation ETF targeting roughly 60% equity and 40% fixed income.','2020-09-29'::date),
  ('MGRW','Mackenzie Growth Allocation ETF','Asset Allocation','All-in-one','Growth global asset allocation','Global','All-in-one growth allocation ETF targeting roughly 80% equity and 20% fixed income.','2020-09-29'::date),
  ('MEQT','Mackenzie All-Equity Allocation ETF','Equity','All-in-one','Global all-equity allocation','Global','All-in-one global equity allocation ETF targeting 100% equities.','2023-11-20'::date)
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

with facts(symbol,product_url,profile_url,mgmt_fee) as (
 values
 ('QCN','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-equity-index-etf-qcn','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf',0.04::numeric),
 ('MKB','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-strategic-fixed-income-etf-mkb','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mkb-en.pdf',0.40),
 ('MCON','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-conservative-allocation-etf-mcon','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mcon-en.pdf',0.17),
 ('MBAL','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-balanced-allocation-etf-mbal','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mbal-en.pdf',0.17),
 ('MGRW','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-growth-allocation-etf-mgrw','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mgrw-en.pdf',0.17),
 ('MEQT','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-all-equity-allocation-etf-meqt','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-meqt-en.pdf',0.17)
)
insert into public.investment_official_facts(
 investment_id,source_name,product_url,etf_facts_url,etf_facts_date,
 management_fee_pct,mer_pct,fee_source_note,verified_at
)
select i.id,'Mackenzie Investments',f.product_url,'https://www.mackenzieinvestments.com/en/fund-facts',null,
       f.mgmt_fee,null,
       'Management fee from official Mackenzie 2026 fund profile / ETF list. Current Fund Facts are linked through Mackenzie’s official fund-facts library; the direct document date was not exposed in the public indexed page, so ETF Facts date and MER remain null.',
       now()
from facts f join public.investments i on i.symbol=f.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
 source_name=excluded.source_name,product_url=excluded.product_url,etf_facts_url=excluded.etf_facts_url,
 etf_facts_date=null,management_fee_pct=excluded.management_fee_pct,mer_pct=null,
 fee_source_note=excluded.fee_source_note,verified_at=now();

with src(symbol,url,scope) as (
 values
 ('QCN','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-qcn-en.pdf','identity,performance,risk,holdings,exposure,characteristics'),
 ('MKB','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mkb-en.pdf','identity,performance,risk,income,holdings,exposure,characteristics'),
 ('MCON','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mcon-en.pdf','identity,performance,risk,income,holdings,exposure,characteristics'),
 ('MBAL','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mbal-en.pdf','identity,performance,risk,income,holdings,exposure,characteristics'),
 ('MGRW','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-mgrw-en.pdf','identity,performance,risk,income,holdings,exposure,characteristics'),
 ('MEQT','https://www.mackenzieinvestments.com/content/dam/mackenzie/en/mackenzie-fundprofiles/fundprofile-meqt-en.pdf','identity,performance,risk,income,holdings,exposure,characteristics')
)
insert into public.investment_data_sources(
 investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Mackenzie Investments','official',s.url,s.scope,now(),'2026-09-20',
       'Official Mackenzie 2026 fund profile; field-specific dates are preserved in canonical tables.'
from src s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
where not exists (
 select 1 from public.investment_data_sources x
 where x.investment_id=i.id and x.source_url=s.url and x.source_version='2026-09-20'
);

-- NAV/AUM snapshots from official fund profiles.
with m(symbol,as_of_date,price,aum,frequency) as (
 values
 ('QCN','2026-07-31'::date,215.34::numeric,5710000000::numeric,'Quarterly'),
 ('MKB','2026-07-31',18.93,907590000,'Monthly'),
 ('MCON','2026-07-31',24.82,39720000,'Quarterly'),
 ('MBAL','2026-07-31',30.18,236930000,'Quarterly'),
 ('MGRW','2026-07-31',36.46,82050000,'Quarterly'),
 ('MEQT','2026-07-31',34.08,39190000,'Quarterly')
)
insert into public.investment_metrics(investment_id,as_of_date,price,aum,distribution_frequency)
select i.id,m.as_of_date,m.price,m.aum,m.frequency
from m join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 price=excluded.price,aum=excluded.aum,distribution_frequency=excluded.distribution_frequency;

-- Issuer-verified total returns.
with p(symbol,r1m,r3m,r1y,r3y,r5y,si) as (
 values
 ('QCN',1.2::numeric,4.2::numeric,32.2::numeric,22.9::numeric,15.0::numeric,12.7::numeric),
 ('MKB',-1.5,0.2,2.7,4.3,0.5,2.3),
 ('MCON',-1.2,2.5,11.1,10.7,5.4,6.1),
 ('MBAL',-1.0,3.8,16.0,14.3,8.3,9.5),
 ('MGRW',-0.8,5.1,21.1,18.0,11.2,12.8),
 ('MEQT',-0.6,6.4,26.3,null::numeric,null::numeric,23.6)
)
insert into public.investment_performance_history(
 investment_id,as_of_date,return_1m_pct,return_3m_pct,return_1y_pct,
 return_3y_annualized_pct,return_5y_annualized_pct,since_inception_annualized_pct,
 return_basis,source_id,source_note,verification_status
)
select i.id,'2026-07-31',p.r1m,p.r3m,p.r1y,p.r3y,p.r5y,p.si,'issuer_total_return',
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1),
       'Official Mackenzie fund-profile compound annualized returns as at 2026-07-31. Unavailable periods caused by fund age remain null.',
       'issuer_verified'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,return_basis) do update set
 return_1m_pct=excluded.return_1m_pct,return_3m_pct=excluded.return_3m_pct,return_1y_pct=excluded.return_1y_pct,
 return_3y_annualized_pct=excluded.return_3y_annualized_pct,return_5y_annualized_pct=excluded.return_5y_annualized_pct,
 since_inception_annualized_pct=excluded.since_inception_annualized_pct,source_id=excluded.source_id,
 source_note=excluded.source_note,verification_status='issuer_verified';

with rr(symbol,rating) as (
 values
 ('QCN','Medium'),('MKB','Low'),('MCON','Low to Medium'),('MBAL','Low to Medium'),('MGRW','Low to Medium'),('MEQT','Medium')
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
select i.id,m.rating,m.band_min,m.band_max,'Mackenzie Investments','Official fund profile',
       'Mackenzie ETF Fund Profile',
       (select s.source_url from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1),
       '2026-07-31','2026-07-31','Issuer-disclosed Canadian five-band risk classification.',
       'Verified against Mackenzie official 2026 fund profile.',now(),now()
from mapped m join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
 official_risk_rating=excluded.official_risk_rating,band_min=excluded.band_min,band_max=excluded.band_max,
 issuer=excluded.issuer,source_type=excluded.source_type,source_title=excluded.source_title,
 source_url=excluded.source_url,source_date=excluded.source_date,effective_date=excluded.effective_date,
 methodology=excluded.methodology,verification_note=excluded.verification_note,verified_at=now(),updated_at=now();

with rm(symbol,sd,beta,risk) as (
 values
 ('QCN',10.8::numeric,1.0::numeric,'Medium'),
 ('MKB',4.9,0.9,'Low'),
 ('MCON',6.1,1.0,'Low to Medium'),
 ('MBAL',7.2,1.0,'Low to Medium'),
 ('MGRW',8.5,1.0,'Low to Medium'),
 ('MEQT',null::numeric,null::numeric,'Medium')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level,standard_deviation_pct,beta)
select i.id,'2026-07-31',rm.risk,rm.sd,rm.beta
from rm join public.investments i on i.symbol=rm.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 risk_level=excluded.risk_level,standard_deviation_pct=excluded.standard_deviation_pct,beta=excluded.beta;

-- Income snapshots and portfolio characteristics.
with inc(symbol,yield,frequency) as (
 values
 ('QCN',2.06::numeric,'Quarterly'),('MKB',2.90,'Monthly'),('MCON',2.35,'Quarterly'),
 ('MBAL',2.11,'Quarterly'),('MGRW',1.85,'Quarterly'),('MEQT',1.74,'Quarterly')
)
insert into public.investment_income_history(
 investment_id,as_of_date,distribution_yield_pct,distribution_frequency,source_id,source_note
)
select i.id,'2026-07-31',x.yield,x.frequency,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1),
       'Official Mackenzie fund-profile distribution yield / frequency snapshot.'
from inc x join public.investments i on i.symbol=x.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 distribution_yield_pct=excluded.distribution_yield_pct,distribution_frequency=excluded.distribution_frequency,
 source_id=excluded.source_id,source_note=excluded.source_note;

with pc(symbol,nh,ytm,dur,pe,pb) as (
 values
 ('QCN',333,null::numeric,null::numeric,19.66::numeric,2.67::numeric),
 ('MKB',535,3.90,7.01,null,null),
 ('MCON',8,4.18,7.88,22.15,3.31),
 ('MBAL',8,4.27,8.05,22.15,3.31),
 ('MGRW',8,4.17,7.86,22.15,3.31),
 ('MEQT',4,null,null,22.14,3.31)
)
insert into public.investment_portfolio_characteristics(
 investment_id,as_of_date,number_of_holdings,yield_to_maturity_pct,average_duration_years,pe_ratio,pb_ratio,source_id
)
select i.id,'2026-07-31',p.nh,p.ytm,p.dur,p.pe,p.pb,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1)
from pc p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 number_of_holdings=excluded.number_of_holdings,yield_to_maturity_pct=excluded.yield_to_maturity_pct,
 average_duration_years=excluded.average_duration_years,pe_ratio=excluded.pe_ratio,pb_ratio=excluded.pb_ratio,
 source_id=excluded.source_id;

-- Complete asset-class allocation sets.
with e(symbol,bucket,weight) as (
 values
 ('MCON','Equity',40::numeric),('MCON','Fixed Income',60),
 ('MBAL','Equity',60),('MBAL','Fixed Income',40),
 ('MGRW','Equity',80),('MGRW','Fixed Income',20),
 ('MEQT','Equity',100),
 ('QCN','Canadian Equities',100),
 ('MKB','Fixed Income',100)
)
insert into public.investment_exposure_breakdown(
 investment_id,as_of_date,dimension,bucket,weight_pct,source_id,set_coverage_pct,is_complete_set
)
select i.id,'2026-07-31','asset_class',e.bucket,e.weight,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1),
       100,true
from e join public.investments i on i.symbol=e.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,dimension,bucket) do update set
 weight_pct=excluded.weight_pct,source_id=excluded.source_id,set_coverage_pct=100,is_complete_set=true;

-- Full underlying holdings for allocation ETFs; top holdings for QCN/MKB.
with h(symbol,name,weight,atype) as (
 values
 ('MCON','Mackenzie Canadian Aggregate Bond Index ETF',35.0::numeric,'ETF'),
 ('MCON','Mackenzie US Large Cap Equity Index ETF',17.8,'ETF'),
 ('MCON','Mackenzie US Aggregate Bond Index ETF',13.6,'ETF'),
 ('MCON','Mackenzie Canadian Equity Index ETF',12.0,'ETF'),
 ('MCON','Mackenzie Developed ex-North America Aggregate Bond Index ETF',9.5,'ETF'),
 ('MCON','Mackenzie International Equity Index ETF',8.0,'ETF'),
 ('MCON','Mackenzie Emerging Markets Equity Index ETF',2.7,'ETF'),
 ('MCON','Mackenzie Emerging Markets Local Currency Bond Index ETF',1.2,'ETF'),
 ('MCON','Cash & Cash Equivalents',0.2,'Cash'),

 ('MBAL','Mackenzie US Large Cap Equity Index ETF',26.6,'ETF'),
 ('MBAL','Mackenzie Canadian Aggregate Bond Index ETF',23.2,'ETF'),
 ('MBAL','Mackenzie Canadian Equity Index ETF',18.0,'ETF'),
 ('MBAL','Mackenzie International Equity Index ETF',11.9,'ETF'),
 ('MBAL','Mackenzie US Aggregate Bond Index ETF',9.0,'ETF'),
 ('MBAL','Mackenzie Developed ex-North America Aggregate Bond Index ETF',6.3,'ETF'),
 ('MBAL','Mackenzie Emerging Markets Equity Index ETF',4.0,'ETF'),
 ('MBAL','Mackenzie Emerging Markets Local Currency Bond Index ETF',0.8,'ETF'),
 ('MBAL','Cash & Cash Equivalents',0.1,'Cash'),

 ('MGRW','Mackenzie US Large Cap Equity Index ETF',35.4,'ETF'),
 ('MGRW','Mackenzie Canadian Equity Index ETF',23.9,'ETF'),
 ('MGRW','Mackenzie International Equity Index ETF',15.8,'ETF'),
 ('MGRW','Mackenzie Canadian Aggregate Bond Index ETF',11.6,'ETF'),
 ('MGRW','Mackenzie Emerging Markets Equity Index ETF',5.3,'ETF'),
 ('MGRW','Mackenzie US Aggregate Bond Index ETF',4.5,'ETF'),
 ('MGRW','Mackenzie Developed ex-North America Aggregate Bond Index ETF',3.1,'ETF'),
 ('MGRW','Mackenzie Emerging Markets Local Currency Bond Index ETF',0.4,'ETF'),
 ('MGRW','Cash & Cash Equivalents',0.1,'Cash'),

 ('MEQT','Mackenzie US Large Cap Equity Index ETF',44.0,'ETF'),
 ('MEQT','Mackenzie Canadian Equity Index ETF',29.7,'ETF'),
 ('MEQT','Mackenzie International Equity Index ETF',19.7,'ETF'),
 ('MEQT','Mackenzie Emerging Markets Equity Index ETF',6.6,'ETF'),

 ('QCN','Royal Bank of Canada',8.1,'Equity'),
 ('QCN','Toronto-Dominion Bank',5.5,'Equity'),
 ('QCN','Shopify Inc Class A',4.0,'Equity'),
 ('QCN','Bank of Montreal',3.5,'Equity'),
 ('QCN','Enbridge Inc',3.3,'Equity'),

 ('MKB','Canada 3.25% 01-Jun-2035',6.4,'Fixed Income'),
 ('MKB','CAD Cash Sweep',4.0,'Cash'),
 ('MKB','Ontario 3.90% 02-Jun-2036',3.2,'Fixed Income'),
 ('MKB','Canada 3.50% 01-Dec-2057',2.6,'Fixed Income'),
 ('MKB','Quebec 4.40% 01-Dec-2055',2.6,'Fixed Income')
)
insert into public.investment_holdings(investment_id,as_of_date,holding_name,asset_type,weight_pct,source_id)
select i.id,'2026-07-31',h.name,h.atype,h.weight,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1)
from h join public.investments i on i.symbol=h.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,holding_name) do update set
 asset_type=excluded.asset_type,weight_pct=excluded.weight_pct,source_id=excluded.source_id;

with s(symbol,vol,income,growth,rate,credit,diversification,complexity,basis) as (
 values
 ('QCN','medium','low','high','not_applicable','Canadian equity issuers','diversified','low','ETF units are not guaranteed or insured.'),
 ('MKB','low','high','low','medium','Canadian government and corporate bond issuers','diversified','medium','Bond ETF units are not principal-guaranteed and can decline as interest rates or credit conditions change.'),
 ('MCON','low','high','medium','medium','Global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed or insured.'),
 ('MBAL','low','medium','medium','medium','Global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed or insured.'),
 ('MGRW','low','low','high','low','Global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed or insured.'),
 ('MEQT','medium','low','high','not_applicable','Global equity issuers','diversified','low','All-equity ETF units are not guaranteed or insured.')
)
insert into public.investment_structure_profiles(
 investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,
 growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,
 time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1','none','high',s.vol,s.income,s.growth,s.rate,s.credit,s.diversification,s.complexity,
       'open_ended',s.basis,
       jsonb_build_object('source','Mackenzie Investments official 2026 fund profile','verified_on','2026-09-20'),
       '2026-07-31'
from s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
on conflict (investment_id,model_version) do update set
 capital_protection=excluded.capital_protection,liquidity_level=excluded.liquidity_level,
 price_volatility=excluded.price_volatility,income_predictability=excluded.income_predictability,
 growth_participation=excluded.growth_participation,interest_rate_sensitivity=excluded.interest_rate_sensitivity,
 credit_exposure=excluded.credit_exposure,diversification_level=excluded.diversification_level,
 complexity_level=excluded.complexity_level,time_structure=excluded.time_structure,
 principal_protection_basis=excluded.principal_protection_basis,source_basis=excluded.source_basis,
 as_of_date=excluded.as_of_date,updated_at=now();

with p(symbol,objective,benchmark,target,geo,policy,style,replication,risks,summary) as (
 values
 ('QCN','Track broad Canadian equities.','Solactive Canada Broad Market Index','{"equity":100,"fixed_income":0}'::jsonb,'{"Canada":100}'::jsonb,'Quarterly','Passive index tracking','Index replication','["Canadian equity market risk","Sector concentration"]'::jsonb,'Broad Canadian market-cap-weighted equity exposure.'),
 ('MKB','Seek enhanced returns while maintaining a quality Canadian bond risk profile.','FTSE Canada Universe Bond Index','{"equity":0,"fixed_income":100}','{"Canada":82.4,"Other":17.6}','Monthly','Active core-plus fixed income','Direct bonds and permitted active exposures','["Interest-rate risk","Credit risk","Foreign fixed-income exposure"]','Active Canadian core-plus fixed-income ETF.'),
 ('MCON','Seek income and moderate long-term growth through a diversified ETF portfolio.','Blended benchmark','{"equity":40,"fixed_income":60}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Conservative all-in-one portfolio with a larger fixed-income allocation.'),
 ('MBAL','Seek long-term growth with a moderate level of income.','Blended benchmark','{"equity":60,"fixed_income":40}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Balanced all-in-one global ETF portfolio.'),
 ('MGRW','Seek long-term capital growth through a diversified ETF portfolio.','Blended benchmark','{"equity":80,"fixed_income":20}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying ETFs','["Equity market risk","Interest-rate risk","Currency risk"]','Growth-oriented all-in-one global ETF portfolio.'),
 ('MEQT','Seek long-term capital growth through a globally diversified equity ETF portfolio.','Blended benchmark','{"equity":100,"fixed_income":0}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying ETFs','["Equity market risk","Currency risk","Global market drawdowns"]','All-equity one-ticket portfolio diversified across Canada, the U.S. and international markets.')
)
insert into public.investment_profiles(
 investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
 currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,
 source_id,as_of_date,model_version
)
select i.id,p.objective,p.benchmark,'Issuer strategy summarized for Investor DNA research.',
       'Issuer-defined ETF portfolio construction',p.target,p.geo,null,p.policy,p.style,p.replication,
       null,p.risks,p.summary,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_name='Mackenzie Investments' order by s.created_at desc limit 1),
       '2026-07-31','profile-v1.0'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,model_version) do update set
 objective=excluded.objective,benchmark=excluded.benchmark,methodology=excluded.methodology,
 portfolio_construction=excluded.portfolio_construction,target_allocation=excluded.target_allocation,
 geographic_exposure=excluded.geographic_exposure,currency_hedging=excluded.currency_hedging,
 distribution_policy=excluded.distribution_policy,management_style=excluded.management_style,
 replication_method=excluded.replication_method,ideal_for=null,key_risks=excluded.key_risks,
 profile_summary=excluded.profile_summary,source_id=excluded.source_id,as_of_date=excluded.as_of_date,updated_at=now();
