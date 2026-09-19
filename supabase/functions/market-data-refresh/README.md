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

Implemented network adapters:

- `massive` — U.S. stocks/ETFs only, using `MASSIVE_API_KEY`.
- `yahoo_finance_unofficial` — temporary zero-cost TSX ETF research feed using the Yahoo Finance chart endpoint and `.TO` symbols. No API key is stored.

The Yahoo route is intentionally low priority (`90`). It can fill a new trading date, but it must not overwrite a verified issuer/internal row for the same instrument/date. It is a pre-funding bridge, not a launch-grade licensed market-data contract.

The existing `internal_verified` source is intentionally **not** treated as an external network provider.

The function uses custom server authentication. The Edge gateway JWT check is disabled for this function because Supabase Cron invokes it with a random Vault-held `x-market-worker-token`. The function accepts either that verified token or the Supabase service-role bearer token; browser requests with neither are rejected.


## Scheduler

The primary schedule is owned by Supabase Cron, not GitHub Actions. A private random worker token is generated in Postgres, hashed in the service-only auth table, stored encrypted in Supabase Vault and attached by `pg_net` to the Edge Function call. The current cron expression is `30 1 * * 2-6`.
