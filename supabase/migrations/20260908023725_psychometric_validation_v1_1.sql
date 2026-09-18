-- Psychometric cleanup for Investing DNA V1.1
-- Preserve raw answers; improve construct semantics and scoring metadata.

update public.question_bank
set prompt_en='Which investment feels most like you?'
where question_id='RT01' and version='v1';

update public.question_bank
set prompt_en='An investment falls 20%, but your original thesis has not changed. What do you do?'
where question_id='RT02' and version='v1';

-- RT03 is a forced risk/reward preference item. Remove the ambiguous "need more information" response
-- because it mixes information preference with risk preference.
update public.question_bank
set options='[{"value":"A","label":"90% chance to gain $5,000; 10% chance to lose $1,000"},{"value":"B","label":"60% chance to gain $12,000; 40% chance to lose $6,000"}]'::jsonb,
    scoring='{"A":35,"B":90}'::jsonb
where question_id='RT03' and version='v1';

-- Behavioral dimensions: make the semantic direction explicit.
update public.scoring_dimensions
set display_name='Recency Bias (higher = stronger bias)'
where version='v1' and dimension_key='recency_bias';

update public.scoring_dimensions
set display_name='Emotional Reactivity (higher = stronger reactivity)'
where version='v1' and dimension_key='emotional_reactivity';

update public.scoring_dimensions
set display_name='Social Influence (higher = stronger influence)'
where version='v1' and dimension_key='social_influence';

-- Add scoring metadata without changing the stored raw response model.
alter table public.question_bank add column if not exists score_direction text not null default 'direct';
alter table public.question_bank add column if not exists construct_role text not null default 'signal';

update public.question_bank
set score_direction='direct', construct_role='core'
where version='v1' and section='risk_tolerance';

update public.question_bank
set score_direction='direct', construct_role='capacity'
where version='v1' and section='risk_capacity';

-- Behavioral scores represent intensity of the named tendency, not "good/bad".
update public.question_bank
set score_direction=case when question_id='BD07' then 'reverse' else 'direct' end,
    construct_role='behavioral_signal'
where version='v1' and section='behavioral_dna';

-- BD14 already uses reverse scoring so that higher scores mean lower emotional difficulty.
-- For the behavioral fingerprint we want higher = stronger emotional reactivity, therefore flip its semantic direction.
update public.question_bank
set score_direction='direct',
    scoring='{"scale":{"min":0,"max":10,"direction":"direct"}}'::jsonb
where question_id='BD14' and version='v1';

-- Introduce a model-level quality flag. The current version is explicitly a prototype pending empirical validation.
alter table public.assessments add column if not exists scoring_version text;
alter table public.results add column if not exists scoring_version text;

update public.assessments set scoring_version='v1.1' where questionnaire_version='v1' and scoring_version is null;
update public.results set scoring_version='v1.1' where model_version='v1' and scoring_version is null;
