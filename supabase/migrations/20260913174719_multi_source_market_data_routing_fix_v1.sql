create or replace function public.resolve_market_data_source(p_investment_id uuid,p_data_type text default 'price_history')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_symbol text; v_asset text; v_country text; v_exchange text; v_source jsonb;
begin
 select symbol,asset_type,country_code,exchange into v_symbol,v_asset,v_country,v_exchange from investments where id=p_investment_id;
 if v_symbol is null then raise exception 'Investment not found'; end if;
 select jsonb_build_object('source_key',s.source_key,'source_name',s.source_name,'priority',coalesce(r.priority_override,s.priority),'reason',case when s.source_key='massive' then 'US market-data route' when s.source_key='internal_verified' then 'verified Canadian foundation route' else 'primary issuer route' end)
 into v_source
 from market_data_sources s
 left join market_data_source_routing r on r.source_id=s.id and r.is_active and (r.asset_type is null or r.asset_type=v_asset) and (r.country_code is null or r.country_code=v_country) and (r.exchange is null or r.exchange=v_exchange) and (r.symbol_pattern is null or v_symbol ilike r.symbol_pattern)
 where s.is_active and s.supports_history
   and ((v_country='US' and s.market_scope in ('US','CA,US')) or (v_country='CA' and s.market_scope in ('CA','CA,US')) or (v_country is null and s.market_scope='CA,US'))
 order by coalesce(r.priority_override,s.priority),s.priority limit 1;
 return coalesce(v_source,jsonb_build_object('source_key',null,'reason','no eligible source'));
end;$$;
revoke all on function public.resolve_market_data_source(uuid,text) from public,anon,authenticated;
grant execute on function public.resolve_market_data_source(uuid,text) to service_role;