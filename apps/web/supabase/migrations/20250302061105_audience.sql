create table if not exists public.audience (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  filters jsonb not null default '{}',
  status text not null default 'no data',
  name text not null,
  csv_url text null,
  job_id text null,
  current integer null,
  total integer null,
  refreshed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.audience
revoke all on public.audience from public, service_role;

-- grant required permissions on public.audience
grant select, insert, delete on public.audience to authenticated;
grant select, insert, update, delete on public.audience to service_role;

-- Indexes
create index ix_audience_account_id on public.audience(account_id);

-- RLS
alter table public.audience enable row level security;


-- SELECT(public.audience)
create policy select_audience
  on public.audience
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.audience)
create policy delete_audience
  on public.audience
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.audience)
create policy update_audience
  on public.audience
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.audience)
create policy insert_audience
  on public.audience
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );