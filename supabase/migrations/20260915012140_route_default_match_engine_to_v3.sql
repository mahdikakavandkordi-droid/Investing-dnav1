create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns jsonb
language sql
set search_path to 'public','extensions'
as $$
  select public.calculate_investment_match_v3(p_assessment_id);
$$;