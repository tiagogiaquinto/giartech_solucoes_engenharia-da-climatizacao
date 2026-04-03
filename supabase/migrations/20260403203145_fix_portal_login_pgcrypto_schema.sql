/*
  # Fix portal_login and portal_validate_session functions

  ## Problem
  The pgcrypto extension (crypt, gen_salt, gen_random_bytes) is installed in the
  'extensions' schema, but the portal_login function calls crypt() without the
  schema prefix, causing "function crypt does not exist" errors.

  ## Changes
  1. Recreate portal_login with extensions.crypt() and extensions.gen_random_bytes()
  2. Recreate portal_validate_session (no changes needed but redeployed for consistency)
  3. Update the portal_accounts password hash using extensions.crypt()
*/

-- Recreate portal_login using fully-qualified pgcrypto functions
CREATE OR REPLACE FUNCTION portal_login(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_account portal_accounts%ROWTYPE;
  v_token   text;
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

  IF v_account.password_hash IS DISTINCT FROM extensions.crypt(p_password, v_account.password_hash) THEN
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
    failed_login_count   = 0,
    locked_until         = NULL,
    session_token        = v_token,
    session_expires_at   = now() + interval '7 days',
    last_login_at        = now()
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

-- Recreate portal_validate_session with correct search_path
CREATE OR REPLACE FUNCTION portal_validate_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_account portal_accounts%ROWTYPE;
BEGIN
  SELECT * INTO v_account
  FROM portal_accounts
  WHERE session_token = p_token
    AND session_expires_at > now()
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid',              true,
    'account_id',         v_account.id,
    'full_name',          v_account.full_name,
    'email',              v_account.email,
    'role',               v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id',  v_account.linked_partner_id
  );
END;
$$;

-- Update the password hash for giartechsolucoes@gmail.com using correct schema
UPDATE portal_accounts
SET
  password_hash      = extensions.crypt('rian0812', extensions.gen_salt('bf')),
  failed_login_count = 0,
  locked_until       = NULL,
  is_active          = true
WHERE email = 'giartechsolucoes@gmail.com';
