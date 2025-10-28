/*
  # Sistema de Autenticação - COM MD5 NATIVO
*/

-- Recriar super admin com MD5
UPDATE user_accounts
SET password_hash = md5('Ri@n0812' || 'giartech_salt'),
    access_level = 'super_admin',
    is_active = true
WHERE email = 'diretor@giartechsolucoes.com.br';

-- Função: Login com MD5
CREATE OR REPLACE FUNCTION login_user(p_email text, p_pwd text) 
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE 
  v_user record;
  v_sess record;
  v_hash text;
BEGIN
  v_hash := md5(p_pwd || 'giartech_salt');
  
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
    'can_view_financial', v_user.can_view_financial
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
  
  v_hash := md5(p_pwd || 'giartech_salt');
  
  INSERT INTO user_accounts(email,password_hash,full_name,access_level,is_active,is_email_verified,invited_by)
  VALUES(v_inv.email,v_hash,v_inv.full_name,v_inv.access_level,true,true,v_inv.invited_by)
  RETURNING id INTO v_user_id;
  
  UPDATE user_invitations SET status='accepted' WHERE id=v_inv.id;
  
  RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'email', v_inv.email);
END;
$$;

-- Testar login
SELECT login_user('diretor@giartechsolucoes.com.br', 'Ri@n0812');

COMMENT ON FUNCTION login_user IS '✅ ATIVO - Autenticação funcional';
COMMENT ON FUNCTION invite_user IS '✅ ATIVO - Sistema de convites funcionando';
COMMENT ON FUNCTION accept_invitation IS '✅ ATIVO - Aceitar convites e criar conta';
