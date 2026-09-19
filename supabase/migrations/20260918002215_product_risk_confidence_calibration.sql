
create or replace function investor_private.product_risk_overall_confidence_v1(
 p_loss_conf text,
 p_price_conf text,
 p_access_conf text,
 p_diversification_conf text
) returns text
language sql immutable security invoker set search_path='' as $$
 select case
  when p_loss_conf='Insufficient' or p_price_conf='Insufficient' then 'Insufficient'
  when 'Low'=any(array[p_loss_conf,p_price_conf,p_access_conf,p_diversification_conf]) then 'Low'
  when 'Medium'=any(array[p_loss_conf,p_price_conf,p_access_conf,p_diversification_conf])
    or 'Insufficient'=any(array[p_access_conf,p_diversification_conf]) then 'Medium'
  else 'High'
 end
$$;

create or replace function investor_private.product_risk_eval_etf(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record; official jsonb; holdings jsonb; credit jsonb; ae jsonb; de jsonb;
 ob text; price text; loss text; access text; divv text; overall text;
 conf text; loss_conf text; price_conf text; access_conf text; div_conf text;
 flags jsonb:='[]'::jsonb; dominant jsonb:='[]'::jsonb; cq text;
begin
 select * into v from public.v_instrument_research_catalog where id=p_investment_id and asset_type='ETF' limit 1;
 if not found then return jsonb_build_object('status','asset_mismatch','module_code','etf-risk'); end if;
 official:=investor_private.product_risk_etf_official_rating(v.id);
 holdings:=investor_private.product_risk_etf_effective_holdings(v.id);
 credit:=investor_private.product_risk_etf_credit_quality(v.id);
 ae:=investor_private.product_risk_etf_access(v.id,v.liquidity_level);
 de:=investor_private.product_risk_etf_diversification(v.id,v.diversification_level,v.sector);
 ob:=investor_private.product_risk_normalize_band(official->>'rating');
 if ob<>'Unknown' then price:=ob; price_conf:='High';
 else
  price:=investor_private.product_risk_price_level(v.price_volatility);
  price_conf:=case when price='Unknown' then 'Insufficient' else 'Medium' end;
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','official_risk_unavailable','label','Official ETF risk rating not available in the current record','severity','attention'));
 end if;
 cq:=upper(coalesce(credit->>'average_credit_quality',''));
 loss:=case
  when coalesce(v.equity_pct,0)>=90 and nullif(trim(coalesce(v.sector,'')),'') is not null then 'High'
  when coalesce(v.equity_pct,0)>=90 then 'Medium to High'
  when coalesce(v.equity_pct,0)>=40 then 'Medium'
  when coalesce(v.equity_pct,0)>0 then 'Low to Medium'
  when coalesce(v.fixed_income_pct,0)>=80 and cq in ('AAA','AA+','AA','AA-') then 'Low'
  when coalesce(v.fixed_income_pct,0)>=80 then 'Low to Medium'
  when v.capital_protection in ('insured_deposit','contractual') then 'Low'
  when v.capital_protection='conditional' then 'Low to Medium'
  else investor_private.product_risk_price_level(v.price_volatility) end;
 loss_conf:=case when loss='Unknown' then 'Insufficient'
                 when v.equity_pct is not null or v.fixed_income_pct is not null then 'High'
                 else 'Medium' end;
 access:=coalesce(ae->>'level','Unknown');
 divv:=coalesce(de->>'level','Unknown');
 access_conf:=coalesce(ae->>'confidence','Insufficient');
 div_conf:=coalesce(de->>'confidence','Insufficient');
 overall:=investor_private.product_risk_overall_v1('ETF',loss,price,access,divv);
 conf:=investor_private.product_risk_overall_confidence_v1(loss_conf,price_conf,access_conf,div_conf);
 if investor_private.product_risk_rank(price)>=2 then dominant:=dominant||to_jsonb('Market price movement'::text); end if;
 if nullif(trim(coalesce(v.sector,'')),'') is not null then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','sector_concentration','label',format('Focused on the %s sector',v.sector),'severity','attention'));
 end if;
 if lower(coalesce(v.interest_rate_sensitivity,''))='high' or coalesce(nullif(credit->>'average_duration_years','')::numeric,0)>=8 then
  flags:=flags||jsonb_build_array(jsonb_build_object(
   'code','rate_sensitive','label','Sensitive to interest-rate changes','severity','attention'));
 end if;
 return jsonb_build_object(
  'status','draft','asset_type','ETF','module_code','etf-risk','module_version','etf-risk-v1-research',
  'overall_risk',jsonb_build_object('band',overall,'confidence',conf),
  'as_of_date',greatest(nullif(official->>'source_date','')::date,v.structure_as_of_date,v.metrics_as_of_date,
                        v.profile_as_of_date,nullif(holdings->>'as_of_date','')::date),
  'summary',format('%s ETF with %s access to money and %s diversification. Loss potential is %s while price movement is %s.',
   case lower(coalesce(v.category,'')) when 'asset allocation' then 'An asset-allocation'
    when 'fixed income' then 'A fixed-income' when 'equity' then 'An equity' else 'An investment' end,
   lower(access),lower(divv),lower(loss),lower(price)),
  'dominant_risks',dominant,'key_flags',flags,
  'source_basis',jsonb_build_object('official_risk',official,'holdings',holdings,'credit_quality',credit,'access',ae,'diversification',de),
  'dimensions',jsonb_build_array(
   jsonb_build_object('code','loss_potential','level',loss,'direction','higher_is_worse',
    'confidence',loss_conf,
    'source_basis',jsonb_build_object('equity_pct',v.equity_pct,'fixed_income_pct',v.fixed_income_pct,
      'average_credit_quality',credit->>'average_credit_quality','sector',v.sector)),
   jsonb_build_object('code','price_movement','level',price,'direction','higher_is_worse','confidence',price_conf,
    'source_basis',jsonb_build_object('official_risk',official)),
   jsonb_build_object('code','access_to_money','level',access,'direction','higher_is_better',
    'confidence',access_conf,'source_basis',ae),
   jsonb_build_object('code','diversification','level',divv,'direction','higher_is_better',
    'confidence',div_conf,'source_basis',de)
  )
 );
end $$;

revoke all on function investor_private.product_risk_overall_confidence_v1(text,text,text,text) from public,anon,authenticated;
grant execute on function investor_private.product_risk_overall_confidence_v1(text,text,text,text) to service_role;
