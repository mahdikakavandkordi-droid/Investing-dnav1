alter table public.investment_performance_history
  add column if not exists verification_status text not null default 'legacy_unverified' check (verification_status in ('legacy_unverified','issuer_linked','issuer_verified'));

update public.investment_performance_history
set verification_status=case
  when return_basis='issuer_total_return' then 'issuer_verified'
  when source_id is not null then 'issuer_linked'
  else 'legacy_unverified'
end;

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
  psi.as_of_date as since_inception_as_of_date,
  p1.verification_status as return_1m_verification_status,
  p3.verification_status as return_3m_verification_status,
  p1y.verification_status as return_1y_verification_status,
  p3y.verification_status as return_3y_verification_status,
  p5y.verification_status as return_5y_verification_status,
  psi.verification_status as since_inception_verification_status
from public.investments i
left join lateral (
  select return_1m_pct,as_of_date,verification_status from public.investment_performance_history p
  where p.investment_id=i.id and p.return_1m_pct is not null
  order by case p.verification_status when 'issuer_verified' then 0 when 'issuer_linked' then 1 else 2 end,as_of_date desc,created_at desc limit 1
) p1 on true
left join lateral (
  select return_3m_pct,as_of_date,verification_status from public.investment_performance_history p
  where p.investment_id=i.id and p.return_3m_pct is not null
  order by case p.verification_status when 'issuer_verified' then 0 when 'issuer_linked' then 1 else 2 end,as_of_date desc,created_at desc limit 1
) p3 on true
left join lateral (
  select return_1y_pct,as_of_date,verification_status from public.investment_performance_history p
  where p.investment_id=i.id and p.return_1y_pct is not null
  order by case p.verification_status when 'issuer_verified' then 0 when 'issuer_linked' then 1 else 2 end,as_of_date desc,created_at desc limit 1
) p1y on true
left join lateral (
  select return_3y_annualized_pct,as_of_date,verification_status from public.investment_performance_history p
  where p.investment_id=i.id and p.return_3y_annualized_pct is not null
  order by case p.verification_status when 'issuer_verified' then 0 when 'issuer_linked' then 1 else 2 end,as_of_date desc,created_at desc limit 1
) p3y on true
left join lateral (
  select return_5y_annualized_pct,as_of_date,verification_status from public.investment_performance_history p
  where p.investment_id=i.id and p.return_5y_annualized_pct is not null
  order by case p.verification_status when 'issuer_verified' then 0 when 'issuer_linked' then 1 else 2 end,as_of_date desc,created_at desc limit 1
) p5y on true
left join lateral (
  select since_inception_annualized_pct,as_of_date,verification_status from public.investment_performance_history p
  where p.investment_id=i.id and p.since_inception_annualized_pct is not null
  order by case p.verification_status when 'issuer_verified' then 0 when 'issuer_linked' then 1 else 2 end,as_of_date desc,created_at desc limit 1
) psi on true;

grant select on public.v_investment_performance_summary to anon,authenticated;