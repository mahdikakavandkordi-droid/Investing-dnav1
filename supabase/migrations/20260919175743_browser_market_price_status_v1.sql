-- Browser-safe latest market-price status for research surfaces.
-- Keeps source provenance and price date explicit without exposing operational tables.

create or replace function public.app_market_data_status(p_investment_ids uuid[])
returns table(
  investment_id uuid,
  latest_price numeric,
  previous_price numeric,
  daily_change_pct numeric,
  volume numeric,
  currency text,
  price_date date,
  source_key text,
  source_name text,
  ingested_at timestamptz
)
language sql
stable
security definer
set search_path=''
as $$
  with requested as (
    select unnest(coalesce(p_investment_ids,'{}'::uuid[])) as investment_id
  ),
  ranked as (
    select
      ph.investment_id,
      ph.close_price,
      ph.volume,
      ph.currency,
      ph.price_date,
      ph.source_key,
      ph.source_id,
      ph.ingested_at,
      row_number() over(
        partition by ph.investment_id
        order by ph.price_date desc, ph.ingested_at desc nulls last, ph.created_at desc
      ) as rn
    from public.investment_price_history ph
    join requested r on r.investment_id=ph.investment_id
    join public.investments i on i.id=ph.investment_id and i.is_active
  ),
  latest as (
    select * from ranked where rn=1
  ),
  previous as (
    select investment_id,close_price from ranked where rn=2
  )
  select
    l.investment_id,
    l.close_price as latest_price,
    p.close_price as previous_price,
    case
      when p.close_price is not null and p.close_price<>0
        then round(((l.close_price-p.close_price)/p.close_price)*100,3)
      else null
    end as daily_change_pct,
    l.volume,
    l.currency,
    l.price_date,
    l.source_key,
    coalesce(s.source_name,l.source_key) as source_name,
    l.ingested_at
  from latest l
  left join previous p on p.investment_id=l.investment_id
  left join public.market_data_sources s
    on s.id=l.source_id or (s.source_key=l.source_key and l.source_id is null)
  order by l.investment_id;
$$;

revoke all on function public.app_market_data_status(uuid[]) from public;
grant execute on function public.app_market_data_status(uuid[]) to anon,authenticated,service_role;

comment on function public.app_market_data_status(uuid[]) is
'Browser-safe latest market-price read model with explicit source/date provenance. Operational ingestion tables remain private.';
