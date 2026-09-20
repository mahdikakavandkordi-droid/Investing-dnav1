
-- Canada ETF expansion wave 3: Mackenzie core index + allocation set.
-- Official Mackenzie sources only. Missing fields remain null.

insert into public.investment_issuers(name,website,country_code)
values ('Mackenzie Financial Corporation','https://www.mackenzieinvestments.com/','CA')
on conflict (name) do update
set website=excluded.website,country_code=excluded.country_code,updated_at=now();

with rows(symbol,name,category,subcategory,strategy,region,description,inception_date) as (
  values
  ('QCN','Mackenzie Canadian Equity Index ETF','Equity','Canada','Traditional broad-market index','Canada','Broad Canadian equity index ETF tracking the Solactive Canada Broad Market Index.','2018-01-24'::date),
  ('QUU','Mackenzie US Large Cap Equity Index ETF','Equity','United States','Traditional U.S. large-cap index','United States','U.S. large-cap equity index ETF tracking the Solactive US Large Cap CAD Index.','2018-01-24'::date),
  ('QDX','Mackenzie International Equity Index ETF','Equity','International Developed','Traditional developed-markets index','International','Developed-markets equity ETF excluding North America.','2018-01-24'::date),
  ('QBB','Mackenzie Canadian Aggregate Bond Index ETF','Fixed Income','Aggregate Bond','Traditional Canadian aggregate bond index','Canada','Broad Canadian investment-grade aggregate bond index ETF.','2018-01-29'::date),
  ('MCON','Mackenzie Conservative Allocation ETF','Asset Allocation','All-in-one','Strategic conservative allocation','Global','All-in-one conservative portfolio targeting roughly 40% equities and 60% fixed income.','2020-09-29'::date),
  ('MBAL','Mackenzie Balanced Allocation ETF','Asset Allocation','All-in-one','Strategic balanced allocation','Global','All-in-one balanced portfolio targeting roughly 60% equities and 40% fixed income.','2020-09-29'::date),
  ('MGRW','Mackenzie Growth Allocation ETF','Asset Allocation','All-in-one','Strategic growth allocation','Global','All-in-one growth portfolio targeting roughly 80% equities and 20% fixed income.','2020-09-29'::date),
  ('MEQT','Mackenzie All-Equity Allocation ETF','Equity','All-in-one','Strategic all-equity allocation','Global','All-in-one portfolio targeting 100% equities through diversified Mackenzie index ETFs.','2023-11-20'::date)
)
insert into public.investments(
  symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,
  country_code,currency,exchange,description,inception_date,is_active,is_featured,data_status
)
select r.symbol,r.name,r.name,'ETF',iss.id,r.category,r.subcategory,r.strategy,r.region,
       'CA','CAD','TSX',r.description,r.inception_date,true,false,'verified_partial'
from rows r
join public.investment_issuers iss on iss.name='Mackenzie Financial Corporation'
on conflict (symbol,exchange) do update set
  name=excluded.name,legal_name=excluded.legal_name,issuer_id=excluded.issuer_id,
  category=excluded.category,subcategory=excluded.subcategory,strategy=excluded.strategy,
  region=excluded.region,country_code='CA',currency='CAD',description=excluded.description,
  inception_date=excluded.inception_date,is_active=true,data_status='verified_partial',updated_at=now();

