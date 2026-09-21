-- Run with a privileged SQL connection. Synthetic assessments are rolled back.
BEGIN;
DO $$
DECLARE
 old_id uuid; new_id uuid; old_result jsonb; new_result jsonb;
 scenario integer; key text; q record; choice jsonb;
BEGIN
 IF (SELECT count(*) FROM public.question_bank WHERE version='v1.10-clarity-1' AND active) <> 28 THEN
  RAISE EXCEPTION 'Expected 28 clarity questions';
 END IF;
 IF EXISTS (
  SELECT 1 FROM public.question_bank a JOIN public.question_bank b USING(question_id)
  WHERE a.version='v1.10-cognitive-candidate' AND b.version='v1.10-clarity-1'
  AND (a.scoring,a.weight,a.section,a.construct,a.sort_order,a.question_type,a.active)
   IS DISTINCT FROM (b.scoring,b.weight,b.section,b.construct,b.sort_order,b.question_type,b.active)
 ) THEN RAISE EXCEPTION 'Scoring contract changed'; END IF;
 IF EXISTS (
  (SELECT section,dimension_key,weight,min_score,max_score,is_core FROM public.scoring_dimensions WHERE version='v1.10-cognitive-candidate'
   EXCEPT SELECT section,dimension_key,weight,min_score,max_score,is_core FROM public.scoring_dimensions WHERE version='v1.10-clarity-1')
  UNION ALL
  (SELECT section,dimension_key,weight,min_score,max_score,is_core FROM public.scoring_dimensions WHERE version='v1.10-clarity-1'
   EXCEPT SELECT section,dimension_key,weight,min_score,max_score,is_core FROM public.scoring_dimensions WHERE version='v1.10-cognitive-candidate')
 ) THEN RAISE EXCEPTION 'Dimension weights changed'; END IF;
 FOR scenario IN 1..12 LOOP
  INSERT INTO public.assessments(questionnaire_version,model_version) VALUES('v1.10-cognitive-candidate','dna-v1.10-research') RETURNING id INTO old_id;
  INSERT INTO public.assessments(questionnaire_version,model_version) VALUES('v1.10-clarity-1','dna-v1.10-research') RETURNING id INTO new_id;
  FOR q IN SELECT * FROM public.question_bank WHERE version='v1.10-clarity-1' AND active LOOP
   choice:=to_jsonb((ARRAY['A','B','C','D'])[((scenario+q.sort_order)%4)+1]);
   IF scenario=1 THEN choice:='"D"'; END IF;
   IF scenario=2 AND q.section='risk_tolerance' THEN choice:='"D"'; END IF;
   IF scenario=3 AND q.section='risk_capacity' THEN choice:='"D"'; END IF;
   IF scenario=1 AND q.question_id='RC05' THEN choice:='"A"'; END IF;
   IF scenario=2 AND q.question_id='RC03' THEN choice:='"A"'; END IF;
   IF scenario=3 AND q.question_id='RC01' THEN choice:='"A"'; END IF;
   IF q.question_type='multi_choice' THEN choice:='["cash","funds"]'; END IF;
   INSERT INTO public.answers(assessment_id,question_id,answer_value)
   VALUES(old_id,q.question_id,jsonb_build_object('value',choice)),(new_id,q.question_id,jsonb_build_object('value',choice));
  END LOOP;
  old_result:=public.calculate_investing_dna(old_id);
  new_result:=public.calculate_investing_dna(new_id);
  FOREACH key IN ARRAY ARRAY['risk_tolerance','risk_capacity','archetype','behavioral_profile','experience_profile','capacity_profile'] LOOP
   IF old_result->key IS DISTINCT FROM new_result->key THEN RAISE EXCEPTION 'Scenario %, mismatch %',scenario,key; END IF;
  END LOOP;
  IF scenario IN (1,2) AND (new_result->>'risk_capacity')::numeric>39 THEN RAISE EXCEPTION 'Capacity guard lost'; END IF;
  IF scenario=3 AND (new_result->>'risk_capacity')::numeric<=39 THEN RAISE EXCEPTION 'Low available surplus incorrectly treated as hard capacity cap'; END IF;
  IF public.calculate_assessment_quality(old_id) IS DISTINCT FROM public.calculate_assessment_quality(new_id) THEN RAISE EXCEPTION 'Quality check changed'; END IF;
 END LOOP;
END $$;
ROLLBACK;
SELECT 'PASS 12 paired scenarios: scores, guards, dimensions and response-quality checks; all synthetic rows rolled back' AS result;
