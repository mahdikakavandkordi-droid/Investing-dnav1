
create or replace function investor_private.product_risk_normalize_band(p_value text)
returns text language sql immutable security invoker set search_path='' as $$
 select case lower(trim(coalesce(p_value,'')))
  when 'low' then 'Low'
  when 'low to medium' then 'Low to Medium'
  when 'low-medium' then 'Low to Medium'
  when 'low medium' then 'Low to Medium'
  when 'medium' then 'Medium'
  when 'medium to high' then 'Medium to High'
  when 'medium-high' then 'Medium to High'
  when 'medium high' then 'Medium to High'
  when 'high' then 'High'
  when 'n/a' then 'N/A'
  else 'Unknown'
 end
$$;

create or replace function investor_private.product_risk_rank(p_band text)
returns integer language sql immutable security invoker set search_path='' as $$
 select case investor_private.product_risk_normalize_band(p_band)
  when 'Low' then 0 when 'Low to Medium' then 1 when 'Medium' then 2
  when 'Medium to High' then 3 when 'High' then 4 else null end
$$;

create or replace function investor_private.product_risk_max_band(p_a text,p_b text)
returns text language sql immutable security invoker set search_path='' as $$
 select case
  when investor_private.product_risk_rank(p_a) is null then investor_private.product_risk_normalize_band(p_b)
  when investor_private.product_risk_rank(p_b) is null then investor_private.product_risk_normalize_band(p_a)
  when investor_private.product_risk_rank(p_a)>=investor_private.product_risk_rank(p_b)
    then investor_private.product_risk_normalize_band(p_a)
  else investor_private.product_risk_normalize_band(p_b) end
$$;

create or replace function investor_private.product_risk_price_level(p_value text)
returns text language sql immutable security invoker set search_path='' as $$
 select case lower(trim(coalesce(p_value,'')))
  when 'none' then 'Low' when 'very_low' then 'Low' when 'low' then 'Low to Medium'
  when 'medium' then 'Medium' when 'high' then 'Medium to High' when 'very_high' then 'High'
  else 'Unknown' end
$$;

create or replace function investor_private.product_risk_access_level(p_value text)
returns text language sql immutable security invoker set search_path='' as $$
 select case lower(trim(coalesce(p_value,'')))
  when 'locked' then 'Low' when 'low' then 'Low to Medium'
  when 'medium' then 'Medium' when 'high' then 'High' else 'Unknown' end
$$;

create or replace function investor_private.product_risk_diversification_level(p_value text)
returns text language sql immutable security invoker set search_path='' as $$
 select case lower(trim(coalesce(p_value,'')))
  when 'single_issuer' then 'Low' when 'limited' then 'Medium'
  when 'diversified' then 'High' else 'Unknown' end
$$;

create or replace function investor_private.product_risk_eval_etf(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record; official text; price text; loss text; access text; divv text; overall text;
 conf text; flags jsonb:='[]'::jsonb; dominant jsonb:='[]'::jsonb;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type='ETF' limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code','etf-risk'); end if;
 official:=investor_private.product_risk_normalize_band(v.risk_level);
 price:=investor_private.product_risk_price_level(v.price_volatility);
 if official<>'Unknown' then
  price:=investor_private.product_risk_max_band(price,official); loss:=official; overall:=official; conf:='High';
 else
  loss:=case when coalesce(v.equity_pct,0)>=90 then investor_private.product_risk_max_band(price,'Medium')
             when coalesce(v.equity_pct,0)>=60 then investor_private.product_risk_max_band(price,'Low to Medium')
             else price end;
  overall:=investor_private.product_risk_max_band(loss,price); conf:='Medium';
  flags:=flags||jsonb_build_array(jsonb_build_object('code','official_risk_unavailable','label','Official ETF risk rating not available in the current record','severity','attention'));
 end if;
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);
 if investor_private.product_risk_rank(price)>=2 then dominant:=dominant||to_jsonb('Market price movement'::text); end if;
 if lower(coalesce(v.interest_rate_sensitivity,''))='high' then
  flags:=flags||jsonb_build_array(jsonb_build_object('code','rate_sensitive','label','Sensitive to interest rates','severity','attention'));
 end if;
 return jsonb_build_object(
  'status','draft','asset_type','ETF','module_code','etf-risk','module_version','etf-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',coalesce(v.structure_as_of_date,v.metrics_as_of_date,v.profile_as_of_date),
  'summary',format('A %s ETF with %s access to money and %s diversification. Its current research risk profile is %s.',
    lower(coalesce(v.category,'market')),lower(access),lower(divv),overall),
  'dominant_risks',dominant,'key_flags',flags,
  'dimensions',jsonb_build_array(
   jsonb_build_object('code','loss_potential','level',loss,'direction','higher_is_worse','confidence',conf),
   jsonb_build_object('code','price_movement','level',price,'direction','higher_is_worse','confidence',conf),
   jsonb_build_object('code','access_to_money','level',access,'direction','higher_is_better','confidence','High'),
   jsonb_build_object('code','diversification','level',divv,'direction','higher_is_better','confidence','High')
  )
 );
