create table if not exists public.investment_intelligence_profiles (
 id uuid primary key default gen_random_uuid(), investment_id uuid not null references public.investments(id) on delete cascade,
 model_version text not null default 'intelligence-v1.0',
 style_class text not null, objective_class text not null, investor_fit_class text not null,
 growth_score numeric(5,2) not null default 0, income_score numeric(5,2) not null default 0, stability_score numeric(5,2) not null default 0,
 diversification_score numeric(5,2) not null default 0, liquidity_score numeric(5,2) not null default 0,
 complexity_score numeric(5,2) not null default 0,
 ideal_investor jsonb not null default '[]', best_use_cases jsonb not null default '[]', key_tradeoffs jsonb not null default '[]',
 explanation jsonb not null default '{}', source_basis jsonb not null default '{}', as_of_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(investment_id,model_version)
);

insert into public.investment_intelligence_profiles(investment_id,style_class,objective_class,investor_fit_class,growth_score,income_score,stability_score,diversification_score,liquidity_score,complexity_score,ideal_investor,best_use_cases,key_tradeoffs,explanation,source_basis,as_of_date)
select i.id,
 case when coalesce((p.target_allocation->>'equity')::numeric,0)>=80 then 'growth' when coalesce((p.target_allocation->>'equity')::numeric,0)<=40 then 'stability_income' else 'balanced' end,
 case when coalesce((p.target_allocation->>'equity')::numeric,0)>=80 then 'long_term_growth' when coalesce((p.target_allocation->>'equity')::numeric,0)<=40 then 'capital_stability' else 'balanced_growth_income' end,
 case when s.risk_band='low' then 'conservative' when s.risk_band in ('medium','medium-high') then 'balanced' else 'aggressive' end,
 coalesce(s.growth_score,0),coalesce(s.income_score,0),100-coalesce(s.normalized_risk_score,0),coalesce(s.diversification_score,0),coalesce(s.liquidity_score,0),case when i.category ilike '%all-in-one%' then 20 else 40 end,
 case when coalesce(s.normalized_risk_score,0)>=80 then jsonb_build_array('long-term investors','growth-oriented investors') when coalesce(s.normalized_risk_score,0)<=40 then jsonb_build_array('conservative investors','income-oriented investors') else jsonb_build_array('balanced investors','long-term investors') end,
 case when coalesce(s.normalized_risk_score,0)>=80 then jsonb_build_array('long-term growth','core equity exposure') when coalesce(s.normalized_risk_score,0)<=40 then jsonb_build_array('stability','income','capital preservation') else jsonb_build_array('core portfolio','balanced exposure') end,
 jsonb_build_array('market risk','time-horizon sensitivity','fund-specific risks'),
 jsonb_build_object('style_basis','allocation and suitability profile','risk_basis',s.risk_band,'allocation',p.target_allocation,'profile_summary',p.profile_summary),
 jsonb_build_object('suitability_model',s.model_version,'profile_model',p.model_version),
 coalesce(p.as_of_date,s.as_of_date,current_date)
from public.investments i
left join lateral (select * from public.investment_profiles x where x.investment_id=i.id order by x.as_of_date desc limit 1) p on true
left join lateral (select * from public.investment_suitability_profiles_v2 x where x.investment_id=i.id order by x.as_of_date desc limit 1) s on true
where i.is_active=true
on conflict(investment_id,model_version) do update set style_class=excluded.style_class,objective_class=excluded.objective_class,investor_fit_class=excluded.investor_fit_class,growth_score=excluded.growth_score,income_score=excluded.income_score,stability_score=excluded.stability_score,diversification_score=excluded.diversification_score,liquidity_score=excluded.liquidity_score,complexity_score=excluded.complexity_score,ideal_investor=excluded.ideal_investor,best_use_cases=excluded.best_use_cases,key_tradeoffs=excluded.key_tradeoffs,explanation=excluded.explanation,source_basis=excluded.source_basis,as_of_date=excluded.as_of_date,updated_at=now();

create index if not exists investment_intelligence_style_idx on public.investment_intelligence_profiles(style_class,objective_class);

create or replace view public.v_investment_intelligence as
select d.*,ip.model_version intelligence_model_version,ip.style_class intelligence_style,ip.objective_class intelligence_objective,ip.investor_fit_class,ip.growth_score intelligence_growth_score,ip.income_score intelligence_income_score,ip.stability_score intelligence_stability_score,ip.diversification_score intelligence_diversification_score,ip.liquidity_score intelligence_liquidity_score,ip.complexity_score intelligence_complexity_score,ip.ideal_investor,ip.best_use_cases,ip.key_tradeoffs,ip.explanation intelligence_explanation
from public.v_investment_detail d left join public.investment_intelligence_profiles ip on ip.investment_id=d.id and ip.model_version='intelligence-v1.0';

create or replace function public.get_investment_intelligence(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
 select jsonb_build_object('model_version','intelligence-v1.0','assessment_id',p_assessment_id,
 'growth',coalesce((select jsonb_agg(to_jsonb(x) order by x.match_score desc) from (select m.symbol,m.name,m.match_score,i.style_class,i.growth_score,i.best_use_cases,i.key_tradeoffs from public.investment_match_results m join public.investment_intelligence_profiles i on i.investment_id=m.investment_id and i.model_version='intelligence-v1.0' where m.assessment_id=p_assessment_id and i.style_class='growth' order by m.match_score desc limit 5)x),'[]'::jsonb),
 'stability',coalesce((select jsonb_agg(to_jsonb(x) order by x.match_score desc) from (select m.symbol,m.name,m.match_score,i.style_class,i.stability_score,i.best_use_cases,i.key_tradeoffs from public.investment_match_results m join public.investment_intelligence_profiles i on i.investment_id=m.investment_id and i.model_version='intelligence-v1.0' where m.assessment_id=p_assessment_id and i.style_class='stability_income' order by m.match_score desc limit 5)x),'[]'::jsonb),
 'balanced',coalesce((select jsonb_agg(to_jsonb(x) order by x.match_score desc) from (select m.symbol,m.name,m.match_score,i.style_class,i.growth_score,i.income_score,i.best_use_cases,i.key_tradeoffs from public.investment_match_results m join public.investment_intelligence_profiles i on i.investment_id=m.investment_id and i.model_version='intelligence-v1.0' where m.assessment_id=p_assessment_id and i.style_class='balanced' order by m.match_score desc limit 5)x),'[]'::jsonb),
 'disclaimer','Investment intelligence is for discovery and comparison, not personalized investment advice.') into v;
 return v;
end;$$;
revoke all on function public.get_investment_intelligence(uuid) from public,anon,authenticated;
grant execute on function public.get_investment_intelligence(uuid) to service_role;
alter table public.investment_intelligence_profiles enable row level security;