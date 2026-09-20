-- V1 mutual-fund source evidence, fee/risk facts and Investment DNA inputs.

insert into public.investment_data_sources(investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,notes)
select i.id,'RBC Global Asset Management','issuer_official',v.url,'fund profile, risk, performance, strategic asset mix and terms',now(),
       'Official RBC GAM product/profile source used for the first V1 mutual-fund research wave.'
from (values
 ('RBF461','https://www.rbcgam.com/documents/fund-pages/monthly/rbf461_e.pdf'),
 ('RBF460','https://www.rbcgam.com/ca/products/mutual-funds/rbf460/detail'),
 ('RBF459','https://www.rbcgam.com/documents/fund-pages/monthly/rbf459_e.pdf')
) v(symbol,url)
join public.investments i on i.symbol=v.symbol and i.exchange='FUND'
where not exists(select 1 from public.investment_data_sources ds where ds.investment_id=i.id and ds.source_url=v.url and ds.source_type='issuer_official');

with p(symbol,objective,benchmark,allocation,distribution,ideal_for,risks,summary,as_of_date) as (
 values
 ('RBF461','Income and the potential for moderate capital growth.','Strategic benchmark: 40% equity, 58% fixed income, 2% cash/T-Bills.','{"equity":40,"fixed_income":58,"cash":2}'::jsonb,'Quarterly income; annual capital gains','Investors seeking a conservative diversified portfolio with income and moderate growth potential.','["Market risk","Interest-rate risk","Credit risk","Currency risk","Fund-of-funds risk"]'::jsonb,'A conservative global balanced mutual fund with a strong fixed-income role and a smaller equity allocation.','2026-04-30'::date),
 ('RBF460','Long-term capital growth with a secondary focus on modest income.','Strategic benchmark: 60% equity, 38% fixed income, 2% cash/T-Bills.','{"equity":60,"fixed_income":38,"cash":2}','Annual income and capital gains','Investors seeking a diversified balanced core portfolio for a medium-to-long horizon.','["Market risk","Interest-rate risk","Credit risk","Currency risk","Fund-of-funds risk"]','A global balanced mutual fund combining equity growth exposure with a meaningful defensive allocation.','2026-06-30'),
 ('RBF459','Long-term capital growth with some fixed-income exposure for diversification.','Strategic benchmark: 75% equity, 23% fixed income, 2% cash/T-Bills.','{"equity":75,"fixed_income":23,"cash":2}','Annual income and capital gains','Long-term investors seeking higher growth participation and accepting more market variability.','["Equity market risk","Interest-rate risk","Credit risk","Currency risk","Fund-of-funds risk"]','A growth-oriented global balanced mutual fund emphasizing equities while retaining a smaller defensive sleeve.','2025-10-31')
)
insert into public.investment_profiles(investment_id,objective,benchmark,methodology,portfolio_construction,target_allocation,geographic_exposure,currency_hedging,distribution_policy,management_style,replication_method,ideal_for,key_risks,profile_summary,source_id,as_of_date,model_version)
select i.id,p.objective,p.benchmark,'Issuer-defined strategic asset allocation implemented through underlying RBC GAM funds.','Actively managed fund-of-funds with strategic and tactical asset allocation.',
       p.allocation,'{"Canada":"meaningful","United States":"meaningful","International":"meaningful"}'::jsonb,'Underlying funds may use currency hedging according to their mandates.',
       p.distribution,'Active','Fund-of-funds',p.ideal_for,p.risks,p.summary,
       (select ds.id from public.investment_data_sources ds where ds.investment_id=i.id and ds.source_type='issuer_official' order by ds.retrieved_at desc limit 1),
       p.as_of_date,'profile-v1.0'
from p join public.investments i on i.symbol=p.symbol and i.exchange='FUND'
on conflict (investment_id,model_version) do update set
 objective=excluded.objective,benchmark=excluded.benchmark,target_allocation=excluded.target_allocation,distribution_policy=excluded.distribution_policy,
 ideal_for=excluded.ideal_for,key_risks=excluded.key_risks,profile_summary=excluded.profile_summary,source_id=excluded.source_id,as_of_date=excluded.as_of_date,updated_at=now();

insert into public.investment_official_facts(investment_id,source_name,product_url,etf_facts_url,etf_facts_date,management_fee_pct,mer_pct,fee_source_note,verified_at)
values
 ((select id from public.investments where symbol='RBF461' and exchange='FUND'),'RBC Global Asset Management','https://www.rbcgam.com/en/ca/products/mutual-funds/RBF461/detail','https://funds.rbcgam.com/pdf/fund-facts/funds/rbf461_e.pdf','2025-06-27',1.45,1.70,'Mutual-fund Series A fee data; legal Fund Facts and current profile dates are tracked separately.',now()),
 ((select id from public.investments where symbol='RBF460' and exchange='FUND'),'RBC Global Asset Management','https://www.rbcgam.com/ca/products/mutual-funds/RBF460/detail','https://funds.rbcgam.com/pdf/fund-facts/funds/rbf460_e.pdf','2025-12-17',1.65,1.94,'Mutual-fund Series A fee data; legal Fund Facts and current profile dates are tracked separately.',now()),
 ((select id from public.investments where symbol='RBF459' and exchange='FUND'),'RBC Global Asset Management','https://www.rbcgam.com/en/ca/products/mutual-funds/RBF459/detail','https://funds.rbcgam.com/pdf/fund-facts/funds/rbf459_e.pdf','2025-06-27',1.75,2.03,'Mutual-fund Series A fee data; legal Fund Facts and current profile dates are tracked separately.',now())
