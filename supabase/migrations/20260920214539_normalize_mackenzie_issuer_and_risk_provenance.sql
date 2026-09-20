
-- Normalize Mackenzie issuer identity after overlapping catalog-enrichment passes.
-- Preserve the canonical brand-level issuer label used in existing provenance.

do $$
declare
  v_keep uuid;
  v_drop uuid;
begin
  select id into v_keep
  from public.investment_issuers
  where name='Mackenzie Investments'
  limit 1;

  select id into v_drop
  from public.investment_issuers
  where name='Mackenzie Financial Corporation'
  limit 1;

  if v_keep is null then
    insert into public.investment_issuers(name,website,country_code)
    values('Mackenzie Investments','https://www.mackenzieinvestments.com/','CA')
    returning id into v_keep;
  end if;

  if v_drop is not null then
    update public.investments
    set issuer_id=v_keep,updated_at=now()
    where issuer_id=v_drop;

    delete from public.investment_issuers
    where id=v_drop
      and not exists (select 1 from public.investments where issuer_id=v_drop);
  end if;
end $$;

-- Restore the most recent official issuer-roadmap risk provenance for the Mackenzie wave.
with rr(symbol,rating) as (
  values
  ('QCN','Medium'),('QUU','Medium'),('QDX','Medium'),('QBB','Low'),
  ('MCON','Low to Medium'),('MBAL','Low to Medium'),('MGRW','Low to Medium'),('MEQT','Medium')
), mapped as (
  select rr.*,
    case rating when 'Low' then 0 when 'Low to Medium' then 20 when 'Medium' then 40 when 'Medium to High' then 60 when 'High' then 80 end::numeric band_min,
    case rating when 'Low' then 20 when 'Low to Medium' then 40 when 'Medium' then 60 when 'Medium to High' then 80 when 'High' then 100 end::numeric band_max
  from rr
)
update public.investment_official_risk_ratings r
set official_risk_rating=m.rating,
    band_min=m.band_min,
    band_max=m.band_max,
    issuer='Mackenzie Investments',
    source_type='Official issuer roadmap',
    source_title='Mackenzie ETF product roadmap',
    source_url='https://www.mackenzieinvestments.com/content/dam/mackenzie-investments/en/public-sites/mi/documents/etfs/mi-etf-product-listing-roadmap-en.pdf',
    source_date='2026-08-01',
    effective_date='2026-08-01',
    methodology='Issuer-disclosed Canadian standardized risk classification.',
    verification_note='Verified against Mackenzie’s August 2026 official ETF roadmap.',
    verified_at=now(),
    updated_at=now()
from mapped m
join public.investments i on i.symbol=m.symbol and i.exchange='TSX'
where r.investment_id=i.id;

update public.investment_official_facts f
set source_name='Mackenzie Investments',
    verified_at=now()
from public.investments i
where f.investment_id=i.id
  and i.symbol in ('QCN','QUU','QDX','QBB','MCON','MBAL','MGRW','MEQT')
  and i.exchange='TSX';
