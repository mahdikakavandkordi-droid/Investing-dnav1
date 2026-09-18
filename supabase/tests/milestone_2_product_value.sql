-- Milestone 2 product-value data regression suite.
-- Read-only apart from the transaction wrapper; rolls back cleanly.
begin;

do $$ declare n int; bad int; v jsonb; v_id uuid; v_compare numeric; v_expected numeric; begin
  select count(*) into n
  from public.v_investment_screener
  where return_1y_pct is not null
    and return_3y_annualized_pct is not null
    and return_5y_annualized_pct is not null
    and mer_pct is not null
    and aum is not null;
  if n<>40 then raise exception 'Expected 40 complete performance/MER/AUM screener rows, got %',n; end if;

  select count(*) into bad
  from public.v_investment_screener s
  join public.v_investment_performance_summary p on p.investment_id=s.id
  where s.return_1y_pct is distinct from p.return_1y_pct
     or s.return_3y_annualized_pct is distinct from p.return_3y_annualized_pct
     or s.return_5y_annualized_pct is distinct from p.return_5y_annualized_pct;
  if bad<>0 then raise exception 'Screener performance diverges from canonical performance summary for % rows',bad; end if;

  select id into v_id from public.investments where symbol='VBAL' and is_active limit 1;
  v:=public.app_get_investment_research_context(v_id);
  if v is null or v#>>'{holdings,mode}'<>'fund_of_funds_structure' then raise exception 'VBAL fund-of-funds classification failed'; end if;
  if coalesce((v#>>'{holdings,weight_coverage_pct}')::numeric,0)<95 then raise exception 'VBAL holdings coverage unexpectedly low'; end if;
  if coalesce((v#>>'{holdings,known_underlying_weight_pct}')::numeric,0)<80 then raise exception 'VBAL known-underlying linkage unexpectedly low'; end if;
  if public.app_get_investment_research_context(gen_random_uuid()) is not null then raise exception 'Unknown research context should be null'; end if;

  select return_1y_pct into v_expected from public.v_investment_performance_summary where investment_id=v_id;
  select return_1y_pct into v_compare from public.app_compare_investments(array[v_id]) limit 1;
  if v_compare is distinct from v_expected then raise exception 'Compare return does not use canonical performance history'; end if;
end $$;

set local role anon;
do $$ declare v_id uuid; v jsonb; n int; begin
  select id into v_id from public.investments where symbol='VBAL' and is_active limit 1;
  v:=public.app_get_investment_research_context(v_id);
  if v#>>'{holdings,mode}'<>'fund_of_funds_structure' then raise exception 'Anonymous public research RPC failed'; end if;

  select count(*) into n
  from public.app_search_investments(p_limit=>100)
  where return_1y_pct is not null and mer_pct is not null;
  if n<>40 then raise exception 'Anonymous screener expected 40 usable rows, got %',n; end if;

  begin
    perform 1 from public.v_investment_metric_snapshot_v2 limit 1;
    raise exception 'Protected helper view unexpectedly exposed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

rollback;
select 'PASS: M2 product-value data regression suite' as verification;
