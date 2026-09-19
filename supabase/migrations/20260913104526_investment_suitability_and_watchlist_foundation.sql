create table if not exists public.investment_suitability_profiles (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  model_version text not null,
  risk_band text not null,
  normalized_risk_score numeric,
  growth_score numeric,
  income_score numeric,
  liquidity_score numeric,
  diversification_score numeric,
  minimum_horizon_months integer,
  rationale text,
  created_at timestamptz not null default now(),
  unique(investment_id, model_version)
);

create index if not exists investment_suitability_investment_idx on public.investment_suitability_profiles(investment_id, created_at desc);

alter table public.investment_suitability_profiles enable row level security;
create policy "public can read suitability profiles for active investments" on public.investment_suitability_profiles for select to anon, authenticated using (exists (select 1 from public.investments i where i.id=investment_suitability_profiles.investment_id and i.is_active=true));

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'My Watchlist',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id,name)
);

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  investment_id uuid not null references public.investments(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique(watchlist_id,investment_id)
);

create index if not exists watchlist_items_watchlist_idx on public.watchlist_items(watchlist_id,created_at desc);

alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
create policy "users can read own watchlists" on public.watchlists for select to authenticated using (profile_id=auth.uid());
create policy "users can create own watchlists" on public.watchlists for insert to authenticated with check (profile_id=auth.uid());
create policy "users can update own watchlists" on public.watchlists for update to authenticated using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy "users can delete own watchlists" on public.watchlists for delete to authenticated using (profile_id=auth.uid());
create policy "users can read own watchlist items" on public.watchlist_items for select to authenticated using (exists(select 1 from public.watchlists w where w.id=watchlist_items.watchlist_id and w.profile_id=auth.uid()));
create policy "users can create own watchlist items" on public.watchlist_items for insert to authenticated with check (exists(select 1 from public.watchlists w where w.id=watchlist_items.watchlist_id and w.profile_id=auth.uid()));
create policy "users can update own watchlist items" on public.watchlist_items for update to authenticated using (exists(select 1 from public.watchlists w where w.id=watchlist_items.watchlist_id and w.profile_id=auth.uid())) with check (exists(select 1 from public.watchlists w where w.id=watchlist_items.watchlist_id and w.profile_id=auth.uid()));
create policy "users can delete own watchlist items" on public.watchlist_items for delete to authenticated using (exists(select 1 from public.watchlists w where w.id=watchlist_items.watchlist_id and w.profile_id=auth.uid()));

create or replace function public.calculate_investment_match(p_assessment_id uuid, p_investment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  r numeric;
  c numeric;
  rs numeric;
  tolerance_fit numeric;
  capacity_fit numeric;
  match_score numeric;
  band text;
  model text;
begin
  select risk_tolerance,risk_capacity into r,c from public.results where assessment_id=p_assessment_id order by created_at desc limit 1;
  if r is null or c is null then raise exception 'No completed DNA result for assessment'; end if;
  select coalesce(sp.normalized_risk_score,case sp.risk_band when 'Low' then 25 when 'Medium' then 50 when 'Medium-High' then 65 when 'High' then 80 else null end), sp.risk_band, sp.model_version
    into rs,band,model
  from public.investment_suitability_profiles sp
  where sp.investment_id=p_investment_id order by sp.created_at desc limit 1;
  if rs is null then raise exception 'No suitability profile for investment'; end if;
  tolerance_fit := greatest(0,100-abs(r-rs));
  capacity_fit := case when rs <= c then greatest(0,100-0.5*abs(c-rs)) else greatest(0,100-2*(rs-c)) end;
  match_score := round((tolerance_fit*0.55 + capacity_fit*0.45)::numeric,1);
  return jsonb_build_object('assessment_id',p_assessment_id,'investment_id',p_investment_id,'match_score',match_score,'risk_tolerance_fit',round(tolerance_fit,1),'risk_capacity_fit',round(capacity_fit,1),'investment_risk_band',band,'model_version',model,'disclaimer','Compatibility signal only; not investment advice or a recommendation.');
end;
$$;

revoke all on function public.calculate_investment_match(uuid,uuid) from public,anon,authenticated;
