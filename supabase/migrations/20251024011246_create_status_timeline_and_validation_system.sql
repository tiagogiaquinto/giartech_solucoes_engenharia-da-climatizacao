/*
  # Sistema de Timeline e Validação para OSs

  1. Nova Tabela - Timeline de Status
    - `service_order_status_history`
      - Histórico completo de mudanças de status
      - Quem mudou, quando, comentários
      - Status anterior e novo
      - Notificações enviadas

  2. Nova Tabela - Validações e Alertas
    - `service_order_validation_alerts`
      - Alertas de validação
      - Sugestões automáticas
      - Campos pendentes
      - Nível de criticidade

  3. Nova Tabela - Configurações de Validação
    - `validation_rules`
      - Regras de validação customizáveis
      - Campos obrigatórios
      - Limites e ranges
      - Mensagens personalizadas

  4. Functions
    - Criar entrada de histórico automaticamente
    - Verificar validações pendentes
    - Gerar alertas automáticos

  5. Segurança
    - RLS policies
    - Triggers automáticos
*/

-- =====================================================
-- 1. TIMELINE DE STATUS
-- =====================================================

CREATE TABLE IF NOT EXISTS service_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  comments TEXT,
  duration_in_status INTERVAL,
  notification_sent BOOLEAN DEFAULT false,
  notification_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_history_service_order ON service_order_status_history(service_order_id);
CREATE INDEX idx_status_history_status ON service_order_status_history(new_status);
CREATE INDEX idx_status_history_date ON service_order_status_history(created_at DESC);

