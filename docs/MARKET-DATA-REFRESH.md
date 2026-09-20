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
Supabase Cron / manual operator call
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

The active Supabase Cron schedule is:

```text
30 1 * * 2-6
```

That runs at 01:30 UTC Tuesday through Saturday, which corresponds to approximately 20:30 EST / 21:30 EDT on the prior Monday-Friday market day. The database policy also refuses to plan a daily ETF refresh before 19:00 `America/Toronto`. The schedule is stored in `cron.job` as `investor-dna-market-data-refresh`.

A market holiday can legitimately produce no new bar. The next run can retry without fabricating a price or freshness date.

## Security boundary

- The Edge Function uses custom server authentication for Supabase Cron.
- A random worker token is generated server-side, stored encrypted in Supabase Vault and only its SHA-256 hash is retained in `market_data_worker_auth`.
- `pg_net` reads the Vault secret at execution time and sends it as `x-market-worker-token`.
- The Edge Function verifies that token through a service-only RPC before any ingestion work.
- Direct service-role invocation remains available for operators.
- Operational policy/auth/run tables and due-plan/source-resolution RPCs are service-only.
- Browser users cannot trigger ingestion or write market history directly.
- Provider secrets, if later required, stay in runtime secrets rather than the repository.

## Current provider state

The worker now has two provider paths:

- `massive` for the configured U.S. route;
- `yahoo_free` / `yahoo_finance_unofficial` as a temporary zero-cost TSX ETF bridge.

The free TSX route transforms symbols to Yahoo's Toronto convention (`VFV` → `VFV.TO`), fetches daily OHLC/volume after close and writes through the same canonical audited ingestion path.

This source is deliberately priority `90`, below verified issuer/internal sources. If a verified row already exists for the same instrument/date, the free row is skipped instead of replacing it.

Yahoo Finance is not being treated as an official issuer source or as a permanent licensed data contract. It is an MVP research bridge until funding supports a production-grade Canadian market-data vendor.

## Activation / current state

The temporary free TSX bridge is active without any paid credential or GitHub secret. Supabase Cron owns the recurring schedule.

A controlled canary on 2026-09-19 completed successfully for `VFV`: 4 rows fetched, 4 inserted, 0 errors. A full catch-up then completed for the original 40-ETF Canadian universe: 200 rows fetched, 200 inserted, 0 errors. After that run, all 40 had a latest price-history date of 2026-09-18.

On 2026-09-20 the active Canadian ETF research universe expanded from 40 to 57 instruments with a sourced 17-ETF batch from TD Asset Management, Global X and Purpose Investments. Current issuer-page metrics and official ETF Facts were seeded for that batch. Those 17 instruments enter the same scheduled `yahoo_free` TSX price-history path on the next eligible post-close run; the catalog does not fabricate a historical refresh date before that worker actually succeeds.

The source remains explicitly temporary and low priority. After funding, replace it with a licensed Canadian provider, give that provider a higher source priority, run a source-overlap canary, and only then retire `yahoo_free`.

`.github/workflows/market-data-refresh.yml` remains only as an optional manual maintenance fallback; it is not the production scheduler.