with facts(symbol,product_url,management_fee,source_note) as (
  values
  ('QCN','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-equity-index-etf-qcn',0.04::numeric,'Management fee from Mackenzie official ETF list; Fund Facts available through official product page regulatory documents.'),
  ('QUU','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-us-large-cap-equity-index-etf-quu',0.06,'Management fee from Mackenzie official ETF list; Fund Facts available through official product page regulatory documents.'),
  ('QDX','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-international-equity-index-etf-qdx',0.17,'Management fee from Mackenzie official ETF list; Fund Facts available through official product page regulatory documents.'),
  ('QBB','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-aggregate-bond-index-etf-qbb',0.07,'Management fee from Mackenzie official ETF list; Fund Facts available through official product page regulatory documents.'),
  ('MCON','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-conservative-allocation-etf-mcon',0.17,'Management fee and risk source from Mackenzie official asset-allocation ETF materials.'),
  ('MBAL','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-balanced-allocation-etf-mbal',0.17,'Management fee and risk source from Mackenzie official asset-allocation ETF materials.'),
  ('MGRW','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-growth-allocation-etf-mgrw',0.17,'Management fee and risk source from Mackenzie official asset-allocation ETF materials.'),
  ('MEQT','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-all-equity-allocation-etf-meqt',0.17,'Management fee and risk source from Mackenzie official asset-allocation ETF materials.')
)
insert into public.investment_official_facts(
  investment_id,source_name,product_url,etf_facts_url,etf_facts_date,
  management_fee_pct,mer_pct,fee_source_note,verified_at
)
select i.id,'Mackenzie Investments',f.product_url,f.product_url,null,
       f.management_fee,null,f.source_note,now()
from facts f join public.investments i on i.symbol=f.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
  source_name=excluded.source_name,product_url=excluded.product_url,etf_facts_url=excluded.etf_facts_url,
  etf_facts_date=null,management_fee_pct=excluded.management_fee_pct,mer_pct=null,
  fee_source_note=excluded.fee_source_note,verified_at=now();

-- Official source provenance.
with src(symbol,url,scope,note) as (
  values
  ('QCN','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-equity-index-etf-qcn','identity,fees,risk,portfolio','Official Mackenzie product page and fund-profile material.'),
  ('QUU','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-us-large-cap-equity-index-etf-quu','identity,fees,risk,portfolio','Official Mackenzie product page and fund-profile material.'),
  ('QDX','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-international-equity-index-etf-qdx','identity,fees,risk,portfolio','Official Mackenzie product page and fund-profile material.'),
  ('QBB','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-canadian-aggregate-bond-index-etf-qbb','identity,fees,risk,portfolio','Official Mackenzie product page and fund-profile material.'),
  ('MCON','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-conservative-allocation-etf-mcon','identity,fees,risk,allocation','Official Mackenzie product page and asset-allocation ETF material.'),
  ('MBAL','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-balanced-allocation-etf-mbal','identity,fees,risk,allocation','Official Mackenzie product page and asset-allocation ETF material.'),
  ('MGRW','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-growth-allocation-etf-mgrw','identity,fees,risk,allocation','Official Mackenzie product page and asset-allocation ETF material.'),
  ('MEQT','https://www.mackenzieinvestments.com/en/products/etfs/mackenzie-all-equity-allocation-etf-meqt','identity,fees,risk,allocation,holdings','Official Mackenzie product page and asset-allocation ETF material.')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'Mackenzie Investments','official',s.url,s.scope,now(),'2026-09-20',s.note
from src s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
where not exists (
  select 1 from public.investment_data_sources x
  where x.investment_id=i.id and x.source_url=s.url and x.source_version='2026-09-20'
);

-- Current official Mackenzie performance table, as at 2026-08-31.
with p(symbol,ytd,r1y,r2y,r3y,r5y,si) as (
  values
  ('QCN',16.0::numeric,30.0::numeric,27.9::numeric,24.8::numeric,15.4::numeric,13.0::numeric),
  ('QUU',14.2,21.3,20.0,22.3,14.4,15.4),
  ('QDX',15.3,22.9,19.6,19.3,11.3,8.7),
  ('QBB',0.4,1.9,2.4,4.2,0.3,1.8),
  ('MCON',6.0,10.3,9.9,11.1,5.3,6.2),
  ('MBAL',9.2,15.3,14.2,14.9,8.2,9.5),
  ('MGRW',12.5,20.3,18.6,18.8,11.0,12.9),
  ('MEQT',15.8,25.4,23.0,null::numeric,null::numeric,23.7)
)
insert into public.investment_performance_history(
  investment_id,as_of_date,return_1y_pct,return_3y_annualized_pct,return_5y_annualized_pct,
  since_inception_annualized_pct,return_basis,source_id,source_note,verification_status
)
select i.id,'2026-08-31',p.r1y,p.r3y,p.r5y,p.si,'issuer_total_return',
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1),
       'Official Mackenzie ETF compound annual performance table as at 2026-08-31. Two-year and YTD values are source evidence but are not mapped into the current canonical return schema. Fund-age gaps remain null.',
       'issuer_verified'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,return_basis) do update set
  return_1y_pct=excluded.return_1y_pct,
  return_3y_annualized_pct=excluded.return_3y_annualized_pct,
  return_5y_annualized_pct=excluded.return_5y_annualized_pct,
  since_inception_annualized_pct=excluded.since_inception_annualized_pct,
  source_id=excluded.source_id,source_note=excluded.source_note,verification_status='issuer_verified';

