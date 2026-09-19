-- M4 hardening batch 3: harden internal research helper views.
-- Transactional role-based smoke testing confirmed these helpers can use
-- SECURITY INVOKER and lose direct browser grants without breaking public RPCs.
-- v_investment_latest_income is intentionally excluded; converting it to
-- SECURITY INVOKER currently breaks anon Explore because its source metadata
-- remains deliberately non-browser-readable.

alter view public.v_investment_data_coverage_v2 set (security_invoker = true);
revoke all privileges on public.v_investment_data_coverage_v2 from anon, authenticated;

alter view public.v_investment_performance_summary set (security_invoker = true);
revoke all privileges on public.v_investment_performance_summary from anon, authenticated;

alter view public.v_investment_characteristics_summary set (security_invoker = true);
revoke all privileges on public.v_investment_characteristics_summary from anon, authenticated;

alter view public.v_investment_exposure_coverage set (security_invoker = true);
revoke all privileges on public.v_investment_exposure_coverage from anon, authenticated;
