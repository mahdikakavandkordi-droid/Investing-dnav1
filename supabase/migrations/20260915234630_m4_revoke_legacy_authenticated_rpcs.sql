-- M4 cleanup: these legacy browser RPCs are no longer used by the current product flow.
-- Keep the function bodies for historical/internal reproducibility, but remove direct browser execution.
revoke execute on function public.app_save_investment_context(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.app_save_investment_context(uuid,jsonb) to service_role;

revoke execute on function public.get_investor_home() from public,anon,authenticated;
grant execute on function public.get_investor_home() to service_role;
