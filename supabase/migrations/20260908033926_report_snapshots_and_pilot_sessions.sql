create table if not exists public.report_snapshots (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  report_version text not null default 'report-v1.0',
  model_version text not null,
  generated_at timestamptz not null default now(),
  report jsonb not null,
  created_at timestamptz not null default now(),
  unique (assessment_id, report_version, model_version)
);
create index if not exists report_snapshots_assessment_idx on public.report_snapshots(assessment_id, created_at desc);
alter table public.report_snapshots enable row level security;

alter table public.pilot_participants add column if not exists session_token_hash text;
create unique index if not exists pilot_participants_session_hash_idx on public.pilot_participants(session_token_hash) where session_token_hash is not null;

create or replace function public.hash_pilot_session_token(p_token text)
returns text
language sql
immutable
security invoker
set search_path = public, extensions
as $$
  select encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex');
$$;

create or replace function public.create_report_snapshot(p_assessment_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.results%rowtype;
  f public.fingerprint_profiles%rowtype;
  n public.narratives%rowtype;
  p jsonb;
  rid uuid;
begin
  select * into r from public.results where assessment_id=p_assessment_id order by created_at desc limit 1;
  if not found then raise exception 'Result not found for assessment %', p_assessment_id; end if;
  select * into f from public.fingerprint_profiles where assessment_id=p_assessment_id order by created_at desc limit 1;
  if not found then raise exception 'Fingerprint not found for assessment %', p_assessment_id; end if;
  select * into n from public.narratives where assessment_id=p_assessment_id order by created_at desc limit 1;
  if not found then raise exception 'Narrative not found for assessment %', p_assessment_id; end if;
  p := jsonb_build_object('assessment_id',p_assessment_id,'report_version','report-v1.0','model_version',r.model_version,'generated_at',now(),'archetype',r.archetype,'risk_tolerance',r.risk_tolerance,'risk_capacity',r.risk_capacity,'behavioral_profile',r.behavioral_profile,'fingerprint_code',f.fingerprint_code,'decision_style',f.decision_style,'pressure_style',f.pressure_style,'strengths',f.strengths,'watchouts',f.watchouts,'narrative',n.narrative);
  insert into public.report_snapshots(assessment_id,report_version,model_version,report) values(p_assessment_id,'report-v1.0',r.model_version,p) on conflict (assessment_id,report_version,model_version) do update set report=excluded.report,generated_at=now() returning id into rid;
  return jsonb_build_object('id',rid,'report',p);
end;
$$;
revoke all on function public.create_report_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.hash_pilot_session_token(text) from public, anon, authenticated;
grant execute on function public.hash_pilot_session_token(text) to service_role;
grant execute on function public.create_report_snapshot(uuid) to service_role;