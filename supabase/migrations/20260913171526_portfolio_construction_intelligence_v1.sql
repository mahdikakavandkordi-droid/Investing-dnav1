create table if not exists public.investment_portfolio_blueprints (
 id uuid primary key default gen_random_uuid(),
 assessment_id uuid not null references public.assessments(id) on delete cascade,
 model_version text not null,
 blueprint_type text not null,
 title text not null,
 summary text not null,
 target_equity_pct numeric(5,2),
 target_fixed_income_pct numeric(5,2),
 diversification_score numeric(5,2),
 context_fit_score numeric(5,2),
 overall_fit_score numeric(5,2),
 allocations jsonb not null default '[]'::jsonb,
 rationale jsonb not null default '{}'::jsonb,
 disclaimer text not null,
 created_at timestamptz not null default now(),
 unique(assessment_id,model_version,blueprint_type)
);
create index if not exists investment_portfolio_blueprints_assessment_idx on public.investment_portfolio_blueprints(assessment_id,created_at desc);
alter table public.investment_portfolio_blueprints enable row level security;

create or replace function public.generate_portfolio_blueprints(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path=public,extensions as $$
declare r record; c record; v_model text:='portfolio-v1.0'; v_target numeric; v_stable jsonb; v_balanced jsonb; v_growth jsonb; v_best jsonb; v_id uuid; v_context_score numeric:=70; v_div numeric:=90; v_summary text;
begin
 select * into r from results where assessment_id=p_assessment_id and risk_tolerance is not null and risk_capacity is not null order by created_at desc limit 1; if not found then raise exception 'dna_result_not_found'; end if;
 select * into c from investment_context where assessment_id=p_assessment_id order by updated_at desc limit 1;
 v_target:=greatest(0,least(100,r.risk_tolerance*.60+r.risk_capacity*.40));
 if c.id is not null then v_context_score:=100; end if;
 delete from investment_portfolio_blueprints where assessment_id=p_assessment_id and model_version=v_model;
 select jsonb_agg(jsonb_build_object('symbol',symbol,'weight_pct',weight_pct,'role',role)) into v_stable from (values ('ZAG',70,'Core fixed income'),('VCNS',30,'Conservative multi-asset')) x(symbol,weight_pct,role);
 select jsonb_agg(jsonb_build_object('symbol',symbol,'weight_pct',weight_pct,'role',role)) into v_balanced from (values ('VBAL',60,'Balanced core'),('ZAG',40,'Fixed-income ballast')) x(symbol,weight_pct,role);
 select jsonb_agg(jsonb_build_object('symbol',symbol,'weight_pct',weight_pct,'role',role)) into v_growth from (values ('VGRO',80,'Growth core'),('ZAG',20,'Fixed-income ballast')) x(symbol,weight_pct,role);
 insert into investment_portfolio_blueprints(assessment_id,model_version,blueprint_type,title,summary,target_equity_pct,target_fixed_income_pct,diversification_score,context_fit_score,overall_fit_score,allocations,rationale,disclaimer)
 values
 (p_assessment_id,v_model,'stability','Stability Blueprint','A stability-oriented reference mix emphasizing lower equity exposure.',30,70,88,v_context_score,round(greatest(0,least(100,80-abs(v_target-30)*.45)),2),v_stable,jsonb_build_object('design','Lower-equity reference','dna_target_equity',round(v_target,2),'note','Reference construction, not a personalized recommendation.'),'Compatibility framework only; not investment advice.'),
 (p_assessment_id,v_model,'balanced','Balanced Blueprint','A balanced reference mix designed around a moderate equity/fixed-income structure.',60,40,94,v_context_score,round(greatest(0,least(100,92-abs(v_target-60)*.45)),2),v_balanced,jsonb_build_object('design','Balanced core','dna_target_equity',round(v_target,2),'note','Reference construction, not a personalized recommendation.'),'Compatibility framework only; not investment advice.'),
 (p_assessment_id,v_model,'growth','Growth Blueprint','A growth-oriented reference mix with a larger equity allocation and a bond ballast.',80,20,90,v_context_score,round(greatest(0,least(100,84-abs(v_target-80)*.45)),2),v_growth,jsonb_build_object('design','Growth core','dna_target_equity',round(v_target,2),'note','Reference construction, not a personalized recommendation.'),'Compatibility framework only; not investment advice.');
 return jsonb_build_object('model_version',v_model,'assessment_id',p_assessment_id,'dna_target_equity_pct',round(v_target,2),'count',3,'blueprints',jsonb_build_object('stability',v_stable,'balanced',v_balanced,'growth',v_growth),'disclaimer','Reference portfolio blueprints for discovery and education; not personalized investment advice.');
end; $$;
revoke all on function public.generate_portfolio_blueprints(uuid) from public,anon,authenticated; grant execute on function public.generate_portfolio_blueprints(uuid) to service_role;