-- Official risk labels from Mackenzie fund profiles / asset-allocation materials.
with rr(symbol,rating,source_date) as (
  values
  ('QCN','Medium','2025-10-31'::date),
  ('QUU','Medium','2025-09-30'),
  ('QDX','Medium','2026-04-30'),
  ('QBB','Low','2025-09-30'),
  ('MCON','Low to Medium','2025-12-01'),
  ('MBAL','Low to Medium','2025-12-01'),
  ('MGRW','Low to Medium','2025-12-01'),
  ('MEQT','Medium','2025-12-01')
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
select i.id,m.rating,m.band_min,m.band_max,'Mackenzie Investments',
       'Official fund profile','Mackenzie ETF official materials',
       coalesce(f.product_url,'https://www.mackenzieinvestments.com/en/investments/by-type/etfs'),
       m.source_date,m.source_date,'Issuer-disclosed Canadian risk classification.',
       'Verified from Mackenzie official fund-profile / asset-allocation ETF materials.',now(),now()
from mapped m
join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
join public.investment_official_facts f on f.investment_id=i.id
on conflict (investment_id) do update set
  official_risk_rating=excluded.official_risk_rating,band_min=excluded.band_min,band_max=excluded.band_max,
  issuer=excluded.issuer,source_type=excluded.source_type,source_title=excluded.source_title,
  source_url=excluded.source_url,source_date=excluded.source_date,effective_date=excluded.effective_date,
  methodology=excluded.methodology,verification_note=excluded.verification_note,verified_at=now(),updated_at=now();

-- Research risk metrics from official fund profiles where available.
with rm(symbol,as_of_date,sd,beta,risk) as (
  values
  ('QCN','2025-10-31'::date,12.0::numeric,1.0::numeric,'Medium'),
  ('QUU','2025-09-30',12.4,1.0,'Medium'),
  ('QDX','2026-04-30',10.1,1.0,'Medium'),
  ('QBB','2025-09-30',5.7,1.0,'Low')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level,standard_deviation_pct,beta)
select i.id,rm.as_of_date,rm.risk,rm.sd,rm.beta
from rm join public.investments i on i.symbol=rm.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
  risk_level=excluded.risk_level,standard_deviation_pct=excluded.standard_deviation_pct,beta=excluded.beta;

-- Portfolio characteristics supported by official fund profiles.
with pc(symbol,as_of_date,holdings,pe,pb) as (
  values
  ('QCN','2025-10-31'::date,294,20.03::numeric,2.43::numeric),
  ('QUU','2025-09-30',511,28.07,5.17),
  ('QDX','2026-04-30',907,17.42,2.07),
  ('QBB','2025-09-30',1080,null::numeric,null::numeric)
)
insert into public.investment_portfolio_characteristics(
  investment_id,as_of_date,number_of_holdings,pe_ratio,pb_ratio,source_id
)
select i.id,pc.as_of_date,pc.holdings,pc.pe,pc.pb,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1)
from pc join public.investments i on i.symbol=pc.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
  number_of_holdings=excluded.number_of_holdings,
  pe_ratio=excluded.pe_ratio,pb_ratio=excluded.pb_ratio,source_id=excluded.source_id;

