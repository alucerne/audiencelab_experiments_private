create table if not exists public.enqueue_job (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  audience_id uuid not null references public.audience(id) on delete cascade,
  status text not null default 'no data',
  csv_url text null,
  current integer null,
  total integer null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payload_enqueue text null,
  payload_process text null,
  payload_hydrate text null,
  resolution_time double precision null,
  update_count integer null
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

-- Realtime
alter publication supabase_realtime add table enqueue_job;

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


create function public.updated_at_column() returns trigger
  language plpgsql
as
$$
BEGIN
    NEW.updated_at = now();

    NEW.resolution_time = extract(epoch from (NEW.updated_at - NEW.created_at));

    IF NEW.update_count IS NULL THEN
        NEW.update_count = 1;
    ELSE
        NEW.update_count = NEW.update_count + 1;
    END IF;

    RETURN NEW;
END;
$$;

alter function public.updated_at_column() owner to postgres;
grant execute on function public.updated_at_column() to service_role;

create trigger set_updated_at
  before update
  on public.enqueue_job
  for each row
  execute procedure public.updated_at_column();