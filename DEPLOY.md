# Investor DNA deployment runbook

Last reviewed: 2026-09-15

Deployment state must be described precisely. A green GitHub build, a successful Vercel deployment and a live canary are separate checks.

## Vercel project settings

Use the repository root as the Vercel Root Directory.

- Framework: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Node.js: 22.18+

## Public environment variables

Set for each applicable Vercel environment:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted only as a legacy public-key fallback.

Never expose `SUPABASE_SERVICE_ROLE_KEY` or any other privileged key through `NEXT_PUBLIC_*` variables.

## Supabase backend state

This repository contains a long append-only migration history, not “two migrations”. The existing project has been evolved through the M1–M4 workstreams, including the cross-asset architecture/data migrations and Watchlist RLS cleanup.

Before deploying this frontend against a different Supabase project:

1. compare migration history/schema state;
2. apply the required migration chain in order;
3. deploy the `investing-dna-pilot` Edge Function version that matches the frontend/API contract;
4. verify RLS/grants and database regressions;
5. configure Auth URL settings.

Do not infer backend readiness from repository files alone.

## Supabase Auth URL configuration

The account flow uses email magic links.

Configure:

- production Site URL;
- permitted preview origins as needed;
- exact `/profile` redirect destination(s).

Return flows can include query parameters such as:

- `investment=<uuid>` to preserve a saved-investment intent;
- `save=dna` to preserve a completed guest assessment claim intent.

## Deployment acceptance

### 1. Repository verification

```sh
npm run test:all
```

This proves the local/build/browser-mock contract only.

### 2. Vercel build status

Confirm the exact commit SHA has a successful Vercel deployment. A provider quota/build-rate-limit result means the commit has **not** been deployment-verified even if GitHub CI is green.

### 3. Preview canary

Exercise at least:

- home / Explore;
- one ETF detail;
- one non-ETF detail;
- cross-asset Compare;
- assessment start/result flow;
- signed-out Profile/account screen;
- research/privacy pages;
- mobile viewport/runtime console.

### 4. Real auth/email canary

Using a controlled external inbox, verify:

```text
guest investment -> optional signup -> email link -> callback -> save -> watchlist/profile
```

and:

```text
guest assessment -> completed result -> account link -> claim -> sign out/in -> saved DNA restored
```

Browser tests mock these operations and are not proof of actual email delivery.

### 5. Backend verification

Run relevant SQL regressions and review live state after migrations. For material RLS/DDL changes, also review Supabase security/performance advisors.

## Current known hosting note

The cross-asset branch reached green GitHub CI, but the most recent Vercel Git status was blocked by a provider `build-rate-limit` rather than an application compile error. Do not call the newest head deployed until Vercel accepts/builds that exact commit and the preview canary passes.

Direct connected Vercel project inspection has also been inconsistent due connector/account scope, so GitHub/Vercel commit status remains an important independent signal.

## Rollout wording

Use these terms accurately:

- `CI green` — tests/build passed in GitHub Actions.
- `Vercel build green` — hosting provider built the commit.
- `preview canary green` — deployed preview behavior was exercised.
- `email canary green` — external magic-link round trip worked.
- `production live` — production deployment and intended domain have been verified.

See `docs/TESTING.md` and `docs/DATABASE-AND-API.md`.