create or replace function investor_private.save_current_investment_context(p_context jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  p public.profiles;
  ip public.investor_profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if p_context is null or jsonb_typeof(p_context) <> 'object' then
    raise exception 'context object required';
  end if;

  select * into p
  from public.profiles
  where user_id = auth.uid()
  limit 1;
  if p.id is null then
    raise exception 'profile_not_found' using errcode='42501';
  end if;

  select * into ip
  from public.investor_profiles
  where profile_id = p.id
  limit 1;
  if ip.latest_assessment_id is null then
    raise exception 'assessment_not_found';
  end if;

  if not exists(
    select 1
    from public.assessments a
    where a.id = ip.latest_assessment_id
      and a.profile_id = p.id
      and a.status = 'completed'
  ) then
    raise exception 'assessment_not_owned' using errcode='42501';
  end if;

  return public.service_save_investment_context(ip.latest_assessment_id, p_context);
end;
$$;

revoke all on function investor_private.save_current_investment_context(jsonb) from public, anon;
grant usage on schema investor_private to authenticated;
grant execute on function investor_private.save_current_investment_context(jsonb) to authenticated;

create or replace function public.app_save_current_investment_context(p_context jsonb)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select investor_private.save_current_investment_context(p_context);
$$;

revoke all on function public.app_save_current_investment_context(jsonb) from public, anon;
grant execute on function public.app_save_current_investment_context(jsonb) to authenticated;
