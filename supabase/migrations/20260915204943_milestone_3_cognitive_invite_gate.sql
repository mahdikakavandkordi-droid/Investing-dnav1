alter table public.pilot_cohorts add column access_code_hash text null check (access_code_hash is null or access_code_hash ~ '^[0-9a-f]{64}$');

-- The live COGNITIVE_V1_10 access-code hash is operational configuration and is intentionally not checked into source control.
-- Configure it with a SHA-256 hex digest before recruiting participants.
