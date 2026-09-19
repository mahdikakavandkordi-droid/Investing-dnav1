create table if not exists public.archetype_profiles (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  archetype_key text not null,
  display_name text not null,
  tagline text not null,
  description text not null,
  default_decision_style text not null,
  default_pressure_style text not null,
  strength_traits jsonb not null default '[]'::jsonb,
  watchout_traits jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(version, archetype_key)
);

create table if not exists public.fingerprint_rules (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  archetype_key text not null,
  rule_key text not null,
  priority integer not null default 100,
  min_score numeric,
  max_score numeric,
  narrative_label text not null,
  decision_style text,
  pressure_style text,
  created_at timestamptz not null default now(),
  unique(version, archetype_key, rule_key)
);

alter table public.archetype_profiles enable row level security;
alter table public.fingerprint_rules enable row level security;
revoke all on public.archetype_profiles from anon, authenticated;
revoke all on public.fingerprint_rules from anon, authenticated;

insert into public.archetype_profiles
(version, archetype_key, display_name, tagline, description, default_decision_style, default_pressure_style, strength_traits, watchout_traits)
values
('v1.1','VAULT','The Capital Protector','Protect first. Participate second.','Low willingness and low financial capacity for investment risk.','Capital-Preserving','Defensive','["discipline","loss awareness"]','["excessive caution","missed opportunities"]'),
('v1.1','ANCHOR','The Steady Builder','Careful, but not frozen.','Low willingness to take risk with moderate financial capacity.','Measured','Defensive','["discipline","consistency"]','["overreacting to losses","underusing capacity"]'),
('v1.1','COOLHAND','The Calm Conservative','You can take risk, but you do not need to.','Low willingness with high financial capacity.','Selective','Composed','["emotional control","financial resilience"]','["excessive conservatism","opportunity avoidance"]'),
('v1.1','SCOUT','The Cautious Explorer','Curious about risk, careful with consequences.','Moderate willingness with low financial capacity.','Selective','Measured','["curiosity","risk awareness"]','["capacity mismatch","overextending"]'),
('v1.1','MAVERICK','The Balanced Risk Taker','Comfortable taking calculated risk.','Moderate willingness and moderate capacity.','Balanced','Measured','["balance","calculation"]','["indecision","style drift"]'),
('v1.1','STRIKER','The Calculated Aggressor','Ready to act when the odds justify it.','Moderate willingness with high financial capacity.','Opportunity-Driven','Composed','["flexibility","resilience"]','["excess confidence","unnecessary risk"]'),
('v1.1','HOTSHOT','The High-Risk Aspirant','Willing to swing hard, but capacity may say no.','High willingness with low financial capacity.','Conviction-Driven','Variable','["boldness","opportunity seeking"]','["capacity mismatch","overextension"]'),
('v1.1','HIGHROLLER','The High-Conviction Investor','High appetite with meaningful financial room.','High willingness and moderate financial capacity.','Conviction-Driven','Composed','["conviction","decisiveness"]','["overconfidence","concentration"]'),
('v1.1','JACKPOT','The Adaptive Risk Taker','High appetite. High capacity. Big decisions require discipline.','High willingness and high financial capacity.','Conviction-Driven','Composed','["resilience","opportunity sensitivity"]','["overconfidence","excessive concentration"]')
on conflict (version, archetype_key) do update set
 display_name=excluded.display_name,
 tagline=excluded.tagline,
 description=excluded.description,
 default_decision_style=excluded.default_decision_style,
 default_pressure_style=excluded.default_pressure_style,
 strength_traits=excluded.strength_traits,
 watchout_traits=excluded.watchout_traits;

insert into public.fingerprint_rules
(version, archetype_key, rule_key, priority, min_score, max_score, narrative_label, decision_style, pressure_style)
values
('v1.1','VAULT','adaptive_calm',10,70,null,'Calm and Adaptive','Adaptive','Composed'),
('v1.1','VAULT','emotionally_reactive',20,null,30,'Emotionally Protective','Defensive','Emotionally Reactive'),
('v1.1','ANCHOR','adaptive_calm',10,70,null,'Measured and Adaptive','Adaptive','Composed'),
('v1.1','ANCHOR','high_regret',20,70,null,'Regret-Sensitive','Measured','Cautious'),
('v1.1','COOLHAND','high_self_efficacy',10,70,null,'Quietly Confident','Selective','Composed'),
('v1.1','COOLHAND','high_recency',20,70,null,'Trend-Sensitive','Recency-Sensitive','Measured'),
('v1.1','SCOUT','high_opportunity',10,70,null,'Opportunity Curious','Opportunity-Driven','Measured'),
('v1.1','SCOUT','high_emotion',20,70,null,'Emotionally Guarded','Defensive','Emotionally Reactive'),
('v1.1','MAVERICK','high_adaptability',10,70,null,'Adaptive Calculator','Adaptive','Composed'),
('v1.1','MAVERICK','high_social',20,70,null,'Socially Responsive','Socially Influenced','Measured'),
('v1.1','STRIKER','high_self_efficacy',10,70,null,'Confident Operator','Conviction-Driven','Composed'),
('v1.1','STRIKER','high_adaptability',20,70,null,'Adaptive Operator','Adaptive','Composed'),
('v1.1','HOTSHOT','high_opportunity',10,70,null,'Opportunity Hunter','Opportunity-Driven','Variable'),
('v1.1','HOTSHOT','high_emotion',20,70,null,'Emotion-Driven Risk Taker','Conviction-Driven','Emotionally Reactive'),
('v1.1','HIGHROLLER','high_overconfidence',10,70,null,'High-Conviction Operator','Conviction-Driven','Composed'),
('v1.1','HIGHROLLER','high_adaptability',20,70,null,'Adaptive High-Conviction Investor','Adaptive','Composed'),
('v1.1','JACKPOT','high_overconfidence',10,70,null,'Conviction-Driven Investor','Conviction-Driven','Composed'),
('v1.1','JACKPOT','high_adaptability',20,70,null,'Adaptive Risk Taker','Adaptive','Composed'),
('v1.1','JACKPOT','high_emotion',30,70,null,'Emotionally Reactive Risk Taker','Conviction-Driven','Emotionally Reactive')
on conflict (version, archetype_key, rule_key) do update set
 priority=excluded.priority,
 min_score=excluded.min_score,
 max_score=excluded.max_score,
 narrative_label=excluded.narrative_label,
 decision_style=excluded.decision_style,
 pressure_style=excluded.pressure_style;

