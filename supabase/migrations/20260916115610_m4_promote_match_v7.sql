create or replace function investor_private.preserve_match_nulls()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.model_version in ('investment-dna-match-v6','investment-dna-match-v7')
     and coalesce(new.rationale->>'eligibility','')='review_required' then
    new.match_score:=null;
  end if;
  return new;
end;
$$;

create or replace function investor_private.current_match(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare r investor_private.match_runs;
begin
  select * into r
  from investor_private.match_runs
  where assessment_id=p_assessment_id and model_version='investment-dna-match-v7'
  order by created_at desc,id desc limit 1;

  if r.id is null
     or r.input_fingerprint is distinct from investor_private.match_input_fingerprint(p_assessment_id)
     or r.created_at<now()-interval '1 day' then
    perform public.calculate_investment_match_v7(p_assessment_id);
    select * into r
    from investor_private.match_runs
    where assessment_id=p_assessment_id and model_version='investment-dna-match-v7'
    order by created_at desc,id desc limit 1;
  end if;

  if r.id is null then raise exception 'match_run_not_created'; end if;
  return r.payload;
end;
$$;

drop function if exists investor_private.current_match_v7_candidate(uuid);

revoke all on function public.calculate_investment_match_v6(uuid) from public,anon,authenticated;
revoke all on function public.calculate_investment_match_v7(uuid) from public,anon,authenticated;
grant execute on function public.calculate_investment_match_v6(uuid) to service_role;
grant execute on function public.calculate_investment_match_v7(uuid) to service_role;