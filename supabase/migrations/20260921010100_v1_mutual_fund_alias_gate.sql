-- Mutual-fund daily refreshes require an explicitly verified provider alias.
-- ETFs keep using exchange suffix transforms; fund codes are never guessed.

create or replace function public.get_due_price_history_ingestion_plan(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_plan jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'investment_id',x.investment_id,
      'symbol',x.symbol,
      'asset_type',x.asset_type,
      'country_code',x.country_code,
      'exchange',x.exchange,
      'currency',x.currency,
      'provider_symbol',x.provider_symbol,
      'latest_price_date',x.latest_price_date,
      'target_price_date',x.target_price_date,
      'cadence',x.cadence,
      'max_staleness_hours',x.max_staleness_hours,
      'selected_source',x.selected_source
    ) order by x.symbol
  ) into v_plan
  from (
    select
      i.id investment_id,
      i.symbol,
      i.asset_type,
      i.country_code,
      i.exchange,
      i.currency,
      ph.latest_price_date,
      (timezone(p.market_timezone,p_now))::date target_price_date,
      p.cadence,
      p.max_staleness_hours,
      src.selected_source,
      alias.provider_symbol
    from public.investments i
    join public.market_data_refresh_policies p
      on p.asset_type=i.asset_type
     and p.data_type='price_history'
     and p.automation_enabled
    left join lateral (
      select max(h.price_date) latest_price_date
      from public.investment_price_history h
      where h.investment_id=i.id
    ) ph on true
    left join lateral (
      select public.resolve_automated_market_data_source(i.id,'price_history') selected_source
    ) src on true
    left join public.market_data_symbol_aliases alias
      on alias.investment_id=i.id
     and alias.is_active
     and alias.source_id=nullif(src.selected_source->>'source_id','')::uuid
    where i.is_active
      and (timezone(p.market_timezone,p_now))::time >= p.refresh_after_local_time
      and (ph.latest_price_date is null or ph.latest_price_date < (timezone(p.market_timezone,p_now))::date)
      and (
        i.asset_type <> 'MUTUAL_FUND'
        or alias.provider_symbol is not null
      )
  ) x;

  return coalesce(v_plan,'[]'::jsonb);
end;
$$;

revoke all on function public.get_due_price_history_ingestion_plan(timestamptz) from public,anon,authenticated;
grant execute on function public.get_due_price_history_ingestion_plan(timestamptz) to service_role;
