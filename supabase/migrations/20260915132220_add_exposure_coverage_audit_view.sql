create or replace view public.v_investment_exposure_coverage as
select
  i.id as investment_id,
  i.symbol,
  coalesce(bool_or(e.dimension='country' and e.is_complete_set),false) as country_complete,
  coalesce(bool_or(e.dimension='region' and e.is_complete_set),false) as region_complete,
  coalesce(bool_or(e.dimension='sector' and e.is_complete_set),false) as sector_complete,
  coalesce(bool_or(e.dimension='asset_class' and e.is_complete_set),false) as asset_class_complete,
  coalesce(bool_or(e.dimension='credit_quality' and e.is_complete_set),false) as credit_quality_complete,
  coalesce(bool_or(e.dimension='maturity' and e.is_complete_set),false) as maturity_complete,
  count(distinct e.dimension) filter(where e.is_complete_set) as complete_dimension_count,
  array_agg(distinct e.dimension order by e.dimension) filter(where e.is_complete_set) as complete_dimensions
from public.investments i
left join public.investment_exposure_breakdown e on e.investment_id=i.id
group by i.id,i.symbol;
grant select on public.v_investment_exposure_coverage to anon,authenticated;