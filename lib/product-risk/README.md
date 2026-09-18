# Product Risk DNA module

This directory is intentionally modular.

- `types.ts` — stable browser/public contracts.
- `dimensions.ts` — the four consumer indicators and help/impact copy.
- `modules.ts` — asset-module registry and sensor contracts. It does not score products.
- `api.ts` — thin RPC adapter.

Canonical scoring, thresholds, hard floors, evidence validation and publication live on the server/database side. UI components consume published outputs and never recreate asset-specific scoring logic.

Current modules start in **research** readiness. No consumer risk band should be invented from incomplete calibration.

## Consumer scale semantics

The four consumer dimensions do not all point in the same direction.

- Loss Potential / Price Movement: higher = more risk pressure.
- Access to Money / Diversification: higher = more of a beneficial property.

Direction is explicit in the contract so the UI never paints every higher level as “worse”.

The live database currently contains shadow-calibration drafts only. Public RPCs continue to return `not_available` until a profile is deliberately reviewed and published.


## Source-of-truth and calibration rules

ETF Product Risk must read the verified `investment_official_risk_ratings` table directly for issuer/CSA volatility classification. The generic research-catalog `risk_level` field is not the Product Risk source of truth.

ETF diversification is an asset sensor, not a hard-coded “diversified” label: underlying holdings are preferred over wrapper holdings, holding-count bands are applied, and single-sector products are capped. Access to Money prefers verified bid-ask spread and falls back to structural liquidity with lower confidence.

Overall Risk uses a hidden, versioned asset-module aggregation of the four consumer dimensions. No numeric composite is exposed to users. The database remains shadow-only until a profile is explicitly reviewed and published.
