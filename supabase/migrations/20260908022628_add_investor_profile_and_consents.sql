create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  age_range text,
  gender text,
  province text,
  employment_status text,
  income_range text,
  income_stability text,
  investment_experience text,
  investable_assets_range text,
  debt_range text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (profile_id, consent_type, consent_version)
);

alter table public.assessments
  add column if not exists profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists questionnaire_version text,
  add column if not exists model_version text;

alter table public.results
  add column if not exists model_version text;

alter table public.profiles enable row level security;
alter table public.consents enable row level security;

-- Keep these sensitive profile/consent tables inaccessible through the public Data API for now.
-- Access policies will be added only after the authentication/session ownership model is defined.
revoke all on public.profiles from anon, authenticated;
revoke all on public.consents from anon, authenticated;

create index if not exists idx_assessments_profile_id on public.assessments(profile_id);
create index if not exists idx_consents_profile_id on public.consents(profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();