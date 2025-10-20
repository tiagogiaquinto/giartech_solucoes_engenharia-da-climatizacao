/*
  # Sistema de Email Corporativo

  ## Tabelas Criadas
  1. email_accounts - Contas de email corporativo
  2. email_messages - Mensagens enviadas e recebidas
  3. email_templates - Templates de email
  4. email_attachments - Anexos de email

  ## Segurança
  - RLS desabilitado para desenvolvimento
  - Políticas serão adicionadas posteriormente
*/

-- ============================================================================
-- 1. TABELA: Contas de Email
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  email_address TEXT NOT NULL UNIQUE,
  
  -- Configurações SMTP (envio)
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL, -- Será criptografado
  smtp_secure BOOLEAN DEFAULT true,
  
  -- Configurações IMAP (recebimento)
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  imap_user TEXT,
  imap_password TEXT, -- Será criptografado
  imap_secure BOOLEAN DEFAULT true,
  
  -- Informações da empresa
  sender_name TEXT NOT NULL,
  signature TEXT,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 2. TABELA: Mensagens de Email
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conta de email usada
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- Dados do email
  message_id TEXT, -- ID único do servidor de email
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  
  -- Remetente e destinatários
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  reply_to TEXT,
  
  -- Status
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received', 'draft')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'received', 'read', 'archived')),
  
  -- Relacionamentos
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
  
  -- Flags
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Tentativas de envio
  send_attempts INTEGER DEFAULT 0,
  last_send_attempt TIMESTAMPTZ,
  error_message TEXT,
  
  -- Metadados
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. TABELA: Templates de Email
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Conteúdo
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variáveis disponíveis
  available_variables TEXT[], -- Ex: ['{{cliente_nome}}', '{{os_numero}}']
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 4. TABELA: Anexos de Email
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamento
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  
  -- Dados do arquivo
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT, -- Caminho no storage do Supabase
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_messages_account ON email_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_customer ON email_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_service_order ON email_messages(service_order_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_direction ON email_messages(direction);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON email_messages(status);
CREATE INDEX IF NOT EXISTS idx_email_messages_created ON email_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_attachments_message ON email_attachments(message_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_updated_at();

-- ============================================================================
-- DADOS INICIAIS - Templates Padrão
-- ============================================================================

INSERT INTO email_templates (name, description, category, subject, body_html, body_text, available_variables)
VALUES 
(
  'Orçamento - Envio',
  'Template para envio de orçamento ao cliente',
  'service_orders',
  'Orçamento {{os_numero}} - {{empresa_nome}}',
  '<h2>Prezado(a) {{cliente_nome}},</h2>
  <p>Segue em anexo o orçamento nº <strong>{{os_numero}}</strong> solicitado.</p>
  <p><strong>Valor Total:</strong> {{os_valor}}</p>
  <p>Estamos à disposição para esclarecimentos.</p>
  <br>
  <p>Atenciosamente,<br>{{empresa_nome}}</p>',
  'Prezado(a) {{cliente_nome}},

Segue em anexo o orçamento nº {{os_numero}} solicitado.

Valor Total: {{os_valor}}

Estamos à disposição para esclarecimentos.

Atenciosamente,
{{empresa_nome}}',
  ARRAY['{{cliente_nome}}', '{{os_numero}}', '{{os_valor}}', '{{empresa_nome}}']
),
(
  'OS - Concluída',
  'Notificação de conclusão de ordem de serviço',
  'service_orders',
  'Ordem de Serviço {{os_numero}} Concluída',
  '<h2>Olá {{cliente_nome}},</h2>
  <p>Informamos que a Ordem de Serviço <strong>{{os_numero}}</strong> foi concluída com sucesso.</p>
  <p><strong>Data de Conclusão:</strong> {{data_conclusao}}</p>
  <p>Agradecemos pela confiança!</p>
  <br>
  <p>Atenciosamente,<br>{{empresa_nome}}</p>',
  'Olá {{cliente_nome}},

Informamos que a Ordem de Serviço {{os_numero}} foi concluída com sucesso.

Data de Conclusão: {{data_conclusao}}

Agradecemos pela confiança!

Atenciosamente,
{{empresa_nome}}',
  ARRAY['{{cliente_nome}}', '{{os_numero}}', '{{data_conclusao}}', '{{empresa_nome}}']
),
(
  'Cobrança - Lembrete',
  'Lembrete de pagamento pendente',
  'financial',
  'Lembrete de Pagamento - Vencimento {{data_vencimento}}',
  '<h2>Prezado(a) {{cliente_nome}},</h2>
  <p>Este é um lembrete amigável sobre o pagamento pendente:</p>
  <ul>
    <li><strong>Valor:</strong> {{valor}}</li>
    <li><strong>Vencimento:</strong> {{data_vencimento}}</li>
    <li><strong>Referência:</strong> {{referencia}}</li>
  </ul>
  <p>Por favor, realize o pagamento para evitar juros.</p>
  <br>
  <p>Atenciosamente,<br>{{empresa_nome}}</p>',
  'Prezado(a) {{cliente_nome}},

Este é um lembrete amigável sobre o pagamento pendente:

Valor: {{valor}}
Vencimento: {{data_vencimento}}
Referência: {{referencia}}

Por favor, realize o pagamento para evitar juros.

Atenciosamente,
{{empresa_nome}}',
  ARRAY['{{cliente_nome}}', '{{valor}}', '{{data_vencimento}}', '{{referencia}}', '{{empresa_nome}}']
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE email_accounts IS 'Contas de email corporativo configuradas';
COMMENT ON TABLE email_messages IS 'Mensagens de email enviadas e recebidas';
COMMENT ON TABLE email_templates IS 'Templates reutilizáveis de email';
COMMENT ON TABLE email_attachments IS 'Anexos de mensagens de email';
