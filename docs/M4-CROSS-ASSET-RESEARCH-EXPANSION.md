# Milestone 4 — Cross-Asset Research Expansion

Status: **implemented, under CI acceptance**  
Date: 2026-09-15

## Why this exists

Investor DNA should not be perceived as an ETF-only website. The current V1 research layer now demonstrates how the same investor can compare materially different investment structures without pretending those structures share the same product metrics.

This expansion is intentionally small. It shows breadth while keeping the pilot scope controlled.

## Naming model

- **Investor DNA** — platform / brand.
- **Investing DNA** — investor assessment.
- **Investment DNA** — structural profile of an investment.
- **DNA Match** — compatibility layer.

See `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md` for the code and change-control contract.

## Current active universe

| Asset type | Count | Product role |
| --- | ---: | --- |
| ETF | 40 | Core research + personalized DNA Match |
| GIC | 4 | Deposit / capital-preservation research |
| T-Bill | 3 | Government money-market research |
| Bond | 6 | Federal / provincial / corporate fixed-income research |
| Commercial Paper | 1 | Educational research reference |
| ABCP | 1 | Educational research reference |
| **Total** | **55** | |

Individual stocks remain intentionally out of scope.

## Representative non-ETF samples

### GIC
- RBC 1-Year Non-Redeemable GIC — posted annual rate 2.45% as of 2026-09-11.
- RBC 5-Year Non-Redeemable GIC — 2.75%.
- RBC 1-Year Cashable GIC — 1.95%.
- RBC 3-Year Redeemable GIC — 2.45%.

Product rate source: RBC Royal Bank. Deposit-insurance language is separately grounded in CDIC rules and current member-institution status; the UI does not describe GICs as unconditionally or unlimitedly guaranteed.

### Government of Canada T-Bills
Bank of Canada secondary-market reference yields as of 2026-09-14:
- 3-month — 2.34%.
- 6-month — 2.62%.
- 1-year — 3.05%.

The discontinued one-month Government of Canada T-Bill program is not presented as a current sample.

### Government of Canada benchmark bonds
Bank of Canada selected benchmark yields as of 2026-09-14:
- 2-year — 3.37%; reference coupon 2.75%.
- 5-year — 3.65%; reference coupon 3.00%.
- 10-year — 3.94%; reference coupon 3.25%.
- long-term — 4.27%; reference coupon 3.50%.

### Provincial / corporate examples
- Province of Ontario DMTN253, 2.25%, due 2031-12-02.
- Bell Canada Series M-69, 4.70%, due 2036-11-15.

Current secondary-market yields are deliberately **not** synthesized for those two examples. Issue terms are shown; absent current yield remains unavailable.

### Money-market references
- Canadian Commercial Paper — research reference.
- Canadian ABCP — research reference.

These are educational structural examples rather than fake live securities. No invented current yield is stored or displayed.

Bankers' Acceptances are deliberately not added as a current active Canadian sample after the CDOR/BA-market transition.

## Data architecture

Existing `public.investments` remains the canonical identity table.

New shared layer:
- `public.investment_structure_profiles`

New asset-specific layers:
- `public.investment_fixed_income_terms`
- `public.investment_deposit_terms`

New generic read model:
- `public.v_instrument_research_catalog` (`security_invoker=true`)

New generic RPCs:
- `app_search_instruments`
- `app_get_instrument`
- `app_compare_instruments`

Existing ETF Match/read paths remain in place to avoid destabilizing the validated M1/M2 contract.

## Shared Investment DNA dimensions

Cross-asset Compare uses only dimensions that can be interpreted across instruments:
- capital protection
- liquidity
- price volatility
- income predictability
- growth participation
- interest-rate sensitivity
- credit exposure
- diversification
- complexity
- time structure
- protection/insurance basis

ETF-only metrics such as MER and fund holdings do not leak into GIC or bond schemas. Bond-only metrics such as coupon/YTM do not leak into the generic structure table.

## Match scope

Current rule:

- ETF — personalized DNA Match enabled.
- GIC — research only.
- T-Bill — research only.
- Bond — research only.
- Commercial Paper — research only.
- ABCP — research only.

