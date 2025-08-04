create table if not exists public.job_enrich (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  status text not null default 'submitted',
  csv_url text null,
  payload_enqueue text null,
  total integer null,
  payload_hydrate text null,
  payload_load text null,
  resolution_time double precision null,
  update_count integer null,
  path text null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.job_enrich
revoke all on public.job_enrich from public, service_role;

-- grant required permissions on public.job_enrich
grant select, insert, delete on public.job_enrich to authenticated;
grant select, insert, update, delete on public.job_enrich to service_role;

-- Indexes
create index ix_job_enrich_account_id on public.job_enrich(account_id);

-- RLS
alter table public.job_enrich enable row level security;

-- Realtime
alter publication supabase_realtime add table job_enrich;

-- SELECT(public.job_enrich)
create policy select_job_enrich
  on public.job_enrich
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.job_enrich)
create policy delete_job_enrich
  on public.job_enrich
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.job_enrich)
create policy update_job_enrich
  on public.job_enrich
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.job_enrich)
create policy insert_job_enrich
  on public.job_enrich
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );