
-- Canada ETF catalog expansion v1
-- Data-only expansion: adds a curated Canadian-listed ETF research universe.
-- Missing fields remain null; no Match eligibility is granted by this migration.

insert into public.investment_issuers(name,website,country_code)
values
  ('TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/','CA'),
  ('Global X Investments Canada Inc.','https://www.globalx.ca/','CA'),
  ('Purpose Investments Inc.','https://www.purposeinvest.com/','CA')
on conflict (name) do update
set website=excluded.website,country_code=excluded.country_code,updated_at=now();

with rows(symbol,name,legal_name,issuer_name,category,subcategory,strategy,sector,region,description,inception_date) as (
  values
  ('TTP','TD Canadian Equity Index ETF','TD Canadian Equity Index ETF','TD Asset Management Inc.','Equity','Canada','Broad-market index tracking',null,'Canada','Canadian-listed ETF providing broad Canadian equity exposure through an index-tracking strategy.','2016-03-22'::date),
  ('TPU','TD U.S. Equity Index ETF','TD U.S. Equity Index ETF','TD Asset Management Inc.','Equity','United States','Broad-market index tracking',null,'United States','Canadian-listed ETF providing broad U.S. large-cap equity exposure through an index-tracking strategy.','2016-03-22'::date),
  ('TDB','TD Canadian Aggregate Bond Index ETF','TD Canadian Aggregate Bond Index ETF','TD Asset Management Inc.','Fixed Income','Aggregate Bond','Canadian investment-grade bond index',null,'Canada','Canadian aggregate investment-grade bond ETF spanning government and corporate debt.','2016-03-22'::date),
  ('TCSH','TD Cash Management ETF','TD Cash Management ETF','TD Asset Management Inc.','Fixed Income','Cash & Liquidity','Active cash and ultra-short fixed-income management',null,'Canada','Actively managed Canadian cash-management ETF investing in high-quality money-market and short-term fixed-income instruments.','2024-02-15'::date),
  ('TGRO','TD Growth ETF Portfolio','TD Growth ETF Portfolio','TD Asset Management Inc.','Asset Allocation','All-in-one','Growth asset-allocation portfolio',null,'Global','All-in-one growth-oriented ETF portfolio combining global equities and fixed income.','2020-08-11'::date),
  ('TEQT','TD All-Equity ETF Portfolio','TD All-Equity ETF Portfolio','TD Asset Management Inc.','Equity','All-in-one','Global all-equity asset allocation',null,'Global','All-in-one global equity ETF portfolio with strategic Canadian, U.S. and international exposure.','2025-04-08'::date),
  ('TEC','TD Global Technology Leaders Index ETF','TD Global Technology Leaders Index ETF','TD Asset Management Inc.','Equity','Technology','Global technology index tracking','Technology','Global','Global technology-sector ETF tracking an index of technology leaders.','2019-05-07'::date),
  ('TQCD','TD Q Canadian Dividend ETF','TD Q Canadian Dividend ETF','TD Asset Management Inc.','Equity','Canadian Dividend','Quantitative Canadian dividend strategy',null,'Canada','Canadian dividend-equity ETF using a quantitative portfolio-construction approach.','2019-11-20'::date),
  ('THE','TD International Equity CAD Hedged Index ETF','TD International Equity CAD Hedged Index ETF','TD Asset Management Inc.','Equity','International Developed','Developed-markets index with CAD hedging',null,'International','Developed-markets equity ETF excluding North America with Canadian-dollar currency hedging.','2016-03-22'::date),
  ('TCOM','TD Alternative Commodities Pool ETF','TD Alternative Commodities Pool - ETF Series','TD Asset Management Inc.','Alternatives','Commodities','Active alternative commodity strategy','Commodities','Global','Alternative commodity pool using derivatives and permitted leverage; included for research comparison, not automatic DNA Match eligibility.','2026-05-05'::date),
  ('CASH','Global X High Interest Savings ETF','Global X High Interest Savings ETF','Global X Investments Canada Inc.','Fixed Income','Cash & Liquidity','High-interest savings ETF',null,'Canada','Cash-management ETF investing primarily in high-interest deposit accounts with Canadian banks; ETF units are not CDIC insured.','2021-11-01'::date),
  ('CBIL','Global X 0-3 Month T-Bill ETF','Global X 0-3 Month T-Bill ETF','Global X Investments Canada Inc.','Fixed Income','T-Bill','Government of Canada 0-3 month Treasury bills',null,'Canada','Short-duration ETF investing in Government of Canada Treasury bills with remaining maturities generally under three months.','2023-04-12'::date),
  ('HXT','Global X S&P/TSX 60 Index Corporate Class ETF','Global X S&P/TSX 60 Index Corporate Class ETF','Global X Investments Canada Inc.','Equity','Canada Large Cap','S&P/TSX 60 total-return index exposure',null,'Canada','Corporate-class Canadian large-cap index ETF using total-return swap exposure and collateral.','2010-09-14'::date),
  ('HXS','Global X S&P 500 Index Corporate Class ETF','Global X S&P 500 Index Corporate Class ETF','Global X Investments Canada Inc.','Equity','United States','S&P 500 total-return index exposure',null,'United States','Corporate-class U.S. large-cap index ETF that may use total-return swaps to obtain S&P 500 exposure.','2010-11-30'::date),
  ('HXQ','Global X Nasdaq-100 Index Corporate Class ETF','Global X Nasdaq-100 Index Corporate Class ETF','Global X Investments Canada Inc.','Equity','Technology','Nasdaq-100 index tracking','Technology','United States','Corporate-class Nasdaq-100 ETF using physical index exposure under its current structure.','2016-04-19'::date),
  ('AIQ','Global X Artificial Intelligence & Technology Index ETF','Global X Artificial Intelligence & Technology Index ETF','Global X Investments Canada Inc.','Equity','Artificial Intelligence & Technology','AI and big-data thematic index','Technology','Global','Thematic global equity ETF focused on companies linked to artificial intelligence, big data and enabling hardware.','2024-05-14'::date),
  ('PSA','Purpose High Interest Savings Fund','Purpose High Interest Savings Fund - ETF Units','Purpose Investments Inc.','Fixed Income','Cash & Liquidity','High-interest deposits and high-quality money-market securities',null,'Canada','Cash-management ETF investing in high-interest deposit accounts and high-quality short-term securities; ETF units are not CDIC insured.','2013-10-15'::date)
)
insert into public.investments(
  symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,sector,region,
  country_code,currency,exchange,description,inception_date,is_active,is_featured,data_status
)
select r.symbol,r.name,r.legal_name,'ETF',iss.id,r.category,r.subcategory,r.strategy,r.sector,r.region,
       'CA','CAD','TSX',r.description,r.inception_date,true,false,'verified_partial'
