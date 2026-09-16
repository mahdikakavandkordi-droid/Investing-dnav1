-- Remove Match helper APIs that have no current callers after v6
-- canonicalization. Historical persisted match rows remain untouched for
-- audit/reproducibility.

drop function if exists public.capture_current_match_snapshot(uuid);
drop function if exists public.get_investment_recommendations(uuid, integer);
drop function if exists public.get_explainable_match(uuid, integer);
drop function if exists public.get_investment_match_intelligence(uuid);
drop function if exists public.cleanup_match_result_versions(uuid, text);

-- This table had no rows and its only writer was the retired snapshot helper.
drop table if exists public.investor_match_snapshots;
