-- Keep profile ownership checks RLS-aware.
-- The helper remains callable by authenticated policies, but now runs with
-- the caller's privileges and can read only the ownership columns it needs.

alter function public.is_current_profile(uuid) security invoker;

revoke execute on function public.is_current_profile(uuid) from public, anon;
grant execute on function public.is_current_profile(uuid) to authenticated;

grant select(id,user_id) on public.profiles to authenticated;
