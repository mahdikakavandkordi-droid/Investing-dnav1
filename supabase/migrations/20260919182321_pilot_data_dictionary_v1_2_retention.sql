-- Promote the pilot data dictionary to v1.2 and explicitly govern the
-- product-analytics and returning-workspace fields added during Maturity Sprint 2.

insert into public.pilot_data_dictionary(
  version,field_key,source_table,classification,allowed_for_validation,retention_note
)
select
  'v1.2',d.field_key,d.source_table,d.classification,d.allowed_for_validation,d.retention_note
from public.pilot_data_dictionary d
where d.version='v1.1'
on conflict(version,field_key) do nothing;

insert into public.pilot_data_dictionary(
  version,field_key,source_table,classification,allowed_for_validation,retention_note
)
values
  ('v1.2','analytics_browser_session_id','pilot_product_events','operational',false,'Random session-scoped pseudonymous identifier used only for product-flow aggregation.'),
  ('v1.2','analytics_visitor_id','pilot_product_events','operational',false,'Random browser-profile identifier used for aggregate return/funnel analysis; not an ownership credential.'),
  ('v1.2','analytics_user_id','pilot_product_events','operational',false,'Optional account linkage for product operations; exclude from psychometric validation exports.'),
  ('v1.2','analytics_profile_id','pilot_product_events','operational',false,'Optional internal profile linkage for product operations; exclude from psychometric validation exports.'),
  ('v1.2','analytics_event_name','pilot_product_events','operational',false,'Allowlisted product event name used for funnel and retention evidence.'),
  ('v1.2','analytics_route','pilot_product_events','operational',false,'Product route only; do not store arbitrary URLs or query-string secrets.'),
  ('v1.2','analytics_investment_id','pilot_product_events','operational',false,'Internal investment identifier when relevant to a product event.'),
  ('v1.2','analytics_event_metadata','pilot_product_events','operational',false,'Allowlisted non-PII product-state metadata only.'),
  ('v1.2','workspace_last_seen_at','investor_workspace_state','operational',false,'Account continuity marker used to compare the next signed-in workspace visit.'),
  ('v1.2','workspace_last_seen_price_date','investor_workspace_state','operational',false,'High-level market-date continuity marker; not an investment-performance conclusion.'),
  ('v1.2','workspace_watchlist_count','investor_workspace_state','operational',false,'Count-only snapshot for return-loop continuity.'),
  ('v1.2','workspace_match_input_fingerprint','investor_workspace_state','operational',false,'Opaque Match-input fingerprint used only to detect meaningful input changes.'),
  ('v1.2','workspace_assessment_id','investor_workspace_state','operational',false,'Internal assessment linkage for continuity; exclude from psychometric validation exports.'),
  ('v1.2','workspace_item_last_seen_price_date','investor_workspace_item_state','operational',false,'Per-saved-investment price-date baseline for factual since-last-visit updates.')
on conflict(version,field_key) do update
set source_table=excluded.source_table,
    classification=excluded.classification,
    allowed_for_validation=excluded.allowed_for_validation,
    retention_note=excluded.retention_note;
