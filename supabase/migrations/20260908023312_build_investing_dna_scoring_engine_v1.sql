create or replace function public.calculate_investing_dna(p_assessment_id uuid)
returns jsonb
language plpgsql
as $$
declare
  v_tolerance numeric := 0;
  v_capacity numeric := 0;
  v_t_weight numeric := 0;
  v_c_weight numeric := 0;
  v_archetype text;
  v_behavior jsonb := '{}'::jsonb;
  v_result_id bigint;
begin
  if not exists (select 1 from public.assessments where id = p_assessment_id) then
    raise exception 'Assessment % does not exist', p_assessment_id;
  end if;

  with scored as (
    select q.section, q.construct, q.weight as q_weight,
      coalesce((d.weight),1) as d_weight,
      case
        when q.question_type = 'scale' then
          case when (a.answer_value->>'value') ~ '^[-+]?[0-9]+(\\.[0-9]+)?$'
            then case when q.scoring->'scale'->>'direction' = 'reverse'
              then 100 - ((a.answer_value->>'value')::numeric * 10)
              else ((a.answer_value->>'value')::numeric * 10) end
            else null end
        else
          (q.scoring ->> (a.answer_value->>'value'))::numeric
      end as score
    from public.answers a
    join public.question_bank q on q.question_id=a.question_id and q.version='v1' and q.active=true
    left join public.scoring_dimensions d on d.version='v1' and d.dimension_key=q.construct
    where a.assessment_id=p_assessment_id
  )
  select coalesce(sum(score*q_weight*d_weight) filter (where section='risk_tolerance'),0),
         coalesce(sum(q_weight*d_weight) filter (where section='risk_tolerance'),0),
         coalesce(sum(score*q_weight*d_weight) filter (where section='risk_capacity'),0),
         coalesce(sum(q_weight*d_weight) filter (where section='risk_capacity'),0)
  into v_tolerance,v_t_weight,v_capacity,v_c_weight
  from scored
  where score between 0 and 100;

  if v_t_weight = 0 then raise exception 'No valid risk tolerance answers found for assessment %', p_assessment_id; end if;
  if v_c_weight = 0 then raise exception 'No valid risk capacity answers found for assessment %', p_assessment_id; end if;

  v_tolerance := round(v_tolerance / v_t_weight,2);
  v_capacity := round(v_capacity / v_c_weight,2);

  if v_tolerance < 33.3334 then
    if v_capacity < 33.3334 then v_archetype := 'VAULT';
    elsif v_capacity < 66.6667 then v_archetype := 'ANCHOR';
    else v_archetype := 'COOLHAND'; end if;
  elsif v_tolerance < 66.6667 then
    if v_capacity < 33.3334 then v_archetype := 'SCOUT';
    elsif v_capacity < 66.6667 then v_archetype := 'MAVERICK';
    else v_archetype := 'STRIKER'; end if;
  else
    if v_capacity < 33.3334 then v_archetype := 'HOTSHOT';
    elsif v_capacity < 66.6667 then v_archetype := 'HIGHROLLER';
    else v_archetype := 'JACKPOT'; end if;
  end if;

  with behavioral as (
    select q.construct,
      round(avg(
        case
          when q.question_type='scale' then
            case when q.scoring->'scale'->>'direction'='reverse'
              then 100-((a.answer_value->>'value')::numeric*10)
              else ((a.answer_value->>'value')::numeric*10) end
          else (q.scoring->>(a.answer_value->>'value'))::numeric
        end
      ),2) as score
    from public.answers a
    join public.question_bank q on q.question_id=a.question_id and q.version='v1' and q.active=true
    where a.assessment_id=p_assessment_id and q.section='behavioral_dna'
    group by q.construct
  )
  select coalesce(jsonb_object_agg(construct,score),'{}'::jsonb) into v_behavior from behavioral;

  insert into public.results (assessment_id, model_version, risk_tolerance, risk_capacity, archetype, behavioral_profile, narrative)
  values (p_assessment_id,'v1',v_tolerance,v_capacity,v_archetype,v_behavior,'{}'::jsonb)
  returning id into v_result_id;

  update public.assessments
  set model_version='v1', status='completed', completed_at=coalesce(completed_at,now())
  where id=p_assessment_id;

  return jsonb_build_object('result_id',v_result_id,'risk_tolerance',v_tolerance,'risk_capacity',v_capacity,'archetype',v_archetype,'behavioral_profile',v_behavior,'model_version','v1');
end;
$$;

revoke all on function public.calculate_investing_dna(uuid) from public, anon, authenticated;
grant execute on function public.calculate_investing_dna(uuid) to postgres;