from rows r
join public.investment_issuers iss on iss.name=r.issuer_name
on conflict (symbol,exchange) do update set
  name=excluded.name,
  legal_name=excluded.legal_name,
  asset_type='ETF',
  issuer_id=excluded.issuer_id,
  category=excluded.category,
  subcategory=excluded.subcategory,
  strategy=excluded.strategy,
  sector=excluded.sector,
  region=excluded.region,
  country_code='CA',
  currency='CAD',
  description=excluded.description,
  inception_date=excluded.inception_date,
  is_active=true,
  data_status='verified_partial',
  updated_at=now();

-- Official ETF Facts / regulatory disclosures.
with facts(symbol,source_name,facts_url,facts_date,mer_pct) as (
  values
  ('TTP','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/ttpe-en.pdf','2026-02-26'::date,0.05::numeric),
  ('TPU','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tpue-en.pdf','2026-02-26',0.07),
  ('TDB','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tdbe-en.pdf','2026-02-26',0.08),
  ('TCSH','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tcshe-en.pdf','2025-10-29',0.16),
  ('TGRO','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tgroe-en.pdf','2026-02-26',0.17),
  ('TEQT','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/teqte-en.pdf','2026-02-26',0.17),
  ('TEC','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tece-en.pdf','2026-02-26',0.39),
  ('TQCD','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tqcde-en.pdf','2025-10-29',0.39),
  ('THE','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/thee-en.pdf','2026-02-26',0.19),
  ('TCOM','TD Asset Management Inc.','https://www.td.com/content/dam/tdam/ca/en/pdf/tcome-en.pdf','2026-07-23',null::numeric),
  ('CASH','Global X Investments Canada Inc.','https://www.globalx.ca/wp-content/uploads/2026/08/CASH-ETF_Fact_Sheet-EN.pdf','2026-08-12',0.11),
  ('CBIL','Global X Investments Canada Inc.','https://www.globalx.ca/wp-content/uploads/2026/08/CBIL-CBIL.U-ETF_Fact_Sheet-EN.pdf','2026-08-12',0.11),
  ('HXT','Global X Investments Canada Inc.','https://www.globalx.ca/wp-content/uploads/2025/08/HXT-HXT.U-ETF_Fact_Sheet-EN.pdf','2025-08-27',0.08),
  ('HXS','Global X Investments Canada Inc.','https://www.globalx.ca/wp-content/uploads/2025/08/HXS-HXS.U-ETF_Fact_Sheet-EN.pdf','2025-08-27',0.11),
  ('HXQ','Global X Investments Canada Inc.','https://www.globalx.ca/wp-content/uploads/2025/08/HXQ-HXQ.U-ETF_Fact_Sheet-EN.pdf','2025-08-27',0.27),
  ('AIQ','Global X Investments Canada Inc.','https://www.globalx.ca/wp-content/uploads/2026/08/AIQ-ETF_Fact_Sheet-EN.pdf','2026-08-12',0.60),
  ('PSA','Purpose Investments Inc.','https://documents.purposeinvest.com/Docs/PSA/etf_facts/en/Purpose%20High%20Interest%20Savings%20Fund%20ETF%20Facts%202025-10-31.pdf','2025-10-31',0.17)
)
insert into public.investment_official_facts(
  investment_id,source_name,product_url,etf_facts_url,etf_facts_date,management_fee_pct,mer_pct,fee_source_note,verified_at
)
select i.id,f.source_name,
  case
    when i.symbol in ('CASH','CBIL','HXT','HXS','HXQ','AIQ') then 'https://www.globalx.ca/product/'||lower(i.symbol)
    when i.symbol='PSA' then 'https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund'
    else 'https://www.td.com/ca/en/asset-management/funds/solutions/etfs'
  end,
  f.facts_url,f.facts_date,null,f.mer_pct,
  case when i.symbol='TCOM' then 'ETF Facts reports MER as unavailable for the new ETF series; current product-page MER is stored separately in current metrics.'
       else 'MER preserved from the dated official ETF Facts snapshot.' end,
  now()
