/*
  # Sistema Completo de WhatsApp CRM

  1. Tabelas Criadas
    - whatsapp_accounts - Contas do WhatsApp conectadas
    - whatsapp_contacts - Contatos do WhatsApp
    - whatsapp_messages - Mensagens trocadas
    - whatsapp_tags - Tags para organização
    - whatsapp_contact_tags - Relacionamento contatos x tags
    - whatsapp_campaigns - Campanhas de marketing
    - whatsapp_quick_replies - Respostas rápidas

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso para anon e authenticated
*/

-- =====================================================
-- 1. TABELA: whatsapp_accounts
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'pending')),
  qr_code TEXT,
  session_data JSONB,
  last_connection TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_accounts" ON whatsapp_accounts;
CREATE POLICY "Allow all access to whatsapp_accounts"
  ON whatsapp_accounts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. TABELA: whatsapp_contacts
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT false,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_account ON whatsapp_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_last_message ON whatsapp_contacts(last_message_at DESC);

ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_contacts" ON whatsapp_contacts;
CREATE POLICY "Allow all access to whatsapp_contacts"
  ON whatsapp_contacts FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. TABELA: whatsapp_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location')),
  content TEXT,
  media_url TEXT,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  metadata JSONB DEFAULT '{}'::jsonb,
  replied_to_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_account ON whatsapp_messages(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "Allow all access to whatsapp_messages"
  ON whatsapp_messages FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 4. TABELA: whatsapp_tags
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_tags" ON whatsapp_tags;
CREATE POLICY "Allow all access to whatsapp_tags"
  ON whatsapp_tags FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. TABELA: whatsapp_contact_tags
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_contact_tags (
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES whatsapp_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_tags_contact ON whatsapp_contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_tags_tag ON whatsapp_contact_tags(tag_id);

ALTER TABLE whatsapp_contact_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_contact_tags" ON whatsapp_contact_tags;
CREATE POLICY "Allow all access to whatsapp_contact_tags"
  ON whatsapp_contact_tags FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. TABELA: whatsapp_campaigns
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused')),
  scheduled_at TIMESTAMPTZ,
  target_tags UUID[],
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_account ON whatsapp_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);

ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_campaigns" ON whatsapp_campaigns;
CREATE POLICY "Allow all access to whatsapp_campaigns"
  ON whatsapp_campaigns FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. TABELA: whatsapp_quick_replies
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_account ON whatsapp_quick_replies(account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_shortcut ON whatsapp_quick_replies(shortcut);

ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to whatsapp_quick_replies" ON whatsapp_quick_replies;
CREATE POLICY "Allow all access to whatsapp_quick_replies"
  ON whatsapp_quick_replies FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 8. TRIGGER: Atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_whatsapp_accounts_updated_at ON whatsapp_accounts;
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_campaigns_updated_at ON whatsapp_campaigns;
CREATE TRIGGER update_whatsapp_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_quick_replies_updated_at ON whatsapp_quick_replies;
CREATE TRIGGER update_whatsapp_quick_replies_updated_at
  BEFORE UPDATE ON whatsapp_quick_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- =====================================================
-- 9. TRIGGER: Atualizar contador de mensagens não lidas
-- =====================================================

CREATE OR REPLACE FUNCTION update_contact_message_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.direction = 'inbound' THEN
    UPDATE whatsapp_contacts 
    SET 
      last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100),
      unread_count = unread_count + 1
    WHERE id = NEW.contact_id;
  ELSE
    UPDATE whatsapp_contacts 
    SET 
      last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100)
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_contact_on_message ON whatsapp_messages;
CREATE TRIGGER update_contact_on_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_message_info();

-- =====================================================
-- 10. INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir conta padrão
INSERT INTO whatsapp_accounts (name, phone, status, is_active)
VALUES ('Conta Principal', '5535999999999', 'disconnected', true)
ON CONFLICT (phone) DO NOTHING;

-- Inserir tags padrão
INSERT INTO whatsapp_tags (name, color, description) VALUES
  ('Cliente', '#10B981', 'Clientes ativos'),
  ('Lead', '#3B82F6', 'Potenciais clientes'),
  ('VIP', '#F59E0B', 'Clientes VIP'),
  ('Fornecedor', '#8B5CF6', 'Fornecedores'),
  ('Suporte', '#EF4444', 'Suporte técnico')
ON CONFLICT (name) DO NOTHING;

-- Inserir respostas rápidas padrão
DO $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT id INTO v_account_id FROM whatsapp_accounts LIMIT 1;
  
  IF v_account_id IS NOT NULL THEN
    INSERT INTO whatsapp_quick_replies (account_id, shortcut, message, category) VALUES
      (v_account_id, '/oi', 'Olá! Como posso ajudar você hoje? 😊', 'Saudações'),
      (v_account_id, '/obrigado', 'Obrigado pelo contato! Estamos à disposição. 🙏', 'Encerramento'),
      (v_account_id, '/horario', 'Nosso horário de atendimento é de Segunda a Sexta, das 8h às 18h. ⏰', 'Informações'),
      (v_account_id, '/aguarde', 'Por favor, aguarde um momento enquanto verifico isso para você... ⏳', 'Status'),
      (v_account_id, '/catalogo', 'Confira nosso catálogo completo de produtos e serviços! 📋', 'Vendas')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- 11. VIEWS ÚTEIS
-- =====================================================

-- View de estatísticas por contato
CREATE OR REPLACE VIEW v_whatsapp_contact_stats AS
SELECT 
  c.id,
  c.name,
  c.phone,
  c.account_id,
  c.is_blocked,
  c.is_favorite,
  c.unread_count,
  c.last_message_at,
  COUNT(m.id) as total_messages,
  COUNT(m.id) FILTER (WHERE m.direction = 'inbound') as received_messages,
  COUNT(m.id) FILTER (WHERE m.direction = 'outbound') as sent_messages,
  ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
FROM whatsapp_contacts c
LEFT JOIN whatsapp_messages m ON m.contact_id = c.id
LEFT JOIN whatsapp_contact_tags ct ON ct.contact_id = c.id
LEFT JOIN whatsapp_tags t ON t.id = ct.tag_id
GROUP BY c.id, c.name, c.phone, c.account_id, c.is_blocked, c.is_favorite, c.unread_count, c.last_message_at;

-- View de estatísticas por conta
CREATE OR REPLACE VIEW v_whatsapp_account_stats AS
SELECT 
  a.id,
  a.name,
  a.phone,
  a.status,
  a.is_active,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.unread_count > 0) as contacts_with_unread,
  SUM(c.unread_count) as total_unread,
  COUNT(DISTINCT m.id) as total_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > NOW() - INTERVAL '24 hours') as messages_today
FROM whatsapp_accounts a
LEFT JOIN whatsapp_contacts c ON c.account_id = a.id
LEFT JOIN whatsapp_messages m ON m.account_id = a.id
GROUP BY a.id, a.name, a.phone, a.status, a.is_active;

GRANT SELECT ON v_whatsapp_contact_stats TO anon, authenticated;
GRANT SELECT ON v_whatsapp_account_stats TO anon, authenticated;
