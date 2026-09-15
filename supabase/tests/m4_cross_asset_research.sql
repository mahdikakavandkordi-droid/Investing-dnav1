-- M4 cross-asset research architecture regression.
-- Safe to run repeatedly; no persistent writes.

do $$
declare
  v_total int;
  v_profiles int;
  v_anon_total int;
  v_count int;
begin
  select count(*) into v_total from public.investments where is_active;
  if v_total <> 55 then raise exception 'expected 55 active instruments, got %', v_total; end if;

  select count(*) into v_count from public.investments where is_active and asset_type='ETF';
  if v_count <> 40 then raise exception 'expected 40 ETFs, got %', v_count; end if;
  select count(*) into v_count from public.investments where is_active and asset_type='GIC';
  if v_count <> 4 then raise exception 'expected 4 GICs, got %', v_count; end if;
  select count(*) into v_count from public.investments where is_active and asset_type='T_BILL';
  if v_count <> 3 then raise exception 'expected 3 T-Bills, got %', v_count; end if;
  select count(*) into v_count from public.investments where is_active and asset_type='BOND';
  if v_count <> 6 then raise exception 'expected 6 bonds, got %', v_count; end if;
  select count(*) into v_count from public.investments where is_active and asset_type='COMMERCIAL_PAPER';
  if v_count <> 1 then raise exception 'expected 1 CP reference, got %', v_count; end if;
  select count(*) into v_count from public.investments where is_active and asset_type='ABCP';
  if v_count <> 1 then raise exception 'expected 1 ABCP reference, got %', v_count; end if;

  select count(*) into v_profiles
  from public.investment_structure_profiles sp
  join public.investments i on i.id=sp.investment_id
  where i.is_active and sp.model_version='structure-v1';
  if v_profiles <> v_total then raise exception 'structure profile coverage %/%', v_profiles, v_total; end if;

  if exists (
    select 1 from public.v_instrument_research_catalog
    where asset_type in ('COMMERCIAL_PAPER','ABCP') and yield_to_maturity_pct is not null
  ) then raise exception 'research-only CP/ABCP must not synthesize current yield'; end if;

  select count(*) into v_count from public.v_instrument_research_catalog
  where asset_type='GIC' and deposit_rate_pct is not null and deposit_source_name is not null and deposit_as_of_date is not null;
  if v_count <> 4 then raise exception 'expected sourced current terms for all 4 GIC samples, got %', v_count; end if;

  select count(*) into v_count from public.v_instrument_research_catalog
  where asset_type='T_BILL' and yield_to_maturity_pct is not null and fixed_income_source_name='Bank of Canada' and fixed_income_as_of_date is not null;
  if v_count <> 3 then raise exception 'expected sourced yields for all 3 T-Bill samples, got %', v_count; end if;

  if has_table_privilege('anon','public.investment_structure_profiles','INSERT')
    or has_table_privilege('anon','public.investment_fixed_income_terms','INSERT')
    or has_table_privilege('anon','public.investment_deposit_terms','INSERT')
  then raise exception 'anon must not have direct write privileges on research tables'; end if;

  if not has_table_privilege('anon','public.investment_structure_profiles','SELECT')
    or not has_function_privilege('anon','public.app_search_instruments(text,text,integer)','EXECUTE')
  then raise exception 'anon research read contract is incomplete'; end if;
end $$;

begin;
set local role anon;
select count(*)::int as anon_visible_instruments from public.app_search_instruments(null,null,100);
rollback;

select 'PASS: M4 cross-asset research architecture and sample integrity' as result;
