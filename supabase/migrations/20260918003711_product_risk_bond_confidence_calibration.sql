
create or replace function investor_private.product_risk_eval_bond(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record;
 loss text; price text; access text; divv text; overall text;
 loss_conf text; price_conf text; access_conf text; div_conf text; conf text;
 flags jsonb:='[]'::jsonb; dominant jsonb:='[]'::jsonb;
begin
 select * into v
 from public.v_instrument_research_catalog
 where id=p_investment_id and asset_type='BOND'
 limit 1;

 if not found then
  return jsonb_build_object('status','asset_mismatch','module_code','bond-risk');
 end if;

 loss:=case
  when lower(coalesce(v.credit_exposure,'')) like '%government of canada%' then 'Low'
  when lower(coalesce(v.credit_exposure,'')) like '%province of ontario%' then 'Low to Medium'
  when v.credit_exposure is not null then 'Medium'
  else 'Unknown'
 end;

 price:=investor_private.product_risk_price_level(v.price_volatility);
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);

 loss_conf:=case
  when loss='Unknown' then 'Insufficient'
  when v.credit_rating is not null then 'High'
  else 'Medium'
 end;

 price_conf:=case
  when price='Unknown' then 'Insufficient'
  when v.duration_years is not null then 'High'
  else 'Medium'
 end;

 access_conf:=case
  when access='Unknown' then 'Insufficient'
  else 'Medium'
 end;

 div_conf:=case
  when divv='Unknown' then 'Insufficient'
  else 'High'
 end;

 overall:=investor_private.product_risk_overall_v1('BOND',loss,price,access,divv);
 conf:=investor_private.product_risk_overall_confidence_v1(loss_conf,price_conf,access_conf,div_conf);

 flags:=flags||jsonb_build_array(jsonb_build_object(
  'code','single_issuer',
  'label','Single issuer exposure',
  'severity','info'
 ));

 if lower(coalesce(v.interest_rate_sensitivity,'')) in ('medium','high') then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','rate_sensitive',
   'label','Sensitive to interest-rate changes',
   'severity',case when lower(v.interest_rate_sensitivity)='high' then 'important' else 'attention' end
  ));
  dominant:=dominant||to_jsonb('Interest-rate sensitivity'::text);
 end if;

 if investor_private.product_risk_rank(loss)>=2 then
  dominant:=dominant||to_jsonb('Issuer credit risk'::text);
 end if;

 if v.credit_rating is null and lower(coalesce(v.credit_exposure,'')) not like '%government of canada%' then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','credit_rating_unavailable',
   'label','Current research record does not include a verified issue credit rating',
   'severity','attention'
  ));
 end if;

 return jsonb_build_object(
  'status','draft',
  'asset_type','BOND',
  'module_code','bond-risk',
  'module_version','bond-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',coalesce(v.fixed_income_as_of_date,v.structure_as_of_date),
  'summary',format(
   'A single-issuer bond with %s loss potential, %s price movement and %s access to money.',
   lower(loss),lower(price),lower(access)
  ),
  'dominant_risks',dominant,
  'key_flags',flags,
  'source_basis',jsonb_strip_nulls(jsonb_build_object(
    'credit_exposure',v.credit_exposure,
    'credit_rating',v.credit_rating,
    'credit_rating_agency',v.credit_rating_agency,
    'duration_years',v.duration_years,
    'remaining_term_months',v.remaining_term_months,
    'fixed_income_source_name',v.fixed_income_source_name,
    'fixed_income_source_url',v.fixed_income_source_url,
    'fixed_income_as_of_date',v.fixed_income_as_of_date
  )),
  'dimensions',jsonb_build_array(
   jsonb_build_object(
    'code','loss_potential','level',loss,'direction','higher_is_worse','confidence',loss_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'credit_exposure',v.credit_exposure,'credit_rating',v.credit_rating,'credit_rating_agency',v.credit_rating_agency
    ))
   ),
   jsonb_build_object(
    'code','price_movement','level',price,'direction','higher_is_worse','confidence',price_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'duration_years',v.duration_years,'remaining_term_months',v.remaining_term_months,
      'interest_rate_sensitivity',v.interest_rate_sensitivity,'price_volatility',v.price_volatility
    ))
   ),
   jsonb_build_object(
    'code','access_to_money','level',access,'direction','higher_is_better','confidence',access_conf,
    'source_basis',jsonb_strip_nulls(jsonb_build_object(
      'liquidity_level',v.liquidity_level,'market_access_note',v.market_access_note
    ))
   ),
   jsonb_build_object(
    'code','diversification','level',divv,'direction','higher_is_better','confidence',div_conf,
    'source_basis',jsonb_build_object('single_issuer',true)
   )
  )
 );
end $$;
