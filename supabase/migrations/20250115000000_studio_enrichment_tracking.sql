-- Studio Enrichment Feature - Database Changes
-- This migration documents the database changes needed for the Studio enrichment feature
-- Note: The Studio enrichment feature is primarily real-time and doesn't require persistent storage
-- However, we may want to track usage for analytics and billing purposes

-- =============================================================================
-- OPTIONAL: Studio Enrichment Usage Tracking Table
-- =============================================================================
-- This table is optional and can be added if you want to track enrichment usage
-- for analytics, billing, or audit purposes

-- Uncomment the following if you want to track enrichment usage:

/*
create table if not exists public.studio_enrichment_log (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null, -- Studio session identifier
  data_source text not null check (data_source in ('audience', 'webhook')),
  rows_processed integer not null default 0,
  fields_enriched text[] not null, -- Array of enrichment fields requested
  success_count integer not null default 0,
  error_count integer not null default 0,
  processing_time_ms integer, -- Time taken for enrichment in milliseconds
  created_at timestamptz not null default now()
);

-- revoke permissions on public.studio_enrichment_log
revoke all on public.studio_enrichment_log from public, service_role;

-- grant required permissions on public.studio_enrichment_log
grant select, insert on public.studio_enrichment_log to authenticated;
grant select, insert, update, delete on public.studio_enrichment_log to service_role;

-- Indexes for performance
create index ix_studio_enrichment_log_account_id on public.studio_enrichment_log(account_id);
create index ix_studio_enrichment_log_user_id on public.studio_enrichment_log(user_id);
create index ix_studio_enrichment_log_created_at on public.studio_enrichment_log(created_at);

-- RLS
alter table public.studio_enrichment_log enable row level security;

-- Realtime (optional)
-- alter publication supabase_realtime add table studio_enrichment_log;

-- SELECT policy
create policy select_studio_enrichment_log
  on public.studio_enrichment_log
  for select
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );

-- INSERT policy
create policy insert_studio_enrichment_log
  on public.studio_enrichment_log
  for insert
  to authenticated
  with check (
    public.has_role_on_account(account_id) 
  );

-- UPDATE policy
create policy update_studio_enrichment_log
  on public.studio_enrichment_log
  for update
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  )
  with check (
    public.has_role_on_account(account_id) 
  );

-- DELETE policy
create policy delete_studio_enrichment_log
  on public.studio_enrichment_log
  for delete
  to authenticated
  using (
    public.has_role_on_account(account_id) 
  );
*/

-- =============================================================================
-- EXISTING TABLES USED BY STUDIO ENRICHMENT
-- =============================================================================
-- The following tables already exist and are used by the Studio enrichment feature:

-- 1. public.accounts - For account identification and RLS
-- 2. public.job_enrich - For the main enrichment feature (CSV uploads)
-- 3. public.audience - For audience data access in Studio
-- 4. auth.users - For user authentication

-- =============================================================================
-- NO ADDITIONAL CHANGES REQUIRED
-- =============================================================================
-- The Studio enrichment feature is designed to work with existing infrastructure:

-- ✅ Authentication: Uses existing auth.users and public.accounts
-- ✅ Authorization: Uses existing RLS policies and has_role_on_account function
-- ✅ Data Access: Uses existing audience table and GCS storage
-- ✅ Real-time: Uses existing Supabase realtime subscriptions
-- ✅ API Security: Uses existing enhanceRouteHandler pattern

-- =============================================================================
-- DEPLOYMENT NOTES
-- =============================================================================

-- For staging/production deployment:

-- 1. The Studio enrichment feature requires NO database changes
-- 2. All existing tables and policies are sufficient
-- 3. The feature uses the existing /api/enrich endpoint
-- 4. Authentication and authorization use existing patterns

-- If you want to track usage (optional):
-- 1. Uncomment the studio_enrichment_log table creation above
-- 2. Run this migration in your staging/production environment
-- 3. Update the enrichment API to log usage

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify existing tables exist:
/*
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('accounts', 'job_enrich', 'audience');
*/

-- Verify RLS policies exist:
/*
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('accounts', 'job_enrich', 'audience');
*/

-- Verify functions exist:
/*
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('has_role_on_account', 'is_account_owner');
*/ 