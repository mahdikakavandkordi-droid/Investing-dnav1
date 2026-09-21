-- Focused V1 GIC market coverage.
-- Conventional fixed/cashable/redeemable GIC families only. Market-linked GICs
-- stay out of V1 because their payoff structures are not apples-to-apples with
-- conventional guaranteed deposits.

create table if not exists public.investment_deposit_term_options (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  option_key text not null,
  term_months integer not null check (term_months > 0),
  annual_rate_pct numeric,
  rate_type text not null default 'fixed',
  rate_basis text,
  minimum_deposit numeric check (minimum_deposit is null or minimum_deposit >= 0),
  account_scope text,
  registered_account_eligibility text[] not null default '{}'::text[],
  redeemability text not null check (redeemability in ('non_redeemable','redeemable','conditionally_redeemable')),
  interest_payment_frequency text,
  special_terms text,
  is_featured boolean not null default false,
  source_name text not null,
  source_url text not null,
  as_of_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(investment_id,option_key)
);
alter table public.investment_deposit_term_options enable row level security;
revoke all on public.investment_deposit_term_options from public,anon,authenticated;
grant all on public.investment_deposit_term_options to service_role;
create index if not exists investment_deposit_term_options_investment_idx
  on public.investment_deposit_term_options(investment_id,term_months);

insert into public.investment_issuers(name,website,country_code)
values
 ('Toronto-Dominion Bank','https://www.td.com/ca/en/personal-banking/','CA'),
 ('Bank of Montreal','https://www.bmo.com/en-ca/main/personal/','CA'),
 ('Canadian Imperial Bank of Commerce','https://www.cibc.com/','CA'),
 ('Bank of Nova Scotia','https://www.scotiabank.com/ca/en/personal.html','CA'),
 ('National Bank of Canada','https://www.nbc.ca/','CA'),
 ('Tangerine Bank','https://www.tangerine.ca/','CA')
on conflict(name) do update set website=excluded.website,country_code=excluded.country_code;

-- Retire the old one-card-per-term RBC examples. The new family cards carry
-- multiple source-dated term options instead.
update public.investments
set is_active=false,updated_at=now()
where asset_type='GIC'
  and symbol in ('RBC-GIC-1Y-CASH','RBC-GIC-1Y-NR','RBC-GIC-3Y-RED','RBC-GIC-5Y-NR');

with family(symbol,name,display_name,issuer_name,subcategory,strategy,description,featured) as (
 values
 ('RBC-GIC-NR','RBC Non-Redeemable GIC','RBC Non-Redeemable GIC','Royal Bank of Canada','Non-Redeemable','Fixed-rate guaranteed deposit with multiple terms','Lock in a guaranteed rate for a selected term; standard product is not redeemable before maturity.',true),
 ('RBC-GIC-CASH','RBC Cashable GIC','RBC Cashable GIC','Royal Bank of Canada','Cashable','Cashable guaranteed deposit','Guaranteed deposit with earlier access subject to the product cashing rules.',true),
 ('TD-GIC-NR','TD Long-Term Non-Cashable GIC','TD Non-Cashable GIC','Toronto-Dominion Bank','Non-Redeemable','Fixed-rate guaranteed deposit with 1- to 5-year terms','Choose a one- to five-year fixed term; funds are generally locked until maturity.',true),
 ('TD-GIC-CASH-1Y','TD 1-Year Cashable GIC','TD 1-Year Cashable GIC','Toronto-Dominion Bank','Cashable','One-year cashable guaranteed deposit','One-year fixed-rate GIC with access after the initial waiting period under TD cashing rules.',false),
 ('TD-GIC-CASH-3Y','TD 3-Year Premium Rate Cashable GIC','TD 3-Year Premium Cashable GIC','Toronto-Dominion Bank','Cashable','Three-year cashable guaranteed deposit','Three-year GIC with tiered pre-encashment rates and access rules.',false),
 ('BMO-GIC-NR','BMO Guaranteed Investment Certificate','BMO Non-Cashable GIC','Bank of Montreal','Non-Redeemable','Fixed-rate guaranteed deposit with multiple terms','Conventional BMO fixed-rate GIC with multiple terms and interest-payment options.',true),
 ('BMO-GIC-RATERISER','BMO Cashable RateRiser GIC','BMO Cashable RateRiser GIC','Bank of Montreal','Cashable','Three-year step-up cashable GIC','Three-year cashable GIC whose stated annual rate steps up each year.',false),
 ('CIBC-GIC-BONUS','CIBC Bonus Rate GIC','CIBC Bonus Rate GIC','Canadian Imperial Bank of Commerce','Non-Redeemable','Fixed-rate non-redeemable GIC','Fixed-rate GIC offered in multiple one- to five-year terms; principal and stated interest are guaranteed when held to maturity.',true),
 ('CIBC-GIC-FLEX','CIBC Flexible GIC','CIBC Flexible GIC','Canadian Imperial Bank of Commerce','Cashable','One-year cashable fixed-rate GIC','One-year fixed-rate GIC designed to provide earlier access under CIBC cashing rules.',false),
 ('SCOTIA-GIC-NR','Scotiabank Non-Redeemable GIC','Scotiabank Non-Redeemable GIC','Bank of Nova Scotia','Non-Redeemable','Fixed-rate guaranteed deposit','Traditional fixed-rate GIC for investors prepared to hold funds to maturity.',true),
 ('SCOTIA-GIC-PR','Scotiabank Personal Redeemable GIC','Scotiabank Personal Redeemable GIC','Bank of Nova Scotia','Redeemable','Redeemable guaranteed deposit with scheduled early-redemption rates','Redeemable GIC with a maturity rate and lower scheduled rates when redeemed earlier.',false),
 ('NBC-GIC-NR','National Bank Non-Redeemable GIC','National Bank Non-Redeemable GIC','National Bank of Canada','Non-Redeemable','Fixed-rate guaranteed deposit with terms up to five years','Choose a fixed term from short duration through five years; standard product is locked until maturity.',true),
 ('NBC-GIC-RED','National Bank Redeemable GIC','National Bank Redeemable GIC','National Bank of Canada','Redeemable','Fixed-rate redeemable GIC','Fixed-rate GIC offering access to funds subject to the product redemption rules.',false),
 ('TNG-GIC-NR','Tangerine Guaranteed Investment','Tangerine GIC','Tangerine Bank','Non-Redeemable','Online fixed-rate guaranteed investment','Online non-redeemable GIC with short- and long-term choices and no minimum balance requirement.',true)
)
insert into public.investments(
 symbol,name,legal_name,asset_type,issuer_id,category,subcategory,strategy,region,country_code,currency,exchange,
 description,is_active,is_featured,data_status,display_name
)
select f.symbol,f.name,f.name,'GIC',iss.id,'Guaranteed Deposit',f.subcategory,f.strategy,'Canada','CA','CAD','FUND',
       f.description,true,f.featured,'verified_partial',f.display_name
from family f join public.investment_issuers iss on iss.name=f.issuer_name
on conflict(symbol,exchange) do update set
 name=excluded.name,legal_name=excluded.legal_name,issuer_id=excluded.issuer_id,category=excluded.category,
 subcategory=excluded.subcategory,strategy=excluded.strategy,region=excluded.region,country_code=excluded.country_code,
 currency=excluded.currency,description=excluded.description,is_active=true,is_featured=excluded.is_featured,
 data_status=excluded.data_status,display_name=excluded.display_name,updated_at=now();

insert into public.investment_deposit_terms(
 investment_id,annual_rate_pct,term_months,redeemability,minimum_deposit,interest_payment_frequency,
 registered_account_eligibility,deposit_insurance_scheme,deposit_insurance_eligible,lockup_note,source_name,source_url,as_of_date
)
values
 ((select id from public.investments where symbol='RBC-GIC-NR' and exchange='FUND'),2.45,12,'non_redeemable',null,'Annual / semi-annual / maturity options',array['RRSP','TFSA','RESP','RRIF']::text[],'CDIC',true,'Standard non-redeemable terms are locked until maturity.','RBC Royal Bank','https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html','2026-09-17'),
 ((select id from public.investments where symbol='RBC-GIC-CASH' and exchange='FUND'),1.95,12,'redeemable',null,'Semi-annually or at maturity',array['RRSP','TFSA','RESP','RRIF']::text[],'CDIC',true,'Cashable subject to RBC product rules; early-redemption rates can differ from the headline rate.','RBC Royal Bank','https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html','2026-09-17'),
 ((select id from public.investments where symbol='TD-GIC-NR' and exchange='FUND'),null,12,'non_redeemable',500,'Compound annually / paid at maturity',array['TFSA','RRSP','RRIF','RESP','FHSA']::text[],'CDIC',true,'Registered minimum can be $500; non-registered minimum is generally $1,000 for long-term products.','TD Canada Trust','https://www.td.com/ca/en/personal-banking/personal-investing/products/gic/non-cashable-gic/what-td-offers','2026-09-20'),
 ((select id from public.investments where symbol='TD-GIC-CASH-1Y' and exchange='FUND'),null,12,'redeemable',500,'According to selected plan',array['TFSA','RRSP','RRIF','RESP','FHSA']::text[],'CDIC',true,'Cashable after 30 days under product rules; registered and non-registered minimums differ.','TD Canada Trust','https://www.td.com/ca/en/personal-banking/personal-investing/products/gic/cashable-gic/what-td-offers','2026-09-20'),
 ((select id from public.investments where symbol='TD-GIC-CASH-3Y' and exchange='FUND'),null,36,'conditionally_redeemable',500,'Simple interest annually / maturity',array['TFSA','RRSP']::text[],'CDIC',true,'Tiered pre-encashment rates apply; redemption before 91 days pays no interest.','TD Canada Trust','https://www.td.com/ca/en/personal-banking/personal-investing/products/gic/cashable-gic/what-td-offers','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-NR' and exchange='FUND'),2.70,12,'non_redeemable',1000,'Monthly, semi-annually, annually, or compounded annually',array['RRSP','RESP','RRIF','TFSA','FHSA','RDSP']::text[],'CDIC',true,'Not cashable prior to maturity under standard terms.','BMO','https://www.bmo.com/main/personal/investments/gic/non-cashable-investments/bmo-guaranteed-investment-certificate/','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-RATERISER' and exchange='FUND'),2.00,36,'redeemable',1000,'Annual or compounded annually',array['RRSP','RESP','TFSA','FHSA','RDSP']::text[],'CDIC',true,'Cashable in full at any time; no partial redemptions. 2.00% is the annual compound equivalent of the current three-year step schedule.','BMO','https://www.bmo.com/main/personal/investments/gic/cashable-investments/bmo-cashable-rateriser-gic/','2026-09-20'),
 ((select id from public.investments where symbol='CIBC-GIC-BONUS' and exchange='FUND'),null,12,'non_redeemable',1000,'Monthly, semi-annually, annually, or annual compound depending on term',array['RRSP','TFSA','RRIF','LIF']::text[],'CDIC',true,'Non-redeemable; registered minimums can differ from non-registered minimums.','CIBC','https://www.cibc.com/en/personal-banking/investments/gics/bonus-rate.html','2026-09-20'),
 ((select id from public.investments where symbol='CIBC-GIC-FLEX' and exchange='FUND'),null,12,'redeemable',1000,'Simple interest at maturity',array['RRSP','TFSA']::text[],'CDIC',true,'Cashable; CIBC states early access rules on the product page.','CIBC','https://www.cibc.com/en/personal-banking/investments/gics.html','2026-09-20'),
 ((select id from public.investments where symbol='SCOTIA-GIC-NR' and exchange='FUND'),3.25,24,'non_redeemable',500,'Annual / semi-annual / monthly / maturity depending on plan',array['RRSP','RRIF','TFSA']::text[],'CDIC',true,'Special 2-year non-redeemable rate; offer and rate may change without notice.','Scotiabank','https://www.scotiabank.com/ca/en/personal/rates-prices/gic-rates.html','2026-09-20'),
 ((select id from public.investments where symbol='SCOTIA-GIC-PR' and exchange='FUND'),2.55,24,'redeemable',500,'Annually or at maturity',array['RRSP','RRIF','TFSA']::text[],'CDIC',true,'Maturity rate is 2.55%; earlier redemption receives the scheduled lower rate for the holding period.','Scotiabank','https://www.scotiabank.com/ca/en/personal/investing/guaranteed-investment-certificates/personal-redeemable-gics.html','2026-09-20'),
 ((select id from public.investments where symbol='NBC-GIC-NR' and exchange='FUND'),null,12,'non_redeemable',500,'Annual payment available online',array['RRSP','RRIF','TFSA','FHSA']::text[],'CDIC',true,'Minimum is $500 in registered plans and $1,000 in non-registered plans.','National Bank','https://www.nbc.ca/personal/savings-investments/gic/non-redeemable.html','2026-09-20'),
 ((select id from public.investments where symbol='NBC-GIC-RED' and exchange='FUND'),null,12,'redeemable',500,'Annual payment available online',array['RRSP','RRIF','TFSA','FHSA']::text[],'CDIC',true,'Minimum is $500 in RRSP/TFSA and $1,000 in non-registered plans; redemption rules apply.','National Bank','https://www.nbc.ca/personal/savings-investments/gic/redeemable.html','2026-09-20'),
 ((select id from public.investments where symbol='TNG-GIC-NR' and exchange='FUND'),3.00,9,'non_redeemable',0,'Under 1 year at maturity; 1 year+ annually/compound',array['RRSP','TFSA','RRIF']::text[],'CDIC',true,'Tangerine GICs are not cashable before maturity except approved hardship circumstances; no minimum balance is required.','Tangerine','https://www.tangerine.ca/en/personal/invest/guaranteed-investments/gic','2026-09-20')
