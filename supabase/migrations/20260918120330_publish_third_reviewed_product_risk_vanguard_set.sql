-- Third reviewed Product Risk DNA publication set: 15 Vanguard Canada ETFs.
-- Promote only the exact evidence-ready cohort after official ETF Facts
-- spread and holdings evidence has been added and the drafts refreshed.

do $$
declare ready_count integer;
begin
  select count(*) into ready_count
  from investor_private.v_product_risk_review_queue q
  join public.investments i on i.id=q.investment_id
  join public.investment_official_risk_ratings rr on rr.investment_id=i.id
  join public.investment_official_facts f on f.investment_id=i.id
  where q.symbol=any(array['VAB','VBAL','VCB','VCN','VCNS','VDY','VEE','VEQT','VFV','VGRO','VIU','VRE','VSB','VUN','VXC'])
    and q.review_state='evidence_ready_for_review'
    and q.confidence='High'
    and q.dimension_count=4
    and q.high_conf_dimension_count=4
    and q.unknown_dimension_count=0
    and q.weak_conf_dimension_count=0
    and q.as_of_date=date '2026-09-14'
    and rr.issuer='Vanguard Investments Canada Inc.'
    and rr.source_date is not null
    and f.etf_facts_date is not null
    and exists (
      select 1
      from public.investment_observed_indicators oi
      join public.investment_data_sources ds on ds.id=oi.source_id
      where oi.investment_id=i.id
        and oi.metric_key='bid_ask_spread_pct'
        and oi.source_as_of_date=date '2026-05-31'
        and ds.source_name='Vanguard Canada ETF Facts'
        and ds.source_type='issuer_official'
    )
    and exists (
      select 1
      from public.investment_portfolio_characteristics pc
      join public.investment_data_sources ds on ds.id=pc.source_id
      where pc.investment_id=i.id
        and pc.as_of_date=date '2026-05-31'
        and pc.number_of_holdings is not null
        and ds.source_name='Vanguard Canada ETF Facts'
        and ds.source_type='issuer_official'
    );

  if ready_count<>15 then
    raise exception 'Expected 15 evidence-reviewed Vanguard Product Risk profiles, found %',ready_count;
  end if;
end $$;

with candidates as (
  select p.id
  from public.product_risk_profiles p
  join public.investments i on i.id=p.investment_id
  join investor_private.v_product_risk_review_queue q on q.profile_id=p.id
  where i.symbol=any(array['VAB','VBAL','VCB','VCN','VCNS','VDY','VEE','VEQT','VFV','VGRO','VIU','VRE','VSB','VUN','VXC'])
    and p.model_version='product-risk-dna-v1-research'
    and p.publication_status='draft'
    and q.review_state='evidence_ready_for_review'
    and p.confidence='High'
    and p.as_of_date=date '2026-09-14'
)
update public.product_risk_profiles p
set calibration_status='reviewed',
    publication_status='published',
    updated_at=now()
from candidates c
where p.id=c.id;
