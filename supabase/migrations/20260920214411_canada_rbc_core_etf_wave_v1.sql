
-- Canada ETF expansion wave 4: RBC GAM core research set.
-- Uses dated RBC ETF Facts / official product pages. Missing history stays null.

insert into public.investment_issuers(name,website,country_code)
values ('RBC Global Asset Management Inc.','https://www.rbcgam.com/','CA')
on conflict (name) do update
set website=excluded.website,country_code=excluded.country_code,updated_at=now();

with rows(symbol,name,category,subcategory,strategy,region,description,inception_date) as (
  values
  ('RCAN','RBC Canadian Equity ETF','Equity','Canada','Active Canadian equity','Canada','Actively managed Canadian equity ETF seeking long-term capital growth through broad exposure to Canadian companies.','2026-03-25'::date),
  ('RUSA','RBC U.S. Large-Cap Equity ETF','Equity','United States','Active U.S. large-cap equity','United States','Actively managed U.S. large-cap equity ETF seeking long-term capital growth.','2026-03-25'::date),
  ('RCD','RBC Quant Canadian Dividend Leaders ETF','Equity','Canadian Dividend','Rules-based multi-factor dividend equity','Canada','Rules-based Canadian dividend equity ETF emphasizing quality, balance-sheet strength and sustainable dividends.','2014-01-15'::date),
  ('RID','RBC Quant EAFE Dividend Leaders ETF','Equity','International Developed','Rules-based multi-factor dividend equity','International','Rules-based EAFE dividend equity ETF focused on quality companies and sustainable dividends.','2014-01-15'::date),
  ('RBNK','RBC Canadian Bank Yield Index ETF','Equity','Financials','Canadian bank yield-weighted index','Canada','Concentrated ETF tracking six large Canadian banks using a dividend-yield weighting methodology.','2017-10-19'::date),
  ('RUST','RBC Canadian Ultra Short Term Bond ETF','Fixed Income','Ultra-Short Corporate Bond','Active ultra-short Canadian corporate bond','Canada','Actively managed ultra-short Canadian fixed-income ETF focused primarily on investment-grade corporate bonds with short remaining maturities.','2025-04-02'::date)
)
insert into public.investments(
  symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,
  country_code,currency,exchange,description,inception_date,is_active,is_featured,data_status
)
select r.symbol,r.name,r.name,'ETF',iss.id,r.category,r.subcategory,r.strategy,r.region,
       'CA','CAD','TSX',r.description,r.inception_date,true,false,'verified_partial'
from rows r
join public.investment_issuers iss on iss.name='RBC Global Asset Management Inc.'
on conflict (symbol,exchange) do update set
  name=excluded.name,legal_name=excluded.legal_name,issuer_id=excluded.issuer_id,
  category=excluded.category,subcategory=excluded.subcategory,strategy=excluded.strategy,
  region=excluded.region,country_code='CA',currency='CAD',description=excluded.description,
  inception_date=excluded.inception_date,is_active=true,data_status='verified_partial',updated_at=now();

with facts(symbol,product_url,facts_url,facts_date,management_fee,mer,frequency) as (
  values
  ('RCAN','https://www.rbcgam.com/en/ca/products/etfs/rcan/detail','https://funds.rbcgam.com/pdf/fund-facts/etfs/rcan_e.pdf','2026-03-25'::date,0.39::numeric,null::numeric,'Monthly'),
  ('RUSA','https://www.rbcgam.com/en/ca/products/etfs/rusa/detail','https://funds.rbcgam.com/pdf/fund-facts/etfs/rusa_e.pdf','2026-03-25',0.39,null,'Monthly'),
  ('RCD','https://www.rbcgam.com/en/ca/products/etfs/rcd/detail','https://funds.rbcgam.com/pdf/fund-facts/etfs/rcd_e.pdf','2026-03-18',null,0.43,'Monthly'),
  ('RID','https://www.rbcgam.com/en/ca/products/etfs/rid/detail','https://funds.rbcgam.com/pdf/fund-facts/etfs/rid_e.pdf','2026-03-18',null,0.54,'Monthly'),
  ('RBNK','https://www.rbcgam.com/en/ca/products/etfs/rbnk/detail','https://funds.rbcgam.com/pdf/fund-facts/etfs/rbnk_e.pdf','2026-03-18',null,0.32,'Monthly'),
  ('RUST','https://www.rbcgam.com/en/ca/products/etfs/rust/detail','https://funds.rbcgam.com/pdf/fund-facts/etfs/rust_e.pdf','2026-03-18',0.20,0.23,'Monthly')
)
insert into public.investment_official_facts(
  investment_id,source_name,product_url,etf_facts_url,etf_facts_date,
  management_fee_pct,mer_pct,fee_source_note,verified_at
)
select i.id,'RBC Global Asset Management Inc.',f.product_url,f.facts_url,f.facts_date,
       f.management_fee,f.mer,
       case
         when i.symbol in ('RCAN','RUSA') then 'ETF Facts reports MER unavailable because the ETF is new; annual management fee is 0.39%.'
         else 'MER preserved from dated official RBC ETF Facts; management fee is stored only where independently stated by the issuer.'
       end,
       now()
