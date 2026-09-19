# M4 Auth / Magic-Link Canary

Status: **required before M4 launch-readiness can close**

This runbook verifies the real hosted account path. Browser tests mock Auth and email delivery; they do **not** prove that Supabase can send a real email, that the deployed origin is in the Auth redirect allow-list, or that a clicked link establishes a usable session on the hosted app.

## What this canary proves

A successful canary proves all of the following together:

1. the deployed Profile page can request a Supabase email link;
2. the email is delivered to an external inbox;
3. Supabase accepts the exact deployed `/profile` redirect;
4. the browser establishes an authenticated session from the returned link;
5. auth tokens are removed from the visible URL after the session is established;
6. account/profile ownership resolves correctly;
7. a guest DNA claim can be attached to the authenticated account;
8. signing out and signing back in restores the account-owned DNA;
9. Watchlist persistence works for the authenticated account.

## Current account UX

The Profile page uses one email path rather than asking the user to decide between `Sign in` and `Create account` before authentication.

- existing email -> sign in;
- new email -> free account after email confirmation;
- the same form preserves incoming investment and limited DNA-claim intent;
- after sending, the UI explicitly asks the user to keep the current tab open and use the **newest** one-time email in the same browser/device;
- the UI warns that a mail app can open another browser and explains that the link should then be copied into the browser that holds the current app session;
- resend remains available in the sent state with a visible 60-second cooldown, plus a clear path to change the email address;
- expired/used links and provider rate limits are translated into recovery-oriented product copy rather than raw provider errors.

This UX hardening does not weaken the ownership boundary. Browser state and URL parameters still do not establish ownership; authenticated server-side paths remain authoritative.

## Preconditions

- GitHub CI is green for the exact application head being tested.
- Vercel has successfully deployed that application head.
- Supabase Auth email provider is enabled.
- Supabase Auth URL Configuration contains the deployed Site URL and a matching `/profile` redirect destination.
- Use a controlled external inbox. Do not use a pilot participant identity for engineering canaries.
- When testing a protected Vercel Preview, first open that Preview in the same browser/device that will consume the email callback and establish its temporary Preview-access cookie/share session. Do this **before** requesting the Magic Link; otherwise Vercel protection can intercept the callback before the app can hydrate Auth.

The V1 browser client intentionally uses the client-only implicit email-link flow. `lib/supabase.ts` configures `flowType=implicit`, `detectSessionInUrl=true`, `persistSession=true`, and `autoRefreshToken=true`.

`app/profile/page.tsx` removes successful access/refresh-token fragments from the visible URL only after an authenticated user exists. Error fragments are surfaced as recovery copy and removed without treating the user as authenticated. Safe product intent query parameters such as `save=dna` and `investment=<uuid>` remain.

## Canary A — account + investment persistence

1. Open the deployed app in a fresh/private browser session.
2. Open any investment detail page and choose the account/save action.
3. Enter the controlled canary email and request the secure email link.
4. Confirm the UI reports that the email was sent.
5. Open the received link in the **same browser/device** that holds the deployed app session.
6. Confirm the returned page is `/profile` and the URL no longer exposes access or refresh tokens after authentication settles.
7. Save the intended investment to the Watchlist.
8. Sign out.
9. Request another sign-in link for the same email and sign back in.
10. Confirm the saved investment remains in the Watchlist.

Pass criteria:

```text
email delivered
+ redirect accepted
+ authenticated Profile loaded
+ URL token fragment removed
+ investment saved
+ save survives sign-out/sign-in
```

## Canary B — guest DNA claim + persistence

Run in a new private browser session if possible.

1. Complete Investing DNA as a guest.
2. Reach the result page through the normal guest flow.
3. Choose the option to save the DNA to an account.
4. Enter the controlled canary email and request the secure email link.
5. Open the link in the **same browser/device** where the guest assessment was completed.
6. Confirm the Profile returns with the `save=dna` intent and the user is authenticated.
7. Confirm the assessment claim succeeds automatically or, after a transient failure, succeeds through the explicit retry path.
8. Confirm the Profile shows the claimed DNA from server-owned state.
9. Confirm the limited claim ticket is cleared after successful claim.
10. Sign out and sign back in with a new email link.
11. Confirm the same DNA is restored from account state without the original guest claim ticket.

