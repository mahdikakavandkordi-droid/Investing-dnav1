# Investor DNA architecture

Status: canonical engineering reference  
Last reviewed: 2026-09-15

## 1. Product vocabulary

Use these names consistently in code, UI and documentation:

- **Investor DNA** — the platform/product brand.
- **Investing DNA** — the investor assessment experience.
- **Investment DNA** — the structured research profile of an investment/instrument.
- **DNA Match** — the compatibility layer between an investor profile/context and eligible investments.

Do not use `Investing DNA` as a generic name for the whole platform. Do not call every instrument a `fund` now that the research universe is cross-asset.

## 2. High-level system

Investor DNA is a Next.js application backed by Supabase. The browser is intentionally a thin client: it renders product state and invokes approved server contracts; it does not own scoring, authorization, pilot writes or account ownership decisions.

```text
Browser / Next.js app
  |
  |-- public/read RPCs ---------------------> Supabase Postgres read models
  |
  |-- authenticated RPCs ------------------> profile / watchlist / account state
  |
  `-- investing-dna-pilot Edge Function ---> assessment sessions, answers,
                                             submit/claim/context,
                                             analytics and feedback

Supabase Postgres
  |-- assessment + DNA models
  |-- investment identity/research models
  |-- Match runs and explainability
  |-- account/profile/watchlist retention
  `-- pilot analytics/research operations
```

## 3. Repository ownership map

### `app/`
Next.js App Router routes and route-level orchestration. Pages may compose domain helpers/components but should not recreate business rules or asset taxonomy.

### `components/`
Reusable presentation and interaction components. Components can own UI state, but server-trust decisions must remain behind RPCs/Edge Functions.

### `lib/`
Browser-side domain contracts, API adapters and small deterministic helpers. This is the preferred place for reusable rules that multiple pages need.

Important modules:

- `lib/dna.ts` — assessment/result client contracts and guest-draft/claim storage behavior.
- `lib/instrument-model.ts` — canonical cross-asset taxonomy and display/Match eligibility rules.
- `lib/instruments.ts` — generic cross-asset research/watchlist client adapter.
- `lib/investments.ts` — ETF/fund-specific compatibility and research adapter; treat as the specialized ETF layer, not the generic universe layer.
- `lib/supabase.ts` — browser Supabase client plus RPC/Edge Function transport.
- `lib/analytics.ts` and `lib/browser-session.ts` — privacy-minimized pilot event client and anonymous browser/session identifiers.
- `lib/use-account.ts` — browser auth-session hook.

### `supabase/migrations/`
Append-only database evolution. Migrations are the source-controlled history of schema, permissions and server logic changes.

### `supabase/functions/investing-dna-pilot/`
The assessment/pilot Edge Function. It is a privileged server boundary and must validate untrusted browser input before using the service role.

### `supabase/tests/`
Transactional/live database regression scripts for ownership, canonical engine behavior, product data and milestone contracts.

### `tests/`
Playwright/browser-contract regressions using intercepted Supabase responses. These test frontend behavior and integration contracts; they are not production evidence.

## 4. Core product flows

### 4.1 Guest assessment

```text
/dna/assessment
  -> Edge action: start
  -> questionnaire
  -> save_answers
  -> submit
  -> /dna/result
```

The browser stores an in-progress draft for recovery. A completed guest result is kept in memory for the current experience and a limited claim ticket is retained for optional account attachment. The full completed guest draft is not intentionally persisted in local storage after completion.

### 4.2 Optional account / claim

```text
Guest result
  -> /profile?mode=signup&save=dna
  -> Supabase magic link
  -> authenticated profile
  -> Edge action: claim_assessment
  -> persisted current Investor DNA
```

Account creation is optional. Browsing and assessment completion do not require signup.

### 4.3 Investment research

```text
/explore
  -> app_search_instruments
  -> /investment/[id]
  -> app_get_instrument
  -> generic structure/terms cards
  -> ETF only: fund-specific research + Investment DNA source cards
```

