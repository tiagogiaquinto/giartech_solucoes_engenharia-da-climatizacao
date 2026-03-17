/*
  # Sistema de Autenticação e Permissões por Módulo

  ## Resumo
  Cria a estrutura de permissões vinculada ao Supabase Auth para controle de acesso
  granular por módulo/aba do sistema.

  ## Novas Tabelas
  - `user_profiles` — perfil do usuário vinculado a auth.users
    - `id` (uuid, PK, FK → auth.users)
    - `email` (text)
    - `full_name` (text)
    - `role` ('super_admin' | 'admin' | 'manager' | 'technician' | 'sales' | 'financial' | 'viewer')
    - `is_active` (boolean)
    - `invited_by` (uuid, FK → auth.users)
    - `created_at`, `updated_at`

  - `module_permissions` — permissões por usuário e módulo
    - `id` (uuid, PK)
    - `user_id` (uuid, FK → user_profiles)
    - `module_code` (text) — código do módulo (ex: 'financeiro', 'crm', 'estoque')
    - `can_view` (boolean)
    - `can_create` (boolean)
    - `can_edit` (boolean)
    - `can_delete` (boolean)

  ## Segurança
  - RLS habilitado em ambas as tabelas
  - Super admin (diretor.giartechsolucoes@gmail.com) tem acesso total
  - Usuários comuns só leem o próprio perfil e permissões
  - Apenas super_admin pode gerenciar outros usuários
*/

-- Tabela de perfis de usuários vinculada ao Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('super_admin','admin','manager','technician','sales','financial','viewer')),
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê/atualiza o próprio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admin lê todos os perfis
CREATE POLICY "Super admin reads all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- Super admin insere novos perfis
CREATE POLICY "Super admin inserts profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- Super admin atualiza qualquer perfil
CREATE POLICY "Super admin updates any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- Tabela de permissões por módulo
CREATE TABLE IF NOT EXISTS module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  module_code text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  can_create boolean NOT NULL DEFAULT true,
  can_edit boolean NOT NULL DEFAULT true,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_code)
);

ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- Usuário lê as próprias permissões
CREATE POLICY "Users can read own permissions"
  ON module_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Super admin lê todas as permissões
CREATE POLICY "Super admin reads all permissions"
  ON module_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- Super admin gerencia permissões (insert/update/delete)
CREATE POLICY "Super admin inserts permissions"
  ON module_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin updates permissions"
  ON module_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin deletes permissions"
  ON module_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'super_admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_module_permissions_updated_at ON module_permissions;
CREATE TRIGGER set_module_permissions_updated_at
  BEFORE UPDATE ON module_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar perfil automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Super admin padrão
  IF NEW.email = 'diretor.giartechsolucoes@gmail.com' THEN
    v_role := 'super_admin';
  ELSE
    v_role := 'viewer';
  END IF;

  INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_module_permissions_user_id ON module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_permissions_module_code ON module_permissions(module_code);

-- Função auxiliar: retorna permissões do usuário atual como JSON
CREATE OR REPLACE FUNCTION get_my_permissions()
RETURNS TABLE(module_code text, can_view boolean, can_create boolean, can_edit boolean, can_delete boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admin tem tudo
  IF EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RETURN QUERY
      SELECT m as module_code, true, true, true, true
      FROM unnest(ARRAY[
        'dashboard','agenda','clientes','crm','mensagens_crm','gamificacao',
        'fornecedores','compras','service_orders','rotas','financeiro',
        'salarios','metas','documentos','relatorios','catalogo','estoque',
        'automacoes','thomaz','email','biblioteca','pessoas','auditoria',
        'templates','configuracoes','team_management'
      ]) AS m;
    RETURN;
  END IF;

  RETURN QUERY
    SELECT mp.module_code, mp.can_view, mp.can_create, mp.can_edit, mp.can_delete
    FROM module_permissions mp
    WHERE mp.user_id = auth.uid();
END;
$$;
