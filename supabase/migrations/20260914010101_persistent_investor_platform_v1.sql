create table if not exists public.investor_activity_events (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 event_type text not null,
 investment_id uuid references public.investments(id) on delete set null,
 assessment_id uuid references public.assessments(id) on delete set null,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists investor_activity_events_profile_created_idx on public.investor_activity_events(profile_id,created_at desc);
alter table public.investor_activity_events enable row level security;
drop policy if exists investor_activity_events_select_own on public.investor_activity_events;
create policy investor_activity_events_select_own on public.investor_activity_events for select to authenticated using (public.is_current_profile(profile_id));

create table if not exists public.investor_saved_comparisons (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 name text,
 investment_ids uuid[] not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint investor_saved_comparisons_size check (cardinality(investment_ids) between 2 and 6)
);
create index if not exists investor_saved_comparisons_profile_idx on public.investor_saved_comparisons(profile_id,updated_at desc);
alter table public.investor_saved_comparisons enable row level security;
drop policy if exists investor_saved_comparisons_own on public.investor_saved_comparisons;
create policy investor_saved_comparisons_own on public.investor_saved_comparisons for all to authenticated using (public.is_current_profile(profile_id)) with check (public.is_current_profile(profile_id));

create table if not exists public.investor_match_snapshots (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 model_version text not null,
 snapshot jsonb not null,
 created_at timestamptz not null default now()
);
create index if not exists investor_match_snapshots_profile_created_idx on public.investor_match_snapshots(profile_id,created_at desc);
alter table public.investor_match_snapshots enable row level security;
drop policy if exists investor_match_snapshots_select_own on public.investor_match_snapshots;
create policy investor_match_snapshots_select_own on public.investor_match_snapshots for select to authenticated using (public.is_current_profile(profile_id));

create or replace function public.capture_current_match_snapshot(p_assessment_id uuid)
returns uuid language plpgsql security definer set search_path=public,auth,extensions as $$
declare v_profile uuid; v_id uuid; v_snapshot jsonb;
begin
 select profile_id into v_profile from public.assessments where id=p_assessment_id;
 if v_profile is null then raise exception 'assessment_profile_required'; end if;
 if auth.uid() is not null and not public.is_current_profile(v_profile) then raise exception 'not_owner'; end if;
 select public.get_investment_recommendations(p_assessment_id,10) into v_snapshot;
 insert into public.investor_match_snapshots(profile_id,assessment_id,model_version,snapshot)
 values(v_profile,p_assessment_id,'suitability-v2.3',coalesce(v_snapshot,'{}'::jsonb)) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.capture_current_match_snapshot(uuid) from public,anon,authenticated;
grant execute on function public.capture_current_match_snapshot(uuid) to service_role;

create or replace view public.v_investor_home as
select p.id profile_id,p.user_id,ip.id investor_profile_id,ip.latest_assessment_id,
 d.archetype,d.risk_tolerance,d.risk_capacity,d.fingerprint_code,d.decision_style,d.pressure_style,
 (select count(*) from public.watchlist_items wi join public.watchlists w on w.id=wi.watchlist_id where w.profile_id=p.id) watchlist_count,
 (select count(*) from public.investor_saved_comparisons c where c.profile_id=p.id) saved_comparison_count,
 (select max(created_at) from public.investor_activity_events e where e.profile_id=p.id) last_activity_at
from public.profiles p
left join public.investor_profiles ip on ip.profile_id=p.id
left join public.v_current_investor_dna d on d.investor_profile_id=ip.id
where p.user_id=auth.uid();
grant select on public.v_investor_home to authenticated;

create or replace function public.get_investor_home()
returns jsonb language plpgsql security definer set search_path=public,auth,extensions as $$
declare v_profile public.profiles; v_home jsonb; v_matches jsonb; v_watch jsonb; v_recent jsonb; v_compare jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_profile from public.profiles where user_id=auth.uid() limit 1;
 if v_profile.id is null then return jsonb_build_object('has_profile',false); end if;
 select to_jsonb(h) into v_home from public.v_investor_home h where h.profile_id=v_profile.id;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_recent from (select id,event_type,investment_id,assessment_id,metadata,created_at from public.investor_activity_events where profile_id=v_profile.id order by created_at desc limit 10) x;
 select coalesce(jsonb_agg(to_jsonb(c) order by c.updated_at desc),'[]'::jsonb) into v_compare from (select id,name,investment_ids,created_at,updated_at from public.investor_saved_comparisons where profile_id=v_profile.id order by updated_at desc limit 5) c;
 if (v_home->>'latest_assessment_id') is not null then select public.get_investment_recommendations((v_home->>'latest_assessment_id')::uuid,5) into v_matches; end if;
 select public.get_watchlist(v_profile.id) into v_watch;
 return jsonb_build_object('has_profile',true,'home',coalesce(v_home,'{}'::jsonb),'top_matches',coalesce(v_matches,'{}'::jsonb),'watchlist',coalesce(v_watch,'[]'::jsonb),'recent_activity',v_recent,'saved_comparisons',v_compare);
end $$;
revoke all on function public.get_investor_home() from public,anon;
grant execute on function public.get_investor_home() to authenticated;
