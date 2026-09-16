-- M4: fully retire legacy browser/profile RPCs that have no live callers.
-- Historical migrations preserve their original definitions; current runtime
-- uses the ownership-scoped service/private account and context paths instead.

drop function if exists public.app_save_investment_context(uuid,jsonb);
drop function if exists public.promote_assessment_to_current_dna(uuid);
