alter table public.investment_context enable row level security;
alter table public.investment_match_results enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.investor_profile_snapshots enable row level security;
alter table public.investment_data_quality enable row level security;

create policy investment_context_select_own on public.investment_context for select to authenticated using (exists (select 1 from public.assessments a where a.id = investment_context.assessment_id and a.profile_id = (select auth.uid())));
create policy investment_context_insert_own on public.investment_context for insert to authenticated with check (exists (select 1 from public.assessments a where a.id = investment_context.assessment_id and a.profile_id = (select auth.uid())));
create policy investment_context_update_own on public.investment_context for update to authenticated using (exists (select 1 from public.assessments a where a.id = investment_context.assessment_id and a.profile_id = (select auth.uid()))) with check (exists (select 1 from public.assessments a where a.id = investment_context.assessment_id and a.profile_id = (select auth.uid())));

create policy investment_match_results_select_own on public.investment_match_results for select to authenticated using (exists (select 1 from public.assessments a where a.id = investment_match_results.assessment_id and a.profile_id = (select auth.uid())));

create policy investor_profiles_select_own on public.investor_profiles for select to authenticated using (profile_id = (select auth.uid()));
create policy investor_profiles_insert_own on public.investor_profiles for insert to authenticated with check (profile_id = (select auth.uid()));
create policy investor_profiles_update_own on public.investor_profiles for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

create policy investor_profile_snapshots_select_own on public.investor_profile_snapshots for select to authenticated using (exists (select 1 from public.investor_profiles p where p.id = investor_profile_snapshots.investor_profile_id and p.profile_id = (select auth.uid())));

create policy investment_data_quality_no_client_access on public.investment_data_quality for select to authenticated using (false);

revoke all on public.investment_data_quality from anon, authenticated;
revoke insert, update, delete on public.investment_match_results from anon, authenticated;
revoke insert, update, delete on public.investor_profile_snapshots from anon, authenticated;
