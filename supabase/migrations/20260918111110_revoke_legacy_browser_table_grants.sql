-- Remove legacy browser grants from service/internal tables.
-- These tables are intentionally not direct Data API surfaces; browser access
-- goes through reviewed RPC/read-model boundaries instead.

revoke all privileges on table
  public.investment_data_refresh_runs,
  public.investment_intelligence_profiles,
  public.investment_match_narratives,
  public.investment_official_facts,
  public.market_data_ingestion_log,
  public.market_data_normalization_rules,
  public.market_data_provider_adapters,
  public.market_data_refresh_runs,
  public.market_data_source_routing,
  public.market_data_sources
from anon, authenticated;
