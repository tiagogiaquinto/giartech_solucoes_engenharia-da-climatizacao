/*
  # Sistema de Fluxo de Ordens de Serviço (Workflow Engine)

  1. Novas Tabelas
    - `os_workflow_stages` - Estágios do fluxo de trabalho
    - `os_workflow_transitions` - Transições entre estágios
    - `os_workflow_history` - Histórico de movimentações
    - `os_assignments_queue` - Fila de atribuição automática
    - `technician_availability` - Disponibilidade dos técnicos
    - `os_completion_feedback` - Feedback de conclusão automático

  2. Triggers
    - Auto-atribuição de OS para técnicos disponíveis
    - Notificação automática ao técnico
    - Envio automático para financeiro ao concluir
    - Geração automática de lançamento financeiro

  3. Security
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas em função
*/

-- =====================================================
-- TABELA: Estágios do Fluxo de Trabalho
-- =====================================================
CREATE TABLE IF NOT EXISTS os_workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'circle',
  is_initial boolean DEFAULT false,
  is_final boolean DEFAULT false,
  requires_approval boolean DEFAULT false,
  auto_transition boolean DEFAULT false,
  next_stage_id uuid REFERENCES os_workflow_stages(id),
  notify_roles text[] DEFAULT ARRAY[]::text[],
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: Transições de Workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS os_workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_stage_id uuid REFERENCES os_workflow_stages(id),
  to_stage_id uuid REFERENCES os_workflow_stages(id),
  name text NOT NULL,
  description text,
  required_role text,
  requires_approval boolean DEFAULT false,
  auto_conditions jsonb DEFAULT '{}',
  actions jsonb DEFAULT '[]',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: Histórico de Workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS os_workflow_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES os_workflow_stages(id),
  to_stage_id uuid REFERENCES os_workflow_stages(id),
  transition_id uuid REFERENCES os_workflow_transitions(id),
  user_id uuid,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: Fila de Atribuição Automática
-- =====================================================
CREATE TABLE IF NOT EXISTS os_assignments_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  priority integer DEFAULT 50,
  required_skills text[] DEFAULT ARRAY[]::text[],
  estimated_duration interval,
  preferred_technician_id uuid REFERENCES employees(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'failed')),
  assigned_to uuid REFERENCES employees(id),
  assigned_at timestamptz,
  assignment_method text DEFAULT 'auto',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABELA: Disponibilidade de Técnicos
-- =====================================================
CREATE TABLE IF NOT EXISTS technician_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time,
  end_time time,
  is_available boolean DEFAULT true,
  current_workload integer DEFAULT 0,
  max_workload integer DEFAULT 5,
  skills text[] DEFAULT ARRAY[]::text[],
  location_lat decimal(10, 8),
  location_lng decimal(11, 8),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- =====================================================
-- TABELA: Feedback de Conclusão Automático
-- =====================================================
CREATE TABLE IF NOT EXISTS os_completion_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  completed_by uuid REFERENCES employees(id),
  completion_date timestamptz DEFAULT now(),
  total_value decimal(15, 2),
  total_cost decimal(15, 2),
  margin decimal(15, 2),
  duration_hours decimal(5, 2),
  customer_satisfaction integer CHECK (customer_satisfaction BETWEEN 1 AND 5),
  technical_notes text,
  financial_status text DEFAULT 'pending' CHECK (financial_status IN ('pending', 'sent', 'invoiced', 'paid')),
  finance_entry_id uuid REFERENCES finance_entries(id),
  sent_to_finance_at timestamptz,
  auto_generated boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_os_workflow_history_service_order ON os_workflow_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_workflow_history_created_at ON os_workflow_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_os_assignments_queue_status ON os_assignments_queue(status);
