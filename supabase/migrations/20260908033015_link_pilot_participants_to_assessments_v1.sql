alter table public.assessments add column if not exists pilot_participant_id uuid references public.pilot_participants(id) on delete restrict;
create unique index if not exists ux_assessments_pilot_participant on public.assessments(pilot_participant_id) where pilot_participant_id is not null;
create index if not exists ix_assessments_pilot_participant on public.assessments(pilot_participant_id);

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
left join public.assessments a on a.pilot_participant_id=pp.id
group by pc.id,pc.code,pc.status,pc.target_n,pc.min_n_for_basic_stats,pc.min_n_for_reliability;

revoke all on public.v_pilot_quality_gate from anon,authenticated;