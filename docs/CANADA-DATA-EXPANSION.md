# Canada ETF data expansion v1

Status: live data migration applied; branch verification in progress  
Date: 2026-09-20

## Goal

Broaden Investor DNA's Canadian-listed ETF research catalog without turning missing data into estimates and without silently promoting newly added products into a validated DNA Match universe.

## Universe change

The active ETF catalog increased from **40 to 57** Canadian-listed ETFs. The full active cross-asset catalog increased from **55 to 72** instruments.

New issuer coverage:

| Issuer | Added ETFs |
| --- | ---: |
| TD Asset Management Inc. | 10 |
| Global X Investments Canada Inc. | 6 |
| Purpose Investments Inc. | 1 |
| **Total** | **17** |

The ETF catalog now spans six represented ETF issuers rather than three.

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

## Source policy

For every added ETF the migration stores:

- issuer identity;
- dated official ETF Facts URL;
- issuer-disclosed official risk category;
- current issuer-page price/MER/AUM where a dated value was captured;
- Investment DNA structural research profile;
- research profile for Explore / Detail / Compare;
- explicit source and source date.

Missing performance, holdings, exposure or portfolio-characteristic fields remain missing. They are not backfilled with estimates.

Current product-page metrics and regulatory ETF Facts are kept as separate provenance layers so a newer current MER or price does not overwrite the date of an older regulatory snapshot.

## Important cash-product disclosures

CASH and PSA are ETF securities rather than insured bank-deposit accounts. Their research profiles explicitly preserve the issuer disclosure that ETF units are not CDIC insured.

CBIL owns short Government of Canada Treasury bills, but the ETF units themselves are still market-traded fund securities rather than a guaranteed deposit.

## Complex-product disclosures

HXT and HXS retain explicit total-return-swap / counterparty-risk structure in the research layer.

HXQ is represented using its current physical-replication structure rather than its older historical swap structure.

TCOM is marked high complexity at the structural layer because its strategy can use derivatives, short selling and permitted leverage.

## DNA Match boundary

This migration expands **research discovery**, not scientific Match validation.

The new ETFs can appear in Explore / Detail / Compare immediately. They intentionally do not receive fabricated Investment Intelligence, data-quality verification or complexity scores merely to make them rankable.

Until those evidence layers are populated and reviewed, Match treats them as requiring review rather than as validated eligible choices.

## Market-data refresh

The existing post-close Canadian ETF worker remains the price-history mechanism.

The original 40 ETFs completed a 2026-09-19 catch-up. The 17 new ETFs were added on 2026-09-20 with current issuer-page metrics and will enter the existing scheduled TSX price-history path on the next eligible post-close run.

No synthetic price-history freshness date is written in advance.

## Live verification after migration

- active ETFs: 57
- active catalog instruments: 72
- official ETF Facts coverage: 57
- official ETF risk coverage: 57
- new batch official facts: 17 / 17
- new batch official risk: 17 / 17
- new batch structure profiles: 17 / 17
- new batch research profiles: 17 / 17

A second enrichment migration then added issuer-verified performance, income, characteristics, holdings and exposure evidence where the official source exposed a dated value.

Coverage after enrichment:
- 1-year return coverage: 48 instruments (up from 40)
- 3-year return coverage: 47
- 5-year return coverage: 45
- sourced income coverage: 43
- portfolio-characteristics coverage: 45
- complete exposure-set coverage: 16
- full-holdings-detail coverage: 10

New verified performance rows include CASH, CBIL, HXT, HXS, HXQ, AIQ, PSA and TQCD. Fund-age gaps stay null (for example AIQ has no 3-year or 5-year figure yet).

TD current portfolio evidence was also added for TTP, TPU, TDB, TCSH, TGRO, TEQT, TEC, TQCD and THE where the official fund card exposed it. Complex TCOM remains deliberately sparse where no comparable clean statistic was available rather than forcing a synthetic field.

## Migration

Live migration:

`20260920192840_canada_etf_catalog_expansion_v1.sql`
`20260920200107_canada_etf_research_enrichment_v1.sql`
