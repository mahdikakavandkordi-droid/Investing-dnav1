create table if not exists public.portfolio_risk_analysis (
 id uuid primary key default gen_random_uuid(),
 blueprint_id uuid not null references public.investment_portfolio_blueprints(id) on delete cascade,
 model_version text not null default 'portfolio-risk-v1.0',
 analyzed_at timestamptz not null default now(),
 allocation_count integer not null default 0,
 lookthrough_coverage_pct numeric not null default 0,
 unique_underlying_count integer not null default 0,
 top10_concentration_pct numeric not null default 0,
 pairwise_overlap_pct numeric not null default 0,
 overlap_penalty numeric not null default 0,
 diversification_score numeric not null default 0,
 risk_quality text not null default 'limited',
 risk_notes jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 unique(blueprint_id,model_version)
);

create index if not exists portfolio_risk_analysis_blueprint_idx on public.portfolio_risk_analysis(blueprint_id);

alter table public.portfolio_risk_analysis enable row level security;

create or replace function public.calculate_portfolio_risk_overlap(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  bp record;
  a record;
  b record;
  inv_id_a uuid;
  inv_id_b uuid;
  latest_a date;
  latest_b date;
  total_overlap numeric := 0;
  pair_count integer := 0;
  unique_count integer := 0;
  top10 numeric := 0;
  coverage numeric := 0;
  score numeric := 100;
  notes jsonb := '[]'::jsonb;
  arr jsonb;
  w_a numeric;
  w_b numeric;
  overlap numeric;
  alloc_count integer := 0;
  latest_total integer := 0;
  latest_with_holdings integer := 0;
begin
  if p_assessment_id is null then raise exception 'assessment_id is required'; end if;

  for bp in select * from public.investment_portfolio_blueprints where assessment_id=p_assessment_id loop
    arr := case when jsonb_typeof(bp.allocations::jsonb)='array' then bp.allocations::jsonb else '[]'::jsonb end;
    alloc_count := jsonb_array_length(arr);
    total_overlap := 0; pair_count := 0; unique_count := 0; top10 := 0; coverage := 0; score := 100; notes := '[]'::jsonb;

    select count(*) into latest_total from jsonb_array_elements(arr);
    select count(*) into latest_with_holdings
      from jsonb_array_elements(arr) x
      where exists (select 1 from public.investments i join public.investment_holdings h on h.investment_id=i.id where i.symbol=x->>'symbol');
    coverage := case when latest_total=0 then 0 else round(100.0*latest_with_holdings/latest_total,2) end;

    select coalesce(sum(least(coalesce(x.weight_pct,0),100)),0), count(distinct x.holding_symbol)
      into top10, unique_count
      from (
        select h.holding_symbol, h.weight_pct
        from jsonb_array_elements(arr) x
        join public.investments i on i.symbol=x->>'symbol'
        join lateral (select h.* from public.investment_holdings h where h.investment_id=i.id order by h.as_of_date desc, h.weight_pct desc limit 10) h on true
        order by h.weight_pct desc limit 10
      ) x;
    top10 := round(top10,2);

    for a in select x->>'symbol' symbol, (x->>'weight_pct')::numeric portfolio_weight from jsonb_array_elements(arr) x loop
      for b in select y->>'symbol' symbol, (y->>'weight_pct')::numeric portfolio_weight from jsonb_array_elements(arr) y where y->>'symbol' > a.symbol loop
        select i1.id,i2.id into inv_id_a,inv_id_b from public.investments i1, public.investments i2 where i1.symbol=a.symbol and i2.symbol=b.symbol limit 1;
        if inv_id_a is not null and inv_id_b is not null then
          select max(as_of_date) into latest_a from public.investment_holdings where investment_id=inv_id_a;
          select max(as_of_date) into latest_b from public.investment_holdings where investment_id=inv_id_b;
          if latest_a is not null and latest_b is not null then
            select coalesce(sum(least(ha.weight_pct,hb.weight_pct)),0) into overlap
            from public.investment_holdings ha join public.investment_holdings hb on hb.holding_symbol=ha.holding_symbol
            where ha.investment_id=inv_id_a and hb.investment_id=inv_id_b and ha.as_of_date=latest_a and hb.as_of_date=latest_b;
            overlap := round((overlap * a.portfolio_weight/100 * b.portfolio_weight/100),2);
            total_overlap := total_overlap + overlap;
            pair_count := pair_count + 1;
          end if;
        end if;
      end loop;
    end loop;

    total_overlap := round(total_overlap,2);
    score := greatest(0,least(100,100-total_overlap*2));
    if coverage < 100 then notes := notes || jsonb_build_array('Look-through coverage is incomplete; overlap reflects only holdings currently loaded in the data layer.'); score := least(score,85); end if;
    if pair_count=0 and alloc_count>1 then notes := notes || jsonb_build_array('No comparable holding-level overlap was measurable for the selected allocation pairs.'); end if;
    if total_overlap >= 10 then notes := notes || jsonb_build_array('Meaningful duplicate underlying exposure detected.'); end if;
    if total_overlap < 5 and alloc_count>1 then notes := notes || jsonb_build_array('No material duplicate exposure detected in the currently available holdings.'); end if;

    insert into public.portfolio_risk_analysis(blueprint_id,model_version,allocation_count,lookthrough_coverage_pct,unique_underlying_count,top10_concentration_pct,pairwise_overlap_pct,overlap_penalty,diversification_score,risk_quality,risk_notes,analyzed_at)
    values(bp.id,'portfolio-risk-v1.0',alloc_count,coverage,unique_count,top10,total_overlap,total_overlap*2,round(score,2),case when coverage=100 and pair_count>0 then 'measured' else 'limited' end,notes,now())
    on conflict(blueprint_id,model_version) do update set analyzed_at=excluded.analyzed_at,allocation_count=excluded.allocation_count,lookthrough_coverage_pct=excluded.lookthrough_coverage_pct,unique_underlying_count=excluded.unique_underlying_count,top10_concentration_pct=excluded.top10_concentration_pct,pairwise_overlap_pct=excluded.pairwise_overlap_pct,overlap_penalty=excluded.overlap_penalty,diversification_score=excluded.diversification_score,risk_quality=excluded.risk_quality,risk_notes=excluded.risk_notes;
  end loop;

  return jsonb_build_object('assessment_id',p_assessment_id,'model_version','portfolio-risk-v1.0','analyses',(select coalesce(jsonb_agg(to_jsonb(r) order by r.diversification_score desc),'[]'::jsonb) from public.portfolio_risk_analysis r join public.investment_portfolio_blueprints bp on bp.id=r.blueprint_id where bp.assessment_id=p_assessment_id and r.model_version='portfolio-risk-v1.0'));
end;
$$;

revoke all on function public.calculate_portfolio_risk_overlap(uuid) from public, anon, authenticated;
grant execute on function public.calculate_portfolio_risk_overlap(uuid) to service_role;
