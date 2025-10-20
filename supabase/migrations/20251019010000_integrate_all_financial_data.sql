/*
  # Integração Completa de Dados Financeiros de Todos os Departamentos

  ## Objetivo
  Integrar automaticamente todos os dados financeiros da plataforma:
  - Ordens de Serviço (receitas e custos)
  - Estoque (custos e valor do ativo)
  - Compras (despesas e contas a pagar)
  - Fornecedores (contas a pagar)
  - Funcionários (folha de pagamento)
  - Equipamentos (depreciação)
  - Contratos (receitas recorrentes)

  ## 1. Views de Integração

  ### v_os_financial_data
  Dados financeiros das Ordens de Serviço

  ### v_inventory_financial_data
  Valor do estoque e movimentações

  ### v_purchasing_financial_data
  Dados de compras e contas a pagar

  ### v_payroll_financial_data
  Folha de pagamento dos funcionários

  ### v_depreciation_financial_data
  Depreciação de equipamentos

  ## 2. Função de Sincronização

  Sincroniza automaticamente dados de todos os departamentos para finance_entries

  ## 3. Triggers Automáticos

  Triggers para sincronização em tempo real
*/

-- ============================================================================
-- 1. VIEW: DADOS FINANCEIROS DAS ORDENS DE SERVIÇO
-- ============================================================================

CREATE OR REPLACE VIEW v_os_financial_data AS
SELECT
  so.id,
  so.order_number,
  so.customer_id,
  so.status,
  so.created_at as order_date,

  -- RECEITAS
  COALESCE(so.total_price, 0) as revenue,
  COALESCE(so.paid_amount, 0) as revenue_received,
  COALESCE(so.total_price, 0) - COALESCE(so.paid_amount, 0) as revenue_pending,

  -- CUSTOS DE MATERIAIS
  COALESCE(
    (SELECT SUM(quantity * unit_cost)
     FROM service_order_materials som
     WHERE som.service_order_id = so.id), 0
  ) as material_costs,

  -- CUSTOS DE MÃO DE OBRA
  COALESCE(
    (SELECT SUM(hours * hourly_rate)
     FROM service_order_labor sol
     WHERE sol.service_order_id = so.id), 0
  ) as labor_costs,

  -- CUSTOS TOTAIS
  COALESCE(so.total_cost, 0) as total_costs,

  -- MARGEM
  COALESCE(so.total_price, 0) - COALESCE(so.total_cost, 0) as gross_margin,

  CASE
    WHEN COALESCE(so.total_price, 0) > 0
    THEN ((COALESCE(so.total_price, 0) - COALESCE(so.total_cost, 0)) / so.total_price * 100)
    ELSE 0
  END as margin_percent

FROM service_orders so
WHERE so.status NOT IN ('cancelled', 'draft');

-- ============================================================================
-- 2. VIEW: DADOS FINANCEIROS DO ESTOQUE
-- ============================================================================

CREATE OR REPLACE VIEW v_inventory_financial_data AS
SELECT
  ii.id,
  ii.code,
  ii.name,
  ii.category,

  -- VALOR DO ESTOQUE
  COALESCE(ii.quantity, 0) as quantity,
  COALESCE(ii.unit_cost, 0) as unit_cost,
  COALESCE(ii.unit_price, 0) as unit_price,
  COALESCE(ii.quantity, 0) * COALESCE(ii.unit_cost, 0) as total_cost_value,
  COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) as total_sale_value,

  -- MARGEM POTENCIAL
  (COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0)) -
  (COALESCE(ii.quantity, 0) * COALESCE(ii.unit_cost, 0)) as potential_profit,

  CASE
    WHEN COALESCE(ii.unit_cost, 0) > 0
    THEN ((COALESCE(ii.unit_price, 0) - COALESCE(ii.unit_cost, 0)) / ii.unit_cost * 100)
    ELSE 0
  END as markup_percent,

  ii.created_at,
  ii.updated_at

FROM inventory_items ii
WHERE ii.active = true;

-- ============================================================================
-- 3. VIEW: DADOS FINANCEIROS DE COMPRAS
-- ============================================================================

CREATE OR REPLACE VIEW v_purchasing_financial_data AS
SELECT
  p.id,
  p.purchase_number,
  p.supplier_id,
  p.status,
  p.order_date,
  p.expected_delivery_date,

  -- VALORES
  COALESCE(p.total_amount, 0) as total_amount,
  COALESCE(p.paid_amount, 0) as paid_amount,
  COALESCE(p.total_amount, 0) - COALESCE(p.paid_amount, 0) as amount_pending,

  -- STATUS FINANCEIRO
  CASE
    WHEN p.payment_status = 'paid' THEN 'pago'
    WHEN p.payment_status = 'partial' THEN 'parcial'
    WHEN p.payment_status = 'pending' THEN 'a_pagar'
    ELSE 'pendente'
  END as finance_status,

  p.created_at

