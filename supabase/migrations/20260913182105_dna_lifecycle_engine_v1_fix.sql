begin;

alter table public.assessments add column if not exists is_current boolean not null default false;
create index if not exists assessments_profile_created_idx on public.assessments(profile_id, created_at desc);
create index if not exists assessments_profile_current_idx on public.assessments(profile_id, is_current) where is_current = true;
create unique index if not exists assessments_one_current_per_profile_uidx on public.assessments(profile_id) where is_current = true and profile_id is not null;
create unique index if not exists investor_profiles_profile_uidx on public.investor_profiles(profile_id);

create or replace function public.promote_assessment_to_current_dna(p_assessment_id uuid)
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_a public.assessments; v_p public.profiles; v_r public.results; v_ip public.investor_profiles; v_s public.investor_profile_snapshots;
begin
 select * into v_a from public.assessments where id=p_assessment_id;
 if v_a.id is null then raise exception 'assessment_not_found'; end if;
 if v_a.profile_id is null then raise exception 'assessment_profile_required'; end if;
 select * into v_p from public.profiles where id=v_a.profile_id;
 if v_p.id is null then raise exception 'profile_not_found'; end if;
 if auth.uid() is not null and v_p.user_id is distinct from auth.uid() then raise exception 'not_owner'; end if;
 if v_a.status <> 'completed' then raise exception 'assessment_not_completed'; end if;
 select * into v_r from public.results where assessment_id=p_assessment_id order by created_at desc,id desc limit 1;
 if v_r.id is null then raise exception 'dna_result_not_found'; end if;
 update public.assessments set is_current=false where profile_id=v_p.id and id<>p_assessment_id and is_current=true;
 update public.assessments set is_current=true where id=p_assessment_id;
 insert into public.investor_profiles(profile_id,latest_assessment_id,display_name,created_at,updated_at)
 values(v_p.id,p_assessment_id,coalesce(v_p.first_name,v_r.archetype),now(),now())
 on conflict(profile_id) do update set latest_assessment_id=excluded.latest_assessment_id,display_name=coalesce(excluded.display_name,public.investor_profiles.display_name),updated_at=now()
 returning * into v_ip;
 insert into public.investor_profile_snapshots(investor_profile_id,assessment_id,model_version,archetype,risk_tolerance,risk_capacity,fingerprint_code,decision_style,pressure_style,behavioral_profile,strengths,watchouts,narrative)
 select v_ip.id,p_assessment_id,v_r.model_version,v_r.archetype,v_r.risk_tolerance,v_r.risk_capacity,f.fingerprint_code,f.decision_style,f.pressure_style,v_r.behavioral_profile,f.strengths,f.watchouts,v_r.narrative
 from lateral(select fingerprint_code,decision_style,pressure_style,strengths,watchouts from public.fingerprint_profiles where assessment_id=p_assessment_id order by created_at desc limit 1) f
 on conflict do nothing returning * into v_s;
 return jsonb_build_object('profile_id',v_p.id,'assessment_id',p_assessment_id,'investor_profile_id',v_ip.id,'is_current',true,'snapshot_id',v_s.id,'model_version',v_r.model_version);
end; $$;
revoke all on function public.promote_assessment_to_current_dna(uuid) from public,anon,authenticated;
grant execute on function public.promote_assessment_to_current_dna(uuid) to authenticated;

create or replace view public.v_current_investor_dna as
select ip.id investor_profile_id,ip.profile_id,ip.latest_assessment_id,ip.display_name,a.questionnaire_version,a.model_version assessment_model_version,a.completed_at,r.model_version dna_model_version,r.risk_tolerance,r.risk_capacity,r.archetype,f.fingerprint_code,f.decision_style,f.pressure_style,r.behavioral_profile,f.strengths,f.watchouts,r.narrative
from public.investor_profiles ip join public.profiles p on p.id=ip.profile_id join public.assessments a on a.id=ip.latest_assessment_id and a.is_current=true
join lateral(select * from public.results r0 where r0.assessment_id=a.id order by r0.created_at desc,r0.id desc limit 1) r on true
left join lateral(select fingerprint_code,decision_style,pressure_style,strengths,watchouts from public.fingerprint_profiles f0 where f0.assessment_id=a.id order by created_at desc limit 1) f on true
where p.user_id=auth.uid();
grant select on public.v_current_investor_dna to authenticated;

create or replace view public.v_investor_dna_history as
select a.id assessment_id,a.profile_id,a.created_at,a.completed_at,a.questionnaire_version,a.model_version,a.is_current,r.archetype,r.risk_tolerance,r.risk_capacity,r.scoring_version
from public.assessments a join public.profiles p on p.id=a.profile_id and p.user_id=auth.uid()
left join lateral(select * from public.results r0 where r0.assessment_id=a.id order by r0.created_at desc,r0.id desc limit 1) r on true;
grant select on public.v_investor_dna_history to authenticated;
commit;