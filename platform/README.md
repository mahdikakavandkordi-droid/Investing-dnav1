# Investing DNA — platform v4: account continuity

Continues `investing-dna-frontend-platform-v3.zip` recovered from 13 September 2026. This is the full frontend source tree with a focused assessment/account update. It is not a replacement for the separate older v1.6 standalone app. The backend remains the existing Supabase project and was not modified or deployed during this work.

## What changed

- Corrected answer payloads to `answer_value: { value }`, matching the live scoring function.
- Corrected result fields to `risk_tolerance` and `risk_capacity`; missing scores display an em dash, never an invented zero.
- Added 0–10 controls for scale questions, which have empty option arrays in the current questionnaire.
- Added explicit start consent, Back/Next, duplicate-click protection, resumable local progress and a dedicated result page.
- Guest drafts/results persist in this browser for up to 24 hours. The UI reports when local storage is unavailable. No account is required to take an assessment.
- Replaced prompt/alert login with an accessible email-link form, loading/error/success states and an explicit `/profile` redirect.
- Preserves a guest result across login. The user explicitly saves it to the displayed signed-in account. A confirmed successful claim removes the local guest capability.
- Profile reads `get_current_investor_app_state`, shows current DNA, and offers sign-out and reassessment. It does not invent assessment history or live matches.
- Added a mobile-visible profile link, responsive result cards, keyboard focus and the supplied logo asset at `public/logo.png`.
- Added TypeScript alias configuration, corrected the dynamic detail route's params access, pinned dependencies and included a lockfile.

## Run

Requires Node.js 22.18+ (Node 24 used for validation).

```sh
cp .env.example .env.local
# Fill in the project's public/publishable key. Never put a secret or service-role key here.
npm ci
npm run dev
npm run build
```

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Public environment variables must be set before building on Vercel.

In Supabase Auth URL Configuration, allow the exact deployment origin's `/profile` redirect. The form uses the default magic-link email template; it does not require an OTP template migration. Check SMTP/email delivery configuration for real users. See https://supabase.com/docs/guides/auth/auth-email-passwordless . Open the sign-in link in the same browser to retain the guest draft; a guest draft does not sync to a different device before claim.

## Verification

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:flow
```

`test:flow` starts its own local server at 127.0.0.1:3001 with a fake Supabase origin. It intercepts all Supabase calls; it sends no emails and creates no production assessments. An existing Chrome binary can be supplied with `CHROME_BIN=/absolute/path/to/chrome`. Screenshots are written to `tests/artifacts`.

Passed during this work:

- Next.js production build, including TypeScript and all 12 generated static pages.
- Contract/storage assertions: answer envelope, scale range, zero versus missing score, resume, account isolation, expiry, blocked-storage fallback, clearing.
- Nine browser flow checks: refresh/resume; back navigation and scales; save retry/correct scores; email failure/success; explicit claim and claim failure retention; successful claim/server profile reload; sign-out; mobile overflow; no browser runtime errors.
- Mobile result and profile screenshots visually inspected.

Live verification was read-only: the deployed Edge Function v13, public RPC definitions and questionnaire shape were inspected. Actual email delivery, a real user claim and cross-device return were **not** tested. No site was published.

## Existing backend limits to address next

Observed in the deployed `investing-dna-pilot` v13 source; not introduced or fixed by this frontend:

1. `claim_assessment` links an account before downstream promotion/report/match steps finish, and returns 409 on repeat claims. A partial failure or lost response can make retry fail. Make claiming transactional and idempotent, with ownership checked atomically before any promotion.
2. `submit` marks scoring completed before downstream processing is finished. A later failure can leave an assessment completed but without the response/report expected by the browser. Add a safe read/recovery action and retry semantics before calling the full lifecycle production-ready.
3. `questionnaire` currently returns internal `weight` fields. Return an explicit public question DTO if those weights are intended to stay server-only.

The browser does not compute scores, override account ownership or work around these server checks. On a server error it displays the error and retains the guest draft. An account switch cannot read a draft tagged with another user's ID; local storage is still browser storage, not an authorization boundary. Server authorization remains authoritative.

Other existing routes (Explore, Screener, Compare, Match and Watchlist) are preserved from v3 and were not comprehensively validated in this iteration. Match remains a placeholder. No claim is made that the entire platform is production-ready.