on conflict (investment_id) do update set source_name=excluded.source_name,product_url=excluded.product_url,etf_facts_url=excluded.etf_facts_url,etf_facts_date=excluded.etf_facts_date,
 management_fee_pct=excluded.management_fee_pct,mer_pct=excluded.mer_pct,fee_source_note=excluded.fee_source_note,verified_at=excluded.verified_at;

insert into public.investment_official_risk_ratings(investment_id,official_risk_rating,band_min,band_max,issuer,source_type,source_title,source_url,source_date,effective_date,methodology,verification_note,verified_at,updated_at)
values
 ((select id from public.investments where symbol='RBF461' and exchange='FUND'),'Low to Medium',20,40,'RBC Global Asset Management Inc.','Fund Facts','RBC Select Conservative Portfolio - Series A Fund Facts','https://funds.rbcgam.com/pdf/fund-facts/funds/rbf461_e.pdf','2025-06-27','2025-06-27','Canadian issuer risk rating disclosed under the CSA investment risk classification framework (NI 81-102).','Issuer profile confirms the current risk category.',now(),now()),
 ((select id from public.investments where symbol='RBF460' and exchange='FUND'),'Low to Medium',20,40,'RBC Global Asset Management Inc.','Fund Facts','RBC Select Balanced Portfolio - Series A Fund Facts','https://funds.rbcgam.com/pdf/fund-facts/funds/rbf460_e.pdf','2025-12-17','2025-12-17','Canadian issuer risk rating disclosed under the CSA investment risk classification framework (NI 81-102).','Issuer profile confirms the current risk category.',now(),now()),
 ((select id from public.investments where symbol='RBF459' and exchange='FUND'),'Low to Medium',20,40,'RBC Global Asset Management Inc.','Fund Facts','RBC Select Growth Portfolio - Series A Fund Facts','https://funds.rbcgam.com/pdf/fund-facts/funds/rbf459_e.pdf','2025-06-27','2025-06-27','Canadian issuer risk rating disclosed under the CSA investment risk classification framework (NI 81-102).','Issuer profile confirms the current risk category.',now(),now())
on conflict (investment_id) do update set official_risk_rating=excluded.official_risk_rating,band_min=excluded.band_min,band_max=excluded.band_max,issuer=excluded.issuer,source_type=excluded.source_type,
 source_title=excluded.source_title,source_url=excluded.source_url,source_date=excluded.source_date,effective_date=excluded.effective_date,methodology=excluded.methodology,
 verification_note=excluded.verification_note,verified_at=excluded.verified_at,updated_at=excluded.updated_at;

with x(symbol,risk,growth,income,stability,equity,fixed,cash,horizon,as_of_date,style,objective,fit) as (
 values
 ('RBF461',35::numeric,40::numeric,66::numeric,63::numeric,40::numeric,58::numeric,2::numeric,36,'2026-04-30'::date,'conservative_balanced','income_moderate_growth','conservative'),
 ('RBF460',35,60,50,51,60,38,2,48,'2026-06-30','balanced','balanced_growth_income','balanced'),
 ('RBF459',35,75,18,43,75,23,2,60,'2025-10-31','growth_balanced','long_term_growth','growth')
)
insert into public.investment_suitability_profiles_v2(investment_id,model_version,risk_band,normalized_risk_score,growth_score,income_score,liquidity_score,diversification_score,minimum_horizon_months,drawdown_tolerance_required,volatility_tolerance_required,concentration_level,geographic_scope,currency_exposure,suitability_summary,key_fit_factors,key_mismatch_factors,source_basis,as_of_date)
select i.id,'suitability-v2.0','Low to Medium',x.risk,x.growth,x.income,90,93,x.horizon,case when x.equity<=40 then 40 when x.equity<=60 then 55 else 65 end,case when x.equity<=40 then 40 when x.equity<=60 then 55 else 65 end,
 'Moderate','Global','Diversified CAD and foreign-currency exposure through underlying funds.',
 case when x.equity<=40 then 'Conservative diversified core with an income tilt.' when x.equity<=60 then 'Balanced core combining growth and defensive assets.' else 'Growth-oriented diversified core with a smaller defensive sleeve.' end,
 '["Risk-band alignment","Asset-allocation fit","Diversification"]'::jsonb,'["Time horizon","Market drawdown risk","Liquidity needs"]'::jsonb,
 jsonb_build_object('allocation',jsonb_build_object('equity',x.equity,'fixed_income',x.fixed,'cash',x.cash),'official_risk','Low to Medium','profile_model','profile-v1.0'),x.as_of_date
