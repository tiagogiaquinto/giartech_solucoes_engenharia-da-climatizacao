/*
  # Funções de Autenticação - FINAIS E FUNCIONAIS
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabelas auxiliares
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

CREATE TABLE user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  access_level text DEFAULT 'user',
  invitation_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text DEFAULT 'pending',
  invited_by uuid,
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz DEFAULT now() + interval '24 hours',
  created_at timestamptz DEFAULT now()
);

-- Função: Login
CREATE OR REPLACE FUNCTION login_user(p_email text, p_pwd text) 
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE 
  v_user record;
  v_sess record;
  v_hash text;
BEGIN
  v_hash := encode(digest(p_pwd || 'giartech', 'sha256'), 'hex');
  
  SELECT * INTO v_user FROM user_accounts 
  WHERE email=p_email AND password_hash=v_hash AND is_active=true AND deleted_at IS NULL;
  
  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;
  
  INSERT INTO user_sessions(user_id) VALUES(v_user.id) RETURNING * INTO v_sess;
  UPDATE user_accounts SET last_login_at=now() WHERE id=v_user.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'token', v_sess.session_token,
    'access_level', v_user.access_level,
    'name', v_user.full_name,
    'email', v_user.email,
    'can_invite_users', v_user.can_invite_users,
    'can_view_financial', v_user.can_view_financial,
    'can_edit_financial', v_user.can_edit_financial
  );
END;
$$;

-- Função: Enviar Convite
CREATE OR REPLACE FUNCTION invite_user(p_email text, p_name text, p_level text, p_by uuid) 
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_inv record;
BEGIN
  IF EXISTS(SELECT 1 FROM user_accounts WHERE email=p_email) THEN 
    RETURN jsonb_build_object('success', false, 'error', 'Email já cadastrado');
  END IF;
  
  INSERT INTO user_invitations(email,full_name,access_level,invited_by) 
  VALUES(p_email,p_name,p_level,p_by) 
  RETURNING * INTO v_inv;
  
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_inv.id,
    'token', v_inv.invitation_token,
    'email', v_inv.email,
    'expires_at', v_inv.expires_at
  );
END;
$$;

-- Função: Aceitar Convite
CREATE OR REPLACE FUNCTION accept_invitation(p_token text, p_pwd text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE 
  v_inv record;
  v_user_id uuid;
  v_hash text;
BEGIN
  SELECT * INTO v_inv FROM user_invitations 
  WHERE invitation_token=p_token AND status='pending' AND expires_at>now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido ou expirado');
  END IF;
  
  v_hash := encode(digest(p_pwd || 'giartech', 'sha256'), 'hex');
  
  INSERT INTO user_accounts(email,password_hash,full_name,access_level,is_active,is_email_verified,invited_by)
  VALUES(v_inv.email,v_hash,v_inv.full_name,v_inv.access_level,true,true,v_inv.invited_by)
  RETURNING id INTO v_user_id;
  
  UPDATE user_invitations SET status='accepted' WHERE id=v_inv.id;
  
  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'email', v_inv.email);
END;
$$;

-- Função: Listar Usuários  
CREATE OR REPLACE FUNCTION list_users()
RETURNS TABLE(
  id uuid, email text, full_name text, access_level text,
  is_active boolean, last_login_at timestamptz, created_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT id,email,full_name,access_level,is_active,last_login_at,created_at
  FROM user_accounts WHERE deleted_at IS NULL ORDER BY created_at DESC;
$$;

-- Função: Listar Convites Pendentes
CREATE OR REPLACE FUNCTION list_invitations()
RETURNS TABLE(
  id uuid, email text, full_name text, access_level text,
  invited_at timestamptz, expires_at timestamptz
) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT id,email,full_name,access_level,created_at,expires_at
  FROM user_invitations WHERE status='pending' AND expires_at>now() ORDER BY created_at DESC;
$$;

-- RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_users" ON user_accounts;
CREATE POLICY "allow_all_users" ON user_accounts FOR ALL TO anon,authenticated USING(true);

DROP POLICY IF EXISTS "allow_all_inv" ON user_invitations;
CREATE POLICY "allow_all_inv" ON user_invitations FOR ALL TO anon,authenticated USING(true);

DROP POLICY IF EXISTS "allow_all_sess" ON user_sessions;
CREATE POLICY "allow_all_sess" ON user_sessions FOR ALL TO anon,authenticated USING(true);

-- Comentários
COMMENT ON FUNCTION login_user IS '✅ ATIVO - login_user(email, senha) retorna token e dados';
COMMENT ON FUNCTION invite_user IS '✅ ATIVO - invite_user(email, nome, nivel, convidado_por_id)';
COMMENT ON FUNCTION accept_invitation IS '✅ ATIVO - accept_invitation(token, senha)';
COMMENT ON FUNCTION list_users IS '✅ ATIVO - Listar todos os usuários';
COMMENT ON FUNCTION list_invitations IS '✅ ATIVO - Listar convites pendentes';
COMMENT ON TABLE user_invitations IS '✅ ATIVO - Sistema de convites por e-mail';
COMMENT ON TABLE user_sessions IS '✅ ATIVO - Sessões de usuários';
