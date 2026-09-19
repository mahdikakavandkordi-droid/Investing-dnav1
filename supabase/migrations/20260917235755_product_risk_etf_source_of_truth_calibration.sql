
create or replace function investor_private.product_risk_min_band(p_a text,p_b text)
returns text language sql immutable security invoker set search_path='' as $$
 select case
  when investor_private.product_risk_rank(p_a) is null then investor_private.product_risk_normalize_band(p_b)
  when investor_private.product_risk_rank(p_b) is null then investor_private.product_risk_normalize_band(p_a)
  when investor_private.product_risk_rank(p_a)<=investor_private.product_risk_rank(p_b)
    then investor_private.product_risk_normalize_band(p_a)
  else investor_private.product_risk_normalize_band(p_b) end
$$;

create or replace function investor_private.product_risk_etf_official_rating(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((
  select jsonb_strip_nulls(jsonb_build_object(
   'rating',o.official_risk_rating,'effective_date',o.effective_date,'source_date',o.source_date,
   'source_title',o.source_title,'source_url',o.source_url,'issuer',o.issuer,
   'methodology',o.methodology,'verified_at',o.verified_at,'verification_note',o.verification_note
  ))
  from public.investment_official_risk_ratings o
  where o.investment_id=p_investment_id
  limit 1
 ),'{}'::jsonb)
$$;

create or replace function investor_private.product_risk_etf_effective_holdings(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((
  select jsonb_strip_nulls(jsonb_build_object(
   'effective_count',coalesce(pc.number_of_underlying_holdings,pc.number_of_holdings),
   'direct_holdings',pc.number_of_holdings,'underlying_holdings',pc.number_of_underlying_holdings,
   'as_of_date',pc.as_of_date,'source_id',pc.source_id
  ))
  from public.investment_portfolio_characteristics pc
  where pc.investment_id=p_investment_id
    and coalesce(pc.number_of_underlying_holdings,pc.number_of_holdings) is not null
  order by pc.as_of_date desc,pc.created_at desc
  limit 1
 ),'{}'::jsonb)
$$;

create or replace function investor_private.product_risk_etf_credit_quality(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((
  select jsonb_strip_nulls(jsonb_build_object(
    'average_credit_quality',cq.average_credit_quality,
    'credit_quality_as_of_date',cq.as_of_date,
    'credit_quality_source_id',cq.source_id,
    'average_duration_years',du.average_duration_years,
    'duration_as_of_date',du.as_of_date,
    'duration_source_id',du.source_id
  ))
  from (
    select pc.average_credit_quality,pc.as_of_date,pc.source_id
    from public.investment_portfolio_characteristics pc
    where pc.investment_id=p_investment_id and pc.average_credit_quality is not null
    order by pc.as_of_date desc,pc.created_at desc limit 1
  ) cq
  full join (
    select pc.average_duration_years,pc.as_of_date,pc.source_id
    from public.investment_portfolio_characteristics pc
    where pc.investment_id=p_investment_id and pc.average_duration_years is not null
    order by pc.as_of_date desc,pc.created_at desc limit 1
  ) du on true
 ),'{}'::jsonb)
$$;

create or replace function investor_private.product_risk_latest_observed_numeric(
 p_investment_id uuid,p_metric_key text
) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((
  select jsonb_strip_nulls(jsonb_build_object(
   'value',o.metric_value_numeric,'unit',o.unit,'observed_at',o.observed_at,
   'source_as_of_date',o.source_as_of_date,'source_id',o.source_id,'source_note',o.source_note
  ))
  from public.investment_observed_indicators o
  where o.investment_id=p_investment_id and o.metric_key=p_metric_key and o.metric_value_numeric is not null
  order by o.source_as_of_date desc nulls last,o.observed_at desc,o.created_at desc limit 1
 ),'{}'::jsonb)
$$;

create or replace function investor_private.product_risk_etf_diversification(
 p_investment_id uuid,p_structure_level text,p_sector text
) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare h jsonb; n integer; lvl text; conf text;
begin
 h:=investor_private.product_risk_etf_effective_holdings(p_investment_id);
 n:=nullif(h->>'effective_count','')::integer;
 if n is not null then
  lvl:=case when n>=100 then 'High' when n>=50 then 'Medium to High'
            when n>=20 then 'Medium' when n>=10 then 'Low to Medium' else 'Low' end;
  conf:='High';
 else
  lvl:=investor_private.product_risk_diversification_level(p_structure_level);
  conf:=case when lvl='Unknown' then 'Insufficient' else 'Medium' end;
 end if;
 if nullif(trim(coalesce(p_sector,'')),'') is not null then
  lvl:=investor_private.product_risk_min_band(lvl,'Medium');
 end if;
 return jsonb_strip_nulls(jsonb_build_object(
  'level',lvl,'confidence',conf,'effective_holdings',n,
  'sector_focus',nullif(trim(coalesce(p_sector,'')),''),
  'holdings_evidence',h
 ));
end $$;

create or replace function investor_private.product_risk_etf_access(
 p_investment_id uuid,p_structure_level text
) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare s jsonb; spread numeric; lvl text; conf text;
begin
 s:=investor_private.product_risk_latest_observed_numeric(p_investment_id,'bid_ask_spread_pct');
 spread:=nullif(s->>'value','')::numeric;
 if spread is not null then
  lvl:=case when spread<=0.10 then 'High' when spread<=0.25 then 'Medium to High'
            when spread<=0.50 then 'Medium' when spread<=1.00 then 'Low to Medium' else 'Low' end;
  conf:='High';
 else
  lvl:=investor_private.product_risk_access_level(p_structure_level);
  conf:=case when lvl='Unknown' then 'Insufficient' else 'Medium' end;
 end if;
 return jsonb_strip_nulls(jsonb_build_object(
  'level',lvl,'confidence',conf,'bid_ask_spread_pct',spread,'spread_evidence',s
 ));
end $$;

create or replace function investor_private.product_risk_score_to_band(p_score numeric)
returns text language sql immutable security invoker set search_path='' as $$
 select case when p_score is null then 'Unknown'
  when p_score<=0.75 then 'Low'
  when p_score<=1.50 then 'Low to Medium'
  when p_score<=2.40 then 'Medium'
  when p_score<=3.35 then 'Medium to High'
  else 'High' end
$$;

create or replace function investor_private.product_risk_overall_v1(
 p_asset_type text,p_loss text,p_price text,p_access text,p_diversification text
) returns text language plpgsql immutable security invoker set search_path='' as $$
declare lr numeric; pr numeric; ar numeric; dr numeric; score numeric;
begin
 lr:=investor_private.product_risk_rank(p_loss);
 pr:=investor_private.product_risk_rank(p_price);
 ar:=investor_private.product_risk_rank(p_access);
 dr:=investor_private.product_risk_rank(p_diversification);
 if lr is null or pr is null then return 'Unknown'; end if;
 ar:=coalesce(4-ar,2); dr:=coalesce(4-dr,2);
 score:=case upper(coalesce(p_asset_type,''))
  when 'GIC' then 0.80*lr+0.10*pr+0.10*ar
  when 'T_BILL' then 0.65*lr+0.20*pr+0.10*ar+0.05*dr
  when 'BOND' then 0.35*lr+0.55*pr+0.05*ar+0.05*dr
  else 0.40*lr+0.45*pr+0.10*ar+0.05*dr end;
 return investor_private.product_risk_score_to_band(score);
end $$;

update public.investment_data_sources s
set source_version='2026-01-23'
from public.investments i,public.investment_official_facts f
where s.investment_id=i.id and f.investment_id=i.id and i.symbol='ZFL'
 and s.source_url=f.etf_facts_url and s.source_version='2025-02-28';

with facts(symbol,as_of_date,number_of_holdings,average_credit_quality) as (
 values
 ('ZDV'::text,'2025-11-30'::date,61::integer,null::text),
 ('ZEB','2025-11-30',6,null),('ZFL','2025-11-30',23,'AAA'),('ZRE','2025-11-30',21,null)
),src as (
 select i.id investment_id,f.*,
  (select s.id from public.investment_data_sources s
   join public.investment_official_facts ofa on ofa.investment_id=i.id
   where s.investment_id=i.id and s.source_url=ofa.etf_facts_url
   order by s.created_at desc limit 1) source_id
 from facts f join public.investments i on i.symbol=f.symbol and i.asset_type='ETF'
)
insert into public.investment_portfolio_characteristics(
 investment_id,as_of_date,number_of_holdings,average_credit_quality,source_id
)
select investment_id,as_of_date,number_of_holdings,average_credit_quality,source_id from src
on conflict(investment_id,as_of_date) do update
set number_of_holdings=coalesce(excluded.number_of_holdings,public.investment_portfolio_characteristics.number_of_holdings),
 average_credit_quality=coalesce(excluded.average_credit_quality,public.investment_portfolio_characteristics.average_credit_quality),
 source_id=coalesce(excluded.source_id,public.investment_portfolio_characteristics.source_id);

with facts(symbol,avg_daily_volume,bid_ask_spread_pct) as (
 values
 ('ZDV'::text,147130::numeric,0.06::numeric),('ZEB',6182051,0.02),('ZFL',1743167,0.10),('ZRE',115424,0.09)
),src as (
 select i.id investment_id,f.*,
  (select s.id from public.investment_data_sources s
   join public.investment_official_facts ofa on ofa.investment_id=i.id
   where s.investment_id=i.id and s.source_url=ofa.etf_facts_url
   order by s.created_at desc limit 1) source_id
 from facts f join public.investments i on i.symbol=f.symbol and i.asset_type='ETF'
),rows as (
 select investment_id,'average_daily_volume_units'::text metric_key,avg_daily_volume value,'units'::text unit,source_id from src
 union all
 select investment_id,'bid_ask_spread_pct',bid_ask_spread_pct,'percent',source_id from src
)
insert into public.investment_observed_indicators(
 investment_id,observed_at,metric_key,metric_value_numeric,unit,source_id,source_as_of_date,source_note
)
select investment_id,'2025-12-31 23:59:59+00'::timestamptz,metric_key,value,unit,source_id,'2025-12-31'::date,
 'BMO ETF Facts trading information for the 12 months ending December 31, 2025.'
from rows
on conflict(investment_id,observed_at,metric_key) do update
set metric_value_numeric=excluded.metric_value_numeric,unit=excluded.unit,
 source_id=coalesce(excluded.source_id,public.investment_observed_indicators.source_id),
 source_as_of_date=excluded.source_as_of_date,source_note=excluded.source_note;

create or replace function investor_private.product_risk_inputs_etf(p_investment_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((
  select investor_private.product_risk_input_base(v.id)||jsonb_build_object(
   'module_code','etf-risk','module_version','etf-risk-v1-research',
   'specific',jsonb_strip_nulls(jsonb_build_object(
    'official_risk',investor_private.product_risk_etf_official_rating(v.id),
    'volatility_1y_pct',v.volatility_1y_pct,'volatility_3y_pct',v.volatility_3y_pct,
    'max_drawdown_1y_pct',v.max_drawdown_1y_pct,'max_drawdown_3y_pct',v.max_drawdown_3y_pct,
    'beta',v.beta,'aum',v.aum,'volume',v.volume,'equity_pct',v.equity_pct,
    'fixed_income_pct',v.fixed_income_pct,'replication_method',v.profile_replication_method,
    'currency_hedging',v.profile_currency_hedging,'portfolio_construction',v.profile_portfolio_construction,
    'effective_holdings',investor_private.product_risk_etf_effective_holdings(v.id),
    'credit_quality',investor_private.product_risk_etf_credit_quality(v.id),
    'bid_ask_spread',investor_private.product_risk_latest_observed_numeric(v.id,'bid_ask_spread_pct')
   )),'missing_sensor_policy','omitted_means_unknown'
  )
  from public.v_instrument_research_catalog v
  where v.id=p_investment_id and v.asset_type='ETF' limit 1
 ),jsonb_build_object('input_status','asset_mismatch','module_code','etf-risk'))
$$;

create or replace function investor_private.product_risk_eval_etf(p_investment_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare
 v record; official jsonb; holdings jsonb; credit jsonb; ae jsonb; de jsonb;
 ob text; price text; loss text; access text; divv text; overall text;
 conf text; price_conf text; flags jsonb:='[]'::jsonb; dominant jsonb:='[]'::jsonb; cq text;
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
 access:=coalesce(ae->>'level','Unknown'); divv:=coalesce(de->>'level','Unknown');
 overall:=investor_private.product_risk_overall_v1('ETF',loss,price,access,divv);
 conf:=case when ob='Unknown' or ae->>'confidence'='Insufficient' or de->>'confidence'='Insufficient' then 'Medium' else 'High' end;
 if investor_private.product_risk_rank(price)>=2 then dominant:=dominant||to_jsonb('Market price movement'::text); end if;
 if nullif(trim(coalesce(v.sector,'')),'') is not null then
  flags:=flags||jsonb_build_array(jsonb_build_object('code','sector_concentration','label',format('Focused on the %s sector',v.sector),'severity','attention'));
 end if;
 if lower(coalesce(v.interest_rate_sensitivity,''))='high' or coalesce(nullif(credit->>'average_duration_years','')::numeric,0)>=8 then
  flags:=flags||jsonb_build_array(jsonb_build_object('code','rate_sensitive','label','Sensitive to interest-rate changes','severity','attention'));
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
    'confidence',case when v.equity_pct is not null or v.fixed_income_pct is not null then 'High' else 'Medium' end,
    'source_basis',jsonb_build_object('equity_pct',v.equity_pct,'fixed_income_pct',v.fixed_income_pct,
      'average_credit_quality',credit->>'average_credit_quality','sector',v.sector)),
   jsonb_build_object('code','price_movement','level',price,'direction','higher_is_worse','confidence',price_conf,
    'source_basis',jsonb_build_object('official_risk',official)),
   jsonb_build_object('code','access_to_money','level',access,'direction','higher_is_better',
    'confidence',coalesce(ae->>'confidence','Insufficient'),'source_basis',ae),
   jsonb_build_object('code','diversification','level',divv,'direction','higher_is_better',
    'confidence',coalesce(de->>'confidence','Insufficient'),'source_basis',de)
  )
 );
end $$;

create or replace function investor_private.refresh_product_risk_draft(p_investment_id uuid)
returns uuid language plpgsql volatile security invoker set search_path='' as $$
declare e jsonb; pid uuid; dim jsonb; ad date;
begin
 e:=investor_private.product_risk_evaluate(p_investment_id);
 if e->>'status'<>'draft' then return null; end if;
 ad:=nullif(e->>'as_of_date','')::date;
 delete from public.product_risk_profiles
 where investment_id=p_investment_id and model_version='product-risk-dna-v1-research' and publication_status='draft';
 insert into public.product_risk_profiles(
  investment_id,model_version,module_code,module_version,calibration_status,publication_status,
  overall_band,confidence,consumer_summary,dominant_risks,key_flags,source_basis,as_of_date
 ) values (
  p_investment_id,'product-risk-dna-v1-research',e->>'module_code',e->>'module_version','calibration','draft',
  e#>>'{overall_risk,band}',e#>>'{overall_risk,confidence}',e->>'summary',
  coalesce(array(select jsonb_array_elements_text(coalesce(e->'dominant_risks','[]'::jsonb))),'{}'::text[]),
  coalesce(e->'key_flags','[]'::jsonb),
  coalesce(e->'source_basis',jsonb_build_object('engine','product-risk-dna-v1-research','module',e->>'module_version')),ad
 ) returning id into pid;
 for dim in select * from jsonb_array_elements(e->'dimensions') loop
  insert into public.product_risk_dimensions(
   profile_id,dimension_code,band,confidence,headline,explanation,why_it_matters,source_basis,sort_order,direction
  ) values (
   pid,dim->>'code',dim->>'level',dim->>'confidence',null,dim->>'explanation',dim->>'why_it_matters',
   coalesce(dim->'source_basis',jsonb_build_object('module',e->>'module_version')),
   case dim->>'code' when 'loss_potential' then 1 when 'price_movement' then 2
    when 'access_to_money' then 3 when 'diversification' then 4 end,dim->>'direction'
  );
 end loop;
 return pid;
end $$;

revoke all on function investor_private.product_risk_min_band(text,text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_etf_official_rating(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_etf_effective_holdings(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_etf_credit_quality(uuid) from public,anon,authenticated;
revoke all on function investor_private.product_risk_latest_observed_numeric(uuid,text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_etf_diversification(uuid,text,text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_etf_access(uuid,text) from public,anon,authenticated;
revoke all on function investor_private.product_risk_score_to_band(numeric) from public,anon,authenticated;
revoke all on function investor_private.product_risk_overall_v1(text,text,text,text,text) from public,anon,authenticated;
grant execute on function investor_private.product_risk_min_band(text,text) to service_role;
grant execute on function investor_private.product_risk_etf_official_rating(uuid) to service_role;
grant execute on function investor_private.product_risk_etf_effective_holdings(uuid) to service_role;
grant execute on function investor_private.product_risk_etf_credit_quality(uuid) to service_role;
grant execute on function investor_private.product_risk_latest_observed_numeric(uuid,text) to service_role;
grant execute on function investor_private.product_risk_etf_diversification(uuid,text,text) to service_role;
grant execute on function investor_private.product_risk_etf_access(uuid,text) to service_role;
grant execute on function investor_private.product_risk_score_to_band(numeric) to service_role;
grant execute on function investor_private.product_risk_overall_v1(text,text,text,text,text) to service_role;
