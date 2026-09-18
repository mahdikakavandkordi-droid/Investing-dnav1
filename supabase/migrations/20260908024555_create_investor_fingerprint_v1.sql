create table if not exists public.behavioral_traits (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  trait_key text not null,
  display_name text not null,
  description text,
  polarity text not null default 'intensity' check (polarity in ('intensity','positive','negative')),
  min_score numeric not null default 0,
  max_score numeric not null default 100,
  created_at timestamptz not null default now(),
  unique(version, trait_key)
);

create table if not exists public.fingerprint_profiles (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  model_version text not null,
  fingerprint_code text,
  decision_style text,
  pressure_style text,
  strengths jsonb not null default '[]'::jsonb,
  watchouts jsonb not null default '[]'::jsonb,
  trait_scores jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(assessment_id, model_version)
);

create index if not exists idx_fingerprint_profiles_assessment on public.fingerprint_profiles(assessment_id);

alter table public.behavioral_traits enable row level security;
alter table public.fingerprint_profiles enable row level security;

revoke all on public.behavioral_traits from anon, authenticated;
revoke all on public.fingerprint_profiles from anon, authenticated;

insert into public.behavioral_traits (version, trait_key, display_name, description, polarity)
values
('v1.1','risk_perception','Risk Perception','How the investor interprets uncertainty, loss and opportunity.','intensity'),
('v1.1','self_confidence','Financial Self-Confidence','Confidence in personal investment decision-making.','positive'),
('v1.1','overconfidence','Overconfidence','Tendency to overestimate the accuracy or superiority of personal decisions.','negative'),
('v1.1','calibration','Decision Calibration','Alignment between subjective confidence and expected accuracy.','positive'),
('v1.1','social_influence','Social Influence','Degree to which other people''s investment outcomes influence decisions.','negative'),
('v1.1','recency_bias','Recency Bias','Tendency to give disproportionate weight to recent performance or events.','negative'),
('v1.1','anchoring','Anchoring','Tendency to remain psychologically attached to an initial reference point.','negative'),
('v1.1','confirmation_bias','Confirmation Bias','Tendency to favor information that supports an existing investment view.','negative'),
('v1.1','regret_sensitivity','Regret Sensitivity','Degree to which anticipated regret influences subsequent investment decisions.','negative'),
('v1.1','disposition_effect','Disposition Effect','Tendency to realize gains more readily than losses or exit winners prematurely.','negative'),
('v1.1','adaptability','Adaptability','Ability to update an investment view when credible new evidence appears.','positive'),
('v1.1','financial_self_efficacy','Financial Self-Efficacy','Perceived capability to understand and work with financial information.','positive'),
('v1.1','emotional_reactivity','Emotional Reactivity','Degree to which market movements disrupt planned investment behavior.','negative'),
('v1.1','opportunity_sensitivity','Opportunity Sensitivity','Degree to which perceived opportunities during market stress attract attention.','intensity')
on conflict (version, trait_key) do update set
 display_name=excluded.display_name,
 description=excluded.description,
 polarity=excluded.polarity;

