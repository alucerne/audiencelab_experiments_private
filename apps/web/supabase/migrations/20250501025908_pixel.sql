create table if not exists public.pixel (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  website_name text not null,
  website_url text not null,
  webhook_url text null,
  last_webhook_event_time timestamptz null,
  last_sync timestamptz null,
  delivr_id text not null,
  delivr_install_url text not null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.pixel
revoke all on public.pixel from public, service_role;

-- grant required permissions on public.pixel
grant select, insert, update, delete on public.pixel to authenticated;
grant select, insert, update, delete on public.pixel to service_role;

-- Indexes
create index ix_pixel_account_id on public.pixel(account_id);

-- RLS
alter table public.pixel enable row level security;

-- Realtime
alter publication supabase_realtime add table pixel;

-- SELECT(public.pixel)
create policy select_pixel
  on public.pixel
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- DELETE(public.pixel)
create policy delete_pixel
  on public.pixel
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- UPDATE(public.pixel)
create policy update_pixel
  on public.pixel
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- INSERT(public.pixel)
create policy insert_pixel
  on public.pixel
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

select cron.schedule(
  'send-pixel-webhooks',
  '*/15 * * * *', -- every 15 minutes
  $$
    SELECT net.http_post(
      url := 'http://host.docker.internal:3000/api/db/pixel',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Supabase-Event-Signature', 'WEBHOOKSECRET'
      ),
      timeout_milliseconds := 60000
    );
  $$
);