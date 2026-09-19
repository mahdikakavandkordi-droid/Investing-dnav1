create table public.investment_official_risk_ratings (
  investment_id uuid primary key references public.investments(id) on delete cascade,
  official_risk_rating text not null check (official_risk_rating in ('Low','Low to Medium','Medium','Medium to High','High')),
  band_min numeric not null check (band_min >= 0 and band_min <= 100),
  band_max numeric not null check (band_max >= 0 and band_max <= 100 and band_max >= band_min),
  issuer text not null,
  source_type text not null,
  source_title text not null,
  source_url text not null,
  source_date date,
  effective_date date,
  methodology text not null default 'Canadian issuer risk rating disclosed under the CSA investment risk classification framework (NI 81-102).',
  verification_note text,
  verified_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.investment_official_risk_ratings is 'Issuer-disclosed Canadian ETF risk ratings; source-of-truth regulatory disclosure values separate from proprietary Investment DNA signals.';

insert into public.investment_official_risk_ratings(investment_id,official_risk_rating,band_min,band_max,issuer,source_type,source_title,source_url,source_date,effective_date,verification_note)
select i.id,x.rating,x.band_min,x.band_max,x.issuer,x.source_type,x.source_title,x.source_url,x.source_date,x.effective_date,x.note
from public.investments i join (values
 ('VBAL','Low to Medium',20::numeric,40::numeric,'Vanguard Investments Canada Inc.','ETF Facts','Vanguard Balanced ETF Portfolio — ETF Facts','https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf','2026-07-16'::date,'2026-07-16'::date,'Current issuer ETF Facts.'),
 ('VCN','Medium',40,60,'Vanguard Investments Canada Inc.','ETF Facts + current issuer audit','Vanguard FTSE Canada All Cap Index ETF — ETF Facts','https://fund-docs.vanguard.com/VCN_FTSE_Canada_All_Cap_Index_ETF_ETF_9561_EN_FACTS.pdf','2025-06-20'::date,'2025-06-20'::date,'Issuer ETF Facts rates Medium; Vanguard July 29, 2026 risk-rating changes did not include VCN.'),
 ('VCNS','Low to Medium',20,40,'Vanguard Investments Canada Inc.','Issuer risk-rating change notice','Vanguard Announces Change to Risk Rating of Certain Vanguard ETFs','https://www.vanguard.ca/content/dam/intl/americas/canada/en/documents/PR-07-29-2026-Risk-Rating-Changes-E.pdf','2026-07-29'::date,'2026-07-30'::date,'Changed from Low to Low to Medium effective July 30, 2026.'),
 ('VEQT','Medium',40,60,'Vanguard Investments Canada Inc.','ETF Facts','Vanguard All-Equity ETF Portfolio — ETF Facts','https://fund-docs.vanguard.com/VEQT_All_Equity_ETF_Portfolio_ETF_9692_EN_FACTS.pdf','2026-07-16'::date,'2026-07-16'::date,'Current issuer ETF Facts.'),
 ('VFV','Medium',40,60,'Vanguard Investments Canada Inc.','ETF Facts','Vanguard S&P 500 Index ETF — ETF Facts','https://fund-docs.vanguard.com/VFV_SnP_500_Index_ETF_ETF_9563_EN_FACTS.pdf','2026-07-16'::date,'2026-07-16'::date,'Current issuer ETF Facts.'),
 ('VGRO','Low to Medium',20,40,'Vanguard Investments Canada Inc.','ETF Facts','Vanguard Growth ETF Portfolio — ETF Facts','https://fund-docs.vanguard.com/VGRO_Growth_ETF_Portfolio_ETF_9579_EN_FACTS.pdf','2026-07-16'::date,'2026-07-16'::date,'Current issuer ETF Facts.'),
 ('VUN','Medium',40,60,'Vanguard Investments Canada Inc.','ETF Facts','Vanguard Morningstar U.S. Total Market Index ETF — ETF Facts','https://fund-docs.vanguard.com/ETF-Facts-VUN-VUS-E.pdf','2026-07-29'::date,'2026-07-29'::date,'Current issuer ETF Facts.'),
 ('XBAL','Low to Medium',20,40,'BlackRock Asset Management Canada Limited','ETF Facts','iShares Core Balanced ETF Portfolio — ETF Facts','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xbal-facts-en-ca.pdf','2026-06-19'::date,'2026-06-19'::date,'Current issuer ETF Facts.'),
 ('XGRO','Low to Medium',20,40,'BlackRock Asset Management Canada Limited','ETF Facts','iShares Core Growth ETF Portfolio — ETF Facts','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xgro-facts-en-ca.pdf','2026-06-19'::date,'2026-06-19'::date,'Current issuer ETF Facts.'),
 ('XEQT','Medium',40,60,'BlackRock Asset Management Canada Limited','ETF Facts','iShares Core Equity ETF Portfolio — ETF Facts','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xeqt-facts-en-ca.pdf','2026-06-19'::date,'2026-06-19'::date,'Current issuer ETF Facts.'),
 ('XIC','Medium',40,60,'BlackRock Asset Management Canada Limited','ETF Facts','iShares Core S&P/TSX Capped Composite Index ETF — ETF Facts','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xic-facts-en-ca.pdf','2026-06-19'::date,'2026-06-19'::date,'Current issuer ETF Facts.'),
 ('XUU','Medium',40,60,'BlackRock Asset Management Canada Limited','ETF Facts','iShares Core S&P U.S. Total Market Index ETF — ETF Facts','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xuu-facts-en-ca.pdf','2026-06-19'::date,'2026-06-19'::date,'Current issuer ETF Facts.'),
 ('ZAG','Low',0,20,'BMO Asset Management Inc.','ETF Facts','BMO Aggregate Bond Index ETF — ETF Facts','https://fundfacts.bmo.com/EtfEnglish/BMO_Aggregate_Bond_Index_ETF-EN-CAD_Units.pdf','2026-01-23'::date,'2026-01-23'::date,'Current issuer ETF Facts.'),
 ('ZBAL','Low to Medium',20,40,'BMO Asset Management Inc.','ETF Facts','BMO Balanced ETF — ETF Facts','https://fundfacts.bmo.com/EtfEnglish/BMO_Balanced_ETF-EN-CAD_Units.pdf','2026-01-23'::date,'2026-01-23'::date,'Current issuer ETF Facts.'),
 ('ZCN','Medium',40,60,'BMO Asset Management Inc.','ETF Facts','BMO S&P/TSX Capped Composite Index ETF — ETF Facts','https://fundfacts.bmo.com/EtfEnglish/BMO_S%26P_TSX_Capped_Composite_Index_ETF-EN-CAD_Units.pdf','2026-01-23'::date,'2026-01-23'::date,'Current issuer ETF Facts.'),
 ('ZSP','Medium',40,60,'BMO Asset Management Inc.','ETF Facts','BMO S&P 500 Index ETF — ETF Facts','https://fundfacts.bmo.com/EtfEnglish/BMO_S%26P_500_Index_ETF-EN-CAD_Units.pdf','2026-01-23'::date,'2026-01-23'::date,'Current issuer ETF Facts.')
) x(symbol,rating,band_min,band_max,issuer,source_type,source_title,source_url,source_date,effective_date,note) on i.symbol=x.symbol;

create or replace view public.v_investment_dna_v1 as
select i.id investment_id,i.symbol,i.name,i.asset_type,i.category,i.subcategory,
 s.model_version suitability_model_version,
 coalesce(orisk.official_risk_rating,s.risk_band) risk_band,
 s.normalized_risk_score risk_score,
 s.growth_score,s.income_score,ip.stability_score,s.diversification_score,s.liquidity_score,ip.complexity_score,
 s.minimum_horizon_months,s.concentration_level,s.geographic_scope,s.currency_exposure,
 sc.equity_pct,sc.fixed_income_pct,sc.mer_pct,sc.data_quality_status,sc.data_quality_score,
 ip.style_class,ip.objective_class,ip.ideal_investor,ip.best_use_cases,ip.key_tradeoffs,ip.explanation,
 greatest(coalesce(s.as_of_date,'1900-01-01'::date),coalesce(ip.as_of_date,'1900-01-01'::date),coalesce(orisk.source_date,'1900-01-01'::date)) as as_of_date,
 orisk.official_risk_rating,orisk.band_min official_risk_band_min,orisk.band_max official_risk_band_max,
 orisk.issuer official_risk_issuer,orisk.source_type official_risk_source_type,orisk.source_title official_risk_source_title,
 orisk.source_url official_risk_source_url,orisk.source_date official_risk_source_date,orisk.effective_date official_risk_effective_date,
 orisk.methodology official_risk_methodology,orisk.verification_note official_risk_verification_note,orisk.verified_at official_risk_verified_at
from public.investments i
left join lateral (select x.* from public.investment_suitability_profiles_v2 x where x.investment_id=i.id order by x.updated_at desc nulls last,x.created_at desc nulls last limit 1) s on true
left join lateral (select x.* from public.investment_intelligence_profiles x where x.investment_id=i.id order by x.updated_at desc nulls last,x.created_at desc nulls last limit 1) ip on true
left join public.v_investment_screener sc on sc.id=i.id
left join public.investment_official_risk_ratings orisk on orisk.investment_id=i.id
where i.is_active=true;
