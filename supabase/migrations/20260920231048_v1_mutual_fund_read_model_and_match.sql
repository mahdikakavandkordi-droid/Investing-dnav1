-- Generic research read model + Match universe extension for fund vehicles.
create or replace view public.v_instrument_research_catalog with (security_invoker=true) as
select s.*,
 sp.model_version structure_model_version,sp.capital_protection,sp.liquidity_level,sp.price_volatility,sp.income_predictability,sp.growth_participation,
 sp.interest_rate_sensitivity,sp.credit_exposure,sp.diversification_level,sp.complexity_level,sp.time_structure,sp.principal_protection_basis,sp.as_of_date structure_as_of_date,
 fi.instrument_subtype,fi.coupon_pct,fi.yield_to_maturity_pct,fi.issue_date,fi.maturity_date,fi.remaining_term_months,fi.duration_years,fi.face_value,fi.credit_rating,
 fi.credit_rating_agency,fi.discount_instrument,fi.market_access_note,fi.source_name fixed_income_source_name,fi.source_url fixed_income_source_url,fi.as_of_date fixed_income_as_of_date,
 dep.annual_rate_pct deposit_rate_pct,dep.term_months,dep.redeemability,dep.minimum_deposit,dep.interest_payment_frequency,dep.registered_account_eligibility,
 dep.deposit_insurance_scheme,dep.deposit_insurance_eligible,dep.lockup_note,dep.source_name deposit_source_name,dep.source_url deposit_source_url,dep.as_of_date deposit_as_of_date,
 mf.series_name,mf.fund_code,mf.cifsc_category,mf.load_structure,mf.sales_status,mf.minimum_initial_investment,mf.minimum_additional_investment,
 mf.income_distribution_frequency mf_income_distribution_frequency,mf.capital_gains_distribution_frequency,mf.source_name mutual_fund_source_name,
 mf.source_url mutual_fund_source_url,mf.as_of_date mutual_fund_as_of_date
from public.v_investment_screener s
left join public.investment_structure_profiles sp on sp.investment_id=s.id and sp.model_version='structure-v1'
left join lateral(select x.* from public.investment_fixed_income_terms x where x.investment_id=s.id order by x.as_of_date desc,x.created_at desc limit 1)fi on true
left join lateral(select x.* from public.investment_deposit_terms x where x.investment_id=s.id order by x.as_of_date desc,x.created_at desc limit 1)dep on true
left join public.investment_mutual_fund_terms mf on mf.investment_id=s.id;

create or replace view public.v_investment_dna_v2 with (security_invoker=true) as
select i.id investment_id,i.symbol,i.name,i.asset_type,i.category,i.subcategory,s.model_version suitability_model_version,ip.model_version intelligence_model_version,
 coalesce(orisk.official_risk_rating,s.risk_band) risk_band,s.normalized_risk_score risk_score,ip.growth_score,ip.income_score,ip.stability_score,ip.diversification_score,
 s.liquidity_score,ip.complexity_score,s.minimum_horizon_months,s.concentration_level,s.geographic_scope,s.currency_exposure,sc.equity_pct,
 case when i.asset_type='MUTUAL_FUND' then coalesce(sc.fixed_income_pct,0)+coalesce((sc.profile_target_allocation->>'cash')::numeric,0) else sc.fixed_income_pct end fixed_income_pct,
 sc.mer_pct,
 case when i.asset_type='MUTUAL_FUND' and ip.model_version='intelligence-v1.1' and sc.equity_pct is not null
   and abs(sc.equity_pct+coalesce(sc.fixed_income_pct,0)+coalesce((sc.profile_target_allocation->>'cash')::numeric,0)-100)<=1
   and orisk.official_risk_rating is not null and orisk.source_url is not null and orisk.verified_at is not null and facts.investment_id is not null
   then 'verified' else sc.data_quality_status end data_quality_status,
 sc.data_quality_score,ip.style_class,ip.objective_class,ip.ideal_investor,ip.best_use_cases,ip.key_tradeoffs,ip.explanation,ip.source_basis intelligence_source_basis,
 greatest(coalesce(s.as_of_date,'1900-01-01'::date),coalesce(ip.as_of_date,'1900-01-01'::date),coalesce(orisk.source_date,'1900-01-01'::date)) as_of_date,
 orisk.official_risk_rating,orisk.band_min official_risk_band_min,orisk.band_max official_risk_band_max,orisk.issuer official_risk_issuer,
 orisk.source_type official_risk_source_type,orisk.source_title official_risk_source_title,orisk.source_url official_risk_source_url,
 orisk.source_date official_risk_source_date,orisk.effective_date official_risk_effective_date,orisk.methodology official_risk_methodology,
 orisk.verification_note official_risk_verification_note,orisk.verified_at official_risk_verified_at
from public.investments i
left join lateral(select x.* from public.investment_suitability_profiles_v2 x where x.investment_id=i.id order by x.updated_at desc nulls last,x.created_at desc nulls last limit 1)s on true
left join public.investment_intelligence_profiles ip on ip.investment_id=i.id and ip.model_version='intelligence-v1.1'
left join public.v_investment_screener sc on sc.id=i.id
left join public.investment_official_risk_ratings orisk on orisk.investment_id=i.id
left join public.investment_official_facts facts on facts.investment_id=i.id
where i.is_active=true and i.asset_type in ('ETF','MUTUAL_FUND');
revoke all on public.v_investment_dna_v2 from public,anon,authenticated;
grant select on public.v_investment_dna_v2 to service_role;
