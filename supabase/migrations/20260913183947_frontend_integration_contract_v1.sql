begin;

-- Canonical read models for the application. These are deliberately thin: UI consumes stable shapes while engine internals can evolve.
create or replace view public.v_app_dna as
select * from public.v_current_investor_dna;
grant select on public.v_app_dna to authenticated;

create or replace view public.v_app_investment_catalog as
select * from public.v_investment_screener;
grant select on public.v_app_investment_catalog to anon, authenticated;

create or replace view public.v_app_investment_detail as
select * from public.v_investment_detail;
grant select on public.v_app_investment_detail to anon, authenticated;

create or replace view public.v_app_watchlist as
select wi.id, w.id as watchlist_id, w.profile_id, wi.investment_id, wi.note, wi.created_at,
       i.symbol, i.name, i.asset_type, i.category,
       m.price, m.return_1y_pct, m.mer_pct,
       r.risk_level
from public.watchlist_items wi
join public.watchlists w on w.id=wi.watchlist_id
join public.investments i on i.id=wi.investment_id
left join public.investment_metrics m on m.investment_id=i.id
left join public.investment_risk_metrics r on r.investment_id=i.id
where public.is_current_profile(w.profile_id);
grant select on public.v_app_watchlist to authenticated;

-- One server-side application payload: latest DNA + context + report + ranked matches + portfolio blueprints.
create or replace function public.get_current_investor_app_state()
returns jsonb
language plpgsql
security definer
set search_path=public,auth,extensions
as $$
declare
 v_profile public.profiles;
 v_ip public.investor_profiles;
 v_assessment public.assessments;
 v_report jsonb;
 v_matches jsonb;
 v_portfolios jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_profile from public.profiles where user_id=auth.uid() limit 1;
 if v_profile.id is null then
   return jsonb_build_object('authenticated',true,'has_profile',false,'dna',null,'report',null,'matches',null,'portfolios',null);
 end if;
 select * into v_ip from public.investor_profiles where profile_id=v_profile.id limit 1;
 if v_ip.id is null or v_ip.latest_assessment_id is null then
   return jsonb_build_object('authenticated',true,'has_profile',true,'profile_id',v_profile.id,'dna',null,'report',null,'matches',null,'portfolios',null);
 end if;
 select * into v_assessment from public.assessments where id=v_ip.latest_assessment_id and is_current=true;
 select rs.report into v_report from public.report_snapshots rs where rs.assessment_id=v_ip.latest_assessment_id order by rs.created_at desc limit 1;
 select public.get_investment_recommendations(v_ip.latest_assessment_id,10) into v_matches;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.overall_fit_score desc),'[]'::jsonb) into v_portfolios
 from public.investment_portfolio_blueprints x where x.assessment_id=v_ip.latest_assessment_id;
 return jsonb_build_object('authenticated',true,'has_profile',true,'profile_id',v_profile.id,'investor_profile_id',v_ip.id,'assessment_id',v_ip.latest_assessment_id,'dna',(select to_jsonb(d) from public.v_current_investor_dna d where d.investor_profile_id=v_ip.id limit 1),'report',coalesce(v_report,'{}'::jsonb),'matches',coalesce(v_matches,'{}'::jsonb),'portfolios',v_portfolios);
end;
$$;
revoke all on function public.get_current_investor_app_state() from public,anon,authenticated;
grant execute on function public.get_current_investor_app_state() to authenticated;

-- Search contract for Explore/Screener.
create or replace function public.app_search_investments(
 p_asset_type text default null, p_category text default null, p_risk_level text default null,
 p_min_mer numeric default null, p_max_mer numeric default null, p_min_return_1y numeric default null,
 p_min_aum numeric default null, p_search text default null, p_sort text default 'name', p_limit integer default 50)
returns setof public.v_investment_screener
language sql stable security definer
set search_path=public,extensions
as $$ select * from public.search_investments(p_asset_type,p_category,p_risk_level,p_min_mer,p_max_mer,p_min_return_1y,p_min_aum,p_search,p_sort,p_limit); $$;
revoke all on function public.app_search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) from public,anon,authenticated;
grant execute on function public.app_search_investments(text,text,text,numeric,numeric,numeric,numeric,text,text,integer) to anon,authenticated;

create or replace function public.app_compare_investments(p_investment_ids uuid[])
returns table(id uuid,symbol text,name text,asset_type text,category text,risk_level text,price numeric,return_1y_pct numeric,return_3y_annualized_pct numeric,return_5y_annualized_pct numeric,mer_pct numeric,yield_pct numeric,aum numeric,volatility_1y_pct numeric,sharpe_ratio numeric,max_drawdown_1y_pct numeric,profile_summary text,target_allocation jsonb,quality_score numeric,data_status text)
language sql stable security definer
set search_path=public,extensions
as $$ select * from public.compare_investments(p_investment_ids); $$;
revoke all on function public.app_compare_investments(uuid[]) from public,anon,authenticated;
grant execute on function public.app_compare_investments(uuid[]) to anon,authenticated;

commit;