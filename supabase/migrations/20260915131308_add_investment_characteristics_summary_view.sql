create or replace view public.v_investment_characteristics_summary as
select
 i.id investment_id,
 i.symbol,
 (select c.number_of_holdings from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.number_of_holdings is not null order by c.as_of_date desc,c.created_at desc limit 1) number_of_holdings,
 (select c.as_of_date from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.number_of_holdings is not null order by c.as_of_date desc,c.created_at desc limit 1) number_of_holdings_as_of_date,
 (select c.number_of_underlying_holdings from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.number_of_underlying_holdings is not null order by c.as_of_date desc,c.created_at desc limit 1) number_of_underlying_holdings,
 (select c.as_of_date from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.number_of_underlying_holdings is not null order by c.as_of_date desc,c.created_at desc limit 1) underlying_holdings_as_of_date,
 (select c.number_of_stocks from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.number_of_stocks is not null order by c.as_of_date desc,c.created_at desc limit 1) number_of_stocks,
 (select c.number_of_bonds from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.number_of_bonds is not null order by c.as_of_date desc,c.created_at desc limit 1) number_of_bonds,
 (select c.yield_to_maturity_pct from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.yield_to_maturity_pct is not null order by c.as_of_date desc,c.created_at desc limit 1) yield_to_maturity_pct,
 (select c.as_of_date from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.yield_to_maturity_pct is not null order by c.as_of_date desc,c.created_at desc limit 1) ytm_as_of_date,
 (select c.average_duration_years from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.average_duration_years is not null order by c.as_of_date desc,c.created_at desc limit 1) average_duration_years,
 (select c.as_of_date from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.average_duration_years is not null order by c.as_of_date desc,c.created_at desc limit 1) duration_as_of_date,
 (select c.average_maturity_years from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.average_maturity_years is not null order by c.as_of_date desc,c.created_at desc limit 1) average_maturity_years,
 (select c.average_credit_quality from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.average_credit_quality is not null order by c.as_of_date desc,c.created_at desc limit 1) average_credit_quality,
 (select c.pe_ratio from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.pe_ratio is not null order by c.as_of_date desc,c.created_at desc limit 1) pe_ratio,
 (select c.as_of_date from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.pe_ratio is not null order by c.as_of_date desc,c.created_at desc limit 1) pe_as_of_date,
 (select c.pb_ratio from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.pb_ratio is not null order by c.as_of_date desc,c.created_at desc limit 1) pb_ratio,
 (select c.roe_pct from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.roe_pct is not null order by c.as_of_date desc,c.created_at desc limit 1) roe_pct,
 (select c.earnings_growth_pct from public.investment_portfolio_characteristics c where c.investment_id=i.id and c.earnings_growth_pct is not null order by c.as_of_date desc,c.created_at desc limit 1) earnings_growth_pct
from public.investments i;
grant select on public.v_investment_characteristics_summary to anon,authenticated;