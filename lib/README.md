# `lib/` domain/client map

`lib/` is the browser-side domain boundary. Put reusable contracts, API adapters and deterministic helpers here instead of duplicating them across pages.

## Modules

### `dna.ts`
Owns client types for questions/results/Match payloads plus guest assessment draft and claim-ticket storage behavior. It does **not** own canonical scoring.

### `instrument-model.ts`
Canonical cross-asset taxonomy for display grouping, labels, hero metrics and current Match eligibility. Pages/components should not recreate these rules.

### `instruments.ts`
Generic cross-asset research/watchlist client adapter. Use this for Explore, generic Detail, Compare and asset-neutral save/remove behavior.

### `investments.ts`
Specialized ETF/fund research and compatibility adapter. Existing `Fund`, fund-facts, holdings/research-context and ETF fit contracts live here. Do not expand this module with generic GIC/Bond/T-Bill behavior; use `instruments.ts` instead.

### `supabase.ts`
Creates the public browser Supabase client and provides two transport helpers:

- `rpc()` for browser-facing Postgres RPCs;
- `pilot()` for the privileged assessment/pilot Edge Function boundary.

No service-role key belongs here.

### `analytics.ts`
Privacy-minimized product-event client. Event names/metadata must stay synchronized with the Edge Function allowlist.

### `browser-session.ts`
Owns random visitor/session identifiers and returning-visitor marker behavior used by analytics.

### `use-account.ts`
Small client hook for Supabase auth session/user state.

### `types.ts`
Small foundational shared types. Keep this file lightweight; domain-specific response types should live close to the adapter that owns them.

## Dependency direction

Preferred direction:

```text
app/components
    |
    v
lib domain adapters/helpers
    |
    v
Supabase public RPC / Edge Function contracts
```

Avoid importing page components into `lib/` or moving server trust decisions into UI helpers.

## Refactor rule

If a helper is used by more than one page and encodes a domain decision, move it here. If it is purely presentational, move it to `components/` instead.

See `docs/ARCHITECTURE.md` and `docs/ENGINEERING-GUIDE.md`.