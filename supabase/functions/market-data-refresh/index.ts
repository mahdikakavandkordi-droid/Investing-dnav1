import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type SourceSelection = {
  source_key?: string | null;
  source_name?: string | null;
  provider_type?: string | null;
  reason?: string | null;
};

type DueItem = {
  investment_id: string;
  symbol: string;
  asset_type: string;
  country_code: string | null;
  exchange: string | null;
  currency: string | null;
  latest_price_date: string | null;
  target_price_date: string;
  cadence: string;
  max_staleness_hours: number | null;
  selected_source: SourceSelection;
};

type CanonicalPriceRow = {
  symbol: string;
  price_date: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close: number;
  nav?: number | null;
  volume?: number | null;
  currency?: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MASSIVE_API_KEY = Deno.env.get("MASSIVE_API_KEY") ?? "";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function addUtcDays(date: string, days: number) {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function laterDate(a: string, b: string) {
  return a > b ? a : b;
}

async function fetchWithRetry(url: string, attempts = 3) {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" },
      });
      if (response.ok) return response;
      const body = await response.text();
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`provider_http_${response.status}:${body.slice(0, 200)}`);
      }
      lastError = new Error(`provider_http_${response.status}:${body.slice(0, 200)}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt * attempt));
    }
  }
  throw lastError ?? new Error("provider_fetch_failed");
}

async function fetchMassiveDaily(item: DueItem): Promise<CanonicalPriceRow[]> {
  if (!MASSIVE_API_KEY) throw new Error("massive_api_key_missing");
  if (item.country_code !== "US") throw new Error("massive_route_is_us_only");

  const fallbackFrom = addUtcDays(item.target_price_date, -14);
  const from = item.latest_price_date
    ? laterDate(addUtcDays(item.latest_price_date, 1), fallbackFrom)
    : fallbackFrom;

  const url = new URL(
    `https://api.massive.com/v2/aggs/ticker/${encodeURIComponent(item.symbol)}/range/1/day/${from}/${item.target_price_date}`,
  );
  url.searchParams.set("adjusted", "true");
  url.searchParams.set("sort", "asc");
  url.searchParams.set("limit", "120");
  url.searchParams.set("apiKey", MASSIVE_API_KEY);

  const response = await fetchWithRetry(url.toString());
  const payload = await response.json();
  if (payload?.status !== "OK" && !Array.isArray(payload?.results)) {
    throw new Error(`massive_bad_response:${String(payload?.status ?? "unknown")}`);
  }

  const rows = (Array.isArray(payload?.results) ? payload.results : [])
    .map((bar: Record<string, unknown>) => {
      const timestamp = Number(bar.t);
      const close = Number(bar.c);
      if (!Number.isFinite(timestamp) || !Number.isFinite(close) || close <= 0) return null;
      const priceDate = new Date(timestamp).toISOString().slice(0, 10);
      if (item.latest_price_date && priceDate <= item.latest_price_date) return null;
      if (priceDate > item.target_price_date) return null;
      return {
        symbol: item.symbol,
        price_date: priceDate,
        open: Number.isFinite(Number(bar.o)) ? Number(bar.o) : null,
        high: Number.isFinite(Number(bar.h)) ? Number(bar.h) : null,
        low: Number.isFinite(Number(bar.l)) ? Number(bar.l) : null,
        close,
        nav: null,
        volume: Number.isFinite(Number(bar.v)) ? Number(bar.v) : null,
        currency: item.currency ?? "USD",
      } satisfies CanonicalPriceRow;
    })
    .filter((row: CanonicalPriceRow | null): row is CanonicalPriceRow => row !== null);

  return rows;
}

