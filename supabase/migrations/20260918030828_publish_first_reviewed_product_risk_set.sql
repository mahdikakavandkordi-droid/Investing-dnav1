-- First reviewed Product Risk DNA publication set.
-- Publication is keyed by stable investment symbols rather than generated UUIDs.
-- The guards ensure only the reviewed evidence set is promoted.

with candidates as (
  select p.id
  from public.product_risk_profiles p
  join public.investments i on i.id=p.investment_id
  where p.model_version='product-risk-dna-v1-research'
    and p.confidence='High'
    and (
      (i.symbol in ('ZDV','ZEB','ZFL','ZRE') and p.as_of_date=date '2026-08-31')
      or
      (i.symbol in ('RBC-GIC-1Y-CASH','RBC-GIC-1Y-NR','RBC-GIC-3Y-RED','RBC-GIC-5Y-NR')
       and p.as_of_date=date '2026-09-11')
    )
    and (
      select count(*)
      from public.product_risk_dimensions d
      where d.profile_id=p.id
        and d.band is not null
        and d.band not in ('Unknown','N/A')
    )=4
)
update public.product_risk_profiles p
set calibration_status='reviewed',
    publication_status='published',
    updated_at=now()
from candidates c
where p.id=c.id;
