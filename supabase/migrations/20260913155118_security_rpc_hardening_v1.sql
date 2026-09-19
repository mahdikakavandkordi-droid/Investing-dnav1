revoke all on function public.calculate_investment_match(uuid) from public, anon, authenticated;
grant execute on function public.calculate_investment_match(uuid) to service_role;

revoke all on function public.refresh_investment_data_quality() from public, anon, authenticated;
grant execute on function public.refresh_investment_data_quality() to service_role;

revoke all on function public.sync_investment_context_answer() from public, anon, authenticated;
grant execute on function public.sync_investment_context_answer() to service_role;

revoke all on function public.get_or_create_watchlist(uuid) from public, anon, authenticated;
revoke all on function public.add_to_watchlist(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.remove_from_watchlist(uuid,uuid) from public, anon, authenticated;
revoke all on function public.get_watchlist(uuid) from public, anon, authenticated;
grant execute on function public.get_or_create_watchlist(uuid) to service_role;
grant execute on function public.add_to_watchlist(uuid,uuid,text) to service_role;
grant execute on function public.remove_from_watchlist(uuid,uuid) to service_role;
grant execute on function public.get_watchlist(uuid) to service_role;
