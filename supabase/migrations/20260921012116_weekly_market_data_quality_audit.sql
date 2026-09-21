create table if not exists public.market_data_quality_audit_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check(status in ('running','healthy','warning','failed')),
  etf_total integer not null default 0,
  etf_stale integer not null default 0,
  mutual_fund_total integer not null default 0,
  mutual_fund_live integer not null default 0,
  mutual_fund_snapshot_only integer not null default 0,
  mutual_fund_stale integer not null default 0,
  gic_total integer not null default 0,
  gic_stale integer not null default 0,
  anomaly_count integer not null default 0,
  failed_worker_runs_7d integer not null default 0,
  details jsonb not null default '{}'::jsonb
);

alter table public.market_data_quality_audit_runs enable row level security;
revoke all on public.market_data_quality_audit_runs from public,anon,authenticated;
grant all on public.market_data_quality_audit_runs to service_role;

create or replace function public.run_market_data_quality_audit(p_now timestamptz default now())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid:=gen_random_uuid();
  v_today date:=(timezone('America/Toronto',p_now))::date;
  v_etf_total int:=0;
  v_etf_stale int:=0;
  v_mf_total int:=0;
  v_mf_live int:=0;
  v_mf_snapshot int:=0;
  v_mf_stale int:=0;
  v_gic_total int:=0;
  v_gic_stale int:=0;
  v_anomaly int:=0;
  v_failed int:=0;
  v_latest_worker_bad boolean:=false;
  v_details jsonb;
  v_status text;
