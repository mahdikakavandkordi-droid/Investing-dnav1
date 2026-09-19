-- Milestone 1: make the current match engine the single reproducible source of truth.

create or replace function investor_private.fund_universe_version()
returns jsonb
language sql
stable
set search_path=''
as $$
with snapshot as (
  select d.symbol,to_jsonb(d) as row_json,d.as_of_date
  from public.v_investment_dna_v2 d
  order by d.symbol
), agg as (
  select coalesce(jsonb_agg(row_json order by symbol),'[]'::jsonb) as rows,
         max(as_of_date) as data_as_of,
         count(*)::int as universe_count
  from snapshot
), fp as (
  select md5(rows::text) as fingerprint,data_as_of,universe_count from agg
)
select jsonb_build_object(
  'fingerprint',fingerprint,
  'data_version','fund-data-'||left(fingerprint,16),
  'data_as_of',data_as_of,
  'universe_count',universe_count
) from fp;
$$;

create or replace function investor_private.match_input_fingerprint(p_assessment_id uuid)
returns text
language sql
stable
set search_path=''
as $$
select md5(jsonb_build_object(
 'dna',(select to_jsonb(r) from public.results r where r.assessment_id=p_assessment_id order by r.created_at desc,r.id desc limit 1),
 'context',(select to_jsonb(c) from public.investment_context c where c.assessment_id=p_assessment_id),
 'answers',(select jsonb_agg(jsonb_build_array(a.question_id,a.answer_value) order by a.question_id) from public.answers a where a.assessment_id=p_assessment_id),
 'fund_universe',investor_private.fund_universe_version()
)::text);
$$;

alter table investor_private.match_runs
  add column if not exists questionnaire_version text,
  add column if not exists dna_model_version text,
  add column if not exists scoring_version text,
  add column if not exists data_version text,
  add column if not exists data_as_of date;

create or replace function investor_private.stamp_match_run_metadata()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_a public.assessments;
  v_r public.results;
  v_data jsonb;
begin
  select * into v_a from public.assessments where id=new.assessment_id;
  select * into v_r from public.results where assessment_id=new.assessment_id order by created_at desc,id desc limit 1;
  v_data:=investor_private.fund_universe_version();
  new.questionnaire_version:=v_a.questionnaire_version;
  new.dna_model_version:=v_r.model_version;
  new.scoring_version:=coalesce(v_r.scoring_version,v_a.scoring_version);
  new.data_version:=v_data->>'data_version';
  new.data_as_of:=nullif(v_data->>'data_as_of','')::date;
  new.payload:=coalesce(new.payload,'{}'::jsonb)||jsonb_build_object(
    'data_version',new.data_version,
    'data_as_of',new.data_as_of,
    'run_created_at',coalesce(new.created_at,clock_timestamp()),
    'versions',jsonb_build_object(
      'questionnaire',new.questionnaire_version,
      'investor_dna',new.dna_model_version,
      'scoring',new.scoring_version,
      'match',new.model_version,
      'fund_data',new.data_version
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_stamp_match_run_metadata on investor_private.match_runs;
create trigger trg_stamp_match_run_metadata
before insert on investor_private.match_runs
for each row execute function investor_private.stamp_match_run_metadata();

-- A review-required result is unknown/not-rankable, not a zero-quality investment.
alter table public.investment_match_results alter column match_score drop not null;

create or replace function investor_private.preserve_match_nulls()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.model_version='investment-dna-match-v6'
     and coalesce(new.rationale->>'eligibility','')='review_required' then
    new.match_score:=null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_preserve_match_nulls on public.investment_match_results;
create trigger trg_preserve_match_nulls
before insert or update on public.investment_match_results
for each row execute function investor_private.preserve_match_nulls();

-- Always return the persisted, stamped canonical run. Fund-data changes are part of the fingerprint.
create or replace function investor_private.current_match(p_assessment_id uuid)
returns jsonb
language plpgsql
set search_path=''
as $$
declare r investor_private.match_runs;
begin
  select * into r
  from investor_private.match_runs
  where assessment_id=p_assessment_id and model_version='investment-dna-match-v6'
  order by created_at desc,id desc limit 1;

  if r.id is null
     or r.input_fingerprint is distinct from investor_private.match_input_fingerprint(p_assessment_id)
     or r.created_at<now()-interval '1 day' then
    perform public.calculate_investment_match_v6(p_assessment_id);
    select * into r
    from investor_private.match_runs
    where assessment_id=p_assessment_id and model_version='investment-dna-match-v6'
    order by created_at desc,id desc limit 1;
  end if;

  if r.id is null then raise exception 'match_run_not_created'; end if;
  return r.payload;
end;
$$;

create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns jsonb
language sql
set search_path=''
as $$ select investor_private.current_match(p_assessment_id); $$;

-- Compatibility readers now consume the same v6 run instead of hard-coded legacy versions.
create or replace function public.get_explainable_match(p_assessment_id uuid,p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare m jsonb; v_matches jsonb;
begin
 if p_limit<1 or p_limit>50 then raise exception 'limit must be 1..50'; end if;
 m:=investor_private.current_match(p_assessment_id);
 select coalesce(jsonb_agg(x order by ord),'[]'::jsonb) into v_matches
 from (
   select e.value as x,e.ordinality as ord
   from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) with ordinality e(value,ordinality)
   order by e.ordinality limit p_limit
 ) s;
 return jsonb_build_object(
   'model_version',m->>'model_version','run_id',m->>'run_id','data_version',m->>'data_version','data_as_of',m->'data_as_of',
   'assessment_id',p_assessment_id,'status',m->>'status','confidence',m->>'confidence','constraints',m->'constraints',
   'matches',v_matches,'versions',m->'versions',
   'disclaimer','Compatibility signals for discovery and comparison only; not investment advice.'
 );
end;
$$;

create or replace function public.get_investment_match_intelligence(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare m jsonb; v_best jsonb; v_growth jsonb; v_stable jsonb; v_income jsonb; v_alt jsonb;
begin
 m:=investor_private.current_match(p_assessment_id);
 select x into v_best from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) x where x->>'eligibility'='eligible' order by (x->>'match_score')::numeric desc nulls last,x->>'symbol' limit 1;
 select x into v_growth from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) x where x->>'eligibility'='eligible' and x#>>'{explanation,investment_dna,style_class}'='growth' order by (x->>'match_score')::numeric desc nulls last limit 1;
 select x into v_stable from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) x where x->>'eligibility'='eligible' and x#>>'{explanation,investment_dna,style_class}' in ('stability_income','balanced') order by (x->>'match_score')::numeric desc nulls last limit 1;
 select x into v_income from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) x where x->>'eligibility'='eligible' and x#>>'{explanation,investment_dna,style_class}'='stability_income' order by (x->>'match_score')::numeric desc nulls last limit 1;
 select coalesce(jsonb_agg(x order by (x->>'match_score')::numeric desc nulls last),'[]'::jsonb) into v_alt
 from jsonb_array_elements(coalesce(m->'results','[]'::jsonb)) x where x->>'eligibility'='eligible' and (v_best is null or x->>'investment_id' is distinct from v_best->>'investment_id');
 return jsonb_build_object(
   'model_version',m->>'model_version','run_id',m->>'run_id','data_version',m->>'data_version','data_as_of',m->'data_as_of',
   'assessment_id',p_assessment_id,'status',m->>'status','universe_count',m->'universe_count','eligible_count',m->'eligible_count',
   'best_match',v_best,'best_for_growth',v_growth,'best_for_stability',v_stable,'best_for_income',v_income,'alternatives',v_alt,'versions',m->'versions',
   'disclaimer','These are compatibility signals for discovery and comparison, not personalized investment advice.'
 );
