begin;

-- Link application profiles to Supabase Auth users without breaking anonymous/pilot profiles.
alter table public.profiles
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists profiles_user_id_uidx
  on public.profiles(user_id)
  where user_id is not null;

-- Ownership-aware RLS for authenticated profiles.
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- One canonical profile for the signed-in user.
create or replace function public.get_or_create_current_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  select * into v_profile from public.profiles where user_id = auth.uid() limit 1;
  if v_profile.id is null then
    insert into public.profiles(user_id, created_at, updated_at)
    values (auth.uid(), now(), now())
    returning * into v_profile;
  end if;
  return v_profile;
end;
$$;

revoke all on function public.get_or_create_current_profile() from public, anon, authenticated;
grant execute on function public.get_or_create_current_profile() to authenticated;

-- Safe ownership helper used by RLS policies.
create or replace function public.is_current_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists(select 1 from public.profiles p where p.id = p_profile_id and p.user_id = auth.uid());
$$;
revoke all on function public.is_current_profile(uuid) from public, anon, authenticated;
grant execute on function public.is_current_profile(uuid) to authenticated;

-- Assessments become readable only by their owner once linked; anonymous pilot rows remain untouched.
alter table public.assessments enable row level security;
drop policy if exists assessments_select_own on public.assessments;
create policy assessments_select_own on public.assessments for select to authenticated
  using (profile_id is not null and public.is_current_profile(profile_id));

-- Investor DNA profile ownership follows the parent application profile.
alter table public.investor_profiles enable row level security;
drop policy if exists investor_profiles_select_own on public.investor_profiles;
drop policy if exists investor_profiles_insert_own on public.investor_profiles;
drop policy if exists investor_profiles_update_own on public.investor_profiles;
create policy investor_profiles_select_own on public.investor_profiles for select to authenticated using (public.is_current_profile(profile_id));
create policy investor_profiles_insert_own on public.investor_profiles for insert to authenticated with check (public.is_current_profile(profile_id));
create policy investor_profiles_update_own on public.investor_profiles for update to authenticated using (public.is_current_profile(profile_id)) with check (public.is_current_profile(profile_id));

-- Snapshot/report ownership follows assessment -> profile.
alter table public.investor_profile_snapshots enable row level security;
drop policy if exists investor_profile_snapshots_select_own on public.investor_profile_snapshots;
create policy investor_profile_snapshots_select_own on public.investor_profile_snapshots for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.profile_id is not null and public.is_current_profile(a.profile_id)));

alter table public.report_snapshots enable row level security;
drop policy if exists report_snapshots_select_own on public.report_snapshots;
create policy report_snapshots_select_own on public.report_snapshots for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.profile_id is not null and public.is_current_profile(a.profile_id)));

-- Watchlist ownership now resolves through auth.uid() -> profiles.id -> watchlists.
alter table public.watchlists enable row level security;
drop policy if exists watchlists_select_own on public.watchlists;
drop policy if exists watchlists_insert_own on public.watchlists;
drop policy if exists watchlists_update_own on public.watchlists;
drop policy if exists watchlists_delete_own on public.watchlists;
create policy watchlists_select_own on public.watchlists for select to authenticated using (public.is_current_profile(profile_id));
create policy watchlists_insert_own on public.watchlists for insert to authenticated with check (public.is_current_profile(profile_id));
create policy watchlists_update_own on public.watchlists for update to authenticated using (public.is_current_profile(profile_id)) with check (public.is_current_profile(profile_id));
create policy watchlists_delete_own on public.watchlists for delete to authenticated using (public.is_current_profile(profile_id));

alter table public.watchlist_items enable row level security;
drop policy if exists watchlist_items_select_own on public.watchlist_items;
drop policy if exists watchlist_items_insert_own on public.watchlist_items;
drop policy if exists watchlist_items_update_own on public.watchlist_items;
drop policy if exists watchlist_items_delete_own on public.watchlist_items;
create policy watchlist_items_select_own on public.watchlist_items for select to authenticated using (exists (select 1 from public.watchlists w where w.id = watchlist_id and public.is_current_profile(w.profile_id)));
create policy watchlist_items_insert_own on public.watchlist_items for insert to authenticated with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and public.is_current_profile(w.profile_id)));
create policy watchlist_items_update_own on public.watchlist_items for update to authenticated using (exists (select 1 from public.watchlists w where w.id = watchlist_id and public.is_current_profile(w.profile_id))) with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and public.is_current_profile(w.profile_id)));
create policy watchlist_items_delete_own on public.watchlist_items for delete to authenticated using (exists (select 1 from public.watchlists w where w.id = watchlist_id and public.is_current_profile(w.profile_id)));

-- Useful server-side identity view; no PII beyond application profile fields already present.
create or replace view public.v_current_user_identity as
select p.id as profile_id, p.user_id, p.first_name, p.age_range, p.province,
       p.employment_status, p.income_range, p.investment_experience,
       ip.id as investor_profile_id, ip.latest_assessment_id, ip.display_name,
       ip.created_at as investor_profile_created_at, ip.updated_at as investor_profile_updated_at
from public.profiles p
left join public.investor_profiles ip on ip.profile_id = p.id
where p.user_id = auth.uid();

grant select on public.v_current_user_identity to authenticated;

commit;