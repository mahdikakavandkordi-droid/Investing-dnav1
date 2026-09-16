-- M4: remove unnecessary browser execute grants from account/private helpers.
--
-- Note: fund_universe_version still inherited EXECUTE through PUBLIC after this
-- migration. The follow-up 20260916101611 migration closes that inherited grant.

revoke execute on function public.app_watchlist(text,uuid) from anon;
revoke execute on function investor_private.fund_universe_version() from anon, authenticated;
