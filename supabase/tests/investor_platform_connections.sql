-- Runs against an existing schema. Every fixture and mutation is rolled back.
begin;
select set_config('test.user_a',gen_random_uuid()::text,true),set_config('test.user_b',gen_random_uuid()::text,true);
select set_config('test.fund',(select id::text from public.v_investment_screener limit 1),true);
insert into auth.users(id,aud,role,email)
select current_setting('test.user_a')::uuid,'authenticated','authenticated','qa-a-'||current_setting('test.user_a')||'@example.invalid'
union all select current_setting('test.user_b')::uuid,'authenticated','authenticated','qa-b-'||current_setting('test.user_b')||'@example.invalid';
set local role anon;
do $$ begin
 if public.app_get_investment(current_setting('test.fund')::uuid)->>'id' is distinct from current_setting('test.fund') then raise exception 'Public detail failed'; end if;
 if public.app_get_investment(gen_random_uuid()) is not null then raise exception 'Unknown fund should be null'; end if;
 begin perform public.app_watchlist(); raise exception 'Anonymous watchlist unexpectedly allowed'; exception when insufficient_privilege then null; end;
 begin perform public.app_investment_fit(current_setting('test.fund')::uuid); raise exception 'Anonymous fit unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
do $$ begin
 begin perform public.app_watchlist(); raise exception 'Missing identity unexpectedly allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$ declare v jsonb; begin
 perform public.app_watchlist('add',current_setting('test.fund')::uuid);
 perform public.app_watchlist('add',current_setting('test.fund')::uuid);
 v:=public.app_watchlist('list');
 if jsonb_array_length(v->'items')<>1 then raise exception 'Duplicate or missing saved fund'; end if;
 if v->'items'->0->>'investment_id' is distinct from current_setting('test.fund') then raise exception 'Wrong saved fund'; end if;
 if public.app_investment_fit(current_setting('test.fund')::uuid)->>'status'<>'no_dna' then raise exception 'New account has unexpected DNA'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
do $$ begin
 if jsonb_array_length(public.app_watchlist('list')->'items')<>0 then raise exception 'Account B can see A saved funds'; end if;
 if (public.app_watchlist('remove',current_setting('test.fund')::uuid)->>'removed')::boolean then raise exception 'Account B removed A saved fund'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$ begin
 if jsonb_array_length(public.app_watchlist('list')->'items')<>1 then raise exception 'Account A saved fund lost'; end if;
 if not (public.app_watchlist('remove',current_setting('test.fund')::uuid)->>'removed')::boolean then raise exception 'Removal failed'; end if;
 if jsonb_array_length(public.app_watchlist('list')->'items')<>0 then raise exception 'Removed item remains'; end if;
 begin perform public.app_watchlist('add',gen_random_uuid()); raise exception 'Unknown investment accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.add_to_watchlist(null,null,null); raise exception 'Internal RPC unexpectedly exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
-- A synthetic match verifies positive fit lookup without using a customer's data.
select set_config('test.assessment',gen_random_uuid()::text,true);
insert into public.assessments(id,profile_id,status,completed_at)
select current_setting('test.assessment')::uuid,id,'completed',now() from public.profiles where user_id=current_setting('test.user_a')::uuid;
insert into public.investor_profiles(profile_id,latest_assessment_id)
select id,current_setting('test.assessment')::uuid from public.profiles where user_id=current_setting('test.user_a')::uuid;
insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score)
values(current_setting('test.assessment')::uuid,current_setting('test.fund')::uuid,'qa-rollback-only',82);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$ declare v jsonb; begin
 v:=public.app_investment_fit(current_setting('test.fund')::uuid);
 if v->>'status'<>'available' or (v->'fit'->>'match_score')::numeric<>82 then raise exception 'Own DNA fit lookup failed'; end if;
 begin perform 1 from public.v_investment_match_ranked limit 1; raise exception 'Raw match view exposed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
do $$ begin
 if public.app_investment_fit(current_setting('test.fund')::uuid)->>'status'<>'no_dna' then raise exception 'Account B can see A DNA fit'; end if;
end $$;
reset role;
rollback;
select 'PASS: public detail, unknown fund, anonymous denial, identity check, duplicate add, cross-account isolation, remove, internal RPC denied, positive fit, private fit isolation, raw view denied; fixtures rolled back' as verification;
