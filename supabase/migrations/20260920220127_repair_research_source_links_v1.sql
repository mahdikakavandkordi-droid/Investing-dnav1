
-- Research source-link integrity repair.
-- Links already-verified research rows to existing official issuer provenance.

-- Explicit TDAM spotlight source for TQCD performance.
insert into public.investment_data_sources(
  investment_id,source_name,source_type,source_url,metric_scope,retrieved_at,source_version,notes
)
select i.id,'TD Asset Management Inc.','official',
       'https://www.td.com/ca/en/asset-management/spotlight',
       'performance',now(),'2026-06-30',
       'Official TDAM spotlight performance source used for the dated TQCD return snapshot.'
from public.investments i
where i.symbol='TQCD' and i.exchange='TSX'
  and not exists (
    select 1 from public.investment_data_sources s
    where s.investment_id=i.id
      and s.source_url='https://www.td.com/ca/en/asset-management/spotlight'
      and s.source_version='2026-06-30'
  );

update public.investment_performance_history p
set source_id=(
  select s.id
  from public.investment_data_sources s
  where s.investment_id=p.investment_id
    and s.source_url='https://www.td.com/ca/en/asset-management/spotlight'
    and s.source_version='2026-06-30'
  order by s.created_at desc
  limit 1
)
from public.investments i
where i.id=p.investment_id
  and i.symbol='TQCD'
  and p.as_of_date='2026-06-30'
  and p.verification_status='issuer_verified'
  and p.source_id is null;

update public.investment_performance_history p
set source_id=(
  select s.id
  from public.investment_data_sources s
  where s.investment_id=p.investment_id
    and s.source_url='https://www.purposeinvest.com/funds/purpose-high-interest-savings-fund'
  order by s.created_at desc
  limit 1
)
from public.investments i
where i.id=p.investment_id
  and i.symbol='PSA'
  and p.as_of_date='2026-08-31'
  and p.verification_status='issuer_verified'
  and p.source_id is null;

-- Link profile rows that predated mandatory source provenance.
update public.investment_profiles p
set source_id=(
  select s.id
  from public.investment_data_sources s
  where s.investment_id=p.investment_id
    and s.source_type in ('issuer_official','official')
  order by
    case when s.source_version='2026-09-14' then 0 else 1 end,
    s.created_at desc
  limit 1
)
from public.investments i
where i.id=p.investment_id
  and i.symbol in ('VBAL','VCNS','VEQT','VFV','VGRO')
  and p.model_version='profile-v1.0'
  and p.source_id is null;

update public.investment_profiles p
set source_id=(
  select s.id
  from public.investment_data_sources s
  where s.investment_id=p.investment_id
    and s.source_type in ('issuer_official','official')
  order by
    case when s.source_version='2026-09' then 0 else 1 end,
    s.created_at desc
  limit 1
)
from public.investments i
where i.id=p.investment_id
  and i.symbol='ZBAL'
  and p.model_version='profile-v1.0'
  and p.source_id is null;
