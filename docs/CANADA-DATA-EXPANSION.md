# Canada ETF data expansion

Status: live migrations applied; exact-head verification in progress  
Date: 2026-09-20

## Goal

Broaden Investor DNA's Canadian-listed ETF research catalog with issuer-backed evidence without inventing missing fields and without silently promoting new products into a validated DNA Match universe.

## Universe change

The active ETF catalog increased from **40 to 79** Canadian-listed ETFs. The full active cross-asset catalog increased from **55 to 94** instruments.

The ETF catalog now spans **9 issuers**:

| Issuer | Active ETFs |
| --- | ---: |
| BlackRock Canada | 17 |
| Vanguard Canada | 15 |
| TD Asset Management Inc. | 10 |
| BMO Global Asset Management | 8 |
| Fidelity Investments Canada ULC | 8 |
| Mackenzie Investments | 8 |
| Global X Investments Canada Inc. | 6 |
| RBC Global Asset Management Inc. | 6 |
| Purpose Investments Inc. | 1 |
| **Total** | **79** |

The Sprint 6 Canada work added **39 ETFs** to the original 40-ETF universe.

## Added symbols

TD Asset Management:
- TTP — TD Canadian Equity Index ETF
- TPU — TD U.S. Equity Index ETF
- TDB — TD Canadian Aggregate Bond Index ETF
- TCSH — TD Cash Management ETF
- TGRO — TD Growth ETF Portfolio
- TEQT — TD All-Equity ETF Portfolio
- TEC — TD Global Technology Leaders Index ETF
- TQCD — TD Q Canadian Dividend ETF
- THE — TD International Equity CAD Hedged Index ETF
- TCOM — TD Alternative Commodities Pool ETF

Global X:
- CASH — Global X High Interest Savings ETF
- CBIL — Global X 0-3 Month T-Bill ETF
- HXT — Global X S&P/TSX 60 Index Corporate Class ETF
- HXS — Global X S&P 500 Index Corporate Class ETF
- HXQ — Global X Nasdaq-100 Index Corporate Class ETF
- AIQ — Global X Artificial Intelligence & Technology Index ETF

Purpose:
- PSA — Purpose High Interest Savings Fund

Fidelity Canada:
- FEQT — Fidelity All-in-One Equity ETF
- FGRO — Fidelity All-in-One Growth ETF
- FBAL — Fidelity All-in-One Balanced ETF
- FCNS — Fidelity All-in-One Conservative ETF
- FFIX — Fidelity All-in-One Fixed Income ETF
- FCCA — Fidelity All-Canadian Equity ETF
- FCAM — Fidelity All-American Equity ETF
- FCIN — Fidelity All-International Equity ETF

Mackenzie:
- QCN — Mackenzie Canadian Equity Index ETF
- QUU — Mackenzie US Large Cap Equity Index ETF
- QDX — Mackenzie International Equity Index ETF
- QBB — Mackenzie Canadian Aggregate Bond Index ETF
- MCON — Mackenzie Conservative Allocation ETF
- MBAL — Mackenzie Balanced Allocation ETF
- MGRW — Mackenzie Growth Allocation ETF
- MEQT — Mackenzie All-Equity Allocation ETF

RBC Global Asset Management:
- RCAN — RBC Canadian Equity ETF
- RUSA — RBC U.S. Large-Cap Equity ETF
- RCD — RBC Quant Canadian Dividend Leaders ETF
- RID — RBC Quant EAFE Dividend Leaders ETF
- RBNK — RBC Canadian Bank Yield Index ETF
- RUST — RBC Canadian Ultra Short Term Bond ETF

## Source policy

Every added ETF has a canonical investment identity, issuer provenance, official issuer source, official risk classification, an Investment DNA structural research profile, and an Explore / Detail / Compare research profile.

Dated performance, fees, holdings, exposures, portfolio characteristics and income are stored only when the official issuer source supports the field. Missing values stay null. Fund-age gaps are not extrapolated.

Current issuer-page observations and dated regulatory / fund-profile evidence are kept as separate provenance layers so a newer current metric never rewrites the date of an older regulatory snapshot.

## Research coverage after all Canada waves

Current live coverage across the 94-instrument catalog:

- official source/facts coverage: **79**
- official risk coverage: **79**
- 1-year return coverage: **64**
- 3-year return coverage: **58**
- 5-year return coverage: **54**
- sourced income coverage: **44**
- portfolio-characteristics coverage: **55**
- complete exposure-set coverage: **36**
- full-holdings-detail coverage: **20**

The lower historical-return counts are intentional. Newer funds such as AIQ, FFIX, FCCA, FCAM, FCIN, RCAN, RUSA and RUST do not receive synthetic 3-year or 5-year histories.

## Important product disclosures

CASH and PSA are ETF securities rather than insured bank deposits. Their research profiles preserve the issuer disclosure that ETF units are not CDIC insured.

CBIL owns short Government of Canada Treasury bills, but the ETF units remain market-traded fund securities rather than guaranteed deposits.

