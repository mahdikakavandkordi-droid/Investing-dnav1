-- M4 Match v6 hard-stress matrix.
--
-- Purpose:
-- 1) exercise contradictory/edge investor profiles and money contexts;
-- 2) verify gates happen before ranking;
-- 3) verify horizon/risk ceilings move monotonically;
-- 4) verify the current Match product boundary is ETF-only;
-- 5) print a compact scenario matrix for human comparison.
--
-- All synthetic rows are rolled back.

begin;

create or replace function pg_temp.hard_make_assessment(
  p_mode text,
  p_goal text default 'growth',
  p_horizon text default '10_plus',
  p_months int default 144,
  p_principal text default 'no',
  p_add_context boolean default true
) returns uuid language plpgsql as $$
declare aid uuid:=gen_random_uuid();
begin
  insert into public.assessments(
    id,assessment_version,questionnaire_version,model_version,scoring_version,status,language_code
  ) values(
    aid,'v1.10-cognitive-candidate','v1.10-cognitive-candidate',
    'dna-v1.10-research','dna-v1.10-research','in_progress','en'
  );

  insert into public.answers(assessment_id,question_id,answer_value)
  select aid,q.question_id,
    case
      when q.question_type='multi_choice' then jsonb_build_object('value',jsonb_build_array('funds'))
      when p_mode='loss_gate' and q.question_id='RC05' then jsonb_build_object('value','A')
      when p_mode='reserve_gate' and q.question_id='RC03' then jsonb_build_object('value','A')
      when p_mode='low_tolerance' and q.section='risk_tolerance' then jsonb_build_object('value','A')
      when p_mode='mid' and q.question_type<>'multi_choice' then jsonb_build_object('value','C')
      when p_mode='one_step_lower' and q.question_id='RT01' then jsonb_build_object('value','C')
      else jsonb_build_object('value','D')
    end
  from public.question_bank q
  where q.version='v1.10-cognitive-candidate' and q.active=true;

  perform public.calculate_investing_dna(aid);

  if p_add_context then
    insert into public.investment_context(
      assessment_id,goal,time_horizon,horizon_months,principal_required,
      investment_share,liquidity_need,experience
    ) values(
      aid,p_goal,p_horizon,p_months,p_principal,'under_10','low','experienced'
    );
  end if;

  return aid;
end $$;

create temp table hard_scenarios(
  ord int primary key,
  label text unique not null,
  mode text not null,
  goal text not null,
  horizon text not null,
  months int not null,
  principal text not null,
  add_context boolean not null,
  expected_status text not null,
  expected_ceiling numeric
) on commit drop;

insert into hard_scenarios values
 (1 ,'AGG_GROWTH_12Y',              'high',          'growth',              '10_plus',144,'no', true, 'available',          100),
 (2 ,'AGG_RETIRE_12Y',              'high',          'retirement',          '10_plus',144,'no', true, 'available',          100),
 (3 ,'MID_GROWTH_12Y',              'mid',           'growth',              '10_plus',144,'no', true, 'available',           67),
 (4 ,'LOWT_GROWTH_12Y',             'low_tolerance', 'growth',              '10_plus',144,'no', true, 'no_suitable_options',  0),
 (5 ,'LOWT_INCOME_12Y',             'low_tolerance', 'income',              '10_plus',144,'no', true, 'available',            0),
 (6 ,'HIGH_GROWTH_7Y',              'high',          'growth',              '5_10y',    84,'no', true, 'available',           70),
 (7 ,'HIGH_GROWTH_4Y',              'high',          'growth',              '3_5y',     48,'no', true, 'available',           40),
 (8 ,'HIGH_GROWTH_2Y',              'high',          'growth',              '1_3y',     24,'no', true, 'review_required',       0),
 (9 ,'HIGH_GROWTH_12Y_PRINCIPAL',   'high',          'growth',              '10_plus',144,'yes',true, 'review_required',     100),
 (10,'LOSS_GATE',                   'loss_gate',     'growth',              '10_plus',144,'no', true, 'review_required',      39),
 (11,'RESERVE_GATE',                'reserve_gate',  'growth',              '10_plus',144,'no', true, 'review_required',      39),
 (12,'NO_CONTEXT',                  'high',          'growth',              '10_plus',144,'no', false,'context_required',    100),
 (13,'HIGH_PRESERVATION_12Y',       'high',          'wealth_preservation', '10_plus',144,'no', true, 'available',          100),
 (14,'HIGH_INCOME_12Y',             'high',          'income',              '10_plus',144,'no', true, 'available',          100),
 (15,'HIGH_EDUCATION_7Y',           'high',          'education',           '5_10y',    84,'no', true, 'available',           70);

