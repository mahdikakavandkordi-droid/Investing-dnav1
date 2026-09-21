-- V1 mutual-fund product foundation.
-- First curated wave uses official RBC GAM Series A profiles and preserves
-- source dates independently from the daily NAV feed.

create table if not exists public.investment_mutual_fund_terms (
  investment_id uuid primary key references public.investments(id) on delete cascade,
  series_name text not null,
  fund_code text not null,
  cifsc_category text,
  load_structure text,
  sales_status text,
  minimum_initial_investment numeric,
  minimum_additional_investment numeric,
  income_distribution_frequency text,
  capital_gains_distribution_frequency text,
  source_name text not null,
  source_url text not null,
  as_of_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.investment_mutual_fund_terms enable row level security;
revoke all on public.investment_mutual_fund_terms from public, anon, authenticated;
grant all on public.investment_mutual_fund_terms to service_role;

insert into public.investments(
 symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,country_code,currency,exchange,description,inception_date,is_active,is_featured,data_status
)
values
 ('RBF461','RBC Select Conservative Portfolio - Series A','RBC Select Conservative Portfolio - Series A','MUTUAL_FUND',(select id from public.investment_issuers where name='RBC Global Asset Management Inc.'),'Balanced','Global Fixed Income Balanced','Actively managed fund-of-funds with an income and moderate-growth mandate','Global','CA','CAD','FUND','A diversified Canadian mutual fund portfolio with a fixed-income emphasis and global equity exposure.','1986-12-31',true,true,'verified_partial'),
 ('RBF460','RBC Select Balanced Portfolio - Series A','RBC Select Balanced Portfolio - Series A','MUTUAL_FUND',(select id from public.investment_issuers where name='RBC Global Asset Management Inc.'),'Balanced','Global Neutral Balanced','Actively managed balanced fund-of-funds','Global','CA','CAD','FUND','A diversified Canadian mutual fund portfolio balancing long-term growth with modest income.','1986-12-31',true,true,'verified_partial'),
 ('RBF459','RBC Select Growth Portfolio - Series A','RBC Select Growth Portfolio - Series A','MUTUAL_FUND',(select id from public.investment_issuers where name='RBC Global Asset Management Inc.'),'Balanced','Global Equity Balanced','Actively managed growth-oriented fund-of-funds','Global','CA','CAD','FUND','A diversified Canadian mutual fund portfolio emphasizing global equities with a smaller defensive allocation.','1986-12-31',true,true,'verified_partial')
on conflict (symbol,exchange) do update set
 name=excluded.name,legal_name=excluded.legal_name,asset_type=excluded.asset_type,issuer_id=excluded.issuer_id,category=excluded.category,subcategory=excluded.subcategory,
 strategy=excluded.strategy,region=excluded.region,country_code=excluded.country_code,currency=excluded.currency,description=excluded.description,
 inception_date=excluded.inception_date,is_active=excluded.is_active,is_featured=excluded.is_featured,data_status=excluded.data_status,updated_at=now();

insert into public.investment_mutual_fund_terms(
 investment_id,series_name,fund_code,cifsc_category,load_structure,sales_status,minimum_initial_investment,minimum_additional_investment,
 income_distribution_frequency,capital_gains_distribution_frequency,source_name,source_url,as_of_date
)
values
 ((select id from public.investments where symbol='RBF461' and exchange='FUND'),'Series A','RBF461','Global Fixed Income Balanced','No Load','Open',500,25,'Quarterly','Annually','RBC Global Asset Management','https://www.rbcgam.com/documents/fund-pages/monthly/rbf461_e.pdf','2026-04-30'),
 ((select id from public.investments where symbol='RBF460' and exchange='FUND'),'Series A','RBF460','Global Neutral Balanced','No Load','Open',500,25,'Annually','Annually','RBC Global Asset Management','https://www.rbcgam.com/ca/products/mutual-funds/rbf460/detail','2026-09-20'),
 ((select id from public.investments where symbol='RBF459' and exchange='FUND'),'Series A','RBF459','Global Equity Balanced','No Load','Open',500,25,'Annually','Annually','RBC Global Asset Management','https://www.rbcgam.com/documents/fund-pages/monthly/rbf459_e.pdf','2025-10-31')
on conflict (investment_id) do update set
 series_name=excluded.series_name,fund_code=excluded.fund_code,cifsc_category=excluded.cifsc_category,load_structure=excluded.load_structure,sales_status=excluded.sales_status,
 minimum_initial_investment=excluded.minimum_initial_investment,minimum_additional_investment=excluded.minimum_additional_investment,
 income_distribution_frequency=excluded.income_distribution_frequency,capital_gains_distribution_frequency=excluded.capital_gains_distribution_frequency,
 source_name=excluded.source_name,source_url=excluded.source_url,as_of_date=excluded.as_of_date,updated_at=now();

with m(symbol,price,r1m,r3m,r1y,r3y,r5y,mer,aum,distribution) as (
 values
 ('RBF461',26.53::numeric,1.2::numeric,6.5::numeric,12.2::numeric,10.0::numeric,5.0::numeric,1.70::numeric,47556400000::numeric,'Quarterly'),
 ('RBF460',39.35,1.5,9.2,17.5,13.3,7.0,1.94,78352100000,'Annually'),
 ('RBF459',47.81,1.7,11.1,21.7,15.7,8.5,2.03,24429000000,'Annually')
)
insert into public.investment_metrics(investment_id,as_of_date,price,return_1m_pct,return_3m_pct,return_1y_pct,return_3y_annualized_pct,return_5y_annualized_pct,mer_pct,aum,distribution_frequency)
select i.id,'2026-06-30',m.price,m.r1m,m.r3m,m.r1y,m.r3y,m.r5y,m.mer,m.aum,m.distribution
from m join public.investments i on i.symbol=m.symbol and i.exchange='FUND'
on conflict (investment_id,as_of_date) do update set
 price=excluded.price,return_1m_pct=excluded.return_1m_pct,return_3m_pct=excluded.return_3m_pct,return_1y_pct=excluded.return_1y_pct,
 return_3y_annualized_pct=excluded.return_3y_annualized_pct,return_5y_annualized_pct=excluded.return_5y_annualized_pct,
 mer_pct=excluded.mer_pct,aum=excluded.aum,distribution_frequency=excluded.distribution_frequency;

insert into public.investment_risk_metrics(investment_id,as_of_date,risk_level)
select i.id,'2026-06-30','Low to Medium'
from public.investments i where i.exchange='FUND' and i.symbol in ('RBF461','RBF460','RBF459')
on conflict (investment_id,as_of_date) do update set risk_level=excluded.risk_level;
