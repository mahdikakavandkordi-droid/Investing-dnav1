# Daily market-data refresh

Status: Canadian ETF daily research feed active on TSX and Cboe Canada  
Last reviewed: 2026-09-20

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

ETF `price_history` and alias-backed Mutual Fund NAV/price history are automated in V1. GIC posted-rate / term rows remain source-dated research data until an issuer-specific refresh adapter is validated.

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
- `yahoo_free` / `yahoo_finance_unofficial` as a temporary zero-cost Canadian ETF bridge.

The free Canadian route resolves exchange-specific Yahoo symbols:
- TSX: `VFV` -> `VFV.TO`
- Cboe Canada: `FEQT` -> `FEQT.NE`

It fetches daily OHLC/volume after close and writes through the same canonical audited ingestion path. Yahoo Cboe bars can contain tiny floating-point differences between close and the reported high/low envelope, so the worker normalizes the OHLC envelope before canonical validation instead of dropping an otherwise valid bar.

This source is deliberately priority `90`, below verified issuer/internal sources. If a verified row already exists for the same instrument/date, the free row is skipped instead of replacing it.

Yahoo Finance is not being treated as an official issuer source or as a permanent licensed data contract. It is an MVP research bridge until funding supports a production-grade Canadian market-data vendor.

## Activation / current state

The temporary Canadian ETF bridge is active without any paid credential or GitHub secret. Supabase Cron owns the recurring schedule.

The live `market-data-refresh` Edge Function is ACTIVE and supports both TSX and Cboe Canada instruments.

Verified catch-up history:

- original 40 Canadian ETFs: catch-up completed through 2026-09-18;
- FEQT Cboe canary after OHLC normalization: **9 fetched / 9 ingested / 0 errors**;
- remaining seven Fidelity Cboe ETFs: **63 / 63 / 0 errors**;
- latest Mackenzie + RBC TSX batch: **54 / 54 / 0 errors** across 14 instruments.

The active Canadian ETF research universe is now **79 ETFs** across nine issuers. Newly added instruments enter the same audited daily worker according to their exchange route.

The source remains explicitly temporary and low priority. After funding, replace it with a licensed Canadian provider, give that provider a higher source priority, run a source-overlap canary, and only then retire `yahoo_free`.

`.github/workflows/market-data-refresh.yml` remains only as an optional manual maintenance fallback; it is not the production scheduler.


## Weekly quality watchdog

A separate database watchdog runs every Saturday at **03:15 UTC**, after the Friday post-close worker.

It does not replace the daily refresh worker. It checks whether the data we already ingested still looks operationally trustworthy:

- active ETF market bars are not older than four calendar days;
- alias-backed Mutual Fund NAV rows are not older than four calendar days;
- snapshot-only Mutual Funds are counted separately and never presented as live;
- GIC term/rate source dates are not older than ten calendar days;
- the latest ETF / Mutual Fund one-day move is flagged for review if its absolute move exceeds 25%;
- the most recent worker execution is not failed or partial;
- failed worker attempts from the prior seven days are retained as diagnostics without keeping the current status in warning after a healthy recovery.

Results are written to `market_data_quality_audit_runs`; the latest result is available service-side through `v_latest_market_data_quality_audit`.

This is an integrity / freshness monitor, not a substitute for external source reconciliation. A future production data contract should also run periodic source-overlap checks against a second licensed provider or issuer feed.
