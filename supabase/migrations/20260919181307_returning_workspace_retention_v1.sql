-- Returning-user workspace retention state.
-- Stores only account-owned product continuity markers, never raw questionnaire answers
-- or arbitrary browsing history. Browser access is through one authenticated RPC.

create table if not exists public.investor_workspace_state (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  last_seen_price_date date,
  last_watchlist_count integer not null default 0 check (last_watchlist_count >= 0),
  last_match_run_id uuid,
  last_assessment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investor_workspace_state enable row level security;
revoke all on table public.investor_workspace_state from public,anon,authenticated;
grant select,insert,update,delete on table public.investor_workspace_state to service_role;

create or replace function investor_private.open_returning_workspace()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile_id uuid;
  v_previous public.investor_workspace_state;
  v_returning boolean := false;
  v_watchlist_count integer := 0;
  v_market_date date;
  v_updated_count integer := 0;
  v_updated_items jsonb := '[]'::jsonb;
  v_assessment_id uuid;
  v_match_run_id uuid;
  v_match_updated boolean := false;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;

  select p.id into v_profile_id
  from public.profiles p
  where p.user_id=v_uid
  limit 1;

  if v_profile_id is null then
    return jsonb_build_object(
      'has_profile',false,
      'returning',false,
      'previous_seen_at',null,
      'watchlist_count',0,
      'new_market_data_count',0,
      'updated_saved_items','[]'::jsonb,
      'match_updated',false
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_profile_id::text,17));

  select * into v_previous
  from public.investor_workspace_state
  where profile_id=v_profile_id;

  v_returning := v_previous.profile_id is not null;

  select ip.latest_assessment_id into v_assessment_id
  from public.investor_profiles ip
  where ip.profile_id=v_profile_id
  limit 1;

  if v_assessment_id is not null then
    select mr.id into v_match_run_id
    from investor_private.match_runs mr
    where mr.assessment_id=v_assessment_id
      and mr.model_version='investment-dna-match-v7'
    order by mr.created_at desc,mr.id desc
    limit 1;
  end if;

  with saved as (
    select wi.investment_id,i.symbol,i.name
    from public.watchlists w
    join public.watchlist_items wi on wi.watchlist_id=w.id
    join public.investments i on i.id=wi.investment_id and i.is_active
    where w.profile_id=v_profile_id
  ),
  ranked as (
    select
      s.investment_id,
      s.symbol,
      s.name,
      ph.price_date,
      ph.close_price,
      ph.currency,
      row_number() over(
        partition by s.investment_id
        order by ph.price_date desc,ph.ingested_at desc nulls last,ph.created_at desc
      ) as rn
    from saved s
    left join public.investment_price_history ph on ph.investment_id=s.investment_id
  ),
  current_rows as (
    select * from ranked where rn=1
  ),
  previous_rows as (
    select investment_id,close_price from ranked where rn=2
  ),
  joined as (
    select
      c.investment_id,
      c.symbol,
      c.name,
      c.price_date,
      c.close_price,
      c.currency,
      case
        when p.close_price is not null and p.close_price<>0 and c.close_price is not null
          then round(((c.close_price-p.close_price)/p.close_price)*100,3)
        else null
      end as daily_change_pct
    from current_rows c
    left join previous_rows p using(investment_id)
  )
  select
    count(*)::integer,
    max(price_date),
    case when v_returning then count(*) filter(
      where price_date is not null
        and (v_previous.last_seen_price_date is null or price_date>v_previous.last_seen_price_date)
    )::integer else 0 end,
    coalesce((
      select jsonb_agg(to_jsonb(x) order by x.price_date desc nulls last,x.symbol)
      from (
        select
          j.investment_id,
          j.symbol,
          j.name,
          j.price_date,
          j.close_price as latest_price,
          j.daily_change_pct,
          j.currency
        from joined j
        where v_returning
          and j.price_date is not null
          and (v_previous.last_seen_price_date is null or j.price_date>v_previous.last_seen_price_date)
        order by j.price_date desc nulls last,j.symbol
        limit 5
      ) x
    ),'[]'::jsonb)
  into v_watchlist_count,v_market_date,v_updated_count,v_updated_items
  from joined;

  v_match_updated := v_returning
    and v_match_run_id is not null
    and v_match_run_id is distinct from v_previous.last_match_run_id;

  insert into public.investor_workspace_state(
    profile_id,last_seen_at,last_seen_price_date,last_watchlist_count,
    last_match_run_id,last_assessment_id,updated_at
  )
  values(
    v_profile_id,now(),v_market_date,v_watchlist_count,
    v_match_run_id,v_assessment_id,now()
  )
  on conflict(profile_id) do update
  set last_seen_at=excluded.last_seen_at,
      last_seen_price_date=excluded.last_seen_price_date,
      last_watchlist_count=excluded.last_watchlist_count,
      last_match_run_id=excluded.last_match_run_id,
      last_assessment_id=excluded.last_assessment_id,
      updated_at=now();

  return jsonb_build_object(
    'has_profile',true,
    'returning',v_returning,
    'previous_seen_at',case when v_returning then v_previous.last_seen_at else null end,
    'previous_market_date',case when v_returning then v_previous.last_seen_price_date else null end,
    'current_market_date',v_market_date,
    'watchlist_count',v_watchlist_count,
    'watchlist_changed',v_returning and v_watchlist_count<>v_previous.last_watchlist_count,
    'new_market_data_count',v_updated_count,
    'updated_saved_items',v_updated_items,
    'match_updated',v_match_updated,
    'assessment_changed',v_returning and v_assessment_id is distinct from v_previous.last_assessment_id
  );
end;
$$;

create or replace function public.app_open_returning_workspace()
returns jsonb
language sql
set search_path=''
as $$
  select investor_private.open_returning_workspace();
$$;

revoke all on function public.app_open_returning_workspace() from public,anon;
grant execute on function public.app_open_returning_workspace() to authenticated,service_role;

comment on function public.app_open_returning_workspace() is
'Authenticated return-loop snapshot. Compares saved research with the prior workspace visit, then advances the account continuity marker.';
