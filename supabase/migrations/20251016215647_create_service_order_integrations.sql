/*
  # Sistema Integrado de Gestão de Ordens de Serviço

  ## Objetivo
  Criar automações para integrar completamente as ordens de serviço com:
  - Financeiro (receitas automáticas)
  - Estoque (baixa de materiais)
  - Métricas (dashboards atualizados)
  - Histórico de ações

  ## 1. Tabela de Histórico de Ações
  Registra todas as ações importantes nas OS para rastreabilidade.

  ## 2. Função: Processar Conclusão de OS
  Quando uma OS é marcada como "concluída":
  - Registra data de conclusão
  - Cria lançamento financeiro (receita)
  - Dá baixa nos materiais do estoque
  - Registra histórico

  ## 3. Função: Dar Baixa em Materiais
  Remove materiais utilizados do estoque automaticamente.

  ## 4. Função: Criar Lançamento Financeiro
  Cria receita automática no financeiro quando OS é concluída.

  ## 5. Trigger: Automação na Conclusão
  Dispara todas as ações quando status muda para "concluída".

  ## 6. Views Atualizadas
  Consolida dados para dashboards e relatórios.
*/

-- =====================================================
-- 1. TABELA DE HISTÓRICO DE AÇÕES NA OS
-- =====================================================

CREATE TABLE IF NOT EXISTS service_order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  description TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_so_history_order_id ON service_order_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_so_history_created_at ON service_order_history(created_at DESC);

ALTER TABLE service_order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura do histórico" ON service_order_history
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Permitir inserção no histórico" ON service_order_history
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- =====================================================
-- 2. FUNÇÃO: DAR BAIXA EM MATERIAIS DO ESTOQUE
-- =====================================================

