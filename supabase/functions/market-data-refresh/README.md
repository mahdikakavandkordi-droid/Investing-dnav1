# market-data-refresh

Service-only Edge Function for asset-aware market-data refresh.

Current V1 scope:

- asks Postgres for the due ETF price-history plan;
- refuses browser/authenticated-user invocation and requires the service-role bearer token;
- fetches only providers that have an implemented, active network adapter;
- normalizes rows into the canonical price-history contract;
- writes through `ingest_price_history_batch`, preserving source priority and audit logs;
- refreshes investment data-quality state after successful ingestion;
- records a worker-level audit row even when the run is blocked or has no work.

Implemented network adapter:

- `massive` — U.S. stocks/ETFs only, using `MASSIVE_API_KEY`.

The current production research catalog is Canadian/TSX-heavy. Its existing `internal_verified` source is intentionally **not** treated as an external network provider. Until a licensed Canadian market-data provider is selected, configured and routed, Canadian ETF rows will be reported as `blocked / no_automated_provider` rather than silently stamped fresh.

The function is deployed with JWT verification enabled and also checks that the bearer token equals the Supabase service-role key.