on conflict(investment_id,term_months,redeemability,as_of_date) do update set
 annual_rate_pct=excluded.annual_rate_pct,minimum_deposit=excluded.minimum_deposit,
 interest_payment_frequency=excluded.interest_payment_frequency,registered_account_eligibility=excluded.registered_account_eligibility,
 deposit_insurance_scheme=excluded.deposit_insurance_scheme,deposit_insurance_eligible=excluded.deposit_insurance_eligible,
 lockup_note=excluded.lockup_note,source_name=excluded.source_name,source_url=excluded.source_url;

-- Explicit source-dated term curves. Null rates are intentional when the
-- official issuer page publishes the live number dynamically.
insert into public.investment_deposit_term_options(
 investment_id,option_key,term_months,annual_rate_pct,rate_type,rate_basis,minimum_deposit,account_scope,
 registered_account_eligibility,redeemability,interest_payment_frequency,special_terms,is_featured,source_name,source_url,as_of_date
)
values
 ((select id from public.investments where symbol='RBC-GIC-NR' and exchange='FUND'),'12m',12,2.45,'fixed','posted',null,'registered_and_non_registered',array['RRSP','TFSA','RESP','RRIF']::text[],'non_redeemable','Annual / semi-annual / maturity','Posted rate shown by RBC; special offers can differ.',true,'RBC Royal Bank','https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html','2026-09-17'),
 ((select id from public.investments where symbol='RBC-GIC-NR' and exchange='FUND'),'24m',24,2.55,'fixed','posted',null,'registered_and_non_registered',array['RRSP','TFSA','RESP','RRIF']::text[],'non_redeemable','Annual / semi-annual / maturity','Posted rate shown by RBC; special offers can differ.',false,'RBC Royal Bank','https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html','2026-09-17'),
 ((select id from public.investments where symbol='RBC-GIC-NR' and exchange='FUND'),'60m',60,2.75,'fixed','posted',null,'registered_and_non_registered',array['RRSP','TFSA','RESP','RRIF']::text[],'non_redeemable','Annual / semi-annual / maturity','Posted rate shown by RBC; special offers can differ.',false,'RBC Royal Bank','https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html','2026-09-17'),
 ((select id from public.investments where symbol='RBC-GIC-CASH' and exchange='FUND'),'12m',12,1.95,'fixed','posted',null,'registered_and_non_registered',array['RRSP','TFSA','RESP','RRIF']::text[],'redeemable','Semi-annually or at maturity','Cashable under RBC product rules.',true,'RBC Royal Bank','https://www.rbcroyalbank.com/services/gic-rates/special/index-1.html','2026-09-17'),
 ((select id from public.investments where symbol='BMO-GIC-NR' and exchange='FUND'),'12m',12,2.70,'fixed','annual_compound',1000,'registered_and_non_registered',array['RRSP','RESP','RRIF','TFSA','FHSA','RDSP']::text[],'non_redeemable','Annual / annual compound','Annual or annual-compound rate.',true,'BMO','https://www.bmo.com/main/personal/investments/gic/non-cashable-investments/bmo-guaranteed-investment-certificate/','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-NR' and exchange='FUND'),'24m',24,2.75,'fixed','annual_compound',1000,'registered_and_non_registered',array['RRSP','RESP','RRIF','TFSA','FHSA','RDSP']::text[],'non_redeemable','Annual / annual compound','Annual or annual-compound rate.',false,'BMO','https://www.bmo.com/main/personal/investments/gic/non-cashable-investments/bmo-guaranteed-investment-certificate/','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-NR' and exchange='FUND'),'36m',36,2.85,'fixed','annual_compound',1000,'registered_and_non_registered',array['RRSP','RESP','RRIF','TFSA','FHSA','RDSP']::text[],'non_redeemable','Annual / annual compound','Annual or annual-compound rate.',false,'BMO','https://www.bmo.com/main/personal/investments/gic/non-cashable-investments/bmo-guaranteed-investment-certificate/','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-NR' and exchange='FUND'),'48m',48,3.00,'fixed','annual_compound',1000,'registered_and_non_registered',array['RRSP','RESP','RRIF','TFSA','FHSA','RDSP']::text[],'non_redeemable','Annual / annual compound','Annual or annual-compound rate.',false,'BMO','https://www.bmo.com/main/personal/investments/gic/non-cashable-investments/bmo-guaranteed-investment-certificate/','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-NR' and exchange='FUND'),'60m',60,3.10,'fixed','annual_compound',1000,'registered_and_non_registered',array['RRSP','RESP','RRIF','TFSA','FHSA','RDSP']::text[],'non_redeemable','Annual / annual compound','Annual or annual-compound rate.',false,'BMO','https://www.bmo.com/main/personal/investments/gic/non-cashable-investments/bmo-guaranteed-investment-certificate/','2026-09-20'),
 ((select id from public.investments where symbol='BMO-GIC-RATERISER' and exchange='FUND'),'36m',36,2.00,'step_up','annual_compound_equivalent',1000,'registered_and_non_registered',array['RRSP','RESP','TFSA','FHSA','RDSP']::text[],'redeemable','Annual / annual compound','Current year schedule: 1.25%, 1.75%, 3.00%; annual compound equivalent 2.00%.',true,'BMO','https://www.bmo.com/main/personal/investments/gic/cashable-investments/bmo-cashable-rateriser-gic/','2026-09-20'),
 ((select id from public.investments where symbol='SCOTIA-GIC-NR' and exchange='FUND'),'24m',24,3.25,'fixed','special_rate',500,'registered_and_non_registered',array['RRSP','RRIF','TFSA']::text[],'non_redeemable','Annual / semi-annual / monthly / maturity','Limited-time 2-year special rate.',true,'Scotiabank','https://www.scotiabank.com/ca/en/personal/rates-prices/gic-rates.html','2026-09-20'),
 ((select id from public.investments where symbol='SCOTIA-GIC-PR' and exchange='FUND'),'24m',24,2.55,'fixed','maturity_rate',500,'registered_and_non_registered',array['RRSP','RRIF','TFSA']::text[],'redeemable','Annually or at maturity','Early redemption schedule: 0–3m 2.30%; 3–6m 2.35%; 6–12m 2.40%; 12–18m 2.45%; 18–24m 2.50%; maturity 2.55%.',true,'Scotiabank','https://www.scotiabank.com/ca/en/personal/investing/guaranteed-investment-certificates/personal-redeemable-gics.html','2026-09-20')