end $$;

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
 overall:=investor_private.product_risk_max_band(loss,price);
 conf:=case when v.deposit_as_of_date is not null and v.deposit_insurance_eligible is not null then 'High' else 'Medium' end;
 if v.redeemability='non_redeemable' or v.liquidity_level='locked' then
  flags:=flags||jsonb_build_array(jsonb_build_object('code','locked_until_maturity','label','Locked until maturity under standard terms','severity','important'));
 end if;
 flags:=flags||jsonb_build_array(jsonb_build_object('code','single_issuer','label','Single issuer exposure','severity','info'));
 if v.deposit_insurance_eligible is true then
  flags:=flags||jsonb_build_array(jsonb_build_object('code','deposit_insurance_eligible','label','Eligible for deposit insurance subject to applicable coverage rules','severity','info'));
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
declare v record; price text; access text; divv text;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type='T_BILL' limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code','t-bill-risk'); end if;
 price:=investor_private.product_risk_price_level(v.price_volatility);
 access:=investor_private.product_risk_access_level(v.liquidity_level);
 divv:=investor_private.product_risk_diversification_level(v.diversification_level);
 return jsonb_build_object(
  'status','draft','asset_type','T_BILL','module_code','t-bill-risk','module_version','t-bill-risk-v1-research',
  'overall_risk',jsonb_build_object('band','Low','confidence','High'),
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
 overall:=investor_private.product_risk_max_band(loss,price);
 if v.fixed_income_as_of_date is not null and v.structure_as_of_date is not null then conf:='High'; end if;
 flags:=flags||jsonb_build_array(jsonb_build_object('code','single_issuer','label','Single issuer exposure','severity','info'));
 if lower(coalesce(v.interest_rate_sensitivity,'')) in ('medium','high') then
  flags:=flags||jsonb_build_array(jsonb_build_object('code','rate_sensitive','label','Sensitive to interest-rate changes','severity',
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

create or replace function investor_private.product_risk_eval_reference(p_investment_id uuid,p_asset_type text,p_module_code text,p_module_version text)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v record;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type=p_asset_type limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code',p_module_code); end if;
 return jsonb_build_object(
  'status','draft','asset_type',p_asset_type,'module_code',p_module_code,'module_version',p_module_version,
  'overall_risk',jsonb_build_object('band','Unknown','confidence','Insufficient'),
  'as_of_date',coalesce(v.fixed_income_as_of_date,v.structure_as_of_date),
  'summary','Research reference only. Current issue-level data is not complete enough to publish a calibrated Product Risk DNA profile.',
  'dominant_risks','[]'::jsonb,
  'key_flags',jsonb_build_array(jsonb_build_object('code','reference_only','label','Research reference — live issue-level risk data incomplete','severity','important')),
  'dimensions',jsonb_build_array(
   jsonb_build_object('code','loss_potential','level','Unknown','direction','higher_is_worse','confidence','Insufficient'),
   jsonb_build_object('code','price_movement','level','Unknown','direction','higher_is_worse','confidence','Insufficient'),
   jsonb_build_object('code','access_to_money','level','Unknown','direction','higher_is_better','confidence','Insufficient'),
   jsonb_build_object('code','diversification','level','Unknown','direction','higher_is_better','confidence','Insufficient')
  )
 );
end $$;

create or replace function investor_private.product_risk_evaluate(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((
  select case v.asset_type
   when 'ETF' then investor_private.product_risk_eval_etf(v.id)
   when 'GIC' then investor_private.product_risk_eval_gic(v.id)
   when 'T_BILL' then investor_private.product_risk_eval_t_bill(v.id)
   when 'BOND' then investor_private.product_risk_eval_bond(v.id)
   when 'COMMERCIAL_PAPER' then investor_private.product_risk_eval_reference(v.id,'COMMERCIAL_PAPER','commercial-paper-risk','commercial-paper-risk-v1-research')
   when 'ABCP' then investor_private.product_risk_eval_reference(v.id,'ABCP','abcp-risk','abcp-risk-v1-research')
   else jsonb_build_object('status','unsupported_asset','asset_type',v.asset_type) end
  from public.v_instrument_research_catalog v where v.id=p_investment_id limit 1
 ),jsonb_build_object('status','not_found'))
$$;

revoke all on function investor_private.product_risk_normalize_band(text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_rank(text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_max_band(text,text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_price_level(text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_access_level(text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_diversification_level(text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_eval_etf(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_eval_gic(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_eval_t_bill(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_eval_bond(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_eval_reference(uuid,text,text,text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_evaluate(uuid) from public,anon,authenticated;

grant execute on function investor_private.product_risk_normalize_band(text) to service_role;
grant execute on function investor_private.product_risk_rank(text) to service_role;
grant execute on function investor_private.product_risk_max_band(text,text) to service_role;
grant execute on function investor_private.product_risk_price_level(text) to service_role;
grant execute on function investor_private.product_risk_access_level(text) to service_role;
grant execute on function investor_private.product_risk_diversification_level(text) to service_role;
grant execute on function investor_private.product_risk_eval_etf(uuid) to service_role;
grant execute on function investor_private.product_risk_eval_gic(uuid) to service_role;
grant execute on function investor_private.product_risk_eval_t_bill(uuid) to service_role;
grant execute on function investor_private.product_risk_eval_bond(uuid) to service_role;
grant execute on function investor_private.product_risk_eval_reference(uuid,text,text,text) to service_role;
grant execute on function investor_private.product_risk_evaluate(uuid) to service_role;
