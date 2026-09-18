-- Public catalog data and account-scoped adapters for the existing platform.
-- Existing service-only RPCs keep their ACLs. Ownership is derived from auth.uid().
create schema if not exists investor_private;
revoke all on schema investor_private from public;
grant usage on schema investor_private to anon, authenticated;

create or replace function investor_private.investment_detail(p_investment_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  -- This catalog projection is already exposed by app_search_investments.
  select to_jsonb(v) from public.v_investment_screener v where v.id=p_investment_id limit 1;
$$;
revoke all on function investor_private.investment_detail(uuid) from public;
grant execute on function investor_private.investment_detail(uuid) to anon, authenticated;
create or replace function public.app_get_investment(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select investor_private.investment_detail(p_investment_id);
$$;
revoke all on function public.app_get_investment(uuid) from public;
grant execute on function public.app_get_investment(uuid) to anon, authenticated;

create or replace function investor_private.watchlist(p_action text, p_investment_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_profile_id uuid; v_profile public.profiles;
begin
 if v_uid is null then raise exception 'authentication_required' using errcode='42501'; end if;
 if p_action is null or p_action not in ('list','add','remove') then raise exception 'invalid_action' using errcode='22023'; end if;
 if p_action<>'list' and p_investment_id is null then raise exception 'investment_required' using errcode='22023'; end if;
 if p_action='add' and not exists(select 1 from public.v_investment_screener where id=p_investment_id) then raise exception 'investment_not_found' using errcode='22023'; end if;
 -- Serialize creation and changes for one account; add remains idempotent.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_uid::text,0));
 select id into v_profile_id from public.profiles where user_id=v_uid limit 1;
 if v_profile_id is null and p_action='add' then
  select * into v_profile from public.get_or_create_current_profile(); v_profile_id := v_profile.id;
 end if;
 if v_profile_id is null then return jsonb_build_object('items','[]'::jsonb,'removed',false); end if;
 if p_action='add' then return public.add_to_watchlist(v_profile_id,p_investment_id,null); end if;
 if p_action='remove' then return public.remove_from_watchlist(v_profile_id,p_investment_id); end if;
 return public.get_watchlist(v_profile_id);
end;
$$;
revoke all on function investor_private.watchlist(text,uuid) from public;
grant execute on function investor_private.watchlist(text,uuid) to authenticated;
create or replace function public.app_watchlist(p_action text default 'list',p_investment_id uuid default null)
returns jsonb language sql security invoker set search_path = '' as $$
 select investor_private.watchlist(p_action,p_investment_id);
$$;
revoke all on function public.app_watchlist(text,uuid) from public;
grant execute on function public.app_watchlist(text,uuid) to authenticated;

create or replace function investor_private.investment_fit(p_investment_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_assessment_id uuid; v_fit jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required' using errcode='42501'; end if;
 select ip.latest_assessment_id into v_assessment_id
 from public.investor_profiles ip join public.profiles p on p.id=ip.profile_id
 where p.user_id=auth.uid() limit 1;
 if v_assessment_id is null then return jsonb_build_object('status','no_dna'); end if;
 select to_jsonb(v) into v_fit from public.v_investment_match_ranked v
 join public.investment_match_results m on m.id=v.id
 where v.assessment_id=v_assessment_id and v.investment_id=p_investment_id
 order by m.created_at desc,m.id desc limit 1;
 return jsonb_build_object('status',case when v_fit is null then 'unavailable' else 'available' end,'assessment_id',v_assessment_id,'fit',v_fit);
end;
$$;
revoke all on function investor_private.investment_fit(uuid) from public;
grant execute on function investor_private.investment_fit(uuid) to authenticated;
create or replace function public.app_investment_fit(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select investor_private.investment_fit(p_investment_id);
$$;
revoke all on function public.app_investment_fit(uuid) from public;
grant execute on function public.app_investment_fit(uuid) to authenticated;
