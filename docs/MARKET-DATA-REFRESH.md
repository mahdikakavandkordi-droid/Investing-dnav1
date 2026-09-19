# Daily market-data refresh

Status: infrastructure implemented; Canadian provider activation pending  
Last reviewed: 2026-09-19

## Purpose

Investor DNA does not need intraday market polling for V1. The refresh layer is designed around **one post-close run per market day**, with slower data domains kept on slower cadences.

The worker never changes an old real source date just to make a card look fresh. Missing data remains missing.

## Refresh matrix

| Asset / data | Desired cadence | Automated now? | Notes |
| --- | --- | --- | --- |
| ETF price / OHLC / volume | Daily after close | Yes | Current TSX bridge uses a temporary Yahoo Finance research feed; replace with a licensed provider after funding |
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

The worker now has two provider paths:

- `massive` for the configured U.S. route;
- `yahoo_free` / `yahoo_finance_unofficial` as a temporary zero-cost TSX ETF bridge.

The free TSX route transforms symbols to Yahoo's Toronto convention (`VFV` → `VFV.TO`), fetches daily OHLC/volume after close and writes through the same canonical audited ingestion path.

This source is deliberately priority `90`, below verified issuer/internal sources. If a verified row already exists for the same instrument/date, the free row is skipped instead of replacing it.

Yahoo Finance is not being treated as an official issuer source or as a permanent licensed data contract. It is an MVP research bridge until funding supports a production-grade Canadian market-data vendor.

## Activation checklist

For the temporary free TSX bridge:

1. add GitHub repository secret `SUPABASE_SERVICE_ROLE_KEY`;
2. manually dispatch the workflow with `dry_run=true`;
3. run one controlled write refresh and verify latest dates, source keys and audit logs;
4. set repository variable `MARKET_DATA_REFRESH_ENABLED=true`.

No paid market-data API credential is required for the temporary Yahoo route.

After funding, replace this bridge with a licensed Canadian provider, give that provider a higher source priority, run a source-overlap canary, and only then retire `yahoo_free`.

The scheduled workflow remains gated so merging code alone does not start traffic.
