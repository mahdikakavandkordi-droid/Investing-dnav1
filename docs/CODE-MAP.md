# Investor DNA — code map

Status: canonical navigation guide for engineers  
Last reviewed: 2026-09-16

This is the fastest way to answer **“where does this behavior live?”** without reading the repository from top to bottom.

For design rules and trust boundaries, read `ARCHITECTURE.md`. For database/API details, read `DATABASE-AND-API.md`. This file maps product behavior to concrete code.

---

## 1. Read this before changing anything

The runtime dependency direction is:

```text
app routes / components
        |
        v
lib contracts + adapters + deterministic presentation helpers
        |
        v
browser-facing Supabase RPCs / investing-dna-pilot Edge Function
        |
        v
Postgres read models, ownership helpers, canonical DNA/Match engine
```

Rules:

1. UI does not calculate canonical Investor DNA or DNA Match.
2. UI does not decide ownership.
3. Generic cross-asset rules live in `lib/instrument-model.ts`, not scattered `if (asset_type)` chains.
4. ETF-only research remains separate from generic cross-asset research.
5. Missing financial data stays `null`/unavailable; never silently convert it to zero.
6. Applied migrations are immutable history. Runtime code can be retired with a new migration; old migration files are not deleted.
7. A frozen/retired subsystem must not remain as a second callable runtime path “just in case”. Git history and migrations are the recovery mechanism.

---

## 2. Product vocabulary in code

| Product term | Meaning | Main code owners |
| --- | --- | --- |
| **Investor DNA** | Entire platform | `app/`, `docs/ARCHITECTURE.md` |
| **Investing DNA** | Investor questionnaire / self-assessment | `app/dna/*`, `lib/dna.ts`, Edge Function |
| **Investment DNA** | Structured profile of an investment | `lib/instrument-model.ts`, generic research RPCs, structure tables |
| **DNA Match** | Investor/context ↔ eligible investment compatibility | `/match`, canonical Match DB functions/views |

Do not use “fund” as a generic synonym for all investments. Match is currently ETF-only; research is cross-asset.

---

## 3. Route-to-engine map

### `/` — platform landing

**Route:** `app/page.tsx`  
**Purpose:** product entry and positioning.  
**Business logic:** none.  
**When changing:** copy/layout only; product claims must remain consistent with `/research` and M4 compliance docs.

### `/dna` — Investing DNA entry

**Route:** `app/dna/page.tsx`  
**Purpose:** explain/start assessment.  
**Scoring:** none.

### `/dna/assessment` — questionnaire session

**Route:** `app/dna/assessment/page.tsx`  
**Client state/contracts:** `lib/dna.ts`  
**Localized UI copy:** `lib/assessment-copy.ts`  
**Server boundary:** `supabase/functions/investing-dna-pilot/index.ts`

Edge actions used by the flow:

```text
start
questionnaire
save_answers
submit
```

Canonical questionnaire/scoring is server/database owned. The browser only manages navigation, temporary answers and recovery state.

**Tests:**
- `tests/contracts.mjs`
- `tests/flow.cjs`
- `supabase/tests/milestone_1_engine_trust.sql`

**If changing a question/scoring rule:** do not edit browser code first. Create/version the server-side research model, update methodology docs, then update client copy/types only if the public contract changed.

### `/dna/context` — money/goal context

**Route:** `app/dna/context/page.tsx`  
**Server action:** `save_context` via Edge Function  
**DB service contract:** current `service_save_investment_context` path.

Context describes the current pool of money. It is not Risk Tolerance and must not be fed back into the underlying Investor DNA score.

**Tests:** M1 DB regression + browser flow.

### `/dna/result` — Investor DNA result

**Route:** `app/dna/result/page.tsx`  
**Report component:** `components/DnaSummary.tsx`  
**Presentation helpers:** `lib/dna-presentation.ts`  
**Persisted account state:** `get_current_investor_app_state()` browser contract.

Guest result state is intentionally ephemeral. Full guest reports are not a permanent localStorage database.

**Tests:** `tests/flow.cjs`, account/platform DB regression.

### `/explore` — cross-asset research catalog

**Route:** `app/explore/page.tsx`  
**Adapter:** `lib/instruments.ts`  
**Taxonomy/display rules:** `lib/instrument-model.ts`  
**Primary RPC:** `app_search_instruments`

Current research universe:
- ETF
- GIC
- T-Bill
- Bond
- Commercial Paper reference
- ABCP reference

**Tests:** `tests/assets-flow.cjs`, `supabase/tests/m4_cross_asset_research.sql`.

### `/investment/[id]` — instrument detail

**Route:** `app/investment/[id]/page.tsx`

Generic layer:
- `lib/instruments.ts`
- `components/InstrumentStructureCard.tsx`
- `components/InstrumentTermsCard.tsx`

ETF-specific enrichment:
- `lib/investments.ts`
- `components/InvestmentDnaCard.tsx`
- `components/OfficialFundFactsCard.tsx`
- `components/ResearchContextCard.tsx`

