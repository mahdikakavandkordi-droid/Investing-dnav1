-- Product Risk DNA source-of-truth + cross-asset shadow regression.
-- Draft refreshes are rolled back so this is safe to run repeatedly.
begin;

do $$
declare p jsonb; bad int; cash_access text; locked_access text; short_overall text; long_overall text;
begin
 perform investor_private.refresh_all_product_risk_drafts();

 select count(*) into bad
 from public.product_risk_profiles
 where model_version='product-risk-dna-v1-research' and publication_status='published';
 if bad<>0 then raise exception 'shadow calibration must not publish'; end if;

 select count(*) into bad
 from public.product_risk_profiles p
 where p.model_version='product-risk-dna-v1-research'
   and (select count(*) from public.product_risk_dimensions d where d.profile_id=p.id)<>4;
 if bad<>0 then raise exception 'every draft must have exactly four consumer dimensions'; end if;

 -- ETF Price Movement must follow verified official issuer/CSA disclosure, not generic risk_level.
 select count(*) into bad
 from public.investments i
 join public.investment_official_risk_ratings o on o.investment_id=i.id
 where i.asset_type='ETF' and i.is_active
   and (
     select d.band
     from public.product_risk_profiles p
     join public.product_risk_dimensions d on d.profile_id=p.id
     where p.investment_id=i.id and p.model_version='product-risk-dna-v1-research'
       and p.publication_status='draft' and d.dimension_code='price_movement'
     limit 1
   )<>investor_private.product_risk_normalize_band(o.official_risk_rating);
 if bad<>0 then raise exception '% ETF price bands disagree with official source',bad; end if;

 select investor_private.product_risk_eval_etf(id) into p from public.investments where symbol='VFV' limit 1;
 if p#>>'{dimensions,1,level}'<>'Medium' or p#>>'{overall_risk,band}'<>'Medium' then
  raise exception 'VFV official-source regression: %',p; end if;

 select investor_private.product_risk_eval_etf(id) into p from public.investments where symbol='VCNS' limit 1;
 if p#>>'{dimensions,1,level}'<>'Low to Medium' then
  raise exception 'VCNS current official change regression: %',p; end if;

 select investor_private.product_risk_eval_etf(id) into p from public.investments where symbol='ZEB' limit 1;
 if p#>>'{dimensions,3,level}'<>'Low' or p#>>'{overall_risk,band}'<>'Medium to High' then
  raise exception 'ZEB concentration regression: %',p; end if;

 select investor_private.product_risk_eval_etf(id) into p from public.investments where symbol='XIT' limit 1;
 if p#>>'{dimensions,3,level}'<>'Low to Medium' or p#>>'{overall_risk,band}'<>'High' then
  raise exception 'XIT concentration regression: %',p; end if;

 select investor_private.product_risk_eval_etf(id) into p from public.investments where symbol='XEQT' limit 1;
 if p#>>'{dimensions,3,level}'<>'High' then
  raise exception 'XEQT underlying-breadth regression: %',p; end if;

 select investor_private.product_risk_eval_etf(id) into p from public.investments where symbol='ZFL' limit 1;
 if p#>>'{dimensions,0,level}'<>'Low' or p#>>'{dimensions,1,level}'<>'Medium'
    or p#>>'{dimensions,3,level}'<>'Medium' then
  raise exception 'ZFL credit/price/breadth regression: %',p; end if;

 select investor_private.product_risk_eval_bond(id) into p from public.investments where symbol='GOC-BOND-2Y' limit 1;
 if p#>>'{overall_risk,confidence}'<>'Medium' then
  raise exception 'direct bond confidence must stay Medium without direct duration/liquidity evidence: %',p; end if;

 select investor_private.product_risk_eval_bond(id) into p from public.investments where symbol='BELL-M69-2036' limit 1;
 if p#>>'{overall_risk,confidence}'<>'Medium'
    or not (p->'key_flags' @> '[{"code":"credit_rating_unavailable"}]'::jsonb) then
  raise exception 'corporate bond must disclose missing verified issue rating evidence: %',p; end if;

 select d.band into cash_access
 from public.product_risk_profiles p join public.investments i on i.id=p.investment_id
 join public.product_risk_dimensions d on d.profile_id=p.id
 where i.symbol='RBC-GIC-1Y-CASH' and d.dimension_code='access_to_money'
   and p.model_version='product-risk-dna-v1-research' and p.publication_status='draft';
 select d.band into locked_access
 from public.product_risk_profiles p join public.investments i on i.id=p.investment_id
 join public.product_risk_dimensions d on d.profile_id=p.id
 where i.symbol='RBC-GIC-1Y-NR' and d.dimension_code='access_to_money'
   and p.model_version='product-risk-dna-v1-research' and p.publication_status='draft';
 if investor_private.product_risk_rank(cash_access)<=investor_private.product_risk_rank(locked_access) then
  raise exception 'cashable GIC access must exceed non-redeemable access'; end if;

 select p.overall_band into short_overall
 from public.product_risk_profiles p join public.investments i on i.id=p.investment_id
 where i.symbol='GOC-BOND-2Y' and p.model_version='product-risk-dna-v1-research' and p.publication_status='draft';
 select p.overall_band into long_overall
 from public.product_risk_profiles p join public.investments i on i.id=p.investment_id
 where i.symbol='GOC-BOND-LONG' and p.model_version='product-risk-dna-v1-research' and p.publication_status='draft';
 if investor_private.product_risk_rank(short_overall)>=investor_private.product_risk_rank(long_overall) then
  raise exception 'long GoC bond overall must exceed 2Y GoC overall'; end if;

 select investor_private.product_risk_eval_t_bill(id) into p
 from public.investments where symbol='GOC-TBILL-3M' limit 1;
 if p#>>'{overall_risk,band}'<>'Low'
    or p#>>'{overall_risk,confidence}'<>'Medium'
    or p#>>'{dimensions,1,confidence}'<>'High'
    or p#>>'{dimensions,2,confidence}'<>'Medium' then
  raise exception 'T-Bill term/liquidity confidence regression: %',p; end if;

 select count(*) into bad
 from investor_private.v_product_risk_review_queue
 where review_state='evidence_ready_for_review'
   and not (
     confidence='High'
     and dimension_count=4
     and high_conf_dimension_count=4
     and weak_conf_dimension_count=0
     and unknown_dimension_count=0
     and as_of_date>=current_date-90
   );
 if bad<>0 then raise exception '% review-ready rows violate evidence gate',bad; end if;

 select count(*) into bad
 from investor_private.v_product_risk_review_queue
 where asset_type in ('BOND','T_BILL')
   and review_state='evidence_ready_for_review';
 if bad<>0 then raise exception 'Bond/T-Bill rows must remain needs_evidence until direct evidence gaps close'; end if;

 select count(*) into bad
 from public.product_risk_profiles p join public.investments i on i.id=p.investment_id
 where p.model_version='product-risk-dna-v1-research' and p.publication_status='draft'
   and i.asset_type in ('COMMERCIAL_PAPER','ABCP')
   and not (p.overall_band='Unknown' and p.confidence='Insufficient');
 if bad<>0 then raise exception 'CP/ABCP references must stay Unknown/Insufficient'; end if;

 select public.app_get_product_risk(id,false) into p from public.investments where symbol='VFV' limit 1;
 if p->>'status'<>'not_available' then raise exception 'public Product Risk RPC must stay fail-closed: %',p; end if;
end $$;

select 'PASS: Product Risk DNA source-of-truth and cross-asset shadow calibration' as result;
rollback;