-- =====================================================
-- 2. SISTEMA DE VALIDAÇÃO E ALERTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS service_order_validation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID REFERENCES service_orders(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'error', 'warning', 'info', 'suggestion'
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  category TEXT DEFAULT 'geral', -- 'cliente', 'materiais', 'estoque', 'prazo', 'financeiro'
  field_name TEXT,
  message TEXT NOT NULL,
  suggestion TEXT,
  is_blocking BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validation_alerts_service_order ON service_order_validation_alerts(service_order_id);
CREATE INDEX idx_validation_alerts_type ON service_order_validation_alerts(alert_type);
CREATE INDEX idx_validation_alerts_resolved ON service_order_validation_alerts(is_resolved);
CREATE INDEX idx_validation_alerts_blocking ON service_order_validation_alerts(is_blocking) WHERE is_blocking = true;

-- =====================================================
-- 3. REGRAS DE VALIDAÇÃO CONFIGURÁVEIS
-- =====================================================

CREATE TABLE IF NOT EXISTS validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  entity_type TEXT DEFAULT 'service_order', -- 'service_order', 'customer', 'material'
  field_name TEXT,
  rule_type TEXT NOT NULL, -- 'required', 'min', 'max', 'regex', 'custom'
  rule_value JSONB,
  error_message TEXT NOT NULL,
  suggestion_message TEXT,
  severity TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  is_blocking BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_validation_rules_entity ON validation_rules(entity_type);
CREATE INDEX idx_validation_rules_active ON validation_rules(is_active) WHERE is_active = true;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function para registrar mudança de status automaticamente
CREATE OR REPLACE FUNCTION track_service_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_duration INTERVAL;
  v_last_change TIMESTAMPTZ;
BEGIN
  -- Se o status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Calcular duração no status anterior
    SELECT created_at INTO v_last_change
    FROM service_order_status_history
    WHERE service_order_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_last_change IS NOT NULL THEN
      v_duration := NOW() - v_last_change;
    END IF;
    
    -- Inserir histórico
    INSERT INTO service_order_status_history (
      service_order_id,
      old_status,
      new_status,
      changed_by_name,
      duration_in_status
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(current_setting('app.current_user_name', true), 'Sistema'),
      v_duration
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para rastrear mudanças de status
DROP TRIGGER IF EXISTS trigger_track_status_change ON service_orders;
CREATE TRIGGER trigger_track_status_change
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_service_order_status_change();

-- Function para validar OS e gerar alertas
CREATE OR REPLACE FUNCTION validate_service_order(p_service_order_id UUID)
RETURNS TABLE(
  alert_count INTEGER,
  blocking_count INTEGER,
  warnings_count INTEGER,
  suggestions_count INTEGER
) AS $$
DECLARE
  v_so RECORD;
  v_customer RECORD;
  v_alert_count INTEGER := 0;
  v_blocking_count INTEGER := 0;
  v_warnings_count INTEGER := 0;
  v_suggestions_count INTEGER := 0;
BEGIN
  -- Buscar OS
  SELECT * INTO v_so
  FROM service_orders
  WHERE id = p_service_order_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Limpar alertas antigos não resolvidos
  DELETE FROM service_order_validation_alerts
  WHERE service_order_id = p_service_order_id
  AND is_resolved = false;
  
  -- 1. Validar Cliente
  IF v_so.customer_id IS NULL THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, is_blocking
    ) VALUES (
      p_service_order_id, 'error', 'critical', 'cliente', 'customer_id',
      'Cliente não selecionado', true
    );
    v_blocking_count := v_blocking_count + 1;
  ELSE
    -- Validar dados do cliente
    SELECT * INTO v_customer
    FROM customers
    WHERE id = v_so.customer_id;
    
    IF v_customer.email IS NULL OR v_customer.email = '' THEN
      INSERT INTO service_order_validation_alerts (
        service_order_id, alert_type, severity, category, field_name, message, suggestion
      ) VALUES (
        p_service_order_id, 'warning', 'medium', 'cliente', 'customer.email',
        'Cliente sem email cadastrado',
        'Adicione um email para enviar notificações automáticas'
      );
      v_warnings_count := v_warnings_count + 1;
    END IF;
    
    IF v_customer.celular IS NULL OR v_customer.celular = '' THEN
      INSERT INTO service_order_validation_alerts (
        service_order_id, alert_type, severity, category, field_name, message, suggestion
      ) VALUES (
        p_service_order_id, 'warning', 'medium', 'cliente', 'customer.celular',
        'Cliente sem telefone cadastrado',
        'Adicione um telefone para contato via WhatsApp'
      );
      v_warnings_count := v_warnings_count + 1;
    END IF;
  END IF;
  
  -- 2. Validar Descrição
  IF v_so.description IS NULL OR LENGTH(TRIM(v_so.description)) < 10 THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, is_blocking
    ) VALUES (
      p_service_order_id, 'error', 'high', 'geral', 'description',
      'Descrição muito curta ou vazia', true
    );
    v_blocking_count := v_blocking_count + 1;
  END IF;
  
  -- 3. Validar Data Agendada
  IF v_so.scheduled_at IS NULL THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, suggestion
    ) VALUES (
      p_service_order_id, 'warning', 'medium', 'prazo', 'scheduled_at',
      'Data de agendamento não definida',
      'Defina uma data para melhor organização da agenda'
    );
    v_warnings_count := v_warnings_count + 1;
  ELSIF v_so.scheduled_at < NOW() THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message
    ) VALUES (
      p_service_order_id, 'warning', 'high', 'prazo', 'scheduled_at',
      'Data agendada já passou'
    );
    v_warnings_count := v_warnings_count + 1;
  END IF;
  
  -- 4. Validar Prazo
  IF v_so.prazo_execucao_dias IS NULL OR v_so.prazo_execucao_dias < 1 THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, suggestion
    ) VALUES (
      p_service_order_id, 'info', 'low', 'prazo', 'prazo_execucao_dias',
      'Prazo de execução não definido',
      'Prazo padrão: 15 dias'
    );
  END IF;
  
  -- 5. Validar Valores
  IF v_so.total_value IS NULL OR v_so.total_value <= 0 THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, suggestion
    ) VALUES (
      p_service_order_id, 'warning', 'high', 'financeiro', 'total_value',
      'Valor total não calculado ou zero',
      'Adicione serviços e materiais para calcular o valor'
    );
    v_warnings_count := v_warnings_count + 1;
  END IF;
  
  -- 6. Validar Margem de Lucro
  IF v_so.profit_margin IS NOT NULL AND v_so.profit_margin < 15 THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, suggestion
    ) VALUES (
      p_service_order_id, 'warning', 'high', 'financeiro', 'profit_margin',
      FORMAT('Margem de lucro muito baixa: %.1f%%', v_so.profit_margin),
      'Recomendado: mínimo 30%. Considere aumentar o valor ou reduzir custos'
    );
    v_warnings_count := v_warnings_count + 1;
  END IF;
  
  -- 7. Validar Itens de Serviço
  IF NOT EXISTS (
    SELECT 1 FROM service_order_items WHERE service_order_id = p_service_order_id
  ) THEN
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, is_blocking
    ) VALUES (
      p_service_order_id, 'error', 'critical', 'geral', 'service_items',
      'Nenhum serviço adicionado', true
    );
    v_blocking_count := v_blocking_count + 1;
  END IF;
  
  -- 8. Verificar materiais em falta no estoque
  FOR v_so IN (
    SELECT 
      som.material_id,
      som.quantity_needed,
      ii.current_quantity,
      ii.product_name
    FROM service_order_materials som
    LEFT JOIN inventory_items ii ON ii.id = som.material_id
    WHERE som.service_order_id = p_service_order_id
    AND ii.current_quantity < som.quantity_needed
  ) LOOP
    INSERT INTO service_order_validation_alerts (
      service_order_id, alert_type, severity, category, field_name, message, suggestion
    ) VALUES (
      p_service_order_id, 'warning', 'high', 'estoque', 'materials',
      FORMAT('Material "%s" em falta no estoque', v_so.product_name),
      FORMAT('Necessário: %s | Disponível: %s', v_so.quantity_needed, v_so.current_quantity)
    );
    v_warnings_count := v_warnings_count + 1;
  END LOOP;
  
  -- Contar total de alertas
  SELECT COUNT(*) INTO v_alert_count
  FROM service_order_validation_alerts
  WHERE service_order_id = p_service_order_id
  AND is_resolved = false;
  
  -- Retornar contagens
  RETURN QUERY SELECT v_alert_count, v_blocking_count, v_warnings_count, v_suggestions_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSERIR REGRAS DE VALIDAÇÃO PADRÃO
