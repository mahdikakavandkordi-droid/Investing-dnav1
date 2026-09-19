-- Investor DNA — hosted Auth canary evidence
-- Privacy-minimized engineering evidence only.
--
-- Set p_since to the beginning of the controlled canary window.
-- Do not select email addresses, auth tokens, session cookies or raw metadata
-- beyond the allowlisted product-state keys below.

with params as (
  select '2026-09-19T00:00:00Z'::timestamptz as p_since
)
select
  e.event_name,
  count(*) as events,
  count(distinct e.user_id) filter(where e.user_id is not null) as authenticated_users,
  count(distinct e.browser_session_id) as browser_sessions
from public.pilot_product_events e,params p
where e.created_at>=p.p_since
  and e.event_name in (
    'secure_link_requested',
    'auth_callback_session_established',
    'account_state_restored',
    'watchlist_saved',
    'dna_claimed'
  )
group by e.event_name
order by e.event_name;

with params as (
  select '2026-09-19T00:00:00Z'::timestamptz as p_since
)
select
  e.created_at,
  e.event_name,
  e.metadata->>'mode' as mode,
  e.metadata->>'source' as source,
  case when e.event_name='account_state_restored' then e.metadata->>'has_dna' end as has_dna,
  case when e.event_name='account_state_restored' then e.metadata->>'has_context' end as has_context,
  case when e.event_name='account_state_restored' then e.metadata->>'watchlist_count' end as watchlist_count
from public.pilot_product_events e,params p
where e.created_at>=p.p_since
  and e.event_name in (
    'auth_callback_session_established',
    'account_state_restored',
    'watchlist_saved',
    'dna_claimed'
  )
order by e.created_at;

select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.investor_profiles) as investor_profiles,
  (select count(*) from public.assessments where profile_id is not null) as account_linked_assessments,
  (select count(*) from public.watchlists) as watchlists,
  (select count(*) from public.watchlist_items) as watchlist_items;

-- Interpretation:
-- Canary A needs two successful callback/restore cycles for the same controlled
-- account window, with a watchlist_saved event before the fresh sign-in and a
-- later account_state_restored event reporting watchlist_count >= 1.
--
-- Canary B needs a dna_claimed event after a callback plus a later fresh
-- callback/restore cycle whose account_state_restored metadata reports
-- has_dna=true without relying on the original guest claim ticket.
--
-- Email delivery and same-browser callback arrival are still human-observed
-- boundaries. These SQL queries do not manufacture PASS for those steps.
