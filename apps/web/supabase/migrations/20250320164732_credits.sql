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
  current_audience integer not null default 0,
  current_enrichment integer not null default 0,
  current_custom integer not null default 0,
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


CREATE OR REPLACE FUNCTION public.increment_custom_interests_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.credits
    SET current_custom = current_custom + 1
  WHERE account_id = NEW.account_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_custom_interests_count() FROM public;

CREATE TRIGGER after_insert_interests_custom
AFTER INSERT ON public.interests_custom
FOR EACH ROW
EXECUTE FUNCTION public.increment_custom_interests_count();

CREATE OR REPLACE FUNCTION public.increment_enrichment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.credits
    SET current_enrichment = current_enrichment + 1
  WHERE account_id = NEW.account_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_enrichment_count() FROM public;

CREATE TRIGGER after_insert_job_enrich
AFTER INSERT ON public.job_enrich
FOR EACH ROW
EXECUTE FUNCTION public.increment_enrichment_count();

CREATE OR REPLACE FUNCTION public.decrement_enrichment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status)
     AND (NEW.status IN ('NO_DATA', 'FAILED')) THEN
     
    UPDATE public.credits
    SET current_enrichment = GREATEST(current_enrichment - 1, 0)
    WHERE account_id = NEW.account_id;
  END IF;
  
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_enrichment_count() FROM public;

CREATE TRIGGER after_failed_job_enrich
AFTER UPDATE ON public.job_enrich
FOR EACH ROW
EXECUTE FUNCTION public.decrement_enrichment_count();

CREATE OR REPLACE FUNCTION public.increment_audience_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
      FROM public.enqueue_job 
     WHERE audience_id = NEW.audience_id
  ) = 1 THEN
    UPDATE public.credits
       SET current_audience = current_audience + 1
     WHERE account_id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_audience_count() FROM public;

CREATE TRIGGER after_insert_enqueue_job
AFTER INSERT ON public.enqueue_job
FOR EACH ROW
EXECUTE FUNCTION public.increment_audience_count();

CREATE OR REPLACE FUNCTION public.decrement_audience_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
      FROM public.enqueue_job 
     WHERE audience_id = OLD.audience_id
  ) = 0 THEN
    UPDATE public.credits
       SET current_audience = current_audience - 1
     WHERE account_id = OLD.account_id;
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_audience_count() FROM public;

CREATE TRIGGER after_delete_enqueue_job
AFTER DELETE ON public.enqueue_job
FOR EACH ROW
EXECUTE FUNCTION public.decrement_audience_count();

SELECT cron.schedule(
  'reset-monthly-credits',
  '0 0 1 * *',    -- at 00:00 UTC on day-of-month 1
  $$
    UPDATE public.credits AS c
    SET
      current_enrichment = 0,
      current_audience   = (
        SELECT COUNT(DISTINCT a.id)
        FROM public.audience     AS a
        JOIN public.enqueue_job  AS j
          ON j.audience_id = a.id
        WHERE a.account_id = c.account_id
          AND a.deleted    = FALSE
      )
    ;
  $$
);
