insert into public.investment_issuers (name, website, country_code)
values
  ('BlackRock Canada', 'https://www.blackrock.com/ca', 'CA'),
  ('Vanguard Canada', 'https://www.vanguard.ca', 'CA'),
  ('BMO Global Asset Management', 'https://www.bmogam.com/ca-en/', 'CA')
on conflict (name) do update set website = excluded.website;

insert into public.investments (symbol,name,asset_type,issuer_id,category,subcategory,strategy,region,country_code,currency,exchange,description,data_status,is_featured)
select x.symbol,x.name,x.asset_type,iss.id,x.category,x.subcategory,x.strategy,x.region,'CA','CAD','TSX',x.description,'identity_only',x.is_featured
from (values
 ('XEQT','iShares Core Equity ETF Portfolio','ETF','BlackRock Canada','Equity','All-in-one','100% equity portfolio','Global','A globally diversified all-equity portfolio',true),
 ('XGRO','iShares Core Growth ETF Portfolio','ETF','BlackRock Canada','Asset Allocation','All-in-one','Growth allocation','Global','Growth-oriented diversified portfolio',true),
 ('XBAL','iShares Core Balanced ETF Portfolio','ETF','BlackRock Canada','Asset Allocation','All-in-one','Balanced allocation','Global','Balanced diversified portfolio',true),
 ('XIC','iShares Core S&P/TSX Capped Composite Index ETF','ETF','BlackRock Canada','Equity','Canada','Broad Canadian equity','Canada','Canadian equity exposure across the broad market',false),
 ('XUU','iShares Core S&P U.S. Total Market Index ETF','ETF','BlackRock Canada','Equity','United States','Broad U.S. equity','United States','Broad U.S. equity exposure',false),
 ('VEQT','Vanguard All-Equity ETF Portfolio','ETF','Vanguard Canada','Equity','All-in-one','100% equity portfolio','Global','Globally diversified all-equity portfolio',true),
 ('VGRO','Vanguard Growth ETF Portfolio','ETF','Vanguard Canada','Asset Allocation','All-in-one','Growth allocation','Global','Growth-oriented diversified portfolio',true),
 ('VBAL','Vanguard Balanced ETF Portfolio','ETF','Vanguard Canada','Asset Allocation','All-in-one','Balanced allocation','Global','Balanced diversified portfolio',true),
 ('VCN','Vanguard FTSE Canada All Cap Index ETF','ETF','Vanguard Canada','Equity','Canada','Broad Canadian equity','Canada','Canadian equity exposure across large, mid and small capitalization',false),
 ('VUN','Vanguard U.S. Total Market Index ETF','ETF','Vanguard Canada','Equity','United States','Broad U.S. equity','United States','Broad U.S. equity exposure',false),
 ('VFV','Vanguard S&P 500 Index ETF','ETF','Vanguard Canada','Equity','United States','S&P 500','United States','Exposure to large U.S. companies',false),
 ('ZCN','BMO S&P/TSX Capped Composite Index ETF','ETF','BMO Global Asset Management','Equity','Canada','Broad Canadian equity','Canada','Canadian broad-market equity exposure',false),
 ('ZSP','BMO S&P 500 Index ETF','ETF','BMO Global Asset Management','Equity','United States','S&P 500','United States','Exposure to the S&P 500',false),
 ('ZAG','BMO Aggregate Bond Index ETF','ETF','BMO Global Asset Management','Fixed Income','Canada','Broad Canadian bonds','Canada','Diversified Canadian investment-grade bond exposure',false),
 ('ZBAL','BMO Balanced ETF','ETF','BMO Global Asset Management','Asset Allocation','All-in-one','Balanced allocation','Global','Balanced multi-asset portfolio',false)
) as x(symbol,name,asset_type,issuer,category,subcategory,strategy,region,description,is_featured)
join public.investment_issuers iss on iss.name=x.issuer
on conflict (symbol, exchange) do update set
  name=excluded.name,
  issuer_id=excluded.issuer_id,
  category=excluded.category,
  subcategory=excluded.subcategory,
  strategy=excluded.strategy,
  region=excluded.region,
  description=excluded.description,
  is_featured=excluded.is_featured,
  updated_at=now();
