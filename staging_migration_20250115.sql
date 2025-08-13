-- =============================================================================
-- AUDIENCELAB V3 STAGING MIGRATION
-- Date: 2025-01-15
-- Description: Comprehensive migration for staging environment
-- Includes: Studio segments, API keys, enrichment tracking, and recent schema updates
-- =============================================================================

-- =============================================================================
-- STUDIO ENRICHMENT TRACKING
-- =============================================================================

-- Create enrichment tracking table
CREATE TABLE IF NOT EXISTS public.enrichment_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  audience_id UUID NOT NULL,
  enrichment_type TEXT NOT NULL CHECK (enrichment_type IN ('email', 'phone', 'company', 'social', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  enrichment_fields TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enrichment_tracking ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX ix_enrichment_tracking_account_id ON public.enrichment_tracking(account_id);
CREATE INDEX ix_enrichment_tracking_audience_id ON public.enrichment_tracking(audience_id);
CREATE INDEX ix_enrichment_tracking_status ON public.enrichment_tracking(status);
CREATE INDEX ix_enrichment_tracking_created_at ON public.enrichment_tracking(created_at);

-- RLS Policies
CREATE POLICY "Users can view enrichment tracking for their accounts"
  ON public.enrichment_tracking
  FOR SELECT
  TO authenticated
  USING (public.has_role_on_account(account_id));

CREATE POLICY "Users can create enrichment tracking for their accounts"
  ON public.enrichment_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_on_account(account_id));

CREATE POLICY "Users can update enrichment tracking for their accounts"
  ON public.enrichment_tracking
  FOR UPDATE
  TO authenticated
  USING (public.has_role_on_account(account_id))
  WITH CHECK (public.has_role_on_account(account_id));

-- =============================================================================
-- STUDIO SEGMENTS
-- =============================================================================

-- Create segments table for Studio
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('audience', 'webhook_upload', 'csv_upload')),
  source_id TEXT NOT NULL, -- audience_id or upload_id
  filters JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of filter objects
  enrichment_fields TEXT[] NOT NULL DEFAULT '{}', -- Array of enrichment field names
  custom_columns JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of custom column definitions
  tags TEXT[] NOT NULL DEFAULT '{}', -- Array of tags
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX ix_segments_account_id ON public.segments(account_id);
CREATE INDEX ix_segments_created_by ON public.segments(created_by);
CREATE INDEX ix_segments_source_type ON public.segments(source_type);
CREATE INDEX ix_segments_created_at ON public.segments(created_at);
CREATE INDEX ix_segments_deleted ON public.segments(deleted);

-- RLS Policies
CREATE POLICY "Users can view segments for their accounts"
  ON public.segments
  FOR SELECT
  TO authenticated
  USING (public.has_role_on_account(account_id) AND NOT deleted);

CREATE POLICY "Users can create segments for their accounts"
  ON public.segments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role_on_account(account_id));

CREATE POLICY "Users can update segments for their accounts"
  ON public.segments
  FOR UPDATE
  TO authenticated
  USING (public.has_role_on_account(account_id))
  WITH CHECK (public.has_role_on_account(account_id));

CREATE POLICY "Users can delete segments for their accounts"
  ON public.segments
  FOR DELETE
  TO authenticated
  USING (public.has_role_on_account(account_id));

-- =============================================================================
-- API KEYS SYSTEM
-- =============================================================================

-- Create private schema for API keys
CREATE SCHEMA IF NOT EXISTS api_keys_private;

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys_private.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_prefix VARCHAR(7) NOT NULL,
  key_hash TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create API key logs table
