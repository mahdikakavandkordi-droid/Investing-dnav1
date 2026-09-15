-- M4 performance hardening: add covering indexes for foreign keys reported by Advisor.
create index if not exists investment_distributions_source_id_idx on public.investment_distributions(source_id);
create index if not exists investment_exposure_breakdown_source_id_idx on public.investment_exposure_breakdown(source_id);
create index if not exists investment_holdings_source_id_idx on public.investment_holdings(source_id);
create index if not exists investment_income_history_source_id_idx on public.investment_income_history(source_id);
create index if not exists investment_match_narratives_investment_id_idx on public.investment_match_narratives(investment_id);
create index if not exists investment_match_results_investment_id_idx on public.investment_match_results(investment_id);
create index if not exists investment_observed_indicators_source_id_idx on public.investment_observed_indicators(source_id);
create index if not exists investment_performance_history_source_id_idx on public.investment_performance_history(source_id);
create index if not exists investment_portfolio_characteristics_source_id_idx on public.investment_portfolio_characteristics(source_id);
create index if not exists investment_profiles_source_id_idx on public.investment_profiles(source_id);
create index if not exists investor_activity_events_assessment_id_idx on public.investor_activity_events(assessment_id);
create index if not exists investor_activity_events_investment_id_idx on public.investor_activity_events(investment_id);
create index if not exists investor_match_snapshots_assessment_id_idx on public.investor_match_snapshots(assessment_id);
create index if not exists investor_profile_snapshots_assessment_id_idx on public.investor_profile_snapshots(assessment_id);
create index if not exists market_data_ingestion_log_refresh_run_id_idx on public.market_data_ingestion_log(refresh_run_id);
create index if not exists market_data_ingestion_log_source_id_idx on public.market_data_ingestion_log(source_id);
create index if not exists market_data_source_routing_source_id_idx on public.market_data_source_routing(source_id);
create index if not exists pilot_participants_cohort_id_idx on public.pilot_participants(cohort_id);

-- Drop only redundant manually-created indexes; preserve constraint-backed indexes.
drop index if exists public.investment_context_assessment_idx;
drop index if exists public.investment_match_results_current_uidx;
drop index if exists public.idx_investment_metrics_screening;
drop index if exists public.investment_price_history_instrument_date_uidx;
drop index if exists public.idx_investment_risk_screening;
drop index if exists public.investor_profiles_profile_uidx;
drop index if exists public.report_snapshots_assessment_idx;
drop index if exists public.watchlist_items_watchlist_idx;
drop index if exists public.watchlist_items_watchlist_investment_uidx;
