/*
  # Sistema de Rastreamento de Vendas e Execução

  ## Resumo
  Implementa separação completa entre:
  - **Vendedor/Comercial Interno**: Quem fechou a venda (cria a OS, faz proposta)
  - **Equipe Operacional Externa**: Quem executa o serviço (técnicos)

  ## 1. Novos Campos em service_orders
  
  ### Identificação de Vendedor
  - `created_by_employee_id`: Funcionário que criou a OS (vendedor)
  - `salesperson_id`: Vendedor responsável pela venda (pode ser diferente do criador)
  - `sales_commission_percentage`: Percentual de comissão de venda
  - `sales_commission_value`: Valor da comissão de venda

  ### Identificação de Execução
  - `execution_commission_percentage`: Percentual de comissão de execução
  - `execution_commission_value`: Valor da comissão de execução (dividido entre equipe)

  ## 2. Nova Tabela: employee_commissions
  
  Registra todas as comissões:
  - Tipo: venda ou execução
  - Valor e percentual
  - Status: pendente, aprovada, paga
  - Vínculo com OS e funcionário

  ## 3. Views Atualizadas
  
  - Performance de vendas (comercial interno)
  - Performance de execução (operacional externo)
  - Comissões por funcionário
  - Rankings separados

  ## 4. Segurança
  - RLS habilitado em todas as tabelas
  - Políticas de acesso apropriadas
*/

-- =====================================================
-- PARTE 1: ADICIONAR CAMPOS EM service_orders
-- =====================================================

-- Campos de identificação de vendedor
ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS created_by_employee_id uuid REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS salesperson_id uuid REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS sales_commission_percentage numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_commission_value numeric(15,2) DEFAULT 0;

-- Campos de comissão de execução
ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS execution_commission_percentage numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS execution_commission_value numeric(15,2) DEFAULT 0;

-- Comentários
COMMENT ON COLUMN service_orders.created_by_employee_id IS 'Funcionário que criou a OS (geralmente o vendedor)';
COMMENT ON COLUMN service_orders.salesperson_id IS 'Vendedor responsável pela venda (comercial interno)';
COMMENT ON COLUMN service_orders.sales_commission_percentage IS 'Percentual de comissão sobre a venda';
COMMENT ON COLUMN service_orders.sales_commission_value IS 'Valor da comissão de venda em R$';
COMMENT ON COLUMN service_orders.execution_commission_percentage IS 'Percentual de comissão de execução (dividido entre equipe)';
COMMENT ON COLUMN service_orders.execution_commission_value IS 'Valor total da comissão de execução';

-- =====================================================
-- PARTE 2: CRIAR TABELA DE COMISSÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculo com funcionário e OS
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  
  -- Tipo de comissão
  commission_type text NOT NULL CHECK (commission_type IN ('venda', 'execucao', 'bonus', 'meta', 'ranking')),
  
  -- Valores
  base_value numeric(15,2) NOT NULL DEFAULT 0, -- Valor base (ex: valor da OS)
  percentage numeric(5,2) NOT NULL DEFAULT 0, -- Percentual aplicado
  commission_value numeric(15,2) NOT NULL DEFAULT 0, -- Valor da comissão
  
  -- Divisão (para execução em equipe)
  total_team_members integer DEFAULT 1,
  member_share numeric(15,2) DEFAULT 0, -- Parte de cada membro
  
  -- Status
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'paga', 'cancelada')),
  payment_date date,
  payment_method text,
  
  -- Descrição e notas
  description text,
  notes text,
  
  -- Auditoria
  approved_by uuid REFERENCES employees(id),
  approved_at timestamp with time zone,
  paid_by uuid REFERENCES employees(id),
  paid_at timestamp with time zone,
  
  -- Datas
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_commissions_employee ON employee_commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_os ON employee_commissions(service_order_id);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_type ON employee_commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_status ON employee_commissions(status);
CREATE INDEX IF NOT EXISTS idx_employee_commissions_date ON employee_commissions(created_at);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_employee_commissions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_commissions_timestamp ON employee_commissions;
CREATE TRIGGER update_employee_commissions_timestamp
  BEFORE UPDATE ON employee_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_commissions_timestamp();

