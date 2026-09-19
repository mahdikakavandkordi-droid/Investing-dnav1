-- Market-data refresh worker contract regression.
-- Safe to run repeatedly; no persistent writes.

do $$
declare
  v_count int;
  v_plan jsonb;
  v_ca_etf uuid;
  v_resolution jsonb;
begin
  select count(*) into v_count
  from public.market_data_refresh_policies
  where asset_type='ETF'
    and data_type='price_history'
    and cadence='daily'
    and automation_enabled;

  if v_count <> 1 then
    raise exception 'expected one enabled daily ETF price-history policy, got %',v_count;
  end if;

  if exists (
    select 1
    from public.market_data_refresh_policies
    where asset_type in ('GIC','BOND','T_BILL','COMMERCIAL_PAPER','ABCP')
      and automation_enabled
  ) then
    raise exception 'non-ETF refresh paths must remain disabled until their provider adapters are operational';
  end if;

  if has_table_privilege('anon','public.market_data_refresh_policies','SELECT')
     or has_table_privilege('authenticated','public.market_data_refresh_policies','SELECT')
     or has_table_privilege('anon','public.market_data_worker_runs','SELECT')
     or has_table_privilege('authenticated','public.market_data_worker_runs','SELECT')
  then
    raise exception 'market refresh operational tables must remain service-only';
  end if;

  if has_function_privilege('anon','public.get_due_price_history_ingestion_plan(timestamp with time zone)','EXECUTE')
     or has_function_privilege('authenticated','public.get_due_price_history_ingestion_plan(timestamp with time zone)','EXECUTE')
     or has_function_privilege('anon','public.resolve_automated_market_data_source(uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.resolve_automated_market_data_source(uuid,text)','EXECUTE')
     or has_function_privilege('anon','public.start_market_data_worker_run(text)','EXECUTE')
     or has_function_privilege('authenticated','public.start_market_data_worker_run(text)','EXECUTE')
  then
    raise exception 'market refresh service functions must not be browser executable';
  end if;

  v_plan:=public.get_due_price_history_ingestion_plan(
    ((current_date + interval '1 day')::date + time '21:00') at time zone 'America/Toronto'
  );
  if jsonb_typeof(v_plan) <> 'array' then
    raise exception 'due ingestion plan must return a JSON array';
  end if;

  select id into v_ca_etf
  from public.investments
  where is_active and asset_type='ETF' and country_code='CA' and exchange='TSX'
  order by symbol
  limit 1;

  if v_ca_etf is null then
    raise exception 'expected at least one active Canadian TSX ETF fixture';
  end if;

  v_resolution:=public.resolve_automated_market_data_source(v_ca_etf,'price_history');
  if jsonb_typeof(v_resolution) <> 'object' then
    raise exception 'automated source resolution must return a JSON object';
  end if;
end $$;

begin;
do $
declare
  v_run uuid;
  v_finished jsonb;
begin
  v_run:=public.start_market_data_worker_run('manual');
  v_finished:=public.finish_market_data_worker_run(
    v_run,'no_work',0,0,0,0,0,jsonb_build_object('regression',true)
  );
  if v_finished->>'status' <> 'no_work' then
    raise exception 'worker audit lifecycle did not reach no_work';
  end if;
end $;
rollback;

select 'PASS: market-data refresh policy, due-plan and service boundary' as result;
