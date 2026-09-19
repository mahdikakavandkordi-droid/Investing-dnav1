-- Second reviewed Product Risk DNA publication set: 17 iShares ETFs.
-- Promotion is guarded by the exact reviewed evidence state and official BlackRock ETF Facts lineage.

do $$
declare
  ready_count integer;
begin
  with expected(symbol,expected_as_of,expected_spread) as (
    values
    ('XAW',date '2026-09-15',0.03::numeric),
    ('XBAL',date '2026-09-10',0.04::numeric),
    ('XCB',date '2026-09-15',0.05::numeric),
    ('XEC',date '2026-09-15',0.06::numeric),
    ('XEF',date '2026-09-15',0.03::numeric),
    ('XEI',date '2026-09-15',0.04::numeric),
    ('XEQT',date '2026-09-14',0.03::numeric),
    ('XGRO',date '2026-09-14',0.04::numeric),
    ('XIC',date '2026-09-10',0.03::numeric),
    ('XIT',date '2026-09-15',0.16::numeric),
    ('XIU',date '2026-09-15',0.02::numeric),
    ('XRE',date '2026-09-15',0.08::numeric),
    ('XSB',date '2026-09-15',0.04::numeric),
    ('XSH',date '2026-09-15',0.06::numeric),
    ('XSP',date '2026-09-15',0.02::numeric),
    ('XUS',date '2026-09-15',0.03::numeric),
    ('XUU',date '2026-09-10',0.03::numeric)
  ),
  candidates as (
    select p.id
    from expected e
    join public.investments i on i.symbol=e.symbol
    join public.product_risk_profiles p
      on p.investment_id=i.id
     and p.model_version='product-risk-dna-v1-research'
    join public.investment_official_risk_ratings rr on rr.investment_id=i.id
    join public.investment_official_facts f on f.investment_id=i.id
    where p.publication_status='draft'
      and p.calibration_status in ('pre_validation','calibration')
      and p.confidence='High'
      and p.as_of_date=e.expected_as_of
      and rr.issuer='BlackRock Asset Management Canada Limited'
      and rr.source_date=date '2026-06-19'
      and f.etf_facts_date=date '2026-06-19'
      and rr.source_url=f.etf_facts_url
      and (
        select count(*)
        from public.product_risk_dimensions d
        where d.profile_id=p.id
      )=4
      and (
        select count(*)
        from public.product_risk_dimensions d
        where d.profile_id=p.id
          and d.confidence='High'
          and d.band not in ('Unknown','N/A')
      )=4
      and exists (
        select 1
        from public.investment_observed_indicators oi
        join public.investment_data_sources ds on ds.id=oi.source_id
        where oi.investment_id=i.id
          and oi.metric_key='bid_ask_spread_pct'
          and oi.metric_value_numeric=e.expected_spread
          and oi.source_as_of_date=date '2026-04-30'
          and ds.source_name='BlackRock Canada ETF Facts'
          and ds.source_url=rr.source_url
      )
  )
  select count(*) into ready_count from candidates;

  if ready_count <> 17 then
    raise exception 'Expected 17 evidence-reviewed iShares Product Risk profiles, found %', ready_count;
  end if;
end $$;

with expected(symbol,expected_as_of,expected_spread) as (
  values
  ('XAW',date '2026-09-15',0.03::numeric),
  ('XBAL',date '2026-09-10',0.04::numeric),
  ('XCB',date '2026-09-15',0.05::numeric),
  ('XEC',date '2026-09-15',0.06::numeric),
  ('XEF',date '2026-09-15',0.03::numeric),
  ('XEI',date '2026-09-15',0.04::numeric),
  ('XEQT',date '2026-09-14',0.03::numeric),
  ('XGRO',date '2026-09-14',0.04::numeric),
  ('XIC',date '2026-09-10',0.03::numeric),
  ('XIT',date '2026-09-15',0.16::numeric),
  ('XIU',date '2026-09-15',0.02::numeric),
  ('XRE',date '2026-09-15',0.08::numeric),
  ('XSB',date '2026-09-15',0.04::numeric),
  ('XSH',date '2026-09-15',0.06::numeric),
  ('XSP',date '2026-09-15',0.02::numeric),
  ('XUS',date '2026-09-15',0.03::numeric),
  ('XUU',date '2026-09-10',0.03::numeric)
),
candidates as (
  select p.id
  from expected e
  join public.investments i on i.symbol=e.symbol
  join public.product_risk_profiles p
    on p.investment_id=i.id
   and p.model_version='product-risk-dna-v1-research'
  join public.investment_official_risk_ratings rr on rr.investment_id=i.id
  join public.investment_official_facts f on f.investment_id=i.id
  where p.publication_status='draft'
    and p.calibration_status in ('pre_validation','calibration')
    and p.confidence='High'
    and p.as_of_date=e.expected_as_of
    and rr.issuer='BlackRock Asset Management Canada Limited'
    and rr.source_date=date '2026-06-19'
    and f.etf_facts_date=date '2026-06-19'
    and rr.source_url=f.etf_facts_url
    and (
      select count(*)
      from public.product_risk_dimensions d
      where d.profile_id=p.id
    )=4
    and (
      select count(*)
      from public.product_risk_dimensions d
      where d.profile_id=p.id
        and d.confidence='High'
        and d.band not in ('Unknown','N/A')
    )=4
    and exists (
      select 1
      from public.investment_observed_indicators oi
      join public.investment_data_sources ds on ds.id=oi.source_id
      where oi.investment_id=i.id
        and oi.metric_key='bid_ask_spread_pct'
        and oi.metric_value_numeric=e.expected_spread
        and oi.source_as_of_date=date '2026-04-30'
        and ds.source_name='BlackRock Canada ETF Facts'
        and ds.source_url=rr.source_url
    )
)
update public.product_risk_profiles p
set calibration_status='reviewed',
    publication_status='published',
    updated_at=now()
from candidates c
where p.id=c.id;
