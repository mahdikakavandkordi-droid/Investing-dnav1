create table if not exists public.report_delivery_events (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email_hash text not null check (email_hash ~ '^[0-9a-f]{64}$'),
  provider text not null,
  status text not null check (status in ('accepted','failed')),
  created_at timestamptz not null default now()
);

create index if not exists report_delivery_events_assessment_created_idx
  on public.report_delivery_events(assessment_id,created_at desc);

alter table public.report_delivery_events enable row level security;
revoke all on table public.report_delivery_events from public,anon,authenticated;
grant select,insert on table public.report_delivery_events to service_role;

comment on table public.report_delivery_events is
'Service-only audit/rate-limit events for PDF report delivery. Stores only a one-way email hash, never the raw email address.';
