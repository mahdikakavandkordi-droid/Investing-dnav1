-- Generic pilot cohort prerequisite gate.
-- This prevents a future quantitative product-pilot cohort from opening before
-- its prerequisite research cohort is completed/frozen. Existing cohorts with
-- no dependency are unaffected.

create table if not exists public.pilot_cohort_dependencies (
  cohort_id uuid primary key references public.pilot_cohorts(id) on delete cascade,
  prerequisite_cohort_id uuid not null references public.pilot_cohorts(id) on delete restrict,
  minimum_completed integer not null check (minimum_completed > 0),
  required_status text not null default 'closed'
    check (required_status in ('planned','collecting','closed','archived')),
  notes text,
  created_at timestamptz not null default now(),
  check (cohort_id <> prerequisite_cohort_id)
);

create index if not exists pilot_cohort_dependencies_prerequisite_idx
  on public.pilot_cohort_dependencies(prerequisite_cohort_id);

alter table public.pilot_cohort_dependencies enable row level security;
revoke all on table public.pilot_cohort_dependencies from public,anon,authenticated;
grant select,insert,update,delete on table public.pilot_cohort_dependencies to service_role;

create or replace function public.service_pilot_cohort_gate(p_cohort_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  with dependency as (
    select
      d.cohort_id,
      d.prerequisite_cohort_id,
      d.minimum_completed,
      d.required_status,
      c.code as prerequisite_code,
      c.status as prerequisite_status
    from public.pilot_cohort_dependencies d
    join public.pilot_cohorts c on c.id=d.prerequisite_cohort_id
    where d.cohort_id=p_cohort_id
  ),
  progress as (
    select
      d.*,
      count(distinct a.id) filter(
        where a.status='completed' and p.withdrawn_at is null
      )::integer as completed_assessments
    from dependency d
    left join public.pilot_participants p on p.cohort_id=d.prerequisite_cohort_id
    left join public.assessments a on a.pilot_participant_id=p.id
    group by d.cohort_id,d.prerequisite_cohort_id,d.minimum_completed,d.required_status,d.prerequisite_code,d.prerequisite_status
  )
  select case
    when not exists(select 1 from dependency) then
      jsonb_build_object('allowed',true,'gated',false)
    else (
      select jsonb_build_object(
        'allowed',
          prerequisite_status=required_status
          and completed_assessments>=minimum_completed,
        'gated',true,
        'prerequisite_code',prerequisite_code,
        'prerequisite_status',prerequisite_status,
        'required_status',required_status,
        'completed_assessments',completed_assessments,
        'minimum_completed',minimum_completed
      )
      from progress
    )
  end;
$$;

revoke all on function public.service_pilot_cohort_gate(uuid) from public,anon,authenticated;
grant execute on function public.service_pilot_cohort_gate(uuid) to service_role;

comment on function public.service_pilot_cohort_gate(uuid) is
'Service-only prerequisite check for gated pilot cohorts. Cohorts without a dependency remain allowed.';
