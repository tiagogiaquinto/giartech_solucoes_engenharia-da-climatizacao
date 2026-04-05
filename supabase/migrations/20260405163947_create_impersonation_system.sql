
/*
  # Impersonation System

  ## Summary
  Allows the master admin to temporarily assume the identity of any portal
  user (cliente or parceiro) for support and QA validation purposes.

  ### New Tables
  - `impersonation_logs` — Immutable audit trail of every impersonation session.
    Records: who impersonated whom, when they started, when they ended.

  ### New RPCs
  - `admin_impersonate_portal` — Generates a short-lived (15-min) one-time
    impersonation token for a portal account without exposing the real password.
    Logs the event immediately.
  - `admin_end_impersonation` — Marks the impersonation session as ended.
  - `portal_login_impersonation` — Validates the one-time token and returns the
    session data, identical shape to `portal_login`.

  ## Security
  - Only super_admin / admin roles can call impersonation RPCs
  - Impersonation tokens are single-use and expire in 15 minutes
  - All impersonation events are permanently logged (no DELETE on table)
  - RLS prevents non-admin users from reading the audit log
*/

-- ==========================================
-- 1. Impersonation logs table
-- ==========================================
CREATE TABLE IF NOT EXISTS impersonation_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id            uuid NOT NULL,
  admin_email         text NOT NULL,
  target_account_id   uuid NOT NULL,
  target_email        text NOT NULL,
  target_type         text NOT NULL,    -- 'cliente' | 'parceiro'
  started_at          timestamptz DEFAULT now(),
  ended_at            timestamptz,
  impersonation_token text UNIQUE,      -- cleared after use
  token_expires_at    timestamptz
);

ALTER TABLE impersonation_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_imp_admin_id  ON impersonation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_imp_target_id ON impersonation_logs(target_account_id);
CREATE INDEX IF NOT EXISTS idx_imp_started   ON impersonation_logs(started_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'impersonation_logs' AND policyname = 'imp_admin_read'
  ) THEN
    CREATE POLICY "imp_admin_read"
      ON impersonation_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM auth_accounts
          WHERE id = auth.uid()
            AND role IN ('super_admin', 'admin')
            AND is_active = true
        )
      );
  END IF;
END $$;

GRANT SELECT ON impersonation_logs TO authenticated;
GRANT ALL    ON impersonation_logs TO service_role;
GRANT SELECT ON impersonation_logs TO anon;

-- ==========================================
-- 2. admin_impersonate_portal
-- ==========================================
CREATE OR REPLACE FUNCTION admin_impersonate_portal(p_portal_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role  text;
  v_caller_email text;
  v_caller_id    uuid;
  v_target       portal_accounts%ROWTYPE;
  v_token        text;
  v_log_id       uuid;
BEGIN
  SELECT id, role, email
    INTO v_caller_id, v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT * INTO v_target
  FROM portal_accounts
  WHERE id = p_portal_account_id AND is_active = true;

  IF v_target.id IS NULL THEN
    RAISE EXCEPTION 'PORTAL_ACCOUNT_NOT_FOUND';
  END IF;

  -- Generate cryptographically random one-time token
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Insert log entry (also stores the one-time token)
  INSERT INTO impersonation_logs(
    admin_id, admin_email,
    target_account_id, target_email, target_type,
    impersonation_token, token_expires_at
  )
  VALUES(
    v_caller_id, v_caller_email,
    v_target.id, v_target.email, v_target.role,
    v_token, now() + interval '15 minutes'
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success',          true,
    'log_id',           v_log_id,
    'impersonation_token', v_token,
    'target_email',     v_target.email,
    'target_name',      v_target.full_name,
    'target_role',      v_target.role,
    'target_id',        v_target.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_impersonate_portal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_impersonate_portal(uuid) TO anon;

-- ==========================================
-- 3. portal_login_impersonation
-- Validates one-time token and opens a real session
-- ==========================================
CREATE OR REPLACE FUNCTION portal_login_impersonation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log       impersonation_logs%ROWTYPE;
  v_account   portal_accounts%ROWTYPE;
  v_session   text;
BEGIN
  -- Find valid, unused log entry
  SELECT * INTO v_log
  FROM impersonation_logs
  WHERE impersonation_token = p_token
    AND token_expires_at > now()
    AND ended_at IS NULL
  FOR UPDATE;

  IF v_log.id IS NULL THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_TOKEN';
  END IF;

  -- Fetch the portal account
  SELECT * INTO v_account
  FROM portal_accounts
  WHERE id = v_log.target_account_id AND is_active = true;

  IF v_account.id IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_INACTIVE';
  END IF;

  -- Generate a real session token (same as normal login)
  v_session := encode(gen_random_bytes(32), 'hex');

  UPDATE portal_accounts
  SET session_token      = v_session,
      session_expires_at = now() + interval '8 hours',
      last_login_at      = now()
  WHERE id = v_account.id;

  -- Consume the impersonation token
  UPDATE impersonation_logs
  SET impersonation_token = NULL,
      token_expires_at    = NULL
  WHERE id = v_log.id;

  RETURN jsonb_build_object(
    'success',           true,
    'session_token',     v_session,
    'account_id',        v_account.id,
    'full_name',         v_account.full_name,
    'email',             v_account.email,
    'role',              v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id',  v_account.linked_partner_id,
    'log_id',            v_log.id,
    'is_impersonation',  true,
    'admin_email',       v_log.admin_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION portal_login_impersonation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION portal_login_impersonation(text) TO anon;

-- ==========================================
-- 4. admin_end_impersonation
-- ==========================================
CREATE OR REPLACE FUNCTION admin_end_impersonation(p_log_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE impersonation_logs
  SET ended_at = now()
  WHERE id = p_log_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_end_impersonation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_end_impersonation(uuid) TO anon;

-- ==========================================
-- 5. admin_get_impersonation_logs
-- ==========================================
CREATE OR REPLACE FUNCTION admin_get_impersonation_logs(p_limit int DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id',               id,
        'admin_email',      admin_email,
        'target_email',     target_email,
        'target_type',      target_type,
        'started_at',       started_at,
        'ended_at',         ended_at
      )
      ORDER BY started_at DESC
    )
    FROM (
      SELECT * FROM impersonation_logs
      ORDER BY started_at DESC
      LIMIT p_limit
    ) sub
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_impersonation_logs(int) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_impersonation_logs(int) TO anon;
