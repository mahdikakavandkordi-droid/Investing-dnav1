create table if not exists public.investment_performance_history (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  as_of_date date not null,
  return_1m_pct numeric,
  return_3m_pct numeric,
  return_1y_pct numeric,
  return_3y_annualized_pct numeric,
  return_5y_annualized_pct numeric,
  since_inception_annualized_pct numeric,
  return_basis text not null default 'issuer_total_return',
  source_id uuid references public.investment_data_sources(id) on delete set null,
  source_note text,
  created_at timestamptz not null default now(),
  unique(investment_id, as_of_date, return_basis)
);

alter table public.investment_performance_history enable row level security;
drop policy if exists investment_performance_public_read on public.investment_performance_history;
create policy investment_performance_public_read on public.investment_performance_history for select using (true);
grant select on public.investment_performance_history to anon, authenticated;

create or replace view public.v_investment_latest_performance as
select distinct on (p.investment_id)
  p.investment_id,
  i.symbol,
  p.as_of_date,
  p.return_1m_pct,
  p.return_3m_pct,
  p.return_1y_pct,
  p.return_3y_annualized_pct,
  p.return_5y_annualized_pct,
  p.since_inception_annualized_pct,
  p.return_basis,
  p.source_id,
  s.source_name,
  s.source_url,
  p.source_note
from public.investment_performance_history p
join public.investments i on i.id=p.investment_id
left join public.investment_data_sources s on s.id=p.source_id
order by p.investment_id,p.as_of_date desc,p.created_at desc;

grant select on public.v_investment_latest_performance to anon, authenticated;

insert into public.investment_performance_history(
 investment_id,as_of_date,return_1m_pct,return_3m_pct,return_1y_pct,return_3y_annualized_pct,return_5y_annualized_pct,return_basis,source_note
)
select m.investment_id,m.as_of_date,m.return_1m_pct,m.return_3m_pct,m.return_1y_pct,m.return_3y_annualized_pct,m.return_5y_annualized_pct,'legacy_metrics_snapshot','Backfilled from investment_metrics; source provenance should be upgraded when issuer data is reverified.'
from public.investment_metrics m
where m.return_1m_pct is not null or m.return_3m_pct is not null or m.return_1y_pct is not null or m.return_3y_annualized_pct is not null or m.return_5y_annualized_pct is not null
on conflict (investment_id,as_of_date,return_basis) do update set
 return_1m_pct=excluded.return_1m_pct,
 return_3m_pct=excluded.return_3m_pct,
 return_1y_pct=excluded.return_1y_pct,
 return_3y_annualized_pct=excluded.return_3y_annualized_pct,
 return_5y_annualized_pct=excluded.return_5y_annualized_pct,
 source_note=excluded.source_note;