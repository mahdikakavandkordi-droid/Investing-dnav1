create or replace view public.v_validation_reliability with (security_invoker=true) as
with q as (
 select question_id, construct, section
 from public.question_bank
 where version='v1.1' and active
), s as (
 select a.assessment_id,q.question_id,q.construct,q.section,
 case when qb.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
 else (qb.scoring->>(a.answer_value->>'value'))::numeric end score
 from public.answers a join q on q.question_id=a.question_id
 join public.question_bank qb on qb.question_id=q.question_id and qb.version='v1.1' and qb.active
), repeated as (
 select construct, section, count(*) item_count from q group by construct,section having count(*) >= 2
), complete as (
 select s.assessment_id,s.construct,s.section,count(*) item_n,
 sum(s.score) total_score,
 sum(s.score*s.score) sum_sq
 from s join repeated r on r.construct=s.construct
 where s.score between 0 and 100
 group by s.assessment_id,s.construct,s.section
), agg as (
 select construct,section,count(*) n,max(item_n) k,
 sum(sum_sq - (total_score*total_score)/item_n) item_variance_sum,
 var_samp(total_score) total_variance
 from complete
 group by construct,section
)
select construct,section,n,k,
 case when n>1 and k>1 and total_variance>0 then round((k::numeric/(k-1))*(1-(item_variance_sum/total_variance)),4) end as cronbach_alpha,
 case when n>=100 then 'ELIGIBLE' when n>=30 then 'PILOT_ONLY' else 'INSUFFICIENT_DATA' end as data_status,
 case when k<2 then 'NOT_APPLICABLE' when n<100 then 'INSUFFICIENT_SAMPLE' when ((k::numeric/(k-1))*(1-(item_variance_sum/total_variance)))>=0.70 then 'PASS' when ((k::numeric/(k-1))*(1-(item_variance_sum/total_variance)))>=0.60 then 'REVIEW' else 'REVIEW' end as reliability_status
from agg;

create or replace view public.v_validation_item_total with (security_invoker=true) as
with scores as (
 select a.assessment_id,q.question_id,q.construct,q.section,
 case when q.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
 else (q.scoring->>(a.answer_value->>'value'))::numeric end score
 from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version='v1.1' and q.active
), construct_totals as (
 select assessment_id,construct,sum(score) total_score,count(*) n
 from scores where score between 0 and 100 group by assessment_id,construct
), pair as (
 select s.question_id,s.construct,s.assessment_id,s.score,ct.total_score-s.score as rest_score
 from scores s join construct_totals ct using(assessment_id,construct)
 where s.score between 0 and 100 and ct.n>=2
), stats as (
 select question_id,construct,count(*) n,
 avg(score) item_mean,avg(rest_score) rest_mean,
 sum((score-avg_score)*(rest_score-rest_avg)) numerator,
 sqrt(sum((score-avg_score)^2)*sum((rest_score-rest_avg)^2)) denominator
 from (
  select p.*,avg(score) over(partition by question_id) avg_score,avg(rest_score) over(partition by question_id) rest_avg
  from pair p
 ) z group by question_id,construct
)
select question_id,construct,n,round(item_mean,2) item_mean,round(rest_mean,2) rest_mean,
 case when denominator>0 then round((numerator/denominator)::numeric,4) end as corrected_item_total_correlation,
 case when n>=100 then 'ELIGIBLE' when n>=30 then 'PILOT_ONLY' else 'INSUFFICIENT_DATA' end as data_status,
 case when n<100 then 'INSUFFICIENT_SAMPLE' when denominator=0 then 'REVIEW' when (numerator/denominator)>=0.30 then 'PASS' when (numerator/denominator)>=0.20 then 'REVIEW' else 'REVIEW' end as item_status
from stats;

create or replace view public.v_validation_summary with (security_invoker=true) as
select 'v1.1'::text questionnaire_version,
 (select count(distinct assessment_id) from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version='v1.1' and q.active) as respondent_assessments,
 (select count(*) from public.assessments a where a.questionnaire_version='v1.1' and a.status='completed') as completed_assessments,
 (select count(*) from public.v_validation_reliability where reliability_status='PASS') as reliability_passes,
 (select count(*) from public.v_validation_reliability where reliability_status='REVIEW') as reliability_reviews,
 (select count(*) from public.v_validation_item_total where item_status='PASS') as item_passes,
 (select count(*) from public.v_validation_item_total where item_status='REVIEW') as item_reviews,
 case when (select count(*) from public.assessments a where a.questionnaire_version='v1.1' and a.status='completed') >= 100 then 'READY_FOR_EMPIRICAL_VALIDATION' else 'COLLECT_PILOT_DATA' end as overall_status;

revoke all on public.v_validation_reliability from anon, authenticated;
revoke all on public.v_validation_item_total from anon, authenticated;
revoke all on public.v_validation_summary from anon, authenticated;