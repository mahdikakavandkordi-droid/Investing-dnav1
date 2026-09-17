create or replace function investor_private.search_investments(
 p_asset_type text default null,
 p_category text default null,
 p_risk_level text default null,
 p_min_mer numeric default null,
 p_max_mer numeric default null,
 p_min_return_1y numeric default null,
 p_min_aum numeric default null,
 p_search text default null,
 p_sort text default 'name',
 p_limit integer default 50
) returns setof public.v_investment_screener
language sql stable security definer set search_path=''
as $$
 select * from public.v_investment_screener v
 where (p_asset_type is null or v.asset_type=p_asset_type)
 and (p_category is null or v.category=p_category)
 and (p_risk_level is null or v.risk_level=p_risk_level)
 and (p_min_mer is null or v.mer_pct>=p_min_mer)
 and (p_max_mer is null or v.mer_pct<=p_max_mer)
 and (p_min_return_1y is null or v.return_1y_pct>=p_min_return_1y)
 and (p_min_aum is null or v.aum>=p_min_aum)
 and (p_search is null or v.symbol ilike '%'||p_search||'%' or v.name ilike '%'||p_search||'%')
 order by case when p_sort='return_1y_desc' then v.return_1y_pct end desc nulls last,
 case when p_sort='mer_asc' then v.mer_pct end asc nulls last,
 case when p_sort='aum_desc' then v.aum end desc nulls last,
 case when p_sort='risk_asc' then v.risk_level end asc nulls last,
 case when p_sort='name' then v.name end asc, v.name asc
 limit greatest(1,least(coalesce(p_limit,50),100));
$$;

create or replace function investor_private.compare_investments(p_investment_ids uuid[])
returns setof public.v_investment_screener
language sql stable security definer set search_path=''
as $$
 select v.* from public.v_investment_screener v
 where v.id=any(p_investment_ids)
 order by array_position(p_investment_ids,v.id);
$$;

create or replace function investor_private.investment_dna(p_investment_id uuid)
returns jsonb language sql stable security definer set search_path=''
as $$ select to_jsonb(v) from public.v_investment_dna_v2 v where v.investment_id=p_investment_id limit 1; $$;

create or replace function investor_private.search_instruments(p_asset_type text default null,p_search text default null,p_limit integer default 100)
returns setof public.v_instrument_research_catalog
language sql stable security definer set search_path=''
as $$
 select * from public.v_instrument_research_catalog v
 where (p_asset_type is null or v.asset_type=p_asset_type)
 and (p_search is null or v.symbol ilike '%'||p_search||'%' or v.name ilike '%'||p_search||'%')
 order by v.is_featured desc nulls last,v.asset_type,v.name
 limit least(greatest(coalesce(p_limit,100),1),250);
$$;

create or replace function investor_private.get_instrument(p_investment_id uuid)
returns jsonb language sql stable security definer set search_path=''
as $$ select to_jsonb(v) from public.v_instrument_research_catalog v where v.id=p_investment_id limit 1; $$;

create or replace function investor_private.compare_instruments(p_investment_ids uuid[])
returns setof public.v_instrument_research_catalog
language sql stable security definer set search_path=''
as $$ select v.* from public.v_instrument_research_catalog v where v.id=any(p_investment_ids) order by array_position(p_investment_ids,v.id); $$;

revoke all on function investor_private.search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) from public;
revoke all on function investor_private.compare_investments(uuid[]) from public;
revoke all on function investor_private.investment_dna(uuid) from public;
revoke all on function investor_private.search_instruments(text,text,integer) from public;
revoke all on function investor_private.get_instrument(uuid) from public;
revoke all on function investor_private.compare_instruments(uuid[]) from public;
grant execute on function investor_private.search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) to anon,authenticated;
grant execute on function investor_private.compare_investments(uuid[]) to anon,authenticated;
grant execute on function investor_private.investment_dna(uuid) to anon,authenticated;
grant execute on function investor_private.search_instruments(text,text,integer) to anon,authenticated;
grant execute on function investor_private.get_instrument(uuid) to anon,authenticated;
grant execute on function investor_private.compare_instruments(uuid[]) to anon,authenticated;

create or replace function public.app_search_investments(
 p_asset_type text default null,p_category text default null,p_risk_level text default null,
 p_min_mer numeric default null,p_max_mer numeric default null,p_min_return_1y numeric default null,
 p_min_aum numeric default null,p_search text default null,p_sort text default 'name',p_limit integer default 50
) returns setof public.v_investment_screener
language sql stable set search_path=''
as $$ select * from investor_private.search_investments(p_asset_type,p_category,p_risk_level,p_min_mer,p_max_mer,p_min_return_1y,p_min_aum,p_search,p_sort,p_limit); $$;

create or replace function public.app_compare_investments(p_investment_ids uuid[])
returns table(id uuid,symbol text,name text,asset_type text,category text,risk_level text,price numeric,return_1y_pct numeric,return_3y_annualized_pct numeric,return_5y_annualized_pct numeric,mer_pct numeric,yield_pct numeric,aum numeric,volatility_1y_pct numeric,sharpe_ratio numeric,max_drawdown_1y_pct numeric,profile_summary text,target_allocation jsonb,quality_score numeric,data_status text)
language sql stable set search_path=''
as $$
 select v.id,v.symbol,v.name,v.asset_type,v.category,v.risk_level,v.price,v.return_1y_pct,v.return_3y_annualized_pct,v.return_5y_annualized_pct,v.mer_pct,v.yield_pct,v.aum,v.volatility_1y_pct,v.sharpe_ratio,v.max_drawdown_1y_pct,v.profile_summary,v.profile_target_allocation,v.data_quality_score,v.data_status
 from investor_private.compare_investments(p_investment_ids) v;
$$;

create or replace function public.app_get_investment_dna(p_investment_id uuid)
returns jsonb language sql stable set search_path=''
as $$ select investor_private.investment_dna(p_investment_id); $$;

create or replace function public.app_search_instruments(p_asset_type text default null,p_search text default null,p_limit integer default 100)
returns setof public.v_instrument_research_catalog
language sql stable set search_path=''
as $$ select * from investor_private.search_instruments(p_asset_type,p_search,p_limit); $$;

create or replace function public.app_get_instrument(p_investment_id uuid)
returns jsonb language sql stable set search_path=''
as $$ select investor_private.get_instrument(p_investment_id); $$;

create or replace function public.app_compare_instruments(p_investment_ids uuid[])
returns setof public.v_instrument_research_catalog
language sql stable set search_path=''
as $$ select * from investor_private.compare_instruments(p_investment_ids); $$;

drop function public.search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer);
drop function public.compare_investments(uuid[]);

alter view public.v_investment_latest_income set (security_invoker=true);
alter view public.v_investment_catalog set (security_invoker=true);
alter view public.v_investment_detail set (security_invoker=true);
alter view public.v_investment_screener set (security_invoker=true);
alter view public.v_investment_dna_v2 set (security_invoker=true);
revoke all on public.v_investment_latest_income,public.v_investment_catalog,public.v_investment_detail,public.v_investment_screener,public.v_investment_dna_v2,public.v_instrument_research_catalog from anon,authenticated;