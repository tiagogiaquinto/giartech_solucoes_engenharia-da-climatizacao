/*
  # Criar tabela whatsapp_conversations
  
  ## Descrição
  Cria a tabela de conversas do WhatsApp que estava faltando
  
  ## Mudanças
  1. Cria tabela whatsapp_conversations
  2. Adiciona políticas RLS
  3. Cria índices para performance
  
  ## Segurança
  - RLS habilitado
  - Acesso público para desenvolvimento
*/

-- Criar tabela de conversas
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  unread_count integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact_id 
ON whatsapp_conversations(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message 
ON whatsapp_conversations(last_message_at DESC);

-- RLS
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas (acesso livre para desenvolvimento)
CREATE POLICY "Allow all for whatsapp_conversations" 
ON whatsapp_conversations FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_conversations_updated_at()
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

CREATE TRIGGER trigger_update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_conversations_updated_at();

-- Criar conversas para contatos existentes
INSERT INTO whatsapp_conversations (contact_id, last_message_at, last_message_preview, unread_count)
SELECT 
  id,
  COALESCE(last_message_at, created_at),
  last_message_preview,
  COALESCE(unread_count, 0)
FROM whatsapp_contacts
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE whatsapp_conversations IS 'Conversas do WhatsApp vinculadas aos contatos';
COMMENT ON COLUMN whatsapp_conversations.contact_id IS 'Referência ao contato';
COMMENT ON COLUMN whatsapp_conversations.last_message_at IS 'Data/hora da última mensagem';
COMMENT ON COLUMN whatsapp_conversations.unread_count IS 'Quantidade de mensagens não lidas';
