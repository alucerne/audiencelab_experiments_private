create table if not exists public.credits (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  max_audience_lists integer not null default 20,
  max_custom_interests integer not null default 1,
  audience_size_limit integer not null default 500000,
  b2b_access boolean not null default true,
  intent_access boolean not null default true,
  monthly_enrichment_limit integer not null default 1,
  enrichment_size_limit integer not null default 500000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.credits
revoke all on public.credits from public, service_role;

-- grant required permissions on public.credits
grant select, insert, delete on public.credits to authenticated;
grant select, insert, update, delete on public.credits to service_role;

-- Indexes
create index ix_credits_account_id on public.credits(account_id);

-- RLS
alter table public.credits enable row level security;


-- SELECT(public.credits)
create policy select_credits
  on public.credits
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );