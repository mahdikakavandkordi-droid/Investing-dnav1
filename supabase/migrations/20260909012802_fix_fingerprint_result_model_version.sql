create or replace function public.calculate_investing_fingerprint(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
declare
 v_model text := 'v1.1';
 v_result_model text := 'dna-v1.1';
 v_traits jsonb := '{}'::jsonb; v_code text; v_decision text; v_pressure text;
 v_strengths jsonb := '[]'::jsonb; v_watchouts jsonb := '[]'::jsonb; v_fp_id uuid;
 v_tolerance numeric; v_capacity numeric; v_archetype text; v_adapt numeric; v_conf numeric; v_over numeric; v_emotion numeric;
begin
 select r.risk_tolerance,r.risk_capacity,r.archetype into v_tolerance,v_capacity,v_archetype
 from public.results r
 where r.assessment_id=p_assessment_id
 order by r.created_at desc limit 1;
 if v_archetype is null then raise exception 'No result found for assessment %',p_assessment_id; end if;
 with scored as (
  select q.construct,
    case when q.question_type='scale' then ((a.answer_value->>'value')::numeric*10)
    else (q.scoring->>(a.answer_value->>'value'))::numeric end score
  from public.answers a
  join public.question_bank q on q.question_id=a.question_id and q.version=v_model and q.active=true
  where a.assessment_id=p_assessment_id and q.section='behavioral_dna'
 ), agg as (
  select construct,round(avg(score),2) score from scored
  where score between 0 and 100 group by construct
 )
 select coalesce(jsonb_object_agg(construct,to_jsonb(score)),'{}'::jsonb) into v_traits from agg;
 v_adapt:=coalesce((v_traits->>'adaptability')::numeric,50); v_conf:=coalesce((v_traits->>'self_confidence')::numeric,50);
 v_over:=coalesce((v_traits->>'overconfidence')::numeric,50); v_emotion:=coalesce((v_traits->>'emotional_reactivity')::numeric,50);
 v_code:=case v_archetype
  when 'VAULT' then 'VLT' when 'ANCHOR' then 'ANC' when 'COOLHAND' then 'CLH' when 'SCOUT' then 'SCT'
  when 'MAVERICK' then 'MVR' when 'STRIKER' then 'STK' when 'HOTSHOT' then 'HST' when 'HIGHROLLER' then 'HRO' when 'JACKPOT' then 'JKT' else 'UNK' end
  || '-' || least(9,greatest(0,round(v_adapt/10)))::int
  || least(9,greatest(0,round(v_conf/10)))::int
  || least(9,greatest(0,round(v_over/10)))::int
  || least(9,greatest(0,round(v_emotion/10)))::int;
 v_decision:=case
  when v_over>=70 and v_conf>=70 then 'Conviction-Driven'
  when v_adapt>=75 then 'Adaptive'
  when coalesce((v_traits->>'social_influence')::numeric,50)>=70 then 'Socially Influenced'
  when coalesce((v_traits->>'recency_bias')::numeric,50)>=70 then 'Recency-Sensitive'
  else (select default_decision_style from public.archetype_profiles where version=v_model and archetype_key=v_archetype) end;
 v_pressure:=case
  when v_emotion>=70 then 'Emotionally Reactive'
  when v_emotion<=30 then 'Composed'
  when v_adapt>=75 then 'Adaptive Under Pressure'
  else (select default_pressure_style from public.archetype_profiles where version=v_model and archetype_key=v_archetype) end;
 select coalesce(jsonb_agg(trait_key order by score desc),'[]'::jsonb) into v_strengths
 from (select trait_key,(val::text)::numeric score from jsonb_each(v_traits) e(trait_key,val)
       where trait_key in ('adaptability','self_confidence','financial_self_efficacy') and (val::text)::numeric>=70 limit 3) x;
 select coalesce(jsonb_agg(trait_key order by score desc),'[]'::jsonb) into v_watchouts
 from (select trait_key,(val::text)::numeric score from jsonb_each(v_traits) e(trait_key,val)
       where trait_key in ('overconfidence','recency_bias','anchoring','confirmation_bias','regret_sensitivity','disposition_effect','emotional_reactivity','social_influence') and (val::text)::numeric>=70 limit 3) x;
 insert into public.fingerprint_profiles(assessment_id,model_version,fingerprint_code,decision_style,pressure_style,strengths,watchouts,trait_scores)
 values(p_assessment_id,v_model,v_code,v_decision,v_pressure,v_strengths,v_watchouts,v_traits)
 on conflict(assessment_id,model_version) do update set fingerprint_code=excluded.fingerprint_code,decision_style=excluded.decision_style,pressure_style=excluded.pressure_style,strengths=excluded.strengths,watchouts=excluded.watchouts,trait_scores=excluded.trait_scores
 returning id into v_fp_id;
 return jsonb_build_object('fingerprint_id',v_fp_id,'archetype',v_archetype,'risk_tolerance',v_tolerance,'risk_capacity',v_capacity,'fingerprint_code',v_code,'decision_style',v_decision,'pressure_style',v_pressure,'strengths',v_strengths,'watchouts',v_watchouts,'trait_scores',v_traits,'model_version',v_model);
end;
$function$;