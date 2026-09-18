-- Durable investment context and report history are first-class platform data.
-- Context remains separate from DNA scoring, but belongs to the user's persistent assessment.

create index if not exists assessments_profile_created_idx on public.assessments(profile_id,created_at desc);
create index if not exists report_snapshots_assessment_created_idx on public.report_snapshots(assessment_id,created_at desc);
create index if not exists investment_context_assessment_idx on public.investment_context(assessment_id,updated_at desc);

-- User-facing history: immutable DNA snapshots already exist; expose a simple authenticated view.
drop view if exists public.v_investor_dna_history;
create view public.v_investor_dna_history as
select s.id as snapshot_id,s.investor_profile_id,s.assessment_id,s.model_version,s.archetype,s.risk_tolerance,s.risk_capacity,s.fingerprint_code,s.decision_style,s.pressure_style,s.behavioral_profile,s.strengths,s.watchouts,s.narrative,s.created_at
from public.investor_profile_snapshots s
join public.investor_profiles ip on ip.id=s.investor_profile_id
join public.profiles p on p.id=ip.profile_id
where p.user_id=auth.uid();

grant select on public.v_investor_dna_history to authenticated;

-- Platform home data: watchlist + current identity are retained separately so future features can evolve without changing DNA snapshots.
create index if not exists watchlists_profile_created_idx on public.watchlists(profile_id,created_at desc);
create index if not exists watchlist_items_watchlist_created_idx on public.watchlist_items(watchlist_id,created_at desc);
