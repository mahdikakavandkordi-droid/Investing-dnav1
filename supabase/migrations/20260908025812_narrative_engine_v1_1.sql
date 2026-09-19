create table if not exists public.narrative_rules (
 id uuid primary key default gen_random_uuid(),
 version text not null,
 archetype_key text,
 trait_key text,
 rule_key text not null,
 priority integer not null default 100,
 min_score numeric,
 max_score numeric,
 narrative_section text not null check (narrative_section in ('summary','how_you_think','pressure_style','strength','blind_spot','decision_influence','character')),
 narrative_text jsonb not null,
 created_at timestamptz not null default now(),
 unique(version, rule_key)
);

create index if not exists narrative_rules_lookup_idx on public.narrative_rules(version, archetype_key, trait_key, priority);
alter table public.narrative_rules enable row level security;
revoke all on table public.narrative_rules from anon, authenticated;

create table if not exists public.narratives (
 id uuid primary key default gen_random_uuid(),
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 model_version text not null,
 narrative jsonb not null,
 created_at timestamptz not null default now(),
 unique(assessment_id, model_version)
);
create index if not exists narratives_assessment_idx on public.narratives(assessment_id);
alter table public.narratives enable row level security;
revoke all on table public.narratives from anon, authenticated;

create or replace function public.generate_investing_narrative(p_assessment_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
 r public.results%rowtype;
 f public.fingerprint_profiles%rowtype;
 n jsonb := '{}'::jsonb;
 archetype_name text;
 summary text;
 thinking text;
 pressure text;
 strength text;
 blind text;
 influence text;
 character text;
begin
 select * into r from public.results where assessment_id=p_assessment_id order by created_at desc limit 1;
 if r.id is null then raise exception 'No result found for assessment'; end if;
 select * into f from public.fingerprint_profiles where assessment_id=p_assessment_id order by created_at desc limit 1;
 if f.id is null then raise exception 'Fingerprint must be generated before narrative'; end if;
 select display_name into archetype_name from public.archetype_profiles where version='v1.1' and archetype_key=r.archetype limit 1;
 summary := case r.archetype
  when 'VAULT' then 'You prioritize protecting capital and avoiding losses that could disrupt your financial plan.'
  when 'ANCHOR' then 'You prefer steady progress, with enough flexibility to take measured risk when the case is clear.'
  when 'COOLHAND' then 'You can tolerate meaningful risk, but you do not feel compelled to take it.'
  when 'SCOUT' then 'You are curious about opportunity, but consequences matter before you commit.'
  when 'MAVERICK' then 'You are comfortable with calculated risk and tend to balance opportunity with discipline.'
  when 'STRIKER' then 'You are willing to act decisively when the evidence and payoff justify the risk.'
  when 'HOTSHOT' then 'Your appetite for risk is strong, but your financial capacity may not always support the level of risk you want to take.'
  when 'HIGHROLLER' then 'You have both a high appetite for risk and meaningful financial room, giving you freedom to pursue higher-conviction opportunities.'
  when 'JACKPOT' then 'You are comfortable with uncertainty and have the financial room to absorb meaningful volatility, but discipline remains essential.'
  else 'Your investor profile reflects a distinct combination of risk tolerance, financial capacity and behavioral tendencies.' end;
 thinking := case f.decision_style
  when 'Conviction-Driven' then 'You tend to make decisions from a strong internal thesis. Once the evidence feels compelling, you can move with conviction.'
  when 'Adaptive' then 'You are relatively willing to revise your view when new evidence changes the investment case.'
  when 'Socially Influenced' then 'Other investors and their outcomes can meaningfully shape how you evaluate opportunities.'
  when 'Recency-Sensitive' then 'Recent market performance can have a noticeable effect on how attractive an opportunity feels.'
  else 'You combine your risk appetite with your own interpretation of evidence and experience.' end;
 pressure := case f.pressure_style
  when 'Emotionally Reactive' then 'Under pressure, your emotions can make it harder to follow a pre-planned strategy, especially during sharp market moves.'
  when 'Composed' then 'Under pressure, you are relatively capable of staying aligned with a pre-planned strategy.'
  when 'Adaptive Under Pressure' then 'Under pressure, you tend to reassess quickly and adjust when the evidence warrants it.'
  else 'Your response to pressure depends on both the market environment and the strength of your investment thesis.' end;
 select narrative_text->>'text' into strength from public.narrative_rules where version='v1.1' and narrative_section='strength' and ((trait_key='adaptability' and coalesce((f.trait_scores->>'adaptability')::numeric,0)>=70) or (trait_key='financial_self_efficacy' and coalesce((f.trait_scores->>'financial_self_efficacy')::numeric,0)>=70) or (trait_key='self_confidence' and coalesce((f.trait_scores->>'self_confidence')::numeric,0)>=70)) order by priority limit 1;
 if strength is null then strength := 'Your profile suggests a balanced combination of risk appetite and decision-making tendencies.'; end if;
 select narrative_text->>'text' into blind from public.narrative_rules where version='v1.1' and narrative_section='blind_spot' and ((trait_key='overconfidence' and coalesce((f.trait_scores->>'overconfidence')::numeric,0)>=70) or (trait_key='emotional_reactivity' and coalesce((f.trait_scores->>'emotional_reactivity')::numeric,0)>=70) or (trait_key='confirmation_bias' and coalesce((f.trait_scores->>'confirmation_bias')::numeric,0)>=70) or (trait_key='regret_sensitivity' and coalesce((f.trait_scores->>'regret_sensitivity')::numeric,0)>=70)) order by priority limit 1;
 if blind is null then blind := 'Your main blind spot is less likely to be risk itself and more likely to be how a strong thesis can affect your judgment.'; end if;
 influence := 'Your behavioral fingerprint adds context to your risk profile: the same risk score can lead to very different decisions depending on confidence, adaptability, emotion and social influence.';
 character := case r.archetype
  when 'VAULT' then 'The Capital Protector'
  when 'ANCHOR' then 'The Steady Builder'
  when 'COOLHAND' then 'The Calm Conservative'
  when 'SCOUT' then 'The Cautious Explorer'
  when 'MAVERICK' then 'The Balanced Risk Taker'
  when 'STRIKER' then 'The Calculated Aggressor'
  when 'HOTSHOT' then 'The High-Risk Aspirant'
  when 'HIGHROLLER' then 'The High-Conviction Investor'
  when 'JACKPOT' then 'The Adaptive Risk Taker'
  else 'The Investor' end;
 n := jsonb_build_object('archetype',r.archetype,'archetype_name',archetype_name,'summary',summary,'how_you_think',thinking,'pressure_style',pressure,'strength',strength,'blind_spot',blind,'decision_influence',influence,'character',character,'risk_tolerance',r.risk_tolerance,'risk_capacity',r.risk_capacity,'behavioral_fingerprint',f.trait_scores);
 insert into public.narratives(assessment_id,model_version,narrative) values(p_assessment_id,'narrative-v1.1',n) on conflict(assessment_id,model_version) do update set narrative=excluded.narrative;
 return n;
end;
$$;
revoke execute on function public.generate_investing_narrative(uuid) from public, anon, authenticated;