-- Complete allocation sets for Mackenzie asset-allocation ETFs.
with e(symbol,as_of_date,bucket,weight) as (
  values
  ('MCON','2025-12-01'::date,'Equity',40::numeric),
  ('MCON','2025-12-01','Fixed Income',60),
  ('MBAL','2025-12-01','Equity',60),
  ('MBAL','2025-12-01','Fixed Income',40),
  ('MGRW','2025-12-01','Equity',80),
  ('MGRW','2025-12-01','Fixed Income',20),
  ('MEQT','2025-12-01','Equity',100)
)
insert into public.investment_exposure_breakdown(
  investment_id,as_of_date,dimension,bucket,weight_pct,source_id,set_coverage_pct,is_complete_set
)
select i.id,e.as_of_date,'asset_class',e.bucket,e.weight,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1),
       100,true
from e join public.investments i on i.symbol=e.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,dimension,bucket) do update set
  weight_pct=excluded.weight_pct,source_id=excluded.source_id,set_coverage_pct=100,is_complete_set=true;

-- Complete MEQT underlying allocation from official Mackenzie profile.
with h(name,weight) as (
 values
 ('Mackenzie US Large Cap Equity Index ETF',44.9::numeric),
 ('Mackenzie Canadian Equity Index ETF',30.0),
 ('Mackenzie International Equity Index ETF',18.1),
 ('Mackenzie Emerging Markets Equity Index ETF',7.0)
)
insert into public.investment_holdings(
  investment_id,as_of_date,holding_name,asset_type,weight_pct,source_id
)
select i.id,'2025-09-30',h.name,'ETF',h.weight,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1)
from h cross join public.investments i
where i.symbol='MEQT' and i.exchange='TSX'
on conflict (investment_id,as_of_date,holding_name) do update set
  asset_type=excluded.asset_type,weight_pct=excluded.weight_pct,source_id=excluded.source_id;

