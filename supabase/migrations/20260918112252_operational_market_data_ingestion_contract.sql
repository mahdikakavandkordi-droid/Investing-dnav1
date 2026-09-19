-- Operational market-data ingestion contract.
-- Provider fetching stays outside the database; canonical writes are
-- idempotent, source-priority aware, auditable, and service-only.

update public.market_data_refresh_runs
set completed_at=coalesce(completed_at,now()),
    status='failed',
    error_count=greatest(error_count,1),
    notes=concat_ws(' | ',nullif(notes,''),'Automatically closed as stale before operational ingestion launch')
where status='running'
  and started_at < now()-interval '2 hours';

alter table public.market_data_refresh_runs
  add constraint market_data_refresh_runs_status_check
  check (status in ('running','completed','failed','partial'));

alter table public.market_data_ingestion_log
  add constraint market_data_ingestion_log_status_check
  check (status in ('completed','failed','partial','skipped'));

create unique index if not exists market_data_refresh_one_running_per_source_idx
  on public.market_data_refresh_runs(source_id)
  where status='running' and source_id is not null;

create or replace function public.prepare_price_history_refresh(
  p_source_key text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_source uuid;
  v_run uuid;
begin
  select s.id into v_source
  from public.market_data_sources s
  where s.source_key=p_source_key
    and s.is_active
    and s.supports_history;

  if v_source is null then
    raise exception 'Unknown, inactive, or non-history market data source: %',p_source_key;
  end if;

  update public.market_data_refresh_runs
  set completed_at=now(),
      status='failed',
      error_count=greatest(error_count,1),
      notes=concat_ws(' | ',nullif(notes,''),'Automatically closed after exceeding the 2-hour running window')
  where source_id=v_source
    and status='running'
    and started_at < now()-interval '2 hours';

  begin
    insert into public.market_data_refresh_runs(source_id,status,notes)
    values(v_source,'running',p_note)
    returning id into v_run;
  exception when unique_violation then
    raise exception 'refresh_already_running_for_source:%',p_source_key;
  end;

  return v_run;
end;
$$;

create or replace function public.complete_price_history_refresh(
  p_run_id uuid,
  p_status text,
  p_seen integer default 0,
  p_inserted integer default 0,
  p_updated integer default 0,
  p_errors integer default 0,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_status not in ('completed','failed','partial') then
    raise exception 'invalid_refresh_status:%',p_status;
  end if;

  update public.market_data_refresh_runs
  set completed_at=now(),
      status=p_status,
      records_seen=greatest(0,p_seen),
      records_inserted=greatest(0,p_inserted),
      records_updated=greatest(0,p_updated),
      error_count=greatest(0,p_errors),
      notes=coalesce(p_note,notes)
  where id=p_run_id
    and status='running';

  if not found then
    if exists (
      select 1 from public.market_data_refresh_runs
      where id=p_run_id and status=p_status
    ) then
      return;
    end if;
    raise exception 'Refresh run not found or already terminal';
  end if;
end;
$$;

create or replace function public.ingest_price_history_batch(
  p_source_key text,
  p_rows jsonb,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_source_id uuid;
  v_source_priority integer;
  v_run_id uuid;
  v_row jsonb;
  v_investment_id uuid;
  v_investment_currency text;
  v_symbol text;
  v_date date;
  v_open numeric;
  v_high numeric;
  v_low numeric;
  v_close numeric;
  v_nav numeric;
  v_volume numeric;
  v_currency text;
  v_existing record;
  v_seen integer:=0;
  v_inserted integer:=0;
  v_updated integer:=0;
  v_skipped integer:=0;
  v_errors integer:=0;
  v_status text;
  v_error text;
begin
  if p_source_key is null or length(trim(p_source_key))<2 then
    raise exception 'source_key_required';
  end if;

  if jsonb_typeof(p_rows)<>'array' then
    raise exception 'rows_must_be_json_array';
  end if;

  if jsonb_array_length(p_rows)=0 then
    raise exception 'rows_required';
  end if;

  if jsonb_array_length(p_rows)>5000 then
    raise exception 'batch_too_large';
  end if;

  select s.id,s.priority into v_source_id,v_source_priority
  from public.market_data_sources s
  where s.source_key=p_source_key
    and s.is_active
    and s.supports_history;

  if v_source_id is null then
    raise exception 'Unknown, inactive, or non-history market data source: %',p_source_key;
  end if;

  v_run_id:=public.prepare_price_history_refresh(p_source_key,p_note);

  for v_row in select value from jsonb_array_elements(p_rows)
  loop
    v_seen:=v_seen+1;
    v_investment_id:=null;
    v_investment_currency:=null;
    v_symbol:=null;
    v_date:=null;
    v_open:=null;
    v_high:=null;
    v_low:=null;
    v_close:=null;
    v_nav:=null;
    v_volume:=null;
    v_currency:=null;
    v_error:=null;

    begin
      v_symbol:=upper(trim(coalesce(v_row->>'symbol','')));
      if v_symbol='' then raise exception 'symbol_required'; end if;

      v_date:=nullif(v_row->>'price_date','')::date;
      if v_date is null then raise exception 'price_date_required'; end if;
      if v_date>current_date+1 then raise exception 'future_price_date'; end if;

      v_close:=nullif(v_row->>'close','')::numeric;
      v_open:=nullif(v_row->>'open','')::numeric;
      v_high:=nullif(v_row->>'high','')::numeric;
      v_low:=nullif(v_row->>'low','')::numeric;
      v_nav:=nullif(v_row->>'nav','')::numeric;
      v_volume:=nullif(v_row->>'volume','')::numeric;

      if v_close is null or v_close<=0 then raise exception 'positive_close_required'; end if;
      if v_open is not null and v_open<=0 then raise exception 'invalid_open'; end if;
      if v_high is not null and v_high<=0 then raise exception 'invalid_high'; end if;
      if v_low is not null and v_low<=0 then raise exception 'invalid_low'; end if;
      if v_nav is not null and v_nav<=0 then raise exception 'invalid_nav'; end if;
      if v_volume is not null and v_volume<0 then raise exception 'invalid_volume'; end if;
      if v_high is not null and v_low is not null and v_high<v_low then raise exception 'high_below_low'; end if;
      if v_high is not null and v_close>v_high then raise exception 'close_above_high'; end if;
      if v_low is not null and v_close<v_low then raise exception 'close_below_low'; end if;

      select i.id,i.currency into v_investment_id,v_investment_currency
      from public.investments i
      where upper(i.symbol)=v_symbol and i.is_active
      limit 1;
      if v_investment_id is null then raise exception 'investment_not_found:%',v_symbol; end if;

      v_currency:=upper(trim(coalesce(nullif(v_row->>'currency',''),v_investment_currency,'CAD')));
      if length(v_currency)<>3 then raise exception 'invalid_currency'; end if;

      select h.*,coalesce(s.priority,100000) as existing_priority
      into v_existing
      from public.investment_price_history h
      left join public.market_data_sources s on s.source_key=h.source_key
      where h.investment_id=v_investment_id
        and h.price_date=v_date
      for update of h;

      if not found then
        insert into public.investment_price_history(
          investment_id,price_date,open_price,high_price,low_price,close_price,nav,volume,currency,
          source_key,ingestion_run_id,ingested_at
        ) values(
          v_investment_id,v_date,v_open,v_high,v_low,v_close,v_nav,v_volume,v_currency,
          p_source_key,v_run_id,now()
        );
        v_inserted:=v_inserted+1;

        insert into public.market_data_ingestion_log(
          refresh_run_id,investment_id,source_id,data_type,period_start,period_end,
          records_seen,records_inserted,records_updated,status
        ) values(
          v_run_id,v_investment_id,v_source_id,'price_history',v_date,v_date,
          1,1,0,'completed'
        );
      elsif v_existing.source_key is null or v_source_priority<=v_existing.existing_priority then
        update public.investment_price_history h
        set open_price=coalesce(v_open,h.open_price),
            high_price=coalesce(v_high,h.high_price),
            low_price=coalesce(v_low,h.low_price),
            close_price=v_close,
            nav=coalesce(v_nav,h.nav),
            volume=coalesce(v_volume,h.volume),
            currency=v_currency,
            source_key=p_source_key,
            ingestion_run_id=v_run_id,
            ingested_at=now()
        where h.id=v_existing.id;

        v_updated:=v_updated+1;

        insert into public.market_data_ingestion_log(
          refresh_run_id,investment_id,source_id,data_type,period_start,period_end,
          records_seen,records_inserted,records_updated,status
        ) values(
          v_run_id,v_investment_id,v_source_id,'price_history',v_date,v_date,
          1,0,1,'completed'
        );
      else
        v_skipped:=v_skipped+1;

        insert into public.market_data_ingestion_log(
          refresh_run_id,investment_id,source_id,data_type,period_start,period_end,
          records_seen,records_inserted,records_updated,status,error_message
        ) values(
          v_run_id,v_investment_id,v_source_id,'price_history',v_date,v_date,
          1,0,0,'skipped',
          format('Existing source %s has higher priority than %s',v_existing.source_key,p_source_key)
        );
      end if;

    exception when others then
      v_errors:=v_errors+1;
      v_error:=left(sqlerrm,500);

      insert into public.market_data_ingestion_log(
        refresh_run_id,investment_id,source_id,data_type,period_start,period_end,
        records_seen,records_inserted,records_updated,status,error_message
      ) values(
        v_run_id,v_investment_id,v_source_id,'price_history',v_date,v_date,
        1,0,0,'failed',v_error
      );
    end;
  end loop;

  v_status:=case
    when v_errors=0 then 'completed'
    when v_inserted+v_updated>0 then 'partial'
    else 'failed'
  end;

  perform public.complete_price_history_refresh(
    v_run_id,v_status,v_seen,v_inserted,v_updated,v_errors,
    concat_ws(' | ',nullif(p_note,''),format('skipped_lower_priority=%s',v_skipped))
  );

  return jsonb_build_object(
    'status',v_status,
    'run_id',v_run_id,
    'source_key',p_source_key,
    'records_seen',v_seen,
    'records_inserted',v_inserted,
    'records_updated',v_updated,
    'records_skipped',v_skipped,
    'error_count',v_errors
  );
end;
$$;

revoke execute on function public.prepare_price_history_refresh(text,text) from public,anon,authenticated;
grant execute on function public.prepare_price_history_refresh(text,text) to service_role;

revoke execute on function public.complete_price_history_refresh(uuid,text,integer,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.complete_price_history_refresh(uuid,text,integer,integer,integer,integer,text) to service_role;

revoke execute on function public.ingest_price_history_batch(text,jsonb,text) from public,anon,authenticated;
grant execute on function public.ingest_price_history_batch(text,jsonb,text) to service_role;
