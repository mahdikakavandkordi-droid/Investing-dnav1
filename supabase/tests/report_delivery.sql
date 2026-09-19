begin;

do $$
declare
  v_count integer;
begin
  if has_table_privilege('anon','public.report_delivery_events','SELECT')
     or has_table_privilege('anon','public.report_delivery_events','INSERT')
     or has_table_privilege('authenticated','public.report_delivery_events','SELECT')
     or has_table_privilege('authenticated','public.report_delivery_events','INSERT')
  then
    raise exception 'report delivery audit must remain service-only';
  end if;

  select count(*) into v_count
  from information_schema.columns
  where table_schema='public'
    and table_name='report_delivery_events'
    and column_name in ('email','email_address','recipient_email');

  if v_count <> 0 then
    raise exception 'report delivery audit must not persist raw recipient email';
  end if;

  select count(*) into v_count
  from information_schema.columns
  where table_schema='public'
    and table_name='report_delivery_events'
    and column_name in ('assessment_id','email_hash','provider','status','created_at');

  if v_count <> 5 then
    raise exception 'report delivery audit contract is incomplete';
  end if;
end $$;

rollback;

select 'PASS: report delivery audit is service-only and stores no raw email' as result;