Cross-asset identity stays in `public.investments`. Generic research reads are served by the instrument read model/RPC layer. Asset-specific fields live in specialized tables.

### 4.4 DNA Match

DNA Match is currently ETF-scoped. Non-ETF instruments are research-only until a separately designed and tested compatibility model is introduced.

Match states are meaningful product states, not errors:

- `review_required`
- `context_required`
- `no_suitable_options`
- `available`

Do not convert `review_required` or unavailable scores into zero.

### 4.5 Retention

Authenticated users can persist:

- Investor DNA/current assessment linkage;
- investment context;
- watchlist items;
- returning profile state.

Watchlist language and storage are asset-neutral even though Match remains ETF-only.

## 5. Cross-asset model

The canonical asset taxonomy lives in `lib/instrument-model.ts` and is mirrored by data in the database. Current public research types are:

- ETF
- GIC
- T-Bill
- Bond
- Commercial Paper
- ABCP

The generic structure layer uses dimensions that make sense across asset classes, such as liquidity, capital protection, price volatility, income predictability, growth participation, rate sensitivity, credit exposure, diversification, complexity and time structure.

Do not push asset-specific metrics into the shared table merely to simplify a page. Examples:

- MER/holdings belong to fund research.
- coupon/YTM/maturity belong to fixed-income terms.
- posted rate/redeemability/deposit insurance belong to deposit/GIC terms.

See `INVESTOR-DNA-ASSET-ARCHITECTURE.md` for the extension checklist.

## 6. Data/source-of-truth hierarchy

Prefer, in order:

1. official issuer/regulator/central-bank data;
2. explicitly linked verified source data;
3. partial research data clearly labelled as partial;
4. unavailable/null.

Never synthesize a market value just to fill the UI. Missing is different from zero.

All time-sensitive research values need a source and an as-of date when the source supports one. Do not manufacture freshness by replacing an older real date with `today` or `yesterday`.

## 7. Trust boundaries

### Browser may

- call approved public/authenticated RPCs;
- call the Edge Function with untrusted input;
- render returned data;
- keep limited recovery/session state;
- request account authentication through Supabase Auth.

### Browser must not

- calculate canonical Investor DNA or Match scores;
- decide account ownership;
- write raw pilot analytics/feedback tables directly;
- use a service-role key;
- bypass safety gates;
- mutate historical assessment/model versions.

### Edge Function/service layer may

Use privileged access only after validating action, session token, ownership and payload shape. Privileged code is responsible for keeping service-role capabilities away from the browser.

## 8. Versioning rules

Research/scoring behavior is versioned because reproducibility matters.

Current canonical research baseline:

- questionnaire: `v1.10-cognitive-candidate`
- Investor DNA model: `dna-v1.10-research`
- Match model: `investment-dna-match-v6`

Never silently alter a historical questionnaire/scoring/Match version. A behavior-changing research revision receives a new version and keeps the old implementation/data available for reproducibility when practical.

## 9. Security model

- RLS remains enabled on user/account data.
- Browser-facing write paths must derive ownership from authenticated identity rather than user-supplied profile IDs.
- Prefer narrow public `security invoker` wrappers over exposing privileged implementation functions directly.
- Public research reads may be anonymous, but source tables should not become generally writable.
- Service-only/admin/pilot tables may intentionally have RLS with no browser policies.

Supabase Advisor findings are reviewed as launch-hardening work; do not blindly change a view/function security mode without tracing its downstream permissions.

## 10. Architecture change rule

A change that alters a domain boundary must update this document and the closest folder README in the same change. Examples include:

- adding an asset type;
- adding a new server action/RPC;
- changing ownership/auth semantics;
- changing assessment persistence;
- moving Match beyond ETFs;
- adding another backend/service;
- changing the deployment topology.

If a future engineer cannot answer “where does this rule belong?” from this document, the architecture documentation is incomplete.