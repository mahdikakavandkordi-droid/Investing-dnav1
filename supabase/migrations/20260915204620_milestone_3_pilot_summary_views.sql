create or replace view public.v_pilot_product_funnel with (security_invoker=true) as
select event_name,
       count(*)::bigint as event_count,
       count(distinct browser_session_id)::bigint as session_count,
       count(distinct visitor_id)::bigint as visitor_count,
       min(created_at) as first_seen_at,
       max(created_at) as last_seen_at
from public.pilot_product_events
group by event_name;
revoke all on public.v_pilot_product_funnel from public,anon,authenticated;
grant select on public.v_pilot_product_funnel to service_role;

create or replace view public.v_pilot_feedback_summary with (security_invoker=true) as
select count(*)::bigint as response_count,
       round(avg(ease_score)::numeric,2) as avg_ease_score,
       round(avg(trust_score)::numeric,2) as avg_trust_score,
       round(avg(usefulness_score)::numeric,2) as avg_usefulness_score,
       round(100.0*avg(case when understood_match then 1 else 0 end)::numeric,1) as understood_match_pct,
       round(100.0*avg(case when would_return then 1 else 0 end)::numeric,1) as would_return_pct,
       min(created_at) as first_response_at,
       max(updated_at) as last_response_at
from public.pilot_feedback;
revoke all on public.v_pilot_feedback_summary from public,anon,authenticated;
grant select on public.v_pilot_feedback_summary to service_role;
