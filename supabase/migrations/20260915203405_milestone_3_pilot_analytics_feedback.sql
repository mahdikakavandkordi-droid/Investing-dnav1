create table public.pilot_product_events (
  id uuid primary key default gen_random_uuid(),
  browser_session_id uuid not null,
  user_id uuid null references auth.users(id) on delete set null,
  profile_id uuid null references public.profiles(id) on delete set null,
  assessment_id uuid null references public.assessments(id) on delete set null,
  investment_id uuid null references public.investments(id) on delete set null,
  event_name text not null check (event_name in ('app_session_started','explore_viewed','assessment_started','assessment_completed','dna_result_viewed','secure_link_requested','signup_requested','dna_claimed','investment_context_saved','match_viewed','fund_viewed','screener_viewed','compare_viewed','watchlist_saved','watchlist_removed','watchlist_viewed','profile_viewed','feedback_submitted')),
  route text null check (route is null or char_length(route) <= 180),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object' and pg_column_size(metadata) <= 4096),
  created_at timestamptz not null default now()
);
alter table public.pilot_product_events enable row level security;
revoke all on public.pilot_product_events from public, anon, authenticated;
grant select,insert on public.pilot_product_events to service_role;
create index pilot_product_events_session_created_idx on public.pilot_product_events(browser_session_id,created_at desc);
create index pilot_product_events_event_created_idx on public.pilot_product_events(event_name,created_at desc);
create index pilot_product_events_user_created_idx on public.pilot_product_events(user_id,created_at desc) where user_id is not null;
create index pilot_product_events_assessment_idx on public.pilot_product_events(assessment_id) where assessment_id is not null;

create table public.pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  browser_session_id uuid not null unique,
  user_id uuid null references auth.users(id) on delete set null,
  assessment_id uuid null references public.assessments(id) on delete set null,
  ease_score smallint not null check (ease_score between 1 and 5),
  trust_score smallint not null check (trust_score between 1 and 5),
  usefulness_score smallint not null check (usefulness_score between 1 and 5),
  understood_match boolean not null,
  would_return boolean not null,
  open_feedback text null check (open_feedback is null or char_length(open_feedback) <= 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pilot_feedback enable row level security;
revoke all on public.pilot_feedback from public, anon, authenticated;
grant select,insert,update on public.pilot_feedback to service_role;
