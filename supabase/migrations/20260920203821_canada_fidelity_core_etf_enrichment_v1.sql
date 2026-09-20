
-- Fidelity Canada wave 1 research enrichment.
-- Complete official allocation sets are stored where the issuer exposes them.

with e(symbol,as_of_date,bucket,weight) as (
 values
 ('FEQT','2026-09-18'::date,'U.S. Equities',48.0::numeric),
 ('FEQT','2026-09-18','International Equities',23.3),
 ('FEQT','2026-09-18','Canadian Equities',23.3),
 ('FEQT','2026-09-18','Cryptocurrencies',3.2),
 ('FEQT','2026-09-18','Global Equities',2.3),
 ('FGRO','2026-09-18','U.S. Equities',41.4),
 ('FGRO','2026-09-18','International Equities',20.1),
 ('FGRO','2026-09-18','Canadian Equities',20.0),
 ('FGRO','2026-09-18','Investment-Grade Debt',10.1),
 ('FGRO','2026-09-18','Cryptocurrencies',3.3),
 ('FGRO','2026-09-18','Multi-Sector Fixed Income',3.2),
 ('FGRO','2026-09-18','Global Equities',1.9),
 ('FBAL','2026-09-18','Equities',59.0),
 ('FBAL','2026-09-18','Fixed Income',39.0),
 ('FBAL','2026-09-18','Cryptocurrencies',2.0),
 ('FCNS','2026-09-18','Equities',40.0),
 ('FCNS','2026-09-18','Fixed Income',59.0),
 ('FCNS','2026-09-18','Cryptocurrencies',1.0),
 ('FFIX','2026-09-17','Fixed Income',100.0),
 ('FCCA','2026-09-18','Canadian Equities',100.0),
 ('FCAM','2026-09-17','U.S. Equities',100.0),
 ('FCIN','2026-09-18','International Equities',100.0)
)
insert into public.investment_exposure_breakdown(
 investment_id,as_of_date,dimension,bucket,weight_pct,source_id,set_coverage_pct,is_complete_set
)
select i.id,e.as_of_date,'asset_class',e.bucket,e.weight,
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url='https://www.fidelity.ca/en/products/etfs/'||lower(i.symbol)||'/' order by s.created_at desc limit 1),
 100,true
from e join public.investments i on i.symbol=e.symbol and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date,dimension,bucket) do update set
 weight_pct=excluded.weight_pct,source_id=excluded.source_id,set_coverage_pct=100,is_complete_set=true;

