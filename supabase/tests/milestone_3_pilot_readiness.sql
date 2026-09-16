-- Milestone 3 pilot/launch-readiness regression. All mutations roll back.
begin;

do $$ declare sid uuid:=gen_random_uuid(); vid uuid:=gen_random_uuid(); n int; begin
  insert into public.pilot_product_events(browser_session_id,visitor_id,event_name,route,metadata)
  values(sid,vid,'app_session_started','/',jsonb_build_object('returning',false));
  insert into public.pilot_feedback(browser_session_id,visitor_id,ease_score,trust_score,usefulness_score,understood_match,would_return,open_feedback)
  values(sid,vid,4,4,5,true,true,'synthetic rollback test');
  select count(*) into n from public.pilot_product_events where browser_session_id=sid;
  if n<>1 then raise exception 'Expected one synthetic event, got %',n; end if;
  select count(*) into n from public.pilot_feedback where browser_session_id=sid;
  if n<>1 then raise exception 'Expected one synthetic feedback row, got %',n; end if;

  begin
    insert into public.pilot_product_events(browser_session_id,visitor_id,event_name) values(gen_random_uuid(),gen_random_uuid(),'not_allowed');
    raise exception 'Invalid event_name unexpectedly accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.pilot_feedback(browser_session_id,visitor_id,ease_score,trust_score,usefulness_score,understood_match,would_return)
    values(gen_random_uuid(),gen_random_uuid(),6,4,4,true,true);
    raise exception 'Invalid feedback score unexpectedly accepted';
  exception when check_violation then null;
  end;
end $$;

set local role anon;
do $$ begin
  begin
    perform 1 from public.pilot_product_events limit 1;
    raise exception 'anon unexpectedly read pilot_product_events';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.pilot_product_events(browser_session_id,visitor_id,event_name) values(gen_random_uuid(),gen_random_uuid(),'app_session_started');
    raise exception 'anon unexpectedly inserted pilot_product_events';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.pilot_feedback limit 1;
    raise exception 'anon unexpectedly read pilot_feedback';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;
select 'PASS: M3 pilot analytics privacy and constraints' as verification;
