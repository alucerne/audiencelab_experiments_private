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