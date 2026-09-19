-- M4: harden internal/diagnostic views that are not browser product contracts.
--
-- These views previously ran with owner-bypass view semantics and granted
-- broad privileges to anon/authenticated even though they are diagnostic or
-- service/admin surfaces. Keep service/admin access, remove direct browser
-- exposure, and make the views honor invoker permissions/RLS.

alter view public.v_market_data_provider_matrix set (security_invoker = true);
alter view public.v_market_data_source_status set (security_invoker = true);
alter view public.v_price_history_source_coverage set (security_invoker = true);
alter view public.v_market_data_coverage set (security_invoker = true);
alter view public.v_investment_data_quality set (security_invoker = true);

revoke all on public.v_market_data_provider_matrix from anon, authenticated;
revoke all on public.v_market_data_source_status from anon, authenticated;
revoke all on public.v_price_history_source_coverage from anon, authenticated;
revoke all on public.v_market_data_coverage from anon, authenticated;
revoke all on public.v_investment_data_quality from anon, authenticated;
