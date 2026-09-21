-- Plain-English display names for the focused V1 research experience.
-- Official/legal names remain untouched and continue to be the source of truth.

alter table public.investments
  add column if not exists display_name text;

with friendly(symbol,display_name) as (
 values
 ('XAW','Global Stocks — Ex Canada'),
 ('XBAL','Balanced All-in-One Portfolio'),
 ('XCB','Canadian Corporate Bonds'),
 ('XEC','Emerging Markets Stocks'),
 ('XEF','International Developed Markets'),
 ('XEI','Canadian Dividend Stocks'),
 ('XEQT','All-Equity Portfolio'),
 ('XGRO','Growth All-in-One Portfolio'),
 ('XIC','Canadian Stocks'),
 ('XIT','Canadian Technology Stocks'),
 ('XIU','Canada Large-Cap Stocks'),
 ('XRE','Canadian Real Estate'),
 ('XSB','Canadian Short-Term Bonds'),
 ('XSH','Short-Term Corporate Bonds'),
 ('XSP','S&P 500 — CAD Hedged'),
 ('XUS','S&P 500 — U.S. Stocks'),
 ('XUU','U.S. Total Market'),
 ('ZAG','Canadian Aggregate Bonds'),
 ('ZBAL','Balanced All-in-One Portfolio'),
 ('ZCN','Canadian Stocks'),
 ('ZDV','Canadian Dividend Stocks'),
 ('ZEB','Canadian Banks — Equal Weight'),
 ('ZFL','Long Federal Government Bonds'),
 ('ZRE','Canadian Real Estate — Equal Weight'),
 ('ZSP','S&P 500 — U.S. Stocks'),
 ('FBAL','Balanced All-in-One Portfolio'),
 ('FCAM','U.S. Stocks'),
 ('FCCA','Canadian Stocks'),
 ('FCIN','International Stocks'),
 ('FCNS','Conservative All-in-One Portfolio'),
 ('FEQT','All-Equity Portfolio'),
 ('FFIX','Global Fixed Income'),
 ('FGRO','Growth All-in-One Portfolio'),
 ('AIQ','AI & Technology Stocks'),
 ('CASH','High-Interest Savings Exposure'),
 ('CBIL','0–3 Month Canadian T-Bills'),
 ('HXQ','Nasdaq-100 Stocks'),
 ('HXS','S&P 500 — U.S. Stocks'),
 ('HXT','Canada Large-Cap Stocks'),
 ('MBAL','Balanced All-in-One Portfolio'),
 ('MCON','Conservative All-in-One Portfolio'),
 ('MEQT','All-Equity Portfolio'),
 ('MGRW','Growth All-in-One Portfolio'),
 ('MKB','Canadian Fixed Income'),
 ('QBB','Canadian Aggregate Bonds'),
 ('QCN','Canadian Stocks'),
 ('QDX','International Developed Markets'),
 ('QUU','U.S. Large-Cap Stocks'),
 ('PSA','High-Interest Savings Exposure'),
 ('RBNK','Canadian Banks — Yield Focus'),
 ('RCAN','Canadian Stocks'),
 ('RCD','Canadian Dividend Stocks'),
 ('RID','International Dividend Stocks'),
 ('RUSA','U.S. Large-Cap Stocks'),
 ('RUST','Ultra-Short Corporate Bonds'),
 ('TCOM','Commodities'),
 ('TCSH','Cash Management'),
 ('TDB','Canadian Aggregate Bonds'),
 ('TEC','Global Technology Stocks'),
 ('TEQT','All-Equity Portfolio'),
 ('TGRO','Growth All-in-One Portfolio'),
 ('THE','International Stocks — CAD Hedged'),
 ('TPU','U.S. Stocks'),
 ('TQCD','Canadian Dividend Stocks'),
 ('TTP','Canadian Stocks'),
 ('VAB','Canadian Aggregate Bonds'),
 ('VBAL','Balanced All-in-One Portfolio'),
 ('VCB','Canadian Corporate Bonds'),
 ('VCN','Canadian Stocks'),
 ('VCNS','Conservative All-in-One Portfolio'),
 ('VDY','Canadian Dividend Stocks'),
 ('VEE','Emerging Markets Stocks'),
 ('VEQT','All-Equity Portfolio'),
 ('VFV','S&P 500 — U.S. Stocks'),
 ('VGRO','Growth All-in-One Portfolio'),
 ('VIU','Developed Markets — Ex North America'),
 ('VRE','Canadian Real Estate'),
 ('VSB','Canadian Short-Term Bonds'),
 ('VUN','U.S. Total Market'),
 ('VXC','Global Stocks — Ex Canada'),
 ('RBF459','Growth Global Portfolio'),
 ('RBF460','Balanced Global Portfolio'),
 ('RBF461','Conservative Global Portfolio')
)
update public.investments i
set display_name=f.display_name,updated_at=now()
from friendly f
where i.symbol=f.symbol
  and i.asset_type in ('ETF','MUTUAL_FUND');