with h(symbol,as_of_date,name,weight,atype) as (
 values
 ('FEQT','2026-09-18'::date,'Fidelity U.S. Momentum ETF',12.6::numeric,'ETF'),
 ('FEQT','2026-09-18','Fidelity U.S. High Quality ETF',12.0,'ETF'),
 ('FEQT','2026-09-18','Fidelity U.S. Value ETF',12.0,'ETF'),
 ('FEQT','2026-09-18','Fidelity U.S. Low Volatility ETF',11.5,'ETF'),
 ('FEQT','2026-09-18','Fidelity International High Quality ETF',6.0,'ETF'),
 ('FEQT','2026-09-18','Fidelity International Value ETF',5.9,'ETF'),
 ('FEQT','2026-09-18','Fidelity International Momentum ETF',5.8,'ETF'),
 ('FEQT','2026-09-18','Fidelity International Low Volatility ETF',5.7,'ETF'),
 ('FEQT','2026-09-18','Fidelity Canadian Value ETF',6.0,'ETF'),
 ('FEQT','2026-09-18','Fidelity Canadian Low Volatility ETF',5.8,'ETF'),
 ('FEQT','2026-09-18','Fidelity Canadian Momentum ETF',5.8,'ETF'),
 ('FEQT','2026-09-18','Fidelity Canadian High Quality ETF',5.7,'ETF'),
 ('FEQT','2026-09-18','Fidelity Advantage Bitcoin ETF',3.2,'ETF'),
 ('FEQT','2026-09-18','Fidelity Global Small Cap Opportunities Fund',2.3,'Fund'),

 ('FGRO','2026-09-18','Fidelity U.S. Momentum ETF',10.9,'ETF'),
 ('FGRO','2026-09-18','Fidelity U.S. Value ETF',10.4,'ETF'),
 ('FGRO','2026-09-18','Fidelity U.S. High Quality ETF',10.3,'ETF'),
 ('FGRO','2026-09-18','Fidelity U.S. Low Volatility ETF',9.8,'ETF'),
 ('FGRO','2026-09-18','Fidelity International High Quality ETF',5.2,'ETF'),
 ('FGRO','2026-09-18','Fidelity International Value ETF',5.1,'ETF'),
 ('FGRO','2026-09-18','Fidelity International Momentum ETF',5.0,'ETF'),
 ('FGRO','2026-09-18','Fidelity International Low Volatility ETF',4.9,'ETF'),
 ('FGRO','2026-09-18','Fidelity Canadian Value ETF',5.1,'ETF'),
 ('FGRO','2026-09-18','Fidelity Canadian Low Volatility ETF',5.0,'ETF'),
 ('FGRO','2026-09-18','Fidelity Canadian Momentum ETF',5.0,'ETF'),
 ('FGRO','2026-09-18','Fidelity Canadian High Quality ETF',4.9,'ETF'),
 ('FGRO','2026-09-18','Fidelity Systematic Canadian Bond Index ETF',9.5,'ETF'),
 ('FGRO','2026-09-18','Fidelity Core U.S. Bond ETF',0.6,'ETF'),
 ('FGRO','2026-09-18','Fidelity Advantage Bitcoin ETF',3.3,'ETF'),
 ('FGRO','2026-09-18','Fidelity Absolute Income Fund',1.6,'Fund'),
 ('FGRO','2026-09-18','Fidelity Global Core Plus Bond ETF',1.6,'ETF'),
 ('FGRO','2026-09-18','Fidelity Global Small Cap Opportunities Fund',1.9,'Fund'),

 ('FBAL','2026-09-09','Fidelity U.S. Momentum ETF',7.9,'ETF'),
 ('FBAL','2026-09-09','Fidelity U.S. Value ETF',7.7,'ETF'),
 ('FBAL','2026-09-09','Fidelity U.S. High Quality ETF',7.5,'ETF'),
 ('FBAL','2026-09-09','Fidelity U.S. Low Volatility ETF',7.1,'ETF'),
 ('FBAL','2026-09-09','Fidelity Systematic Canadian Bond Index ETF',26.2,'ETF'),
 ('FBAL','2026-09-09','Fidelity Core U.S. Bond ETF',1.8,'ETF'),
 ('FBAL','2026-09-09','Fidelity International High Quality ETF',3.8,'ETF'),
 ('FBAL','2026-09-09','Fidelity International Value ETF',3.7,'ETF'),
 ('FBAL','2026-09-09','Fidelity International Momentum ETF',3.7,'ETF'),
 ('FBAL','2026-09-09','Fidelity International Low Volatility ETF',3.6,'ETF'),
 ('FBAL','2026-09-09','Fidelity Canadian Value ETF',3.8,'ETF'),
 ('FBAL','2026-09-09','Fidelity Canadian Low Volatility ETF',3.7,'ETF'),
 ('FBAL','2026-09-09','Fidelity Canadian Momentum ETF',3.6,'ETF'),
 ('FBAL','2026-09-09','Fidelity Canadian High Quality ETF',3.6,'ETF'),
 ('FBAL','2026-09-09','Fidelity Absolute Income Fund',4.6,'Fund'),
 ('FBAL','2026-09-09','Fidelity Global Core Plus Bond ETF',4.5,'ETF'),
 ('FBAL','2026-09-09','Fidelity Advantage Bitcoin ETF',2.0,'ETF'),
 ('FBAL','2026-09-09','Fidelity Global Small Cap Opportunities Fund',1.4,'Fund'),

 ('FCNS','2026-09-10','Fidelity Systematic Canadian Bond Index ETF',40.4,'ETF'),
 ('FCNS','2026-09-10','Fidelity Core U.S. Bond ETF',2.8,'ETF'),
 ('FCNS','2026-09-10','Fidelity U.S. Momentum ETF',5.4,'ETF'),
 ('FCNS','2026-09-10','Fidelity U.S. Value ETF',5.2,'ETF'),
 ('FCNS','2026-09-10','Fidelity U.S. High Quality ETF',5.2,'ETF'),
 ('FCNS','2026-09-10','Fidelity U.S. Low Volatility ETF',4.9,'ETF'),
 ('FCNS','2026-09-10','Fidelity Absolute Income Fund',7.0,'Fund'),
 ('FCNS','2026-09-10','Fidelity Global Core Plus Bond ETF',6.9,'ETF'),
 ('FCNS','2026-09-10','Fidelity International High Quality ETF',2.6,'ETF'),
 ('FCNS','2026-09-10','Fidelity International Value ETF',2.5,'ETF'),
 ('FCNS','2026-09-10','Fidelity International Momentum ETF',2.5,'ETF'),
 ('FCNS','2026-09-10','Fidelity International Low Volatility ETF',2.5,'ETF'),
 ('FCNS','2026-09-10','Fidelity Canadian Value ETF',2.6,'ETF'),
 ('FCNS','2026-09-10','Fidelity Canadian Low Volatility ETF',2.5,'ETF'),
 ('FCNS','2026-09-10','Fidelity Canadian Momentum ETF',2.5,'ETF'),
 ('FCNS','2026-09-10','Fidelity Canadian High Quality ETF',2.4,'ETF'),
 ('FCNS','2026-09-10','Fidelity Advantage Bitcoin ETF',1.0,'ETF'),
 ('FCNS','2026-09-10','Fidelity Global Small Cap Opportunities Fund',1.0,'Fund'),

 ('FFIX','2026-09-09','Fidelity Systematic Canadian Bond Index ETF',70.0,'ETF'),
 ('FFIX','2026-09-09','Fidelity Core U.S. Bond ETF',5.0,'ETF'),
 ('FFIX','2026-09-09','Fidelity Absolute Income Fund',12.5,'Fund'),
 ('FFIX','2026-09-09','Fidelity Global Core Plus Bond ETF',12.5,'ETF'),

 ('FCCA','2026-09-09','Fidelity Canadian Value ETF',25.5,'ETF'),
 ('FCCA','2026-09-09','Fidelity Canadian Low Volatility ETF',25.0,'ETF'),
 ('FCCA','2026-09-09','Fidelity Canadian Momentum ETF',24.8,'ETF'),
 ('FCCA','2026-09-09','Fidelity Canadian High Quality ETF',24.7,'ETF'),
 ('FCAM','2026-09-09','Fidelity U.S. Momentum ETF',26.1,'ETF'),
 ('FCAM','2026-09-09','Fidelity U.S. Value ETF',25.2,'ETF'),
 ('FCAM','2026-09-09','Fidelity U.S. High Quality ETF',24.8,'ETF'),
 ('FCAM','2026-09-09','Fidelity U.S. Low Volatility ETF',23.9,'ETF'),
 ('FCIN','2026-09-18','Fidelity International High Quality ETF',25.8,'ETF'),
 ('FCIN','2026-09-18','Fidelity International Value ETF',25.0,'ETF'),
 ('FCIN','2026-09-18','Fidelity International Low Volatility ETF',24.7,'ETF'),
 ('FCIN','2026-09-18','Fidelity International Momentum ETF',24.5,'ETF')
)
insert into public.investment_holdings(
 investment_id,as_of_date,holding_name,asset_type,weight_pct,source_id
)
select i.id,h.as_of_date,h.name,h.atype,h.weight,
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url='https://www.fidelity.ca/en/products/etfs/'||lower(i.symbol)||'/' order by s.created_at desc limit 1)
from h join public.investments i on i.symbol=h.symbol and i.exchange='Cboe CA'
on conflict (investment_id,as_of_date,holding_name) do update set
 asset_type=excluded.asset_type,weight_pct=excluded.weight_pct,source_id=excluded.source_id;

