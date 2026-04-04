/*
  # Senha Padrão GS2026 para Portais de Cliente e Parceiro

  ## Resumo
  Define a senha padrão "GS2026" para todos os acessos de portal (cliente e parceiro).

  ## Mudanças
  1. Redefine a senha de todas as contas de portal existentes para "GS2026" (hash bcrypt)
  2. Atualiza create_portal_account() para usar "GS2026" como senha padrão quando nenhuma for informada
  3. Adiciona função reset_all_portal_passwords_to_default() para uso administrativo futuro

  ## Notas
  - Contas com senha personalizada também serão redefinidas para o padrão
  - O administrador pode alterar senhas individualmente via set_portal_password()
*/

-- 1. Redefine todas as senhas de portal existentes para GS2026
UPDATE portal_accounts
SET
  password_hash      = extensions.crypt('GS2026', extensions.gen_salt('bf')),
  failed_login_count = 0,
  locked_until       = NULL,
  updated_at         = now();

-- 2. Atualiza create_portal_account para usar GS2026 como senha padrão
CREATE OR REPLACE FUNCTION public.create_portal_account(
  p_email text,
  p_password text DEFAULT 'GS2026',
  p_full_name text DEFAULT '',
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
  v_id    uuid;
  v_email text := lower(trim(p_email));
  v_pass  text := CASE WHEN p_password IS NULL OR trim(p_password) = '' THEN 'GS2026' ELSE p_password END;
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
    extensions.crypt(v_pass, extensions.gen_salt('bf')),
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

-- 3. Função administrativa para resetar todas as senhas para o padrão
CREATE OR REPLACE FUNCTION public.reset_all_portal_passwords_to_default()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE portal_accounts
  SET
    password_hash      = extensions.crypt('GS2026', extensions.gen_salt('bf')),
    failed_login_count = 0,
    locked_until       = NULL,
    updated_at         = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_all_portal_passwords_to_default() TO authenticated;