-- RLS
ALTER TABLE employee_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público leitura employee_commissions"
  ON employee_commissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Acesso público escrita employee_commissions"
  ON employee_commissions FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PARTE 3: FUNÇÃO DE CÁLCULO AUTOMÁTICO DE COMISSÕES
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_and_create_commissions(p_service_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os service_orders%ROWTYPE;
  v_team_count integer;
  v_commission_id uuid;
  v_result jsonb;
  v_commissions_created jsonb[] := '{}';
BEGIN
  -- Buscar OS
  SELECT * INTO v_os FROM service_orders WHERE id = p_service_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'OS não encontrada: %', p_service_order_id;
  END IF;
  
  -- Apenas processar se OS estiver concluída
  IF v_os.status NOT IN ('concluida', 'completed', 'finalizada') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'OS precisa estar concluída para gerar comissões'
    );
  END IF;
  
  -- ========================================
  -- 1. COMISSÃO DE VENDA (Comercial Interno)
  -- ========================================
  
  IF v_os.salesperson_id IS NOT NULL AND v_os.sales_commission_value > 0 THEN
    -- Verificar se já existe
    IF NOT EXISTS (
      SELECT 1 FROM employee_commissions 
      WHERE service_order_id = p_service_order_id 
        AND employee_id = v_os.salesperson_id
        AND commission_type = 'venda'
    ) THEN
      INSERT INTO employee_commissions (
        employee_id,
        service_order_id,
        commission_type,
        base_value,
        percentage,
        commission_value,
        member_share,
        status,
        description
      ) VALUES (
        v_os.salesperson_id,
        p_service_order_id,
        'venda',
        v_os.total_value,
        v_os.sales_commission_percentage,
        v_os.sales_commission_value,
        v_os.sales_commission_value,
        'pendente',
        format('Comissão de venda - OS #%s', v_os.order_number)
      ) RETURNING id INTO v_commission_id;
      
      v_commissions_created := v_commissions_created || jsonb_build_object(
        'type', 'venda',
        'employee_id', v_os.salesperson_id,
        'value', v_os.sales_commission_value,
        'commission_id', v_commission_id
      );
    END IF;
  END IF;
  
  -- ========================================
  -- 2. COMISSÃO DE EXECUÇÃO (Operacional Externo)
  -- ========================================
  
  IF v_os.execution_commission_value > 0 THEN
    -- Contar membros da equipe
    SELECT COUNT(DISTINCT employee_id) INTO v_team_count
    FROM service_order_team
    WHERE service_order_id = p_service_order_id;
    
    IF v_team_count = 0 THEN
      -- Se não tem equipe definida, usar assigned_to
      v_team_count := 1;
      
      IF v_os.assigned_to IS NOT NULL THEN
        INSERT INTO employee_commissions (
          employee_id,
          service_order_id,
          commission_type,
          base_value,
          percentage,
          commission_value,
          total_team_members,
          member_share,
          status,
          description
        ) VALUES (
          v_os.assigned_to::uuid,
          p_service_order_id,
          'execucao',
          v_os.total_value,
          v_os.execution_commission_percentage,
          v_os.execution_commission_value,
          1,
          v_os.execution_commission_value,
          'pendente',
          format('Comissão de execução - OS #%s', v_os.order_number)
        ) RETURNING id INTO v_commission_id;
        
        v_commissions_created := v_commissions_created || jsonb_build_object(
          'type', 'execucao',
          'employee_id', v_os.assigned_to::uuid,
          'value', v_os.execution_commission_value,
          'commission_id', v_commission_id
        );
      END IF;
    ELSE
      -- Dividir entre membros da equipe
      FOR v_commission_id IN (
        SELECT DISTINCT employee_id
        FROM service_order_team
        WHERE service_order_id = p_service_order_id
      ) LOOP
        -- Verificar se já existe
        IF NOT EXISTS (
          SELECT 1 FROM employee_commissions 
          WHERE service_order_id = p_service_order_id 
            AND employee_id = v_commission_id
            AND commission_type = 'execucao'
        ) THEN
          INSERT INTO employee_commissions (
            employee_id,
            service_order_id,
            commission_type,
            base_value,
            percentage,
            commission_value,
            total_team_members,
            member_share,
            status,
            description
          ) VALUES (
            v_commission_id,
            p_service_order_id,
            'execucao',
            v_os.total_value,
            v_os.execution_commission_percentage,
            v_os.execution_commission_value,
            v_team_count,
            v_os.execution_commission_value / v_team_count,
            'pendente',
            format('Comissão de execução (1/%s) - OS #%s', v_team_count, v_os.order_number)
          );
          
          v_commissions_created := v_commissions_created || jsonb_build_object(
            'type', 'execucao',
            'employee_id', v_commission_id,
            'value', v_os.execution_commission_value / v_team_count,
            'share', format('1/%s', v_team_count)
          );
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'service_order_id', p_service_order_id,
    'order_number', v_os.order_number,
    'total_value', v_os.total_value,
    'sales_commission', v_os.sales_commission_value,
    'execution_commission', v_os.execution_commission_value,
    'commissions_created', v_commissions_created
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- PARTE 4: VIEWS DE PERFORMANCE SEPARADAS
-- =====================================================

