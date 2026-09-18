# Product Risk DNA Publication Log

## 2026-09-18 — First reviewed publication set

This entry records the first Product Risk DNA profiles promoted from research shadow drafts to consumer-visible published profiles.

Publication policy used:
- profile must be `evidence_ready_for_review`
- all four consumer dimensions must be present
- no Unknown dimension
- overall confidence must be High
- evidence must be traceable to official issuer or official deposit-insurance sources
- published profiles remain stable while later draft refreshes continue in shadow mode

### Published ETFs

| Symbol | Investment | Overall Risk | Confidence | Primary evidence | Review notes |
|---|---|---|---|---|---|
| ZDV | BMO Canadian Dividend ETF | Medium | High | BMO ETF Facts dated 2026-01-23; official BMO Road Map / issuer data | Official BMO risk rating Medium; 61 holdings; 0.06% average bid-ask spread |
| ZEB | BMO Equal Weight Banks Index ETF | Medium to High | High | BMO ETF Facts dated 2026-01-23; official BMO issuer data | Official BMO risk rating Medium to High; 6 bank holdings; 0.02% spread; Financials concentration flag retained |
| ZFL | BMO Long Federal Bond Index ETF | Low to Medium | High | BMO ETF Facts dated 2026-01-23; official BMO Road Map | Official BMO risk rating Medium; 23 holdings; 0.10% spread; long-duration/rate-sensitivity flag retained |
| ZRE | BMO Equal Weight REITs Index ETF | Medium to High | High | BMO ETF Facts dated 2026-01-23; official BMO issuer data | Official BMO risk rating Medium to High; 21 holdings; 0.09% spread; Real Estate concentration flag retained |

### Published GICs

| Symbol | Investment | Overall Risk | Confidence | Primary evidence | Review notes |
|---|---|---|---|---|---|
| RBC-GIC-1Y-CASH | RBC 1-Year Cashable GIC | Low | High | RBC Royal Bank Guaranteed-Return GIC product information; CDIC GIC eligibility guidance | 1-year term; cashable; medium access; CDIC eligibility qualifier retained |
| RBC-GIC-1Y-NR | RBC 1-Year Non-Redeemable GIC | Low | High | RBC Royal Bank Guaranteed-Return GIC product information; CDIC guidance | 1-year term; non-redeemable; locked-until-maturity flag retained |
| RBC-GIC-3Y-RED | RBC 3-Year Redeemable GIC | Low | High | RBC Royal Bank Guaranteed-Return GIC product information; CDIC guidance | 3-year term; redeemable at reduced rate; medium access |
| RBC-GIC-5Y-NR | RBC 5-Year Non-Redeemable GIC | Low | High | RBC Royal Bank Guaranteed-Return GIC product information; CDIC guidance | 5-year term; non-redeemable; locked-until-maturity flag retained |

### Runtime verification

After publication:
- `public.app_get_product_risk(...)` returned `status=available` for all eight profiles
- each published profile returned four consumer dimensions
- all eight profiles report `calibration_status=reviewed`
- all eight profiles report `publication_status=published`
- remaining Product Risk profiles stayed in draft/shadow mode

Live profile counts immediately after publication:
- published: 8
- draft: 47

No other Product Risk profile was promoted by this review.


## 2026-09-18 — Second reviewed publication set: iShares cohort

This entry records the second controlled publication set after the BlackRock/iShares spread-evidence migration. All 17 candidates passed the publication gate before promotion:

- review queue state: `evidence_ready_for_review`
- profile confidence: High
- all four consumer dimensions present and High confidence
- no Unknown/N/A dimension
- official risk source: BlackRock Canada ETF Facts dated 2026-06-19
- ETF Facts URL and official-risk source URL aligned
- source-backed bid-ask spread evidence present for the 12 months ending 2026-04-30
- publication performed only after the exact 17/17 readiness assertion passed

| Symbol | Investment | Product Risk | Official issuer risk | Spread | Review note |
|---|---|---|---|---:|---|
| XAW | iShares Core MSCI All Country World ex Canada Index ETF | Medium | Medium | 0.03% | Broad global ex-Canada exposure |
| XBAL | iShares Core Balanced ETF Portfolio | Low to Medium | Low to Medium | 0.04% | Broad balanced fund-of-funds exposure |
| XCB | iShares Core Canadian Corporate Bond Index ETF | Low | Low | 0.05% | Corporate bond exposure; duration evidence retained |
| XEC | iShares Core MSCI Emerging Markets IMI Index ETF | Medium | Medium | 0.06% | Broad emerging-markets equity exposure |
| XEF | iShares Core MSCI EAFE IMI Index ETF | Medium | Medium | 0.03% | Broad developed ex-North-America exposure |
| XEI | iShares S&P/TSX Composite High Dividend Index ETF | Medium | Medium | 0.04% | Dividend-focused Canadian equity exposure |
| XEQT | iShares Core Equity ETF Portfolio | Medium | Medium | 0.03% | Broad all-equity fund-of-funds exposure |
| XGRO | iShares Core Growth ETF Portfolio | Low to Medium | Low to Medium | 0.04% | Growth-oriented diversified fund-of-funds exposure |
| XIC | iShares Core S&P/TSX Capped Composite Index ETF | Medium | Medium | 0.03% | Broad Canadian equity exposure |
| XIT | iShares S&P/TSX Capped Information Technology Index ETF | High | High | 0.16% | Technology-sector concentration flag retained |
| XIU | iShares S&P/TSX 60 Index ETF | Medium | Medium | 0.02% | Large-cap Canadian equity exposure |
| XRE | iShares S&P/TSX Capped REIT Index ETF | Medium to High | Medium to High | 0.08% | Real-estate concentration flag retained |
| XSB | iShares Core Canadian Short Term Bond Index ETF | Low | Low | 0.04% | Short-duration bond evidence retained |
| XSH | iShares Core Canadian Short Term Corporate Bond Index ETF | Low | Low | 0.06% | Short-duration corporate bond evidence retained |
| XSP | iShares Core S&P 500 Index ETF (CAD-Hedged) | Medium | Medium | 0.02% | CAD-hedged U.S. large-cap equity exposure |
| XUS | iShares Core S&P 500 Index ETF | Medium | Medium | 0.03% | U.S. large-cap equity exposure |
| XUU | iShares Core S&P U.S. Total Market Index ETF | Medium | Medium | 0.03% | Broad U.S. total-market exposure |

### Runtime verification

After publication:
- published Product Risk profiles: **25**
- remaining shadow drafts: **30**
- `public.app_get_product_risk(...)` returned `status=available` for all 17 iShares profiles
- all 17 returned four consumer dimensions
- no RPC failures were observed in the cohort verification

Publication migration:
- `20260918115536_publish_second_reviewed_product_risk_ishares_set.sql`