Pass criteria:

```text
email delivered
+ redirect accepted
+ authenticated session established
+ completed guest assessment claimed once
+ server DNA visible
+ claim ticket cleared
+ DNA restored after fresh sign-in
```

## Failure classification

Record the first failing boundary instead of calling the entire account flow simply “broken”.

- **email-send failure** — request itself fails or no provider delivery attempt is accepted.
- **email-delivery failure** — Supabase accepts the request but the message does not arrive.
- **redirect-configuration failure** — email link opens but Supabase rejects or changes the intended redirect.
- **preview-access failure** — Auth verification succeeds but a protected Preview intercepts the callback before the app can consume the returned browser session.
- **session-establishment failure** — callback reaches the app but the browser never becomes authenticated.
- **profile-resolution failure** — authenticated user exists but account/profile state cannot load.
- **claim failure** — authentication succeeds but guest DNA cannot be attached.
- **persistence failure** — save/claim succeeds but disappears after a fresh sign-in.
- **URL-hygiene failure** — access/refresh tokens remain visible after authenticated callback handling settles.

Do not work around a failure by manually editing account rows. Fix the failing boundary and rerun the canary from a clean state.

## Evidence to record

Record only what is required for engineering evidence:

- date/time;
- exact Git commit SHA;
- exact deployed hostname;
- Supabase project ref;
- Canary A PASS/FAIL and failing boundary if any;
- Canary B PASS/FAIL and failing boundary if any;
- post-canary aggregate counts for auth users, linked profiles, account-linked assessments and Watchlist items;
- any remediation commit/migration.

Do **not** commit the canary email address, email link, access token, refresh token, session cookie or raw auth logs containing credentials.

## Current real-hosted evidence — 2026-09-16

Pre-canary aggregate live state was:

```text
auth users: 0
profiles: 0
investor profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

A controlled real hosted attempt then established the following evidence:

- deployed Profile successfully requested real Supabase Auth email;
- real external inbox delivery was observed;
- an initial redirect-configuration failure exposed the default `localhost:3000` Site URL;
- Supabase Auth Site URL was corrected to the protected Vercel branch Preview;
- the branch Preview `/profile` destination was added to the Auth redirect allow-list;
- a subsequent real email contained the intended deployed `/profile?investment=...` redirect;
- Supabase consumed the confirmation link and recorded a confirmed Auth user plus a real sign-in timestamp;
- the callback then reached Vercel Deployment Protection in a browser that did not hold the protected-preview share cookie, so the app itself did not establish/retain the session;
- built-in Supabase SMTP rate limiting was also observed during repeated engineering retries and must not be treated as production-ready email infrastructure.

Post-attempt aggregate live state is:

```text
auth users: 1
profiles: 0
investor profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

Therefore the real canary is **PARTIAL, not PASS**.

```text
email send          PASS
external delivery   PASS
redirect config     PASS after remediation
auth confirmation   PASS
app session         NOT YET PROVEN
profile ownership   NOT YET PROVEN
VAB watchlist save  NOT YET PROVEN
sign-out/sign-in persistence NOT YET PROVEN
guest DNA claim     NOT YET PROVEN
```

The next Canary A attempt should reuse the confirmed Auth user, enter the protected Preview in the same browser that will open the newest sign-in email, establish the in-app session, save the intended investment, then prove persistence after sign-out/sign-in. Do not claim the external Magic Link canary is complete before those boundaries pass.

## Production email note

The built-in Supabase email provider is appropriate for limited development testing but is heavily rate-limited. Before public pilot/account onboarding, configure a controlled transactional email provider/custom SMTP and complete the normal deliverability setup (including sender-domain authentication as applicable). This is separate from the current ownership canary and should not be bypassed by disabling email confirmation.