-- View de Performance de VENDAS (Comercial Interno)
CREATE OR REPLACE VIEW v_sales_performance AS
SELECT
  e.id as employee_id,
  e.name as employee_name,
  e.role,
  e.department,
  e.photo_url,
  
  -- Métricas de vendas
  COUNT(DISTINCT so.id) as total_sales,
  COALESCE(SUM(so.total_value), 0) as total_revenue,
  COALESCE(AVG(so.total_value), 0) as avg_sale_value,
  
  -- Comissões
  COALESCE(SUM(so.sales_commission_value), 0) as total_commission_earned,
  COALESCE(SUM(CASE WHEN ec.status = 'paga' THEN ec.commission_value ELSE 0 END), 0) as commission_paid,
  COALESCE(SUM(CASE WHEN ec.status = 'pendente' THEN ec.commission_value ELSE 0 END), 0) as commission_pending,
  
  -- Taxas
  ROUND(
    COUNT(DISTINCT CASE WHEN so.status IN ('concluida', 'completed', 'finalizada') THEN so.id END)::numeric / 
    NULLIF(COUNT(DISTINCT so.id), 0) * 100, 
    2
  ) as conversion_rate,
  
  -- Período
  MIN(so.created_at) as first_sale_date,
  MAX(so.created_at) as last_sale_date
  
FROM employees e
LEFT JOIN service_orders so ON so.salesperson_id = e.id
LEFT JOIN employee_commissions ec ON ec.employee_id = e.id 
  AND ec.service_order_id = so.id 
  AND ec.commission_type = 'venda'
WHERE e.active = true
  AND (e.department = 'Comercial' OR e.role LIKE '%Vendedor%' OR e.role LIKE '%Comercial%')
GROUP BY e.id, e.name, e.role, e.department, e.photo_url
ORDER BY total_revenue DESC;

