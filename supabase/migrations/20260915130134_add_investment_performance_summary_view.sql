create or replace view public.v_investment_performance_summary as
select
  i.id as investment_id,
  i.symbol,
  p1.return_1m_pct,
  p1.as_of_date as return_1m_as_of_date,
  p3.return_3m_pct,
  p3.as_of_date as return_3m_as_of_date,
  p1y.return_1y_pct,
  p1y.as_of_date as return_1y_as_of_date,
  p3y.return_3y_annualized_pct,
  p3y.as_of_date as return_3y_as_of_date,
  p5y.return_5y_annualized_pct,
  p5y.as_of_date as return_5y_as_of_date,
  psi.since_inception_annualized_pct,
  psi.as_of_date as since_inception_as_of_date
from public.investments i
left join lateral (
  select return_1m_pct,as_of_date from public.investment_performance_history p
  where p.investment_id=i.id and p.return_1m_pct is not null order by as_of_date desc,created_at desc limit 1
) p1 on true
left join lateral (
  select return_3m_pct,as_of_date from public.investment_performance_history p
  where p.investment_id=i.id and p.return_3m_pct is not null order by as_of_date desc,created_at desc limit 1
) p3 on true
left join lateral (
  select return_1y_pct,as_of_date from public.investment_performance_history p
  where p.investment_id=i.id and p.return_1y_pct is not null order by as_of_date desc,created_at desc limit 1
) p1y on true
left join lateral (
  select return_3y_annualized_pct,as_of_date from public.investment_performance_history p
  where p.investment_id=i.id and p.return_3y_annualized_pct is not null order by as_of_date desc,created_at desc limit 1
) p3y on true
left join lateral (
  select return_5y_annualized_pct,as_of_date from public.investment_performance_history p
  where p.investment_id=i.id and p.return_5y_annualized_pct is not null order by as_of_date desc,created_at desc limit 1
) p5y on true
left join lateral (
  select since_inception_annualized_pct,as_of_date from public.investment_performance_history p
  where p.investment_id=i.id and p.since_inception_annualized_pct is not null order by as_of_date desc,created_at desc limit 1
) psi on true;

grant select on public.v_investment_performance_summary to anon,authenticated;