create temp table hard_results(
  ord int primary key,
  label text not null,
  assessment_id uuid not null,
  risk_tolerance numeric,
  risk_capacity numeric,
  archetype text,
  payload jsonb not null
) on commit drop;

do $$
declare s record; aid uuid; r public.results; m jsonb;
begin
  for s in select * from hard_scenarios order by ord loop
    aid:=pg_temp.hard_make_assessment(s.mode,s.goal,s.horizon,s.months,s.principal,s.add_context);
    select * into r from public.results where assessment_id=aid order by created_at desc,id desc limit 1;
    m:=investor_private.current_match(aid);
    insert into hard_results values(s.ord,s.label,aid,r.risk_tolerance,r.risk_capacity,r.archetype,m);
  end loop;
end $$;

-- Product boundary: Match uses every active ETF and no other asset type.
do $$ declare v_view_count int; v_etf_count int;
begin
  select count(*) into v_view_count from public.v_investment_dna_v2;
  select count(*) into v_etf_count from public.investments where is_active=true and asset_type='ETF';
  if v_view_count<>v_etf_count then raise exception 'Match view count % != active ETF count %',v_view_count,v_etf_count; end if;
  if exists(select 1 from public.v_investment_dna_v2 where asset_type is distinct from 'ETF') then raise exception 'non-ETF in Match view'; end if;
  if exists(
    select 1 from hard_results h
    cross join lateral jsonb_array_elements(coalesce(h.payload->'results','[]'::jsonb)) x
    where x#>>'{explanation,investment_dna,asset_type}' is distinct from 'ETF'
  ) then raise exception 'non-ETF in Match payload'; end if;
  if exists(select 1 from hard_results where (payload->>'universe_count')::int<>v_etf_count) then raise exception 'payload universe_count is not ETF-scoped'; end if;
end $$;

