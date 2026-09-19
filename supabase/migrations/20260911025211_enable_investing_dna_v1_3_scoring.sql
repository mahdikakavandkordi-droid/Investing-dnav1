BEGIN;
DELETE FROM public.scoring_dimensions WHERE version='v1.3';
INSERT INTO public.scoring_dimensions (version,section,dimension_key,display_name,weight,min_score,max_score,is_core)
SELECT 'v1.3',section,dimension_key,display_name,weight,min_score,max_score,is_core FROM public.scoring_dimensions WHERE version='v1.2';

CREATE OR REPLACE FUNCTION public.calculate_investing_dna(p_assessment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
declare
  v_questionnaire_version text; v_model_version text; v_scoring_version text; v_expected_count integer; v_answered_count integer; v_invalid_count integer;
  v_tolerance numeric:=0; v_capacity numeric:=0; v_t_weight numeric:=0; v_c_weight numeric:=0; v_archetype text; v_behavior jsonb:='{}'::jsonb; v_result_id bigint;
  v_t_low numeric:=33.3334; v_t_high numeric:=66.6667; v_c_low numeric:=33.3334; v_c_high numeric:=66.6667;
begin
 select questionnaire_version,coalesce(model_version,questionnaire_version,'v1'),coalesce(scoring_version,model_version,questionnaire_version,'v1') into v_questionnaire_version,v_model_version,v_scoring_version from public.assessments where id=p_assessment_id;
 if v_questionnaire_version is null then raise exception 'Assessment % does not exist',p_assessment_id; end if;
 if v_scoring_version in ('dna-v1.2','scoring-v1.2','dna-v1.3','scoring-v1.3') or v_model_version in ('dna-v1.2','dna-v1.3') then v_t_low:=53; v_t_high:=62; v_c_low:=51.5; v_c_high:=62; end if;
 select count(*) into v_expected_count from public.question_bank where version=v_questionnaire_version and active=true;
 select count(distinct a.question_id) into v_answered_count from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_questionnaire_version and q.active=true where a.assessment_id=p_assessment_id;
 if v_answered_count<>v_expected_count then raise exception 'Assessment % is incomplete: % of % required questions answered',p_assessment_id,v_answered_count,v_expected_count; end if;
 with scored as (select a.question_id,q.section,q.construct,q.weight q_weight,coalesce(d.weight,1) d_weight,case when q.question_type='scale' then case when (a.answer_value->>'value')~'^[-+]?[0-9]+(\\.[0-9]+)?$' and (a.answer_value->>'value')::numeric between 0 and 10 then case when q.scoring->'scale'->>'direction'='reverse' then 100-((a.answer_value->>'value')::numeric*10) else ((a.answer_value->>'value')::numeric*10) end else null end else case when q.scoring ? (a.answer_value->>'value') then (q.scoring->>(a.answer_value->>'value'))::numeric else null end end score from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_questionnaire_version and q.active=true left join public.scoring_dimensions d on d.version=v_questionnaire_version and d.dimension_key=q.construct where a.assessment_id=p_assessment_id)
 select count(*) filter(where score is null or score<0 or score>100) into v_invalid_count from scored;
 if v_invalid_count>0 then raise exception 'Assessment % contains % invalid answer value(s)',p_assessment_id,v_invalid_count; end if;
 with scored as (select q.section,q.construct,q.weight q_weight,coalesce(d.weight,1) d_weight,case when q.question_type='scale' then case when q.scoring->'scale'->>'direction'='reverse' then 100-((a.answer_value->>'value')::numeric*10) else ((a.answer_value->>'value')::numeric*10) end else (q.scoring->>(a.answer_value->>'value'))::numeric end score from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_questionnaire_version and q.active=true left join public.scoring_dimensions d on d.version=v_questionnaire_version and d.dimension_key=q.construct where a.assessment_id=p_assessment_id)
 select coalesce(sum(score*q_weight*d_weight) filter(where section='risk_tolerance'),0),coalesce(sum(q_weight*d_weight) filter(where section='risk_tolerance'),0),coalesce(sum(score*q_weight*d_weight) filter(where section='risk_capacity'),0),coalesce(sum(q_weight*d_weight) filter(where section='risk_capacity'),0) into v_tolerance,v_t_weight,v_capacity,v_c_weight from scored where score between 0 and 100;
 if v_t_weight=0 then raise exception 'No valid risk tolerance answers found for assessment %',p_assessment_id; end if; if v_c_weight=0 then raise exception 'No valid risk capacity answers found for assessment %',p_assessment_id; end if;
 v_tolerance:=round(v_tolerance/v_t_weight,2); v_capacity:=round(v_capacity/v_c_weight,2);
 if v_tolerance<v_t_low then if v_capacity<v_c_low then v_archetype:='VAULT'; elsif v_capacity<v_c_high then v_archetype:='ANCHOR'; else v_archetype:='COOLHAND'; end if; elsif v_tolerance<v_t_high then if v_capacity<v_c_low then v_archetype:='SCOUT'; elsif v_capacity<v_c_high then v_archetype:='MAVERICK'; else v_archetype:='STRIKER'; end if; else if v_capacity<v_c_low then v_archetype:='HOTSHOT'; elsif v_capacity<v_c_high then v_archetype:='HIGHROLLER'; else v_archetype:='JACKPOT'; end if; end if;
 with behavioral as (select q.construct,round(avg(case when q.question_type='scale' then case when q.scoring->'scale'->>'direction'='reverse' then 100-((a.answer_value->>'value')::numeric*10) else ((a.answer_value->>'value')::numeric*10) end else (q.scoring->>(a.answer_value->>'value'))::numeric end),2) score from public.answers a join public.question_bank q on q.question_id=a.question_id and q.version=v_questionnaire_version and q.active=true where a.assessment_id=p_assessment_id and q.section='behavioral_dna' group by q.construct) select coalesce(jsonb_object_agg(construct,score),'{}'::jsonb) into v_behavior from behavioral;
 insert into public.results(assessment_id,model_version,risk_tolerance,risk_capacity,archetype,behavioral_profile,narrative,scoring_version) values(p_assessment_id,v_model_version,v_tolerance,v_capacity,v_archetype,v_behavior,'{}'::jsonb,v_scoring_version) returning id into v_result_id;
 update public.assessments set model_version=v_model_version,scoring_version=v_scoring_version,status='completed',completed_at=coalesce(completed_at,now()) where id=p_assessment_id;
 return jsonb_build_object('result_id',v_result_id,'risk_tolerance',v_tolerance,'risk_capacity',v_capacity,'archetype',v_archetype,'behavioral_profile',v_behavior,'questionnaire_version',v_questionnaire_version,'model_version',v_model_version,'scoring_version',v_scoring_version,'boundaries',jsonb_build_object('tolerance_low',v_t_low,'tolerance_high',v_t_high,'capacity_low',v_c_low,'capacity_high',v_c_high));
end;
$function$;

COMMIT;