CREATE TABLE IF NOT EXISTS api_keys_private.api_key_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys_private.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on API keys tables
ALTER TABLE api_keys_private.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys_private.api_key_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_api_keys_account_id ON api_keys_private.api_keys(account_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys_private.api_keys(key_prefix);
CREATE INDEX idx_api_key_logs_api_key_id ON api_keys_private.api_key_logs(api_key_id);
CREATE INDEX idx_api_key_logs_timestamp ON api_keys_private.api_key_logs(timestamp);

-- Lock down private schema
REVOKE ALL ON SCHEMA api_keys_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA api_keys_private FROM PUBLIC;

-- Grant permissions
GRANT USAGE ON SCHEMA api_keys_private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA api_keys_private TO service_role;

-- Create API key role
CREATE ROLE IF NOT EXISTS api_key NOBYPASSRLS;
GRANT api_key TO authenticator;
GRANT anon TO api_key;

-- Create custom types
CREATE TYPE IF NOT EXISTS public.create_api_key_response AS (
  id UUID,
  name TEXT,
  key TEXT,
  key_prefix TEXT,
  account_id UUID,
  scopes JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

CREATE TYPE IF NOT EXISTS public.verify_api_key_response AS (
  valid BOOLEAN,
  api_key_id UUID,
  account_id UUID,
  error TEXT
);

CREATE TYPE IF NOT EXISTS public.api_key_usage_log_response AS (
  success BOOLEAN,
  log_id UUID,
  timestamp TIMESTAMPTZ,
  error TEXT,
  error_code TEXT
);

-- =============================================================================
-- API KEY FUNCTIONS
-- =============================================================================

-- Function to create API key
CREATE OR REPLACE FUNCTION public.create_api_key(
    p_account_id UUID,
    p_name TEXT,
    p_scopes JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
    RETURNS public.create_api_key_response AS
$$
DECLARE
    v_is_authorized BOOLEAN;
    v_key           TEXT;
    v_key_prefix    TEXT;
    v_key_hash      TEXT;
    v_id            UUID;
    v_created_at    TIMESTAMPTZ;
BEGIN
    SELECT public.has_role_on_account(p_account_id) INTO v_is_authorized;

    IF NOT (v_is_authorized) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to create API keys for this account';
    END IF;

    -- Generate secure API key
    v_key := 'sk_' || encode(gen_random_bytes(32), 'base64');
    v_key := replace(replace(replace(v_key, '/', ''), '+', ''), '=', '');
    v_key_prefix := substring(v_key, 1, 7);
    v_key_hash := crypt(v_key, gen_salt('bf', 12));

    -- Insert API key
    INSERT INTO api_keys_private.api_keys (account_id, name, key_prefix, key_hash, scopes, expires_at, created_by)
    VALUES (p_account_id, p_name, v_key_prefix, v_key_hash, p_scopes, p_expires_at, auth.uid())
    RETURNING id, created_at INTO v_id, v_created_at;

    RETURN (v_id, p_name, v_key, v_key_prefix, p_account_id, p_scopes, p_expires_at, v_created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list API keys
CREATE OR REPLACE FUNCTION public.list_api_keys(p_account_id UUID)
    RETURNS TABLE (
        id UUID,
        name TEXT,
        key_prefix TEXT,
        scopes JSONB,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ,
        last_used_at TIMESTAMPTZ,
        is_active BOOLEAN,
        created_by UUID
    ) AS
$$
BEGIN
    IF NOT (public.has_role_on_account(p_account_id)) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to view API keys for this account';
    END IF;

    RETURN QUERY
        SELECT k.id, k.name, k.key_prefix::TEXT, k.scopes, k.expires_at, k.created_at, k.last_used_at, k.is_active, k.created_by
        FROM api_keys_private.api_keys k
        WHERE k.account_id = p_account_id
        ORDER BY k.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke API key
CREATE OR REPLACE FUNCTION public.revoke_api_key(p_api_key_id UUID)
    RETURNS BOOLEAN AS
$$
DECLARE
    v_account_id UUID;
BEGIN
    SELECT account_id INTO v_account_id
    FROM api_keys_private.api_keys
    WHERE id = p_api_key_id;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'API key not found';
    END IF;

    IF NOT (public.has_role_on_account(v_account_id)) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to revoke API keys for this account';
    END IF;

    UPDATE api_keys_private.api_keys
    SET is_active = FALSE
    WHERE id = p_api_key_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify API key
CREATE OR REPLACE FUNCTION public.verify_api_key(p_api_key TEXT)
    RETURNS verify_api_key_response AS
$$
DECLARE
    v_key_prefix TEXT;
    v_key_record RECORD;
    v_found      BOOLEAN := FALSE;
BEGIN
    v_key_prefix := substring(p_api_key, 1, 7);

    FOR v_key_record IN
        SELECT id, key_hash, account_id, is_active, expires_at
        FROM api_keys_private.api_keys
        WHERE key_prefix = v_key_prefix AND is_active = TRUE
    LOOP
        IF crypt(p_api_key, v_key_record.key_hash) = v_key_record.key_hash THEN
            v_found := TRUE;

            IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
                RETURN (FALSE, NULL, NULL, 'Invalid API key');
            END IF;

            RETURN (TRUE, v_key_record.id, v_key_record.account_id, NULL);
        END IF;
    END LOOP;

    RETURN (FALSE, NULL, NULL, 'Invalid API key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log API key usage
CREATE OR REPLACE FUNCTION public.log_api_key_usage(
  p_api_key_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS api_key_usage_log_response AS $$
DECLARE
  v_current_time TIMESTAMPTZ := now();
  v_log_id UUID;
BEGIN
  UPDATE api_keys_private.api_keys
  SET last_used_at = v_current_time
  WHERE id = p_api_key_id;

  INSERT INTO api_keys_private.api_key_logs (
    api_key_id, endpoint, method, status_code, ip_address, user_agent, timestamp
  ) VALUES (
    p_api_key_id, p_endpoint, p_method, p_status_code, p_ip_address, p_user_agent, v_current_time
  )
  RETURNING id INTO v_log_id;

  RETURN (TRUE, v_log_id, v_current_time, NULL, NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN (FALSE, NULL, NULL, SQLERRM, SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check API key scopes
CREATE OR REPLACE FUNCTION public.has_scope(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_scopes JSONB;
  v_api_key_id UUID;
BEGIN
  v_api_key_id := auth.uid();

  IF v_api_key_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT scopes INTO v_scopes
  FROM api_keys_private.api_keys
  WHERE id = v_api_key_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now());

  IF v_scopes IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for global wildcard
  IF v_scopes @> '[{"entity_type": "*", "entity_id": "*", "action": "*"}]' THEN
    RETURN TRUE;
  END IF;

  -- Check for entity type wildcard
  IF v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', '*',
    'action', '*'
  )) THEN
    RETURN TRUE;
  END IF;

  -- Check for specific action wildcard
  IF v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', '*',
    'action', p_action
  )) THEN
    RETURN TRUE;
  END IF;

  -- Check for specific entity permission
  IF v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'action', p_action
  )) OR v_scopes @> jsonb_build_array(jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'action', '*'
  )) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API key account ID
CREATE OR REPLACE FUNCTION public.get_api_key_account_id()
    RETURNS UUID AS
$$
DECLARE
    v_api_key_id UUID;
    v_account_id UUID;
BEGIN
    v_api_key_id := auth.uid();

    IF v_api_key_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT account_id
    INTO v_account_id
    FROM api_keys_private.api_keys
    WHERE id = v_api_key_id
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > now());

    RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STUDIO HELPER FUNCTIONS
