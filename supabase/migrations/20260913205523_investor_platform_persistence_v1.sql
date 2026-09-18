-- Investor Platform Persistence v1
-- Anonymous discovery remains possible; authenticated users get a durable Investor Identity.

create or replace function public.get_or_create_current_profile()
returns public.profiles
language plpgsql
security definer
set search_path=public,auth,extensions
as $$
declare v_profile public.profiles;
 v_user auth.users;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_profile from public.profiles where user_id=auth.uid() limit 1;
 if v_profile.id is not null then return v_profile; end if;
 select * into v_user from auth.users where id=auth.uid();
 insert into public.profiles(user_id,first_name,created_at,updated_at)
 values(auth.uid(),coalesce(v_user.raw_user_meta_data->>'first_name',null),now(),now())
 returning * into v_profile;
 return v_profile;
end; $$;

revoke all on function public.get_or_create_current_profile() from public,anon;
grant execute on function public.get_or_create_current_profile() to authenticated;

-- Promote an authenticated assessment to the user's durable DNA identity.
create or replace function public.promote_assessment_to_current_dna(p_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,auth,extensions
as $$
declare v_a public.assessments; v_p public.profiles; v_r public.results; v_ip public.investor_profiles; v_s public.investor_profile_snapshots; v_f public.fingerprint_profiles;
begin
 select * into v_a from public.assessments where id=p_assessment_id;
 if v_a.id is null then raise exception 'assessment_not_found'; end if;
 if v_a.profile_id is null then raise exception 'assessment_profile_required'; end if;
 select * into v_p from public.profiles where id=v_a.profile_id;
 if v_p.id is null then raise exception 'profile_not_found'; end if;
 if auth.uid() is null or v_p.user_id is distinct from auth.uid() then raise exception 'not_owner'; end if;
 if v_a.status <> 'completed' then raise exception 'assessment_not_completed'; end if;
 select * into v_r from public.results where assessment_id=p_assessment_id order by created_at desc,id desc limit 1;
 if v_r.id is null then raise exception 'dna_result_not_found'; end if;
 select * into v_f from public.fingerprint_profiles where assessment_id=p_assessment_id order by created_at desc,id desc limit 1;
 update public.assessments set is_current=false where profile_id=v_p.id and id<>p_assessment_id and is_current=true;
 update public.assessments set is_current=true where id=p_assessment_id;
 insert into public.investor_profiles(profile_id,latest_assessment_id,display_name,created_at,updated_at)
 values(v_p.id,p_assessment_id,coalesce(v_p.first_name,v_r.archetype),now(),now())
 on conflict(profile_id) do update set latest_assessment_id=excluded.latest_assessment_id,updated_at=now()
 returning * into v_ip;
 insert into public.investor_profile_snapshots(investor_profile_id,assessment_id,model_version,archetype,risk_tolerance,risk_capacity,fingerprint_code,decision_style,pressure_style,behavioral_profile,strengths,watchouts,narrative)
 values(v_ip.id,p_assessment_id,v_r.model_version,v_r.archetype,v_r.risk_tolerance,v_r.risk_capacity,v_f.fingerprint_code,v_f.decision_style,v_f.pressure_style,v_r.behavioral_profile,v_f.strengths,v_f.watchouts,v_r.narrative)
 on conflict do nothing returning * into v_s;
 return jsonb_build_object('profile_id',v_p.id,'assessment_id',p_assessment_id,'investor_profile_id',v_ip.id,'is_current',true,'snapshot_id',v_s.id,'model_version',v_r.model_version);
end; $$;

revoke all on function public.promote_assessment_to_current_dna(uuid) from public,anon;
grant execute on function public.promote_assessment_to_current_dna(uuid) to authenticated;

-- Current user state is the platform home contract.
create or replace function public.get_current_investor_app_state()
returns jsonb
language plpgsql
security definer
set search_path=public,auth,extensions
as $$
declare v_profile public.profiles; v_ip public.investor_profiles; v_report jsonb; v_matches jsonb; v_portfolios jsonb;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into v_profile from public.profiles where user_id=auth.uid() limit 1;
 if v_profile.id is null then
   return jsonb_build_object('authenticated',true,'has_profile',false,'dna',null,'report',null,'matches',null,'portfolios',null);
 end if;
 select * into v_ip from public.investor_profiles where profile_id=v_profile.id limit 1;
 if v_ip.id is null or v_ip.latest_assessment_id is null then
   return jsonb_build_object('authenticated',true,'has_profile',true,'profile_id',v_profile.id,'dna',null,'report',null,'matches',null,'portfolios',null);
 end if;
 select rs.report into v_report from public.report_snapshots rs where rs.assessment_id=v_ip.latest_assessment_id order by rs.created_at desc limit 1;
 select public.get_investment_recommendations(v_ip.latest_assessment_id,10) into v_matches;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.overall_fit_score desc),'[]'::jsonb) into v_portfolios from public.investment_portfolio_blueprints x where x.assessment_id=v_ip.latest_assessment_id;
 return jsonb_build_object('authenticated',true,'has_profile',true,'profile_id',v_profile.id,'investor_profile_id',v_ip.id,'assessment_id',v_ip.latest_assessment_id,'dna',(select to_jsonb(d) from public.v_current_investor_dna d where d.investor_profile_id=v_ip.id limit 1),'report',coalesce(v_report,'{}'::jsonb),'matches',coalesce(v_matches,'{}'::jsonb),'portfolios',v_portfolios);
end; $$;

revoke all on function public.get_current_investor_app_state() from public,anon;
grant execute on function public.get_current_investor_app_state() to authenticated;
