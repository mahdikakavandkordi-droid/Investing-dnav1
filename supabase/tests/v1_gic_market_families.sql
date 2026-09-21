-- Focused V1 GIC family regression. Safe to run repeatedly.
do $$
declare
  v_count int;
  v_ids uuid[];
begin
  select count(*) into v_count
  from public.investments
  where is_active and asset_type='GIC';
  if v_count<>14 then
    raise exception 'expected 14 active GIC families, got %',v_count;
  end if;

  select count(distinct issuer_id) into v_count
  from public.investments
  where is_active and asset_type='GIC';
  if v_count<>7 then
    raise exception 'expected 7 active GIC issuers, got %',v_count;
  end if;

  select count(*) into v_count
  from public.investment_deposit_term_options o
  join public.investments i on i.id=o.investment_id
  where i.is_active and i.asset_type='GIC';
  if v_count<>44 then
    raise exception 'expected 44 active GIC term options, got %',v_count;
  end if;

  select count(*) into v_count
  from public.investments i
  where i.is_active and i.asset_type='GIC'
    and not exists(
      select 1 from public.investment_deposit_term_options o where o.investment_id=i.id
    );
  if v_count<>0 then
    raise exception 'every active GIC family must have a term curve, missing %',v_count;
  end if;

  select count(*) into v_count
  from public.investments
  where is_active and asset_type='GIC'
    and symbol in ('RBC-GIC-1Y-CASH','RBC-GIC-1Y-NR','RBC-GIC-3Y-RED','RBC-GIC-5Y-NR');
  if v_count<>0 then
    raise exception 'legacy one-card-per-term RBC GIC rows must stay retired';
  end if;

  select array_agg(id order by symbol) into v_ids
  from (
    select id,symbol
    from public.investments
    where is_active and asset_type='GIC'
    order by symbol
    limit 2
  ) x;

  select count(*) into v_count from public.app_compare_instruments(v_ids);
  if v_count<>2 then
    raise exception 'same-type GIC compare should return both selected families, got %',v_count;
  end if;

  select array[
    (select id from public.investments where is_active and asset_type='GIC' order by symbol limit 1),
    (select id from public.investments where is_active and asset_type='ETF' order by symbol limit 1)
  ] into v_ids;

  select count(*) into v_count from public.app_compare_instruments(v_ids);
  if v_count<>0 then
    raise exception 'mixed GIC/ETF compare must be rejected, got %',v_count;
  end if;

  select count(*) into v_count
  from public.app_search_instruments('GIC',null,100);
  if v_count<>14 then
    raise exception 'public research API should expose 14 GIC families, got %',v_count;
  end if;
end $$;

select 'PASS: 14 GIC families, 7 issuers, 44 term options, same-type compare and public boundary' as result;
