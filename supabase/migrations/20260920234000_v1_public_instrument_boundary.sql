-- Focus the browser-facing generic research API on the three V1 product types.
-- Historical/deferred instruments stay in the database for future versions.

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
     or coalesce(v.issuer_name,'') ilike '%'||p_search||'%'
   )
 order by v.is_featured desc nulls last,v.asset_type,v.name
 limit least(greatest(coalesce(p_limit,100),1),250);
$$;

create or replace function investor_private.get_instrument(p_investment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
 select to_jsonb(v)
 from public.v_instrument_research_catalog v
 where v.id=p_investment_id
   and v.asset_type in ('ETF','MUTUAL_FUND','GIC')
 limit 1;
$$;

create or replace function investor_private.compare_instruments(p_investment_ids uuid[])
returns setof public.v_instrument_research_catalog
language sql
stable
security definer
set search_path=''
as $$
 with requested as (
   select v.*
   from public.v_instrument_research_catalog v
   where v.id=any(p_investment_ids)
     and v.asset_type in ('ETF','MUTUAL_FUND','GIC')
 ),
 valid_set as (
   select count(*) as n,count(distinct asset_type) as type_count
   from requested
 )
 select r.*
 from requested r,valid_set s
 where s.n>=2 and s.type_count=1
 order by array_position(p_investment_ids,r.id);
$$;

revoke all on function investor_private.search_instruments(text,text,integer) from public,anon,authenticated;
revoke all on function investor_private.get_instrument(uuid) from public,anon,authenticated;
revoke all on function investor_private.compare_instruments(uuid[]) from public,anon,authenticated;
grant execute on function investor_private.search_instruments(text,text,integer) to service_role;
grant execute on function investor_private.get_instrument(uuid) to service_role;
grant execute on function investor_private.compare_instruments(uuid[]) to service_role;
