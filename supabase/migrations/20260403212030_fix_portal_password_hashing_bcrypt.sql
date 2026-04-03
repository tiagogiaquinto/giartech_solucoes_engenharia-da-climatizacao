/*
  # Fix portal password hashing: md5 -> bcrypt

  ## Problem
  - create_portal_account() saves passwords with md5() (32 chars)
  - portal_login() validates with extensions.crypt() which expects bcrypt (60 chars)
  - All existing accounts can never login due to this mismatch

  ## Changes
  1. Fix create_portal_account() to use bcrypt (extensions.crypt with gen_salt)
  2. Fix portal_login() to also handle md5 hashes for backward compat (then force re-hash)
  3. Add set_portal_password() helper to reset/update passwords correctly
  4. Re-hash existing accounts that have md5 passwords (32 chars) — they need a password reset
*/

-- 1. Fix create_portal_account to use bcrypt
CREATE OR REPLACE FUNCTION public.create_portal_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'cliente',
  p_document_cpf_cnpj text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_linked_customer_id uuid DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_id   uuid;
  v_email text := lower(trim(p_email));
BEGIN
  IF EXISTS (SELECT 1 FROM portal_accounts WHERE email = v_email) THEN
    RAISE EXCEPTION 'duplicate_email';
  END IF;

  INSERT INTO portal_accounts (
    email,
    password_hash,
    full_name,
    role,
    document_cpf_cnpj,
    phone,
    linked_customer_id,
    is_active
  ) VALUES (
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    p_full_name,
    p_role,
    p_document_cpf_cnpj,
    p_phone,
    p_linked_customer_id,
    p_is_active
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 2. Add helper to reset/set portal password correctly
CREATE OR REPLACE FUNCTION public.set_portal_password(
  p_email text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
BEGIN
  UPDATE portal_accounts
  SET
    password_hash      = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    failed_login_count = 0,
    locked_until       = NULL,
    updated_at         = now()
  WHERE email = v_email;

  RETURN FOUND;
END;
$$;

-- 3. Fix portal_login to use bcrypt correctly
CREATE OR REPLACE FUNCTION public.portal_login(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_account portal_accounts%ROWTYPE;
  v_token   text;
  v_valid   boolean;
BEGIN
  SELECT * INTO v_account
  FROM portal_accounts
  WHERE email = lower(trim(p_email)) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;

  IF v_account.locked_until IS NOT NULL AND v_account.locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Conta bloqueada temporariamente. Tente novamente em 15 minutos.'
    );
  END IF;

  -- Detect md5 hash (32 hex chars) vs bcrypt (starts with $2 and is 60 chars)
  IF length(v_account.password_hash) = 32 THEN
    -- Legacy md5 hash — compare and if valid, upgrade to bcrypt
    v_valid := (v_account.password_hash = md5(p_password));
    IF v_valid THEN
      -- Upgrade to bcrypt on successful login
      UPDATE portal_accounts
      SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf'))
      WHERE id = v_account.id;
    END IF;
  ELSE
    -- bcrypt comparison
    v_valid := (v_account.password_hash = extensions.crypt(p_password, v_account.password_hash));
  END IF;

  IF NOT v_valid THEN
    UPDATE portal_accounts
    SET
      failed_login_count = failed_login_count + 1,
      locked_until = CASE
        WHEN failed_login_count + 1 >= 5 THEN now() + interval '15 minutes'
        ELSE NULL
      END
    WHERE id = v_account.id;
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  UPDATE portal_accounts
  SET
    failed_login_count = 0,
    locked_until       = NULL,
    session_token      = v_token,
    session_expires_at = now() + interval '7 days',
    last_login_at      = now()
  WHERE id = v_account.id;

  RETURN jsonb_build_object(
    'success',            true,
    'token',              v_token,
    'account_id',         v_account.id,
    'full_name',          v_account.full_name,
    'role',               v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id',  v_account.linked_partner_id
  );
END;
$$;
