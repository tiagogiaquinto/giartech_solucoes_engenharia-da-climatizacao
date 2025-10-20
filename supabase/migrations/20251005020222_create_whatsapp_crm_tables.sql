/*
  # Criar Tabelas do WhatsApp CRM
  
  1. Tabelas Criadas
    - wpp_accounts: Contas WhatsApp conectadas
    - wpp_contacts: Contatos do WhatsApp
    - wpp_messages: Histórico de mensagens
    - wpp_campaigns: Campanhas de marketing
    - wpp_tags: Tags para organização
    - wpp_contact_tags: Relacionamento contatos-tags
  
  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas permissivas para desenvolvimento
*/

-- TABELA: wpp_accounts (Contas WhatsApp)
CREATE TABLE IF NOT EXISTS wpp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  status text CHECK (status IN ('connected', 'disconnected', 'pending')) DEFAULT 'pending',
  qr_code text,
  last_connection timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wpp_accounts_all_access" 
  ON wpp_accounts FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- TABELA: wpp_contacts (Contatos WhatsApp)
CREATE TABLE IF NOT EXISTS wpp_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  avatar_url text,
  customer_id uuid REFERENCES customers(id),
  is_blocked boolean DEFAULT false,
  notes text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wpp_contacts_all_access" 
  ON wpp_contacts FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wpp_contacts_phone ON wpp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wpp_contacts_account ON wpp_contacts(account_id);

-- TABELA: wpp_messages (Mensagens)
CREATE TABLE IF NOT EXISTS wpp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES wpp_contacts(id) ON DELETE CASCADE,
  message_type text CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document')) DEFAULT 'text',
  content text,
  media_url text,
  direction text CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  status text CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wpp_messages_all_access" 
  ON wpp_messages FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wpp_messages_contact ON wpp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_wpp_messages_created ON wpp_messages(created_at);

-- TABELA: wpp_campaigns (Campanhas)
CREATE TABLE IF NOT EXISTS wpp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES wpp_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  message text NOT NULL,
  status text CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled')) DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  read_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wpp_campaigns_all_access" 
  ON wpp_campaigns FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- TABELA: wpp_tags (Tags para Organização)
CREATE TABLE IF NOT EXISTS wpp_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wpp_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wpp_tags_all_access" 
  ON wpp_tags FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- TABELA: wpp_contact_tags (Relacionamento Contatos-Tags)
CREATE TABLE IF NOT EXISTS wpp_contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES wpp_contacts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES wpp_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

ALTER TABLE wpp_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wpp_contact_tags_all_access" 
  ON wpp_contact_tags FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_wpp_accounts_updated_at'
  ) THEN
    CREATE TRIGGER update_wpp_accounts_updated_at 
      BEFORE UPDATE ON wpp_accounts 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_wpp_contacts_updated_at'
  ) THEN
    CREATE TRIGGER update_wpp_contacts_updated_at 
      BEFORE UPDATE ON wpp_contacts 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_wpp_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER update_wpp_campaigns_updated_at 
      BEFORE UPDATE ON wpp_campaigns 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Dados de Teste
INSERT INTO wpp_accounts (name, phone, status, is_active)
VALUES ('Conta Principal', '11969423646', 'connected', true)
ON CONFLICT DO NOTHING;

INSERT INTO wpp_tags (name, color) VALUES
  ('Cliente', '#22C55E'),
  ('Lead', '#3B82F6'),
  ('VIP', '#F59E0B'),
  ('Suporte', '#EF4444')
ON CONFLICT (name) DO NOTHING;

INSERT INTO wpp_contacts (account_id, name, phone, email)
SELECT 
  (SELECT id FROM wpp_accounts LIMIT 1),
  'Tatiane Cardoso da Silva Giaquinto',
  '11969423646',
  'gerente.giartechsolucoes@gmail.com'
WHERE NOT EXISTS (SELECT 1 FROM wpp_contacts WHERE phone = '11969423646');

INSERT INTO wpp_contacts (account_id, name, phone, email)
SELECT 
  (SELECT id FROM wpp_accounts LIMIT 1),
  'Tiago Giaquinto',
  '11966617631',
  'diretor@giartechsolucoes.com.br'
WHERE NOT EXISTS (SELECT 1 FROM wpp_contacts WHERE phone = '11966617631');