on conflict(investment_id,option_key) do update set
 term_months=excluded.term_months,annual_rate_pct=excluded.annual_rate_pct,rate_type=excluded.rate_type,rate_basis=excluded.rate_basis,
 minimum_deposit=excluded.minimum_deposit,account_scope=excluded.account_scope,registered_account_eligibility=excluded.registered_account_eligibility,
 redeemability=excluded.redeemability,interest_payment_frequency=excluded.interest_payment_frequency,special_terms=excluded.special_terms,
 is_featured=excluded.is_featured,source_name=excluded.source_name,source_url=excluded.source_url,as_of_date=excluded.as_of_date,updated_at=now();

-- Dynamic-rate conventional families: preserve the term curve but deliberately
-- keep the rate null until an issuer-specific refresh adapter captures it.
with spec(symbol,redeemability,minimum_deposit,regs,payment,source_name,source_url,special_terms,terms) as (
 values
 ('TD-GIC-NR','non_redeemable',500,array['TFSA','RRSP','RRIF','RESP','FHSA']::text[],'Compound annually / maturity','TD Canada Trust','https://www.td.com/ca/en/personal-banking/personal-investing/products/gic/non-cashable-gic-rates','Current numeric rate is dynamically published by TD and is intentionally not inferred here.',array[12,24,36,48,60]::int[]),
 ('CIBC-GIC-BONUS','non_redeemable',1000,array['RRSP','TFSA','RRIF','LIF']::text[],'Monthly / semi-annual / annual / compound','CIBC','https://www.cibc.com/en/personal-banking/investments/gics/bonus-rate.html','Current numeric rate is dynamically published by CIBC and is intentionally not inferred here.',array[12,24,36,48,60]::int[]),
 ('NBC-GIC-NR','non_redeemable',500,array['RRSP','RRIF','TFSA','FHSA']::text[],'Annual payment available online','National Bank','https://www.nbc.ca/personal/savings-investments/gic/non-redeemable.html','Current rate is dynamically published by National Bank and is intentionally not inferred here.',array[12,24,36,48,60]::int[]),
 ('NBC-GIC-RED','redeemable',500,array['RRSP','RRIF','TFSA','FHSA']::text[],'Annual payment available online','National Bank','https://www.nbc.ca/personal/savings-investments/gic/redeemable.html','Current rate is dynamically published by National Bank and is intentionally not inferred here.',array[12,24,36,48,60]::int[])
),
expanded as (
 select s.*,unnest(s.terms) term_months from spec s
)
insert into public.investment_deposit_term_options(
 investment_id,option_key,term_months,annual_rate_pct,rate_type,rate_basis,minimum_deposit,account_scope,
 registered_account_eligibility,redeemability,interest_payment_frequency,special_terms,is_featured,source_name,source_url,as_of_date
)
select i.id,e.term_months||'m',e.term_months,null,'fixed','issuer_live',e.minimum_deposit,'registered_and_non_registered',
       e.regs,e.redeemability,e.payment,e.special_terms,e.term_months=12,e.source_name,e.source_url,'2026-09-20'
