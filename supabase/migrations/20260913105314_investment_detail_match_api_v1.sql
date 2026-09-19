create or replace view public.v_investment_detail as
select c.*, q.overall_status as data_quality_status, q.quality_score as data_quality_score,
 q.latest_metric_date as quality_metrics_date, q.latest_price_date as quality_price_date,
 q.latest_risk_date as quality_risk_date, q.latest_holdings_date as quality_holdings_date
from public.v_investment_catalog c
left join lateral (select * from public.v_investment_data_quality q where q.id=c.id limit 1) q on true;

create table if not exists public.investment_match_results (
 id uuid primary key default gen_random_uuid(),
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 investment_id uuid not null references public.investments(id) on delete cascade,
 model_version text not null,
 match_score numeric(5,2) not null check(match_score between 0 and 100),
 risk_tolerance_fit numeric(5,2), risk_capacity_fit numeric(5,2),
 risk_band text,
 rationale jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(assessment_id,investment_id,model_version)
);
create index if not exists investment_match_results_assessment_idx on public.investment_match_results(assessment_id,match_score desc);

create or replace function public.calculate_investment_match(p_assessment_id uuid)
returns setof public.investment_match_results language plpgsql security definer set search_path=public as $$
declare rt numeric; rc numeric; v text := 'suitability-v1.1';
begin
 select risk_tolerance,risk_capacity into rt,rc from public.results where assessment_id=p_assessment_id order by created_at desc limit 1;
 if rt is null or rc is null then raise exception 'Completed DNA result required'; end if;
 delete from public.investment_match_results where assessment_id=p_assessment_id and model_version=v;
 insert into public.investment_match_results(assessment_id,investment_id,model_version,match_score,risk_tolerance_fit,risk_capacity_fit,risk_band,rationale)
 select p_assessment_id,c.id,v,
 round((100-(abs(rt-case when lower(coalesce(c.risk_level,'')) like '%low%' then 25 when lower(coalesce(c.risk_level,'')) like '%medium-high%' then 80 when lower(coalesce(c.risk_level,'')) like '%high%' then 90 else 55 end)*0.7 + abs(rc-case when lower(coalesce(c.risk_level,'')) like '%low%' then 25 when lower(coalesce(c.risk_level,'')) like '%medium-high%' then 80 when lower(coalesce(c.risk_level,'')) like '%high%' then 90 else 55 end)*0.3))::numeric,2),
 round((100-abs(rt-case when lower(coalesce(c.risk_level,'')) like '%low%' then 25 when lower(coalesce(c.risk_level,'')) like '%medium-high%' then 80 when lower(coalesce(c.risk_level,'')) like '%high%' then 90 else 55 end))::numeric,2),
 round((100-abs(rc-case when lower(coalesce(c.risk_level,'')) like '%low%' then 25 when lower(coalesce(c.risk_level,'')) like '%medium-high%' then 80 when lower(coalesce(c.risk_level,'')) like '%high%' then 90 else 55 end))::numeric,2),
 c.risk_level,
 jsonb_build_object('model','risk_alignment','note','Compatibility signal only; not investment advice or a recommendation.')
 from public.v_investment_catalog c
 where c.data_status in ('verified','verified_partial') and c.risk_level is not null;
 return query select * from public.investment_match_results where assessment_id=p_assessment_id and model_version=v order by match_score desc;
end; $$;
revoke all on function public.calculate_investment_match(uuid) from public;
grant execute on function public.calculate_investment_match(uuid) to service_role;
