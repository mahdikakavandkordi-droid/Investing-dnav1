create or replace function public.refresh_investment_foundation()
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_quality jsonb; v_run uuid; v_seen int;
begin
  v_run := public.start_investment_refresh('Investing DNA internal foundation','system');
  begin
    v_quality := public.refresh_investment_data_quality();
    select count(*)::int into v_seen from public.investments;
    perform public.finish_investment_refresh(v_run,'completed',v_seen,0,0,0,'Data quality recalculated; source ingestion is handled separately.');
    return jsonb_build_object('run_id',v_run,'quality_refresh',v_quality);
  exception when others then
    perform public.finish_investment_refresh(v_run,'failed',0,0,0,1,sqlerrm);
    raise;
  end;
end;
$$;