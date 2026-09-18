create or replace function public.start_pilot_assessment(p_participant_id uuid, p_cohort_id uuid) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare v_assessment_id uuid; v_q text; v_m text;
begin
 select questionnaire_version,model_version into v_q,v_m from pilot_cohorts where id=p_cohort_id and status in ('planned','collecting');
 if v_q is null then raise exception 'Pilot cohort unavailable'; end if;
 if not exists(select 1 from pilot_participants where id=p_participant_id and cohort_id=p_cohort_id and withdrawn_at is null) then raise exception 'Invalid pilot participant'; end if;
 insert into assessments(assessment_version,questionnaire_version,model_version,scoring_version,status,started_at,pilot_participant_id)
 values(v_q,v_q,v_m,v_m,'in_progress',now(),p_participant_id)
 returning id into v_assessment_id;
 update pilot_cohorts set status='collecting' where id=p_cohort_id and status='planned';
 return jsonb_build_object('assessment_id',v_assessment_id,'questionnaire_version',v_q,'model_version',v_m);
end $$;

revoke all on function public.start_pilot_assessment(uuid,uuid) from public,anon,authenticated;