from expanded e join public.investments i on i.symbol=e.symbol and i.exchange='FUND'
on conflict(investment_id,option_key) do update set
 term_months=excluded.term_months,annual_rate_pct=null,rate_type=excluded.rate_type,rate_basis=excluded.rate_basis,
 minimum_deposit=excluded.minimum_deposit,account_scope=excluded.account_scope,registered_account_eligibility=excluded.registered_account_eligibility,
 redeemability=excluded.redeemability,interest_payment_frequency=excluded.interest_payment_frequency,special_terms=excluded.special_terms,
 is_featured=excluded.is_featured,source_name=excluded.source_name,source_url=excluded.source_url,as_of_date=excluded.as_of_date,updated_at=now();

insert into public.investment_deposit_term_options(
 investment_id,option_key,term_months,annual_rate_pct,rate_type,rate_basis,minimum_deposit,account_scope,
 registered_account_eligibility,redeemability,interest_payment_frequency,special_terms,is_featured,source_name,source_url,as_of_date
)
values
 ((select id from public.investments where symbol='TD-GIC-CASH-1Y' and exchange='FUND'),'12m',12,null,'fixed','issuer_live',500,'registered_and_non_registered',array['TFSA','RRSP','RRIF','RESP','FHSA']::text[],'redeemable','According to selected plan','Cashable after 30 days under product rules.',true,'TD Canada Trust','https://www.td.com/ca/en/personal-banking/personal-investing/products/gic/cashable-gic/what-td-offers','2026-09-20'),
 ((select id from public.investments where symbol='TD-GIC-CASH-3Y' and exchange='FUND'),'36m',36,null,'fixed','issuer_live',500,'registered_and_non_registered',array['TFSA','RRSP']::text[],'conditionally_redeemable','Simple interest annually / maturity','Tiered early-cash rates; no interest if redeemed before 91 days.',true,'TD Canada Trust','https://www.td.com/ca/en/personal-banking/personal-investing/products/gic/cashable-gic/what-td-offers','2026-09-20'),
 ((select id from public.investments where symbol='CIBC-GIC-FLEX' and exchange='FUND'),'12m',12,null,'fixed','issuer_live',1000,'registered_and_non_registered',array['RRSP','TFSA']::text[],'redeemable','Simple interest at maturity','Current numeric rate is dynamically published by CIBC and is intentionally not inferred here.',true,'CIBC','https://www.cibc.com/en/personal-banking/investments/gics.html','2026-09-20')
