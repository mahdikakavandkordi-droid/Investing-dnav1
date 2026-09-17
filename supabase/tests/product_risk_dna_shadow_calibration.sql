-- Product Risk DNA shadow calibration regression.
-- Safe to run repeatedly: draft refreshes are rolled back.

begin;

do $$
declare n int; bad int; cash_access text; nr_access text; short_price text; long_price text;
begin
 select investor_private.refresh_all_product_risk_drafts() into n;
 if n<>55 then raise exception 'expected 55 draft evaluations, got %',n; end if;

 select count(*) into bad from public.product_risk_profiles
 where model_version='product-risk-dna-v1-research' and publication_status<>'draft';
 if bad<>0 then raise exception 'shadow calibration must not publish'; end if;

 select count(*) into bad
 from public.product_risk_profiles p
 where p.model_version='product-risk-dna-v1-research'
 and (select count(*) from public.product_risk_dimensions d where d.profile_id=p.id)<>4;
 if bad<>0 then raise exception 'each draft must have 4 dimensions'; end if;

 select d.band into cash_access
 from public.product_risk_dimensions d join public.product_risk_profiles p on p.id=d.profile_id
 join public.investments i on i.id=p.investment_id
 where i.symbol='RBC-GIC-1Y-CASH' and d.dimension_code='access_to_money';

 select d.band into nr_access
 from public.product_risk_dimensions d join public.product_risk_profiles p on p.id=d.profile_id
 join public.investments i on i.id=p.investment_id
 where i.symbol='RBC-GIC-1Y-NR' and d.dimension_code='access_to_money';

 if investor_private.product_risk_rank(cash_access)<=investor_private.product_risk_rank(nr_access) then
  raise exception 'cashable GIC access must exceed non-redeemable access';
 end if;

 select d.band into short_price
 from public.product_risk_dimensions d join public.product_risk_profiles p on p.id=d.profile_id
 join public.investments i on i.id=p.investment_id
 where i.symbol='GOC-BOND-2Y' and d.dimension_code='price_movement';

 select d.band into long_price
 from public.product_risk_dimensions d join public.product_risk_profiles p on p.id=d.profile_id
 join public.investments i on i.id=p.investment_id
 where i.symbol='GOC-BOND-LONG' and d.dimension_code='price_movement';

 if investor_private.product_risk_rank(short_price)>=investor_private.product_risk_rank(long_price) then
  raise exception 'long GoC bond must move more than 2Y';
 end if;

 select count(*) into bad
 from public.product_risk_profiles p join public.investments i on i.id=p.investment_id
 where i.asset_type in ('COMMERCIAL_PAPER','ABCP')
 and not (p.overall_band='Unknown' and p.confidence='Insufficient');
 if bad<>0 then raise exception 'reference CP/ABCP must stay Unknown/Insufficient'; end if;

 select count(*) into bad
 from public.product_risk_profiles p
 join public.v_instrument_research_catalog v on v.id=p.investment_id
 where v.asset_type='ETF' and v.risk_level is not null
 and p.overall_band<>investor_private.product_risk_normalize_band(v.risk_level);
 if bad<>0 then raise exception 'ETF overall must preserve official risk category'; end if;

 select count(*) into bad from public.product_risk_dimensions where direction is null;
 if bad<>0 then raise exception 'dimension direction must be explicit'; end if;
end $$;

select 'PASS: Product Risk DNA shadow calibration invariants' as result;
rollback;