create or replace view public.v_instrument_research_catalog
with (security_invoker=true) as
select s.*,
 sp.model_version structure_model_version,sp.capital_protection,sp.liquidity_level,sp.price_volatility,sp.income_predictability,sp.growth_participation,
 sp.interest_rate_sensitivity,sp.credit_exposure,sp.diversification_level,sp.complexity_level,sp.time_structure,sp.principal_protection_basis,sp.as_of_date structure_as_of_date,
 fi.instrument_subtype,fi.coupon_pct,fi.yield_to_maturity_pct,fi.issue_date,fi.maturity_date,fi.remaining_term_months,fi.duration_years,fi.face_value,fi.credit_rating,
 fi.credit_rating_agency,fi.discount_instrument,fi.market_access_note,fi.source_name fixed_income_source_name,fi.source_url fixed_income_source_url,fi.as_of_date fixed_income_as_of_date,
 dep.annual_rate_pct deposit_rate_pct,dep.term_months,dep.redeemability,dep.minimum_deposit,dep.interest_payment_frequency,dep.registered_account_eligibility,
 dep.deposit_insurance_scheme,dep.deposit_insurance_eligible,dep.lockup_note,dep.source_name deposit_source_name,dep.source_url deposit_source_url,dep.as_of_date deposit_as_of_date,
 mf.series_name,mf.fund_code,mf.cifsc_category,mf.load_structure,mf.sales_status,mf.minimum_initial_investment,mf.minimum_additional_investment,
 mf.income_distribution_frequency mf_income_distribution_frequency,mf.capital_gains_distribution_frequency,mf.source_name mutual_fund_source_name,
 mf.source_url mutual_fund_source_url,mf.as_of_date mutual_fund_as_of_date,
 base.display_name
from public.v_investment_screener s
left join public.investments base on base.id=s.id
left join public.investment_structure_profiles sp on sp.investment_id=s.id and sp.model_version='structure-v1'
left join lateral(select x.* from public.investment_fixed_income_terms x where x.investment_id=s.id order by x.as_of_date desc,x.created_at desc limit 1)fi on true
left join lateral(select x.* from public.investment_deposit_terms x where x.investment_id=s.id order by x.as_of_date desc,x.created_at desc limit 1)dep on true
left join public.investment_mutual_fund_terms mf on mf.investment_id=s.id;

create or replace function investor_private.search_instruments(
  p_asset_type text default null,
  p_search text default null,
  p_limit integer default 100
)
returns setof public.v_instrument_research_catalog
language sql
stable
security definer
set search_path=''
as $$
 select *
 from public.v_instrument_research_catalog v
 where v.asset_type in ('ETF','MUTUAL_FUND','GIC')
   and (p_asset_type is null or v.asset_type=p_asset_type)
   and (
     p_search is null
     or v.symbol ilike '%'||p_search||'%'
     or v.name ilike '%'||p_search||'%'
     or coalesce(v.display_name,'') ilike '%'||p_search||'%'
     or coalesce(v.issuer_name,'') ilike '%'||p_search||'%'
   )
 order by v.is_featured desc nulls last,v.asset_type,coalesce(v.display_name,v.name),v.name
 limit least(greatest(coalesce(p_limit,100),1),250);
$$;

revoke all on function investor_private.search_instruments(text,text,integer) from public,anon,authenticated;
grant execute on function investor_private.search_instruments(text,text,integer) to service_role;
