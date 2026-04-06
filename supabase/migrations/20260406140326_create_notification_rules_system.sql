/*
  # Sistema de Regras de Notificação

  ## Resumo
  Cria um sistema configurável que permite controlar quais tipos de alertas
  são gerados, para quem são enviados, e em que condições.

  ## Novas Tabelas

  ### notification_rules
  Cada linha é uma "regra" que define:
  - Qual evento dispara a notificação (category)
  - Que tipo de notificação gerar (info / warning / error / success)
  - Prioridade (1-10)
  - Se está ativa
  - Para quais perfis/usuários a regra se aplica (jsonb array de roles)
  - Se deve exibir toast em tempo real
  - Nome e descrição amigáveis para exibição na UI

  ## Segurança
  - RLS habilitado; somente usuários autenticados leem e admins editam
*/

CREATE TABLE IF NOT EXISTS notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  event_type text NOT NULL DEFAULT 'any',
  notification_type text NOT NULL DEFAULT 'info' CHECK (notification_type IN ('info','warning','error','success')),
  priority integer NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  is_active boolean NOT NULL DEFAULT true,
  show_toast boolean NOT NULL DEFAULT true,
  target_roles jsonb NOT NULL DEFAULT '["admin","manager","owner"]'::jsonb,
  conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read notification rules"
  ON notification_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notification rules"
  ON notification_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notification rules"
  ON notification_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notification rules"
  ON notification_rules FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read notification rules"
  ON notification_rules FOR SELECT
  TO anon
  USING (true);

CREATE OR REPLACE FUNCTION fn_update_notification_rules_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_rules_updated_at ON notification_rules;
CREATE TRIGGER trg_notification_rules_updated_at
  BEFORE UPDATE ON notification_rules
  FOR EACH ROW EXECUTE FUNCTION fn_update_notification_rules_timestamp();

INSERT INTO notification_rules (name, description, category, event_type, notification_type, priority, is_active, show_toast, target_roles) VALUES
  ('Nova Solicitação pelo Portal', 'Dispara quando um cliente envia uma solicitação de serviço pelo portal', 'portal_service_request', 'insert', 'warning', 7, true, true, '["admin","manager","owner"]'::jsonb),
  ('Nova Ordem de Serviço', 'Dispara quando uma nova OS é criada no sistema', 'service_order_created', 'insert', 'info', 5, true, true, '["admin","manager","owner","technician"]'::jsonb),
  ('OS Concluída', 'Dispara quando uma OS muda o status para concluído', 'service_order_completed', 'update', 'success', 6, true, true, '["admin","manager","owner"]'::jsonb),
  ('Pagamento Recebido', 'Dispara quando um lançamento financeiro é marcado como pago', 'payment_received', 'update', 'success', 8, true, true, '["admin","manager","owner"]'::jsonb),
  ('Prazo se Aproximando', 'Dispara quando uma OS está próxima do prazo de execução', 'deadline_warning', 'scheduled', 'warning', 9, true, true, '["admin","manager","owner","technician"]'::jsonb),
  ('Estoque Baixo', 'Dispara quando um item de estoque atinge o ponto de reposição', 'low_stock', 'update', 'warning', 7, true, true, '["admin","manager","owner"]'::jsonb),
  ('Nova Mensagem no Chat', 'Dispara quando uma nova mensagem é enviada no chat interno', 'internal_message', 'insert', 'info', 3, true, false, '["admin","manager","owner","technician"]'::jsonb),
  ('Lead Capturado', 'Dispara quando um novo lead é registrado no sistema', 'lead_captured', 'insert', 'info', 4, true, true, '["admin","manager","owner"]'::jsonb),
  ('Orçamento Aprovado pelo Cliente', 'Dispara quando um cliente aprova um orçamento pelo portal', 'budget_approved', 'update', 'success', 8, true, true, '["admin","manager","owner"]'::jsonb),
  ('Erro Crítico de Sistema', 'Dispara quando ocorre um erro crítico no sistema', 'system_error', 'any', 'error', 10, true, true, '["admin","owner"]'::jsonb)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_notification_rules_category ON notification_rules(category);
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules(is_active);
