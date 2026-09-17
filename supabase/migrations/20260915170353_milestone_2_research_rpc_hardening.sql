create or replace function investor_private.investment_research_context(p_investment_id uuid)
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
    select round(sum(coalesce(h.weight_pct,0)),2),round(sum(case when u.id is not null then coalesce(h.weight_pct,0) else 0 end),2) into v_weight,v_known
    from public.investment_holdings h left join public.investments u on upper(u.symbol)=upper(h.holding_symbol) and u.is_active
    where h.investment_id=p_investment_id and h.as_of_date=v_date;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.weight_pct desc nulls last),'[]'::jsonb) into v_hold
    from (select h.holding_symbol,h.holding_name,h.weight_pct,h.asset_type,h.country_code,h.sector,h.as_of_date,u.id as known_investment_id,u.name as known_investment_name
          from public.investment_holdings h left join public.investments u on upper(u.symbol)=upper(h.holding_symbol) and u.is_active
          where h.investment_id=p_investment_id and h.as_of_date=v_date order by h.weight_pct desc nulls last limit 12) x;
  else v_weight:=0;v_known:=0;v_hold:='[]'::jsonb; end if;
  v_mode:=case when coalesce(v_known,0)>=50 then 'fund_of_funds_structure' when coalesce(v_weight,0)>=95 then 'full_holdings' when coalesce(v_weight,0)>0 then 'top_holdings_sample' else 'no_holdings' end;
  return jsonb_build_object('investment_id',p_investment_id,'coverage',v_cov,'performance',v_perf,'characteristics',v_char,'exposure_coverage',v_exp,'holdings',jsonb_build_object('mode',v_mode,'as_of_date',v_date,'weight_coverage_pct',v_weight,'known_underlying_weight_pct',v_known,'items',coalesce(v_hold,'[]'::jsonb)));
end;$$;
revoke all on function investor_private.investment_research_context(uuid) from public;
grant execute on function investor_private.investment_research_context(uuid) to anon,authenticated,service_role;

create or replace function public.app_get_investment_research_context(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$ select investor_private.investment_research_context(p_investment_id); $$;
revoke all on function public.app_get_investment_research_context(uuid) from public;
grant execute on function public.app_get_investment_research_context(uuid) to anon,authenticated,service_role;