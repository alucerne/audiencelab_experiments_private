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

-- Notify webhook when audience csv is ready
CREATE OR REPLACE FUNCTION notify_webhook_from_enqueue_job()
RETURNS trigger AS $$
DECLARE
  audience_rec public.audience%ROWTYPE;
BEGIN
  IF NEW.csv_url IS NOT NULL AND OLD.csv_url IS NULL THEN
    SELECT * INTO audience_rec
      FROM public.audience
     WHERE id = NEW.audience_id;

    IF audience_rec.webhook_url IS NOT NULL THEN
      PERFORM net.http_post(
        url := audience_rec.webhook_url,
        body := json_build_object(
          'audience_list', NEW.csv_url,
          'audience_name', audience_rec.name,
          'next_scheduled_refresh', audience_rec.next_scheduled_refresh,
          'audience_size', NEW.current,
          'status', NEW.status
        )::jsonb,
        headers := '{"Content-Type": "application/json"}'::jsonb
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after an update on enqueue_job
CREATE TRIGGER enqueue_job_webhook_trigger
AFTER UPDATE ON public.enqueue_job
FOR EACH ROW
EXECUTE FUNCTION notify_webhook_from_enqueue_job();