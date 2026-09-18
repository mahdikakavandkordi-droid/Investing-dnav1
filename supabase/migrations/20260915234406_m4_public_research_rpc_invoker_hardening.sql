-- M4 launch hardening: keep public research RPCs callable without exposing SECURITY DEFINER functions in the public API schema.
-- Three wrappers can safely run as invoker because their existing read path remains accessible.
alter function public.app_search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) security invoker;
alter function public.app_compare_investments(uuid[]) security invoker;
alter function public.app_get_investment_dna(uuid) security invoker;

-- Official fund facts intentionally read an RLS-protected source table. Keep the privileged implementation
-- in the non-exposed private schema and make the public API wrapper an invoker.
create or replace function investor_private.official_fund_facts(p_investment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select jsonb_build_object(
    'investment_id',i.id,
    'symbol',i.symbol,
    'source_name',f.source_name,
    'product_url',f.product_url,
    'etf_facts_url',f.etf_facts_url,
    'etf_facts_date',f.etf_facts_date,
    'management_fee_pct',f.management_fee_pct,
    'mer_pct',f.mer_pct,
    'fee_source_note',f.fee_source_note,
    'verified_at',f.verified_at,
    'summary',p.profile_summary,
    'objective',p.objective,
    'asset_mix',p.target_allocation,
    'management_style',p.management_style,
    'distribution_policy',p.distribution_policy
  )
  from public.investments i
  join public.investment_official_facts f on f.investment_id=i.id
  left join lateral (
    select ip.*
    from public.investment_profiles ip
    where ip.investment_id=i.id
    order by ip.as_of_date desc nulls last, ip.updated_at desc
    limit 1
  ) p on true
  where i.id=p_investment_id
  limit 1;
$$;
revoke all on function investor_private.official_fund_facts(uuid) from public;
grant execute on function investor_private.official_fund_facts(uuid) to anon,authenticated,service_role;

create or replace function public.app_get_official_fund_facts(p_investment_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select investor_private.official_fund_facts(p_investment_id);
$$;
revoke all on function public.app_get_official_fund_facts(uuid) from public;
grant execute on function public.app_get_official_fund_facts(uuid) to anon,authenticated,service_role;
