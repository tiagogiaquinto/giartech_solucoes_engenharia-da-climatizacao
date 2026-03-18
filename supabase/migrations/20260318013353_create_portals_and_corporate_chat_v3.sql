/*
  # Sistema de Portais Externos e Chat Corporativo v3

  ## Descrição
  Portal do Cliente, Portal do Parceiro e Chat Corporativo interno.
  Usa nomes alternativos para evitar conflito com tabelas existentes.
*/

-- Contas de portais externos
CREATE TABLE IF NOT EXISTS portal_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente', 'parceiro')),
  linked_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  linked_partner_id uuid,
  document_cpf_cnpj text DEFAULT '',
  phone text DEFAULT '',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  session_token text,
  session_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portal_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pa_sel_anon" ON portal_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "pa_sel_auth" ON portal_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "pa_upd_anon" ON portal_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pa_ins_auth" ON portal_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pa_upd_auth" ON portal_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON portal_accounts TO anon, authenticated;

-- Indicações de parceiros
CREATE TABLE IF NOT EXISTS partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_document text DEFAULT '',
  customer_phone text DEFAULT '',
  commission_type text NOT NULL DEFAULT 'fixed' CHECK (commission_type IN ('fixed', 'percentage')),
  commission_value numeric(15,2) DEFAULT 0,
  commission_paid boolean DEFAULT false,
  commission_paid_at timestamptz,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_sel_auth" ON partner_referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "pr_sel_anon" ON partner_referrals FOR SELECT TO anon USING (true);
CREATE POLICY "pr_ins_auth" ON partner_referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pr_ins_anon" ON partner_referrals FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "pr_upd_auth" ON partner_referrals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON partner_referrals TO anon, authenticated;

-- Solicitações via portal do cliente
CREATE TABLE IF NOT EXISTS portal_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_account_id uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  status text NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'em_analise', 'aprovado', 'em_andamento', 'concluido', 'cancelado')),
  photos jsonb DEFAULT '[]'::jsonb,
  generated_os_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  internal_notes text DEFAULT '',
  attended_by uuid,
  attended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portal_service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psr_sel_auth" ON portal_service_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "psr_sel_anon" ON portal_service_requests FOR SELECT TO anon USING (true);
CREATE POLICY "psr_ins_anon" ON portal_service_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "psr_ins_auth" ON portal_service_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "psr_upd_auth" ON portal_service_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "psr_upd_anon" ON portal_service_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT ALL ON portal_service_requests TO anon, authenticated;

-- Canais do chat corporativo interno
CREATE TABLE IF NOT EXISTS corp_chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type text NOT NULL DEFAULT 'direct' CHECK (channel_type IN ('direct', 'os', 'group')),
  name text DEFAULT '',
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  created_by uuid,
  is_active boolean DEFAULT true,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE corp_chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccc_sel_auth" ON corp_chat_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "ccc_ins_auth" ON corp_chat_channels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ccc_upd_auth" ON corp_chat_channels FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ccc_sel_anon" ON corp_chat_channels FOR SELECT TO anon USING (true);
CREATE POLICY "ccc_ins_anon" ON corp_chat_channels FOR INSERT TO anon WITH CHECK (true);
GRANT ALL ON corp_chat_channels TO anon, authenticated;

-- Membros dos canais
CREATE TABLE IF NOT EXISTS corp_chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES corp_chat_channels(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text NOT NULL DEFAULT '',
  user_role text NOT NULL DEFAULT 'member' CHECK (user_role IN ('admin', 'member')),
  last_read_at timestamptz,
  joined_at timestamptz DEFAULT now()
);

ALTER TABLE corp_chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccm_sel_auth" ON corp_chat_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "ccm_ins_auth" ON corp_chat_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ccm_upd_auth" ON corp_chat_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ccm_sel_anon" ON corp_chat_members FOR SELECT TO anon USING (true);
CREATE POLICY "ccm_ins_anon" ON corp_chat_members FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ccm_upd_anon" ON corp_chat_members FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT ALL ON corp_chat_members TO anon, authenticated;