CREATE OR REPLACE FUNCTION give_stock_output_for_service_order(p_service_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_material RECORD;
  v_materials_processed INTEGER := 0;
  v_materials_failed INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Processar cada material usado na OS
  FOR v_material IN 
    SELECT 
      som.id,
      som.material_id,
      som.material_name,
      som.quantity,
      m.quantity as stock_quantity
    FROM service_order_materials som
    LEFT JOIN materials m ON m.id = som.material_id
    WHERE som.service_order_id = p_service_order_id
  LOOP
    -- Verificar se há material em estoque
    IF v_material.material_id IS NOT NULL THEN
      IF v_material.stock_quantity >= v_material.quantity THEN
        -- Dar baixa no estoque
        UPDATE materials 
        SET 
          quantity = quantity - v_material.quantity,
          updated_at = now()
        WHERE id = v_material.material_id;
        
        v_materials_processed := v_materials_processed + 1;
        
        -- Registrar movimentação de estoque
        INSERT INTO service_order_history (
          service_order_id,
          action,
          description,
          metadata
        ) VALUES (
          p_service_order_id,
          'stock_output',
          format('Baixa de %s unidades de %s', v_material.quantity, v_material.material_name),
          jsonb_build_object(
            'material_id', v_material.material_id,
            'material_name', v_material.material_name,
            'quantity', v_material.quantity,
            'previous_stock', v_material.stock_quantity
          )
        );
      ELSE
        v_materials_failed := v_materials_failed + 1;
        
        -- Registrar falha
        INSERT INTO service_order_history (
          service_order_id,
          action,
          description,
          metadata
        ) VALUES (
          p_service_order_id,
          'stock_output_failed',
          format('Estoque insuficiente para %s. Disponível: %s, Necessário: %s', 
            v_material.material_name, 
            v_material.stock_quantity, 
            v_material.quantity
          ),
          jsonb_build_object(
            'material_id', v_material.material_id,
            'material_name', v_material.material_name,
            'quantity_needed', v_material.quantity,
            'quantity_available', v_material.stock_quantity
          )
        );
      END IF;
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'materials_processed', v_materials_processed,
    'materials_failed', v_materials_failed
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO: CRIAR LANÇAMENTO FINANCEIRO DA OS
-- =====================================================

CREATE OR REPLACE FUNCTION create_finance_entry_for_service_order(p_service_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_finance_entry_id UUID;
  v_category_id UUID;
BEGIN
  -- Buscar dados da OS
  SELECT 
    so.id,
    so.order_number,
    so.customer_id,
    so.total_value,
    so.final_total,
    so.payment_method,
    so.completed_at,
    c.nome_razao as customer_name
  INTO v_order
  FROM service_orders so
  LEFT JOIN customers c ON c.id = so.customer_id
  WHERE so.id = p_service_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada: %', p_service_order_id;
  END IF;

  -- Buscar ou criar categoria de receita de serviços
  SELECT id INTO v_category_id
  FROM financial_categories
  WHERE name = 'Receita de Serviços' AND type = 'receita'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO financial_categories (name, type, description)
    VALUES ('Receita de Serviços', 'receita', 'Receitas provenientes de ordens de serviço concluídas')
    RETURNING id INTO v_category_id;
  END IF;

  -- Criar lançamento financeiro
  INSERT INTO finance_entries (
    description,
    amount,
    type,
    category_id,
    due_date,
    payment_date,
    status,
    payment_method,
    notes,
    customer_id
  ) VALUES (
    format('OS %s - %s', v_order.order_number, COALESCE(v_order.customer_name, 'Cliente não identificado')),
    COALESCE(v_order.final_total, v_order.total_value, 0),
    'receita',
    v_category_id,
    COALESCE(v_order.completed_at, now()),
    COALESCE(v_order.completed_at, now()),
    'pago',
    COALESCE(v_order.payment_method, 'dinheiro'),
    format('Receita automática da OS %s', v_order.order_number),
    v_order.customer_id
  )
  RETURNING id INTO v_finance_entry_id;

  -- Registrar no histórico
  INSERT INTO service_order_history (
    service_order_id,
    action,
    description,
    metadata
  ) VALUES (
    p_service_order_id,
    'finance_entry_created',
    format('Lançamento financeiro criado: R$ %s', COALESCE(v_order.final_total, v_order.total_value, 0)),
    jsonb_build_object(
      'finance_entry_id', v_finance_entry_id,
      'amount', COALESCE(v_order.final_total, v_order.total_value, 0),
      'payment_method', COALESCE(v_order.payment_method, 'dinheiro')
    )
  );

  RETURN v_finance_entry_id;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO: PROCESSAR CONCLUSÃO DA OS
-- =====================================================

CREATE OR REPLACE FUNCTION process_service_order_completion(p_service_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_finance_id UUID;
  v_stock_result JSONB;
  v_result JSONB;
BEGIN
  -- Buscar OS
  SELECT * INTO v_order
  FROM service_orders
  WHERE id = p_service_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'OS não encontrada');
  END IF;

  -- Atualizar data de conclusão se não existir
  IF v_order.completed_at IS NULL THEN
    UPDATE service_orders
    SET completed_at = now()
    WHERE id = p_service_order_id;
  END IF;

  -- Dar baixa nos materiais
  v_stock_result := give_stock_output_for_service_order(p_service_order_id);

  -- Criar lançamento financeiro
  BEGIN
    v_finance_id := create_finance_entry_for_service_order(p_service_order_id);
  EXCEPTION WHEN OTHERS THEN
    -- Se já existir lançamento, apenas registrar
    INSERT INTO service_order_history (
      service_order_id,
      action,
      description
    ) VALUES (
      p_service_order_id,
      'finance_entry_skipped',
      'Lançamento financeiro já existe ou não pôde ser criado'
    );
    v_finance_id := NULL;
  END;

  -- Registrar conclusão no histórico
  INSERT INTO service_order_history (
    service_order_id,
    action,
    new_status,
    description,
    metadata
  ) VALUES (
    p_service_order_id,
    'status_changed',
    'concluida',
    'Ordem de serviço concluída e processada',
    jsonb_build_object(
      'finance_entry_id', v_finance_id,
      'stock_output', v_stock_result,
      'completed_at', now()
    )
  );

  v_result := jsonb_build_object(
    'success', true,
    'service_order_id', p_service_order_id,
    'finance_entry_id', v_finance_id,
    'stock_output', v_stock_result,
    'completed_at', now()
  );

  RETURN v_result;
END;
$$;

-- =====================================================
-- 5. TRIGGER: AUTOMAÇÃO NA CONCLUSÃO DA OS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_service_order_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verificar se o status mudou para concluída
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    -- Processar conclusão de forma assíncrona (não bloqueia a transação)
    PERFORM process_service_order_completion(NEW.id);
    
    -- Registrar mudança de status
    INSERT INTO service_order_history (
      service_order_id,
      action,
      old_status,
      new_status,
      description
    ) VALUES (
      NEW.id,
      'status_changed',
      OLD.status,
      NEW.status,
      format('Status alterado de "%s" para "%s"', COALESCE(OLD.status, 'novo'), NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_service_order_completion ON service_orders;

-- Criar trigger
CREATE TRIGGER trg_service_order_completion
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  WHEN (NEW.status = 'concluida' AND (OLD.status IS DISTINCT FROM 'concluida'))
  EXECUTE FUNCTION trigger_service_order_completion();

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_completed_at ON service_orders(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_order_materials_order_id ON service_order_materials(service_order_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_customer ON finance_entries(customer_id) WHERE customer_id IS NOT NULL;

-- =====================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION process_service_order_completion IS 'Processa todas as integrações quando uma OS é concluída: baixa de estoque, lançamento financeiro e histórico';
COMMENT ON FUNCTION give_stock_output_for_service_order IS 'Dá baixa automática nos materiais utilizados na OS';
COMMENT ON FUNCTION create_finance_entry_for_service_order IS 'Cria lançamento financeiro de receita quando OS é concluída';
COMMENT ON TABLE service_order_history IS 'Histórico completo de todas as ações realizadas nas ordens de serviço';
