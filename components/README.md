# `components/` UI component map

Reusable product UI lives here. Components may own local interaction state, but canonical domain rules and authorization belong in `lib/`/Supabase.

## Main component groups

### Investor/result presentation

- `DnaSummary.tsx` — Investor DNA/result presentation.
- report components should remain presentation-focused and consume already-computed server/client contracts.
- deterministic report-label/narrative helpers live in `lib/dna-presentation.ts`; do not rebuild those rules inside JSX.

### Investment research

- `InstrumentStructureCard.tsx` — shared cross-asset Investment DNA structure dimensions.
- `InstrumentTermsCard.tsx` — asset-specific terms such as GIC or fixed-income facts.
- `InvestmentDnaCard.tsx` — ETF-specific Investment DNA research signals and official risk context.
- `OfficialFundFactsCard.tsx` — ETF official facts/source presentation.
- `ResearchContextCard.tsx` — ETF performance/holdings/coverage research context.

### Account/retention

- `InstrumentConnection.tsx` — canonical saved-investment/watchlist connection and ETF-only fit composition where eligible.

There is intentionally no parallel `FundConnection` implementation. If an ETF-only caller needs this behavior, use `InstrumentConnection` with the ETF asset type instead of creating another compatibility wrapper.

### App shell / telemetry

- `Nav.tsx` — main navigation.
- `Footer.tsx` — research-stage disclosure and policy links.
- `ProductAnalytics.tsx` — route-level analytics event orchestration.

## Component rules

1. Do not duplicate asset taxonomy in a component; use `lib/instrument-model.ts`.
2. Do not call service-role/admin data directly.
3. Components that call RPCs should use existing `lib/` adapters when practical.
4. Keep `null`/unavailable presentation distinct from numeric zero.
5. Reusable display formatting belongs in a helper/module, not repeated inline across cards.
6. If a component becomes route-specific orchestration rather than reusable UI, move that logic back toward the route or a dedicated hook/domain module.
7. Do not keep `Old`, `Legacy`, `V2`, `Copy`, `Backup` or compatibility components after their last caller is migrated. Git history is the archive.

See `app/README.md`, `lib/README.md` and `docs/ARCHITECTURE.md`.