do $do$
declare d text;
begin
  select pg_get_functiondef(p.oid) into d
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='calculate_investment_match_v51'
  limit 1;
  d:=replace(d,'v_total:=least(v_total,79);','v_total:=v_total*.79;');
  execute d;
end
$do$;