from facts f
join public.investments i on i.symbol=f.symbol and i.exchange='TSX'
on conflict (investment_id) do update set
  source_name=excluded.source_name,
  product_url=excluded.product_url,
  etf_facts_url=excluded.etf_facts_url,
  etf_facts_date=excluded.etf_facts_date,
  management_fee_pct=excluded.management_fee_pct,
  mer_pct=excluded.mer_pct,
  fee_source_note=excluded.fee_source_note,
  verified_at=now();

-- Stable official-source rows used by research profiles.
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,f.source_name,'official',f.etf_facts_url,'official_facts,risk,structure,profile',
       now(),f.etf_facts_date::text,'Official issuer ETF Facts / regulatory disclosure.'
from public.investment_official_facts f
join public.investments i on i.id=f.investment_id
where i.symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
and not exists (
  select 1 from public.investment_data_sources s
  where s.investment_id=i.id and s.source_url=f.etf_facts_url and s.source_type='official'
);

-- Current issuer-page metrics. Dates are source dates; unavailable fields stay null.
with m(symbol,as_of_date,price,mer_pct,aum,volume,distribution_frequency) as (
  values
  ('TTP','2026-09-18'::date,41.34::numeric,0.05::numeric,6564760000::numeric,null::numeric,'Quarterly'),
  ('TPU','2026-09-17',61.04,0.07,6364030000,null,'Quarterly'),
  ('TDB','2026-09-17',12.65,0.08,4254700000,null,'Monthly'),
  ('TCSH','2026-09-18',50.07,0.17,1337680000,null,'Monthly'),
  ('TGRO','2026-09-18',29.47,0.17,452080000,null,'Monthly'),
  ('TEQT','2026-09-18',22.85,0.17,103200000,null,'Quarterly'),
  ('TEC','2026-09-18',62.46,0.39,5241220000,null,'Quarterly'),
  ('TQCD','2026-09-10',29.33,0.39,3609920000,null,'Monthly'),
  ('THE','2026-09-18',33.24,0.19,254810000,null,'Quarterly'),
  ('TCOM','2026-09-10',10.52,0.79,1762910000,null,'Annual if required'),
  ('CASH','2026-09-10',50.04,0.11,6506300996,1027498,'Monthly'),
  ('CBIL','2026-09-09',50.03,0.11,2767575936,661033,'Monthly'),
  ('HXT','2026-09-16',94.80,0.08,5555016623,1602561,'At manager discretion'),
  ('HXS','2026-09-09',109.25,0.11,7546623308,null,'At manager discretion'),
  ('HXQ','2026-09-09',116.89,0.28,1803832744,32121,'At manager discretion'),
  ('AIQ','2026-09-17',39.13,0.60,43998398,5302,'Annual if any'),
  ('PSA','2026-09-10',50.04,0.17,4400000000,null,'Monthly')
)
insert into public.investment_metrics(
  investment_id,as_of_date,price,mer_pct,aum,volume,distribution_frequency
)
select i.id,m.as_of_date,m.price,m.mer_pct,m.aum,m.volume,m.distribution_frequency
from m join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
  price=excluded.price,
  mer_pct=excluded.mer_pct,
  aum=excluded.aum,
  volume=excluded.volume,
  distribution_frequency=excluded.distribution_frequency;