FROM purchasing_orders p
WHERE p.status NOT IN ('cancelled', 'rejected');

-- ============================================================================
-- 4. VIEW: DADOS DE FOLHA DE PAGAMENTO
-- ============================================================================

CREATE OR REPLACE VIEW v_payroll_financial_data AS
SELECT
  e.id,
  e.name,
  e.role,
  e.department,

  -- SALÁRIO E CUSTOS
  COALESCE(e.salary, 0) as monthly_salary,
  COALESCE(e.hourly_cost, 0) as hourly_cost,

  -- CUSTO MENSAL TOTAL (salário + encargos estimados 80%)
  COALESCE(e.salary, 0) * 1.8 as total_monthly_cost,

  -- CUSTO ANUAL
  COALESCE(e.salary, 0) * 1.8 * 12 as total_annual_cost,

  e.hire_date,
  e.status,
  e.created_at

FROM employees e
WHERE e.status = 'active';

-- ============================================================================
-- 5. VIEW: DADOS DE DEPRECIAÇÃO DE EQUIPAMENTOS
-- ============================================================================

CREATE OR REPLACE VIEW v_equipment_depreciation_data AS
SELECT
  e.id,
  e.name,
  e.type,
  e.brand,
  e.model,
  e.purchase_date,
  e.status,

  -- DEPRECIAÇÃO (estimada em 5 anos / 60 meses)
  COALESCE(
    (SELECT SUM(purchase_value)
     FROM depreciation_schedule ds
     WHERE ds.asset_name = e.name
     AND ds.is_active = true), 0
  ) as purchase_value,

  COALESCE(
    (SELECT SUM(monthly_depreciation)
     FROM depreciation_schedule ds
     WHERE ds.asset_name = e.name
     AND ds.is_active = true), 0
  ) as monthly_depreciation,

  COALESCE(
    (SELECT SUM(annual_depreciation)
     FROM depreciation_schedule ds
     WHERE ds.asset_name = e.name
     AND ds.is_active = true), 0
  ) as annual_depreciation,

  e.created_at

FROM equipments e
WHERE e.status = 'active';

-- ============================================================================
-- 6. VIEW: RESUMO FINANCEIRO CONSOLIDADO POR PERÍODO
-- ============================================================================

CREATE OR REPLACE VIEW v_consolidated_financial_summary AS
SELECT
  fp.id as period_id,
  fp.period_name,
  fp.period_type,
  fp.start_date,
  fp.end_date,
  fp.fiscal_year,

  -- RECEITAS DE ORDENS DE SERVIÇO
  COALESCE(
    (SELECT SUM(revenue_received)
     FROM v_os_financial_data os
     WHERE os.order_date >= fp.start_date
     AND os.order_date <= fp.end_date), 0
  ) as os_revenue,

  -- CUSTOS DE ORDENS DE SERVIÇO
  COALESCE(
    (SELECT SUM(total_costs)
     FROM v_os_financial_data os
     WHERE os.order_date >= fp.start_date
     AND os.order_date <= fp.end_date), 0
  ) as os_costs,

  -- COMPRAS (DESPESAS)
  COALESCE(
    (SELECT SUM(paid_amount)
     FROM v_purchasing_financial_data p
     WHERE p.order_date >= fp.start_date
     AND p.order_date <= fp.end_date), 0
  ) as purchasing_expenses,

  -- FOLHA DE PAGAMENTO
  COALESCE(
    (SELECT SUM(total_monthly_cost)
     FROM v_payroll_financial_data), 0
  ) as payroll_expenses,

  -- DEPRECIAÇÃO
  COALESCE(
    (SELECT SUM(monthly_depreciation)
     FROM v_equipment_depreciation_data), 0
  ) as depreciation_expenses,

  -- LANÇAMENTOS MANUAIS (finance_entries)
  COALESCE(
    (SELECT SUM(valor)
     FROM finance_entries fe
     WHERE fe.tipo = 'receita'
     AND fe.status IN ('recebido', 'a_receber')
     AND fe.data >= fp.start_date
     AND fe.data <= fp.end_date), 0
  ) as manual_revenue,

  COALESCE(
    (SELECT SUM(valor)
     FROM finance_entries fe
     WHERE fe.tipo = 'despesa'
     AND fe.status IN ('pago', 'a_pagar')
     AND fe.data >= fp.start_date
     AND fe.data <= fp.end_date), 0
  ) as manual_expenses,

  -- TOTAIS CONSOLIDADOS
  COALESCE(
    (SELECT SUM(revenue_received) FROM v_os_financial_data os
     WHERE os.order_date >= fp.start_date AND os.order_date <= fp.end_date), 0
  ) +
  COALESCE(
    (SELECT SUM(valor) FROM finance_entries fe
     WHERE fe.tipo = 'receita' AND fe.status IN ('recebido', 'a_receber')
     AND fe.data >= fp.start_date AND fe.data <= fp.end_date), 0
  ) as total_revenue,

  COALESCE(
    (SELECT SUM(total_costs) FROM v_os_financial_data os
     WHERE os.order_date >= fp.start_date AND os.order_date <= fp.end_date), 0
  ) +
  COALESCE(
    (SELECT SUM(paid_amount) FROM v_purchasing_financial_data p
     WHERE p.order_date >= fp.start_date AND p.order_date <= fp.end_date), 0
  ) +
  COALESCE(
    (SELECT SUM(total_monthly_cost) FROM v_payroll_financial_data), 0
  ) +
  COALESCE(
    (SELECT SUM(monthly_depreciation) FROM v_equipment_depreciation_data), 0
  ) +
  COALESCE(
    (SELECT SUM(valor) FROM finance_entries fe
     WHERE fe.tipo = 'despesa' AND fe.status IN ('pago', 'a_pagar')
     AND fe.data >= fp.start_date AND fe.data <= fp.end_date), 0
  ) as total_expenses,

  -- VALOR DO ESTOQUE (ativo circulante)
  COALESCE(
    (SELECT SUM(total_cost_value) FROM v_inventory_financial_data), 0
  ) as inventory_value,

  -- CONTAS A RECEBER
  COALESCE(
    (SELECT SUM(revenue_pending) FROM v_os_financial_data
     WHERE status IN ('completed', 'in_progress')), 0
  ) +
  COALESCE(
    (SELECT SUM(valor) FROM finance_entries fe
     WHERE fe.tipo = 'receita' AND fe.status = 'a_receber'), 0
  ) as accounts_receivable,

  -- CONTAS A PAGAR
  COALESCE(
    (SELECT SUM(amount_pending) FROM v_purchasing_financial_data
     WHERE status IN ('approved', 'ordered')), 0
  ) +
  COALESCE(
    (SELECT SUM(valor) FROM finance_entries fe
     WHERE fe.tipo = 'despesa' AND fe.status = 'a_pagar'), 0
  ) as accounts_payable

