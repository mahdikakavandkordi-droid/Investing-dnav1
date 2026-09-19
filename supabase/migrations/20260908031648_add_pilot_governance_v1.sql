create table if not exists public.pilot_cohorts (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 questionnaire_version text not null default 'v1.1',
 model_version text not null default 'dna-v1.1',
 target_n integer not null default 150,
 min_n_for_basic_stats integer not null default 30,
 min_n_for_reliability integer not null default 100,
 status text not null default 'planned' check(status in ('planned','collecting','closed','archived')),
 notes text,
 created_at timestamptz not null default now()
);

create table if not exists public.pilot_participants (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null references public.pilot_cohorts(id) on delete restrict,
 anonymous_code text not null unique,
 consent_version text not null,
 consented_at timestamptz not null,
 withdrawn_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.pilot_data_dictionary (
 id uuid primary key default gen_random_uuid(),
 version text not null,
 field_key text not null,
 source_table text not null,
 classification text not null check(classification in ('assessment_data','demographic','sensitive','derived','operational')),
 allowed_for_validation boolean not null default false,
 retention_note text,
 created_at timestamptz not null default now(),
 unique(version,field_key)
);

insert into public.pilot_cohorts(code,questionnaire_version,model_version,target_n,min_n_for_basic_stats,min_n_for_reliability,status,notes)
values('PILOT_V1_1','v1.1','dna-v1.1',150,30,100,'planned','Initial psychometric pilot; collect broad variation in age, experience and financial context without targeting outcomes.')
on conflict(code) do nothing;

insert into public.pilot_data_dictionary(version,field_key,source_table,classification,allowed_for_validation,retention_note) values
('v1.1','assessment_id','assessments','operational',true,'Pseudonymous linkage only.'),
('v1.1','questionnaire_version','assessments','operational',true,'Required for versioned analysis.'),
('v1.1','model_version','assessments','operational',true,'Required for model comparison.'),
('v1.1','status','assessments','operational',true,'Used for completion-quality checks.'),
('v1.1','started_at','assessments','operational',true,'Used for duration/quality analysis.'),
('v1.1','completed_at','assessments','operational',true,'Used for duration/quality analysis.'),
('v1.1','question_id','answers','operational',true,'Required for item analysis.'),
('v1.1','answer_value','answers','derived',true,'Required for psychometric scoring; avoid storing free text.'),
('v1.1','age_range','profiles','demographic',true,'Use grouped ranges only.'),
('v1.1','gender','profiles','demographic',false,'Not required for core psychometric validation; avoid unless justified.'),
('v1.1','province','profiles','demographic',false,'Not required for core psychometric validation.'),
('v1.1','income_range','profiles','sensitive',false,'Do not use in core psychometric analysis unless separately justified.'),
('v1.1','investable_assets_range','profiles','sensitive',false,'Do not expose in analytics outputs.'),
('v1.1','debt_range','profiles','sensitive',false,'Do not expose in analytics outputs.'),
('v1.1','risk_tolerance','results','derived',true,'Derived score; report only in aggregate during pilot.'),
('v1.1','risk_capacity','results','derived',true,'Derived score; report only in aggregate during pilot.'),
('v1.1','archetype','results','derived',true,'Use for distribution and model-behavior checks.'),
('v1.1','behavioral_profile','results','derived',true,'Aggregate trait analysis only.'),
('v1.1','fingerprint_code','fingerprint_profiles','derived',true,'Treat as derived behavioral output; do not use as a clinical/personality diagnosis.'),
('v1.1','narrative','narratives','derived',false,'Keep out of psychometric item-level datasets; qualitative output only.')
on conflict(version,field_key) do update set source_table=excluded.source_table,classification=excluded.classification,allowed_for_validation=excluded.allowed_for_validation,retention_note=excluded.retention_note;

alter table public.pilot_cohorts enable row level security;
alter table public.pilot_participants enable row level security;
alter table public.pilot_data_dictionary enable row level security;
revoke all on public.pilot_cohorts from anon,authenticated;
revoke all on public.pilot_participants from anon,authenticated;
revoke all on public.pilot_data_dictionary from anon,authenticated;