Account/watchlist connection:
- `components/InstrumentConnection.tsx`

Do not make GIC/Bond/T-Bill pretend to have ETF metrics such as MER/holdings merely to reuse a component.

### `/match` — personalized ETF compatibility

**Route:** `app/match/page.tsx`  
**Client contract:** `MatchPayload` / `MatchItem` in `lib/dna.ts`  
**Canonical server model:** `investment-dna-match-v6` via current Match run/read path.

Meaningful states:
- `review_required`
- `context_required`
- `no_suitable_options`
- `available`

`NULL` match score under review is intentional. Never turn it into `0`.

**Tests:** M1 DB regression, fund/browser flow.

### `/screener` — ETF screener

**Route:** `app/screener/page.tsx`  
**ETF research contract:** `lib/investments.ts`  
**RPC family:** ETF screener/search RPCs.

This remains ETF-only while personalized Match is ETF-only.

### `/compare` — cross-asset comparison

**Route:** `app/compare/page.tsx`  
**Generic compare adapter:** `lib/instruments.ts`  
**Shared dimensions:** cross-asset structure fields.  
**Optional ETF layer:** saved DNA/Match can be overlaid only on Match-eligible ETF rows.

Cross-asset comparison should compare structure first, not invent a fake common performance metric.

### `/watchlist` — saved investments

**Route:** `app/watchlist/page.tsx`  
**Adapter:** asset-neutral watchlist methods in `lib/instruments.ts`  
**Ownership:** server/RLS/profile derived from authenticated identity.

Watchlist is not ETF-specific.

### `/profile` — account continuity

**Route:** `app/profile/page.tsx`  
**Auth hook:** `lib/use-account.ts`  
**Current product state:** `get_current_investor_app_state()`  
**Guest claim:** `claim_assessment` Edge action  
**Saved investments:** `lib/instruments.ts`.

The URL can express intent (for example an investment to save), but it is never proof of ownership.

### `/feedback` — product pilot feedback

**Route:** `app/feedback/page.tsx`  
**Write boundary:** `submit_feedback` Edge action.  
**Purpose:** product evidence only; feedback must not alter assessment scoring.

### `/pilot/cognitive` — controlled research entry

**Route:** `app/pilot/cognitive/page.tsx`  
**Cohort:** `COGNITIVE_V1_10`  
**Purpose:** moderator-gated cognitive testing, not general product traffic.

### `/research` and `/privacy`

**Routes:** `app/research/page.tsx`, `app/privacy/page.tsx`  
**Purpose:** product limitations, data/research scope, pilot privacy transparency.

These are product trust surfaces. Changes that alter claims or data handling should also update compliance/privacy documentation.

---

## 4. `lib/` ownership map

### `dna.ts`
Browser contracts for questionnaire/result/Match plus guest recovery and limited claim-ticket state.

**Not allowed here:** canonical scoring calculations.

### `assessment-copy.ts`
Localized assessment UI copy only.

### `dna-presentation.ts`
Pure display interpretation of already-computed DNA values (labels, descriptions, report wording).

**Not canonical scoring.**

### `instrument-model.ts`
Single source for cross-asset UI taxonomy:
- display family/label;
- Explore grouping;
- hero metrics;
- current Match eligibility.

If a new asset class is added, start here after the DB research schema is defined.

### `instruments.ts`
Generic cross-asset browser adapter:
- Explore reads;
- Detail reads;
- Compare reads;
- asset-neutral Watchlist actions.

### `investments.ts`
ETF/fund-specific adapter and types:
- official ETF facts;
- Investment DNA ETF signals;
- holdings/research context;
- ETF compatibility-specific types/helpers.

Do not put generic GIC/Bond/T-Bill behavior here.

### `supabase.ts`
Lowest browser transport layer: configured Supabase client, narrow RPC transport, Edge Function transport.

No service-role key is allowed in browser code.

### `analytics.ts` + `browser-session.ts`
Privacy-minimized product event transport and random browser identifiers.

### `use-account.ts`
Reactive browser auth-session hook. It exposes identity to UI, not authorization decisions.

### `types.ts`
Small foundational investment fields shared by generic and ETF-specific client models.

---

## 5. Component map

| Component | Owns | Must not own |
| --- | --- | --- |
| `DnaSummary` | Investor DNA report composition | scoring |
| `InstrumentConnection` | save/watchlist UI + ETF-only fit presentation | ownership decisions |
| `InstrumentStructureCard` | shared cross-asset structure display | asset-specific fake metrics |
| `InstrumentTermsCard` | fixed-income/GIC terms display | canonical research calculations |
| `InvestmentDnaCard` | ETF Investment DNA display | Investor DNA scoring |
| `OfficialFundFactsCard` | official ETF facts/provenance | Match logic |
| `ResearchContextCard` | ETF coverage/holdings/performance context | filling missing data |
| `ProductAnalytics` | route event mounting | arbitrary personal-data collection |
| `Nav` / `Footer` | global shell | domain logic |

---

## 6. Database runtime map

### Live browser/public research contracts

