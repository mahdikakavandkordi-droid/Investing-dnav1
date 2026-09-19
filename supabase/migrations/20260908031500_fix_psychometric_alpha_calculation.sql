create or replace view public.v_validation_reliability with (security_invoker=true) as
with base as (
 select a.assessment_id,q.question_id,q.construct,q.section,
 case when q.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
 else (q.scoring->>(a.answer_value->>'value'))::numeric end score
 from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version='v1.1' and q.active
), repeated as (
 select construct,section,count(*) item_count from public.question_bank
 where version='v1.1' and active group by construct,section having count(*)>=2
), valid as (select b.* from base b join repeated r using(construct,section) where b.score between 0 and 100),
 complete as (
 select assessment_id,construct,section,count(*) item_n,sum(score) total_score
 from valid group by assessment_id,construct,section
), eligible as (
 select * from complete c join repeated r using(construct,section) where c.item_n=r.item_count
), item_vars as (
 select construct,section,question_id,var_samp(score) item_variance
 from valid v join eligible e using(assessment_id,construct,section)
 group by construct,section,question_id
), totals as (
 select construct,section,count(*) n,max(item_n) k,var_samp(total_score) total_variance
 from eligible group by construct,section
), agg as (
 select t.construct,t.section,t.n,t.k,t.total_variance,sum(i.item_variance) item_variance_sum
 from totals t join item_vars i using(construct,section)
 group by t.construct,t.section,t.n,t.k,t.total_variance
)
select construct,section,n,k,
 case when n>1 and k>1 and total_variance>0 then round((k::numeric/(k-1))*(1-(item_variance_sum/total_variance)),4) end as cronbach_alpha,
 case when n>=100 then 'ELIGIBLE' when n>=30 then 'PILOT_ONLY' else 'INSUFFICIENT_DATA' end as data_status,
 case when n<100 then 'INSUFFICIENT_SAMPLE'
      when total_variance<=0 then 'REVIEW'
      when ((k::numeric/(k-1))*(1-(item_variance_sum/total_variance)))>=0.70 then 'PASS'
      when ((k::numeric/(k-1))*(1-(item_variance_sum/total_variance)))>=0.60 then 'REVIEW'
      else 'REVIEW' end as reliability_status
from agg;