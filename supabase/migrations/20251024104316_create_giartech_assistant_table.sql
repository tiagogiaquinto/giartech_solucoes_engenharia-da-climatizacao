/*
  # Criar Sistema de Assistente Giartech

  1. Nova Tabela
    - `giartech_conversations`
      - `id` (uuid, PK)
      - `conversation_id` (uuid) - agrupa mensagens da mesma conversa
      - `user_id` (text) - opcional
      - `user_message` (text)
      - `assistant_response` (text)
      - `intent_type` (text) - tipo de intenção detectada
      - `created_at` (timestamptz)

  2. Segurança
    - RLS habilitado
    - Políticas para acesso público (desenvolvimento)
*/

-- Criar tabela de conversas do assistente
CREATE TABLE IF NOT EXISTS giartech_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id text,
  user_message text NOT NULL,
  assistant_response text NOT NULL,
  intent_type text,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_conversation_id 
  ON giartech_conversations(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
  ON giartech_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
  ON giartech_conversations(created_at DESC);

-- Habilitar RLS
ALTER TABLE giartech_conversations ENABLE ROW LEVEL SECURITY;

-- Política de acesso total para desenvolvimento
CREATE POLICY "Allow all access to giartech_conversations"
  ON giartech_conversations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE giartech_conversations IS 'Armazena histórico de conversas com o Assistente Giartech';
COMMENT ON COLUMN giartech_conversations.conversation_id IS 'ID que agrupa mensagens da mesma conversa';
COMMENT ON COLUMN giartech_conversations.intent_type IS 'Tipo de intenção detectada (financial, serviceOrders, etc)';