Generic cross-asset:
- `app_search_instruments`
- `app_get_instrument`
- `app_compare_instruments`

ETF/fund-specific research:
- `app_get_investment_dna`
- `app_get_official_fund_facts`
- `app_get_investment_research_context`
- current ETF screener/search contract

Authenticated/account:
- `get_current_investor_app_state`
- `app_watchlist`
- `app_investment_fit`

Assessment/pilot browser writes go through the Edge Function rather than direct table writes.

### Private/privileged implementation

Privileged logic that genuinely needs elevated access belongs in `investor_private` or service-only functions and is reached through a narrow public wrapper/Edge action.

### Historical but intentionally retained

`public.investment_portfolio_blueprints` contains historical pre-M4 developer output. It is **not a current product/runtime table** and browser roles have no access.

The old Portfolio Builder runtime functions/views and empty risk-analysis table were retired in migration `20260916000718_m4_retire_frozen_portfolio_runtime.sql`.

Applied historical migrations that originally created those objects remain in source control for reproducibility.

---

## 7. Edge Function action map

File: `supabase/functions/investing-dna-pilot/index.ts`

| Action | Purpose |
| --- | --- |
| `start` | create assessment/session |
| `questionnaire` | return narrow localized public question DTO |
| `save_answers` | validate and persist answers |
| `submit` | complete canonical assessment/result/Match |
| `save_context` | persist money/goal context and refresh relevant output |
| `claim_assessment` | attach completed/in-progress guest assessment to authenticated profile |
| `track_event` | privacy-minimized product analytics |
| `submit_feedback` | structured pilot feedback |

When adding an action, update:
1. Edge Function validation/allowlist;
2. browser adapter/caller;
3. `docs/DATABASE-AND-API.md`;
4. relevant browser/DB regression.

---

## 8. Test map — what proves what

### Browser/contract layer (`tests/`)

- `contracts.mjs` — static public contract invariants (including questionnaire DTO leakage guard).
- `flow.cjs` — Investing DNA guest flow.
- `funds-flow.cjs` — ETF research/Match/product paths.
- `assets-flow.cjs` — cross-asset Explore/Detail/Compare behavior.
- `m4-launch-flow.cjs` — transparency/privacy/launch-surface checks.

### Database layer (`supabase/tests/`)

- `investor_platform_connections.sql` — profile/watchlist/account ownership contracts.
- `milestone_1_engine_trust.sql` — canonical model/version/gate/null semantics.
- `milestone_2_product_value.sql` — research/product read model.
- `milestone_3_pilot_readiness.sql` — pilot analytics privacy/write boundaries.
- `m4_cross_asset_research.sql` — cross-asset structure/source integrity.
- `m4_security_hardening.sql` — privileged RPC/claim/retired Portfolio Builder boundaries.

A mocked browser test does not replace a live DB permission regression.

---

## 9. “I need to change X” quick guide

### Change assessment wording only

Start:
- `lib/assessment-copy.ts` for UI copy;
- questionnaire DB version/source if the actual question text changes.

Then:
- methodology/cognitive docs;
- contracts/flow tests.

Do not silently alter a frozen questionnaire version.

### Change scoring / archetype / safety gates

Start in the versioned server/database engine, not `DnaSummary`.

Then update:
- `ASSESSMENT-METHODOLOGY.md`;
- M1 regression;
- candidate/model version.

### Add a new investment type

Start with:
1. `INVESTOR-DNA-ASSET-ARCHITECTURE.md`;
2. generic investment identity + specialized terms table;
3. generic RPC read model;
4. `lib/instrument-model.ts`;
5. generic detail/compare cards;
6. cross-asset DB/browser regressions.

Do **not** automatically add personalized Match support.

### Change ETF Match

Start with canonical Match DB model/run contract. Preserve gate semantics and explicit versioning. Update `/match`, Screener/Compare overlays only after the server contract is stable.

### Change account/watchlist behavior

Trace:

```text
/profile or InstrumentConnection/Watchlist
 -> lib adapter/auth hook
 -> authenticated RPC/Edge action
 -> profile ownership helper/RLS
 -> investor_platform_connections.sql regression
```

### Change a research field

Trace source → stored field → generic/specialized read model → adapter type → component → source/as-of display → regression.

---

## 10. Dead-code / retirement rule

Before deleting a runtime object:

1. search callers in UI/lib/Edge Function;
2. search database function/view dependencies and grants;
3. confirm tests do not depend on it as a current contract;
4. preserve migration history;
5. retire it with a new migration/change;
6. verify live post-state and CI;
7. document any historical table/data intentionally retained.

Do not keep two live implementations merely because one “might be useful later”. Git and migration history are the archive.

Do not delete a historical migration simply because its runtime object was later retired.

---

## 11. Definition of a clean change

A change is not finished until:

- there is one clear owner for the behavior;
- old callers/parallel implementations are removed;
- public/server contract is explicit;
- tests cover the changed boundary;
- relevant code map/architecture docs are updated;
- current CI is green;
- deployment status is reported separately from CI status.
