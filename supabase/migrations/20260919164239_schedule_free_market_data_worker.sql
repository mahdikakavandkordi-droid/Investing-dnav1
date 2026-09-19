-- Zero-cost scheduler/auth bridge for the temporary market-data worker.
-- Uses Supabase Cron + pg_net + Vault so no paid provider credential or
-- external scheduler secret is required.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.market_data_worker_auth (
  id smallint primary key default 1 check (id=1),
  token_hash bytea not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now()
);

alter table public.market_data_worker_auth enable row level security;
revoke all on table public.market_data_worker_auth from public,anon,authenticated;
grant select on table public.market_data_worker_auth to service_role;

do $$
declare
  v_token text;
begin
  if not exists (select 1 from public.market_data_worker_auth where id=1) then
    v_token:=encode(extensions.gen_random_bytes(32),'hex');

    insert into public.market_data_worker_auth(id,token_hash)
    values(1,extensions.digest(v_token,'sha256'));

    perform vault.create_secret(
      v_token,
      'market_data_worker_token',
      'Private token used by Supabase Cron to invoke the market-data-refresh Edge Function.'
    );
  end if;
end;
$$;

create or replace function public.verify_market_data_worker_token(p_token text)
returns boolean
language sql
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.market_data_worker_auth a
    where a.id=1
      and a.token_hash=extensions.digest(coalesce(p_token,''),'sha256')
  );
$$;

revoke all on function public.verify_market_data_worker_token(text)
  from public,anon,authenticated;
grant execute on function public.verify_market_data_worker_token(text)
  to service_role;

select cron.unschedule(jobid)
from cron.job
where jobname='investor-dna-market-data-refresh';

select cron.schedule(
  'investor-dna-market-data-refresh',
  '30 1 * * 2-6',
  $cron$
  select net.http_post(
    url:='https://bxjjannguzzzqsamnhem.supabase.co/functions/v1/market-data-refresh',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'x-market-worker-token',
      (
        select decrypted_secret
        from vault.decrypted_secrets
        where name='market_data_worker_token'
        order by created_at desc
        limit 1
      )
    ),
    body:=jsonb_build_object(
      'dry_run',false,
      'trigger_source','supabase_cron'
    ),
    timeout_milliseconds:=120000
  ) as request_id;
  $cron$
);