on conflict(investment_id,option_key) do update set
 annual_rate_pct=excluded.annual_rate_pct,rate_basis=excluded.rate_basis,minimum_deposit=excluded.minimum_deposit,
 registered_account_eligibility=excluded.registered_account_eligibility,redeemability=excluded.redeemability,
 interest_payment_frequency=excluded.interest_payment_frequency,special_terms=excluded.special_terms,
 source_name=excluded.source_name,source_url=excluded.source_url,as_of_date=excluded.as_of_date,updated_at=now();

with terms(term_months) as (values(3),(6),(9),(12),(18),(24),(36),(48),(60))
insert into public.investment_deposit_term_options(
 investment_id,option_key,term_months,annual_rate_pct,rate_type,rate_basis,minimum_deposit,account_scope,
 registered_account_eligibility,redeemability,interest_payment_frequency,special_terms,is_featured,source_name,source_url,as_of_date
)
select
 (select id from public.investments where symbol='TNG-GIC-NR' and exchange='FUND'),
 t.term_months||'m',t.term_months,case when t.term_months=9 then 3.00 else null end,'fixed',
 case when t.term_months=9 then 'current_rate' else 'issuer_live' end,0,'registered_and_non_registered',
 array['RRSP','TFSA','RRIF']::text[],'non_redeemable',
 case when t.term_months<12 then 'At maturity' else 'Annual / compound' end,
 case when t.term_months=9 then 'Official Tangerine page explicitly states the current 270-day rate as 3.00%.'
      else 'Current numeric rate is dynamically published by Tangerine and is intentionally not inferred here.' end,
 t.term_months=9,'Tangerine','https://www.tangerine.ca/en/personal/invest/guaranteed-investments/gic','2026-09-20'
from terms t
on conflict(investment_id,option_key) do update set
 term_months=excluded.term_months,annual_rate_pct=excluded.annual_rate_pct,rate_basis=excluded.rate_basis,
 minimum_deposit=excluded.minimum_deposit,registered_account_eligibility=excluded.registered_account_eligibility,
 interest_payment_frequency=excluded.interest_payment_frequency,special_terms=excluded.special_terms,is_featured=excluded.is_featured,
 source_name=excluded.source_name,source_url=excluded.source_url,as_of_date=excluded.as_of_date,updated_at=now();

insert into public.investment_structure_profiles(
 investment_id,model_version,capital_protection,liquidity_level,price_volatility,income_predictability,growth_participation,
 interest_rate_sensitivity,credit_exposure,diversification_level,complexity_level,time_structure,principal_protection_basis,source_basis,as_of_date
)
select i.id,'structure-v1','insured_deposit',
       case when dep.redeemability='non_redeemable' then 'locked' else 'medium' end,
       'none','very_high','none','low',iss.name||' deposit','single_issuer','low','locked_term',
       'Principal is contractually repayable under the product terms; eligible deposits at CDIC member institutions may be protected within applicable CDIC category limits and conditions.',
       jsonb_build_object('product_source',dep.source_name,'insurance_source','CDIC'),dep.as_of_date
