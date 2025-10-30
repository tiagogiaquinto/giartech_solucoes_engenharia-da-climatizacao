/*
  # Sistema de Notificações Inteligente v2

  1. Nova Tabela de Notificações
  2. Triggers para eventos automáticos
  3. Funções de gerenciamento
*/

-- ==================================
-- 1. CRIAR TABELA DE NOTIFICAÇÕES
-- ==================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category text DEFAULT 'system' CHECK (category IN ('os', 'finance', 'customer', 'inventory', 'system', 'agenda')),
  entity_type text,
  entity_id uuid,
  action_url text,
  is_read boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  expires_at timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to notifications" ON notifications;
CREATE POLICY "Public access to notifications"
  ON notifications FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ==================================
-- 2. FUNÇÕES
-- ==================================

-- Função: Adicionar notificação
CREATE OR REPLACE FUNCTION add_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_category text DEFAULT 'system',
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_action_url text DEFAULT NULL,
  p_priority text DEFAULT 'medium'
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    title, message, type, category,
    entity_type, entity_id, action_url, priority
  ) VALUES (
    p_title, p_message, p_type, p_category,
    p_entity_type, p_entity_id, p_action_url, p_priority
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================
-- 3. TRIGGERS
-- ==================================

-- Notificar OS Concluída
CREATE OR REPLACE FUNCTION notify_os_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('concluido', 'completed') AND OLD.status != NEW.status THEN
    PERFORM add_notification(
      'OS Concluída',
      'OS ' || COALESCE(NEW.order_number, '#' || SUBSTRING(NEW.id::text, 1, 8)) || ' foi concluída',
      'success',
      'os',
      'service_order',
      NEW.id,
      '/service-orders/' || NEW.id,
      'medium'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_os_completed ON service_orders;
CREATE TRIGGER trigger_notify_os_completed
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_os_completed();

-- Notificar Pagamento
CREATE OR REPLACE FUNCTION notify_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pago' AND OLD.status != 'pago' AND NEW.tipo = 'receita' THEN
    PERFORM add_notification(
      'Pagamento Recebido',
      'R$ ' || NEW.valor::text || ' - ' || LEFT(NEW.descricao, 50),
      'success',
      'finance',
      'finance_entry',
      NEW.id,
      '/financeiro',
      'high'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_payment ON finance_entries;
CREATE TRIGGER trigger_notify_payment
  AFTER UPDATE ON finance_entries
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_payment();

-- Notificar Estoque Baixo
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_min numeric;
BEGIN
  v_min := COALESCE(NULLIF(NEW.minimum_stock, 0), 10);
  
  IF NEW.quantity <= v_min AND (OLD.quantity > v_min OR OLD.quantity IS NULL) THEN
    PERFORM add_notification(
      'Estoque Baixo',
      'Produto "' || NEW.name || '" com apenas ' || NEW.quantity || ' unidades',
      'warning',
      'inventory',
      'inventory_item',
      NEW.id,
      '/inventory/' || NEW.id,
      'high'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_low_stock ON inventory_items;
CREATE TRIGGER trigger_notify_low_stock
  AFTER UPDATE ON inventory_items
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
  EXECUTE FUNCTION notify_low_stock();

-- Notificar Novo Cliente
CREATE OR REPLACE FUNCTION notify_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_notification(
    'Novo Cliente',
    'Cliente "' || COALESCE(NEW.nome_fantasia, NEW.nome_razao) || '" cadastrado',
    'info',
    'customer',
    'customer',
    NEW.id,
    '/clientes',
    'low'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_customer ON customers;
CREATE TRIGGER trigger_notify_new_customer
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_customer();

-- ==================================
-- 4. VIEW RESUMO
-- ==================================
CREATE OR REPLACE VIEW v_notification_summary AS
SELECT 
  category,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) as total_count,
  MAX(created_at) as latest
FROM notifications
GROUP BY category;

COMMENT ON TABLE notifications IS 'Sistema de notificações inteligente do sistema';
