create table if not exists public.investment_official_facts (
  investment_id uuid primary key references public.investments(id) on delete cascade,
  source_name text not null,
  product_url text,
  etf_facts_url text not null,
  etf_facts_date date,
  management_fee_pct numeric,
  mer_pct numeric,
  fee_source_note text,
  verified_at timestamptz not null default now()
);

alter table public.investment_official_facts enable row level security;

grant select on public.investment_official_facts to anon, authenticated;

insert into public.investment_official_facts(investment_id,source_name,product_url,etf_facts_url,etf_facts_date,management_fee_pct,mer_pct,fee_source_note,verified_at)
select i.id,v.source_name,v.product_url,v.etf_facts_url,v.etf_facts_date::date,v.management_fee_pct,v.mer_pct,v.fee_source_note,now()
from (values
 ('VBAL','Vanguard Canada','https://www.vanguard.ca/en/product/etf/asset-allocation/9578/vanguard-balanced-etf-portfolio','https://fund-docs.vanguard.com/VBAL_Balanced_ETF_Portfolio_ETF_9578_EN_FACTS.pdf','2026-07-16',0.17,0.22,'Management fee is current; MER is the issuer-reported figure and can lag a recent fee cut.'),
 ('VCNS','Vanguard Canada','https://www.vanguard.ca/en/product/etf/asset-allocation/9577/vanguard-conservative-etf-portfolio','https://fund-docs.vanguard.com/9577-a-en-US_20260730.pdf','2026-07-30',0.17,0.22,'Management fee is current; MER is the issuer-reported figure and can lag a recent fee cut.'),
 ('VGRO','Vanguard Canada','https://www.vanguard.ca/en/product/etf/asset-allocation/9579/vanguard-growth-etf-portfolio','https://fund-docs.vanguard.com/VGRO_Growth_ETF_Portfolio_ETF_9579_EN_FACTS.pdf','2026-07-16',0.17,0.22,'Management fee is current; MER is the issuer-reported figure and can lag a recent fee cut.'),
 ('VEQT','Vanguard Canada','https://www.vanguard.ca/en/product/etf/asset-allocation/9692/vanguard-all-equity-etf-portfolio','https://fund-docs.vanguard.com/VEQT_All_Equity_ETF_Portfolio_ETF_9692_EN_FACTS.pdf','2026-07-16',0.17,0.22,'Management fee is current; MER is the issuer-reported figure and can lag a recent fee cut.'),
 ('VCN','Vanguard Canada','https://www.vanguard.ca/en/product/etf/equity/9561/vanguard-ftse-canada-all-cap-index-etf','https://fund-docs.vanguard.com/VCN_FTSE_Canada_All_Cap_Index_ETF_ETF_9561_EN_FACTS.pdf','2026-07-16',0.05,0.05,'Current issuer product page values.'),
 ('VFV','Vanguard Canada','https://www.vanguard.ca/en/product/etf/equity/9563/vanguard-sp-500-index-etf','https://fund-docs.vanguard.com/VFV_SnP_500_Index_ETF_ETF_9563_EN_FACTS.pdf','2026-07-16',0.08,0.08,'Current issuer product page values.'),
 ('VUN','Vanguard Canada','https://www.vanguard.ca/en/product/etf/equity/9557/vanguard-us-total-market-index-etf','https://fund-docs.vanguard.com/ETF-Facts-VUN-VUS-E.pdf','2026-07-29',0.15,0.16,'Current issuer product page values.'),
 ('XBAL','BlackRock Canada','https://www.blackrock.com/ca/investors/en/products/239449/ishares-balanced-income-coreportfoliotm-fund','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xbal-facts-en-ca.pdf','2026-06-19',0.17,0.18,'Current issuer product page values.'),
 ('XGRO','BlackRock Canada','https://www.blackrock.com/ca/investors/en/products/239447/ishares-core-growth-etf-portfolio','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xgro-facts-en-ca.pdf','2026-06-19',0.17,0.19,'Current issuer product page values.'),
 ('XEQT','BlackRock Canada','https://www.blackrock.com/ca/investors/en/products/309480/ishares-core-equity-etf-portfolio-fund','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xeqt-facts-en-ca.pdf','2026-06-19',0.17,0.19,'Current issuer product page values.'),
 ('XIC','BlackRock Canada','https://www.blackrock.com/ca/investors/en/products/239837/ishares-sptsx-capped-composite-index-etf','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xic-facts-en-ca.pdf','2026-06-19',0.05,0.06,'Current issuer product page values.'),
 ('XUU','BlackRock Canada','https://www.blackrock.com/ca/investors/en/products/272104/ishares-core-sp-us-total-market-index-etf','https://www.blackrock.com/ca/investors/en/literature/etf-summary/xuu-facts-en-ca.pdf','2026-06-19',0.07,0.07,'Current issuer product page values.'),
 ('ZAG','BMO Asset Management','https://fundfacts.bmo.com/EtfEnglish/','https://fundfacts.bmo.com/EtfEnglish/BMO_Aggregate_Bond_Index_ETF-EN-CAD_Units.pdf','2026-01-23',0.08,0.09,'Management fee from BMO fee notice; MER from latest ETF Facts.'),
 ('ZBAL','BMO Asset Management','https://fundfacts.bmo.com/EtfEnglish/','https://fundfacts.bmo.com/EtfEnglish/BMO_Balanced_ETF-EN-CAD_Units.pdf','2026-01-23',0.15,0.20,'ETF Facts reports an adjusted MER of 0.17% after the 2025 fee reduction; statutory MER shown here is 0.20%.'),
 ('ZCN','BMO Asset Management','https://fundfacts.bmo.com/EtfEnglish/','https://fundfacts.bmo.com/EtfEnglish/BMO_S%26P_TSX_Capped_Composite_Index_ETF-EN-CAD_Units.pdf','2026-01-23',0.05,0.06,'Management fee from issuer fee schedule; MER from latest ETF Facts.'),
 ('ZSP','BMO Asset Management','https://fundfacts.bmo.com/EtfEnglish/','https://fundfacts.bmo.com/EtfEnglish/BMO_S%26P_500_Index_ETF-EN-CAD_Units.pdf','2026-01-23',0.08,0.09,'Management fee from issuer fee schedule; MER from latest ETF Facts.')
) as v(symbol,source_name,product_url,etf_facts_url,etf_facts_date,management_fee_pct,mer_pct,fee_source_note)
join public.investments i on i.symbol=v.symbol
on conflict (investment_id) do update set
 source_name=excluded.source_name,
 product_url=excluded.product_url,
 etf_facts_url=excluded.etf_facts_url,
 etf_facts_date=excluded.etf_facts_date,
 management_fee_pct=excluded.management_fee_pct,
 mer_pct=excluded.mer_pct,
 fee_source_note=excluded.fee_source_note,
 verified_at=excluded.verified_at;

create or replace function public.app_get_official_fund_facts(p_investment_id uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select jsonb_build_object(
    'investment_id',i.id,
    'symbol',i.symbol,
    'source_name',f.source_name,
    'product_url',f.product_url,
    'etf_facts_url',f.etf_facts_url,
    'etf_facts_date',f.etf_facts_date,
    'management_fee_pct',f.management_fee_pct,
    'mer_pct',f.mer_pct,
    'fee_source_note',f.fee_source_note,
    'verified_at',f.verified_at,
    'summary',p.profile_summary,
    'objective',p.objective,
    'asset_mix',p.target_allocation,
    'management_style',p.management_style,
    'distribution_policy',p.distribution_policy
  )
  from public.investments i
  join public.investment_official_facts f on f.investment_id=i.id
  left join lateral (
    select ip.* from public.investment_profiles ip where ip.investment_id=i.id order by ip.as_of_date desc nulls last, ip.updated_at desc limit 1
  ) p on true
  where i.id=p_investment_id
  limit 1;
$$;

grant execute on function public.app_get_official_fund_facts(uuid) to anon, authenticated;