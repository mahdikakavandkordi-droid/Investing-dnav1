alter table public.investment_official_risk_ratings enable row level security;
revoke all on table public.investment_official_risk_ratings from public,anon,authenticated;
grant select on table public.investment_official_risk_ratings to anon,authenticated;
create policy official_risk_ratings_public_read on public.investment_official_risk_ratings for select to anon,authenticated using (true);
-- Claims must pass the guest capability check in the Edge Function before the service-only atomic claim.
revoke execute on function public.claim_pilot_assessment_to_current_profile(uuid) from public,anon,authenticated;
grant execute on function public.claim_pilot_assessment_to_current_profile(uuid) to service_role;
