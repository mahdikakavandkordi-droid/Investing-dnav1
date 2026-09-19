alter table public.investment_price_history add column if not exists source_id uuid references public.investment_data_sources(id) on delete set null;
alter table public.investment_price_history add column if not exists source_key text;
alter table public.investment_price_history add column if not exists ingestion_run_id uuid references public.market_data_refresh_runs(id) on delete set null;
alter table public.investment_price_history add column if not exists ingested_at timestamptz default now();

create unique index if not exists investment_price_history_instrument_date_uidx on public.investment_price_history(investment_id,price_date);
create index if not exists investment_price_history_source_idx on public.investment_price_history(source_id,price_date desc);
create index if not exists investment_price_history_run_idx on public.investment_price_history(ingestion_run_id);

create or replace function public.prepare_price_history_refresh(p_source_key text,p_note text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_source uuid; v_run uuid;
begin
 select id into v_source from market_data_sources where source_key=p_source_key and is_active;
 if v_source is null then raise exception 'Unknown or inactive market data source: %',p_source_key; end if;
 insert into market_data_refresh_runs(source_id,status,notes) values(v_source,'running',p_note) returning id into v_run;
 return v_run;
end;$$;

create or replace function public.complete_price_history_refresh(p_run_id uuid,p_status text,p_seen integer default 0,p_inserted integer default 0,p_updated integer default 0,p_errors integer default 0,p_note text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
 update market_data_refresh_runs set completed_at=now(),status=p_status,records_seen=p_seen,records_inserted=p_inserted,records_updated=p_updated,error_count=p_errors,notes=coalesce(p_note,notes) where id=p_run_id;
 if not found then raise exception 'Refresh run not found'; end if;
end;$$;

create or replace view public.v_price_history_source_coverage as
select i.symbol,i.country_code,i.exchange,count(ph.id) as price_rows,max(ph.price_date) as latest_price_date,
       count(distinct ph.source_id) as source_count,
       string_agg(distinct coalesce(ph.source_key,'unknown'),', ' order by coalesce(ph.source_key,'unknown')) as sources,
       case when count(ph.id)=0 then 'missing' when count(ph.id)<60 then 'limited' when count(ph.id)<252 then 'developing' else 'historical' end as history_depth
from investments i left join investment_price_history ph on ph.investment_id=i.id
where i.is_active=true group by i.id;

revoke all on function public.prepare_price_history_refresh(text,text) from public,anon,authenticated;
revoke all on function public.complete_price_history_refresh(uuid,text,integer,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.prepare_price_history_refresh(text,text) to service_role;
grant execute on function public.complete_price_history_refresh(uuid,text,integer,integer,integer,integer,text) to service_role;