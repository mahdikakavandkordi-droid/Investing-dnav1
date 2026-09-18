create or replace function public.start_investment_refresh(p_source_name text, p_source_type text default 'manual')
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid;
begin
  if p_source_name is null or length(trim(p_source_name)) < 2 then raise exception 'source_name_required'; end if;
  insert into public.investment_data_refresh_runs(source_name,source_type,status)
  values(trim(p_source_name),coalesce(nullif(trim(p_source_type),''),'manual'),'running')
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.finish_investment_refresh(p_run_id uuid, p_status text, p_records_seen int default 0, p_records_inserted int default 0, p_records_updated int default 0, p_error_count int default 0, p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_status not in ('completed','failed','partial') then raise exception 'invalid_refresh_status'; end if;
  update public.investment_data_refresh_runs
  set completed_at=now(),status=p_status,
      records_seen=greatest(0,p_records_seen), records_inserted=greatest(0,p_records_inserted),
      records_updated=greatest(0,p_records_updated), error_count=greatest(0,p_error_count), notes=p_notes
  where id=p_run_id;
  if not found then raise exception 'refresh_run_not_found'; end if;
  return (select to_jsonb(r) from public.investment_data_refresh_runs r where r.id=p_run_id);
end;
$$;

create or replace function public.refresh_investment_foundation()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_quality jsonb; v_run uuid;
begin
  v_run := public.start_investment_refresh('Investing DNA internal foundation','system');
  begin
    v_quality := public.refresh_investment_data_quality();
    perform public.finish_investment_refresh(v_run,'completed',
      (select count(*) from public.investments),
      0,0,0,'Data quality recalculated; source ingestion is handled separately.'::text);
    return jsonb_build_object('run_id',v_run,'quality_refresh',v_quality);
  exception when others then
    perform public.finish_investment_refresh(v_run,'failed',0,0,0,1,sqlerrm);
    raise;
  end;
end;
$$;

revoke all on function public.start_investment_refresh(text,text) from public, anon, authenticated;
revoke all on function public.finish_investment_refresh(uuid,text,int,int,int,int,text) from public, anon, authenticated;
revoke all on function public.refresh_investment_foundation() from public, anon, authenticated;
grant execute on function public.start_investment_refresh(text,text) to service_role;
grant execute on function public.finish_investment_refresh(uuid,text,int,int,int,int,text) to service_role;
grant execute on function public.refresh_investment_foundation() to service_role;

create index if not exists investment_data_refresh_runs_status_idx on public.investment_data_refresh_runs(status, started_at desc);
create index if not exists investment_data_refresh_runs_source_idx on public.investment_data_refresh_runs(source_name, started_at desc);