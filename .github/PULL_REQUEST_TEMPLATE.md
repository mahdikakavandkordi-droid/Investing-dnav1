## What changed

<!-- Describe the product/engineering change and why it belongs in this layer. -->

## Boundary affected

- [ ] UI / route only
- [ ] client domain contract (`lib/`)
- [ ] assessment / DNA / Match research behavior
- [ ] investment research / asset taxonomy
- [ ] auth / profile / watchlist ownership
- [ ] Supabase schema / RPC / RLS / grants
- [ ] Edge Function
- [ ] analytics / privacy
- [ ] deployment / environment

## Verification

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] relevant Playwright flow(s)
- [ ] relevant `supabase/tests/*.sql` regression (if backend/data/security changed)
- [ ] Supabase Advisor reviewed (if RLS/DDL/grants changed)
- [ ] deployed preview/canary verified, or clearly marked not verified

## Data / trust checks

- [ ] Missing financial data still remains null/unavailable rather than fake zero.
- [ ] No artificial/fake source freshness was introduced.
- [ ] Browser code did not gain server/account authority.
- [ ] No service-role credential is exposed to the browser.
- [ ] Versioned questionnaire/scoring/Match behavior was not silently mutated.

## Documentation

- [ ] Canonical documentation was updated if architecture/API/schema/routes/test gates changed.
- [ ] Folder README was updated if module ownership changed.
- [ ] `CONTINUE-HERE.md` was updated if this changes the immediate project state/blocker.
- [ ] Historical milestone reports were not rewritten as if they were current architecture.

## Claims

<!-- State explicitly if any of these remain unverified: live migration, Vercel deployment, real email, human pilot evidence, scientific validation, legal/compliance review. -->
