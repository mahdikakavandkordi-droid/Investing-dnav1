-- Keep profile bootstrap behind the trusted Edge/service boundary.
-- The browser no longer needs to invoke this SECURITY DEFINER helper directly.

revoke execute on function public.get_or_create_current_profile() from public, anon, authenticated;
grant execute on function public.get_or_create_current_profile() to service_role;
