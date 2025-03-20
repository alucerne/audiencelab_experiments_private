create table if not exists public.audience (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  filters jsonb not null default '{}',
  name text not null,
  webhook_url text null,
  scheduled_refresh boolean not null default false,
  refresh_interval integer null,
  next_scheduled_refresh timestamptz null,
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

-- create extension pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Audience refresh cron job function
CREATE OR REPLACE FUNCTION create_audience_refresh_cron(
  p_job_name TEXT,
  p_cron_expression TEXT,
  p_audience_id UUID,
  p_account_id UUID,
  p_refresh_interval INTEGER
) RETURNS VOID AS $$
DECLARE
  job_exists INTEGER;
  next_run timestamptz;
BEGIN
  SELECT COUNT(*) INTO job_exists FROM cron.job WHERE jobname = p_job_name;
  
  IF job_exists > 0 THEN
    PERFORM cron.unschedule(p_job_name);
  END IF;
  
  PERFORM cron.schedule(
    p_job_name, 
    p_cron_expression, 
    format(
      $cmd$
        SELECT net.http_post(
          url := 'http://host.docker.internal:3000/api/db/refresh',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Supabase-Event-Signature', 'WEBHOOKSECRET'
          ),
          body := jsonb_build_object(
            'audience_id', '%s',
            'account_id', '%s'
          ),
          timeout_milliseconds := 5000
        ) AS request_id;
      $cmd$,
      p_audience_id,
      p_account_id
    )
  );
  
  -- Compute the next scheduled refresh time.
  -- Here we assume that refresh jobs always run at midnight.
  -- For a 30-day interval we add one month; for others, we add the exact number of days.
  IF p_refresh_interval = 30 THEN
    next_run := date_trunc('month', now()) + interval '1 month';
  ELSE
    next_run := date_trunc('day', now()) + (p_refresh_interval || ' days')::interval;
  END IF;

  UPDATE public.audience
  SET scheduled_refresh = true,
      refresh_interval = p_refresh_interval,
      next_scheduled_refresh = next_run
  WHERE id = p_audience_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove refresh cron job function
CREATE OR REPLACE FUNCTION remove_audience_cron_job(p_job_name TEXT, p_audience_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE public.audience
  SET scheduled_refresh = false,
      refresh_interval = NULL,
      next_scheduled_refresh = NULL
  WHERE id = p_audience_id;
  
  PERFORM cron.unschedule(p_job_name);
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.audience
    SET scheduled_refresh = false,
        refresh_interval = NULL,
        next_scheduled_refresh = NULL
    WHERE id = p_audience_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION create_audience_refresh_cron(TEXT, TEXT, UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_audience_refresh_cron(TEXT, TEXT, UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION remove_audience_cron_job(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_audience_cron_job(TEXT, UUID) TO service_role;