# M4 Auth / Magic-Link Canary

Status: **required before M4 launch-readiness can close**

This runbook verifies the real hosted account path. Browser tests mock Auth and email delivery; they do **not** prove that Supabase can send a real email, that the deployed origin is in the Auth redirect allow-list, or that a clicked link establishes a usable session on the hosted app.

## What this canary proves

A successful canary proves all of the following together:

1. the deployed Profile page can request a Supabase Magic Link;
2. the email is delivered to an external inbox;
3. Supabase accepts the exact deployed `/profile` redirect;
4. the browser establishes an authenticated session from the returned link;
5. auth tokens are removed from the visible URL after the session is established;
6. account/profile ownership resolves correctly;
7. a guest DNA claim can be attached to the authenticated account;
8. signing out and signing back in restores the account-owned DNA;
9. Watchlist persistence works for the authenticated account.

## Preconditions

- GitHub CI is green for the exact application head being tested.
- Vercel has successfully deployed that application head.
- Supabase Auth email provider is enabled.
- Supabase Auth URL Configuration contains the deployed site URL and exact `/profile` redirect destination used by the canary.
- Use a controlled external inbox. Do not use a pilot participant identity for engineering canaries.

The V1 browser client intentionally uses the client-only implicit Magic Link flow. `lib/supabase.ts` explicitly configures `flowType=implicit`, `detectSessionInUrl=true`, `persistSession=true`, and `autoRefreshToken=true`.

`app/profile/page.tsx` removes access/refresh-token fragments from the visible URL only after an authenticated user exists. Safe product intent query parameters such as `save=dna` and `investment=<uuid>` remain.

## Canary A — account + investment persistence

1. Open the deployed app in a fresh/private browser session.
2. Open any investment detail page and choose the account/save action.
3. Enter the controlled canary email and request the link.
4. Confirm the UI reports that the email was sent.
5. Open the received Magic Link in the **same browser/device**.
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
4. Enter the controlled canary email and request the Magic Link.
5. Open the link in the **same browser/device** where the guest assessment was completed.
6. Confirm the Profile returns with the `save=dna` intent and the user is authenticated.
7. Confirm the assessment claim succeeds automatically or, after a transient failure, succeeds through the explicit retry path.
8. Confirm the Profile shows the claimed DNA from server-owned state.
9. Confirm the limited claim ticket is cleared after successful claim.
10. Sign out and sign back in with a new Magic Link.
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
- **redirect-configuration failure** — Magic Link opens but Supabase rejects or changes the intended redirect.
- **session-establishment failure** — callback opens but the browser never becomes authenticated.
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

Do **not** commit the canary email address, Magic Link, access token, refresh token, session cookie or raw auth logs containing credentials.

## Current evidence

Before the first real external canary, aggregate live state was:

```text
auth users: 0
profiles: 0
linked profiles: 0
account-linked assessments: 0
watchlists: 0
watchlist items: 0
```

Therefore the first successful canary should create an unambiguous account-state change. Update this section only after a real external round trip has been observed; browser mocks are not sufficient.
