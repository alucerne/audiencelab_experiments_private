create table if not exists public.signup_codes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  permissions jsonb not null default '{}'::jsonb,
  max_usage int,
  enabled boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.signup_codes
revoke all on public.signup_codes from public, service_role;

-- grant required permissions on public.signup_codes
grant select, insert, update, delete on public.signup_codes to service_role;

-- RLS
alter table public.signup_codes enable row level security;

create table if not exists public.signup_code_usages (
  id uuid primary key default uuid_generate_v4(),
  signup_code_id uuid not null references public.signup_codes(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.signup_code_usages
revoke all on public.signup_code_usages from public, service_role;

-- grant required permissions on public.signup_code_usages
grant select, insert, update, delete on public.signup_code_usages to service_role;

-- Indexes
create index ix_signup_code_usages_account_id on public.signup_code_usages(account_id);

-- RLS
alter table public.signup_code_usages enable row level security;
