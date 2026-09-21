-- Follow-up: historical failed worker attempts are useful diagnostics, but
-- only the latest worker state should turn the current audit yellow/red.
-- The canonical function body lives in the preceding migration and already
-- applies this rule for clean installs. This migration documents the live fix.
comment on column public.market_data_quality_audit_runs.failed_worker_runs_7d is
'Historical diagnostic count only. Current audit status is driven by stale data, anomalies, or the latest worker run being failed/partial.';
