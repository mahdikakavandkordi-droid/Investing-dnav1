
-- Surface canonical daily price history and official fee/risk fallbacks in browser research.
-- Price history already enforces provider priority at ingestion, so this view does not
-- bypass source precedence. Missing issuer MERs remain null (management fee != MER).

create or replace view public.v_investment_metric_snapshot_v2 as
select
  i.id as investment_id,
  i.symbol,
  greatest(lr.as_of_date,ph.price_date) as latest_metric_date,
  case
    when ph.price_date is not null and (lr.as_of_date is null or ph.price_date >= lr.as_of_date)
      then ph.close_price
    else lr.price
  end as price,
  case
    when ph.price_date is not null
         and (lr.as_of_date is null or ph.price_date >= lr.as_of_date)
         and ph.previous_close is not null
         and ph.previous_close > 0
      then round(((ph.close_price / ph.previous_close) - 1) * 100, 6)
    else lr.daily_change_pct
  end as daily_change_pct,
  coalesce(
    (select x.mer_pct
     from public.investment_metrics x
     where x.investment_id=i.id and x.mer_pct is not null
     order by x.as_of_date desc,x.created_at desc
     limit 1),
    (select f.mer_pct
     from public.investment_official_facts f
     where f.investment_id=i.id and f.mer_pct is not null
     order by f.etf_facts_date desc nulls last,f.verified_at desc
     limit 1)
  ) as mer_pct,
  (select x.aum
   from public.investment_metrics x
   where x.investment_id=i.id and x.aum is not null
   order by x.as_of_date desc,x.created_at desc
   limit 1) as aum,
  coalesce(
    case
      when ph.price_date is not null and (lr.as_of_date is null or ph.price_date >= lr.as_of_date)
        then ph.volume
      else null
    end,
    (select x.volume
     from public.investment_metrics x
     where x.investment_id=i.id and x.volume is not null
     order by x.as_of_date desc,x.created_at desc
     limit 1)
  ) as volume,
  (select x.yield_pct
   from public.investment_metrics x
   where x.investment_id=i.id and x.yield_pct is not null
   order by x.as_of_date desc,x.created_at desc
   limit 1) as legacy_yield_pct,
  (select x.distribution_frequency
   from public.investment_metrics x
   where x.investment_id=i.id and x.distribution_frequency is not null
   order by x.as_of_date desc,x.created_at desc
   limit 1) as legacy_distribution_frequency
from public.investments i
left join lateral (
  select x.as_of_date,x.price,x.daily_change_pct
  from public.investment_metrics x
  where x.investment_id=i.id
  order by x.as_of_date desc,x.created_at desc
  limit 1
) lr on true
left join lateral (
  select
    h.price_date,
    h.close_price,
    h.volume,
    (
      select p.close_price
      from public.investment_price_history p
      where p.investment_id=i.id
        and p.price_date < h.price_date
      order by p.price_date desc
      limit 1
    ) as previous_close
  from public.investment_price_history h
  where h.investment_id=i.id
  order by h.price_date desc,h.ingested_at desc
  limit 1
) ph on true
where i.is_active=true;

-- RBC browser metrics backed by official ETF Facts. New-fund MER stays null.
with m(symbol,as_of_date,mer,frequency) as (
  values
  ('RCAN','2026-03-25'::date,null::numeric,'Monthly'),
  ('RUSA','2026-03-25',null::numeric,'Monthly'),
  ('RCD','2026-03-18',0.43::numeric,'Monthly'),
  ('RID','2026-03-18',0.54,'Monthly'),
  ('RBNK','2026-03-18',0.32,'Monthly'),
  ('RUST','2026-03-18',0.23,'Monthly')
)
insert into public.investment_metrics(investment_id,as_of_date,mer_pct,distribution_frequency)
select i.id,m.as_of_date,m.mer,m.frequency
from m join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
  mer_pct=excluded.mer_pct,
  distribution_frequency=excluded.distribution_frequency;

with rr(symbol,rating,source_date) as (
  values
  ('RCAN','Medium','2026-03-25'::date),
  ('RUSA','Medium','2026-03-25'),
  ('RCD','Medium','2026-03-18'),
  ('RID','Medium','2026-03-18'),
  ('RBNK','Medium to High','2026-03-18'),
  ('RUST','Low','2026-03-18')
)
insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level)
select i.id,rr.source_date,rr.rating
from rr join public.investments i on i.symbol=rr.symbol and i.exchange='TSX'
on conflict (investment_id,as_of_date) do update set
  risk_level=excluded.risk_level;
