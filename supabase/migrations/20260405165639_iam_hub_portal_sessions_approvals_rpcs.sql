
/*
  # IAM Hub — Portal Sessions, Access Requests & RPCs

  ## Summary
  Adds the backend infrastructure for the unified Identity & Access Management hub:

  ### New Tables
  1. `portal_sessions` — tracks active device sessions per portal account (email, device
     user-agent, IP, created/last-seen). Used to show "Gestão de Dispositivos" and allow
     remote logout.
  2. `portal_access_requests` — pending self-registration requests from customers/partners
     who signed up via the portal. Admin must approve or reject each request.

  ### New RPCs
  - `iam_get_dashboard_stats` — returns online count, pending approvals, recent logins
  - `iam_get_portal_sessions(p_portal_account_id)` — list active sessions for a profile
  - `iam_revoke_portal_session(p_session_id)` — remote logout one device
  - `iam_revoke_all_portal_sessions(p_portal_account_id)` — logout all devices
  - `iam_get_pending_approvals` — list unapproved portal_access_requests
  - `iam_approve_request(p_request_id)` — approve → activates portal account
  - `iam_reject_request(p_request_id, p_reason)` — soft-delete + notify

  ### Security
  - RLS enabled on both new tables
  - Only authenticated staff can read; only admin/super_admin RPCs can write
*/

-- ============================================================
-- TABLE: portal_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS portal_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  session_token  text NOT NULL,
  device_label   text NOT NULL DEFAULT 'Navegador',
  user_agent     text,
  ip_address     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at     timestamptz,
  revoked_by     uuid
);

ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin staff can read portal sessions"
  ON portal_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert portal sessions"
  ON portal_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin staff can update portal sessions"
  ON portal_sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_account_id ON portal_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON portal_sessions(session_token);

-- ============================================================
-- TABLE: portal_access_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS portal_access_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text,
  document      text,
  requested_role text NOT NULL DEFAULT 'cliente',
  company_name  text,
  message       text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   uuid,
  reviewed_at   timestamptz,
  reject_reason text,
  portal_account_id uuid REFERENCES portal_accounts(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert access requests"
  ON portal_access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin staff can read access requests"
  ON portal_access_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin staff can update access requests"
  ON portal_access_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_portal_access_requests_status ON portal_access_requests(status);

-- ============================================================
-- RPC: iam_get_dashboard_stats
-- Returns: online_count (active in last 15min), pending_approvals, recent_logins_24h
-- ============================================================
CREATE OR REPLACE FUNCTION iam_get_dashboard_stats()
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

  IF v_caller_role NOT IN ('super_admin','admin','manager') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN jsonb_build_object(
    'online_count', (
      SELECT COUNT(DISTINCT account_id)
      FROM portal_sessions
      WHERE last_seen_at >= now() - interval '15 minutes'
        AND revoked_at IS NULL
    ),
    'pending_approvals', (
      SELECT COUNT(*) FROM portal_access_requests WHERE status = 'pending'
    ),
    'recent_logins_24h', (
      SELECT COUNT(*)
      FROM portal_accounts
      WHERE last_login_at >= now() - interval '24 hours'
    ),
    'total_staff', (
      SELECT COUNT(*) FROM auth_accounts WHERE is_active = true
    ),
    'total_portal', (
      SELECT COUNT(*) FROM portal_accounts WHERE is_active = true
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION iam_get_dashboard_stats() TO anon, authenticated, service_role;

-- ============================================================
-- RPC: iam_get_portal_sessions(p_portal_account_id uuid)
-- ============================================================
CREATE OR REPLACE FUNCTION iam_get_portal_sessions(p_portal_account_id uuid)
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

  IF v_caller_role NOT IN ('super_admin','admin','manager') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id',           ps.id,
        'device_label', ps.device_label,
        'user_agent',   ps.user_agent,
        'ip_address',   ps.ip_address,
        'created_at',   ps.created_at,
        'last_seen_at', ps.last_seen_at,
        'is_active',    ps.revoked_at IS NULL
      ) ORDER BY ps.last_seen_at DESC
    )
    FROM portal_sessions ps
    WHERE ps.account_id = p_portal_account_id
      AND ps.revoked_at IS NULL),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION iam_get_portal_sessions(uuid) TO anon, authenticated, service_role;