-- View de Performance de EXECUÇÃO (Operacional Externo)
CREATE OR REPLACE VIEW v_execution_performance AS
SELECT
  e.id as employee_id,
  e.name as employee_name,
  e.role,
  e.department,
  e.photo_url,
  
  -- Métricas de execução
  COUNT(DISTINCT sot.service_order_id) as total_jobs,
  COUNT(DISTINCT CASE WHEN sot.role = 'leader' THEN sot.service_order_id END) as jobs_as_leader,
  COALESCE(SUM(so.total_value), 0) as total_value_executed,
  
  -- Comissões de execução
  COALESCE(SUM(ec.member_share), 0) as total_commission_earned,
  COALESCE(SUM(CASE WHEN ec.status = 'paga' THEN ec.member_share ELSE 0 END), 0) as commission_paid,
  COALESCE(SUM(CASE WHEN ec.status = 'pendente' THEN ec.member_share ELSE 0 END), 0) as commission_pending,
  
  -- Qualidade
  ROUND(
    COUNT(DISTINCT CASE WHEN so.status IN ('concluida', 'completed', 'finalizada') THEN so.id END)::numeric / 
    NULLIF(COUNT(DISTINCT sot.service_order_id), 0) * 100, 
    2
  ) as completion_rate,
  
  -- Período
  MIN(so.created_at) as first_job_date,
  MAX(so.created_at) as last_job_date
  
FROM employees e
LEFT JOIN service_order_team sot ON sot.employee_id = e.id
LEFT JOIN service_orders so ON so.id = sot.service_order_id
LEFT JOIN employee_commissions ec ON ec.employee_id = e.id 
  AND ec.service_order_id = so.id 
  AND ec.commission_type = 'execucao'
WHERE e.active = true
  AND (e.department IN ('Operacional', 'Técnico') OR e.role LIKE '%Técnico%' OR e.role LIKE '%Instalador%')
GROUP BY e.id, e.name, e.role, e.department, e.photo_url
ORDER BY total_value_executed DESC;

-- View de Comissões Consolidadas por Funcionário
CREATE OR REPLACE VIEW v_employee_commissions_summary AS
SELECT
  e.id as employee_id,
  e.name as employee_name,
  e.role,
  e.department,
  
  -- Comissões de venda
  COALESCE(SUM(CASE WHEN ec.commission_type = 'venda' THEN ec.commission_value ELSE 0 END), 0) as total_sales_commission,
  COALESCE(SUM(CASE WHEN ec.commission_type = 'venda' AND ec.status = 'paga' THEN ec.commission_value ELSE 0 END), 0) as sales_commission_paid,
  COALESCE(SUM(CASE WHEN ec.commission_type = 'venda' AND ec.status = 'pendente' THEN ec.commission_value ELSE 0 END), 0) as sales_commission_pending,
  
  -- Comissões de execução
  COALESCE(SUM(CASE WHEN ec.commission_type = 'execucao' THEN ec.member_share ELSE 0 END), 0) as total_execution_commission,
  COALESCE(SUM(CASE WHEN ec.commission_type = 'execucao' AND ec.status = 'paga' THEN ec.member_share ELSE 0 END), 0) as execution_commission_paid,
  COALESCE(SUM(CASE WHEN ec.commission_type = 'execucao' AND ec.status = 'pendente' THEN ec.member_share ELSE 0 END), 0) as execution_commission_pending,
  
  -- Total geral
  COALESCE(SUM(
    CASE 
      WHEN ec.commission_type = 'venda' THEN ec.commission_value
      ELSE ec.member_share
    END
  ), 0) as total_commission,
  
  COALESCE(SUM(
    CASE 
      WHEN ec.status = 'paga' THEN 
        CASE WHEN ec.commission_type = 'venda' THEN ec.commission_value ELSE ec.member_share END
      ELSE 0
    END
  ), 0) as total_paid,
  
  COALESCE(SUM(
    CASE 
      WHEN ec.status = 'pendente' THEN 
        CASE WHEN ec.commission_type = 'venda' THEN ec.commission_value ELSE ec.member_share END
      ELSE 0
    END
  ), 0) as total_pending,
  
  -- Contadores
  COUNT(DISTINCT CASE WHEN ec.commission_type = 'venda' THEN ec.service_order_id END) as total_sales,
  COUNT(DISTINCT CASE WHEN ec.commission_type = 'execucao' THEN ec.service_order_id END) as total_executions
  
FROM employees e
LEFT JOIN employee_commissions ec ON ec.employee_id = e.id
WHERE e.active = true
GROUP BY e.id, e.name, e.role, e.department
ORDER BY total_commission DESC;

