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
  v_return_1y_count int;
  v_return_3y_count int;
  v_return_5y_count int;
  v_income_count int;
  v_characteristics_count int;
  v_exposure_count int;
  v_full_holdings_count int;
begin
  select count(*) into v_etf_count
  from public.investments
  where is_active=true and asset_type='ETF';

  if v_etf_count <> 79 then
    raise exception 'Expected 79 active ETFs after Canada expansion, got %',v_etf_count;
  end if;

  select count(*) into v_catalog_count
  from public.investments
  where is_active=true;

  if v_catalog_count <> 94 then
    raise exception 'Expected 94 active instruments after Canada expansion, got %',v_catalog_count;
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

  if v_issuer_count <> 9 then
    raise exception 'Expected nine represented ETF issuers, got %',v_issuer_count;
  end if;

  if not exists (
    select 1 from public.v_instrument_research_catalog
    where symbol='CASH' and mer_pct=0.11 and risk_level='Low' and subcategory='Cash & Liquidity'
  ) then
    raise exception 'CASH browser research row is incomplete';
  end if;

  if not exists (
    select 1 from public.v_instrument_research_catalog
    where symbol='HXS' and complexity_level='high' and profile_replication_method='Total-return swaps'
  ) then
    raise exception 'HXS swap-complexity disclosure is missing';
  end if;

  if not exists (
    select 1 from public.v_instrument_research_catalog
    where symbol='TCOM' and complexity_level='high' and category='Alternatives'
  ) then
    raise exception 'TCOM alternative-complexity disclosure is missing';
  end if;

  select
    count(*) filter (where has_return_1y),
    count(*) filter (where has_return_3y),
    count(*) filter (where has_return_5y),
    count(*) filter (where has_sourced_income),
    count(*) filter (where has_portfolio_characteristics),
    count(*) filter (where has_complete_exposure_set),
    count(*) filter (where has_full_holdings_detail)
  into
    v_return_1y_count,v_return_3y_count,v_return_5y_count,v_income_count,
    v_characteristics_count,v_exposure_count,v_full_holdings_count
  from public.v_investment_data_coverage_v2;

  if v_return_1y_count < 64 or v_return_3y_count < 58 or v_return_5y_count < 54 then
    raise exception 'Canadian enrichment performance coverage regressed: 1y %, 3y %, 5y %',
      v_return_1y_count,v_return_3y_count,v_return_5y_count;
  end if;

  if v_income_count < 44 or v_characteristics_count < 55 or v_exposure_count < 36 or v_full_holdings_count < 20 then
    raise exception 'Canadian enrichment research coverage regressed: income %, characteristics %, exposure %, full holdings %',
      v_income_count,v_characteristics_count,v_exposure_count,v_full_holdings_count;
  end if;

  if not exists (
    select 1
    from public.investment_performance_history p
    join public.investments i on i.id=p.investment_id
    where i.symbol='HXS' and p.as_of_date='2026-08-31'
      and p.return_1y_pct=20.74 and p.return_3y_annualized_pct=21.41
      and p.return_5y_annualized_pct=14.37
      and p.verification_status='issuer_verified'
  ) then
    raise exception 'HXS issuer-verified performance row is missing or changed';
  end if;

  if not exists (
    select 1
    from public.investment_performance_history p
    join public.investments i on i.id=p.investment_id
    where i.symbol='TQCD' and p.as_of_date='2026-06-30'
      and p.return_1y_pct=34.77 and p.return_3y_annualized_pct=27.56
      and p.return_5y_annualized_pct=18.34
      and p.verification_status='issuer_verified'
  ) then
    raise exception 'TQCD issuer-verified performance row is missing or changed';
  end if;

  if not exists (
    select 1
    from public.v_investment_data_coverage_v2
    where symbol='TEQT' and holdings_rows=4 and holdings_weight_coverage_pct=100.00
  ) then
    raise exception 'TEQT full underlying-holdings coverage is missing';
  end if;

  if not exists (
    select 1
    from public.v_investment_data_coverage_v2
    where symbol='AIQ' and has_return_1y and not has_return_3y and not has_return_5y
  ) then
    raise exception 'AIQ fund-age null semantics regressed';
  end if;

  if (
    select count(*)
    from public.investments i
    where i.symbol in ('FEQT','FGRO','FBAL','FCNS','FFIX','FCCA','FCAM','FCIN')
      and i.exchange='Cboe CA'
      and i.is_active
  ) <> 8 then
    raise exception 'Fidelity Canada wave is incomplete';
  end if;

  if (
    select count(*)
    from public.investments i
    join public.investment_official_facts f on f.investment_id=i.id
    join public.investment_official_risk_ratings r on r.investment_id=i.id
    join public.investment_structure_profiles s on s.investment_id=i.id and s.model_version='structure-v1'
    join public.investment_profiles p on p.investment_id=i.id and p.model_version='profile-v1.0'
    where i.symbol in ('FEQT','FGRO','FBAL','FCNS','FFIX','FCCA','FCAM','FCIN')
      and i.exchange='Cboe CA'
  ) <> 8 then
    raise exception 'Fidelity Canada evidence layers are incomplete';
  end if;

  if (
    select count(*)
    from public.investments i
    join public.investment_official_facts f on f.investment_id=i.id
    join public.investment_official_risk_ratings r on r.investment_id=i.id
    join public.investment_structure_profiles s on s.investment_id=i.id and s.model_version='structure-v1'
    join public.investment_profiles p on p.investment_id=i.id and p.model_version='profile-v1.0'
    join public.investment_issuers iss on iss.id=i.issuer_id
    where i.symbol in ('QCN','QUU','QDX','QBB','MCON','MBAL','MGRW','MEQT')
      and i.exchange='TSX'
      and iss.name='Mackenzie Investments'
  ) <> 8 then
    raise exception 'Mackenzie wave or canonical issuer normalization is incomplete';
  end if;

  if exists (
    select 1
    from public.investments i
    join public.investment_issuers iss on iss.id=i.issuer_id
    where iss.name='Mackenzie Financial Corporation'
  ) then
    raise exception 'Duplicate Mackenzie issuer still owns investments';
  end if;

  if (
    select count(*)
    from public.investments i
    join public.investment_official_facts f on f.investment_id=i.id
    join public.investment_official_risk_ratings r on r.investment_id=i.id
    join public.investment_structure_profiles s on s.investment_id=i.id and s.model_version='structure-v1'
    join public.investment_profiles p on p.investment_id=i.id and p.model_version='profile-v1.0'
    where i.symbol in ('RCAN','RUSA','RCD','RID','RBNK','RUST')
      and i.exchange='TSX'
  ) <> 6 then
    raise exception 'RBC GAM wave evidence layers are incomplete';
  end if;

  if not exists (
    select 1
    from public.v_investment_data_coverage_v2
    where symbol='RBNK' and has_full_holdings_detail
  ) then
    raise exception 'RBNK full six-bank holdings coverage is missing';
  end if;

  if not exists (
    select 1
    from public.investment_official_risk_ratings r
    join public.investments i on i.id=r.investment_id
    where i.symbol='RBNK' and r.official_risk_rating='Medium to High'
  ) then
    raise exception 'RBNK official risk rating is missing';
  end if;

  if (
    select count(*)
    from public.investment_official_risk_ratings r
    join public.investments i on i.id=r.investment_id
    where i.symbol in ('RCAN','RUSA')
      and r.official_risk_rating='Medium'
  ) <> 2 then
    raise exception 'RCAN/RUSA new-fund official risk rows are missing';
  end if;

  if not exists (
    select 1
    from public.market_data_source_routing route
    join public.market_data_sources src on src.id=route.source_id
    where src.source_key='yahoo_free'
      and route.asset_type='ETF'
      and route.country_code='CA'
      and route.exchange='Cboe CA'
      and route.is_active
  ) then
    raise exception 'Cboe Canada market-data route is missing';
  end if;

  if (
    select count(distinct i.symbol)
    from public.investment_price_history h
    join public.investments i on i.id=h.investment_id
    where i.symbol in (
      'FEQT','FGRO','FBAL','FCNS','FFIX','FCCA','FCAM','FCIN',
      'QCN','QUU','QDX','QBB','MCON','MBAL','MGRW','MEQT',
      'RCAN','RUSA','RCD','RID','RBNK','RUST'
    )
      and h.source_key='yahoo_free'
  ) < 22 then
    raise exception 'New Canadian ETF market-history canaries are incomplete';
  end if;

  if not exists (
    select 1
    from public.app_search_instruments('ETF',null,120)
    where symbol='RBNK'
      and price is not null
      and risk_level='Medium to High'
      and mer_pct=0.32
      and distribution_frequency='Monthly'
  ) then
    raise exception 'RBNK browser-facing canonical price/fee/risk fields are incomplete';
  end if;

  if not exists (
    select 1
    from public.app_search_instruments('ETF',null,120)
    where symbol='FEQT'
      and price is not null
      and risk_level='Medium'
      and mer_pct=0.43
  ) then
    raise exception 'FEQT browser-facing canonical price/fee/risk fields are incomplete';
  end if;

  raise notice 'PASS: Canadian ETF expansion has 79 ETFs / 94 active instruments across 9 issuers with sourced enrichment coverage';
end $$;
