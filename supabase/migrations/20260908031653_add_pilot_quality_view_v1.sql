create or replace view public.v_pilot_quality_gate with (security_invoker=true) as
select
 pc.code as cohort_code,
 pc.status as cohort_status,
 pc.target_n,
 pc.min_n_for_basic_stats,
 pc.min_n_for_reliability,
 count(distinct pp.id) filter(where pp.withdrawn_at is null) as consented_participants,
 count(distinct a.id) as assessments,
 count(distinct a.id) filter(where a.status='completed') as completed_assessments,
 case when count(distinct pp.id) filter(where pp.withdrawn_at is null) >= pc.min_n_for_reliability then 'RELIABILITY_READY'
      when count(distinct pp.id) filter(where pp.withdrawn_at is null) >= pc.min_n_for_basic_stats then 'BASIC_STATS_READY'
      else 'COLLECTING' end as gate_status
from public.pilot_cohorts pc
left join public.pilot_participants pp on pp.cohort_id=pc.id
left join public.assessments a on a.profile_id is null and false
group by pc.id,pc.code,pc.status,pc.target_n,pc.min_n_for_basic_stats,pc.min_n_for_reliability;

revoke all on public.v_pilot_quality_gate from anon,authenticated;