from x join public.investments i on i.symbol=x.symbol and i.exchange='FUND'
on conflict (investment_id,model_version) do update set risk_band=excluded.risk_band,normalized_risk_score=excluded.normalized_risk_score,growth_score=excluded.growth_score,
 income_score=excluded.income_score,liquidity_score=excluded.liquidity_score,diversification_score=excluded.diversification_score,minimum_horizon_months=excluded.minimum_horizon_months,
 source_basis=excluded.source_basis,as_of_date=excluded.as_of_date,updated_at=now();

with x(symbol,growth,income,stability,equity,fixed,cash,as_of_date,style,objective,fit) as (
 values
 ('RBF461',40::numeric,66::numeric,63::numeric,40::numeric,58::numeric,2::numeric,'2026-04-30'::date,'conservative_balanced','income_moderate_growth','conservative'),
 ('RBF460',60,50,51,60,38,2,'2026-06-30','balanced','balanced_growth_income','balanced'),
 ('RBF459',75,18,43,75,23,2,'2025-10-31','growth_balanced','long_term_growth','growth')
)
insert into public.investment_intelligence_profiles(investment_id,model_version,style_class,objective_class,investor_fit_class,growth_score,income_score,stability_score,diversification_score,liquidity_score,complexity_score,ideal_investor,best_use_cases,key_tradeoffs,explanation,source_basis,as_of_date)
select i.id,'intelligence-v1.1',x.style,x.objective,x.fit,x.growth,x.income,x.stability,93,90,10,
 jsonb_build_array(x.fit||' investors','medium-to-long-term investors'),jsonb_build_array('core portfolio',case when x.equity<=40 then 'income plus moderate growth' when x.equity<=60 then 'balanced growth and income' else 'global equity participation' end),
 '["market risk","time-horizon sensitivity","fund fees"]'::jsonb,
 jsonb_build_object('allocation',jsonb_build_object('equity',x.equity,'fixed_income',x.fixed,'cash',x.cash),'risk_basis','Low to Medium','style_basis','issuer strategic mix and official risk',
   'signal_inputs',jsonb_build_object('equity_pct',x.equity,'fixed_income_pct',x.fixed+x.cash,'official_risk','Low to Medium','meaningful_geographic_regions',3)),
 jsonb_build_object('profile_date',x.as_of_date,'risk_source','issuer Fund Facts','source_policy','Issuer strategic allocation and official risk; no performance forecasting.'),x.as_of_date
from x join public.investments i on i.symbol=x.symbol and i.exchange='FUND'
on conflict (investment_id,model_version) do update set style_class=excluded.style_class,objective_class=excluded.objective_class,investor_fit_class=excluded.investor_fit_class,
 growth_score=excluded.growth_score,income_score=excluded.income_score,stability_score=excluded.stability_score,diversification_score=excluded.diversification_score,
 liquidity_score=excluded.liquidity_score,complexity_score=excluded.complexity_score,ideal_investor=excluded.ideal_investor,best_use_cases=excluded.best_use_cases,
 key_tradeoffs=excluded.key_tradeoffs,explanation=excluded.explanation,source_basis=excluded.source_basis,as_of_date=excluded.as_of_date,updated_at=now();

with x(symbol,volatility,income,growth,rate_sensitivity,as_of_date) as (
 values ('RBF461','low','medium','medium','medium','2026-04-30'::date),('RBF460','medium','medium','medium','medium','2026-06-30'),('RBF459','medium','low','high','low','2025-10-31')
)
insert into public.investment_structure_profiles(investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,growth_participation,interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,time_structure,principal_protection_basis,source_basis,as_of_date)
select i.id,'structure-v1','none','high',x.volatility,x.income,x.growth,x.rate_sensitivity,'Diversified underlying fixed-income funds','diversified','medium','open_ended',
 'No contractual principal protection; mutual fund unit value can fall.',jsonb_build_object('source','RBC GAM official profile','model','investment-dna-signals-v1.1'),x.as_of_date
from x join public.investments i on i.symbol=x.symbol and i.exchange='FUND'
on conflict (investment_id,model_version) do update set price_volatility=excluded.price_volatility,income_predictability=excluded.income_predictability,growth_participation=excluded.growth_participation,
 interest_rate_sensitivity=excluded.interest_rate_sensitivity,credit_exposure=excluded.credit_exposure,diversification_level=excluded.diversification_level,
 complexity_level=excluded.complexity_level,time_structure=excluded.time_structure,principal_protection_basis=excluded.principal_protection_basis,source_basis=excluded.source_basis,as_of_date=excluded.as_of_date,updated_at=now();
