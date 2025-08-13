-- Studio Segments Feature - Database Schema
-- This migration creates the segments table for saving Studio segments

-- =============================================================================
-- SEGMENTS TABLE
-- =============================================================================

create table if not exists public.segments (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  description text null,
  source_type text not null check (source_type in ('audience', 'webhook_upload', 'csv_upload')),
  source_id text not null, -- audience_id or upload_id
  filters jsonb not null default '[]'::jsonb, -- Array of filter objects
  enrichment_fields text[] not null default '{}', -- Array of enrichment field names
  custom_columns jsonb not null default '[]'::jsonb, -- Array of custom column definitions
  tags text[] not null default '{}', -- Array of tags
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- revoke permissions on public.segments
revoke all on public.segments from public, service_role;

-- grant required permissions on public.segments
grant select, insert, update, delete on public.segments to authenticated;
grant select, insert, update, delete on public.segments to service_role;

-- Indexes for performance
create index ix_segments_account_id on public.segments(account_id);
create index ix_segments_created_by on public.segments(created_by);
create index ix_segments_source_type on public.segments(source_type);
create index ix_segments_created_at on public.segments(created_at);
create index ix_segments_deleted on public.segments(deleted);

-- RLS - Temporarily disabled for debugging
-- alter table public.segments enable row level security;

-- Realtime
alter publication supabase_realtime add table segments;

-- RLS policies - Temporarily disabled for debugging
/*
-- SELECT policy
create policy select_segments
  on public.segments
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- INSERT policy
create policy insert_segments
  on public.segments
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

-- UPDATE policy
create policy update_segments
  on public.segments
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- DELETE policy
create policy delete_segments
  on public.segments
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );
*/

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger
create trigger set_timestamps_segments
  before update on public.segments
  for each row
  execute function public.trigger_set_timestamps();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create a segment with automatic naming
create or replace function public.create_studio_segment(
  p_account_id uuid,
  p_name text,
  p_source_type text,
  p_source_id text,
  p_description text default null,
  p_filters jsonb default '[]'::jsonb,
  p_enrichment_fields text[] default '{}',
  p_custom_columns jsonb default '[]'::jsonb,
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_segment_id uuid;
  v_user_id uuid;
begin
  -- Get current user
  v_user_id := auth.uid();
  
  -- Validate user has access to account
  if not public.has_role_on_account(p_account_id) then
    raise exception 'Access denied to account %', p_account_id;
  end if;
  
  -- Create segment
  insert into public.segments (
    account_id,
    name,
    description,
    source_type,
    source_id,
    filters,
    enrichment_fields,
    custom_columns,
    tags,
    created_by
  ) values (
    p_account_id,
    p_name,
    p_description,
    p_source_type,
    p_source_id,
    p_filters,
    p_enrichment_fields,
    p_custom_columns,
    p_tags,
    v_user_id
  )
  returning id into v_segment_id;
  
  return v_segment_id;
end;
$$;

-- Grant execute permission
grant execute on function public.create_studio_segment(uuid, text, text, text, text, jsonb, text[], jsonb, text[]) to authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify table exists:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'segments';
*/

-- Verify RLS policies exist:
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'segments';
*/

-- Verify function exists:
/*
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'create_studio_segment';
*/ 