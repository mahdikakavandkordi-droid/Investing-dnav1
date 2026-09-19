create or replace view public.v_investment_metric_snapshot_v2 with (security_invoker=true) as
select i.id as investment_id,
       i.symbol,
       lr.as_of_date as latest_metric_date,
       lr.price,
       lr.daily_change_pct,
       (select x.mer_pct from public.investment_metrics x where x.investment_id=i.id and x.mer_pct is not null order by x.as_of_date desc,x.created_at desc limit 1) as mer_pct,
       (select x.aum from public.investment_metrics x where x.investment_id=i.id and x.aum is not null order by x.as_of_date desc,x.created_at desc limit 1) as aum,
       (select x.volume from public.investment_metrics x where x.investment_id=i.id and x.volume is not null order by x.as_of_date desc,x.created_at desc limit 1) as volume,
       (select x.yield_pct from public.investment_metrics x where x.investment_id=i.id and x.yield_pct is not null order by x.as_of_date desc,x.created_at desc limit 1) as legacy_yield_pct,
       (select x.distribution_frequency from public.investment_metrics x where x.investment_id=i.id and x.distribution_frequency is not null order by x.as_of_date desc,x.created_at desc limit 1) as legacy_distribution_frequency
from public.investments i
left join lateral (
  select x.as_of_date,x.price,x.daily_change_pct
  from public.investment_metrics x
  where x.investment_id=i.id
  order by x.as_of_date desc,x.created_at desc limit 1
) lr on true
where i.is_active=true;

revoke all on public.v_investment_metric_snapshot_v2 from public,anon,authenticated;

create or replace view public.v_investment_catalog as
select i.id,i.symbol,i.name,i.legal_name,i.asset_type,i.category,i.subcategory,i.strategy,i.sector,i.region,i.country_code,i.currency,i.exchange,i.description,i.inception_date,i.is_featured,i.data_status,
       issuer.name as issuer_name,issuer.website as issuer_website,
       greatest(ms.latest_metric_date,ps.return_1m_as_of_date,ps.return_3m_as_of_date,ps.return_1y_as_of_date,ps.return_3y_as_of_date,ps.return_5y_as_of_date,inc.as_of_date) as metrics_as_of_date,
       ms.price,ms.daily_change_pct,
       ps.return_1m_pct,ps.return_3m_pct,ps.return_1y_pct,ps.return_3y_annualized_pct,ps.return_5y_annualized_pct,
       coalesce(inc.distribution_yield_pct,inc.trailing_yield_pct,ms.legacy_yield_pct) as yield_pct,
       coalesce(inc.distribution_frequency,ms.legacy_distribution_frequency) as distribution_frequency,
       ms.mer_pct,ms.aum,ms.volume,
       r.risk_level,r.volatility_1y_pct,r.volatility_3y_pct,r.max_drawdown_1y_pct,r.max_drawdown_3y_pct,r.beta,r.sharpe_ratio,r.standard_deviation_pct
from public.investments i
left join public.investment_issuers issuer on issuer.id=i.issuer_id
left join public.v_investment_metric_snapshot_v2 ms on ms.investment_id=i.id
left join public.v_investment_performance_summary ps on ps.investment_id=i.id
left join public.v_investment_latest_income inc on inc.investment_id=i.id
left join lateral (
  select x.risk_level,x.volatility_1y_pct,x.volatility_3y_pct,x.max_drawdown_1y_pct,x.max_drawdown_3y_pct,x.beta,x.sharpe_ratio,x.standard_deviation_pct
  from public.investment_risk_metrics x
  where x.investment_id=i.id
  order by x.as_of_date desc,x.created_at desc limit 1
) r on true
where i.is_active=true;

create or replace function public.app_get_investment_research_context(p_investment_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_cov jsonb; v_perf jsonb; v_char jsonb; v_exp jsonb; v_hold jsonb; v_date date; v_weight numeric; v_known numeric; v_mode text;
begin
  if not exists(select 1 from public.investments i where i.id=p_investment_id and i.is_active) then return null; end if;
  select to_jsonb(c) into v_cov from public.v_investment_data_coverage_v2 c where c.investment_id=p_investment_id;
  select to_jsonb(p) into v_perf from public.v_investment_performance_summary p where p.investment_id=p_investment_id;
  select to_jsonb(c) into v_char from public.v_investment_characteristics_summary c where c.investment_id=p_investment_id;
  select to_jsonb(e) into v_exp from public.v_investment_exposure_coverage e where e.investment_id=p_investment_id;
  select max(h.as_of_date) into v_date from public.investment_holdings h where h.investment_id=p_investment_id;
  if v_date is not null then
    select round(sum(coalesce(h.weight_pct,0)),2),round(sum(case when u.id is not null then coalesce(h.weight_pct,0) else 0 end),2)
      into v_weight,v_known
    from public.investment_holdings h left join public.investments u on upper(u.symbol)=upper(h.holding_symbol) and u.is_active
    where h.investment_id=p_investment_id and h.as_of_date=v_date;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.weight_pct desc nulls last),'[]'::jsonb) into v_hold
    from (
      select h.holding_symbol,h.holding_name,h.weight_pct,h.asset_type,h.country_code,h.sector,h.as_of_date,
             u.id as known_investment_id,u.name as known_investment_name
      from public.investment_holdings h
      left join public.investments u on upper(u.symbol)=upper(h.holding_symbol) and u.is_active
      where h.investment_id=p_investment_id and h.as_of_date=v_date
      order by h.weight_pct desc nulls last
      limit 12
    ) x;
  else
    v_weight:=0;v_known:=0;v_hold:='[]'::jsonb;
  end if;
  v_mode:=case when coalesce(v_known,0)>=50 then 'fund_of_funds_structure' when coalesce(v_weight,0)>=95 then 'full_holdings' when coalesce(v_weight,0)>0 then 'top_holdings_sample' else 'no_holdings' end;
  return jsonb_build_object('investment_id',p_investment_id,'coverage',v_cov,'performance',v_perf,'characteristics',v_char,'exposure_coverage',v_exp,
    'holdings',jsonb_build_object('mode',v_mode,'as_of_date',v_date,'weight_coverage_pct',v_weight,'known_underlying_weight_pct',v_known,'items',coalesce(v_hold,'[]'::jsonb)));
end;$$;

revoke all on function public.app_get_investment_research_context(uuid) from public;
grant execute on function public.app_get_investment_research_context(uuid) to anon,authenticated,service_role;
