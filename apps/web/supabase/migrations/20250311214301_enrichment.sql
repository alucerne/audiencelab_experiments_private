create table if not exists public.enrichment (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  status text not null default 'processing',
  csv_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.enrichment
revoke all on public.enrichment from public, service_role;

-- grant required permissions on public.enrichment
grant select, insert, delete on public.enrichment to authenticated;
grant select, insert, update, delete on public.enrichment to service_role;

-- Indexes
create index ix_enrichment_account_id on public.enrichment(account_id);

-- RLS
alter table public.enrichment enable row level security;


-- SELECT(public.enrichment)
create policy select_enrichment
  on public.enrichment
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.enrichment)
create policy delete_enrichment
  on public.enrichment
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.enrichment)
create policy update_enrichment
  on public.enrichment
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.enrichment)
create policy insert_enrichment
  on public.enrichment
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );