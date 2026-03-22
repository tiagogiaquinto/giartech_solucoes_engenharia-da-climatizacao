/*
  # Fix portal_login and portal_validate_session functions

  The gen_random_bytes function lives in the `extensions` schema (pgcrypto),
  not in the default search_path. This fix uses gen_random_uuid()::text as a
  secure-enough session token generator which is always available, avoiding
  the schema resolution issue entirely.

  ## Changes
  - Recreate portal_login using gen_random_uuid() instead of gen_random_bytes()
  - Recreate portal_validate_session to stay consistent
*/

CREATE OR REPLACE FUNCTION public.portal_login(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account portal_accounts%ROWTYPE;
  v_token text;
BEGIN
  SELECT * INTO v_account
  FROM portal_accounts
  WHERE email = lower(trim(p_email)) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;

  IF v_account.password_hash <> md5(p_password) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;

  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  UPDATE portal_accounts SET
    session_token = v_token,
    session_expires_at = now() + interval '8 hours',
    last_login_at = now()
  WHERE id = v_account.id;

  RETURN jsonb_build_object(
    'success', true,
    'token', v_token,
    'account_id', v_account.id,
    'full_name', v_account.full_name,
    'role', v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id', v_account.linked_partner_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_validate_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  UPDATE portal_accounts
  SET session_expires_at = now() + interval '8 hours'
  WHERE id = v_account.id;

  RETURN jsonb_build_object(
    'valid', true,
    'account_id', v_account.id,
    'full_name', v_account.full_name,
    'email', v_account.email,
    'role', v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id', v_account.linked_partner_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.portal_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_validate_session TO anon, authenticated;
