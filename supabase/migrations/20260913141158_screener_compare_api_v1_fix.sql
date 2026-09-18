create or replace view public.v_investment_screener as
select d.*,
  case when d.profile_target_allocation is not null then coalesce((d.profile_target_allocation->>'equity')::numeric, null) end as equity_pct,
  case when d.profile_target_allocation is not null then coalesce((d.profile_target_allocation->>'fixed_income')::numeric, null) end as fixed_income_pct
from public.v_investment_detail d
where d.data_status <> 'inactive';

create or replace function public.search_investments(
  p_asset_type text default null, p_category text default null, p_risk_level text default null,
  p_min_mer numeric default null, p_max_mer numeric default null, p_min_return_1y numeric default null,
  p_min_aum numeric default null, p_search text default null, p_sort text default 'name', p_limit integer default 50
) returns setof public.v_investment_screener
language sql stable security invoker set search_path=public as $$
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
 limit greatest(1,least(coalesce(p_limit,50),100)); $$;
revoke all on function public.search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) from public;
grant execute on function public.search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) to anon,authenticated;

create or replace function public.compare_investments(p_investment_ids uuid[])
returns table(id uuid,symbol text,name text,asset_type text,category text,risk_level text,price numeric,return_1y_pct numeric,return_3y_annualized_pct numeric,return_5y_annualized_pct numeric,mer_pct numeric,yield_pct numeric,aum numeric,volatility_1y_pct numeric,sharpe_ratio numeric,max_drawdown_1y_pct numeric,profile_summary text,target_allocation jsonb,quality_score numeric,data_status text)
language sql stable security invoker set search_path=public as $$
 select v.id,v.symbol,v.name,v.asset_type,v.category,v.risk_level,v.price,v.return_1y_pct,v.return_3y_annualized_pct,v.return_5y_annualized_pct,v.mer_pct,v.yield_pct,v.aum,v.volatility_1y_pct,v.sharpe_ratio,v.max_drawdown_1y_pct,v.profile_summary,v.profile_target_allocation,v.data_quality_score,v.data_status
 from public.v_investment_screener v where v.id=any(p_investment_ids) order by array_position(p_investment_ids,v.id); $$;
revoke all on function public.compare_investments(uuid[]) from public;
grant execute on function public.compare_investments(uuid[]) to anon,authenticated;
create index if not exists idx_investments_screening on public.investments(asset_type,category,is_featured,data_status);
create index if not exists idx_investment_metrics_screening on public.investment_metrics(investment_id,as_of_date desc);
create index if not exists idx_investment_risk_screening on public.investment_risk_metrics(investment_id,as_of_date desc);
