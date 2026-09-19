create or replace function investor_private.product_risk_input_base(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select jsonb_strip_nulls(jsonb_build_object(
      'input_status','available',
      'investment_id',v.id,
      'asset_type',v.asset_type,
      'symbol',v.symbol,
      'name',v.name,
      'issuer',v.issuer_name,
      'currency',v.currency,
      'data_status',v.data_status,
      'quality',jsonb_build_object(
        'data_quality_status',v.data_quality_status,
        'data_quality_score',v.data_quality_score,
        'metrics_as_of_date',v.metrics_as_of_date
      ),
      'structure',jsonb_build_object(
        'capital_protection',v.capital_protection,
        'liquidity_level',v.liquidity_level,
        'price_volatility',v.price_volatility,
        'income_predictability',v.income_predictability,
        'growth_participation',v.growth_participation,
        'interest_rate_sensitivity',v.interest_rate_sensitivity,
        'credit_exposure',v.credit_exposure,
        'diversification_level',v.diversification_level,
        'complexity_level',v.complexity_level,
        'time_structure',v.time_structure,
        'principal_protection_basis',v.principal_protection_basis,
        'as_of_date',v.structure_as_of_date
      )
    ))
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id
    limit 1
  ),jsonb_build_object('input_status','not_found'));
$$;

create or replace function investor_private.product_risk_inputs_etf(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select investor_private.product_risk_input_base(v.id) || jsonb_build_object(
      'module_code','etf-risk',
      'module_version','etf-risk-v1-research',
      'specific',jsonb_strip_nulls(jsonb_build_object(
        'official_risk_rating',v.risk_level,
        'volatility_1y_pct',v.volatility_1y_pct,
        'volatility_3y_pct',v.volatility_3y_pct,
        'max_drawdown_1y_pct',v.max_drawdown_1y_pct,
        'max_drawdown_3y_pct',v.max_drawdown_3y_pct,
        'beta',v.beta,
        'aum',v.aum,
        'volume',v.volume,
        'equity_pct',v.equity_pct,
        'fixed_income_pct',v.fixed_income_pct,
        'replication_method',v.profile_replication_method,
        'currency_hedging',v.profile_currency_hedging,
        'portfolio_construction',v.profile_portfolio_construction
      )),
      'missing_sensor_policy','omitted_means_unknown'
    )
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id and v.asset_type='ETF'
    limit 1
  ),jsonb_build_object('input_status','asset_mismatch','module_code','etf-risk'));
$$;

create or replace function investor_private.product_risk_inputs_gic(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select investor_private.product_risk_input_base(v.id) || jsonb_build_object(
      'module_code','gic-risk',
      'module_version','gic-risk-v1-research',
      'specific',jsonb_strip_nulls(jsonb_build_object(
        'annual_rate_pct',v.deposit_rate_pct,
        'term_months',v.term_months,
        'redeemability',v.redeemability,
        'minimum_deposit',v.minimum_deposit,
        'interest_payment_frequency',v.interest_payment_frequency,
        'deposit_insurance_scheme',v.deposit_insurance_scheme,
        'deposit_insurance_eligible',v.deposit_insurance_eligible,
        'lockup_note',v.lockup_note,
        'source_name',v.deposit_source_name,
        'source_url',v.deposit_source_url,
        'as_of_date',v.deposit_as_of_date
      )),
      'missing_sensor_policy','omitted_means_unknown'
    )
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id and v.asset_type='GIC'
    limit 1
  ),jsonb_build_object('input_status','asset_mismatch','module_code','gic-risk'));
$$;

create or replace function investor_private.product_risk_inputs_t_bill(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select investor_private.product_risk_input_base(v.id) || jsonb_build_object(
      'module_code','t-bill-risk',
      'module_version','t-bill-risk-v1-research',
      'specific',jsonb_strip_nulls(jsonb_build_object(
        'instrument_subtype',v.instrument_subtype,
        'yield_to_maturity_pct',v.yield_to_maturity_pct,
        'maturity_date',v.maturity_date,
        'remaining_term_months',v.remaining_term_months,
        'face_value',v.face_value,
        'discount_instrument',v.discount_instrument,
        'market_access_note',v.market_access_note,
        'source_name',v.fixed_income_source_name,
        'source_url',v.fixed_income_source_url,
        'as_of_date',v.fixed_income_as_of_date
      )),
      'missing_sensor_policy','omitted_means_unknown'
    )
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id and v.asset_type='T_BILL'
    limit 1
  ),jsonb_build_object('input_status','asset_mismatch','module_code','t-bill-risk'));
$$;

