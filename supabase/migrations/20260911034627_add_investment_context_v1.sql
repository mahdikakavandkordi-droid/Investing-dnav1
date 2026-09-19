create table if not exists public.investment_context (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  goal text not null check (goal in ('growth','retirement','house_purchase','education','income','wealth_preservation','other')),
  time_horizon text not null check (time_horizon in ('under_2','2_5','5_10','10_plus')),
  liquidity_need text not null check (liquidity_need in ('high','medium','low')),
  required_return text not null check (required_return in ('preserve','moderate','growth','aggressive')),
  loss_consequence text not null check (loss_consequence in ('severe','meaningful','manageable','low_impact')),
  experience text not null check (experience in ('beginner','some','experienced','advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assessment_id)
);
create index if not exists investment_context_assessment_idx on public.investment_context(assessment_id);
revoke all on public.investment_context from anon, authenticated;
grant all on public.investment_context to service_role;