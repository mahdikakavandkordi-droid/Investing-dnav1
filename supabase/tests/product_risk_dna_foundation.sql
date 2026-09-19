-- Product Risk DNA modular foundation regression.
-- Requires the matching migration; performs no persistent writes.

do $$
declare
 v_modules int;
begin
 select count(*) into v_modules
 from public.product_risk_module_registry
 where model_version='product-risk-dna-v1-research' and readiness='research';

 if v_modules <> 6 then
   raise exception 'expected 6 current research modules, got %',v_modules;
 end if;

 if exists (select 1 from public.product_risk_profiles) then
   raise exception 'foundation migration must not seed uncalibrated product risk profiles';
 end if;

 if has_table_privilege('anon','public.product_risk_sensor_evidence','SELECT') then
   raise exception 'raw sensor evidence must not be browser-readable';
 end if;

 if not has_table_privilege('anon','public.product_risk_module_registry','SELECT')
    or not has_function_privilege('anon','public.app_get_product_risk(uuid,boolean)','EXECUTE') then
   raise exception 'public Product Risk DNA read contract is incomplete';
 end if;
end $$;

select 'PASS: Product Risk DNA modular foundation contract' as result;
