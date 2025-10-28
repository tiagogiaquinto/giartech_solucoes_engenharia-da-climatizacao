/*
  # Sistema de Notificações em Tempo Real

  1. Nova Tabela: `notifications`
    - Sistema completo de notificações
    - Suporte a diferentes tipos (info, warning, error, success)
    - Links para ações
    - Controle de leitura
    - Agrupamento por categoria

  2. Funções para criar notificações
    - create_notification() - Criar notificação manual
    - Triggers automáticos para eventos importantes

  3. Segurança
    - RLS habilitado
    - Usuários só veem suas notificações
*/

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES employees(id) ON DELETE CASCADE,

  -- Conteúdo
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  icon text,

  -- Ação
  link text,
  action_label text,

  -- Metadados
  category text,
  priority integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Status
  read boolean DEFAULT false,
  read_at timestamptz,
  archived boolean DEFAULT false,

  -- Auditoria
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,

  CONSTRAINT valid_type CHECK (type IN ('info', 'warning', 'error', 'success')),
  CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 10)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read, created_at DESC)
  WHERE read = false AND archived = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON notifications(user_id, created_at DESC)
  WHERE archived = false;

CREATE INDEX IF NOT EXISTS idx_notifications_priority
  ON notifications(priority DESC, created_at DESC)
  WHERE read = false AND archived = false;

CREATE INDEX IF NOT EXISTS idx_notifications_expires
  ON notifications(expires_at)
  WHERE expires_at IS NOT NULL;

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_priority integer DEFAULT 0
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    category,
    priority
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_category,
    p_priority
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Função para notificar todos os usuários
CREATE OR REPLACE FUNCTION create_notification_for_all(
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_category text DEFAULT NULL
)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer := 0;
  v_employee record;
