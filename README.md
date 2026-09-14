# Investing DNA — fund and account continuity

The Next.js application now runs from the repository root, replacing the older single-page frontend. Supabase remains the existing project. Registration is optional: visitors can browse funds and take an assessment before creating an account.

## Changes

- Fund View links open complete catalogue details, with explicit loading, retry and missing-data states.
- Separate email-link signup and sign-in; the selected fund survives the authentication redirect.
- Signed-in users save and remove funds, return through Profile or Watchlist, and retrieve the same saved list on another device.
- Fund pages display the signed-in investor's existing DNA match when available; users without DNA get an assessment prompt.
- Profile shows saved funds and current DNA. Match links real saved match results to fund details.
- Assessment supports scale questions, correct server answer/score fields, 24-hour local guest drafts, and explicit account claiming.
- New scoped database RPCs derive ownership from auth.uid(). Legacy internal watchlist functions remain inaccessible to browsers. Direct access to seven unscoped match/portfolio views was revoked.

## Run and deploy

Requires Node.js 22.18+. Copy `.env.example` to `.env.local`, supply the Supabase public/publishable key, then run `npm ci` and `npm run dev`. Never use a service-role key in public environment variables. See DEPLOY.md.

The migrations in `supabase/migrations` were applied to project `bxjjannguzzzqsamnhem` on 14 September 2026. Apply them before deploying this frontend to a different backend. The frontend has not been published by this work; direct access to the linked Vercel project returned 403.

## Verification

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:flow
npm run test:funds
```

The browser runners start a local server on port 3001 with intercepted Supabase responses. They send no emails or production assessments. Set `CHROME_BIN=/absolute/path/to/chrome` to use an existing browser. Screenshots go to ignored `tests/artifacts`.

Validation includes contract/storage checks, nine assessment/account browser checks, and eleven fund/account checks covering detail retry, signup callback, save retry, list persistence, DNA fit, match navigation, a fresh browser session, removal, missing funds and browser errors. Mobile screenshots were visually inspected.

`supabase/tests/investor_platform_connections.sql` passed against the real database inside a rolled-back transaction: public detail, guest denial, required identity, duplicate saves, cross-account isolation, removal, protected internal functions, positive DNA fit and raw-view denial. Synthetic identities and records were rolled back. Real email delivery and a real-user end-to-end claim have not been tested. This is not a full platform security audit; other legacy database advisor findings remain.

## Existing backend limits to address next

Observed in the deployed `investing-dna-pilot` v13 source; not introduced or fixed by this frontend:

1. `claim_assessment` links an account before downstream promotion/report/match steps finish, and returns 409 on repeat claims. A partial failure or lost response can make retry fail. Make claiming transactional and idempotent, with ownership checked atomically before any promotion.
2. `submit` marks scoring completed before downstream processing is finished. A later failure can leave an assessment completed but without the response/report expected by the browser. Add a safe read/recovery action and retry semantics before calling the full lifecycle production-ready.
3. `questionnaire` currently returns internal `weight` fields. Return an explicit public question DTO if those weights are intended to stay server-only.

The browser does not compute scores, override account ownership or work around these server checks. On a server error it displays the error and retains the guest draft. An account switch cannot read a draft tagged with another user's ID; local storage is still browser storage, not an authorization boundary. Server authorization remains authoritative.
