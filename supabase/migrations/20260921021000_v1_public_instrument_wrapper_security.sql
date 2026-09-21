-- Browser-safe public research wrappers execute the locked
-- investor_private read functions under the definer context. The private
-- functions remain non-executable by browser roles.

create or replace function public.app_search_instruments(
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
  select * from investor_private.search_instruments(p_asset_type,p_search,p_limit);
$$;

create or replace function public.app_get_instrument(p_investment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select investor_private.get_instrument(p_investment_id);
$$;

create or replace function public.app_compare_instruments(p_investment_ids uuid[])
returns setof public.v_instrument_research_catalog
language sql
stable
security definer
set search_path=''
as $$
  select * from investor_private.compare_instruments(p_investment_ids);
$$;

revoke all on function public.app_search_instruments(text,text,integer) from public;
revoke all on function public.app_get_instrument(uuid) from public;
revoke all on function public.app_compare_instruments(uuid[]) from public;
grant execute on function public.app_search_instruments(text,text,integer) to anon,authenticated;
grant execute on function public.app_get_instrument(uuid) to anon,authenticated;
grant execute on function public.app_compare_instruments(uuid[]) to anon,authenticated;
