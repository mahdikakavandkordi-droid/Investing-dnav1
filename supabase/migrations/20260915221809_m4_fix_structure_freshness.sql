update public.investment_structure_profiles sp
set as_of_date=d.as_of_date,
    source_basis=jsonb_set(coalesce(sp.source_basis,'{}'::jsonb),'{freshness_basis}',to_jsonb('actual investment DNA source date'::text),true),
    updated_at=now()
from public.v_investment_dna_v2 d
where sp.investment_id=d.investment_id
  and sp.model_version='structure-v1'
  and d.asset_type='ETF';