-- Separate dated yield observations where a current official issuer page exposed the figure.
with y(symbol,as_of_date,yield_pct,distribution_frequency) as (
  values
  ('CASH','2026-08-31'::date,2.06::numeric,'Monthly'),
  ('CBIL','2026-08-31',2.23,'Monthly'),
  ('PSA','2026-09-10',2.18,'Monthly')
)
insert into public.investment_metrics(investment_id,as_of_date,yield_pct,distribution_frequency)
select i.id,y.as_of_date,y.yield_pct,y.distribution_frequency
from y join public.investments i on i.symbol=y.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
  yield_pct=excluded.yield_pct,
  distribution_frequency=coalesce(public.investment_metrics.distribution_frequency,excluded.distribution_frequency);

-- Official risk labels are stored independently of the broader research risk model.
with rr(symbol,rating,source_date) as (
  values
  ('TTP','Medium','2026-02-26'::date),
  ('TPU','Medium','2026-02-26'),
  ('TDB','Low','2026-02-26'),
  ('TCSH','Low','2025-10-29'),
  ('TGRO','Low to Medium','2026-02-26'),
  ('TEQT','Medium','2026-02-26'),
  ('TEC','Medium to High','2026-02-26'),
  ('TQCD','Medium','2025-10-29'),
  ('THE','Medium','2026-02-26'),
  ('TCOM','Medium','2026-07-23'),
  ('CASH','Low','2026-08-12'),
  ('CBIL','Low','2026-08-12'),
  ('HXT','Medium','2025-08-27'),
  ('HXS','Medium','2025-08-27'),
  ('HXQ','Medium to High','2025-08-27'),
  ('AIQ','Medium to High','2026-08-12'),
  ('PSA','Low','2025-10-31')
), mapped as (
  select rr.*,
    case rr.rating when 'Low' then 0 when 'Low to Medium' then 20 when 'Medium' then 40 when 'Medium to High' then 60 when 'High' then 80 end::numeric as band_min,
    case rr.rating when 'Low' then 20 when 'Low to Medium' then 40 when 'Medium' then 60 when 'Medium to High' then 80 when 'High' then 100 end::numeric as band_max
  from rr
)
insert into public.investment_official_risk_ratings(
  investment_id,official_risk_rating,band_min,band_max,issuer,source_type,source_title,source_url,
  source_date,effective_date,methodology,verification_note,verified_at,updated_at
)
select i.id,m.rating,m.band_min,m.band_max,f.source_name,'ETF Facts','ETF Facts',f.etf_facts_url,
       m.source_date,m.source_date,'Issuer-disclosed standardized Canadian ETF risk classification.',
       'Verified against the dated official ETF Facts document.',now(),now()
from mapped m
join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
join public.investment_official_facts f on f.investment_id=i.id
on conflict (investment_id) do update set
  official_risk_rating=excluded.official_risk_rating,
  band_min=excluded.band_min,
  band_max=excluded.band_max,
  issuer=excluded.issuer,
  source_type=excluded.source_type,
  source_title=excluded.source_title,
  source_url=excluded.source_url,
  source_date=excluded.source_date,
  effective_date=excluded.effective_date,
  methodology=excluded.methodology,
  verification_note=excluded.verification_note,
  verified_at=now(),
  updated_at=now();

with rr(symbol,rating,source_date) as (
  values
  ('TTP','Medium','2026-02-26'::date),('TPU','Medium','2026-02-26'),('TDB','Low','2026-02-26'),
  ('TCSH','Low','2025-10-29'),('TGRO','Low to Medium','2026-02-26'),('TEQT','Medium','2026-02-26'),
  ('TEC','Medium to High','2026-02-26'),('TQCD','Medium','2025-10-29'),('THE','Medium','2026-02-26'),
  ('TCOM','Medium','2026-07-23'),('CASH','Low','2026-08-12'),('CBIL','Low','2026-08-12'),
  ('HXT','Medium','2025-08-27'),('HXS','Medium','2025-08-27'),('HXQ','Medium to High','2025-08-27'),
  ('AIQ','Medium to High','2026-08-12'),('PSA','Low','2025-10-31')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level)