-- =============================================================================

-- Function to create studio segment
CREATE OR REPLACE FUNCTION public.create_studio_segment(
  p_account_id UUID,
  p_name TEXT,
  p_source_type TEXT,
  p_source_id TEXT,
  p_description TEXT DEFAULT NULL,
  p_filters JSONB DEFAULT '[]'::jsonb,
  p_enrichment_fields TEXT[] DEFAULT '{}',
  p_custom_columns JSONB DEFAULT '[]'::jsonb,
  p_tags TEXT[] DEFAULT '{}'
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
  v_user_id := auth.uid();
  
  if not public.has_role_on_account(p_account_id) then
    raise exception 'Access denied to account %', p_account_id;
  end if;
  
  insert into public.segments (
    account_id, name, description, source_type, source_id,
    filters, enrichment_fields, custom_columns, tags, created_by
  ) values (
    p_account_id, p_name, p_description, p_source_type, p_source_id,
    p_filters, p_enrichment_fields, p_custom_columns, p_tags, v_user_id
  )
  returning id into v_segment_id;
  
  return v_segment_id;
end;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions on API key functions
GRANT EXECUTE ON FUNCTION public.create_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_api_key_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_api_key TO service_role, api_key;
GRANT EXECUTE ON FUNCTION public.has_scope TO api_key;
GRANT EXECUTE ON FUNCTION public.get_api_key_account_id TO api_key;

-- Grant execute permissions on Studio functions
GRANT EXECUTE ON FUNCTION public.create_studio_segment TO authenticated;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp triggers
CREATE TRIGGER set_timestamps_enrichment_tracking
  BEFORE UPDATE ON public.enrichment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamps();

CREATE TRIGGER set_timestamps_segments
  BEFORE UPDATE ON public.segments
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamps();

-- =============================================================================
-- REALTIME
-- =============================================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE enrichment_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE segments;

-- =============================================================================
-- VERIFICATION QUERIES (COMMENTED OUT)
-- =============================================================================

/*
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('enrichment_tracking', 'segments');

-- Verify API key tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'api_keys_private';

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_api_key', 'list_api_keys', 'create_studio_segment');
*/ 