The non-ETF UI explicitly states that personalized Match is not enabled yet rather than rendering a missing score as zero or as an error.

## UI changes

- Platform brand changed to **Investor DNA**.
- Assessment CTA is **Investing DNA**.
- Explore now means **Explore investments** and uses tabs for ETFs, GICs, T-Bills, Bonds and Money Market.
- Detail is generic at the shell level and uses asset-specific adapters/cards underneath.
- Compare is structure-first and can compare different asset classes side-by-side.
- Watchlist and Profile retention language is asset-neutral.
- Screener remains explicitly **ETF Screener** while Match is ETF-only.

## Code organization

Central taxonomy / display / Match-eligibility decisions live in:
- `lib/instrument-model.ts`

Generic research client and watchlist adapters live in:
- `lib/instruments.ts`

Shared/non-ETF UI:
- `components/InstrumentStructureCard.tsx`
- `components/InstrumentTermsCard.tsx`
- `components/InstrumentConnection.tsx`

Page components must not recreate their own asset taxonomy. A future asset class must follow the change-control checklist in `docs/INVESTOR-DNA-ASSET-ARCHITECTURE.md` before it is exposed.

## Database verification

Live regression `supabase/tests/m4_cross_asset_research.sql` passed after the seed:

`PASS: M4 cross-asset research architecture and sample integrity`

Verified:
- 55 active instruments.
- exact expected counts by asset type.
- 55/55 shared structure profiles.
- all four GIC samples have sourced rate/date data.
- all three T-Bill samples have sourced Bank of Canada yield/date data.
- CP/ABCP research references have no synthesized yield.
- anon has read access through the intended research API but no direct insert privilege on research tables.

## Security / RLS cleanup

Migration `m4_watchlist_rls_cleanup` removed obsolete permissive Watchlist policies that incorrectly compared `profile_id` directly with `auth.uid()` alongside the canonical ownership policies. Profile policies now use the optimized `(select auth.uid())` form.

After the cleanup, the Supabase performance advisor no longer reports:
- multiple permissive Watchlist policies;
- the previous Watchlist/Profile auth-RLS init-plan warnings.

The broader legacy Supabase advisor backlog remains an M4 launch-hardening task. The new cross-asset tables/view did not add a new security-definer-view finding.

## Migration history

Live + checked into repository:
- `20260915220231_m4_cross_asset_research_architecture.sql`
- `20260915220937_m4_seed_cross_asset_research_samples.sql`
- `20260915221557_m4_watchlist_rls_cleanup.sql`

## Sources used for the first sample set

- Bank of Canada money-market yields: https://www.bankofcanada.ca/rates/interest-rates/money-market-yields/
- Bank of Canada selected benchmark bond yields: https://www.bankofcanada.ca/rates/interest-rates/canadian-bonds/
- RBC GIC rates: https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html
- CDIC GIC coverage guidance: https://www.cdic.ca/depositors/whats-covered/guaranteed-investment-certificates-gics/
- CDIC member list: https://www.cdic.ca/depositors/list-of-members/
- Ontario Financing Authority issue details: https://www.ofina.on.ca/pdf/bond_issue_details_DMTN253_to_R7.pdf
- Bell Canada MTN announcement: https://www.bce.ca/news-and-media/newsroom?article=bell-announces-offerings-of-canadian-mtn-debentures-and-us-notes
- Bank of Canada commercial-paper reference: https://www.bankofcanada.ca/markets/market-operations-liquidity-provision/market-operations-programs-and-facilities/commercial-paper-purchase-program/
- Canadian Fixed-Income Forum / Bank of Canada ABCP primer: https://www.bankofcanada.ca/2024/06/cfif-batvn-publishes-educational-primer-canadian-asset-backed-commercial-paper/

## Acceptance gates

Before calling this expansion accepted:
1. GitHub typecheck/build must pass.
2. Existing assessment and ETF-connected browser flows must remain green.
3. New `test:assets` cross-asset browser regression must pass.
4. Vercel deployment status must be successful on the final head.
5. Live DB regression must pass.

This expansion does not close M4. Real cognitive testing, product pilot evidence, external-email canary and formal compliance/privacy review remain separate milestone gates.