select i.id,rr.source_date,rr.rating
from rr join public.investments i on i.symbol=rr.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set risk_level=excluded.risk_level;

-- Cross-asset structural profile. This is descriptive research data, not a Match score.
with s(
  symbol,capital_protection,liquidity_level,price_volatility,income_predictability,growth_participation,
  interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,time_structure,principal_basis,as_of_date
) as (
  values
  ('TTP','none','high','medium','low','high','not_applicable','Canadian equity issuers','diversified','low','open_ended','ETF units are not guaranteed or insured.','2026-02-26'::date),
  ('TPU','none','high','medium','low','high','not_applicable','U.S. equity issuers','diversified','low','open_ended','ETF units are not guaranteed or insured.','2026-02-26'),
  ('TDB','none','high','low','high','low','medium','Canadian government and investment-grade corporate issuers','diversified','low','open_ended','Bond ETF units are not principal-guaranteed and market value can change.','2026-02-26'),
  ('TCSH','none','high','very_low','high','none','low','Short-term Canadian bank and fixed-income counterparties','diversified','low','open_ended','ETF units are not a bank deposit and are not principal-guaranteed.','2025-10-29'),
  ('TGRO','none','high','medium','medium','high','low','Diversified global equity and fixed-income issuers','diversified','low','open_ended','Asset-allocation ETF units are not guaranteed or insured.','2026-02-26'),
  ('TEQT','none','high','medium','low','high','not_applicable','Diversified global equity issuers','diversified','low','open_ended','All-equity ETF units are not guaranteed or insured.','2026-02-26'),
  ('TEC','none','high','high','low','high','not_applicable','Global technology equity issuers','limited','medium','open_ended','Sector ETF units are not guaranteed or insured.','2026-02-26'),
  ('TQCD','none','high','medium','medium','high','not_applicable','Canadian dividend-paying equity issuers','diversified','medium','open_ended','ETF units are not guaranteed or insured.','2025-10-29'),
  ('THE','none','high','medium','low','high','not_applicable','Developed-market equity issuers and currency-hedging counterparties','diversified','medium','open_ended','ETF units are not guaranteed; currency hedges introduce counterparty and basis considerations.','2026-02-26'),
  ('TCOM','none','high','medium','low','medium','not_applicable','Commodity markets and derivative counterparties','diversified','high','open_ended','Alternative mutual fund ETF units are not guaranteed; derivatives, short selling and permitted leverage add complexity.','2026-07-23'),
  ('CASH','none','high','very_low','high','none','low','Canadian chartered-bank deposit counterparties','limited','low','open_ended','ETF units are not CDIC insured and are not guaranteed.','2026-08-12'),
  ('CBIL','none','high','very_low','high','none','low','Government of Canada','single_issuer','low','open_ended','ETF units are not guaranteed or deposit-insured; underlying Treasury bills are Government of Canada obligations.','2026-08-12'),
  ('HXT','none','high','medium','none','high','not_applicable','Swap counterparties plus Canadian large-cap equity index exposure','diversified','high','open_ended','ETF units are not guaranteed; total-return swaps create counterparty exposure.','2025-08-27'),
  ('HXS','none','high','medium','none','high','not_applicable','Swap counterparties plus U.S. large-cap equity index exposure','diversified','high','open_ended','ETF units are not guaranteed; total-return swaps create counterparty exposure.','2025-08-27'),
  ('HXQ','none','high','high','low','high','not_applicable','Nasdaq-100 equity issuers','limited','medium','open_ended','ETF units are not guaranteed; technology-heavy index exposure can be concentrated.','2025-08-27'),
  ('AIQ','none','high','high','low','high','not_applicable','Global AI and technology equity issuers','limited','medium','open_ended','ETF units are not guaranteed; thematic and technology concentration can amplify market moves.','2026-08-12'),
  ('PSA','none','high','very_low','high','none','low','Canadian bank deposits and short-term government securities','limited','low','open_ended','ETF units are not CDIC insured or otherwise government deposit-insured and are not guaranteed.','2025-10-31')
)
insert into public.investment_structure_profiles(
  investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,
  growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,
  time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1',s.capital_protection,s.liquidity_level,s.price_volatility,s.income_predictability,
       s.growth_participation,s.interest_rate_sensitivity,s.credit_exposure,s.diversification_level,
       s.complexity_level,s.time_structure,s.principal_basis,
       jsonb_build_object('source','Official issuer ETF Facts','url',f.etf_facts_url,'source_date',s.as_of_date),
       s.as_of_date
from s
join public.investments i on i.symbol=s.symbol and i.exchange='TSX'
join public.investment_official_facts f on f.investment_id=i.id
on conflict (investment_id,model_version) do update set
  capital_protection=excluded.capital_protection,
  liquidity_level=excluded.liquidity_level,
  price_volatility=excluded.price_volatility,
  income_predictability=excluded.income_predictability,
  growth_participation=excluded.growth_participation,
  interest_rate_sensitivity=excluded.interest_rate_sensitivity,
  credit_exposure=excluded.credit_exposure,
  diversification_level=excluded.diversification_level,
  complexity_level=excluded.complexity_level,
  time_structure=excluded.time_structure,
  principal_protection_basis=excluded.principal_protection_basis,
  source_basis=excluded.source_basis,
  as_of_date=excluded.as_of_date,
  updated_at=now();

-- ETF research profiles for Explore/Detail/Compare. No personalized Match rows are created.
with p(
  symbol,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
  currency_hedging,distribution_policy,management_style,replication_method,key_risks,profile_summary,as_of_date
) as (
  values
  ('TTP','Track broad Canadian equities.','Solactive Canada Broad Market Index (CA NTR)','Index tracking.','Broad Canadian equity index portfolio.','{"equity":100,"fixed_income":0}'::jsonb,'{"Canada":100}'::jsonb,null,'Quarterly','Passive index tracking','Index replication','["Canadian equity market risk","Sector concentration"]'::jsonb,'Broad Canadian equity exposure across large, mid and smaller companies.','2026-02-26'::date),
  ('TPU','Track U.S. large-cap equities.','Solactive US Large Cap CAD Index','Index tracking.','Broad U.S. large-cap equity index portfolio.','{"equity":100,"fixed_income":0}','{"United_States":100}',null,'Quarterly','Passive index tracking','Index replication','["U.S. equity market risk","Currency risk"]','Broad U.S. large-cap equity exposure in a Canadian-listed ETF.','2026-02-26'),
  ('TDB','Track the broad Canadian investment-grade bond market.','Solactive Broad Canadian Bond Universe TR Index','Index tracking.','Canadian government and investment-grade corporate bond portfolio.','{"equity":0,"fixed_income":100}','{"Canada":100}',null,'Monthly','Passive index tracking','Index sampling / replication','["Interest-rate risk","Credit risk","Bond market price risk"]','Broad Canadian aggregate bond exposure.','2026-02-26'),
  ('TCSH','Seek high interest income while preserving capital and liquidity.','FTSE Canada 91 Day T-Bill Index','Active short-term fixed-income management.','High-quality money-market and short-term fixed-income portfolio.',null,'{"Canada":100}',null,'Monthly','Active','Direct holdings','["Interest-rate risk","Credit risk","ETF unit price risk"]','Canadian cash-management ETF focused on liquidity and short-duration income.','2025-10-29'),
  ('TGRO','Seek long-term capital growth with a smaller fixed-income allocation.','Blended TD asset-allocation benchmark','Strategic asset allocation.','All-in-one portfolio generally targeting about 85% equities and 15% fixed income.','{"equity":85,"fixed_income":15}','{"Global":100}',null,'Monthly','Asset allocation','Underlying ETFs','["Equity market risk","Interest-rate risk","Credit risk","Currency risk"]','Growth-oriented all-in-one portfolio with global equity exposure and bond ballast.','2026-02-26'),
  ('TEQT','Seek long-term capital growth through a global all-equity portfolio.','Blended TD global equity benchmark','Strategic global equity allocation.','All-in-one portfolio targeting 100% equities.','{"equity":100,"fixed_income":0}','{"Canada":25,"United_States":55,"International":20}',null,'Quarterly','Asset allocation','Underlying ETFs','["Equity market risk","Currency risk","Global market drawdowns"]','All-equity one-ticket portfolio diversified across Canada, the U.S. and developed international markets.','2026-02-26'),
  ('TEC','Track an index of global technology leaders.','Solactive Global Technology Leaders Index','Thematic/sector index tracking.','Global technology equity portfolio.','{"equity":100,"fixed_income":0}','{"Global":100}',null,'Quarterly','Passive index tracking','Index replication','["Technology-sector concentration","Equity market risk","Currency risk"]','Concentrated global technology equity exposure.','2026-02-26'),
  ('TQCD','Seek long-term growth and income from Canadian dividend-paying equities.','S&P/TSX Composite Total Return Index','Quantitative active equity process.','Canadian dividend-equity portfolio.','{"equity":100,"fixed_income":0}','{"Canada":100}',null,'Monthly','Quantitative active','Direct equities','["Canadian equity market risk","Dividend concentration","Sector concentration"]','Canadian dividend strategy using a quantitative portfolio process.','2025-10-29'),
  ('THE','Track developed equity markets outside North America while hedging currency exposure to CAD.','Solactive GBS Developed Markets ex North America Large & Mid Cap Hedged to CAD Index','Index tracking with currency hedging.','Developed ex-North-America equity exposure with CAD hedges.','{"equity":100,"fixed_income":0}','{"International":100}','Substantially hedged to CAD','Quarterly','Passive index tracking','Underlying ETF / index exposure with currency forwards','["International equity risk","Currency-hedge basis risk","Counterparty risk"]','Developed international equity exposure with a Canadian-dollar hedge.','2026-02-26'),
  ('TCOM','Seek diversified commodity exposure with low expected correlation to traditional equity and fixed-income markets.','No single passive benchmark','Active alternative commodity strategy.','Commodity and derivative exposures with permitted short selling and leverage.',null,'{"Global":100}',null,'Annual if required','Active alternative','Derivatives / futures / swaps','["Commodity price risk","Leverage risk","Derivative counterparty risk","Liquidity risk"]','Alternative commodity pool included as a complex research comparator; it is not automatically enabled for DNA Match.','2026-07-23'),
  ('CASH','Maximize monthly income while preserving capital and liquidity through high-interest Canadian bank deposits.','Cash / high-interest deposit objective','Active cash-management strategy.','High-interest deposit accounts with Canadian banks.',null,'{"Canada":100}',null,'Monthly','Active cash management','Bank deposits','["Bank counterparty risk","ETF unit price risk","Not CDIC insured"]','High-interest savings ETF designed as a liquid cash-management instrument; ETF units are not deposit-insured.','2026-08-12'),
  ('CBIL','Provide interest income through Government of Canada Treasury bills with remaining maturities generally under three months.','Short Government of Canada Treasury bills','Rules-based short-duration government exposure.','Government of Canada Treasury bills under three months.','{"equity":0,"fixed_income":100}','{"Canada":100}',null,'Monthly','Rules-based','Direct Treasury bills','["Short-term interest-rate risk","ETF unit price risk","Issuer concentration"]','Very-short Government of Canada Treasury-bill ETF.','2026-08-12'),
  ('HXT','Replicate the total return of the S&P/TSX 60 Index, net of expenses.','S&P/TSX 60 Index (Total Return)','Index exposure using total-return swap agreements.','Canadian large-cap index exposure supported by collateral and swap contracts.','{"equity":100,"fixed_income":0}','{"Canada":100}',null,'At manager discretion','Passive index exposure','Total-return swaps','["Canadian equity market risk","Swap counterparty risk","Collateral and derivatives risk"]','Canadian large-cap index exposure delivered through a corporate-class total-return swap structure.','2025-08-27'),
  ('HXS','Replicate the total return of the S&P 500 Index, net of expenses.','S&P 500 Index (Total Return)','Index exposure that may use total-return swap agreements.','U.S. large-cap index exposure with collateral and index swaps.','{"equity":100,"fixed_income":0}','{"United_States":100}',null,'At manager discretion','Passive index exposure','Total-return swaps','["U.S. equity market risk","Swap counterparty risk","Currency exposure","Derivatives risk"]','U.S. large-cap index exposure delivered through a corporate-class structure that uses index swaps.','2025-08-27'),
  ('HXQ','Replicate the Nasdaq-100 Index total return, net of expenses.','NASDAQ-100 Index','Index tracking.','Nasdaq-100 equity portfolio.','{"equity":100,"fixed_income":0}','{"United_States":100}',null,'At manager discretion','Passive index tracking','Physical replication','["Technology concentration","U.S. equity market risk","Currency exposure"]','Nasdaq-100 equity exposure with substantial technology concentration.','2025-08-27'),
  ('AIQ','Track an index of developed-market companies positioned to benefit from artificial intelligence and big-data technologies.','Indxx Artificial Intelligence & Big Data Index','Thematic index tracking.','Global AI and technology equity portfolio.','{"equity":100,"fixed_income":0}','{"Global":100}','No currency hedging','Annual if any','Passive thematic index','Index replication / underlying funds','["Thematic concentration","Technology-sector risk","Equity market risk","Currency risk"]','Global thematic equity exposure to AI, big-data and enabling technologies.','2026-08-12'),
  ('PSA','Maximize monthly income while preserving capital and liquidity.','Cash / money-market objective','Active cash-management strategy.','High-interest deposit accounts and high-quality short-term securities.',null,'{"Canada":100}',null,'Monthly','Active cash management','Bank deposits and short-term securities','["Bank counterparty risk","Short-term fixed-income risk","ETF unit price risk","Not CDIC insured"]','Canadian cash-management ETF investing in high-interest deposits and short-term government/money-market securities.','2025-10-31')
)
insert into public.investment_profiles(
  investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,
  currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,
  source_id,as_of_date,model_version
)
select i.id,p.objective,p.benchmark,p.methodology,p.portfolio_construction,p.target_allocation,p.geographic_exposure,
       p.currency_hedging,p.distribution_policy,p.management_style,p.replication_method,null,p.key_risks,p.profile_summary,
       (select s.id from public.investment_data_sources s
        where s.investment_id=i.id and s.source_url=f.etf_facts_url
        order by s.created_at desc limit 1),
       p.as_of_date,'profile-v1.0'
from p
join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
join public.investment_official_facts f on f.investment_id=i.id
on conflict (investment_id,model_version) do update set
  objective=excluded.objective,
  benchmark=excluded.benchmark,
  methodology=excluded.methodology,
  portfolio_construction=excluded.portfolio_construction,
  target_allocation=excluded.target_allocation,
  geographic_exposure=excluded.geographic_exposure,
  currency_hedging=excluded.currency_hedging,
  distribution_policy=excluded.distribution_policy,
  management_style=excluded.management_style,
  replication_method=excluded.replication_method,
  ideal_for=null,
  key_risks=excluded.key_risks,
  profile_summary=excluded.profile_summary,
  source_id=excluded.source_id,
  as_of_date=excluded.as_of_date,
  updated_at=now();

-- Current issuer pages are recorded separately from dated ETF Facts.
with product_src(symbol,source_name,url,version,notes) as (
  values
  ('TTP','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-18','Current TD ETF product data captured for catalog expansion.'),
  ('TPU','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-17','Current TD ETF product data captured for catalog expansion.'),
  ('TDB','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-17','Current TD ETF product data captured for catalog expansion.'),
  ('TCSH','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-18','Current TD ETF product data captured for catalog expansion.'),
  ('TGRO','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-18','Current TD ETF product data captured for catalog expansion.'),
  ('TEQT','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-18','Current TD ETF product data captured for catalog expansion.'),
  ('TEC','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-18','Current TD ETF product data captured for catalog expansion.'),
  ('TQCD','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-10','Current TD ETF product data captured for catalog expansion.'),
  ('THE','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-18','Current TD ETF product data captured for catalog expansion.'),
  ('TCOM','TD Asset Management Inc.','https://www.td.com/ca/en/asset-management/funds/solutions/etfs','2026-09-10','Current TD ETF product data captured for catalog expansion.'),
  ('CASH','Global X Investments Canada Inc.','https://www.globalx.ca/product/cash','2026-09-10','Current Global X product page metrics and disclosures.'),
  ('CBIL','Global X Investments Canada Inc.','https://www.globalx.ca/product/cbil','2026-09-10','Current Global X product page metrics and disclosures.'),
  ('HXT','Global X Investments Canada Inc.','https://www.globalx.ca/product/hxt','2026-09-16','Current Global X product page metrics and swap disclosure.'),
  ('HXS','Global X Investments Canada Inc.','https://www.globalx.ca/product/hxs','2026-09-10','Current Global X product page metrics and structure disclosure.'),
  ('HXQ','Global X Investments Canada Inc.','https://www.globalx.ca/product/hxq','2026-09-11','Current Global X product page metrics and structure disclosure.'),
  ('AIQ','Global X Investments Canada Inc.','https://www.globalx.ca/product/aiq','2026-09-18','Current Global X product page metrics and disclosures.'),
  ('PSA','Purpose Investments Inc.','https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund','2026-09-10','Current Purpose product page metrics and deposit-insurance disclosure.')
)
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,p.source_name,'official',p.url,'current_metrics,identity,disclosures',now(),p.version,p.notes
from product_src p join public.investments i on i.symbol=p.symbol and i.exchange='TSX'
where not exists (
  select 1 from public.investment_data_sources s
  where s.investment_id=i.id and s.source_url=p.url and s.source_version=p.version
);

-- Preserve explicit source provenance on the investment identity records.
update public.investments
set updated_at=now()
where symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
  and exchange='TSX';
