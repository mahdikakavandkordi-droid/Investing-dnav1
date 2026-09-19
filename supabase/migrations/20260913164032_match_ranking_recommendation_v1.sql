create or replace view public.v_investment_match_ranked as
select m.id,m.assessment_id,m.investment_id,i.symbol,i.name,i.asset_type,i.category,m.model_version,m.match_score,m.risk_band,
 case when m.match_score>=85 then 'top_match' when m.match_score>=70 then 'alternative' when m.match_score>=55 then 'consider' else 'mismatch' end as recommendation_tier,
 rank() over(partition by m.assessment_id,m.model_version order by m.match_score desc) as match_rank,
 count(*) over(partition by m.assessment_id,m.model_version) as universe_count,
 m.explanation
from public.investment_match_results m join public.investments i on i.id=m.investment_id and i.data_status <> 'inactive';

create or replace function public.get_investment_recommendations(p_assessment_id uuid,p_limit int default 10)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare v_limit int:=greatest(1,least(coalesce(p_limit,10),25)); v_model text:='suitability-v2.2'; v_count int; v_top jsonb; v_alt jsonb; v_consider jsonb; v_mismatch jsonb;
begin
 if not exists(select 1 from assessments where id=p_assessment_id) then raise exception 'assessment_not_found'; end if;
 select count(*) into v_count from v_investment_match_results where assessment_id=p_assessment_id and model_version=v_model;
 if v_count=0 then raise exception 'match_results_not_found'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('rank',x.match_rank,'symbol',x.symbol,'name',x.name,'score',x.match_score,'tier',x.recommendation_tier,'risk_band',x.risk_band,'explanation',x.explanation) order by x.match_rank),'[]'::jsonb) into v_top from (select * from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='top_match' order by match_rank limit v_limit) x;
 select coalesce(jsonb_agg(jsonb_build_object('rank',x.match_rank,'symbol',x.symbol,'name',x.name,'score',x.match_score,'tier',x.recommendation_tier,'risk_band',x.risk_band,'explanation',x.explanation) order by x.match_rank),'[]'::jsonb) into v_alt from (select * from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='alternative' order by match_rank limit v_limit) x;
 select coalesce(jsonb_agg(jsonb_build_object('rank',x.match_rank,'symbol',x.symbol,'name',x.name,'score',x.match_score,'tier',x.recommendation_tier,'risk_band',x.risk_band) order by x.match_rank),'[]'::jsonb) into v_consider from (select * from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='consider' order by match_rank limit v_limit) x;
 select coalesce(jsonb_agg(jsonb_build_object('rank',x.match_rank,'symbol',x.symbol,'name',x.name,'score',x.match_score,'tier',x.recommendation_tier,'risk_band',x.risk_band) order by x.match_rank),'[]'::jsonb) into v_mismatch from (select * from v_investment_match_ranked where assessment_id=p_assessment_id and model_version=v_model and recommendation_tier='mismatch' order by match_rank limit v_limit) x;
 return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'universe_count',v_count,'top_matches',v_top,'alternatives',v_alt,'consider',v_consider,'mismatch',v_mismatch,'disclaimer','These are compatibility signals based on Investor DNA and available investment data, not investment advice.');
end; $$;
revoke all on function public.get_investment_recommendations(uuid,int) from public,anon,authenticated; grant execute on function public.get_investment_recommendations(uuid,int) to service_role;