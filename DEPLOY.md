# Deployment

Use this repository root as the Vercel Root Directory (leave it empty, not `platform`). Framework: Next.js. Install: `npm ci`. Build: `npm run build`. Node: 22.18+.

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also accepted) for each deployment environment before building. Only use a public key. See `.env.example`.

The two checked-in migrations are already applied to the existing DNA Supabase project. Other databases require equivalent existing schema plus these migrations.

In Supabase Auth URL Configuration, allow the exact deployed `/profile` redirect; fund-return callbacks include an `investment` query parameter. Configure the correct production Site URL and permitted preview redirects. The form uses email magic links and the default email template. Verify actual delivery and redirect on a test account before production rollout.

Validation gate: guest fund View → optional signup → email callback → save fund → profile/watchlist → sign out/in on another device. Also verify an assessment result can be claimed and later read from the account.

Direct Vercel project access returned 403 during this work, so deployment settings and real email callbacks remain unverified. A code change on a branch is not confirmation that production has updated.
