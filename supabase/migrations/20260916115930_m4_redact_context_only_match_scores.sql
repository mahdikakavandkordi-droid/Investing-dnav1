create or replace function investor_private.redact_context_only_match_scores(p_payload jsonb)
returns jsonb
language plpgsql
immutable
set search_path=''
as $$
declare
  v_payload jsonb := coalesce(p_payload,'{}'::jsonb);
  v_results jsonb;
  v_consider jsonb;
begin
  if v_payload->>'status' is distinct from 'context_required' then
    return v_payload;
  end if;

  select coalesce(jsonb_agg(jsonb_set(x,'{match_score}','null'::jsonb,true) order by ord),'[]'::jsonb)
  into v_results
  from jsonb_array_elements(coalesce(v_payload->'results','[]'::jsonb)) with ordinality e(x,ord);

  select coalesce(jsonb_agg(jsonb_set(x,'{match_score}','null'::jsonb,true) order by ord),'[]'::jsonb)
  into v_consider
  from jsonb_array_elements(coalesce(v_payload->'consider','[]'::jsonb)) with ordinality e(x,ord);

  return jsonb_set(jsonb_set(v_payload,'{results}',v_results,true),'{consider}',v_consider,true)
    || jsonb_build_object('context_only_score_policy','hidden_until_context_complete');
end;
$$;
revoke all on function investor_private.redact_context_only_match_scores(jsonb) from public,anon,authenticated;
grant execute on function investor_private.redact_context_only_match_scores(jsonb) to service_role;

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
  return investor_private.redact_context_only_match_scores(r.payload);
end;
$$;