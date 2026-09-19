do $$
declare
 r record;
 payload jsonb;
 expected_module text;
begin
 for r in
   select distinct on (asset_type) id,asset_type
   from public.investments
   where is_active and asset_type in ('ETF','GIC','T_BILL','BOND','COMMERCIAL_PAPER','ABCP')
   order by asset_type,id
 loop
   expected_module := case r.asset_type
    when 'ETF' then 'etf-risk'
    when 'GIC' then 'gic-risk'
    when 'T_BILL' then 't-bill-risk'
    when 'BOND' then 'bond-risk'
    when 'COMMERCIAL_PAPER' then 'commercial-paper-risk'
    when 'ABCP' then 'abcp-risk'
   end;
   payload := investor_private.product_risk_inputs(r.id);
   if payload->>'input_status' <> 'available' then
     raise exception 'input bundle failed for %: %',r.asset_type,payload;
   end if;
   if payload->>'module_code' <> expected_module then
     raise exception 'module mismatch for %: %',r.asset_type,payload;
   end if;
   if payload->>'missing_sensor_policy' <> 'omitted_means_unknown' then
     raise exception 'missing sensor policy absent for %',r.asset_type;
   end if;
 end loop;

 if has_function_privilege('anon','investor_private.product_risk_inputs(uuid)','EXECUTE')
    or has_function_privilege('authenticated','investor_private.product_risk_inputs(uuid)','EXECUTE') then
   raise exception 'raw product-risk input dispatcher must remain service-only';
 end if;
end $$;

select 'PASS: modular Product Risk input adapters dispatch all current asset types' as result;