create or replace function public.calculate_investing_fingerprint(p_assessment_id uuid)
returns jsonb language plpgsql as $$
declare
 v_model text := 'v1.1'; v_traits jsonb := '{}'::jsonb; v_code text; v_decision text; v_pressure text;
 v_strengths jsonb := '[]'::jsonb; v_watchouts jsonb := '[]'::jsonb; v_fp_id uuid;
 v_tolerance numeric; v_capacity numeric; v_archetype text; v_adapt numeric; v_conf numeric; v_over numeric; v_emotion numeric;
begin
 select r.risk_tolerance,r.risk_capacity,r.archetype into v_tolerance,v_capacity,v_archetype
 from public.results r where r.assessment_id=p_assessment_id and r.model_version=v_model order by r.created_at desc limit 1;
 if v_archetype is null then raise exception 'No % result found for assessment %',v_model,p_assessment_id; end if;
 with scored as (
  select q.construct, case when q.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
    else (q.scoring->>(a.answer_value->>'value'))::numeric end score
  from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_model and q.active=true
  where a.assessment_id=p_assessment_id and q.section='behavioral_dna'
 ), agg as (select construct,round(avg(score),2) score from scored where score between 0 and 100 group by construct)
 select coalesce(jsonb_object_agg(construct,to_jsonb(score)),'{}'::jsonb) into v_traits from agg;
 v_adapt:=coalesce((v_traits->>'adaptability')::numeric,50); v_conf:=coalesce((v_traits->>'self_confidence')::numeric,50);
 v_over:=coalesce((v_traits->>'overconfidence')::numeric,50); v_emotion:=coalesce((v_traits->>'emotional_reactivity')::numeric,50);
 v_code:=case v_archetype when 'VAULT' then 'VLT' when 'ANCHOR' then 'ANC' when 'COOLHAND' then 'CLH' when 'SCOUT' then 'SCT' when 'MAVERICK' then 'MVR' when 'STRIKER' then 'STK' when 'HOTSHOT' then 'HST' when 'HIGHROLLER' then 'HRO' when 'JACKPOT' then 'JKT' else 'UNK' end || '-' || least(9,greatest(0,round(v_adapt/10)))::int || least(9,greatest(0,round(v_conf/10)))::int || least(9,greatest(0,round(v_over/10)))::int || least(9,greatest(0,round(v_emotion/10)))::int;
 v_decision:=case when v_over>=70 and v_conf>=70 then 'Conviction-Driven' when v_adapt>=75 then 'Adaptive' when coalesce((v_traits->>'social_influence')::numeric,50)>=70 then 'Socially Influenced' when coalesce((v_traits->>'recency_bias')::numeric,50)>=70 then 'Recency-Sensitive' else (select default_decision_style from public.archetype_profiles where version=v_model and archetype_key=v_archetype) end;
 v_pressure:=case when v_emotion>=70 then 'Emotionally Reactive' when v_emotion<=30 then 'Composed' when v_adapt>=75 then 'Adaptive Under Pressure' else (select default_pressure_style from public.archetype_profiles where version=v_model and archetype_key=v_archetype) end;
 select coalesce(jsonb_agg(trait_key order by score desc),'[]'::jsonb) into v_strengths from (select trait_key,(val::text)::numeric score from jsonb_each(v_traits) e(trait_key,val) where trait_key in ('adaptability','self_confidence','financial_self_efficacy') and (val::text)::numeric>=70 limit 3) x;
 select coalesce(jsonb_agg(trait_key order by score desc),'[]'::jsonb) into v_watchouts from (select trait_key,(val::text)::numeric score from jsonb_each(v_traits) e(trait_key,val) where trait_key in ('overconfidence','recency_bias','anchoring','confirmation_bias','regret_sensitivity','disposition_effect','emotional_reactivity','social_influence') and (val::text)::numeric>=70 limit 3) x;
 insert into public.fingerprint_profiles(assessment_id,model_version,fingerprint_code,decision_style,pressure_style,strengths,watchouts,trait_scores)
 values(p_assessment_id,v_model,v_code,v_decision,v_pressure,v_strengths,v_watchouts,v_traits)
 on conflict(assessment_id,model_version) do update set fingerprint_code=excluded.fingerprint_code,decision_style=excluded.decision_style,pressure_style=excluded.pressure_style,strengths=excluded.strengths,watchouts=excluded.watchouts,trait_scores=excluded.trait_scores
 returning id into v_fp_id;
 return jsonb_build_object('fingerprint_id',v_fp_id,'archetype',v_archetype,'risk_tolerance',v_tolerance,'risk_capacity',v_capacity,'fingerprint_code',v_code,'decision_style',v_decision,'pressure_style',v_pressure,'strengths',v_strengths,'watchouts',v_watchouts,'trait_scores',v_traits,'model_version',v_model);
end; $$;
revoke execute on function public.calculate_investing_fingerprint(uuid) from public,anon,authenticated;