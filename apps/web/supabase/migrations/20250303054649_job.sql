create table if not exists public.enqueue_job (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  audience_id uuid not null references public.audience(id) on delete cascade,
  status text not null default 'no data',
  csv_url text null,
  current integer null,
  total integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.enqueue_job
revoke all on public.enqueue_job from public, service_role;

-- grant required permissions on public.enqueue_job
grant select, insert, delete on public.enqueue_job to authenticated;
grant select, insert, update, delete on public.enqueue_job to service_role;

-- Indexes
create index ix_enqueue_job_account_id on public.enqueue_job(account_id);

-- RLS
alter table public.enqueue_job enable row level security;


-- SELECT(public.enqueue_job)
create policy select_enqueue_job
  on public.enqueue_job
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.enqueue_job)
create policy delete_enqueue_job
  on public.enqueue_job
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.enqueue_job)
create policy update_enqueue_job
  on public.enqueue_job
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.enqueue_job)
create policy insert_enqueue_job
  on public.enqueue_job
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );