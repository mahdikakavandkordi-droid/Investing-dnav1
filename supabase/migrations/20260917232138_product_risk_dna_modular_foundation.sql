-- Product Risk DNA modular foundation.
-- Creates versioned/publication-safe contracts only.
-- Intentionally publishes no product scores before calibration.

create table public.product_risk_module_registry (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null,
  module_code text not null,
  module_version text not null,
  model_version text not null default 'product-risk-dna-v1-research',
  readiness text not null check (readiness in ('research','calibration','published','retired')),
  sensor_contract jsonb not null default '{}'::jsonb,
  methodology_anchor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(asset_type,module_code,module_version)
);

alter table public.product_risk_module_registry enable row level security;
revoke all on public.product_risk_module_registry from public,anon,authenticated;
grant select on public.product_risk_module_registry to anon,authenticated;
grant select,insert,update,delete on public.product_risk_module_registry to service_role;
create policy product_risk_module_registry_public_read
on public.product_risk_module_registry for select to anon,authenticated using (true);

create table public.product_risk_profiles (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  model_version text not null,
  module_code text not null,
  module_version text not null,
  calibration_status text not null default 'pre_validation'
    check (calibration_status in ('pre_validation','calibration','reviewed')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','retired')),
  overall_band text
    check (overall_band is null or overall_band in ('Low','Low to Medium','Medium','Medium to High','High','Unknown','N/A')),
  confidence text not null default 'Insufficient'
    check (confidence in ('High','Medium','Low','Insufficient')),
  consumer_summary text,
  dominant_risks text[] not null default '{}'::text[],
  key_flags jsonb not null default '[]'::jsonb,
  source_basis jsonb not null default '{}'::jsonb,
  as_of_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(investment_id,model_version,module_version,as_of_date)
);

create index product_risk_profiles_lookup_idx
on public.product_risk_profiles(investment_id,publication_status,as_of_date desc,created_at desc);

alter table public.product_risk_profiles enable row level security;
revoke all on public.product_risk_profiles from public,anon,authenticated;
grant select on public.product_risk_profiles to anon,authenticated;
grant select,insert,update,delete on public.product_risk_profiles to service_role;
create policy product_risk_profiles_public_read
on public.product_risk_profiles for select to anon,authenticated
using (publication_status='published');

create table public.product_risk_dimensions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.product_risk_profiles(id) on delete cascade,
  dimension_code text not null
    check (dimension_code in ('loss_potential','price_movement','access_to_money','diversification')),
  band text not null
    check (band in ('Low','Low to Medium','Medium','Medium to High','High','Unknown','N/A')),
  confidence text not null
    check (confidence in ('High','Medium','Low','Insufficient')),
  headline text,
  explanation text,
  why_it_matters text,
  source_basis jsonb not null default '{}'::jsonb,
  sort_order smallint not null check (sort_order between 1 and 4),
  created_at timestamptz not null default now(),
  unique(profile_id,dimension_code),
  unique(profile_id,sort_order)
);

create index product_risk_dimensions_profile_idx on public.product_risk_dimensions(profile_id);

alter table public.product_risk_dimensions enable row level security;
revoke all on public.product_risk_dimensions from public,anon,authenticated;
grant select on public.product_risk_dimensions to anon,authenticated;
grant select,insert,update,delete on public.product_risk_dimensions to service_role;
create policy product_risk_dimensions_public_read
on public.product_risk_dimensions for select to anon,authenticated
using (exists (
  select 1 from public.product_risk_profiles p
  where p.id=profile_id and p.publication_status='published'
));

create table public.product_risk_family_scores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.product_risk_profiles(id) on delete cascade,
  family_code text not null check (family_code in ('MKT','CRD','LIQ','CON','LEV','CMP','OPS')),
  band text not null
    check (band in ('Low','Low to Medium','Medium','Medium to High','High','Unknown','N/A')),
  confidence text not null
    check (confidence in ('High','Medium','Low','Insufficient')),
  explanation text,
  inputs_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id,family_code)
);

create index product_risk_family_scores_profile_idx on public.product_risk_family_scores(profile_id);

alter table public.product_risk_family_scores enable row level security;
revoke all on public.product_risk_family_scores from public,anon,authenticated;
grant select on public.product_risk_family_scores to anon,authenticated;
grant select,insert,update,delete on public.product_risk_family_scores to service_role;
create policy product_risk_family_scores_public_read
on public.product_risk_family_scores for select to anon,authenticated
using (exists (
  select 1 from public.product_risk_profiles p
  where p.id=profile_id and p.publication_status='published'
));

create table public.product_risk_sensor_evidence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.product_risk_profiles(id) on delete cascade,
  sensor_code text not null,
  sensor_kind text not null check (sensor_kind in ('common','asset_specific','modifier')),
  raw_value jsonb,
  normalized_value numeric,
  inferred_band text
    check (inferred_band is null or inferred_band in ('Low','Low to Medium','Medium','Medium to High','High','Unknown','N/A')),
  confidence text not null
    check (confidence in ('High','Medium','Low','Insufficient')),
  source_name text,
  source_url text,
  source_date date,
  explanation text,
  created_at timestamptz not null default now()
);

create index product_risk_sensor_evidence_profile_idx
on public.product_risk_sensor_evidence(profile_id,sensor_code);

alter table public.product_risk_sensor_evidence enable row level security;
revoke all on public.product_risk_sensor_evidence from public,anon,authenticated;
grant select,insert,update,delete on public.product_risk_sensor_evidence to service_role;

insert into public.product_risk_module_registry(
 asset_type,module_code,module_version,model_version,readiness,sensor_contract,methodology_anchor
) values
('ETF','etf-risk','etf-risk-v1-research','product-risk-dna-v1-research','research',
 '{"families":["MKT","CRD","LIQ","CON","LEV","CMP","OPS"],"consumer_dimensions":["loss_potential","price_movement","access_to_money","diversification"]}'::jsonb,'etf-fund'),
('GIC','gic-risk','gic-risk-v1-research','product-risk-dna-v1-research','research',
 '{"families":["CRD","LIQ","CON","CMP","OPS"],"consumer_dimensions":["loss_potential","price_movement","access_to_money","diversification"]}'::jsonb,'gic'),
('T_BILL','t-bill-risk','t-bill-risk-v1-research','product-risk-dna-v1-research','research',
 '{"families":["MKT","CRD","LIQ","CON","CMP","OPS"],"consumer_dimensions":["loss_potential","price_movement","access_to_money","diversification"]}'::jsonb,'t-bill'),
('BOND','bond-risk','bond-risk-v1-research','product-risk-dna-v1-research','research',
 '{"families":["MKT","CRD","LIQ","CON","LEV","CMP","OPS"],"consumer_dimensions":["loss_potential","price_movement","access_to_money","diversification"]}'::jsonb,'bond'),
('COMMERCIAL_PAPER','commercial-paper-risk','commercial-paper-risk-v1-research','product-risk-dna-v1-research','research',
 '{"families":["MKT","CRD","LIQ","CON","CMP","OPS"],"consumer_dimensions":["loss_potential","price_movement","access_to_money","diversification"]}'::jsonb,'commercial-paper'),
('ABCP','abcp-risk','abcp-risk-v1-research','product-risk-dna-v1-research','research',
 '{"families":["MKT","CRD","LIQ","CON","LEV","CMP","OPS"],"consumer_dimensions":["loss_potential","price_movement","access_to_money","diversification"]}'::jsonb,'abcp');

create or replace function public.app_get_product_risk(
  p_investment_id uuid,
  p_include_details boolean default false
) returns jsonb
language sql stable security invoker set search_path='' as $$
  with p as (
    select pr.*
    from public.product_risk_profiles pr
    where pr.investment_id=p_investment_id
      and pr.publication_status='published'
    order by pr.as_of_date desc nulls last,pr.created_at desc
    limit 1
  )
  select case
    when not exists(select 1 from p)
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
            'code',d.dimension_code,
            'band',d.band,
            'confidence',d.confidence,
            'headline',d.headline,
            'explanation',d.explanation,
            'why_it_matters',d.why_it_matters
          ) order by d.sort_order)
          from public.product_risk_dimensions d
          where d.profile_id=p.id
        ),'[]'::jsonb),
        'details',case when p_include_details then coalesce((
          select jsonb_agg(jsonb_build_object(
            'code',f.family_code,
            'band',f.band,
            'confidence',f.confidence,
            'explanation',f.explanation
          ) order by f.family_code)
          from public.product_risk_family_scores f
          where f.profile_id=p.id
        ),'[]'::jsonb) else null end
      ) from p
    )
  end;
$$;

revoke all on function public.app_get_product_risk(uuid,boolean) from public;
grant execute on function public.app_get_product_risk(uuid,boolean) to anon,authenticated,service_role;