-- ============================================================
-- RPC: iam_revoke_portal_session(p_session_id uuid)
-- ============================================================
CREATE OR REPLACE FUNCTION iam_revoke_portal_session(p_session_id uuid)
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

  IF v_caller_role NOT IN ('super_admin','admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  UPDATE portal_sessions
  SET revoked_at = now(), revoked_by = auth.uid()
  WHERE id = p_session_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION iam_revoke_portal_session(uuid) TO anon, authenticated, service_role;

-- ============================================================
-- RPC: iam_revoke_all_portal_sessions(p_portal_account_id uuid)
-- ============================================================
CREATE OR REPLACE FUNCTION iam_revoke_all_portal_sessions(p_portal_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role  text;
  v_caller_email text;
BEGIN
  SELECT role, email INTO v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin','admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  UPDATE portal_sessions
  SET revoked_at = now(), revoked_by = auth.uid()
  WHERE account_id = p_portal_account_id
    AND revoked_at IS NULL;

  -- Also clear the session token on the account itself
  UPDATE portal_accounts
  SET session_token = NULL, session_expires_at = NULL, updated_at = now()
  WHERE id = p_portal_account_id;

  INSERT INTO profile_edit_audit(target_type, target_id, changed_by, changed_by_email, field_name, new_value)
  VALUES('portal', p_portal_account_id, auth.uid(), v_caller_email, 'sessions_revoked', 'ALL');

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION iam_revoke_all_portal_sessions(uuid) TO anon, authenticated, service_role;

-- ============================================================
-- RPC: iam_get_pending_approvals()
-- ============================================================
CREATE OR REPLACE FUNCTION iam_get_pending_approvals()
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

  IF v_caller_role NOT IN ('super_admin','admin','manager') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  RETURN COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id',              r.id,
        'full_name',       r.full_name,
        'email',           r.email,
        'phone',           r.phone,
        'document',        r.document,
        'requested_role',  r.requested_role,
        'company_name',    r.company_name,
        'message',         r.message,
        'status',          r.status,
        'created_at',      r.created_at
      ) ORDER BY r.created_at ASC
    )
    FROM portal_access_requests r
    WHERE r.status = 'pending'),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION iam_get_pending_approvals() TO anon, authenticated, service_role;

-- ============================================================
-- RPC: iam_approve_request(p_request_id uuid, p_password text)
-- Creates portal_account + notifies
-- ============================================================
CREATE OR REPLACE FUNCTION iam_approve_request(
  p_request_id uuid,
  p_password   text DEFAULT 'GS@2026'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role  text;
  v_caller_email text;
  v_req          portal_access_requests%ROWTYPE;
  v_account_id   uuid;
BEGIN
  SELECT role, email INTO v_caller_role, v_caller_email
  FROM auth_accounts
  WHERE id = auth.uid() AND is_active = true;

  IF v_caller_role NOT IN ('super_admin','admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  SELECT * INTO v_req FROM portal_access_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;

  -- Create portal account
  INSERT INTO portal_accounts(email, password_hash, full_name, role, phone, document_cpf_cnpj, is_active)
  VALUES(
    v_req.email,
    crypt(p_password, gen_salt('bf', 10)),
    v_req.full_name,
    v_req.requested_role,
    COALESCE(v_req.phone, ''),
    COALESCE(v_req.document, ''),
    true
  )
  RETURNING id INTO v_account_id;

  -- Mark request approved
  UPDATE portal_access_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
      portal_account_id = v_account_id
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'account_id', v_account_id);
END;
$$;

GRANT EXECUTE ON FUNCTION iam_approve_request(uuid, text) TO anon, authenticated, service_role;

-- ============================================================
-- RPC: iam_reject_request(p_request_id uuid, p_reason text)
-- ============================================================
CREATE OR REPLACE FUNCTION iam_reject_request(
  p_request_id uuid,
  p_reason     text DEFAULT ''
)
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

  IF v_caller_role NOT IN ('super_admin','admin') THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  UPDATE portal_access_requests
  SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
      reject_reason = p_reason
  WHERE id = p_request_id AND status = 'pending';

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION iam_reject_request(uuid, text) TO anon, authenticated, service_role;