-- Mensagens do chat corporativo
CREATE TABLE IF NOT EXISTS corp_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES corp_chat_channels(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_name text NOT NULL DEFAULT '',
  sender_role text NOT NULL DEFAULT 'funcionario'
    CHECK (sender_role IN ('admin', 'manager', 'funcionario', 'tecnico')),
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  content text NOT NULL DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  reply_to_id uuid REFERENCES corp_chat_messages(id) ON DELETE SET NULL,
  is_edited boolean DEFAULT false,
  edited_at timestamptz,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE corp_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccmsg_sel_auth" ON corp_chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "ccmsg_ins_auth" ON corp_chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ccmsg_upd_auth" ON corp_chat_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ccmsg_sel_anon" ON corp_chat_messages FOR SELECT TO anon USING (true);
CREATE POLICY "ccmsg_ins_anon" ON corp_chat_messages FOR INSERT TO anon WITH CHECK (true);
GRANT ALL ON corp_chat_messages TO anon, authenticated;

-- Índices
CREATE INDEX IF NOT EXISTS idx_portal_accounts_email ON portal_accounts(email);
CREATE INDEX IF NOT EXISTS idx_portal_accounts_role ON portal_accounts(role);
CREATE INDEX IF NOT EXISTS idx_portal_accounts_customer ON portal_accounts(linked_customer_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner ON partner_referrals(partner_account_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_os ON partner_referrals(service_order_id);
CREATE INDEX IF NOT EXISTS idx_portal_requests_account ON portal_service_requests(portal_account_id);
CREATE INDEX IF NOT EXISTS idx_corp_channels_os ON corp_chat_channels(service_order_id);
CREATE INDEX IF NOT EXISTS idx_corp_channels_type ON corp_chat_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_corp_messages_channel ON corp_chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_corp_messages_created ON corp_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_corp_members_channel ON corp_chat_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_corp_members_user ON corp_chat_members(user_id);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE corp_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE corp_chat_channels;

-- Função de login do portal
CREATE OR REPLACE FUNCTION portal_login(p_email text, p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account portal_accounts%ROWTYPE;
  v_token text;
BEGIN
  SELECT * INTO v_account FROM portal_accounts
  WHERE email = lower(trim(p_email)) AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;
  IF v_account.password_hash <> md5(p_password) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Credenciais inválidas');
  END IF;
  v_token := encode(gen_random_bytes(32), 'hex');
  UPDATE portal_accounts SET
    session_token = v_token,
    session_expires_at = now() + interval '8 hours',
    last_login_at = now()
  WHERE id = v_account.id;
  RETURN jsonb_build_object(
    'success', true, 'token', v_token,
    'account_id', v_account.id, 'full_name', v_account.full_name,
    'role', v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id', v_account.linked_partner_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION portal_login TO anon, authenticated;

-- Validar sessão
CREATE OR REPLACE FUNCTION portal_validate_session(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_account portal_accounts%ROWTYPE;
BEGIN
  SELECT * INTO v_account FROM portal_accounts
  WHERE session_token = p_token AND session_expires_at > now() AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false); END IF;
  UPDATE portal_accounts SET session_expires_at = now() + interval '8 hours' WHERE id = v_account.id;
  RETURN jsonb_build_object(
    'valid', true, 'account_id', v_account.id,
    'full_name', v_account.full_name, 'email', v_account.email,
    'role', v_account.role,
    'linked_customer_id', v_account.linked_customer_id,
    'linked_partner_id', v_account.linked_partner_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION portal_validate_session TO anon, authenticated;

-- Criar/obter canal de OS
CREATE OR REPLACE FUNCTION get_or_create_os_chat_channel(p_os_id uuid, p_os_title text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_channel_id uuid;
BEGIN
  SELECT id INTO v_channel_id FROM corp_chat_channels
  WHERE service_order_id = p_os_id AND channel_type = 'os';
  IF NOT FOUND THEN
    INSERT INTO corp_chat_channels (channel_type, name, service_order_id)
    VALUES ('os', 'Chat OS: ' || p_os_title, p_os_id)
    RETURNING id INTO v_channel_id;
  END IF;
  RETURN v_channel_id;
END;
$$;
GRANT EXECUTE ON FUNCTION get_or_create_os_chat_channel TO anon, authenticated;