HXT and HXS retain total-return-swap / counterparty-risk structure in the research layer. HXQ is represented using its current physical-replication structure. TCOM remains high complexity because its strategy can use derivatives, short selling and permitted leverage.

Fidelity all-in-one ETFs retain their small cryptocurrency sleeves explicitly in the research layer rather than being simplified into equity / fixed-income only.

RBNK is explicitly treated as a concentrated six-bank Canadian equity ETF. RUST is treated as ultra-short corporate fixed income, not as cash or a guaranteed principal product.

## Fidelity Canada wave

Eight Cboe Canada ETFs were added from official Fidelity sources with issuer risk, standard-period NAV performance, strategic allocation evidence and underlying holdings where exposed.

The market worker was extended from TSX-only symbols to support Cboe Canada using the low-priority Yahoo research bridge:
- TSX -> `.TO`
- Cboe Canada -> `.NE`

A live FEQT canary initially exposed a harmless Yahoo OHLC floating-point envelope mismatch. The worker now normalizes the OHLC envelope and propagates ingestion row errors correctly.

Verification after the fix:
- FEQT: **9 fetched / 9 ingested / 0 errors**
- remaining seven Fidelity ETFs: **63 fetched / 63 ingested / 0 errors**

## Mackenzie wave

Eight Mackenzie ETFs were added: four core index exposures and four one-ticket allocation ETFs.

The official Mackenzie August 2026 roadmap is the current risk / management-fee reference. The official August 31, 2026 performance table provides the current historical-return evidence. Dated official fund profiles provide portfolio characteristics and exposure evidence.

An overlapping migration temporarily created a duplicate legal-name issuer row. A normalization migration moved all eight ETFs back to the canonical **Mackenzie Investments** issuer identity, removed the unused duplicate issuer, and restored the current August 2026 risk provenance.

## RBC GAM wave

Six RBC GAM ETFs were added from official RBC ETF Facts and product pages.

Key evidence boundaries:
- RCAN and RUSA are new 2026 ETFs. Their ETF Facts identify the published risk rating as an estimate for a new fund; missing long history remains null.
- RCD and RID retain their current issuer risk, sector evidence and sourced long-run performance evidence.
- RBNK has full six-bank holdings coverage and a **Medium to High** official risk classification.
- RUST is a **Low** risk ultra-short corporate bond ETF, but its units are not treated as principal-guaranteed.

## Market-data refresh

The temporary zero-cost Yahoo route remains a low-priority research feed. It cannot overwrite a higher-priority verified issuer/internal price row.

The original 40 TSX ETFs completed their catch-up before this Sprint 6 expansion. New waves then entered the same audited worker.

Latest Mackenzie + RBC backfill:
- due instruments: **14**
- bars fetched: **54**
- bars ingested: **54**
- skipped: **0**
- errors: **0**

The live `market-data-refresh` Edge Function is ACTIVE with TSX and Cboe Canada support.

Browser research now reads the latest canonical audited price-history row when it is newer than the slower metadata snapshot. This means newly added ETFs show their current research-feed price without copying an unofficial quote into issuer metadata. Official MER remains the fallback only when an issuer-disclosed MER actually exists; management fee is not mislabeled as MER. RBC browser rows now also expose their sourced risk label and monthly distribution frequency.

No synthetic market-history freshness date is written before the worker actually succeeds.

## DNA Match boundary

This expansion strengthens **research discovery**, not scientific Match validation.

The new ETFs can appear in Explore / Detail / Compare with sourced research fields. They do not receive fabricated Investment Intelligence, data-quality verification or compatibility scores merely to make them rankable.

Match eligibility remains a separate evidence-review step.

## Live migrations

- `20260920192840_canada_etf_catalog_expansion_v1.sql`
- `20260920200107_canada_etf_research_enrichment_v1.sql`
- `20260920203737_canada_fidelity_core_etf_wave_v1.sql`
- `20260920203821_canada_fidelity_core_etf_enrichment_v1.sql`
- `20260920204052_extend_free_market_data_to_cboe_ca.sql`
- `20260920204655_canada_mackenzie_core_allocation_wave_v1.sql`
- `20260920214232_canada_mackenzie_core_etf_wave_v1.sql`
- `20260920214411_canada_rbc_core_etf_wave_v1.sql`
- `20260920214539_normalize_mackenzie_issuer_and_risk_provenance.sql`
- `20260920215105_surface_canonical_prices_and_rbc_browser_metrics.sql`

## Regression

`supabase/tests/canada_etf_catalog_expansion.sql` now verifies:

- 79 active ETFs / 94 active instruments / 9 ETF issuers;
- the original TD / Global X / Purpose evidence;
- Fidelity, Mackenzie and RBC evidence-layer completeness;
- canonical Mackenzie issuer normalization;
- RBNK concentration / official risk evidence;
- Cboe Canada market routing;
- actual market-history presence for all 22 Fidelity + Mackenzie + RBC additions;
- current research coverage floors.

The live SQL regression completes without error.
