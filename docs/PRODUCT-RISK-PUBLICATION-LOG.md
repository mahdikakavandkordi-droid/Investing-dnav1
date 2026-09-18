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