from facts f join public.investments i on i.symbol=f.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
  source_name=excluded.source_name,product_url=excluded.product_url,etf_facts_url=excluded.etf_facts_url,
  etf_facts_date=excluded.etf_facts_date,management_fee_pct=excluded.management_fee_pct,
  mer_pct=excluded.mer_pct,fee_source_note=excluded.fee_source_note,verified_at=now();

with src(symbol,url,scope,note) as (
  values
  ('RCAN','https://funds.rbcgam.com/pdf/fund-facts/etfs/rcan_e.pdf','official_facts,risk,fees,objective','Official RBC ETF Facts dated 2026-03-25.'),
  ('RUSA','https://funds.rbcgam.com/pdf/fund-facts/etfs/rusa_e.pdf','official_facts,risk,fees,objective','Official RBC ETF Facts dated 2026-03-25.'),
  ('RCD','https://funds.rbcgam.com/pdf/fund-facts/etfs/rcd_e.pdf','official_facts,risk,fees,holdings,exposures,performance','Official RBC ETF Facts dated 2026-03-18.'),
  ('RID','https://funds.rbcgam.com/pdf/fund-facts/etfs/rid_e.pdf','official_facts,risk,fees,holdings,exposures,performance','Official RBC ETF Facts dated 2026-03-18.'),
  ('RBNK','https://funds.rbcgam.com/pdf/fund-facts/etfs/rbnk_e.pdf','official_facts,risk,fees,holdings,exposures,performance','Official RBC ETF Facts dated 2026-03-18.'),
  ('RUST','https://funds.rbcgam.com/pdf/fund-facts/etfs/rust_e.pdf','official_facts,risk,fees,holdings,exposures','Official RBC ETF Facts dated 2026-03-18.')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'RBC Global Asset Management Inc.','official',s.url,s.scope,now(),'2026-09-20',s.note
from src s join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
where not exists (
  select 1 from public.investment_data_sources x
  where x.investment_id=i.id and x.source_url=s.url and x.source_version='2026-09-20'
);

-- Official risk ratings.
with rr(symbol,rating,source_date) as (
 values
 ('RCAN','Medium','2026-03-25'::date),
 ('RUSA','Medium','2026-03-25'),
 ('RCD','Medium','2026-03-18'),
 ('RID','Medium','2026-03-18'),
 ('RBNK','Medium to High','2026-03-18'),
 ('RUST','Low','2026-03-18')
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
select i.id,m.rating,m.band_min,m.band_max,'RBC Global Asset Management Inc.',
       'ETF Facts','RBC ETF Facts',f.etf_facts_url,m.source_date,m.source_date,
       'Issuer-disclosed Canadian ETF risk classification.',
       case when i.symbol in ('RCAN','RUSA') then 'Issuer notes the risk rating is an estimate because the ETF is new.'
            else 'Verified against dated official RBC ETF Facts.' end,
       now(),now()
from mapped m
join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
join public.investment_official_facts f on f.investment_id=i.id
on conflict (investment_id) do update set
 official_risk_rating=excluded.official_risk_rating,band_min=excluded.band_min,band_max=excluded.band_max,
 issuer=excluded.issuer,source_type=excluded.source_type,source_title=excluded.source_title,
 source_url=excluded.source_url,source_date=excluded.source_date,effective_date=excluded.effective_date,
 methodology=excluded.methodology,verification_note=excluded.verification_note,verified_at=now(),updated_at=now();

-- Since-inception annualized returns directly disclosed in ETF Facts.
with p(symbol,as_of_date,si) as (
 values
 ('RCD','2026-02-28'::date,13.0::numeric),
 ('RID','2026-02-28',10.3),
 ('RBNK','2026-02-28',13.7)
)
insert into public.investment_performance_history(
 investment_id,as_of_date,since_inception_annualized_pct,return_basis,source_id,source_note,verification_status
)
select i.id,p.as_of_date,p.si,'issuer_total_return',
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1),
       'Annual compound return disclosed in current RBC ETF Facts; period-specific 1y/3y/5y fields remain null unless separately sourced.',
       'issuer_verified'
from p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,return_basis) do update set
 since_inception_annualized_pct=excluded.since_inception_annualized_pct,
 source_id=excluded.source_id,source_note=excluded.source_note,verification_status='issuer_verified';

