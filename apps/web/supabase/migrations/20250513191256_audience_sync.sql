create table if not exists public.audience_sync (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  audience_id uuid not null references public.audience(id) on delete cascade,
  integration_key text not null,
  integration_details jsonb not null default '{}',
  sync_status text not null default 'scheduled',
  processing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.audience_sync
revoke all on public.audience_sync from public, service_role;

-- grant required permissions on public.audience_sync
grant select, insert, delete on public.audience_sync to authenticated;
grant select, insert, update, delete on public.audience_sync to service_role;

-- Indexes
create index ix_audience_sync_account_id on public.audience_sync(account_id);

-- RLS
alter table public.audience_sync enable row level security;

-- Realtime
alter publication supabase_realtime add table audience_sync;

-- SELECT(public.audience_sync)
create policy select_audience_sync
  on public.audience_sync
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.audience_sync)
create policy delete_audience_sync
  on public.audience_sync
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.audience_sync)
create policy update_audience_sync
  on public.audience_sync
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.audience_sync)
create policy insert_audience_sync
  on public.audience_sync
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );
