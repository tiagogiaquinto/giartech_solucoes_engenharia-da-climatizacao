/*
  # Corrigir trigger antigo e criar Super Admin

  Remove o trigger antigo que conflitava com a tabela user_profiles,
  substitui pelo novo handle_new_auth_user_account, e insere o Super Admin.
*/

-- Remover trigger antigo com referência incorreta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  IF NEW.email = 'diretor.giartechsolucoes@gmail.com' THEN
    v_role := 'super_admin';
  ELSE
    v_role := 'viewer';
  END IF;

  INSERT INTO public.auth_accounts (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;

-- Agora inserir o Super Admin
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'diretor.giartechsolucoes@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, aud, role,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'diretor.giartechsolucoes@gmail.com',
      crypt('rian0812', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Diretor"}',
      now(), now(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('rian0812', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.auth_accounts (id, email, full_name, role, is_active)
  VALUES (v_user_id, 'diretor.giartechsolucoes@gmail.com', 'Diretor', 'super_admin', true)
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    updated_at = now();
END $$;