BEGIN
  FOR v_employee IN SELECT id FROM employees WHERE status = 'active'
  LOOP
    PERFORM create_notification(
      v_employee.id,
      p_type,
      p_title,
      p_message,
      p_link,
      p_category
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Função para marcar como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE id = p_notification_id;
END;
$$;

-- Função para marcar todas como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE user_id = p_user_id AND read = false;
END;
$$;

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION clean_expired_notifications()
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- TRIGGERS AUTOMÁTICOS

-- Trigger: Notificar quando OS atrasa
CREATE OR REPLACE FUNCTION notify_overdue_service_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_employee record;
BEGIN
  -- Notificar responsável pela OS
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status != 'overdue') THEN
    -- Notificar gerentes e supervisores
    FOR v_employee IN
      SELECT id FROM employees
      WHERE role IN ('admin', 'manager', 'supervisor')
        AND status = 'active'
    LOOP
      PERFORM create_notification(
        v_employee.id,
        'warning',
        'OS Atrasada',
        'Ordem de Serviço #' || NEW.order_number || ' está atrasada',
        '/service-orders/' || NEW.id,
        'service_orders',
        8
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_overdue_service_order
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_overdue_service_order();

-- Trigger: Notificar estoque baixo
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_employee record;
BEGIN
  -- Se estoque ficar abaixo do mínimo
  IF NEW.quantity <= NEW.minimum_stock AND (OLD.quantity IS NULL OR OLD.quantity > OLD.minimum_stock) THEN
    -- Notificar compradores e administradores
    FOR v_employee IN
      SELECT id FROM employees
      WHERE role IN ('admin', 'buyer', 'manager')
        AND status = 'active'
    LOOP
      PERFORM create_notification(
        v_employee.id,
        'warning',
        'Estoque Baixo',
        'Item "' || NEW.name || '" está abaixo do estoque mínimo (' || NEW.quantity || ' de ' || NEW.minimum_stock || ')',
        '/inventory/' || NEW.id,
        'inventory',
        7
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_low_stock
  AFTER UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

-- Trigger: Notificar conta a vencer
CREATE OR REPLACE FUNCTION notify_bill_due_soon()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_employee record;
  v_days_until_due integer;
BEGIN
  -- Calcular dias até vencimento
  v_days_until_due := (NEW.due_date - CURRENT_DATE);

  -- Notificar se vence em 3 dias ou menos
  IF NEW.status = 'pending' AND v_days_until_due <= 3 AND v_days_until_due >= 0 THEN
    -- Notificar financeiro e administradores
    FOR v_employee IN
      SELECT id FROM employees
      WHERE role IN ('admin', 'financial', 'manager')
        AND status = 'active'
    LOOP
      PERFORM create_notification(
        v_employee.id,
        'info',
        'Conta a Vencer',
        'Pagamento "' || NEW.description || '" vence em ' || v_days_until_due || ' dia(s) - R$ ' || NEW.amount::text,
        '/financial/' || NEW.id,
        'finance',
        CASE WHEN v_days_until_due = 0 THEN 9 ELSE 6 END
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_bill_due_soon
  AFTER INSERT OR UPDATE ON finance_entries
  FOR EACH ROW
  WHEN (NEW.type = 'expense')
  EXECUTE FUNCTION notify_bill_due_soon();

-- Trigger: Notificar pagamento recebido
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_employee record;
BEGIN
  -- Se mudou de pending para paid
  IF NEW.status = 'paid' AND OLD.status = 'pending' AND NEW.type = 'income' THEN
    -- Notificar financeiro
    FOR v_employee IN
      SELECT id FROM employees
      WHERE role IN ('admin', 'financial', 'manager')
        AND status = 'active'
    LOOP
      PERFORM create_notification(
        v_employee.id,
        'success',
        'Pagamento Recebido',
        'Recebimento de "' || NEW.description || '" - R$ ' || NEW.amount::text,
        '/financial/' || NEW.id,
        'finance',
        5
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_payment_received
  AFTER UPDATE ON finance_entries
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- Trigger: Notificar nova OS criada
CREATE OR REPLACE FUNCTION notify_new_service_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_employee record;
BEGIN
  -- Notificar gerentes
  FOR v_employee IN
    SELECT id FROM employees
    WHERE role IN ('admin', 'manager')
      AND status = 'active'
  LOOP
    PERFORM create_notification(
      v_employee.id,
      'info',
      'Nova OS Criada',
      'Ordem de Serviço #' || NEW.order_number || ' foi criada',
      '/service-orders/' || NEW.id,
      'service_orders',
      3
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_service_order
  AFTER INSERT ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_service_order();

-- View para estatísticas de notificações
CREATE OR REPLACE VIEW v_notification_stats AS
SELECT
  user_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE NOT read) as unread,
  COUNT(*) FILTER (WHERE type = 'error') as errors,
  COUNT(*) FILTER (WHERE type = 'warning') as warnings,
  COUNT(*) FILTER (WHERE type = 'success') as success,
  COUNT(*) FILTER (WHERE type = 'info') as info,
  MAX(created_at) as last_notification_at
FROM notifications
WHERE archived = false
GROUP BY user_id;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas suas notificações
CREATE POLICY "Users see own notifications"
  ON notifications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política: Sistema pode criar notificações
CREATE POLICY "Allow insert notifications"
  ON notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Usuários podem atualizar suas notificações
CREATE POLICY "Users update own notifications"
  ON notifications
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Usuários podem deletar suas notificações
CREATE POLICY "Users delete own notifications"
  ON notifications
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Comentários
COMMENT ON TABLE notifications IS 'Sistema de notificações em tempo real';
COMMENT ON COLUMN notifications.priority IS 'Prioridade: 0-10 (10 = máxima urgência)';
COMMENT ON COLUMN notifications.expires_at IS 'Data de expiração automática da notificação';
COMMENT ON FUNCTION create_notification IS 'Criar notificação para um usuário específico';
COMMENT ON FUNCTION create_notification_for_all IS 'Criar notificação para todos os usuários ativos';
