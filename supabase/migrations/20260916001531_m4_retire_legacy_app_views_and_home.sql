-- Retire legacy direct-view application surfaces that have no current
-- Next.js/Edge/RPC callers. Lower-level research views that still feed the
-- current screener/intelligence read models intentionally remain live.

drop function if exists public.get_investor_home();

drop view if exists public.v_app_dna;
drop view if exists public.v_app_investment_catalog;
drop view if exists public.v_app_investment_detail;
drop view if exists public.v_app_watchlist;
drop view if exists public.v_investor_home;
drop view if exists public.v_current_user_identity;
drop view if exists public.v_current_investor_dna;
