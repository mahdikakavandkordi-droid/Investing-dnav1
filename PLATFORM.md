# Investing DNA platform frontend

The account-continuity frontend is in `platform/`. Run `cd platform && npm ci && npm run build` after setting its public Supabase environment variables.

The repository-root application is the earlier standalone assessment. A deployment intended to run the new frontend must use `platform` as its Root Directory. This pull request does not change the existing deployment configuration.

Read `platform/README.md` for verified behavior, test commands, and remaining backend lifecycle issues. Actual email delivery and authenticated production claims still need end-to-end verification before rollout.
