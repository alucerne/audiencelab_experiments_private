# AudienceLab V3 Staging Migration

## Overview

This migration file (`staging_migration_20250115.sql`) contains all the recent schema changes needed for the staging environment. It includes:

- **Studio Enrichment Tracking**: Table and functions for tracking data enrichment processes
- **Studio Segments**: Table and functions for managing audience segments
- **API Keys System**: Complete API key management system with private schema
- **Security**: Row Level Security (RLS) policies and proper permissions
- **Realtime**: Tables added to Supabase realtime publication

## What's Included

### 1. Studio Enrichment Tracking
- `public.enrichment_tracking` table for tracking enrichment jobs
- RLS policies for account-based access control
- Indexes for performance optimization

### 2. Studio Segments
- `public.segments` table for saving audience segments
- Support for different source types (audience, webhook_upload, csv_upload)
- Filter and enrichment field management
- Soft delete functionality

### 3. API Keys System
- `api_keys_private` schema for secure API key storage
- `api_keys_private.api_keys` table for key management
- `api_keys_private.api_key_logs` table for usage tracking
- Complete set of functions for key management:
  - `create_api_key()` - Create new API keys
  - `list_api_keys()` - List account API keys
  - `revoke_api_key()` - Revoke API keys
  - `verify_api_key()` - Verify API key validity
  - `log_api_key_usage()` - Log API usage
  - `has_scope()` - Check API key permissions
  - `get_api_key_account_id()` - Get account ID from API key

### 4. Security Features
- Row Level Security (RLS) enabled on all tables
- Proper RLS policies for account-based access
- Private schema for sensitive API key data
- Secure key hashing using pgcrypto

## How to Apply

### Option 1: Supabase Dashboard
1. Go to your staging Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `staging_migration_20250115.sql`
4. Click **Run** to execute the migration

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push --project-ref YOUR_STAGING_PROJECT_REF
```

### Option 3: Direct Database Connection
```bash
# Connect to your staging database and run:
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -f staging_migration_20250115.sql
```

## Verification

After running the migration, you can verify it was successful by running these queries in the Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('enrichment_tracking', 'segments');

-- Check if API key tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'api_keys_private';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_api_key', 'list_api_keys', 'create_studio_segment');
```

## Important Notes

1. **Backup First**: Always backup your staging database before applying migrations
2. **Test in Development**: Test this migration in a development environment first
3. **Rollback Plan**: Keep a backup of the current schema in case you need to rollback
4. **Dependencies**: This migration assumes the base schema (accounts, auth, etc.) already exists

## Troubleshooting

### Common Issues

1. **Permission Errors**: Make sure you're running as a user with sufficient privileges
2. **Schema Conflicts**: If tables already exist, the `IF NOT EXISTS` clauses will prevent errors
3. **Function Conflicts**: Functions are created with `CREATE OR REPLACE` to handle existing functions

### Rollback

If you need to rollback this migration, you can run:

```sql
-- Drop tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS public.enrichment_tracking CASCADE;
DROP TABLE IF EXISTS public.segments CASCADE;
DROP SCHEMA IF EXISTS api_keys_private CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.create_api_key CASCADE;
DROP FUNCTION IF EXISTS public.list_api_keys CASCADE;
DROP FUNCTION IF EXISTS public.revoke_api_key CASCADE;
DROP FUNCTION IF EXISTS public.verify_api_key CASCADE;
DROP FUNCTION IF EXISTS public.log_api_key_usage CASCADE;
DROP FUNCTION IF EXISTS public.has_scope CASCADE;
DROP FUNCTION IF EXISTS public.get_api_key_account_id CASCADE;
DROP FUNCTION IF EXISTS public.create_studio_segment CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.create_api_key_response CASCADE;
DROP TYPE IF EXISTS public.verify_api_key_response CASCADE;
DROP TYPE IF EXISTS public.api_key_usage_log_response CASCADE;
```

## Support

If you encounter any issues with this migration, please:
1. Check the Supabase logs for detailed error messages
2. Verify your database user has the necessary permissions
3. Ensure all required extensions (pgcrypto, uuid-ossp) are enabled 