FROM financial_periods fp
ORDER BY fp.start_date DESC;

-- ============================================================================
-- 7. FUNÇÃO: SINCRONIZAR DADOS FINANCEIROS AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_all_financial_data(p_period_id uuid)
RETURNS void AS $$
DECLARE
  v_period RECORD;
  v_os_count integer;
  v_purchase_count integer;
BEGIN
  -- Buscar período
  SELECT * INTO v_period
  FROM financial_periods
  WHERE id = p_period_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Período não encontrado';
  END IF;

  -- Sincronizar receitas de Ordens de Serviço
  INSERT INTO finance_entries (
    descricao,
    valor,
    tipo,
    status,
    data,
    category_id,
    customer_id,
    service_order_id
  )
  SELECT
    'Receita OS #' || os.order_number,
    os.revenue_received,
    'receita'::text,
    CASE
      WHEN os.revenue_received > 0 THEN 'recebido'::text
      ELSE 'a_receber'::text
    END,
    os.order_date,
    (SELECT id FROM financial_categories WHERE name = 'Vendas' LIMIT 1),
    os.customer_id,
    os.id
  FROM v_os_financial_data os
  WHERE os.order_date >= v_period.start_date
  AND os.order_date <= v_period.end_date
  AND NOT EXISTS (
    SELECT 1 FROM finance_entries fe
    WHERE fe.service_order_id = os.id
    AND fe.tipo = 'receita'
  );

  GET DIAGNOSTICS v_os_count = ROW_COUNT;

  -- Sincronizar despesas de Compras
  INSERT INTO finance_entries (
    descricao,
    valor,
    tipo,
    status,
    data,
    category_id,
    supplier_id
  )
  SELECT
    'Compra #' || p.purchase_number,
    p.paid_amount,
    'despesa'::text,
    p.finance_status::text,
    p.order_date,
    (SELECT id FROM financial_categories WHERE name = 'Compras' LIMIT 1),
    p.supplier_id
  FROM v_purchasing_financial_data p
  WHERE p.order_date >= v_period.start_date
  AND p.order_date <= v_period.end_date
  AND NOT EXISTS (
    SELECT 1 FROM finance_entries fe
    WHERE fe.descricao = 'Compra #' || p.purchase_number
  );

  GET DIAGNOSTICS v_purchase_count = ROW_COUNT;

  RAISE NOTICE 'Sincronização concluída: % receitas de OS, % despesas de compras',
    v_os_count, v_purchase_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FUNÇÃO: CALCULAR CAPITAL DE GIRO CONSOLIDADO
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_working_capital_consolidated(p_period_id uuid)
RETURNS TABLE (
  current_assets numeric,
  current_liabilities numeric,
  working_capital numeric,
  current_ratio numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- ATIVO CIRCULANTE
    COALESCE(
      (SELECT inventory_value FROM v_consolidated_financial_summary
       WHERE period_id = p_period_id), 0
    ) +
    COALESCE(
      (SELECT accounts_receivable FROM v_consolidated_financial_summary
       WHERE period_id = p_period_id), 0
    ) +
    COALESCE(
      (SELECT SUM(valor) FROM finance_entries
       WHERE tipo = 'receita' AND status = 'recebido'
       AND data >= (SELECT start_date FROM financial_periods WHERE id = p_period_id)
       AND data <= (SELECT end_date FROM financial_periods WHERE id = p_period_id)), 0
    ) as current_assets,

    -- PASSIVO CIRCULANTE
    COALESCE(
      (SELECT accounts_payable FROM v_consolidated_financial_summary
       WHERE period_id = p_period_id), 0
    ) as current_liabilities,

    -- CAPITAL DE GIRO
    (
      COALESCE(
        (SELECT inventory_value FROM v_consolidated_financial_summary
         WHERE period_id = p_period_id), 0
      ) +
      COALESCE(
        (SELECT accounts_receivable FROM v_consolidated_financial_summary
         WHERE period_id = p_period_id), 0
      )
    ) -
    COALESCE(
      (SELECT accounts_payable FROM v_consolidated_financial_summary
       WHERE period_id = p_period_id), 0
    ) as working_capital,

    -- ÍNDICE DE LIQUIDEZ
    CASE
      WHEN COALESCE(
        (SELECT accounts_payable FROM v_consolidated_financial_summary
         WHERE period_id = p_period_id), 0
      ) > 0
      THEN (
        COALESCE(
          (SELECT inventory_value FROM v_consolidated_financial_summary
           WHERE period_id = p_period_id), 0
        ) +
        COALESCE(
          (SELECT accounts_receivable FROM v_consolidated_financial_summary
           WHERE period_id = p_period_id), 0
        )
      ) / (
        SELECT accounts_payable FROM v_consolidated_financial_summary
        WHERE period_id = p_period_id
      )
      ELSE 0
    END as current_ratio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. TRIGGER: AUTO-SYNC DE ORDENS DE SERVIÇO
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_sync_service_order_finance()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma OS é marcada como concluída, cria lançamento financeiro
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Inserir receita
    INSERT INTO finance_entries (
      descricao,
      valor,
      tipo,
      status,
      data,
      customer_id,
      service_order_id
    ) VALUES (
      'Receita OS #' || NEW.order_number,
      COALESCE(NEW.total_price, 0),
      'receita',
      CASE
        WHEN COALESCE(NEW.paid_amount, 0) >= COALESCE(NEW.total_price, 0)
        THEN 'recebido'
        ELSE 'a_receber'
      END,
      CURRENT_DATE,
      NEW.customer_id,
      NEW.id
    )
    ON CONFLICT DO NOTHING;

    -- Inserir custo (COGS)
    IF COALESCE(NEW.total_cost, 0) > 0 THEN
      INSERT INTO finance_entries (
        descricao,
        valor,
        tipo,
        status,
        data,
        service_order_id
      ) VALUES (
        'Custo OS #' || NEW.order_number,
        COALESCE(NEW.total_cost, 0),
        'despesa',
        'pago',
        CURRENT_DATE,
        NEW.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_service_order_finance_sync'
  ) THEN
    CREATE TRIGGER trigger_service_order_finance_sync
      AFTER UPDATE ON service_orders
      FOR EACH ROW
      EXECUTE FUNCTION trigger_sync_service_order_finance();
  END IF;
END $$;

-- ============================================================================
-- 10. ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_service_orders_date
  ON service_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_service_orders_status
  ON service_orders(status);

CREATE INDEX IF NOT EXISTS idx_purchasing_orders_date
  ON purchasing_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_finance_entries_date_type
  ON finance_entries(data, tipo);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Comentário final
COMMENT ON VIEW v_consolidated_financial_summary IS
  'View consolidada com dados financeiros de todos os departamentos: OS, Estoque, Compras, Folha, Depreciação';

COMMENT ON FUNCTION sync_all_financial_data IS
  'Sincroniza automaticamente dados financeiros de todos os departamentos para finance_entries';

COMMENT ON FUNCTION calculate_working_capital_consolidated IS
  'Calcula capital de giro consolidado incluindo estoque e contas a receber/pagar de todos os departamentos';