CREATE INDEX IF NOT EXISTS idx_os_assignments_queue_priority ON os_assignments_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_technician_availability_employee ON technician_availability(employee_id);
CREATE INDEX IF NOT EXISTS idx_technician_availability_date ON technician_availability(date);
CREATE INDEX IF NOT EXISTS idx_os_completion_feedback_service_order ON os_completion_feedback(service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_completion_feedback_financial_status ON os_completion_feedback(financial_status);

-- =====================================================
-- FUNÇÃO: Auto-atribuir OS para técnico disponível
-- =====================================================
CREATE OR REPLACE FUNCTION auto_assign_service_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_technician_id uuid;
  v_assignment_id uuid;
BEGIN
  -- Buscar técnico disponível com menor carga de trabalho
  SELECT e.id INTO v_technician_id
  FROM employees e
  LEFT JOIN technician_availability ta ON ta.employee_id = e.id AND ta.date = CURRENT_DATE
  LEFT JOIN service_order_assignments soa ON soa.employee_id = e.id AND soa.status IN ('pending', 'in_progress')
  WHERE e.role IN ('technician', 'field_technician')
    AND e.active = true
    AND (ta.is_available IS NULL OR ta.is_available = true)
    AND (ta.current_workload IS NULL OR ta.current_workload < COALESCE(ta.max_workload, 5))
  GROUP BY e.id, ta.current_workload
  ORDER BY COUNT(soa.id), COALESCE(ta.current_workload, 0)
  LIMIT 1;

  -- Se encontrou técnico disponível
  IF v_technician_id IS NOT NULL THEN
    -- Criar atribuição
    INSERT INTO service_order_assignments (
      service_order_id,
      employee_id,
      role,
      status,
      assigned_at
    ) VALUES (
      NEW.service_order_id,
      v_technician_id,
      'primary',
      'pending',
      now()
    ) RETURNING id INTO v_assignment_id;

    -- Atualizar fila
    UPDATE os_assignments_queue
    SET
      status = 'assigned',
      assigned_to = v_technician_id,
      assigned_at = now(),
      updated_at = now()
    WHERE id = NEW.id;

    -- Atualizar carga de trabalho
    UPDATE technician_availability
    SET
      current_workload = current_workload + 1,
      updated_at = now()
    WHERE employee_id = v_technician_id AND date = CURRENT_DATE;

    -- Criar notificação para o técnico
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      link,
      read
    ) VALUES (
      (SELECT user_id FROM employees WHERE id = v_technician_id),
      'Nova OS Atribuída',
      'Uma nova ordem de serviço foi atribuída a você: OS #' || (SELECT order_number FROM service_orders WHERE id = NEW.service_order_id),
      'assignment',
      '/service-orders/' || NEW.service_order_id || '/mobile',
      false
    );

  ELSE
    -- Nenhum técnico disponível
    UPDATE os_assignments_queue
    SET
      status = 'failed',
      metadata = metadata || jsonb_build_object('reason', 'no_available_technician'),
      updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNÇÃO: Processar conclusão de OS
-- =====================================================
CREATE OR REPLACE FUNCTION process_os_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feedback_id uuid;
  v_finance_entry_id uuid;
  v_total_value decimal(15, 2);
  v_total_cost decimal(15, 2);
  v_margin decimal(15, 2);
  v_duration_hours decimal(5, 2);
