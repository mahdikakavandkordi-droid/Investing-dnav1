ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS options_fa jsonb;

UPDATE public.question_bank q SET options_fa = CASE
WHEN question_id IN ('RT01','RT04','RT05','RT10','BD01','BD02','BD03','BD05','BD15','RC01','RC02','RC03','RC04','RC05','RC06','RC07','RC08','RC09','RC10') THEN q.options_fa
ELSE q.options_fa END WHERE version='v1.3' AND active=true;

INSERT INTO public.pilot_cohorts (code, questionnaire_version, model_version, target_n, min_n_for_basic_stats, min_n_for_reliability, status, notes)
SELECT 'PILOT_V1_3','v1.3','dna-v1.3',500,30,100,'planned','Multilingual pilot: English, French, Persian. Same scoring model across languages.'
WHERE NOT EXISTS (SELECT 1 FROM public.pilot_cohorts WHERE code='PILOT_V1_3');