with s(symbol,vol,income,growth,rate,credit,diversification,complexity,basis,as_of_date) as (
 values
 ('FEQT','medium','low','high','not_applicable','Global equity issuers plus cryptocurrency exposure','diversified','medium','ETF units are not guaranteed; the neutral mix includes a small cryptocurrency allocation.','2026-09-18'::date),
 ('FGRO','medium','medium','high','low','Global equity and fixed-income issuers plus cryptocurrency exposure','diversified','medium','ETF units are not guaranteed; fixed income can lose value and the neutral mix includes cryptocurrency.','2026-09-18'),
 ('FBAL','low','medium','medium','medium','Global equity and fixed-income issuers plus cryptocurrency exposure','diversified','medium','ETF units are not guaranteed; fixed income can lose value and the neutral mix includes cryptocurrency.','2026-09-18'),
 ('FCNS','low','high','low','medium','Global equity and fixed-income issuers plus cryptocurrency exposure','diversified','medium','ETF units are not guaranteed; the portfolio has substantial fixed income and a small cryptocurrency allocation.','2026-09-18'),
 ('FFIX','low','high','low','medium','Global investment-grade and multi-sector fixed-income issuers','diversified','medium','Bond ETF units are not principal-guaranteed and can decline as rates or credit conditions change.','2026-09-17'),
 ('FCCA','medium','low','high','not_applicable','Canadian equity issuers through underlying factor ETFs','diversified','medium','ETF units are not guaranteed; factor allocations can differ materially from a broad-market index.','2026-09-18'),
 ('FCAM','medium','low','high','not_applicable','U.S. equity issuers through underlying factor ETFs','diversified','medium','ETF units are not guaranteed; factor allocations and currency exposure can differ from a broad-market index.','2026-09-17'),
 ('FCIN','medium','low','high','not_applicable','International equity issuers through underlying factor ETFs','diversified','medium','ETF units are not guaranteed; factor and foreign-currency exposures can affect outcomes.','2026-09-18')
)
insert into public.investment_structure_profiles(
 investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,
 growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,
 time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1','none','high',s.vol,s.income,s.growth,s.rate,s.credit,s.diversification,s.complexity,
 'open_ended',s.basis,
 jsonb_build_object('source','Fidelity Investments Canada ULC official product page','url','https://www.fidelity.ca/en/products/etfs/'||lower(i.symbol)||'/','verified_on','2026-09-20'),
 s.as_of_date
from s join public.investments i on i.symbol=s.symbol and i.exchange='Cboe CA'
on conflict (investment_id,model_version) do update set
 capital_protection=excluded.capital_protection,liquidity_level=excluded.liquidity_level,
 price_volatility=excluded.price_volatility,income_predictability=excluded.income_predictability,
 growth_participation=excluded.growth_participation,interest_rate_sensitivity=excluded.interest_rate_sensitivity,
 credit_exposure=excluded.credit_exposure,diversification_level=excluded.diversification_level,
 complexity_level=excluded.complexity_level,time_structure=excluded.time_structure,
 principal_protection_basis=excluded.principal_protection_basis,source_basis=excluded.source_basis,
 as_of_date=excluded.as_of_date,updated_at=now();

with p(symbol,objective,benchmark,target,geography,policy,style,replication,risks,summary,as_of_date) as (
 values
 ('FEQT','Provide a globally diversified, growth-oriented all-in-one portfolio.','Blended benchmark','{"equity":97,"fixed_income":0,"cryptocurrency":3}'::jsonb,'{"Global":100}'::jsonb,'Annual','Strategic asset allocation with factor ETFs','Underlying Fidelity ETFs','["Equity market risk","Currency risk","Cryptocurrency volatility","Factor allocation risk"]'::jsonb,'All-in-one global equity portfolio with a small strategic cryptocurrency allocation.','2026-09-18'::date),
 ('FGRO','Provide long-term growth through a diversified global multi-asset portfolio.','Blended Index','{"equity":82,"fixed_income":15,"cryptocurrency":3}','{"Global":100}','Annual','Strategic asset allocation with factor and fixed-income ETFs','Underlying Fidelity ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk","Cryptocurrency volatility"]','Growth-oriented all-in-one portfolio spanning global equities, fixed income and a small cryptocurrency allocation.','2026-09-18'),
 ('FBAL','Provide a balanced global multi-asset portfolio.','Blended Index','{"equity":59,"fixed_income":39,"cryptocurrency":2}','{"Global":100}','Annual','Strategic asset allocation with factor and fixed-income ETFs','Underlying Fidelity ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk","Cryptocurrency volatility"]','Balanced all-in-one portfolio with global equities, diversified fixed income and a small cryptocurrency allocation.','2026-09-18'),
 ('FCNS','Provide a conservative global multi-asset portfolio with a larger fixed-income allocation.','Blended benchmark','{"equity":40,"fixed_income":59,"cryptocurrency":1}','{"Global":100}','Annual','Strategic asset allocation with factor and fixed-income ETFs','Underlying Fidelity ETFs','["Interest-rate risk","Credit risk","Equity market risk","Currency risk","Cryptocurrency volatility"]','Conservative all-in-one portfolio dominated by fixed income with global equities and a small cryptocurrency allocation.','2026-09-18'),
 ('FFIX','Provide diversified fixed-income exposure through actively managed and systematic underlying ETFs.','FTSE Canada Universe Bond Index','{"equity":0,"fixed_income":100}','{"Global":100}','Monthly','Strategic fixed-income asset allocation','Underlying Fidelity fixed-income ETFs','["Interest-rate risk","Credit risk","Bond market price risk","Foreign fixed-income risk"]','One-ticket global fixed-income allocation with a strong Canadian fixed-income emphasis.','2026-09-17'),
 ('FCCA','Provide Canadian equity exposure across multiple systematic factors.','S&P/TSX Capped Composite Index','{"equity":100,"fixed_income":0}','{"Canada":100}','Annual','Multi-factor equity allocation','Underlying Fidelity factor ETFs','["Canadian equity market risk","Factor risk","Sector concentration"]','Canadian all-equity factor portfolio combining value, low volatility, momentum and quality sleeves.','2026-09-18'),
 ('FCAM','Provide U.S. equity exposure across multiple systematic factors.','S&P 500 Index','{"equity":100,"fixed_income":0}','{"United_States":100}','Annual','Multi-factor equity allocation','Underlying Fidelity factor ETFs','["U.S. equity market risk","Factor risk","Currency risk"]','U.S. all-equity factor portfolio combining momentum, value, quality and low-volatility sleeves.','2026-09-17'),
 ('FCIN','Provide international developed-market equity exposure across multiple systematic factors.','MSCI EAFE Index','{"equity":100,"fixed_income":0}','{"International":100}','Annual','Multi-factor equity allocation','Underlying Fidelity factor ETFs','["International equity market risk","Factor risk","Currency risk","Country concentration"]','International all-equity factor portfolio combining quality, value, low-volatility and momentum sleeves.','2026-09-18')
)
insert into public.investment_profiles(
 investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
 currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,
 source_id,as_of_date,model_version
)
select i.id,p.objective,p.benchmark,'Issuer product structure summarized for Investor DNA research.',
 'Fund-of-funds / underlying ETF allocation',p.target,p.geography,null,p.policy,p.style,p.replication,
 null,p.risks,p.summary,
 (select s.id from public.investment_data_sources s where s.investment_id=i.id and s.source_url='https://www.fidelity.ca/en/products/etfs/'||lower(i.symbol)||'/' order by s.created_at desc limit 1),
 p.as_of_date,'profile-v1.0'
from p join public.investments i on i.symbol=p.symbol and i.exchange='Cboe CA'
on conflict (investment_id,model_version) do update set
 objective=excluded.objective,benchmark=excluded.benchmark,methodology=excluded.methodology,
 portfolio_construction=excluded.portfolio_construction,target_allocation=excluded.target_allocation,
 geographic_exposure=excluded.geographic_exposure,currency_hedging=excluded.currency_hedging,
 distribution_policy=excluded.distribution_policy,management_style=excluded.management_style,
 replication_method=excluded.replication_method,ideal_for=null,key_risks=excluded.key_risks,
 profile_summary=excluded.profile_summary,source_id=excluded.source_id,as_of_date=excluded.as_of_date,updated_at=now();