-- =====================================================
-- PARTE 5: TRIGGER AUTOMÁTICO DE COMISSÕES
-- =====================================================

CREATE OR REPLACE FUNCTION auto_calculate_commissions_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando OS é concluída, calcular comissões automaticamente
  IF NEW.status IN ('concluida', 'completed', 'finalizada') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('concluida', 'completed', 'finalizada')) THEN
    
    -- Calcular e criar comissões
    PERFORM calculate_and_create_commissions(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_calculate_commissions ON service_orders;
CREATE TRIGGER trigger_auto_calculate_commissions
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_commissions_on_completion();

-- =====================================================
-- PARTE 6: FUNÇÃO DE APROVAÇÃO/PAGAMENTO DE COMISSÕES
-- =====================================================

CREATE OR REPLACE FUNCTION approve_commission(
  p_commission_id uuid,
  p_approved_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission employee_commissions%ROWTYPE;
BEGIN
  SELECT * INTO v_commission FROM employee_commissions WHERE id = p_commission_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Comissão não encontrada');
  END IF;
  
  UPDATE employee_commissions
  SET 
    status = 'aprovada',
    approved_by = p_approved_by,
    approved_at = now()
  WHERE id = p_commission_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'commission_id', p_commission_id,
    'employee_id', v_commission.employee_id,
    'value', CASE WHEN v_commission.commission_type = 'venda' 
                   THEN v_commission.commission_value 
                   ELSE v_commission.member_share END
  );
END;
$$;

CREATE OR REPLACE FUNCTION pay_commission(
  p_commission_id uuid,
  p_paid_by uuid,
  p_payment_method text DEFAULT 'transferencia'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission employee_commissions%ROWTYPE;
  v_payment_value numeric;
BEGIN
  SELECT * INTO v_commission FROM employee_commissions WHERE id = p_commission_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Comissão não encontrada');
  END IF;
  
  IF v_commission.status = 'paga' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Comissão já foi paga');
  END IF;
  
  v_payment_value := CASE WHEN v_commission.commission_type = 'venda' 
                          THEN v_commission.commission_value 
                          ELSE v_commission.member_share END;
  
  UPDATE employee_commissions
  SET 
    status = 'paga',
    payment_date = CURRENT_DATE,
    payment_method = p_payment_method,
    paid_by = p_paid_by,
    paid_at = now()
  WHERE id = p_commission_id;
  
  -- Registrar lançamento financeiro
  INSERT INTO finance_entries (
    tipo,
    categoria,
    descricao,
    valor,
    data_vencimento,
    data_pagamento,
    status,
    employee_id,
    observacoes
  ) VALUES (
    'saida',
    'Comissões',
    format('Comissão de %s - %s', 
      CASE v_commission.commission_type 
        WHEN 'venda' THEN 'vendas'
        WHEN 'execucao' THEN 'execução'
        ELSE v_commission.commission_type
      END,
      (SELECT name FROM employees WHERE id = v_commission.employee_id)
    ),
    v_payment_value,
    CURRENT_DATE,
    CURRENT_DATE,
    'pago',
    v_commission.employee_id,
    format('Ref: OS #%s', (SELECT order_number FROM service_orders WHERE id = v_commission.service_order_id))
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'commission_id', p_commission_id,
    'employee_id', v_commission.employee_id,
    'value_paid', v_payment_value,
    'payment_method', p_payment_method
  );
END;
$$;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON TABLE employee_commissions IS 'Registro de todas as comissões de funcionários (vendas e execução)';
COMMENT ON FUNCTION calculate_and_create_commissions IS 'Calcula e cria automaticamente comissões de venda e execução';
COMMENT ON VIEW v_sales_performance IS 'Performance de vendas do comercial interno';
COMMENT ON VIEW v_execution_performance IS 'Performance de execução do operacional externo';
COMMENT ON VIEW v_employee_commissions_summary IS 'Resumo consolidado de comissões por funcionário';
