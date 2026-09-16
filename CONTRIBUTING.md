# Contributing to Investor DNA

This repository is a research-stage financial product. Small implementation choices can change research reproducibility, account isolation or how investment information is interpreted. Read the engineering docs before making non-trivial changes.

## Before you start

Read:

1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/ENGINEERING-GUIDE.md`
4. the README in the folder you will change
5. the relevant methodology/test document

## Branch / PR expectations

- Keep changes scoped to one coherent purpose when practical.
- Do not merge a research/scoring/security change based only on visual inspection.
- Do not rewrite applied migrations.
- Do not claim a deployment, migration, pilot result or validation result that was not verified.
- Keep historical milestone reports as evidence; update canonical engineering docs for current architecture.

## Code review checklist

A reviewer should be able to answer:

- Is this code in the correct layer/module?
- Did the change duplicate an existing rule?
- Did any browser code gain authority it should not have?
- Are null/unavailable financial values preserved?
- Did any versioned research behavior change silently?
- Are source/as-of semantics correct?
- Is the relevant test layer green?
- Did canonical documentation change with the implementation?

## New route / component

Before adding a route/component, check whether the behavior already belongs in a domain adapter/helper.

- route orchestration -> `app/`
- reusable visual/interaction -> `components/`
- reusable domain/API rule -> `lib/`
- data/security/business logic -> Supabase migration/function/RPC

## New asset type

Do not start by adding conditionals to Explore/Detail/Compare.

Follow `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md`:

1. add taxonomy centrally in `lib/instrument-model.ts`;
2. extend database structure/specialized terms only where needed;
3. extend generic read model/RPC;
4. add source-backed sample/data coverage;
5. add browser + DB regression;
6. document Match eligibility explicitly.

## New database/API behavior

Follow `docs/DATABASE-AND-API.md` and include:

- migration;
- grants/RLS/ownership decision;
- narrow browser contract;
- regression;
- advisor review if security/performance semantics changed.

## Research changes

Questionnaire/scoring/Match changes are versioned research changes, not ordinary copy edits. See methodology docs before changing them.

## Required verification

Use the smallest sufficient layer, then run the full relevant CI path. For broad changes:

```sh
npm run test:all
```

Database changes also require the relevant `supabase/tests/*.sql` regression against the target schema.

## Documentation requirement

No separate “documentation later” phase for architecture-changing work. If the code changes a route, contract, trust boundary, schema, asset taxonomy, deployment requirement or acceptance gate, update the canonical docs in the same change.

See `docs/ENGINEERING-GUIDE.md` for the full Definition of Done.