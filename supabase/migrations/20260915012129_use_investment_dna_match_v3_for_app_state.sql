create or replace function public.get_investment_recommendations(p_assessment_id uuid, p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $$
declare
  v_limit int:=greatest(1,least(coalesce(p_limit,10),25));
  v_model text:='investment-dna-match-v3.0';
  v_count int; v_top jsonb; v_alt jsonb; v_consider jsonb; v_mismatch jsonb;
begin
  if not exists(select 1 from assessments where id=p_assessment_id) then raise exception 'assessment_not_found'; end if;
  select count(*) into v_count from investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
  if v_count=0 then raise exception 'match_results_not_found'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_top from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='top_match' order by match_rank limit v_limit)x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_alt from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='alternative' order by match_rank limit v_limit)x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_consider from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='consider' order by match_rank limit v_limit)x;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.match_rank),'[]') into v_mismatch from (select match_rank,symbol,name,match_score,recommendation_tier,risk_band,explanation from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='mismatch' order by match_rank limit v_limit)x;
  return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'universe_count',v_count,'top_matches',v_top,'alternatives',v_alt,'consider',v_consider,'mismatch',v_mismatch,'disclaimer','Compatibility signals based on Investor DNA, Investment DNA, and the context you provided. They are for discovery and comparison, not investment advice.');
end;
$$;