from public.investments i
join public.investment_issuers iss on iss.id=i.issuer_id
join lateral(select x.* from public.investment_deposit_terms x where x.investment_id=i.id order by x.as_of_date desc,x.created_at desc limit 1) dep on true
where i.is_active and i.asset_type='GIC'
on conflict(investment_id,model_version) do update set
 capital_protection=excluded.capital_protection,liquidity_level=excluded.liquidity_level,price_volatility=excluded.price_volatility,
 income_predictability=excluded.income_predictability,growth_participation=excluded.growth_participation,
 interest_rate_sensitivity=excluded.interest_rate_sensitivity,credit_exposure=excluded.credit_exposure,
 diversification_level=excluded.diversification_level,complexity_level=excluded.complexity_level,time_structure=excluded.time_structure,
 principal_protection_basis=excluded.principal_protection_basis,source_basis=excluded.source_basis,as_of_date=excluded.as_of_date,updated_at=now();

create or replace view public.v_instrument_research_catalog with (security_invoker=true) as
select s.*,
 sp.model_version structure_model_version,sp.capital_protection,sp.liquidity_level,sp.price_volatility,sp.income_predictability,sp.growth_participation,
 sp.interest_rate_sensitivity,sp.credit_exposure,sp.diversification_level,sp.complexity_level,sp.time_structure,sp.principal_protection_basis,sp.as_of_date structure_as_of_date,
 fi.instrument_subtype,fi.coupon_pct,fi.yield_to_maturity_pct,fi.issue_date,fi.maturity_date,fi.remaining_term_months,fi.duration_years,fi.face_value,fi.credit_rating,
 fi.credit_rating_agency,fi.discount_instrument,fi.market_access_note,fi.source_name fixed_income_source_name,fi.source_url fixed_income_source_url,fi.as_of_date fixed_income_as_of_date,
 dep.annual_rate_pct deposit_rate_pct,dep.term_months,dep.redeemability,dep.minimum_deposit,dep.interest_payment_frequency,dep.registered_account_eligibility,
 dep.deposit_insurance_scheme,dep.deposit_insurance_eligible,dep.lockup_note,dep.source_name deposit_source_name,dep.source_url deposit_source_url,dep.as_of_date deposit_as_of_date,
 mf.series_name,mf.fund_code,mf.cifsc_category,mf.load_structure,mf.sales_status,mf.minimum_initial_investment,mf.minimum_additional_investment,
 mf.income_distribution_frequency mf_income_distribution_frequency,mf.capital_gains_distribution_frequency,mf.source_name mutual_fund_source_name,
 mf.source_url mutual_fund_source_url,mf.as_of_date mutual_fund_as_of_date,
 base.display_name,
 coalesce(term_curve.options,'[]'::jsonb) deposit_term_options
from public.v_investment_screener s
left join public.investments base on base.id=s.id
left join public.investment_structure_profiles sp on sp.investment_id=s.id and sp.model_version='structure-v1'
left join lateral(select x.* from public.investment_fixed_income_terms x where x.investment_id=s.id order by x.as_of_date desc,x.created_at desc limit 1) fi on true
left join lateral(select x.* from public.investment_deposit_terms x where x.investment_id=s.id order by x.as_of_date desc,x.created_at desc limit 1) dep on true
left join public.investment_mutual_fund_terms mf on mf.investment_id=s.id
left join lateral(
 select jsonb_agg(jsonb_build_object(
   'option_key',o.option_key,'term_months',o.term_months,'annual_rate_pct',o.annual_rate_pct,'rate_type',o.rate_type,'rate_basis',o.rate_basis,
   'minimum_deposit',o.minimum_deposit,'account_scope',o.account_scope,'registered_account_eligibility',o.registered_account_eligibility,
   'redeemability',o.redeemability,'interest_payment_frequency',o.interest_payment_frequency,'special_terms',o.special_terms,'is_featured',o.is_featured,
   'source_name',o.source_name,'source_url',o.source_url,'as_of_date',o.as_of_date
 ) order by o.term_months,o.option_key) options
 from public.investment_deposit_term_options o where o.investment_id=s.id
) term_curve on true;

select public.refresh_investment_data_quality();
