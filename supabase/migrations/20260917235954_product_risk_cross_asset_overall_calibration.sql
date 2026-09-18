
create or replace function investor_private.product_risk_eval_gic(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record; loss text; price text; access text; divv text; overall text; conf text; flags jsonb:='[]'::jsonb;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type='GIC' limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code','gic-risk'); end if;
 loss:=case when v.deposit_insurance_eligible is true and v.capital_protection='insured_deposit' then 'Low'
            when v.capital_protection in ('contractual','insured_deposit') then 'Low to Medium' else 'Unknown' end;
 price:=investor_private.product_risk_price_level(v.price_volatility);
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);
 overall:=investor_private.product_risk_overall_v1('GIC',loss,price,access,divv);
 conf:=case when v.deposit_as_of_date is not null and v.deposit_insurance_eligible is not null then 'High' else 'Medium' end;
 if v.redeemability='non_redeemable' or v.liquidity_level='locked' then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','locked_until_maturity','label','Locked until maturity under standard terms','severity','important'));
 end if;
 flags:=flags||jsonb_build_array(jsonb_build_object('code','single_issuer','label','Single issuer exposure','severity','info'));
 if v.deposit_insurance_eligible is true then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','deposit_insurance_eligible','label','Eligible for deposit insurance subject to applicable coverage rules','severity','info'));
 end if;
 return jsonb_build_object(
  'status','draft','asset_type','GIC','module_code','gic-risk','module_version','gic-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',coalesce(v.deposit_as_of_date,v.structure_as_of_date),
  'summary',format('A fixed-term deposit with %s loss potential and %s access to money. Access depends on its redemption rules.',lower(loss),lower(access)),
  'dominant_risks',jsonb_build_array('Access restrictions','Single issuer exposure'),'key_flags',flags,
  'dimensions',jsonb_build_array(
   jsonb_build_object('code','loss_potential','level',loss,'direction','higher_is_worse','confidence',conf),
   jsonb_build_object('code','price_movement','level',price,'direction','higher_is_worse','confidence','High'),
   jsonb_build_object('code','access_to_money','level',access,'direction','higher_is_better','confidence','High'),
   jsonb_build_object('code','diversification','level',divv,'direction','higher_is_better','confidence','High')
  )
 );
end $$;

create or replace function investor_private.product_risk_eval_t_bill(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v record; price text; access text; divv text; overall text;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type='T_BILL' limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code','t-bill-risk'); end if;
 price:=investor_private.product_risk_price_level(v.price_volatility);
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);
 overall:=investor_private.product_risk_overall_v1('T_BILL','Low',price,access,divv);
 return jsonb_build_object(
  'status','draft','asset_type','T_BILL','module_code','t-bill-risk','module_version','t-bill-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence','High'),
  'as_of_date',coalesce(v.fixed_income_as_of_date,v.structure_as_of_date),
  'summary','A short-term Government of Canada security with low loss potential, small price movement and high access to money.',
  'dominant_risks',jsonb_build_array('Reinvestment risk','Inflation risk'),
  'key_flags',jsonb_build_array(jsonb_build_object('code','single_sovereign_issuer','label','Single Government of Canada issuer exposure','severity','info')),
  'dimensions',jsonb_build_array(
   jsonb_build_object('code','loss_potential','level','Low','direction','higher_is_worse','confidence','High'),
   jsonb_build_object('code','price_movement','level',price,'direction','higher_is_worse','confidence','High'),
   jsonb_build_object('code','access_to_money','level',access,'direction','higher_is_better','confidence','High'),
   jsonb_build_object('code','diversification','level',divv,'direction','higher_is_better','confidence','High')
  )
 );
end $$;

create or replace function investor_private.product_risk_eval_bond(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record; loss text; price text; access text; divv text; overall text; conf text:='Medium';
 flags jsonb:='[]'::jsonb; dominant jsonb:='[]'::jsonb;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type='BOND' limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code','bond-risk'); end if;
 loss:=case when lower(coalesce(v.credit_exposure,'')) like '%government of canada%' then 'Low'
            when lower(coalesce(v.credit_exposure,'')) like '%province of ontario%' then 'Low to Medium'
            when v.credit_exposure is not null then 'Medium' else 'Unknown' end;
 price:=investor_private.product_risk_price_level(v.price_volatility);
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);
 overall:=investor_private.product_risk_overall_v1('BOND',loss,price,access,divv);
 if v.fixed_income_as_of_date is not null and v.structure_as_of_date is not null then conf:='High'; end if;
 flags:=flags||jsonb_build_array(jsonb_build_object('code','single_issuer','label','Single issuer exposure','severity','info'));
 if lower(coalesce(v.interest_rate_sensitivity,'')) in ('medium','high') then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','rate_sensitive','label','Sensitive to interest-rate changes','severity',
   case when lower(v.interest_rate_sensitivity)='high' then 'important' else 'attention' end));
  dominant:=dominant||to_jsonb('Interest-rate sensitivity'::text);
 end if;
 if investor_private.product_risk_rank(loss)>=2 then dominant:=dominant||to_jsonb('Issuer credit risk'::text); end if;
 return jsonb_build_object(
  'status','draft','asset_type','BOND','module_code','bond-risk','module_version','bond-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',coalesce(v.fixed_income_as_of_date,v.structure_as_of_date),
  'summary',format('A single-issuer bond with %s loss potential, %s price movement and %s access to money.',lower(loss),lower(price),lower(access)),
  'dominant_risks',dominant,'key_flags',flags,
  'dimensions',jsonb_build_array(
   jsonb_build_object('code','loss_potential','level',loss,'direction','higher_is_worse','confidence',conf),
   jsonb_build_object('code','price_movement','level',price,'direction','higher_is_worse','confidence',conf),
   jsonb_build_object('code','access_to_money','level',access,'direction','higher_is_better','confidence',conf),
   jsonb_build_object('code','diversification','level',divv,'direction','higher_is_better','confidence','High')
  )
 );
end $$;