async function fetchProvider(item: DueItem): Promise<CanonicalPriceRow[]> {
  const provider = item.selected_source?.provider_type;
  if (provider === "massive") return await fetchMassiveDaily(item);
  throw new Error(`provider_not_implemented:${provider ?? "none"}`);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { error: "server_configuration_missing" });

  const authorization = req.headers.get("authorization") ?? "";
  if (authorization !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json(403, { error: "service_role_required" });
  }

  let body: { dry_run?: boolean; symbols?: string[]; trigger_source?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const dryRun = body.dry_run === true;
  const requestedSymbols = Array.isArray(body.symbols)
    ? new Set(body.symbols.map((value) => String(value).trim().toUpperCase()).filter(Boolean))
    : null;
  const triggerSource = body.trigger_source === "github_schedule" ? "github_schedule" : "manual";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let workerRunId: string | null = null;
  if (!dryRun) {
    const { data, error } = await supabase.rpc("start_market_data_worker_run", {
      p_trigger_source: triggerSource,
    });
    if (error) return json(500, { error: "worker_run_start_failed", detail: error.message });
    workerRunId = String(data);
  }

  try {
    const { data: rawPlan, error: planError } = await supabase.rpc("get_due_price_history_ingestion_plan");
    if (planError) throw new Error(`due_plan_failed:${planError.message}`);

    let plan = (Array.isArray(rawPlan) ? rawPlan : []) as DueItem[];
    if (requestedSymbols) plan = plan.filter((item) => requestedSymbols.has(item.symbol.toUpperCase()));

    if (dryRun) {
      return json(200, {
        status: "dry_run",
        due_count: plan.length,
        due: plan.map((item) => ({
          symbol: item.symbol,
          latest_price_date: item.latest_price_date,
          target_price_date: item.target_price_date,
          source_key: item.selected_source?.source_key ?? null,
          provider_type: item.selected_source?.provider_type ?? null,
          source_reason: item.selected_source?.reason ?? null,
        })),
      });
    }

    if (plan.length === 0) {
      await supabase.rpc("finish_market_data_worker_run", {
        p_run_id: workerRunId,
        p_status: "no_work",
        p_details: { message: "No price-history rows are due after the configured market-close threshold." },
      });
      return json(200, { status: "no_work", run_id: workerRunId });
    }

    const fetchedBySource = new Map<string, CanonicalPriceRow[]>();
    const fetchErrors: Array<{ symbol: string; reason: string }> = [];
    const skipped: Array<{ symbol: string; reason: string }> = [];
    let fetchedCount = 0;

    for (const item of plan) {
      const sourceKey = item.selected_source?.source_key;
      const providerType = item.selected_source?.provider_type;

      if (!sourceKey || !providerType) {
        skipped.push({ symbol: item.symbol, reason: item.selected_source?.reason ?? "no_automated_provider" });
        continue;
      }

      try {
        const rows = await fetchProvider(item);
        fetchedCount += rows.length;
        if (rows.length > 0) {
          const current = fetchedBySource.get(sourceKey) ?? [];
          current.push(...rows);
          fetchedBySource.set(sourceKey, current);
        }
      } catch (error) {
        fetchErrors.push({
          symbol: item.symbol,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    let ingestedCount = 0;
    let ingestionErrors = 0;
    const ingestionResults: unknown[] = [];

    for (const [sourceKey, rows] of fetchedBySource.entries()) {
      if (rows.length === 0) continue;
      const { data, error } = await supabase.rpc("ingest_price_history_batch", {
        p_source_key: sourceKey,
        p_rows: rows,
        p_note: `daily market-data worker; worker_run_id=${workerRunId}`,
      });
      if (error) {
        ingestionErrors += 1;
        ingestionResults.push({ source_key: sourceKey, error: error.message });
      } else {
        const result = data as Record<string, unknown>;
        ingestedCount += Number(result?.records_inserted ?? 0) + Number(result?.records_updated ?? 0);
        ingestionResults.push(result);
      }
    }

    if (ingestedCount > 0) {
      const { error: qualityError } = await supabase.rpc("refresh_investment_data_quality");
      if (qualityError) {
        ingestionErrors += 1;
        ingestionResults.push({ quality_refresh_error: qualityError.message });
      }
    }

    const errorCount = fetchErrors.length + ingestionErrors;
    const skippedCount = skipped.length;
    const providerReadyCount = plan.length - skippedCount;
    let status = "completed";
    if (providerReadyCount === 0) status = "blocked";
    else if (errorCount > 0 && ingestedCount > 0) status = "partial";
    else if (errorCount > 0 && ingestedCount === 0) status = "failed";
    else if (fetchedCount === 0 && ingestedCount === 0) status = "no_work";

    const details = {
      provider_ready_count: providerReadyCount,
      skipped: skipped.slice(0, 100),
      fetch_errors: fetchErrors.slice(0, 100),
      ingestion_results: ingestionResults,
    };

    const { error: finishError } = await supabase.rpc("finish_market_data_worker_run", {
      p_run_id: workerRunId,
      p_status: status,
      p_due_count: plan.length,
      p_fetched_count: fetchedCount,
      p_ingested_count: ingestedCount,
      p_skipped_count: skippedCount,
      p_error_count: errorCount,
      p_details: details,
    });
    if (finishError) throw new Error(`worker_run_finish_failed:${finishError.message}`);

    return json(status === "failed" ? 502 : 200, {
      status,
      run_id: workerRunId,
      due_count: plan.length,
      fetched_count: fetchedCount,
      ingested_count: ingestedCount,
      skipped_count: skippedCount,
      error_count: errorCount,
      details,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (workerRunId) {
      await supabase.rpc("finish_market_data_worker_run", {
        p_run_id: workerRunId,
        p_status: "failed",
        p_error_count: 1,
        p_details: { fatal_error: message },
      });
    }
    return json(500, { status: "failed", run_id: workerRunId, error: message });
  }
});
