create table if not exists public.whitelabel_credits (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  monthly_audience_limit integer not null,
  max_custom_interests integer not null,
  audience_size_limit integer not null,
  b2b_access boolean not null,
  intent_access boolean not null,
  monthly_pixel_limit integer not null,
  pixel_size_limit integer not null,
  monthly_enrichment_limit integer not null,
  enrichment_size_limit integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whitelabel_branding (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null unique references public.accounts(id) on delete cascade,
  company_name text,
  logo_url text,
  icon_url text,
  domain text,
  domain_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- revoke permissions on public.whitelabel_branding
revoke all on public.whitelabel_branding from public, service_role;

-- grant required permissions on public.whitelabel_branding
grant select, insert, delete on public.whitelabel_branding to authenticated;
grant select, insert, update, delete on public.whitelabel_branding to service_role;
grant select on public.whitelabel_branding to public;
GRANT USAGE ON SCHEMA public TO public;


-- Indexes
create index ix_audience_domain on public.whitelabel_branding(domain);

-- RLS
alter table public.whitelabel_branding enable row level security;

create policy public_select_verified_branding
on public.whitelabel_branding
for select
to public
using (
  domain_verified = true
);

insert into
  storage.buckets (id, name, PUBLIC)
values
  ('whitelabel_logo', 'whitelabel_logo', true);

-- RLS policies for storage bucket whitelabel_logo
create policy whitelabel_logo on storage.objects for all using (
  bucket_id = 'whitelabel_logo'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_role_on_account(kit.get_storage_filename_as_uuid(name))
  )
)
with check (
  bucket_id = 'whitelabel_logo'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_permission(
      auth.uid(),
      kit.get_storage_filename_as_uuid(name),
      'settings.manage'
    )
  )
);

insert into
  storage.buckets (id, name, PUBLIC)
values
  ('whitelabel_icon', 'whitelabel_icon', true);

-- RLS policies for storage bucket whitelabel_icon
create policy whitelabel_icon on storage.objects for all using (
  bucket_id = 'whitelabel_icon'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_role_on_account(kit.get_storage_filename_as_uuid(name))
  )
)
with check (
  bucket_id = 'whitelabel_icon'
  and (
    kit.get_storage_filename_as_uuid(name) = auth.uid()
    or public.has_permission(
      auth.uid(),
      kit.get_storage_filename_as_uuid(name),
      'settings.manage'
    )
  )
);

create or replace view public.whitelabel_credits_usage as
select
  whitelabel_host_account_id as account_id,

  sum(current_enrichment) as current_enrichment,
  sum(current_audience) as current_audience,
  sum(current_pixel) as current_pixel,
  sum(current_custom) as current_custom,

  sum(monthly_enrichment_limit) as allocated_monthly_enrichment_limit,
  sum(enrichment_size_limit) as allocated_enrichment_size_limit,

  sum(monthly_audience_limit) as allocated_monthly_audience_limit,
  sum(audience_size_limit) as allocated_audience_size_limit,

  sum(monthly_pixel_limit) as allocated_monthly_pixel_limit,
  sum(pixel_size_limit) as allocated_pixel_size_limit,

  sum(max_custom_interests) as allocated_max_custom_interests

from public.credits
where whitelabel_host_account_id is not null
group by whitelabel_host_account_id;