-- Portfolio characteristics from current ETF Facts / official RCAN product page.
with pc(symbol,as_of_date,holdings) as (
 values
 ('RCAN','2026-04-30'::date,55),
 ('RCD','2026-02-28',58),
 ('RID','2026-02-28',113),
 ('RBNK','2026-02-28',6),
 ('RUST','2026-02-28',24)
)
insert into public.investment_portfolio_characteristics(investment_id,as_of_date,number_of_holdings,source_id)
select i.id,pc.as_of_date,pc.holdings,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1)
from pc join public.investments i on i.symbol=pc.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
 number_of_holdings=excluded.number_of_holdings,source_id=excluded.source_id;

-- Complete sector / asset-class exposure sets from RBC ETF Facts.
with e(symbol,as_of_date,dimension,bucket,weight) as (
 values
 ('RCD','2026-02-28'::date,'sector','Financials',29.0::numeric),
 ('RCD','2026-02-28','sector','Materials',18.2),
 ('RCD','2026-02-28','sector','Energy',17.0),
 ('RCD','2026-02-28','sector','Industrials',7.4),
 ('RCD','2026-02-28','sector','Information Technology',7.0),
 ('RCD','2026-02-28','sector','Utilities',6.9),
 ('RCD','2026-02-28','sector','Communication Services',4.6),
 ('RCD','2026-02-28','sector','Consumer Discretionary',4.2),
 ('RCD','2026-02-28','sector','Consumer Staples',3.3),
 ('RCD','2026-02-28','sector','Real Estate',2.2),
 ('RCD','2026-02-28','sector','Cash/Other',0.2),

 ('RID','2026-02-28','sector','Industrials',21.5),
 ('RID','2026-02-28','sector','Financials',21.1),
 ('RID','2026-02-28','sector','Health Care',10.9),
 ('RID','2026-02-28','sector','Information Technology',9.0),
 ('RID','2026-02-28','sector','Consumer Discretionary',8.4),
 ('RID','2026-02-28','sector','Materials',7.3),
 ('RID','2026-02-28','sector','Utilities',6.6),
 ('RID','2026-02-28','sector','Communication Services',5.6),
 ('RID','2026-02-28','sector','Consumer Staples',4.7),
 ('RID','2026-02-28','sector','Energy',3.1),
 ('RID','2026-02-28','sector','Cash/Other',1.1),
 ('RID','2026-02-28','sector','Real Estate',0.7),

 ('RBNK','2026-02-28','asset_class','Common Equities',100.0),

 ('RUST','2026-02-28','sector','Financials',60.0),
 ('RUST','2026-02-28','sector','Real Estate',15.7),
 ('RUST','2026-02-28','sector','Energy',10.8),
 ('RUST','2026-02-28','sector','Industrials',6.8),
 ('RUST','2026-02-28','sector','Cash/Other',4.4),
 ('RUST','2026-02-28','sector','Securitized Debt',2.3)
)
insert into public.investment_exposure_breakdown(
 investment_id,as_of_date,dimension,bucket,weight_pct,source_id,set_coverage_pct,is_complete_set
)
select i.id,e.as_of_date,e.dimension,e.bucket,e.weight,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1),
       100,true
from e join public.investments i on i.symbol=e.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,dimension,bucket) do update set
 weight_pct=excluded.weight_pct,source_id=excluded.source_id,set_coverage_pct=100,is_complete_set=true;

-- Holdings. RBNK is complete; others preserve top holdings only.
with h(symbol,as_of_date,name,weight,atype) as (
 values
 ('RBNK','2026-02-28'::date,'Bank of Montreal',25.1::numeric,'Equity'),
 ('RBNK','2026-02-28','Bank of Nova Scotia',24.0,'Equity'),
 ('RBNK','2026-02-28','Canadian Imperial Bank of Commerce',17.3,'Equity'),
 ('RBNK','2026-02-28','Toronto-Dominion Bank',16.5,'Equity'),
 ('RBNK','2026-02-28','National Bank of Canada',9.2,'Equity'),
 ('RBNK','2026-02-28','Royal Bank of Canada',7.9,'Equity'),

 ('RCD','2026-02-28','Barrick Mining Corp.',6.0,'Equity'),
 ('RCD','2026-02-28','Royal Bank of Canada',5.5,'Equity'),
 ('RCD','2026-02-28','Bank of Nova Scotia',5.4,'Equity'),
 ('RCD','2026-02-28','Constellation Software Inc.',5.3,'Equity'),
 ('RCD','2026-02-28','Bank of Montreal',5.3,'Equity'),

 ('RID','2026-02-28','ASML Holding N.V.',3.5,'Equity'),
 ('RID','2026-02-28','Roche Holding AG',3.1,'Equity'),
 ('RID','2026-02-28','ING Groep N.V.',3.0,'Equity'),
 ('RID','2026-02-28','BHP Group Ltd.',2.9,'Equity'),
 ('RID','2026-02-28','Cash & Cash Equivalents',2.9,'Cash'),

 ('RUST','2026-02-28','Royal Bank of Canada 2.140% Nov 03 2031',7.2,'Fixed Income'),
 ('RUST','2026-02-28','Canadian Imperial Bank of Commerce 4.900% Apr 02 2027',6.8,'Fixed Income'),
 ('RUST','2026-02-28','Pembina Pipeline Corp. 3.710% Aug 11 2026',6.6,'Fixed Income'),
 ('RUST','2026-02-28','H&R Real Estate Investment Trust 2.906% Jun 02 2026',6.6,'Fixed Income'),
 ('RUST','2026-02-28','Mercedes-Benz Finance Canada Inc. 5.140% Jun 29 2026',5.6,'Fixed Income'),

 ('RCAN','2026-04-30','Royal Bank of Canada',6.9,'Equity'),
 ('RCAN','2026-04-30','Toronto-Dominion Bank',6.4,'Equity'),
 ('RCAN','2026-04-30','Brookfield Corp',4.4,'Equity'),
 ('RCAN','2026-04-30','Canadian Natural Resources Ltd',4.1,'Equity'),
 ('RCAN','2026-04-30','Enbridge Inc',3.5,'Equity')
)
insert into public.investment_holdings(
 investment_id,as_of_date,holding_name,asset_type,weight_pct,source_id
)
select i.id,h.as_of_date,h.name,h.atype,h.weight,
       (select s.id from public.investment_data_sources s where s.investment_id=i.id order by s.created_at desc limit 1)
from h join public.investments i on i.symbol=h.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date,holding_name) do update set
 asset_type=excluded.asset_type,weight_pct=excluded.weight_pct,source_id=excluded.source_id;

