alter table public.investment_exposure_breakdown
  add column if not exists set_coverage_pct numeric check (set_coverage_pct>=0 and set_coverage_pct<=100),
  add column if not exists is_complete_set boolean not null default false;