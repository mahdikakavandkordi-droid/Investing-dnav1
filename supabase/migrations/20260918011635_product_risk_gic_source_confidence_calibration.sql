
create or replace function investor_private.product_risk_eval_gic(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record;
 loss text; price text; access text; divv text; overall text;
 loss_conf text; price_conf text; access_conf text; div_conf text; conf text;
 flags jsonb:='[]'::jsonb;
begin
 select * into v
 from public.v_instrument_research_catalog
 where id=p_investment_id and asset_type='GIC'
 limit 1;

 if not found then
  return jsonb_build_object('status','asset_mismatch','module_code','gic-risk');
 end if;

 loss:=case
  when v.deposit_insurance_eligible is true
   and v.capital_protection='insured_deposit'
   and nullif(trim(coalesce(v.deposit_insurance_scheme,'')),'') is not null
   then 'Low'
  when v.capital_protection in ('contractual','insured_deposit') then 'Low to Medium'
  else 'Unknown'
 end;

 price:=investor_private.product_risk_price_level(v.price_volatility);
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);

 loss_conf:=case
  when loss='Unknown' then 'Insufficient'
  when v.deposit_source_url is not null
   and v.deposit_as_of_date is not null
   and v.deposit_insurance_eligible is not null
   and v.deposit_insurance_scheme is not null
   then 'High'
  else 'Medium'
 end;

 price_conf:=case
  when price='Unknown' then 'Insufficient'
  when v.deposit_source_url is not null
   and v.deposit_as_of_date is not null
   and v.term_months is not null
   then 'High'
  else 'Medium'
 end;

 access_conf:=case
  when access='Unknown' then 'Insufficient'
  when v.deposit_source_url is not null
   and v.deposit_as_of_date is not null
   and v.redeemability is not null
   then 'High'
  else 'Medium'
 end;

 div_conf:=case
  when divv='Unknown' then 'Insufficient'
  when v.credit_exposure is not null then 'High'
  else 'Medium'
 end;

 overall:=investor_private.product_risk_overall_v1('GIC',loss,price,access,divv);
 conf:=investor_private.product_risk_overall_confidence_v1(loss_conf,price_conf,access_conf,div_conf);

 if v.redeemability='non_redeemable' or v.liquidity_level='locked' then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','locked_until_maturity',
   'label','Locked until maturity under standard terms',
   'severity','important'
  ));
 end if;

 flags:=flags||jsonb_build_array(jsonb_build_object(
  'code','single_issuer',
  'label','Single issuer exposure',
  'severity','info'
 ));

 if v.deposit_insurance_eligible is true then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','deposit_insurance_eligible',
   'label','Eligible for deposit insurance subject to applicable coverage limits and categories',
   'severity','info'
  ));
 end if;

 return jsonb_build_object(
  'status','draft',
  'asset_type','GIC',
  'module_code','gic-risk',
  'module_version','gic-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',coalesce(v.deposit_as_of_date,v.structure_as_of_date),
  'summary',format(
   'A fixed-term deposit with %s loss potential and %s access to money. Access depends on its redemption rules.',
   lower(loss),lower(access)
  ),
  'dominant_risks',jsonb_build_array('Access restrictions','Single issuer exposure'),
  'key_flags',flags,
  'source_basis',jsonb_strip_nulls(jsonb_build_object(
    'deposit_source_name',v.deposit_source_name,
    'deposit_source_url',v.deposit_source_url,
    'deposit_as_of_date',v.deposit_as_of_date,
    'deposit_insurance_scheme',v.deposit_insurance_scheme,
    'deposit_insurance_eligible',v.deposit_insurance_eligible,
    'redeemability',v.redeemability,
    'term_months',v.term_months,
    'credit_exposure',v.credit_exposure
  )),
  'dimensions',jsonb_build_array(
   jsonb_build_object(
    'code','loss_potential','level',loss,'direction','higher_is_worse','confidence',loss_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'deposit_insurance_scheme',v.deposit_insurance_scheme,
      'deposit_insurance_eligible',v.deposit_insurance_eligible,
      'capital_protection',v.capital_protection,
      'deposit_source_url',v.deposit_source_url
    ))
   ),
   jsonb_build_object(
    'code','price_movement','level',price,'direction','higher_is_worse','confidence',price_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'price_volatility',v.price_volatility,'term_months',v.term_months
    ))
   ),
   jsonb_build_object(
    'code','access_to_money','level',access,'direction','higher_is_better','confidence',access_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'redeemability',v.redeemability,'liquidity_level',v.liquidity_level
    ))
   ),
   jsonb_build_object(
    'code','diversification','level',divv,'direction','higher_is_better','confidence',div_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'credit_exposure',v.credit_exposure,'diversification_level',v.diversification_level
    ))
   )
  )
 );
end $$;
