
create or replace function investor_private.product_risk_eval_t_bill(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record;
 price text; access text; divv text; overall text;
 price_conf text; access_conf text; conf text;
 flags jsonb:='[]'::jsonb;
begin
 select * into v
 from public.v_instrument_research_catalog
 where id=p_investment_id and asset_type='T_BILL'
 limit 1;

 if not found then
  return jsonb_build_object('status','asset_mismatch','module_code','t-bill-risk');
 end if;

 price:=case
  when v.remaining_term_months is not null and v.remaining_term_months<=12 then 'Low'
  else investor_private.product_risk_price_level(v.price_volatility)
 end;
 price_conf:=case
  when v.remaining_term_months is not null and v.fixed_income_as_of_date is not null then 'High'
  when price='Unknown' then 'Insufficient'
  else 'Medium'
 end;

 access:=investor_private.product_risk_access_level(v.liquidity_level);
 access_conf:=case when access='Unknown' then 'Insufficient' else 'Medium' end;
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);

 overall:=investor_private.product_risk_overall_v1('T_BILL','Low',price,access,divv);
 conf:=investor_private.product_risk_overall_confidence_v1('High',price_conf,access_conf,'High');

 if access_conf<>'High' then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','direct_liquidity_measure_unavailable',
   'label','Current research record does not include a direct bid-ask or market-depth measure',
   'severity','info'
  ));
 end if;

 return jsonb_build_object(
  'status','draft',
  'asset_type','T_BILL',
  'module_code','t-bill-risk',
  'module_version','t-bill-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',coalesce(v.fixed_income_as_of_date,v.structure_as_of_date),
  'summary','A short-term Government of Canada security with low loss potential, small price movement and high access to money.',
  'dominant_risks',jsonb_build_array('Reinvestment risk','Inflation risk'),
  'key_flags',jsonb_build_array(
    jsonb_build_object('code','single_sovereign_issuer','label','Single Government of Canada issuer exposure','severity','info')
  )||flags,
  'source_basis',jsonb_strip_nulls(jsonb_build_object(
    'remaining_term_months',v.remaining_term_months,
    'credit_exposure',v.credit_exposure,
    'fixed_income_source_name',v.fixed_income_source_name,
    'fixed_income_source_url',v.fixed_income_source_url,
    'fixed_income_as_of_date',v.fixed_income_as_of_date,
    'liquidity_level',v.liquidity_level
  )),
  'dimensions',jsonb_build_array(
   jsonb_build_object(
    'code','loss_potential','level','Low','direction','higher_is_worse','confidence','High',
    'source_basis',jsonb_build_object('issuer','Government of Canada')
   ),
   jsonb_build_object(
    'code','price_movement','level',price,'direction','higher_is_worse','confidence',price_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'remaining_term_months',v.remaining_term_months,'price_volatility',v.price_volatility
    ))
   ),
   jsonb_build_object(
    'code','access_to_money','level',access,'direction','higher_is_better','confidence',access_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'liquidity_level',v.liquidity_level,'market_access_note',v.market_access_note
    ))
   ),
   jsonb_build_object(
    'code','diversification','level',divv,'direction','higher_is_better','confidence','High',
    'source_basis',jsonb_build_object('single_sovereign_issuer',true)
   )
  )
 );
end $$;
