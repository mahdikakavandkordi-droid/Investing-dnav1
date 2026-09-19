-- Extend the service-only pilot feedback summary with explicit Match-safety
-- comprehension signals introduced for product-pilot readiness.
-- Existing view column order is preserved; new columns are appended.

create or replace view public.v_pilot_feedback_summary
with (security_invoker=true)
as
select
  count(*) as response_count,
  round(avg(ease_score),2) as avg_ease_score,
  round(avg(trust_score),2) as avg_trust_score,
  round(avg(usefulness_score),2) as avg_usefulness_score,
  round(100.0*avg(case when understood_match then 1 else 0 end),1) as understood_match_pct,
  round(100.0*avg(case when would_return then 1 else 0 end),1) as would_return_pct,
  min(created_at) as first_response_at,
  max(updated_at) as last_response_at,
  count(*) filter(where interpreted_match_as_buy_recommendation is true) as match_as_buy_count,
  round(100.0*avg(case
    when interpreted_match_as_buy_recommendation is null then null
    when interpreted_match_as_buy_recommendation then 1 else 0 end),1) as match_as_buy_pct,
  count(*) filter(where interpreted_match_score_as_return_forecast is true) as score_as_return_count,
  round(100.0*avg(case
    when interpreted_match_score_as_return_forecast is null then null
    when interpreted_match_score_as_return_forecast then 1 else 0 end),1) as score_as_return_pct
from public.pilot_feedback;

revoke all on public.v_pilot_feedback_summary from public,anon,authenticated;
grant select on public.v_pilot_feedback_summary to service_role;
