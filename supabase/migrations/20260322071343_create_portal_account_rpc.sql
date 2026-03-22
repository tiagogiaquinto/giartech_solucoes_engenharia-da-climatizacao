/*
  # Create portal_account RPC helper

  Adds a server-side function to create portal accounts (cliente or parceiro)
  with the password correctly hashed via MD5, matching what portal_login expects.

  ## New Functions
  - `create_portal_account(email, password, full_name, role, document_cpf_cnpj, phone, linked_customer_id, is_active)`
    Returns the new account id on success, or raises an exception on duplicate email.
  
  ## Security
  - SECURITY DEFINER so anon/authenticated can call it without direct INSERT rights
  - search_path fixed to public
*/

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
SET search_path = public
AS $$
DECLARE
  v_id uuid;
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
    md5(p_password),
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

GRANT EXECUTE ON FUNCTION public.create_portal_account TO anon, authenticated;
