do $$
declare
  v_etf_count int;
  v_catalog_count int;
  v_new_count int;
  v_fact_count int;
  v_risk_count int;
  v_structure_count int;
  v_profile_count int;
  v_issuer_count int;
begin
  select count(*) into v_etf_count
  from public.investments
  where is_active=true and asset_type='ETF';

  if v_etf_count <> 57 then
    raise exception 'Expected 57 active ETFs after Canada expansion, got %',v_etf_count;
  end if;

  select count(*) into v_catalog_count
  from public.investments
  where is_active=true;

  if v_catalog_count <> 72 then
    raise exception 'Expected 72 active instruments after Canada expansion, got %',v_catalog_count;
  end if;

  with new_etfs as (
    select id from public.investments
    where exchange='TSX'
      and symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
  )
  select count(*) into v_new_count from new_etfs;

  if v_new_count <> 17 then
    raise exception 'Expected all 17 new Canadian ETFs, got %',v_new_count;
  end if;

  select count(*) into v_fact_count
  from public.investment_official_facts f
  join public.investments i on i.id=f.investment_id
  where i.symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
    and i.exchange='TSX';

  if v_fact_count <> 17 then
    raise exception 'Expected 17/17 official facts rows, got %',v_fact_count;
  end if;

  select count(*) into v_risk_count
  from public.investment_official_risk_ratings r
  join public.investments i on i.id=r.investment_id
  where i.symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
    and i.exchange='TSX';

  if v_risk_count <> 17 then
    raise exception 'Expected 17/17 official risk rows, got %',v_risk_count;
  end if;

  select count(*) into v_structure_count
  from public.investment_structure_profiles s
  join public.investments i on i.id=s.investment_id
  where s.model_version='structure-v1'
    and i.symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
    and i.exchange='TSX';

  if v_structure_count <> 17 then
    raise exception 'Expected 17/17 structure profiles, got %',v_structure_count;
  end if;

  select count(*) into v_profile_count
  from public.investment_profiles p
  join public.investments i on i.id=p.investment_id
  where p.model_version='profile-v1.0'
    and i.symbol in ('TTP','TPU','TDB','TCSH','TGRO','TEQT','TEC','TQCD','THE','TCOM','CASH','CBIL','HXT','HXS','HXQ','AIQ','PSA')
    and i.exchange='TSX';

  if v_profile_count <> 17 then
    raise exception 'Expected 17/17 research profiles, got %',v_profile_count;
  end if;

  select count(distinct issuer_id) into v_issuer_count
  from public.investments
  where is_active=true and asset_type='ETF';

  if v_issuer_count <> 6 then
    raise exception 'Expected six represented ETF issuers, got %',v_issuer_count;
  end if;

  if not exists (
    select 1 from public.v_instrument_research_catalog
    where symbol='CASH' and mer_pct=0.11 and risk_level='Low' and subcategory='Cash & Liquidity'
  ) then
    raise exception 'CASH browser research row is incomplete';
  end if;

  if not exists (
    select 1 from public.v_instrument_research_catalog
    where symbol='HXS' and complexity_level='high' and replication_method='Total-return swaps'
  ) then
    raise exception 'HXS swap-complexity disclosure is missing';
  end if;

  if not exists (
    select 1 from public.v_instrument_research_catalog
    where symbol='TCOM' and complexity_level='high' and category='Alternatives'
  ) then
    raise exception 'TCOM alternative-complexity disclosure is missing';
  end if;

  raise notice 'PASS: Canadian ETF expansion has 57 ETFs / 72 active instruments with 17/17 sourced new research profiles';
end $$;
