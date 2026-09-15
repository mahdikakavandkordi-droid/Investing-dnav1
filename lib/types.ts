/**
 * Foundational investment fields shared by generic and ETF-specific client models.
 *
 * Keep this type intentionally small. Detailed RPC response fields belong next
 * to the adapter that owns them (`lib/instruments.ts` or `lib/investments.ts`).
 * See `lib/README.md` and `docs/ARCHITECTURE.md`.
 */
export type Investment = {
  id: string;
  symbol: string;
  name: string;
  asset_type?: string;
  category?: string;
  risk_level?: string;
  price?: number;
  return_1y_pct?: number;
  return_3y_annualized_pct?: number;
  return_5y_annualized_pct?: number;
  mer_pct?: number;
  yield_pct?: number;
  aum?: number;
  volatility_1y_pct?: number;
  sharpe_ratio?: number;
  max_drawdown_1y_pct?: number;
  profile_summary?: string;
  data_quality_status?: string;
  quality_score?: number;
};
