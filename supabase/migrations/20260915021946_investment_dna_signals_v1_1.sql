with base as (
  select
    i.id as investment_id,
    old.style_class, old.objective_class, old.investor_fit_class,
    old.liquidity_score, old.ideal_investor, old.best_use_cases, old.key_tradeoffs,
    old.explanation as old_explanation,
    p.objective, p.target_allocation, p.geographic_exposure,
    p.as_of_date as profile_date,
    r.official_risk_rating, r.source_date as risk_date,
    coalesce((p.target_allocation->>'equity')::numeric,0) as equity_pct,
    coalesce((p.target_allocation->>'fixed_income')::numeric,0) as fixed_income_pct,
    coalesce((select count(*) from jsonb_each_text(coalesce(p.geographic_exposure,'{}'::jsonb)) g
      where lower(g.key) not like '%fixed%' and nullif(g.value,'')::numeric >= 5),0) as geo_regions
  from public.investments i
  join lateral (
    select * from public.investment_intelligence_profiles x
    where x.investment_id=i.id
    order by x.updated_at desc nulls last, x.created_at desc nulls last
    limit 1
  ) old on true
  join lateral (
    select * from public.investment_profiles x
    where x.investment_id=i.id
    order by x.updated_at desc nulls last, x.created_at desc nulls last
    limit 1
  ) p on true
  left join public.investment_official_risk_ratings r on r.investment_id=i.id
  where i.is_active=true
), scored as (
  select b.*,
    case lower(coalesce(official_risk_rating,''))
      when 'low' then 90
      when 'low to medium' then 70
      when 'low-medium' then 70
      when 'medium' then 50
      when 'medium to high' then 30
      when 'medium-high' then 30
      when 'high' then 15
      else 50
    end::numeric as risk_stability,
    case when lower(coalesce(objective,'')) like '%income%' then 100 else 0 end::numeric as income_objective,
    case when geo_regions >= 3 then 90 when geo_regions = 2 then 65 when geo_regions = 1 then 35 else 25 end::numeric as geography_score,
    case when equity_pct >= 10 and fixed_income_pct >= 10 then 100 else 40 end::numeric as multi_asset_score
  from base b
)
insert into public.investment_intelligence_profiles (
  investment_id, model_version, style_class, objective_class, investor_fit_class,
  growth_score, income_score, stability_score, diversification_score, liquidity_score, complexity_score,
  ideal_investor, best_use_cases, key_tradeoffs, explanation, source_basis, as_of_date, updated_at
)
select
  investment_id, 'intelligence-v1.1', style_class, objective_class, investor_fit_class,
  round(greatest(0,least(100,equity_pct)),2),
  round(greatest(0,least(100,0.8*fixed_income_pct + 0.2*income_objective)),2),
  round(greatest(0,least(100,0.6*fixed_income_pct + 0.4*risk_stability)),2),
  round(greatest(0,least(100,0.7*geography_score + 0.3*multi_asset_score)),2),
  liquidity_score,
  0,
  ideal_investor, best_use_cases, key_tradeoffs,
  coalesce(old_explanation,'{}'::jsonb) || jsonb_build_object(
    'signal_methodology', jsonb_build_object(
      'version','investment-dna-signals-v1.1',
      'growth','Strategic equity allocation.',
      'income','80% fixed-income allocation plus 20% if the fund objective explicitly includes income.',
      'stability','60% fixed-income allocation plus 40% inverse official issuer risk classification.',
      'exposure_breadth','70% meaningful geographic breadth plus 30% multi-asset breadth. Holdings count is not used.'
    ),
    'signal_inputs', jsonb_build_object(
      'equity_pct',equity_pct,'fixed_income_pct',fixed_income_pct,'official_risk',official_risk_rating,
      'meaningful_geographic_regions',geo_regions,'objective',objective
    )
  ),
  jsonb_build_object(
    'methodology_version','investment-dna-signals-v1.1',
    'source_policy','Uses profile allocation/geography/objective and issuer-disclosed official risk. Does not use incomplete holdings counts.',
    'profile_date',profile_date,'risk_date',risk_date
  ),
  greatest(coalesce(profile_date,'1900-01-01'::date),coalesce(risk_date,'1900-01-01'::date)),
  now()
from scored
on conflict (investment_id,model_version) do update set
  style_class=excluded.style_class, objective_class=excluded.objective_class, investor_fit_class=excluded.investor_fit_class,
  growth_score=excluded.growth_score, income_score=excluded.income_score, stability_score=excluded.stability_score,
  diversification_score=excluded.diversification_score, liquidity_score=excluded.liquidity_score, complexity_score=excluded.complexity_score,
  ideal_investor=excluded.ideal_investor, best_use_cases=excluded.best_use_cases, key_tradeoffs=excluded.key_tradeoffs,
  explanation=excluded.explanation, source_basis=excluded.source_basis, as_of_date=excluded.as_of_date, updated_at=now();

create or replace view public.v_investment_dna_v2 as
select
  i.id as investment_id,
  i.symbol,
  i.name,
  i.asset_type,
  i.category,
  i.subcategory,
  s.model_version as suitability_model_version,
  ip.model_version as intelligence_model_version,
  coalesce(orisk.official_risk_rating,s.risk_band) as risk_band,
  s.normalized_risk_score as risk_score,
  ip.growth_score,
  ip.income_score,
  ip.stability_score,
  ip.diversification_score,
  s.liquidity_score,
  ip.complexity_score,
  s.minimum_horizon_months,
  s.concentration_level,
  s.geographic_scope,
  s.currency_exposure,
  sc.equity_pct,
  sc.fixed_income_pct,
  sc.mer_pct,
  sc.data_quality_status,
  sc.data_quality_score,
  ip.style_class,
  ip.objective_class,
  ip.ideal_investor,
  ip.best_use_cases,
  ip.key_tradeoffs,
  ip.explanation,
  ip.source_basis as intelligence_source_basis,
  greatest(coalesce(s.as_of_date,'1900-01-01'::date),coalesce(ip.as_of_date,'1900-01-01'::date),coalesce(orisk.source_date,'1900-01-01'::date)) as as_of_date,
  orisk.official_risk_rating,
  orisk.band_min as official_risk_band_min,
  orisk.band_max as official_risk_band_max,
  orisk.issuer as official_risk_issuer,
  orisk.source_type as official_risk_source_type,
  orisk.source_title as official_risk_source_title,
  orisk.source_url as official_risk_source_url,
  orisk.source_date as official_risk_source_date,
  orisk.effective_date as official_risk_effective_date,
  orisk.methodology as official_risk_methodology,
  orisk.verification_note as official_risk_verification_note,
  orisk.verified_at as official_risk_verified_at
from public.investments i
left join lateral (
  select * from public.investment_suitability_profiles_v2 x
  where x.investment_id=i.id
  order by x.updated_at desc nulls last, x.created_at desc nulls last
  limit 1
) s on true
left join public.investment_intelligence_profiles ip
  on ip.investment_id=i.id and ip.model_version='intelligence-v1.1'
left join public.v_investment_screener sc on sc.id=i.id
left join public.investment_official_risk_ratings orisk on orisk.investment_id=i.id
where i.is_active=true;

create or replace function public.app_get_investment_dna(p_investment_id uuid)
returns jsonb
language sql
stable security definer
set search_path to ''
as $function$
  select to_jsonb(v)
  from public.v_investment_dna_v2 v
  where v.investment_id=p_investment_id
  limit 1;
$function$;