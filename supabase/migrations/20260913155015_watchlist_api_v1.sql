create or replace function public.get_or_create_watchlist(p_profile_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_watchlist public.watchlists;
  v_user_profile uuid;
begin
  v_user_profile := p_profile_id;
  if v_user_profile is null then
    raise exception 'profile_id_required';
  end if;

  select * into v_watchlist
  from public.watchlists
  where profile_id = v_user_profile
  order by created_at asc
  limit 1;

  if not found then
    insert into public.watchlists(profile_id, name)
    values (v_user_profile, 'My Watchlist')
    returning * into v_watchlist;
  end if;

  return jsonb_build_object('watchlist', to_jsonb(v_watchlist));
end;
$$;

create or replace function public.add_to_watchlist(p_profile_id uuid, p_investment_id uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_watchlist_id uuid;
  v_item public.watchlist_items;
begin
  if p_profile_id is null or p_investment_id is null then raise exception 'invalid_input'; end if;
  select id into v_watchlist_id from public.watchlists where profile_id=p_profile_id order by created_at asc limit 1;
  if v_watchlist_id is null then
    insert into public.watchlists(profile_id,name) values(p_profile_id,'My Watchlist') returning id into v_watchlist_id;
  end if;
  insert into public.watchlist_items(watchlist_id,investment_id,note)
  values(v_watchlist_id,p_investment_id,nullif(trim(p_note),''))
  on conflict (watchlist_id, investment_id) do update set note=excluded.note
  returning * into v_item;
  update public.watchlists set updated_at=now() where id=v_watchlist_id;
  return jsonb_build_object('item',to_jsonb(v_item),'watchlist_id',v_watchlist_id);
end;
$$;

create or replace function public.remove_from_watchlist(p_profile_id uuid, p_investment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_deleted integer;
begin
  delete from public.watchlist_items wi using public.watchlists w
  where wi.watchlist_id=w.id and w.profile_id=p_profile_id and wi.investment_id=p_investment_id;
  get diagnostics v_deleted = row_count;
  update public.watchlists set updated_at=now() where profile_id=p_profile_id;
  return jsonb_build_object('removed',v_deleted>0);
end;
$$;

create or replace function public.get_watchlist(p_profile_id uuid)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'watchlist', coalesce((select to_jsonb(w) from public.watchlists w where w.profile_id=p_profile_id order by w.created_at asc limit 1), '{}'::jsonb),
    'items', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select wi.id, wi.watchlist_id, wi.investment_id, wi.note, wi.created_at,
             i.symbol, i.name, i.asset_type, i.category,
             d.price, d.return_1y_pct, d.mer_pct, d.yield_pct,
             r.risk_level, r.volatility_1y_pct, r.max_drawdown_1y_pct,
             q.quality_score, q.overall_status
      from public.watchlist_items wi
      join public.watchlists w on w.id=wi.watchlist_id
      join public.investments i on i.id=wi.investment_id
      left join lateral (select * from public.investment_metrics m where m.investment_id=i.id order by m.as_of_date desc limit 1) d on true
      left join lateral (select * from public.investment_risk_metrics rr where rr.investment_id=i.id order by rr.as_of_date desc limit 1) r on true
      left join lateral (select * from public.investment_data_quality qq where qq.investment_id=i.id order by qq.checked_at desc limit 1) q on true
      where w.profile_id=p_profile_id
    ) x), '[]'::jsonb)
  );
$$;

revoke all on function public.get_or_create_watchlist(uuid) from public, anon, authenticated;
revoke all on function public.add_to_watchlist(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.remove_from_watchlist(uuid,uuid) from public, anon, authenticated;
revoke all on function public.get_watchlist(uuid) from public, anon, authenticated;

-- Prevent duplicate entries at the database level.
create unique index if not exists watchlist_items_watchlist_investment_uidx on public.watchlist_items(watchlist_id, investment_id);