create or replace function public.calculate_investing_fingerprint(p_assessment_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_model text := 'v1.1';
  v_traits jsonb := '{}'::jsonb;
  v_code text;
  v_decision_style text;
  v_pressure_style text;
  v_strengths jsonb := '[]'::jsonb;
  v_watchouts jsonb := '[]'::jsonb;
  v_result_id bigint;
  v_fp_id uuid;
  v_tolerance numeric;
  v_capacity numeric;
  v_archetype text;
begin
  select r.id, r.risk_tolerance, r.risk_capacity, r.archetype
    into v_result_id, v_tolerance, v_capacity, v_archetype
  from public.results r
  where r.assessment_id=p_assessment_id and r.model_version=v_model
  order by r.created_at desc limit 1;

  if v_result_id is null then
    raise exception 'No % result found for assessment %', v_model, p_assessment_id;
  end if;

  with scored as (
    select q.construct,
      case
        when q.question_type='scale' then
          case when q.scoring->'scale'->>'direction'='reverse'
            then 100-((a.answer_value->>'value')::numeric*10)
            else ((a.answer_value->>'value')::numeric*10) end
        else (q.scoring->>(a.answer_value->>'value'))::numeric
      end as score
    from public.answers a
    join public.question_bank q on q.question_id=a.question_id and q.version=v_model and q.active=true
    where a.assessment_id=p_assessment_id and q.section='behavioral_dna'
  ),
  agg as (
    select construct, round(avg(score),2) score from scored where score between 0 and 100 group by construct
  )
  select coalesce(jsonb_object_agg(construct,to_jsonb(score)),'{}'::jsonb) into v_traits from agg;

  v_code := case v_archetype
    when 'VAULT' then 'VLT' when 'ANCHOR' then 'ANC' when 'COOLHAND' then 'CLH'
    when 'SCOUT' then 'SCT' when 'MAVERICK' then 'MVR' when 'STRIKER' then 'STK'
    when 'HOTSHOT' then 'HST' when 'HIGHROLLER' then 'HRO' when 'JACKPOT' then 'JKT'
    else 'UNK' end;

  v_decision_style := case
    when coalesce((v_traits->>'overconfidence')::numeric,50) >= 70 and coalesce((v_traits->>'self_confidence')::numeric,50) >= 70 then 'Conviction-Driven'
    when coalesce((v_traits->>'adaptability')::numeric,50) >= 75 then 'Adaptive'
    when coalesce((v_traits->>'social_influence')::numeric,50) >= 70 then 'Socially Influenced'
    when coalesce((v_traits->>'recency_bias')::numeric,50) >= 70 then 'Recency-Sensitive'
    when coalesce((v_traits->>'risk_perception')::numeric,50) >= 75 then 'Risk-Aware'
    else 'Balanced' end;

  v_pressure_style := case
    when coalesce((v_traits->>'emotional_reactivity')::numeric,50) >= 70 then 'Emotionally Reactive'
    when coalesce((v_traits->>'emotional_reactivity')::numeric,50) <= 30 then 'Composed'
    when coalesce((v_traits->>'adaptability')::numeric,50) >= 75 then 'Adaptive Under Pressure'
    else 'Measured' end;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_strengths from (
    select trait_key as x from jsonb_each(v_traits) e(trait_key,val)
    where trait_key in ('adaptability','self_confidence','financial_self_efficacy')
      and (val::text)::numeric >= 70 order by (val::text)::numeric desc limit 3
  ) s;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_watchouts from (
    select trait_key as x from jsonb_each(v_traits) e(trait_key,val)
    where trait_key in ('overconfidence','recency_bias','anchoring','confirmation_bias','regret_sensitivity','disposition_effect','emotional_reactivity','social_influence')
      and (val::text)::numeric >= 70 order by (val::text)::numeric desc limit 3
  ) w;

  v_code := v_code || '-' ||
    least(9,greatest(0,round(coalesce((v_traits->>'adaptability')::numeric,50)/10)))::int ||
    least(9,greatest(0,round(coalesce((v_traits->>'self_confidence')::numeric,50)/10)))::int ||
    least(9,greatest(0,round(coalesce((v_traits->>'overconfidence')::numeric,50)/10)))::int ||
    least(9,greatest(0,round(coalesce((v_traits->>'emotional_reactivity')::numeric,50)/10)))::int;

  insert into public.fingerprint_profiles (assessment_id,model_version,fingerprint_code,decision_style,pressure_style,strengths,watchouts,trait_scores)
  values (p_assessment_id,v_model,v_code,v_decision_style,v_pressure_style,v_strengths,v_watchouts,v_traits)
  on conflict (assessment_id,model_version) do update set
    fingerprint_code=excluded.fingerprint_code,
    decision_style=excluded.decision_style,
    pressure_style=excluded.pressure_style,
    strengths=excluded.strengths,
    watchouts=excluded.watchouts,
    trait_scores=excluded.trait_scores
  returning id into v_fp_id;

  return jsonb_build_object(
    'fingerprint_id',v_fp_id,
    'archetype',v_archetype,
    'risk_tolerance',v_tolerance,
    'risk_capacity',v_capacity,
    'fingerprint_code',v_code,
    'decision_style',v_decision_style,
    'pressure_style',v_pressure_style,
    'strengths',v_strengths,
    'watchouts',v_watchouts,
    'trait_scores',v_traits,
    'model_version',v_model
  );
end;
$$;

revoke execute on function public.calculate_investing_fingerprint(uuid) from public, anon, authenticated;