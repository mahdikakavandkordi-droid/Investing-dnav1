-- Consolidated acceptance marker for the focused V1 universe.
-- The preceding four migrations contain the reproducible schema/data changes.
delete from public.investment_metrics
where investment_id=(select id from public.investments where symbol='RBF460' and exchange='FUND')
  and as_of_date='2026-09-20'
  and price is null and return_1y_pct is null and return_3y_annualized_pct is null and return_5y_annualized_pct is null;
select public.refresh_investment_data_quality();
