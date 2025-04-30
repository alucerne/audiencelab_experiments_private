create table if not exists public.credits (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  monthly_audience_limit integer not null default 20,
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
grant select on public.credits to authenticated;
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

CREATE OR REPLACE FUNCTION public.create_team_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_personal_account = false THEN
    INSERT INTO public.credits(account_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_team_credits() FROM public;

CREATE TRIGGER after_team_account_insert
AFTER INSERT ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.create_team_credits();
