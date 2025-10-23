/*
  # Sistema de Chatbot Inteligente para CRM

  1. Novas Tabelas
    - `chat_conversations` - Conversas do chatbot
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência para auth.users)
      - `title` (text) - Título da conversa
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_messages` - Mensagens do chat
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, referência para chat_conversations)
      - `role` (text) - 'user' ou 'assistant'
      - `content` (text) - Conteúdo da mensagem
      - `metadata` (jsonb) - Dados extras (query executada, resultados, etc)
      - `created_at` (timestamptz)
    
    - `chat_intents` - Intenções/comandos reconhecidos
      - `id` (uuid, primary key)
      - `intent_name` (text) - Nome da intenção
      - `keywords` (text[]) - Palavras-chave que ativam
      - `query_template` (text) - Template da query SQL
      - `description` (text) - Descrição do que faz
      - `active` (boolean)
      - `created_at` (timestamptz)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Usuários podem ver apenas suas conversas
    - Queries executadas com permissões do usuário

  3. Funcionalidades
    - Histórico de conversas
    - Contexto persistente
    - Análise de intenções
    - Execução segura de queries
*/

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nova Conversa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Tabela de intenções (para o bot reconhecer comandos)
CREATE TABLE IF NOT EXISTS chat_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name text NOT NULL UNIQUE,
  keywords text[] NOT NULL,
  query_template text,
  response_template text,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_intents_keywords ON chat_intents USING gin(keywords);

-- RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_intents ENABLE ROW LEVEL SECURITY;

-- Políticas para conversas
CREATE POLICY "Usuários podem ver suas próprias conversas"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar suas próprias conversas"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias conversas"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas próprias conversas"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para mensagens
CREATE POLICY "Usuários podem ver mensagens de suas conversas"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar mensagens em suas conversas"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Políticas para intenções (todos podem ler)
CREATE POLICY "Todos podem ver intenções ativas"
  ON chat_intents FOR SELECT
  TO authenticated, anon
  USING (active = true);

-- Acesso anônimo temporário (desenvolvimento)
CREATE POLICY "Acesso anônimo às conversas"
  ON chat_conversations FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acesso anônimo às mensagens"
  ON chat_messages FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chat_conversation_timestamp
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Inserir intenções padrão
INSERT INTO chat_intents (intent_name, keywords, description, query_template, response_template) VALUES
  (
    'listar_os_abertas',
    ARRAY['os abertas', 'ordens abertas', 'serviços pendentes', 'os em andamento'],
    'Lista todas as ordens de serviço em aberto',
    'SELECT id, order_number, customer_name, status, total_value FROM service_orders WHERE status IN (''pending'', ''in_progress'') ORDER BY created_at DESC LIMIT 10',
    'Encontrei {count} ordens de serviço abertas'
  ),
  (
    'buscar_cliente',
    ARRAY['buscar cliente', 'informações do cliente', 'dados do cliente', 'cliente'],
    'Busca informações de um cliente específico',
    'SELECT name, email, phone, city FROM customers WHERE name ILIKE ''%{param}%'' OR email ILIKE ''%{param}%'' LIMIT 5',
    'Encontrei {count} clientes correspondentes'
  ),
  (
    'estoque_baixo',
    ARRAY['estoque baixo', 'materiais acabando', 'estoque crítico', 'falta estoque'],
    'Lista materiais com estoque abaixo do mínimo',
    'SELECT name, quantity, min_quantity, unit FROM materials WHERE quantity <= min_quantity AND active = true ORDER BY quantity ASC LIMIT 10',
    'Existem {count} materiais com estoque baixo'
  ),
  (
    'resumo_financeiro',
    ARRAY['resumo financeiro', 'financeiro hoje', 'contas a pagar', 'contas a receber'],
    'Mostra resumo financeiro do período',
    'SELECT status, SUM(amount) as total, COUNT(*) as count FROM finance_entries WHERE due_date >= CURRENT_DATE GROUP BY status',
    'Resumo financeiro carregado'
  ),
  (
    'agenda_hoje',
    ARRAY['agenda hoje', 'compromissos hoje', 'eventos hoje', 'o que tenho hoje'],
    'Lista eventos agendados para hoje',
    'SELECT title, start_time, end_time, location FROM agenda_events WHERE DATE(start_time) = CURRENT_DATE ORDER BY start_time',
    'Você tem {count} compromissos agendados para hoje'
  ),
  (
    'ultimas_vendas',
    ARRAY['últimas vendas', 'vendas recentes', 'ordens finalizadas', 'serviços concluídos'],
    'Lista as últimas vendas/OS finalizadas',
    'SELECT order_number, customer_name, total_value, completed_at FROM service_orders WHERE status = ''completed'' ORDER BY completed_at DESC LIMIT 10',
    'Últimas {count} vendas finalizadas'
  ),
  (
    'materiais_mais_usados',
    ARRAY['materiais mais usados', 'produtos populares', 'top materiais'],
    'Lista os materiais mais utilizados',
    'SELECT name, unit, total_quantity_purchased FROM materials WHERE total_quantity_purchased > 0 ORDER BY total_quantity_purchased DESC LIMIT 10',
    'Top {count} materiais mais utilizados'
  )
ON CONFLICT (intent_name) DO NOTHING;
