-- Step 1: Create a dedicated private schema for API key data
CREATE SCHEMA IF NOT EXISTS api_keys_private;

-- Step 2: Create the tables in the private schema
CREATE TABLE api_keys_private.api_keys (
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

ALTER table api_keys_private.api_keys enable row level security;

create policy "Accounts can read API Keys" on api_keys_private.api_keys
    for select
    to authenticated
    using (
        public.has_role_on_account(account_id)
    );

CREATE TABLE api_keys_private.api_key_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys_private.api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER table api_keys_private.api_key_logs enable row level security;

-- Step 3: Create indexes for performance optimization
CREATE INDEX idx_api_keys_account_id ON api_keys_private.api_keys(account_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys_private.api_keys(key_prefix);
CREATE INDEX idx_api_key_logs_api_key_id ON api_keys_private.api_key_logs(api_key_id);
CREATE INDEX idx_api_key_logs_timestamp ON api_keys_private.api_key_logs(timestamp);

-- Step 4: Lock down the private schema
REVOKE ALL ON SCHEMA api_keys_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA api_keys_private FROM PUBLIC;

-- Grant usage to roles that need it
GRANT USAGE ON SCHEMA api_keys_private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA api_keys_private TO service_role;

-- Create our API key role
CREATE ROLE api_key NOBYPASSRLS;
GRANT api_key TO authenticator;
GRANT anon TO api_key;

CREATE TYPE public.create_api_key_response AS (
  id UUID,
  name TEXT,
  key TEXT,
  key_prefix TEXT,
  account_id UUID,
  scopes JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Function 1: Create API Key (accessible to authenticated users)
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
    select public.has_role_on_account(p_account_id) into v_is_authorized;

    -- Security check: Verify user has permission to create API keys for this account
    IF NOT (v_is_authorized) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to create API keys for this account';
    END IF;

    -- Generate a secure random API key
    v_key := 'sk_' || encode(gen_random_bytes(32), 'base64');
    v_key := replace(replace(replace(v_key, '/', ''), '+', ''), '=', '');
    v_key_prefix := substring(v_key, 1, 7);

    -- Hash the key using pgcrypto's crypt function with a strong algorithm
    v_key_hash := crypt(v_key, gen_salt('bf', 12));

    -- Insert the new API key record
    INSERT INTO api_keys_private.api_keys (account_id,
                                           name,
                                           key_prefix,
                                           key_hash,
                                           scopes,
                                           expires_at,
                                           created_by)
    VALUES (p_account_id,
            p_name,
            v_key_prefix,
            v_key_hash,
            p_scopes,
            p_expires_at,
            auth.uid())
    RETURNING id, created_at INTO v_id, v_created_at;

    -- Return the API key details including the full key (only shown once)
    RETURN (
            v_id, p_name, v_key, v_key_prefix, p_account_id, p_scopes, p_expires_at, v_created_at
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: List API Keys for an account
CREATE OR REPLACE FUNCTION public.list_api_keys(
    p_account_id UUID
)
    RETURNS TABLE
            (
                id           UUID,
                name         TEXT,
                key_prefix   TEXT,
                scopes       JSONB,
                expires_at   TIMESTAMPTZ,
                created_at   TIMESTAMPTZ,
                last_used_at TIMESTAMPTZ,
                is_active    BOOLEAN,
                created_by   UUID
            )
AS
$$
BEGIN
    -- Security check: Verify user has permission to view API keys for this account
    IF NOT (
        public.has_role_on_account(p_account_id)
        ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to view API keys for this account';
    END IF;

    -- Return API keys (without sensitive hash information)
    RETURN QUERY
        SELECT k.id,
               k.name,
               k.key_prefix::TEXT,
               k.scopes,
               k.expires_at,
               k.created_at,
               k.last_used_at,
               k.is_active,
               k.created_by
        FROM api_keys_private.api_keys k
        WHERE k.account_id = p_account_id
        ORDER BY k.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Revoke API Key
CREATE OR REPLACE FUNCTION public.revoke_api_key(
    p_api_key_id UUID
)
    RETURNS BOOLEAN AS
$$
DECLARE
    v_account_id UUID;
BEGIN
    -- Get the account ID for this API key
    SELECT account_id
    INTO v_account_id
    FROM api_keys_private.api_keys
    WHERE id = p_api_key_id;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'API key not found';
    END IF;

    -- Verify user is authorized to revoke API keys
    IF NOT (
        public.has_role_on_account(
                v_account_id
        )
        ) THEN
        RAISE EXCEPTION 'Unauthorized: You do not have permission to revoke API keys for this account';
    END IF;

    -- Revoke the API key
    UPDATE api_keys_private.api_keys
    SET is_active = FALSE
    WHERE id = p_api_key_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TYPE public.verify_api_key_response AS (
  valid BOOLEAN,
  api_key_id UUID,
  account_id UUID,
  error TEXT
);

-- Function 5: Verify API Key (for authentication)
CREATE OR REPLACE FUNCTION public.verify_api_key(
    p_api_key TEXT
)
    RETURNS verify_api_key_response AS
$$
DECLARE
    v_key_prefix TEXT;
    v_key_record RECORD;
    v_found      BOOLEAN := FALSE;
BEGIN
    -- Extract key prefix
    v_key_prefix := substring(p_api_key, 1, 7);

    -- Find potential matching keys by prefix
    FOR v_key_record IN
        SELECT id, key_hash, account_id, is_active, expires_at
        FROM api_keys_private.api_keys
        WHERE key_prefix = v_key_prefix
          AND is_active = TRUE
        LOOP
            -- Check if the key matches
            IF crypt(p_api_key, v_key_record.key_hash) = v_key_record.key_hash THEN
                v_found := TRUE;

                -- Check if expired
                IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
                    RETURN (FALSE, NULL, NULL, 'Invalid API key');
                END IF;

                -- Return success with key details
                RETURN (TRUE, v_key_record.id, v_key_record.account_id, NULL);
            END IF;
        END LOOP;

    -- If we get here, no matching key was found
    RETURN (FALSE, NULL, NULL, 'Invalid API key');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TYPE public.api_key_usage_log_response AS (
  success BOOLEAN,
  log_id UUID,
  timestamp TIMESTAMPTZ,
  error TEXT,
  error_code TEXT
);

-- Function 6: Log API Key Usage
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
  -- Update last_used_at timestamp
  UPDATE api_keys_private.api_keys
  SET last_used_at = v_current_time
  WHERE id = p_api_key_id;

  -- Insert usage log
  INSERT INTO api_keys_private.api_key_logs (
    api_key_id,
    endpoint,
    method,
    status_code,
    ip_address,
    user_agent,
    timestamp
  ) VALUES (
    p_api_key_id,
    p_endpoint,
    p_method,
    p_status_code,
    p_ip_address,
    p_user_agent,
    v_current_time
  )
  RETURNING id INTO v_log_id;

  RETURN (TRUE, v_log_id, v_current_time, NULL, NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN (FALSE, NULL, NULL, SQLERRM, SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 7: Has Scope (for RLS policies)
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
  -- Get API key ID from session variable
  v_api_key_id := auth.uid();

  IF v_api_key_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get scopes for the current API key
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

-- Function 8: Get API Key Account ID (for RLS policies)
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

    -- Get account_id for this API key
    SELECT account_id
    INTO v_account_id
    FROM api_keys_private.api_keys
    WHERE id = v_api_key_id
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > now());

    RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.create_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_api_key_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_api_key TO service_role, api_key;
GRANT EXECUTE ON FUNCTION public.has_scope TO api_key;
GRANT EXECUTE ON FUNCTION public.get_api_key_account_id TO api_key;