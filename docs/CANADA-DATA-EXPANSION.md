# Canada ETF data expansion v1

Status: live data migration applied; branch verification in progress  
Date: 2026-09-20

## Goal

Broaden Investor DNA's Canadian-listed ETF research catalog without turning missing data into estimates and without silently promoting newly added products into a validated DNA Match universe.

## Universe change

The active ETF catalog increased from **40 to 73** Canadian-listed ETFs. The full active cross-asset catalog increased from **55 to 88** instruments.

New issuer coverage:

| Issuer | Added ETFs |
| --- | ---: |
| TD Asset Management Inc. | 10 |
| Global X Investments Canada Inc. | 6 |
| Purpose Investments Inc. | 1 |
| Fidelity Investments Canada ULC | 8 |
| Mackenzie Investments | 8 |
| **Total** | **33** |

The ETF catalog now spans eight represented ETF issuers rather than three.

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

The original 40 ETFs completed a 2026-09-19 catch-up. The first 17-ETF TSX expansion and the later 8-ETF Mackenzie TSX wave use the existing `.TO` Yahoo bridge.

Fidelity added eight Cboe Canada ETFs. The worker now resolves `Cboe CA` symbols through Yahoo's `.NE` convention while preserving the same low-priority research-feed boundary. A live FEQT canary fetched and ingested 9/9 bars with zero errors after OHLC precision normalization, and the remaining seven Fidelity ETFs then ingested 63/63 bars with zero errors. The Mackenzie wave ingested 72/72 bars with zero errors.

No synthetic price-history freshness date is written in advance.

## Live verification after migration

- active ETFs: 73
- active catalog instruments: 88
- represented ETF issuers: 8
- official source/facts records: 73
- official risk coverage: 73
- new batch official facts: 17 / 17
- new batch official risk: 17 / 17
- new batch structure profiles: 17 / 17
- new batch research profiles: 17 / 17

A second enrichment migration then added issuer-verified performance, income, characteristics, holdings and exposure evidence where the official source exposed a dated value.

Coverage after the TD / Global X / Purpose enrichment, Fidelity wave, and Mackenzie wave:
- 1-year return coverage: 64 instruments
- 3-year return coverage: 58
- 5-year return coverage: 54
- sourced income coverage: 44
- portfolio-characteristics coverage: 50
- complete exposure-set coverage: 28
- full-holdings-detail coverage: 18

New verified performance rows include CASH, CBIL, HXT, HXS, HXQ, AIQ, PSA and TQCD. Fund-age gaps stay null (for example AIQ has no 3-year or 5-year figure yet).

TD current portfolio evidence was also added for TTP, TPU, TDB, TCSH, TGRO, TEQT, TEC, TQCD and THE where the official fund card exposed it. Complex TCOM remains deliberately sparse where no comparable clean statistic was available rather than forcing a synthetic field.

## Migration

Live migration:

`20260920192840_canada_etf_catalog_expansion_v1.sql`
`20260920200107_canada_etf_research_enrichment_v1.sql`


## Fidelity Canada wave

Eight Cboe Canada ETFs were added with official Fidelity identity, current issuer-page metrics, official risk classification, standard-period NAV performance, complete strategic allocation evidence, and underlying-fund holdings where exposed by Fidelity. Fund-age gaps remain null instead of being extrapolated.

The Fidelity all-in-one products retain their small cryptocurrency sleeves explicitly in the research layer. That exposure does not disappear inside an equity/fixed-income simplification.

## Mackenzie wave

Eight Mackenzie TSX ETFs were added from two groups:

- core index exposure: QCN, QUU, QDX, QBB;
- allocation suite: MCON, MBAL, MGRW, MEQT.

The August 2026 official Mackenzie ETF roadmap supplies current management-fee, distribution-frequency and standardized risk labels. Mackenzie's official August 31, 2026 performance table supplies historical returns. Dated official fund profiles supply portfolio characteristics and complete exposure sets for the four core ETFs. The allocation suite stores issuer-published target allocations as target allocations, rather than pretending target weights are current holdings.

## Additional live migrations

`20260920203737_canada_fidelity_core_etf_wave_v1.sql`  
`20260920203821_canada_fidelity_core_etf_enrichment_v1.sql`  
`20260920204052_extend_free_market_data_to_cboe_ca.sql`  
`20260920204655_canada_mackenzie_core_allocation_wave_v1.sql`