end;
$$;

create or replace function public.capture_current_match_snapshot(p_assessment_id uuid)
returns uuid
language plpgsql
security definer
set search_path='public','auth','extensions'
as $$
declare v_profile uuid; v_id uuid; v_snapshot jsonb; v_model text;
begin
 select profile_id into v_profile from public.assessments where id=p_assessment_id;
 if v_profile is null then raise exception 'assessment_profile_required'; end if;
 if auth.uid() is not null and not public.is_current_profile(v_profile) then raise exception 'not_owner'; end if;
 select public.get_investment_recommendations(p_assessment_id,10) into v_snapshot;
 v_model:=coalesce(v_snapshot->>'model_version','investment-dna-match-v6');
 insert into public.investor_match_snapshots(profile_id,assessment_id,model_version,snapshot)
 values(v_profile,p_assessment_id,v_model,coalesce(v_snapshot,'{}'::jsonb)) returning id into v_id;
 return v_id;
end;
$$;

create or replace function public.cleanup_match_result_versions(p_assessment_id uuid,p_keep_model_version text default 'investment-dna-match-v6')
returns integer
language plpgsql
security definer
set search_path='public'
as $$
declare v_deleted integer;
begin
 if p_keep_model_version is distinct from 'investment-dna-match-v6' then raise exception 'only_current_match_model_can_be_kept'; end if;
 delete from public.investment_match_results where assessment_id=p_assessment_id and model_version<>p_keep_model_version;
 get diagnostics v_deleted=row_count;
 return v_deleted;
end;
$$;

-- Historical engines remain for reproducibility, but browsers cannot invoke them.
revoke execute on function public.calculate_investment_match_v3(uuid) from public,anon,authenticated;
revoke execute on function public.calculate_investment_match_v4(uuid) from public,anon,authenticated;
revoke execute on function public.calculate_investment_match_v5(uuid) from public,anon,authenticated;
revoke execute on function public.calculate_investment_match_v51(uuid) from public,anon,authenticated;
revoke execute on function public.calculate_investment_match_v6(uuid) from public,anon,authenticated;
revoke execute on function public.calculate_investment_match(uuid) from public,anon,authenticated;
revoke execute on function public.get_explainable_match(uuid,integer) from public,anon,authenticated;
revoke execute on function public.get_investment_match_intelligence(uuid) from public,anon,authenticated;
revoke execute on function public.cleanup_match_result_versions(uuid,text) from public,anon,authenticated;
revoke execute on function public.capture_current_match_snapshot(uuid) from public,anon,authenticated;