create or replace function investor_private.product_risk_inputs_bond(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select investor_private.product_risk_input_base(v.id) || jsonb_build_object(
      'module_code','bond-risk',
      'module_version','bond-risk-v1-research',
      'specific',jsonb_strip_nulls(jsonb_build_object(
        'instrument_subtype',v.instrument_subtype,
        'coupon_pct',v.coupon_pct,
        'yield_to_maturity_pct',v.yield_to_maturity_pct,
        'issue_date',v.issue_date,
        'maturity_date',v.maturity_date,
        'remaining_term_months',v.remaining_term_months,
        'duration_years',v.duration_years,
        'face_value',v.face_value,
        'credit_rating',v.credit_rating,
        'credit_rating_agency',v.credit_rating_agency,
        'market_access_note',v.market_access_note,
        'source_name',v.fixed_income_source_name,
        'source_url',v.fixed_income_source_url,
        'as_of_date',v.fixed_income_as_of_date
      )),
      'missing_sensor_policy','omitted_means_unknown'
    )
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id and v.asset_type='BOND'
    limit 1
  ),jsonb_build_object('input_status','asset_mismatch','module_code','bond-risk'));
$$;

create or replace function investor_private.product_risk_inputs_commercial_paper(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select investor_private.product_risk_input_base(v.id) || jsonb_build_object(
      'module_code','commercial-paper-risk',
      'module_version','commercial-paper-risk-v1-research',
      'specific',jsonb_strip_nulls(jsonb_build_object(
        'instrument_subtype',v.instrument_subtype,
        'yield_to_maturity_pct',v.yield_to_maturity_pct,
        'maturity_date',v.maturity_date,
        'remaining_term_months',v.remaining_term_months,
        'credit_rating',v.credit_rating,
        'credit_rating_agency',v.credit_rating_agency,
        'market_access_note',v.market_access_note,
        'source_name',v.fixed_income_source_name,
        'source_url',v.fixed_income_source_url,
        'as_of_date',v.fixed_income_as_of_date
      )),
      'missing_sensor_policy','omitted_means_unknown'
    )
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id and v.asset_type='COMMERCIAL_PAPER'
    limit 1
  ),jsonb_build_object('input_status','asset_mismatch','module_code','commercial-paper-risk'));
$$;

create or replace function investor_private.product_risk_inputs_abcp(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select investor_private.product_risk_input_base(v.id) || jsonb_build_object(
      'module_code','abcp-risk',
      'module_version','abcp-risk-v1-research',
      'specific',jsonb_strip_nulls(jsonb_build_object(
        'instrument_subtype',v.instrument_subtype,
        'yield_to_maturity_pct',v.yield_to_maturity_pct,
        'maturity_date',v.maturity_date,
        'remaining_term_months',v.remaining_term_months,
        'credit_rating',v.credit_rating,
        'credit_rating_agency',v.credit_rating_agency,
        'market_access_note',v.market_access_note,
        'source_name',v.fixed_income_source_name,
        'source_url',v.fixed_income_source_url,
        'as_of_date',v.fixed_income_as_of_date
      )),
      'missing_sensors',jsonb_build_array(
        'asset_pool_quality','sponsor_strength','liquidity_provider','credit_enhancement',
        'overcollateralization','waterfall_complexity','trigger_structure',
        'bankruptcy_remoteness','pool_concentration','underlying_transparency'
      ),
      'missing_sensor_policy','omitted_means_unknown'
    )
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id and v.asset_type='ABCP'
    limit 1
  ),jsonb_build_object('input_status','asset_mismatch','module_code','abcp-risk'));
$$;

create or replace function investor_private.product_risk_inputs(p_investment_id uuid)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce((
    select case v.asset_type
      when 'ETF' then investor_private.product_risk_inputs_etf(v.id)
      when 'GIC' then investor_private.product_risk_inputs_gic(v.id)
      when 'T_BILL' then investor_private.product_risk_inputs_t_bill(v.id)
      when 'BOND' then investor_private.product_risk_inputs_bond(v.id)
      when 'COMMERCIAL_PAPER' then investor_private.product_risk_inputs_commercial_paper(v.id)
      when 'ABCP' then investor_private.product_risk_inputs_abcp(v.id)
      else jsonb_build_object('input_status','unsupported_asset','asset_type',v.asset_type)
    end
    from public.v_instrument_research_catalog v
    where v.id=p_investment_id
    limit 1
  ),jsonb_build_object('input_status','not_found'));
$$;

revoke all on function investor_private.product_risk_input_base(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs_etf(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs_gic(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs_t_bill(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs_bond(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs_commercial_paper(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs_abcp(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_inputs(uuid) from public,anon,authenticated;

grant execute on function investor_private.product_risk_input_base(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs_etf(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs_gic(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs_t_bill(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs_bond(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs_commercial_paper(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs_abcp(uuid) to service_role;
grant execute on function investor_private.product_risk_inputs(uuid) to service_role;