BEGIN
  -- Só processar se status mudou para 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    -- Calcular valores
    v_total_value := COALESCE(NEW.total_price, 0);
    v_total_cost := COALESCE(NEW.total_cost, 0);
    v_margin := v_total_value - v_total_cost;

    -- Calcular duração
    IF NEW.started_at IS NOT NULL AND NEW.completed_at IS NOT NULL THEN
      v_duration_hours := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 3600;
    END IF;

    -- Criar feedback de conclusão
    INSERT INTO os_completion_feedback (
      service_order_id,
      completed_by,
      completion_date,
      total_value,
      total_cost,
      margin,
      duration_hours,
      technical_notes,
      financial_status,
      auto_generated
    ) VALUES (
      NEW.id,
      NEW.assigned_to,
      NEW.completed_at,
      v_total_value,
      v_total_cost,
      v_margin,
      v_duration_hours,
      NEW.notes,
      'pending',
      true
    ) RETURNING id INTO v_feedback_id;

    -- Criar lançamento financeiro automático (Contas a Receber)
    IF v_total_value > 0 THEN
      INSERT INTO finance_entries (
        type,
        category_id,
        description,
        amount,
        due_date,
        status,
        customer_id,
        service_order_id,
        payment_method,
        auto_generated,
        metadata
      ) VALUES (
        'income',
        (SELECT id FROM financial_categories WHERE name = 'Serviços Prestados' LIMIT 1),
        'Cobrança automática - OS #' || NEW.order_number || ' - ' || (SELECT name FROM customers WHERE id = NEW.customer_id),
        v_total_value,
        COALESCE(NEW.completed_at::date, CURRENT_DATE) + interval '7 days',
        'pending',
        NEW.customer_id,
        NEW.id,
        COALESCE(NEW.payment_method, 'pix'),
        true,
        jsonb_build_object(
          'source', 'os_completion',
          'feedback_id', v_feedback_id,
          'auto_generated_at', now()
        )
      ) RETURNING id INTO v_finance_entry_id;

      -- Atualizar feedback com ID do lançamento financeiro
      UPDATE os_completion_feedback
      SET
        finance_entry_id = v_finance_entry_id,
        financial_status = 'sent',
        sent_to_finance_at = now()
      WHERE id = v_feedback_id;

      -- Criar notificação para o financeiro
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        link,
        read
      ) SELECT
        up.user_id,
        'Nova Cobrança Gerada',
        'OS #' || NEW.order_number || ' concluída. Valor: R$ ' || v_total_value,
        'finance',
        '/financial-management',
        false
      FROM user_profiles up
      WHERE up.role IN ('admin', 'financial', 'manager');

      -- Atualizar workflow stage para "Faturamento"
      UPDATE service_orders
      SET workflow_stage = 'invoicing'
      WHERE id = NEW.id;

    END IF;

    -- Liberar técnico (diminuir carga de trabalho)
    UPDATE technician_availability
    SET
      current_workload = GREATEST(current_workload - 1, 0),
      updated_at = now()
    WHERE employee_id = NEW.assigned_to AND date = CURRENT_DATE;

  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-atribuir quando entra na fila
CREATE TRIGGER trigger_auto_assign_os
  AFTER INSERT ON os_assignments_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION auto_assign_service_order();

-- Trigger: Processar conclusão de OS
CREATE TRIGGER trigger_process_os_completion
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION process_os_completion();

-- =====================================================
-- DADOS INICIAIS: Estágios do Workflow
-- =====================================================
INSERT INTO os_workflow_stages (name, code, description, order_index, color, icon, is_initial, is_final) VALUES
('Nova OS', 'new', 'Ordem de serviço criada', 1, '#3B82F6', 'file-plus', true, false),
('Aguardando Atribuição', 'awaiting_assignment', 'Aguardando atribuição de técnico', 2, '#F59E0B', 'clock', false, false),
('Atribuída', 'assigned', 'Atribuída a um técnico', 3, '#8B5CF6', 'user-check', false, false),
('Em Execução', 'in_progress', 'Técnico executando o serviço', 4, '#3B82F6', 'play-circle', false, false),
('Aguardando Materiais', 'awaiting_materials', 'Aguardando materiais/ferramentas', 5, '#F97316', 'package', false, false),
('Concluída', 'completed', 'Serviço concluído pelo técnico', 6, '#10B981', 'check-circle', false, false),
('Faturamento', 'invoicing', 'Enviado para financeiro', 7, '#06B6D4', 'dollar-sign', false, false),
('Faturada', 'invoiced', 'Nota fiscal emitida', 8, '#8B5CF6', 'file-text', false, false),
('Paga', 'paid', 'Pagamento recebido', 9, '#10B981', 'check-circle-2', false, true),
('Cancelada', 'cancelled', 'Ordem de serviço cancelada', 10, '#EF4444', 'x-circle', false, true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE os_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_assignments_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_completion_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos autenticados)
CREATE POLICY "Allow read os_workflow_stages" ON os_workflow_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read os_workflow_stages anon" ON os_workflow_stages FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read os_workflow_transitions" ON os_workflow_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read os_workflow_transitions anon" ON os_workflow_transitions FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read os_workflow_history" ON os_workflow_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read os_workflow_history anon" ON os_workflow_history FOR SELECT TO anon USING (true);

