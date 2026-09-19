-- M4: lock internal Match helpers to service-role/internal execution.
--
-- Trigger functions and fund-universe fingerprinting are implementation details;
-- browser roles do not need direct EXECUTE capability.

revoke all on function investor_private.fund_universe_version() from public, anon, authenticated;
revoke all on function investor_private.preserve_match_nulls() from public, anon, authenticated;
revoke all on function investor_private.stamp_match_run_metadata() from public, anon, authenticated;

grant execute on function investor_private.fund_universe_version() to service_role;
grant execute on function investor_private.preserve_match_nulls() to service_role;
grant execute on function investor_private.stamp_match_run_metadata() to service_role;
