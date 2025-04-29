create table if not exists public.interests_custom (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  topic_id text not null,
  topic text null,
  description text not null,
  available boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.interests_custom
revoke all on public.interests_custom from public, service_role;

-- grant required permissions on public.interests_custom
grant select, insert, delete on public.interests_custom to authenticated;
grant select, insert, update, delete on public.interests_custom to service_role;

-- Indexes
create index ix_interests_custom_account_id on public.interests_custom(account_id);

-- RLS
alter table public.interests_custom enable row level security;

-- SELECT(public.interests_custom)
create policy select_interests_custom
  on public.interests_custom
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.interests_custom)
create policy delete_interests_custom
  on public.interests_custom
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.interests_custom)
create policy update_interests_custom
  on public.interests_custom
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.interests_custom)
create policy insert_interests_custom
  on public.interests_custom
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

select cron.schedule(
  'update-interests-daily',
  '0 2 * * *',              -- every day at 2:00 AM UTC
  $$
    SELECT net.http_post(
      url := 'http://host.docker.internal:3000/api/db/interest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Supabase-Event-Signature', 'WEBHOOKSECRET'
      ),
      timeout_milliseconds := 20000
    );
  $$
);
