-- M4 hardening batch 2: remove browser access from unused/reference views.
-- These views had no live browser/product callers or dependent views at audit time.
-- Keep service-role access for diagnostics/maintenance.

alter view public.v_investment_latest_holdings set (security_invoker = true);
revoke all privileges on public.v_investment_latest_holdings from anon, authenticated;

alter view public.v_investment_latest_observed_indicators set (security_invoker = true);
revoke all privileges on public.v_investment_latest_observed_indicators from anon, authenticated;

alter view public.v_investment_latest_performance set (security_invoker = true);
revoke all privileges on public.v_investment_latest_performance from anon, authenticated;

alter view public.v_investment_latest_prices set (security_invoker = true);
revoke all privileges on public.v_investment_latest_prices from anon, authenticated;

alter view public.v_investor_dna_history set (security_invoker = true);
revoke all privileges on public.v_investor_dna_history from anon, authenticated;