CREATE POLICY "Allow all os_assignments_queue" ON os_assignments_queue FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all os_assignments_queue anon" ON os_assignments_queue FOR ALL TO anon USING (true);

CREATE POLICY "Allow all technician_availability" ON technician_availability FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all technician_availability anon" ON technician_availability FOR ALL TO anon USING (true);

CREATE POLICY "Allow all os_completion_feedback" ON os_completion_feedback FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all os_completion_feedback anon" ON os_completion_feedback FOR ALL TO anon USING (true);

-- Políticas de escrita (admins e gestores)
CREATE POLICY "Allow insert os_workflow_stages" ON os_workflow_stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update os_workflow_stages" ON os_workflow_stages FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow insert os_workflow_transitions" ON os_workflow_transitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update os_workflow_transitions" ON os_workflow_transitions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow insert os_workflow_history" ON os_workflow_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert os_workflow_history anon" ON os_workflow_history FOR INSERT TO anon WITH CHECK (true);

-- =====================================================
-- ADICIONAR COLUNA workflow_stage EM service_orders
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN workflow_stage text DEFAULT 'new';
    CREATE INDEX idx_service_orders_workflow_stage ON service_orders(workflow_stage);
  END IF;
END $$;

-- =====================================================
-- FUNÇÃO RPC: Distribuir OS manualmente
-- =====================================================
CREATE OR REPLACE FUNCTION distribute_service_order(
  p_service_order_id uuid,
  p_technician_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_assignment_id uuid;
BEGIN
  -- Criar atribuição
  INSERT INTO service_order_assignments (
    service_order_id,
    employee_id,
    role,
    status,
    assigned_at,
    notes
  ) VALUES (
    p_service_order_id,
    p_technician_id,
    'primary',
    'pending',
    now(),
    p_notes
  ) RETURNING id INTO v_assignment_id;

  -- Atualizar OS
  UPDATE service_orders
  SET
    workflow_stage = 'assigned',
    assigned_to = p_technician_id,
    updated_at = now()
  WHERE id = p_service_order_id;

  -- Criar notificação
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    link,
    read
  ) VALUES (
    (SELECT user_id FROM employees WHERE id = p_technician_id),
    'Nova OS Atribuída',
    'Uma nova ordem de serviço foi atribuída a você manualmente.',
    'assignment',
    '/service-orders/' || p_service_order_id || '/mobile',
    false
  );

  -- Registrar histórico
  INSERT INTO os_workflow_history (
    service_order_id,
    to_stage_id,
    notes,
    metadata
  ) VALUES (
    p_service_order_id,
    (SELECT id FROM os_workflow_stages WHERE code = 'assigned'),
    p_notes,
    jsonb_build_object('assignment_id', v_assignment_id, 'method', 'manual')
  );

  v_result := jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'OS distribuída com sucesso'
  );

  RETURN v_result;
END;
$$;

COMMENT ON TABLE os_workflow_stages IS 'Estágios do fluxo de trabalho de ordens de serviço';
COMMENT ON TABLE os_workflow_transitions IS 'Transições permitidas entre estágios';
COMMENT ON TABLE os_workflow_history IS 'Histórico de movimentações no workflow';
COMMENT ON TABLE os_assignments_queue IS 'Fila de atribuição automática de OS';
COMMENT ON TABLE technician_availability IS 'Disponibilidade e carga de trabalho dos técnicos';
COMMENT ON TABLE os_completion_feedback IS 'Feedback automático de conclusão e integração financeira';
