-- Service-only audit trail for scheduled market-data worker executions.

create table if not exists public.market_data_worker_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_source text not null default 'manual'
    check (trigger_source in ('manual','github_schedule','supabase_cron','system')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running'
    check (status in ('running','completed','partial','failed','blocked','no_work')),
  due_count integer not null default 0 check (due_count >= 0),
  fetched_count integer not null default 0 check (fetched_count >= 0),
  ingested_count integer not null default 0 check (ingested_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.market_data_worker_runs enable row level security;

revoke all on table public.market_data_worker_runs from public,anon,authenticated;
grant select,insert,update on table public.market_data_worker_runs to service_role;

create index if not exists market_data_worker_runs_started_idx
  on public.market_data_worker_runs(started_at desc,status);

create or replace function public.start_market_data_worker_run(
  p_trigger_source text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_trigger text:=coalesce(nullif(trim(p_trigger_source),''),'manual');
begin
  if v_trigger not in ('manual','github_schedule','supabase_cron','system') then
    raise exception 'invalid_worker_trigger:%',v_trigger;
  end if;

  insert into public.market_data_worker_runs(trigger_source,status)
  values(v_trigger,'running')
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.finish_market_data_worker_run(
  p_run_id uuid,
  p_status text,
  p_due_count integer default 0,
  p_fetched_count integer default 0,
  p_ingested_count integer default 0,
  p_skipped_count integer default 0,
  p_error_count integer default 0,
  p_details jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_result jsonb;
begin
  if p_status not in ('completed','partial','failed','blocked','no_work') then
    raise exception 'invalid_worker_status:%',p_status;
  end if;

  update public.market_data_worker_runs
  set completed_at=now(),
      status=p_status,
      due_count=greatest(0,p_due_count),
      fetched_count=greatest(0,p_fetched_count),
      ingested_count=greatest(0,p_ingested_count),
      skipped_count=greatest(0,p_skipped_count),
      error_count=greatest(0,p_error_count),
      details=coalesce(p_details,'{}'::jsonb)
  where id=p_run_id and status='running'
  returning to_jsonb(public.market_data_worker_runs.*) into v_result;

  if v_result is null then
    raise exception 'worker_run_not_found_or_terminal';
  end if;

  return v_result;
end;
$$;

revoke all on function public.start_market_data_worker_run(text)
  from public,anon,authenticated;
grant execute on function public.start_market_data_worker_run(text)
  to service_role;

revoke all on function public.finish_market_data_worker_run(uuid,text,integer,integer,integer,integer,integer,jsonb)
  from public,anon,authenticated;
grant execute on function public.finish_market_data_worker_run(uuid,text,integer,integer,integer,integer,integer,jsonb)
  to service_role;
