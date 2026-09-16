-- Consolidate Match runtime to one canonical implementation.
-- Historical v3/v4/v5/v5.1 implementations remain reconstructable from
-- applied migration history and Git; they no longer remain callable live code.

drop function if exists public.calculate_investment_match_v51(uuid);
drop function if exists public.calculate_investment_match_v5(uuid);
drop function if exists public.calculate_investment_match_v4(uuid);
drop function if exists public.calculate_investment_match_v3(uuid);
drop function if exists public.calculate_investment_match(uuid);

drop view if exists public.v_investment_dna_v1;
