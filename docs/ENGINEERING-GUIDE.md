# Investor DNA engineering guide

Status: canonical contributor rules  
Last reviewed: 2026-09-15

This file defines how code should be added or changed. It is deliberately opinionated so the repository does not become a collection of page-specific exceptions.

## 1. Read before coding

A new engineer should read, in this order:

1. `README.md`
2. `docs/ARCHITECTURE.md`
3. the README inside the folder they are changing
4. the relevant methodology/domain document
5. existing tests covering the same flow

For Next.js behavior, also follow the generated rules in `AGENTS.md` and the installed Next.js documentation for the exact version in this repository.

## 2. General code rules

### Keep one source of truth

Do not copy business rules into multiple pages/components.

Examples:

- asset grouping/labels/Match eligibility -> `lib/instrument-model.ts`;
- assessment draft rules -> `lib/dna.ts`;
- generic research RPC adapters -> `lib/instruments.ts`;
- ETF-only research/Match adapters -> `lib/investments.ts`;
- pilot event names -> keep browser and Edge Function allowlists synchronized.

### Pages orchestrate; domain modules decide

`app/**/page.tsx` should mostly:

1. load state,
2. call domain adapters,
3. compose components,
4. handle route-level loading/error state.

Do not add complex scoring, taxonomy, ownership or data-source rules directly to a page.

### Prefer explicit contracts

Type RPC/Edge responses. Avoid growing `any` surfaces. When an API returns a public DTO, return only public fields rather than returning a database row with internal columns and hoping callers ignore them.

### Null means unavailable

Do not coerce missing financial/research data to `0`. Display helpers should preserve the distinction between zero and unavailable.

### No hidden behavioral changes

A refactor should not alter scoring, Match ranking, safety gates, auth ownership or source precedence unless the change explicitly says so and updates the relevant methodology/version/test.

## 3. Naming rules

Use domain language consistently:

- platform: `Investor DNA`
- assessment: `Investing DNA`
- investment structural profile: `Investment DNA`
- personalized compatibility: `DNA Match`
- generic cross-asset object: `instrument` or `investment`
- ETF-specific object: `fund` only when the code is genuinely ETF/fund-specific

Do not introduce new generic helpers named `fund*` for cross-asset behavior.

### Type/file naming

- React components: `PascalCase.tsx`
- domain/client modules: `kebab-case` or existing concise module name in `lib/`
- exported types: `PascalCase`
- migration names: `YYYYMMDDHHMMSS_descriptive_snake_case.sql`
- database functions: verb-first, explicit scope (for example `app_get_instrument`)

## 4. Comments and documentation

Comments should explain **why**, trust boundaries, invariants or non-obvious constraints. Do not narrate obvious syntax.

Good comment:

```ts
// Completed guest reports are not persisted in localStorage. Keep only the
// short-lived claim ticket needed to attach the assessment after magic-link auth.
```

Bad comment:

```ts
// Set loading to true.
setLoading(true)
```

### Required module header

Core domain/boundary modules should start with a short docblock that answers:

- what this module owns;
- what it intentionally does not own;
- which canonical doc explains the contract.

### Documentation-in-the-same-change rule

Update documentation in the same commit/PR when changing:

- routes/product flows;
- public/internal APIs;
- database ownership/security semantics;
- versioned assessment/scoring/Match logic;
- asset taxonomy;
- deployment/env requirements;
- test/acceptance gates.

## 5. Frontend state rules

### Local/browser storage

Browser persistence is a product/security decision, not a convenience API.

Before adding storage:

- define owner/account isolation behavior;
- define expiry;
- define what happens when storage is blocked;
- document whether data survives completion/sign-out;
- add a contract test.

Assessment draft behavior currently lives in `lib/dna.ts`.

### Authentication

The browser may know the Supabase auth user but must not use browser-provided IDs as proof of ownership. Server/RPC logic derives account/profile ownership from `auth.uid()` or validated auth context.

## 6. Supabase/database rules

### Migrations are append-only

Do not edit an already-applied migration to change live behavior. Add a corrective migration.

### Do not guess migration state

Before applying a migration to the existing project, inspect live state/migration history. If a connector/API fails, do not claim the migration was applied.

### Public API pattern

Preferred pattern for sensitive logic:

```text
private/privileged implementation
        |
        v
narrow public wrapper with explicit grants
```

Use `security invoker` where possible. Use `security definer` only when required, with a fixed `search_path`, narrow grants and an understood permission model.

### Source data

Every sourced value should preserve source attribution and an as-of/effective date where applicable. Never create an artificial current date just to make a row appear fresh.

## 7. Edge Function rules

`supabase/functions/investing-dna-pilot/index.ts` is a privileged boundary.

Every action must:

1. be explicitly allowlisted;
2. validate the payload shape;
3. authenticate/validate the assessment session when applicable;
4. verify ownership for linked assessments;
5. use service-role access only after validation;
6. return a narrow client DTO;
7. avoid leaking internal scoring/config fields.

When adding an Edge action, update `docs/DATABASE-AND-API.md` and browser tests.

## 8. Research/scoring rules

Engineering acceptance is not scientific validation.

Do not change questionnaire wording/weights/scoring/Match logic under an existing published research version. Create a new version, document it and add migration/regression evidence.

Do not describe compatibility as expected return, investment quality, a guaranteed outcome or a buy/sell instruction.

## 9. Testing rule by change type

At minimum:

| Change | Required verification |
| --- | --- |
| pure UI copy/layout | typecheck/build + relevant browser test |
| assessment client | contracts + assessment browser flow |
| auth/profile/watchlist | connected browser flow + DB ownership regression |
| investment research | fund/cross-asset browser flow + DB research regression |
| migration/RLS/RPC | database regression + advisor review where relevant |
| scoring/Match | canonical engine DB regression + browser Match flow |
| deployment/env | build + deployment checklist/canary |

See `docs/TESTING.md` for exact commands and what each suite proves.

## 10. Definition of done

A change is done only when all applicable items are true:

- code is in the correct domain module rather than duplicated;
- types/contracts are explicit enough for the next engineer;
- missing data semantics are preserved;
- security/ownership boundaries are unchanged or intentionally tested;
- tests pass;
- canonical documentation is updated;
- `CONTINUE-HERE.md` is updated if the work changes the immediate project state/blocker;
- deployment state is described accurately (CI green is not the same as deployed);
- no claim is made for human evidence, validation or compliance work that did not happen.