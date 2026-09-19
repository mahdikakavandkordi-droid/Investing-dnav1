create table if not exists public.investor_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  latest_assessment_id uuid references public.assessments(id) on delete set null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

create index if not exists idx_investor_profiles_latest_assessment on public.investor_profiles(latest_assessment_id);

create table if not exists public.investor_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  investor_profile_id uuid not null references public.investor_profiles(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  model_version text not null,
  archetype text,
  risk_tolerance numeric,
  risk_capacity numeric,
  fingerprint_code text,
  decision_style text,
  pressure_style text,
  behavioral_profile jsonb not null default '{}'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  watchouts jsonb not null default '[]'::jsonb,
  narrative jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(investor_profile_id, assessment_id, model_version)
);

create index if not exists idx_investor_profile_snapshots_profile_created on public.investor_profile_snapshots(investor_profile_id, created_at desc);

create or replace view public.v_investor_dashboard as
select
  ip.id as investor_profile_id,
  ip.profile_id,
  ip.display_name,
  ip.latest_assessment_id,
  s.id as snapshot_id,
  s.model_version,
  s.archetype,
  s.risk_tolerance,
  s.risk_capacity,
  s.fingerprint_code,
  s.decision_style,
  s.pressure_style,
  s.behavioral_profile,
  s.strengths,
  s.watchouts,
  s.narrative,
  s.created_at as assessment_date
from public.investor_profiles ip
left join public.investor_profile_snapshots s on s.id = (
  select s2.id from public.investor_profile_snapshots s2
  where s2.investor_profile_id = ip.id
  order by s2.created_at desc
  limit 1
);

alter view public.v_investor_dashboard set (security_invoker = true);

create or replace function public.sync_investor_profile(p_profile_id uuid, p_assessment_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_snapshot_id uuid;
begin
  select id into v_profile_id from public.profiles where id = p_profile_id;
  if v_profile_id is null then raise exception 'Profile not found'; end if;

  insert into public.investor_profiles(profile_id, latest_assessment_id)
  values (p_profile_id, p_assessment_id)
  on conflict (profile_id) do update set latest_assessment_id = excluded.latest_assessment_id, updated_at = now();

  insert into public.investor_profile_snapshots(
    investor_profile_id, assessment_id, model_version, archetype, risk_tolerance, risk_capacity,
    fingerprint_code, decision_style, pressure_style, behavioral_profile, strengths, watchouts, narrative
  )
  select ip.id, r.assessment_id, r.model_version, r.archetype, r.risk_tolerance, r.risk_capacity,
         fp.fingerprint_code, fp.decision_style, fp.pressure_style, fp.trait_scores, fp.strengths, fp.watchouts,
         coalesce(n.narrative, r.narrative)
  from public.assessments a
  join public.results r on r.assessment_id = a.id
  left join public.fingerprint_profiles fp on fp.assessment_id = a.id and fp.model_version = r.model_version
  left join public.narratives n on n.assessment_id = a.id
  join public.investor_profiles ip on ip.profile_id = p_profile_id
  where a.id = p_assessment_id
  returning id into v_snapshot_id;

  return jsonb_build_object('investor_profile_id', v_profile_id, 'snapshot_id', v_snapshot_id);
end;
$$;

revoke all on table public.investor_profiles from anon, authenticated;
revoke all on table public.investor_profile_snapshots from anon, authenticated;
revoke all on public.v_investor_dashboard from anon, authenticated;
revoke all on function public.sync_investor_profile(uuid, uuid) from public, anon, authenticated;
