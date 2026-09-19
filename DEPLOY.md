# Investor DNA deployment runbook

Last reviewed: 2026-09-19

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

This repository contains a long append-only migration history. The existing project has been evolved through the M1–M4 workstreams, including cross-asset research, runtime retirement, account Context correction and selective view/RPC hardening.

Before deploying this frontend against a different Supabase project:

1. compare migration history/schema state;
2. apply the required migration chain in order;
3. deploy the `investing-dna-pilot` Edge Function version that matches the frontend/API contract;
4. verify RLS/grants and database regressions;
5. configure Auth URL settings.

Do not infer backend readiness from repository files alone.

## Supabase Auth URL configuration

The V1 account flow uses client-side email Magic Links through the implicit flow. The browser Auth configuration is explicit in `lib/supabase.ts`.

Configure:

- production Site URL;
- permitted preview origins as needed;
- exact `/profile` redirect destination(s).

Return flows can include safe query parameters such as:

- `investment=<uuid>` to preserve a saved-investment intent;
- `save=dna` to preserve a completed guest assessment claim intent.

The browser may briefly receive Auth tokens in the URL fragment during the implicit callback. `app/profile/page.tsx` removes that sensitive fragment only after an authenticated session has been established while preserving the safe query intent.

## Deployment acceptance

### 1. Repository verification

```sh
npm run test:all
```

This proves the repository/build/browser-mock contract only.

### 2. Vercel build status

Confirm the exact application commit SHA has a successful Vercel deployment. A provider quota/build-rate-limit result means that commit has **not** been deployment-verified even if GitHub CI is green.

The deployed Preview canary is triggered from a successful GitHub `deployment_status` event. It tests the exact deployment URL supplied by Vercel and checks out the exact deployment SHA. Do not replace that with a hard-coded branch alias when making an acceptance claim.

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

Follow `docs/AUTH-CANARY.md` using a controlled external inbox.

At minimum verify both:

```text
guest investment -> optional signup -> email link -> callback -> save -> watchlist/profile
```

and:

```text
guest assessment -> completed result -> account link -> claim -> sign out/in -> saved DNA restored
```

Browser tests mock these operations and are not proof of actual email delivery, redirect allow-list correctness or a real clicked-link session.

### 5. Backend verification

Run relevant SQL regressions and review live state after migrations. For material RLS/DDL changes, also review Supabase security/performance advisors.

## Current hosting state

The current account-continuity runtime head `df037a528490fdb5d39a19b8bf81d75d9ffe0795` has a Vercel deployment in `READY` state (`dpl_DsfHBE4CAj7nGpLLzRAq8Z9ZXh6X`). The same code head also passed the full repository CI and Visual UI Audit. Commits after that runtime head have been workflow/documentation hardening; Vercel may rate-limit redundant builds for those commits without implying an application compile failure.

The automatic Preview canary now waits for the next successful deployment event instead of treating provider rate limiting as an application failure.

## Rollout wording

Use these terms accurately:

- `CI green` — tests/build passed in GitHub Actions.
- `Vercel build green` — hosting provider built the exact commit.
- `preview canary green` — deployed preview behavior was exercised.
- `email canary green` — external Magic Link round trip worked.
- `production live` — production deployment and intended domain have been verified.

See `docs/AUTH-CANARY.md`, `docs/TESTING.md` and `docs/DATABASE-AND-API.md`.