begin
  insert into public.market_data_quality_audit_runs(id,started_at) values(v_id,p_now);

  select count(*) into v_etf_total from public.investments where is_active and asset_type='ETF';
  select count(*) into v_mf_total from public.investments where is_active and asset_type='MUTUAL_FUND';
  select count(*) into v_gic_total from public.investments where is_active and asset_type='GIC';

  with latest as (
    select i.id,max(h.price_date) latest_date
    from public.investments i
    left join public.investment_price_history h on h.investment_id=i.id
    where i.is_active and i.asset_type='ETF'
    group by i.id
  )
  select count(*) into v_etf_stale from latest
  where latest_date is null or latest_date<v_today-4;

  with live_mf as (
    select distinct i.id
    from public.investments i
    join public.market_data_symbol_aliases a on a.investment_id=i.id and a.is_active
    join public.market_data_sources s on s.id=a.source_id and s.source_key='yahoo_free'
    where i.is_active and i.asset_type='MUTUAL_FUND'
  )
  select count(*) into v_mf_live from live_mf;

  v_mf_snapshot:=greatest(v_mf_total-v_mf_live,0);

  with live_mf as (
    select distinct i.id
    from public.investments i
    join public.market_data_symbol_aliases a on a.investment_id=i.id and a.is_active
    join public.market_data_sources s on s.id=a.source_id and s.source_key='yahoo_free'
    where i.is_active and i.asset_type='MUTUAL_FUND'
  ),
  latest as (
    select l.id,max(h.price_date) latest_date
    from live_mf l
    left join public.investment_price_history h on h.investment_id=l.id
    group by l.id
  )
  select count(*) into v_mf_stale from latest
  where latest_date is null or latest_date<v_today-4;

  with latest_gic as (
    select i.id,max(o.as_of_date) latest_source_date
    from public.investments i
    left join public.investment_deposit_term_options o on o.investment_id=i.id
    where i.is_active and i.asset_type='GIC'
    group by i.id
  )
  select count(*) into v_gic_stale from latest_gic
  where latest_source_date is null or latest_source_date<v_today-10;

  with ranked as (
    select h.investment_id,h.close_price,
           lag(h.close_price) over(partition by h.investment_id order by h.price_date) previous_close,
           row_number() over(partition by h.investment_id order by h.price_date desc) rn
    from public.investment_price_history h
    join public.investments i on i.id=h.investment_id
    where i.is_active and i.asset_type in ('ETF','MUTUAL_FUND')
  )
  select count(*) into v_anomaly
  from ranked
  where rn=1 and previous_close is not null and previous_close<>0
    and abs((close_price-previous_close)/previous_close*100)>25;

  select count(*) into v_failed
  from public.market_data_worker_runs
  where started_at>=p_now-interval '7 days' and status in ('failed','partial');

  select coalesce(status in ('failed','partial'),false)
  into v_latest_worker_bad
  from public.market_data_worker_runs
  order by started_at desc
  limit 1;
  v_latest_worker_bad:=coalesce(v_latest_worker_bad,false);

  with stale_etf as (
    select i.symbol,max(h.price_date) latest_date
    from public.investments i
    left join public.investment_price_history h on h.investment_id=i.id
    where i.is_active and i.asset_type='ETF'
    group by i.id,i.symbol
    having max(h.price_date) is null or max(h.price_date)<v_today-4
  ),
  stale_mf as (
    select i.symbol,max(h.price_date) latest_date
    from public.investments i
    join public.market_data_symbol_aliases a on a.investment_id=i.id and a.is_active
    join public.market_data_sources s on s.id=a.source_id and s.source_key='yahoo_free'
    left join public.investment_price_history h on h.investment_id=i.id
    where i.is_active and i.asset_type='MUTUAL_FUND'
    group by i.id,i.symbol
    having max(h.price_date) is null or max(h.price_date)<v_today-4
  ),
  stale_gic as (
    select i.symbol,max(o.as_of_date) latest_source_date
    from public.investments i
    left join public.investment_deposit_term_options o on o.investment_id=i.id
    where i.is_active and i.asset_type='GIC'
    group by i.id,i.symbol
    having max(o.as_of_date) is null or max(o.as_of_date)<v_today-10
  ),
  anomalous as (
    select symbol,asset_type,price_date,round(move_pct,2) move_pct
    from (
      select i.symbol,i.asset_type,h.price_date,
             abs((h.close_price-lag(h.close_price) over(partition by h.investment_id order by h.price_date))
               /nullif(lag(h.close_price) over(partition by h.investment_id order by h.price_date),0)*100) move_pct,
             row_number() over(partition by h.investment_id order by h.price_date desc) rn
      from public.investment_price_history h
      join public.investments i on i.id=h.investment_id
      where i.is_active and i.asset_type in ('ETF','MUTUAL_FUND')
    ) q
    where rn=1 and move_pct>25
  )
  select jsonb_build_object(
    'checked_at',p_now,
    'toronto_date',v_today,
    'latest_worker_bad',v_latest_worker_bad,
    'historical_failed_worker_runs_7d',v_failed,
    'freshness_rules',jsonb_build_object(
      'ETF','latest market bar within 4 calendar days',
      'MUTUAL_FUND_live','alias-backed NAV within 4 calendar days',
      'MUTUAL_FUND_snapshot','tracked separately; no fake live freshness',
      'GIC','issuer term source reviewed within 10 calendar days',
      'price_anomaly','absolute one-day move over 25% is review-required, not automatically wrong'
    ),
    'stale_etfs',coalesce((select jsonb_agg(to_jsonb(s)) from stale_etf s),'[]'::jsonb),
    'stale_live_mutual_funds',coalesce((select jsonb_agg(to_jsonb(s)) from stale_mf s),'[]'::jsonb),
    'stale_gics',coalesce((select jsonb_agg(to_jsonb(s)) from stale_gic s),'[]'::jsonb),
    'price_anomalies',coalesce((select jsonb_agg(to_jsonb(s)) from anomalous s),'[]'::jsonb)
  ) into v_details;

  v_status:=case
    when v_etf_stale>0 or v_mf_stale>0 or v_gic_stale>0 or v_anomaly>0 or v_latest_worker_bad then 'warning'
    else 'healthy'
  end;

  update public.market_data_quality_audit_runs
  set completed_at=now(),status=v_status,
      etf_total=v_etf_total,etf_stale=v_etf_stale,
      mutual_fund_total=v_mf_total,mutual_fund_live=v_mf_live,
      mutual_fund_snapshot_only=v_mf_snapshot,mutual_fund_stale=v_mf_stale,
      gic_total=v_gic_total,gic_stale=v_gic_stale,
      anomaly_count=v_anomaly,failed_worker_runs_7d=v_failed,
      details=v_details
  where id=v_id;

  return v_id;
exception when others then
  update public.market_data_quality_audit_runs
  set completed_at=now(),status='failed',details=jsonb_build_object('error',sqlerrm)
  where id=v_id;
  raise;
end;
$$;

revoke all on function public.run_market_data_quality_audit(timestamptz) from public,anon,authenticated;
grant execute on function public.run_market_data_quality_audit(timestamptz) to service_role;

create or replace view public.v_latest_market_data_quality_audit with (security_invoker=true) as
select * from public.market_data_quality_audit_runs order by started_at desc limit 1;
revoke all on public.v_latest_market_data_quality_audit from public,anon,authenticated;
grant select on public.v_latest_market_data_quality_audit to service_role;

select cron.unschedule(jobid) from cron.job where jobname='investor-dna-market-data-quality-audit';
select cron.schedule(
  'investor-dna-market-data-quality-audit',
  '15 3 * * 6',
  $cron$
    select public.run_market_data_quality_audit(now());
  $cron$
);
