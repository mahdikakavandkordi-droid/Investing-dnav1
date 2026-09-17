
alter table public.product_risk_dimensions
 add column if not exists direction text
 check (direction is null or direction in ('higher_is_worse','higher_is_better','neutral'));

create or replace function investor_private.refresh_product_risk_draft(p_investment_id uuid)
returns uuid language plpgsql volatile security invoker set search_path='' as $$
declare
 e jsonb; profile_id uuid; dim jsonb; as_of_date date;
begin
 e:=investor_private.product_risk_evaluate(p_investment_id);
 if e->>'status'<>'draft' then return null; end if;
 as_of_date:=nullif(e->>'as_of_date','')::date;

 delete from public.product_risk_profiles
 where investment_id=p_investment_id
   and model_version='product-risk-dna-v1-research'
   and publication_status='draft';

 insert into public.product_risk_profiles(
  investment_id,model_version,module_code,module_version,calibration_status,publication_status,
  overall_band,confidence,consumer_summary,dominant_risks,key_flags,source_basis,as_of_date
 ) values (
  p_investment_id,'product-risk-dna-v1-research',e->>'module_code',e->>'module_version',
  'calibration','draft',e#>>'{overall_risk,band}',e#>>'{overall_risk,confidence}',e->>'summary',
  coalesce(array(select jsonb_array_elements_text(coalesce(e->'dominant_risks','[]'::jsonb))),'{}'::text[]),
  coalesce(e->'key_flags','[]'::jsonb),
  jsonb_build_object('engine','product-risk-dna-v1-research','module',e->>'module_version'),
  as_of_date
 ) returning id into profile_id;

 for dim in select * from jsonb_array_elements(e->'dimensions')
 loop
  insert into public.product_risk_dimensions(
   profile_id,dimension_code,band,confidence,headline,explanation,why_it_matters,source_basis,sort_order,direction
  ) values (
   profile_id,dim->>'code',dim->>'level',dim->>'confidence',null,null,null,
   jsonb_build_object('module',e->>'module_version'),
   case dim->>'code'
    when 'loss_potential' then 1
    when 'price_movement' then 2
    when 'access_to_money' then 3
    when 'diversification' then 4
   end,
   dim->>'direction'
  );
 end loop;
 return profile_id;
end $$;

create or replace function investor_private.refresh_all_product_risk_drafts()
returns integer language plpgsql volatile security invoker set search_path='' as $$
declare r record; n integer:=0;
begin
 for r in select id from public.investments
          where is_active and asset_type in ('ETF','GIC','T_BILL','BOND','COMMERCIAL_PAPER','ABCP')
 loop
  perform investor_private.refresh_product_risk_draft(r.id);
  n:=n+1;
 end loop;
 return n;
end $$;

create or replace function public.app_get_product_risk(
 p_investment_id uuid,
 p_include_details boolean default false
) returns jsonb
language sql stable security invoker set search_path='' as $$
 with p as (
  select pr.* from public.product_risk_profiles pr
  where pr.investment_id=p_investment_id and pr.publication_status='published'
  order by pr.as_of_date desc nulls last,pr.created_at desc limit 1
 )
 select case when not exists(select 1 from p)
  then jsonb_build_object('status','not_available','reason','No calibrated Product Risk DNA profile has been published for this investment.')
  else (
   select jsonb_build_object(
    'status','available',
    'model_version',p.model_version,
    'module_code',p.module_code,
    'module_version',p.module_version,
    'overall_risk',jsonb_build_object('band',p.overall_band,'confidence',p.confidence),
    'summary',p.consumer_summary,
    'dominant_risks',to_jsonb(p.dominant_risks),
    'key_flags',p.key_flags,
    'as_of_date',p.as_of_date,
    'dimensions',coalesce((
     select jsonb_agg(jsonb_build_object(
      'code',d.dimension_code,'level',d.band,'direction',d.direction,'confidence',d.confidence,
      'headline',d.headline,'explanation',d.explanation,'why_it_matters',d.why_it_matters
     ) order by d.sort_order)
     from public.product_risk_dimensions d where d.profile_id=p.id
    ),'[]'::jsonb),
    'details',case when p_include_details then coalesce((
     select jsonb_agg(jsonb_build_object(
      'code',f.family_code,'band',f.band,'confidence',f.confidence,'explanation',f.explanation
     ) order by f.family_code)
     from public.product_risk_family_scores f where f.profile_id=p.id
    ),'[]'::jsonb) else null end
   ) from p
  ) end
$$;

revoke all on function investor_private.refresh_product_risk_draft(uuid) from public,anon,authenticated;
revoke all on function investor_private.refresh_all_product_risk_drafts() from public,anon,authenticated;
grant execute on function investor_private.refresh_product_risk_draft(uuid) to service_role;
grant execute on function investor_private.refresh_all_product_risk_drafts() to service_role;

revoke all on function public.app_get_product_risk(uuid,boolean) from public;
grant execute on function public.app_get_product_risk(uuid,boolean) to anon,authenticated,service_role;
