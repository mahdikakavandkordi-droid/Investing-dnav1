update public.question_bank set scoring = '{"A":10,"B":35,"C":100,"D":10}'::jsonb where version='v1.1' and question_id='BD05';
update public.question_bank set scoring = '{"A":100,"B":65,"C":15,"D":5}'::jsonb where version='v1.1' and question_id='BD09';
update public.question_bank set scoring = '{"A":100,"B":65,"C":20,"D":10}'::jsonb where version='v1.1' and question_id='BD11';

update public.behavioral_traits set polarity='negative' where version='v1.1' and trait_key in ('overconfidence','social_influence','recency_bias','anchoring','confirmation_bias','regret_sensitivity','disposition_effect','emotional_reactivity');
update public.behavioral_traits set polarity='positive' where version='v1.1' and trait_key in ('self_confidence','calibration','adaptability','financial_self_efficacy','opportunity_sensitivity');
update public.behavioral_traits set polarity='intensity' where version='v1.1' and trait_key='risk_perception';