-- =====================================================

INSERT INTO validation_rules (rule_name, description, entity_type, field_name, rule_type, rule_value, error_message, severity, is_blocking) VALUES
('customer_required', 'Cliente é obrigatório', 'service_order', 'customer_id', 'required', 'null'::jsonb, 'Selecione um cliente', 'critical', true),
('description_min_length', 'Descrição deve ter no mínimo 10 caracteres', 'service_order', 'description', 'min', '{"length": 10}'::jsonb, 'Descrição muito curta', 'high', true),
('total_value_required', 'Valor total deve ser maior que zero', 'service_order', 'total_value', 'min', '{"value": 0.01}'::jsonb, 'Adicione serviços para calcular o valor', 'high', false),
('service_items_required', 'Pelo menos um serviço deve ser adicionado', 'service_order', 'service_items', 'required', 'null'::jsonb, 'Adicione serviços à ordem', 'critical', true),
('profit_margin_warning', 'Margem de lucro abaixo do recomendado', 'service_order', 'profit_margin', 'min', '{"value": 15}'::jsonb, 'Margem abaixo de 15%', 'medium', false)
ON CONFLICT (rule_name) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Status History
ALTER TABLE service_order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view status history - anon"
  ON service_order_status_history FOR SELECT TO anon USING (true);

CREATE POLICY "System can insert status history"
  ON service_order_status_history FOR INSERT TO anon WITH CHECK (true);

-- Validation Alerts
ALTER TABLE service_order_validation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view alerts - anon"
  ON service_order_validation_alerts FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can manage alerts - anon"
  ON service_order_validation_alerts FOR ALL TO anon USING (true) WITH CHECK (true);

-- Validation Rules
ALTER TABLE validation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rules - anon"
  ON validation_rules FOR SELECT TO anon USING (true);

CREATE POLICY "Anyone can manage rules - anon"
  ON validation_rules FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE service_order_status_history IS 'Histórico completo de mudanças de status das OSs';
COMMENT ON TABLE service_order_validation_alerts IS 'Alertas e sugestões de validação em tempo real';
COMMENT ON TABLE validation_rules IS 'Regras de validação configuráveis do sistema';
COMMENT ON FUNCTION validate_service_order IS 'Valida OS e gera alertas automáticos';
COMMENT ON FUNCTION track_service_order_status_change IS 'Rastreia mudanças de status automaticamente';