-- Scenario status and expected exposure ceilings must remain explicit and stable.
do $$ declare bad text;
begin
  select string_agg(s.label||': got status='||(h.payload->>'status')||', ceiling='||(h.payload#>>'{constraints,equity_ceiling}'),'; ' order by s.ord)
  into bad
  from hard_scenarios s join hard_results h using(ord,label)
  where h.payload->>'status' is distinct from s.expected_status
     or (s.expected_ceiling is not null and (h.payload#>>'{constraints,equity_ceiling}')::numeric is distinct from s.expected_ceiling);
  if bad is not null then raise exception 'hard-scenario expectation failure: %',bad; end if;
end $$;

-- Every eligible row must actually pass the engine's documented hard limits.
do $$ declare bad text;
begin
  select string_agg(h.label||':'||(x->>'symbol'),', ' order by h.ord,x->>'symbol') into bad
  from hard_results h
  cross join lateral jsonb_array_elements(coalesce(h.payload->'results','[]'::jsonb)) x
  where x->>'eligibility'='eligible'
    and (
      (x->>'match_score')::numeric<70
      or (x#>>'{explanation,scores,official_risk_fit}')::numeric<60
      or (x#>>'{explanation,scores,goal_role_fit}')::numeric<40
      or (x#>>'{explanation,investment_dna,equity_pct}')::numeric>(h.payload#>>'{constraints,equity_ceiling}')::numeric
    );
  if bad is not null then raise exception 'eligible row violated hard limits: %',bad; end if;
end $$;

-- Review-required is a stop state: no eligible/top rows and no fabricated numeric match score.
do $$ declare bad text;
begin
  select string_agg(h.label,', ' order by h.ord) into bad
  from hard_results h
  where h.payload->>'status'='review_required'
    and (
      (h.payload->>'eligible_count')::int<>0
      or jsonb_array_length(coalesce(h.payload->'top_matches','[]'::jsonb))<>0
      or exists(
        select 1 from jsonb_array_elements(coalesce(h.payload->'results','[]'::jsonb)) x
        where x->'match_score' is not null
      )
    );
  if bad is not null then raise exception 'review-required scenario leaked ranked scores: %',bad; end if;
end $$;

-- Missing context never becomes a personalized eligible recommendation.
do $$ declare m jsonb;
begin
  select payload into m from hard_results where label='NO_CONTEXT';
  if m->>'status'<>'context_required' or (m->>'eligible_count')::int<>0 then raise exception 'missing-context state regressed'; end if;
  if exists(
    select 1 from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) x
    where x->>'eligibility' not in ('context_required','review_required')
  ) then raise exception 'missing-context payload exposed personalized eligibility'; end if;
end $$;

-- Risk/horizon monotonicity: shorter horizons may reduce, never increase, equity capacity.
do $$ declare c2 numeric; c4 numeric; c7 numeric; c12 numeric;
begin
  select (payload#>>'{constraints,equity_ceiling}')::numeric into c2 from hard_results where label='HIGH_GROWTH_2Y';
  select (payload#>>'{constraints,equity_ceiling}')::numeric into c4 from hard_results where label='HIGH_GROWTH_4Y';
  select (payload#>>'{constraints,equity_ceiling}')::numeric into c7 from hard_results where label='HIGH_GROWTH_7Y';
  select (payload#>>'{constraints,equity_ceiling}')::numeric into c12 from hard_results where label='AGG_GROWTH_12Y';
  if not (c2<=c4 and c4<=c7 and c7<=c12) then raise exception 'horizon ceilings not monotonic: %/%/%/%',c2,c4,c7,c12; end if;
end $$;

-- Low tolerance should not be force-fit to growth, while an income context may find a zero-equity ETF.
do $$ declare mg jsonb; mi jsonb;
begin
  select payload into mg from hard_results where label='LOWT_GROWTH_12Y';
  select payload into mi from hard_results where label='LOWT_INCOME_12Y';
  if mg->>'status'<>'no_suitable_options' or (mg->>'eligible_count')::int<>0 then raise exception 'low-tolerance growth was force-fit'; end if;
  if mi->>'status'<>'available' or not exists(
    select 1 from jsonb_array_elements(coalesce(mi->'results','[]'::jsonb)) x
    where x->>'eligibility'='eligible' and (x#>>'{explanation,investment_dna,equity_pct}')::numeric=0
  ) then raise exception 'low-tolerance income did not preserve a zero-equity compatible path'; end if;
end $$;

-- Explicit safety gates must surface their specific reason codes.
do $$ declare m jsonb;
begin
  select payload into m from hard_results where label='HIGH_GROWTH_2Y';
  if not (m#>'{constraints,codes}' ? 'short_horizon') then raise exception 'short_horizon code missing'; end if;
  select payload into m from hard_results where label='HIGH_GROWTH_12Y_PRINCIPAL';
  if not (m#>'{constraints,codes}' ? 'principal_protection_needed') then raise exception 'principal protection code missing'; end if;
  select payload into m from hard_results where label='LOSS_GATE';
  if not (m#>'{constraints,codes}' ? 'essential_spending_at_risk') then raise exception 'loss-impact code missing'; end if;
  select payload into m from hard_results where label='RESERVE_GATE';
  if not (m#>'{constraints,codes}' ? 'emergency_buffer_short') then raise exception 'emergency reserve code missing'; end if;
end $$;

-- Compact human-readable comparison matrix. This SELECT intentionally precedes ROLLBACK.
select
  h.ord,
  h.label,
  h.risk_tolerance,
  h.risk_capacity,
  h.archetype,
  h.payload->>'status' as status,
  (h.payload#>>'{constraints,equity_ceiling}')::numeric as equity_ceiling,
  (h.payload->>'universe_count')::int as universe_count,
  (h.payload->>'eligible_count')::int as eligible_count,
  (select count(*) from jsonb_array_elements(coalesce(h.payload->'results','[]'::jsonb)) x where x->>'eligibility'='review_required') as review_required_count,
  (select string_agg((x->>'symbol')||'='||coalesce(x->>'match_score','—'),', ' order by e.ord)
   from (
     select value as x,ordinality as ord
     from jsonb_array_elements(coalesce(h.payload->'results','[]'::jsonb)) with ordinality
     where value->>'eligibility' in ('eligible','context_required','limited')
     order by case value->>'eligibility' when 'eligible' then 0 when 'context_required' then 1 else 2 end,
              (value->>'match_score')::numeric desc nulls last,
              value->>'symbol'
     limit 5
   ) e
  ) as top5_comparison
from hard_results h
order by h.ord;

rollback;
select 'PASS: M4 Match v6 hard-stress matrix' as verification;