-- Descriptive structures.
with s(symbol,vol,income,growth,rate,credit,div,complexity,basis,as_of_date) as (
 values
 ('RCAN','medium','low','high','not_applicable','Canadian equity issuers','diversified','medium','ETF units are not guaranteed; active security selection can differ materially from the Canadian market.','2026-04-30'::date),
 ('RUSA','medium','low','high','not_applicable','U.S. large-cap equity issuers','diversified','medium','ETF units are not guaranteed; active security selection and currency exposure affect outcomes.','2026-03-25'),
 ('RCD','medium','medium','high','not_applicable','Canadian dividend-paying equity issuers','diversified','medium','ETF units are not guaranteed; dividend and factor tilts can differ from the broad Canadian market.','2026-02-28'),
 ('RID','medium','medium','high','not_applicable','Developed-market dividend-paying equity issuers','diversified','medium','ETF units are not guaranteed; foreign-market and currency risk apply.','2026-02-28'),
 ('RBNK','high','medium','high','not_applicable','Six large Canadian bank issuers','limited','medium','ETF units are not guaranteed; the portfolio is concentrated in six Canadian banks.','2026-02-28'),
 ('RUST','low','high','low','low','Short-term Canadian corporate issuers','diversified','medium','ETF units are not principal-guaranteed; credit and short-term interest-rate risk remain.','2026-02-28')
)
insert into public.investment_structure_profiles(
 investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,
 growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,
 time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1','none','high',s.vol,s.income,s.growth,s.rate,s.credit,s.div,s.complexity,
 'open_ended',s.basis,
 jsonb_build_object('source','RBC GAM official ETF Facts / product page','verified_on','2026-09-20'),
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

-- Research profiles.
with p(symbol,objective,benchmark,target,geography,policy,style,replication,risks,summary,as_of_date) as (
 values
 ('RCAN','Provide long-term capital growth through Canadian equities.','Active – no single passive benchmark','{"equity":100,"fixed_income":0}'::jsonb,'{"Canada":100}'::jsonb,'Monthly','Active fundamental equity','Direct equities','["Canadian equity market risk","Active management risk","Sector concentration"]'::jsonb,'Active Canadian equity exposure managed by RBC GAM.','2026-04-30'::date),
 ('RUSA','Provide long-term capital growth through major U.S. companies.','Active – no single passive benchmark','{"equity":100,"fixed_income":0}','{"United_States":100}','Monthly','Active fundamental equity','Direct equities','["U.S. equity market risk","Active management risk","Currency risk"]','Active U.S. large-cap equity exposure managed by RBC GAM.','2026-03-25'),
 ('RCD','Seek dividend income and long-term growth from high-quality Canadian equities.','Rules-based multi-factor Canadian dividend universe','{"equity":100,"fixed_income":0}','{"Canada":100}','Monthly','Rules-based multi-factor','Direct equities','["Canadian equity market risk","Dividend factor risk","Sector concentration"]','Canadian dividend strategy emphasizing quality and dividend sustainability.','2026-02-28'),
 ('RID','Seek dividend income and long-term growth from high-quality EAFE equities.','Rules-based multi-factor EAFE dividend universe','{"equity":100,"fixed_income":0}','{"International":100}','Monthly','Rules-based multi-factor','Direct equities','["International equity market risk","Dividend factor risk","Currency risk"]','EAFE dividend strategy emphasizing quality and dividend sustainability.','2026-02-28'),
 ('RBNK','Track the Solactive Canada Bank Yield Index.','Solactive Canada Bank Yield Index','{"equity":100,"fixed_income":0}','{"Canada":100}','Monthly','Passive index','Full replication of six-bank index','["Bank-sector concentration","Canadian equity market risk","Dividend-yield weighting risk"]','Highly concentrated Canadian bank ETF holding six major banks.','2026-02-28'),
 ('RUST','Provide regular income while preserving capital through ultra-short Canadian corporate fixed income.','Active – no single passive benchmark','{"equity":0,"fixed_income":100}','{"Canada":100}','Monthly','Active fixed income','Direct short-term bonds','["Credit risk","Interest-rate risk","Liquidity risk","No principal guarantee"]','Ultra-short Canadian corporate bond ETF positioned between money-market and traditional short-term bond exposure.','2026-02-28')
)
insert into public.investment_profiles(
 investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
 currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,
 source_id,as_of_date,model_version
)
select i.id,p.objective,p.benchmark,'Issuer product structure summarized for Investor DNA research.',
 'Direct security portfolio',p.target,p.geography,null,p.policy,p.style,p.replication,
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
