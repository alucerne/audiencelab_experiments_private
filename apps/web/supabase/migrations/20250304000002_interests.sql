create table if not exists public.interests (
  id bigint primary key not null,
  intent text not null,
  b2b boolean null,
  cat1 text null,
  cat2 text null,
  cat3 text null,
  cat4 text null
);

-- Revoke all permissions first
revoke all on public.interests from public, service_role;

-- Grant only SELECT for authenticated users
grant select on public.interests to authenticated;
-- Service role retains full permissions if needed
grant select, insert, update, delete on public.interests to service_role;

-- Enable RLS
alter table public.interests enable row level security;

-- Create a single RLS policy for SELECT access for authenticated users
create policy select_interests
  on public.interests
  for select
  to authenticated
  using (true);
