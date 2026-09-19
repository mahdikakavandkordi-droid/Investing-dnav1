create table if not exists public.validation_runs (
 id uuid primary key default gen_random_uuid(),
 model_version text not null,
 questionnaire_version text not null,
 cohort_label text,
 sample_size integer not null default 0,
 status text not null default 'insufficient_data' check (status in ('pass','review','insufficient_data')),
 metrics jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);

create table if not exists public.validation_thresholds (
 id uuid primary key default gen_random_uuid(),
 version text not null,
 metric_key text not null,
 min_sample_size integer not null,
 target numeric,
 review_threshold numeric,
 direction text not null check (direction in ('gte','lte','abs_gte')),
 created_at timestamptz not null default now(),
 unique(version, metric_key)
);

insert into public.validation_thresholds(version,metric_key,min_sample_size,target,review_threshold,direction) values
('v1.1','reliability_alpha',100,0.70,0.60,'gte'),
('v1.1','item_total_correlation',100,0.30,0.20,'gte'),
('v1.1','construct_sample_size',30,null,null,'gte'),
('v1.1','assessment_completion_rate',30,0.90,0.75,'gte')
on conflict(version,metric_key) do update set min_sample_size=excluded.min_sample_size,target=excluded.target,review_threshold=excluded.review_threshold,direction=excluded.direction;

create or replace view public.v_validation_readiness with (security_invoker=true) as
select
 q.version as questionnaire_version,
 count(*) filter(where q.active) as active_questions,
 count(distinct q.construct) filter(where q.active) as active_constructs,
 count(*) filter(where q.active and q.section='risk_tolerance') as tolerance_questions,
 count(*) filter(where q.active and q.section='risk_capacity') as capacity_questions,
 count(*) filter(where q.active and q.section='behavioral_dna') as behavioral_questions,
 (select count(*) from public.assessments a where a.questionnaire_version=q.version) as assessments,
 (select count(distinct a.profile_id) from public.assessments a where a.questionnaire_version=q.version and a.profile_id is not null) as unique_profiles,
 case when (select count(*) from public.assessments a where a.questionnaire_version=q.version) >= 100 then 'READY_FOR_RELIABILITY' else 'PILOT_DATA_NEEDED' end as readiness
from public.question_bank q
where q.version='v1.1'
group by q.version;

create or replace view public.v_validation_item_quality with (security_invoker=true) as
with item_scores as (
 select a.assessment_id,q.question_id,q.construct,
 case when q.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
 else (q.scoring->>(a.answer_value->>'value'))::numeric end as score
 from public.answers a
 join public.question_bank q on q.question_id=a.question_id and q.version='v1.1' and q.active
), valid as (select * from item_scores where score between 0 and 100)
select question_id,construct,count(*) as n,round(avg(score),2) as mean,round(stddev_samp(score),2) as sd,
 round(min(score),2) as min_score,round(max(score),2) as max_score,
 case when count(*) >= 30 then 'ELIGIBLE' else 'INSUFFICIENT_DATA' end as data_status
from valid group by question_id,construct;

create or replace view public.v_validation_construct_quality with (security_invoker=true) as
select construct,count(*) as n,round(avg(score),2) as mean,round(stddev_samp(score),2) as sd,
case when count(*) >= 30 then 'ELIGIBLE' else 'INSUFFICIENT_DATA' end as data_status
from (
 select q.construct,case when q.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
 else (q.scoring->>(a.answer_value->>'value'))::numeric end score
 from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version='v1.1' and q.active
 where q.section in ('risk_tolerance','risk_capacity','behavioral_dna')
) x where score between 0 and 100 group by construct;

create or replace view public.v_validation_model_distribution with (security_invoker=true) as
select model_version,count(*) as assessments,count(distinct archetype) as archetypes,
round(avg(risk_tolerance),2) as mean_tolerance,round(avg(risk_capacity),2) as mean_capacity
from public.results group by model_version;

alter table public.validation_runs enable row level security;
alter table public.validation_thresholds enable row level security;
revoke all on public.validation_runs from anon, authenticated;
revoke all on public.validation_thresholds from anon, authenticated;
revoke all on public.v_validation_readiness from anon, authenticated;
revoke all on public.v_validation_item_quality from anon, authenticated;
revoke all on public.v_validation_construct_quality from anon, authenticated;
revoke all on public.v_validation_model_distribution from anon, authenticated;