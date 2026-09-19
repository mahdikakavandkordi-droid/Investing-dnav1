# Daily market-data refresh

Status: infrastructure implemented; Canadian provider activation pending  
Last reviewed: 2026-09-19

## Purpose

Investor DNA does not need intraday market polling for V1. The refresh layer is designed around **one post-close run per market day**, with slower data domains kept on slower cadences.

The worker never changes an old real source date just to make a card look fresh. Missing data remains missing.

## Refresh matrix

| Asset / data | Desired cadence | Automated now? | Notes |
| --- | --- | --- | --- |
| ETF price / OHLC / volume | Daily after close | Yes at policy/worker level | Requires an active network provider for the ETF's market |
| ETF holdings | Weekly | No | Issuer-specific automation comes later |
| ETF issuer metadata / MER / mandate | Monthly | No | Slow-moving data should not be fetched daily |
| GIC posted rate / terms | Weekly | No | Provider/issuer-specific adapter required |
| T-Bill market terms | Daily | No | Prefer official Government of Canada / Bank of Canada source |
| Bond market yield / price | Daily | No | Licensed fixed-income source required |
| Commercial Paper | Daily where issue-level data exists | No | Current catalog item is research/reference only |
| ABCP reference metadata | Manual | No | Do not synthesize live values |

Only ETF `price_history` has `automation_enabled=true` in V1. Other policy rows document the intended cadence without pretending an adapter exists.

## Runtime

```text
GitHub schedule / manual dispatch
        |
        v
market-data-refresh Edge Function
        |
        v
get_due_price_history_ingestion_plan()
        |
        +---- no automated provider -> blocked + audited
        |
        v
provider adapter fetch
        |
        v
canonical normalized rows
        |
        v
ingest_price_history_batch()
        |
        +---- source priority / validation / per-row audit
        |
        v
investment_price_history
        |
        v
refresh_investment_data_quality()
```

Worker executions are audited in `market_data_worker_runs`. Provider ingestion is additionally audited through the existing `market_data_refresh_runs` and `market_data_ingestion_log` contract.

## Market-close timing

The repository schedule is:

```text
30 1 * * 2-6
```

That runs at 01:30 UTC Tuesday through Saturday, which corresponds to approximately 20:30 EST / 21:30 EDT on the prior Monday-Friday market day. The database policy also refuses to plan a daily ETF refresh before 19:00 `America/Toronto`.

A market holiday can legitimately produce no new bar. The next run can retry without fabricating a price or freshness date.

## Security boundary

- Edge Function deployment has JWT verification enabled.
- Function body additionally requires the bearer token to equal `SUPABASE_SERVICE_ROLE_KEY`.
- Operational policy/run tables and due-plan/source-resolution RPCs are service-only.
- Browser users cannot trigger ingestion or write market history directly.
- API keys stay in runtime secrets, never in the repository.

## Current provider state

The existing `massive` adapter is implemented by the worker and is suitable for its configured U.S. route. Massive's stock feed is U.S.-market coverage.

The current Investor DNA ETF catalog is Canadian/TSX. Its existing `internal_verified` source is historical research data, not a network fetcher, and is intentionally excluded from automated source resolution.

Therefore the current 40 Canadian ETFs correctly resolve to `no_automated_provider` rather than being falsely marked fresh.

## Activation checklist

Before the schedule is turned on:

1. select a Canadian/TSX provider with acceptable API and display/licensing terms;
2. add its source, routing and provider adapter;
3. add the provider implementation to `market-data-refresh`;
4. store its API credential as a Supabase Edge Function secret;
5. add GitHub repository secret `SUPABASE_SERVICE_ROLE_KEY`;
6. manually dispatch the workflow with `dry_run=true`;
7. run one controlled write refresh and verify latest dates, source keys and audit logs;
8. set repository variable `MARKET_DATA_REFRESH_ENABLED=true`.

The scheduled workflow is deliberately gated by that variable so merging the code does not start provider traffic before the data source is approved.