-- Structural profiles.
with s(symbol,vol,income,growth,rate,credit,div,complexity,basis,as_of_date) as (
 values
 ('QCN','medium','low','high','not_applicable','Canadian equity issuers','diversified','low','ETF units are not guaranteed or insured.','2025-10-31'::date),
 ('QUU','medium','low','high','not_applicable','U.S. large-cap equity issuers','diversified','low','ETF units are not guaranteed or insured; CAD investors retain currency exposure.','2025-09-30'),
 ('QDX','medium','low','high','not_applicable','Developed-market equity issuers','diversified','low','ETF units are not guaranteed or insured; international equity and currency exposure can affect value.','2026-04-30'),
 ('QBB','low','high','low','medium','Canadian government and investment-grade corporate issuers','diversified','low','Bond ETF units are not principal-guaranteed and can decline as rates or credit conditions change.','2025-09-30'),
 ('MCON','low','high','medium','medium','Diversified global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed.','2025-12-01'),
 ('MBAL','low','medium','medium','medium','Diversified global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed.','2025-12-01'),
 ('MGRW','low','low','high','low','Diversified global equity and fixed-income issuers','diversified','low','Asset-allocation ETF units are not guaranteed.','2025-12-01'),
 ('MEQT','medium','low','high','not_applicable','Diversified global equity issuers','diversified','low','All-equity ETF units are not guaranteed.','2025-12-01')
)
insert into public.investment_structure_profiles(
  investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,
  growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,
  time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1','none','high',s.vol,s.income,s.growth,s.rate,s.credit,s.div,s.complexity,
       'open_ended',s.basis,
       jsonb_build_object('source','Mackenzie Investments official materials','verified_on','2026-09-20'),
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

-- Explore / Detail / Compare profiles.
with p(symbol,objective,benchmark,target,geography,policy,style,replication,risks,summary,as_of_date) as (
 values
 ('QCN','Track broad Canadian equities.','Solactive Canada Broad Market Index','{"equity":100,"fixed_income":0}'::jsonb,'{"Canada":100}'::jsonb,'Quarterly','Traditional index','Index replication','["Canadian equity market risk","Sector concentration"]'::jsonb,'Broad Canadian equity index exposure.','2025-10-31'::date),
 ('QUU','Track U.S. large-cap equities.','Solactive US Large Cap CAD Index','{"equity":100,"fixed_income":0}','{"United_States":100}','Quarterly','Traditional index','Index replication','["U.S. equity market risk","Currency risk"]','Broad U.S. large-cap equity index exposure.','2025-09-30'),
 ('QDX','Track developed equity markets outside North America.','Solactive GBS Developed Markets ex North America Large & Mid Cap CAD Index','{"equity":100,"fixed_income":0}','{"International":100}','Quarterly','Traditional index','Index replication','["International equity market risk","Currency risk"]','Developed international equity index exposure.','2026-04-30'),
 ('QBB','Track the broad Canadian investment-grade bond market.','Solactive Canadian Float Adjusted Universe Bond Index','{"equity":0,"fixed_income":100}','{"Canada":100}','Monthly','Traditional index','Index replication / sampling','["Interest-rate risk","Credit risk","Bond market price risk"]','Broad Canadian aggregate bond index exposure.','2025-09-30'),
 ('MCON','Provide a conservative diversified one-ticket portfolio.','Blended Mackenzie allocation benchmark','{"equity":40,"fixed_income":60}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying Mackenzie ETFs','["Interest-rate risk","Credit risk","Equity market risk","Currency risk"]','Conservative all-in-one global portfolio.','2025-12-01'),
 ('MBAL','Provide a balanced diversified one-ticket portfolio.','Blended Mackenzie allocation benchmark','{"equity":60,"fixed_income":40}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying Mackenzie ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Balanced all-in-one global portfolio.','2025-12-01'),
 ('MGRW','Provide a growth-oriented diversified one-ticket portfolio.','Blended Mackenzie allocation benchmark','{"equity":80,"fixed_income":20}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying Mackenzie ETFs','["Equity market risk","Interest-rate risk","Currency risk"]','Growth-oriented all-in-one global portfolio.','2025-12-01'),
 ('MEQT','Provide long-term capital growth through a globally diversified all-equity portfolio.','Blended global equity benchmark','{"equity":100,"fixed_income":0}','{"Global":100}','Quarterly','Strategic asset allocation','Underlying Mackenzie index ETFs','["Equity market risk","Currency risk","Global market drawdowns"]','All-equity one-ticket portfolio using Mackenzie index ETFs.','2025-12-01')
)
insert into public.investment_profiles(
  investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
  currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,
  source_id,as_of_date,model_version
)
select i.id,p.objective,p.benchmark,'Issuer product structure summarized for Investor DNA research.',
       'Direct index portfolio or underlying Mackenzie ETF allocation',p.target,p.geography,null,p.policy,p.style,p.replication,
       null,p.risks,p.summary,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1),
       p.as_of_date,'profile-v1.0'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,model_version) do update set
  objective=excluded.objective,benchmark=excluded.benchmark,methodology=excluded.methodology,
  portfolio_construction=excluded.portfolio_construction,target_allocation=excluded.target_allocation,
  geographic_exposure=excluded.geographic_exposure,currency_hedging=excluded.currency_hedging,
  distribution_policy=excluded.distribution_policy,management_style=excluded.management_style,
  replication_method=excluded.replication_method,ideal_for=null,key_risks=excluded.key_risks,
  profile_summary=excluded.profile_summary,source_id=excluded.source_id,as_of_date=excluded.as_of_date,updated_at=now();
