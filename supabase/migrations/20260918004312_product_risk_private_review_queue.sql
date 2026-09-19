
create or replace view investor_private.v_product_risk_review_queue
with (security_invoker=true)
as
with dimension_quality as (
 select
   p.id as profile_id,
   p.investment_id,
   p.model_version,
   p.module_code,
   p.module_version,
   p.overall_band,
   p.confidence,
   p.as_of_date,
   p.key_flags,
   p.consumer_summary,
   count(d.id)::int as dimension_count,
   count(*) filter(where d.band is null or d.band in ('Unknown','N/A'))::int as unknown_dimension_count,
   count(*) filter(where d.confidence='High')::int as high_conf_dimension_count,
   count(*) filter(where d.confidence in ('Low','Insufficient'))::int as weak_conf_dimension_count
 from public.product_risk_profiles p
 left join public.product_risk_dimensions d on d.profile_id=p.id
 where p.model_version='product-risk-dna-v1-research'
   and p.publication_status='draft'
 group by
   p.id,p.investment_id,p.model_version,p.module_code,p.module_version,
   p.overall_band,p.confidence,p.as_of_date,p.key_flags,p.consumer_summary
)
select
 q.profile_id,
 q.investment_id,
 i.symbol,
 i.name,
 i.asset_type,
 q.model_version,
 q.module_code,
 q.module_version,
 q.overall_band,
 q.confidence,
 q.as_of_date,
 case when q.as_of_date is null then null else current_date-q.as_of_date end as days_since_as_of,
 q.dimension_count,
 q.unknown_dimension_count,
 q.high_conf_dimension_count,
 q.weak_conf_dimension_count,
 q.key_flags,
 q.consumer_summary,
 case
   when q.dimension_count<>4
     or q.overall_band is null
     or q.overall_band in ('Unknown','N/A')
     or q.confidence='Insufficient'
     or q.unknown_dimension_count>0
     then 'insufficient_evidence'
   when q.confidence='High'
     and q.high_conf_dimension_count=4
     and q.weak_conf_dimension_count=0
     and q.as_of_date is not null
     and q.as_of_date>=current_date-90
     then 'evidence_ready_for_review'
   else 'needs_evidence'
 end as review_state
from dimension_quality q
join public.investments i on i.id=q.investment_id;

revoke all on investor_private.v_product_risk_review_queue from public,anon,authenticated;
grant select on investor_private.v_product_risk_review_queue to service_role;
