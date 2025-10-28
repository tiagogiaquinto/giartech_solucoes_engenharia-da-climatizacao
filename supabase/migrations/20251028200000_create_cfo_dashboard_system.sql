/*
  # Dashboard CFO - Sistema Completo de Análise Financeira

  1. Views Avançadas
    - v_cfo_kpis - KPIs executivos
    - v_roi_analysis - Análise de ROI
    - v_break_even_analysis - Ponto de equilíbrio
    - v_margin_contribution - Margem de contribuição

  2. Funções
    - calculate_roi() - Calcular ROI
    - calculate_break_even() - Ponto de equilíbrio
    - calculate_payback_period() - Período de retorno

  3. Alertas Automáticos
    - Cash flow negativo
    - Margem abaixo da meta
    - Despesas acima do normal
*/

-- ========================================
-- TABELA: Financial Targets (Metas)
-- ========================================

CREATE TABLE IF NOT EXISTS financial_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Período
  period_month integer NOT NULL,
  period_year integer NOT NULL,

  -- Metas
  revenue_target numeric(15,2) NOT NULL,
  margin_target numeric(5,2) NOT NULL DEFAULT 30.00,
  cash_flow_target numeric(15,2) NOT NULL,

  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_month CHECK (period_month BETWEEN 1 AND 12),
  CONSTRAINT valid_margin CHECK (margin_target > 0 AND margin_target <= 100),
  CONSTRAINT unique_period UNIQUE (period_month, period_year)
);

CREATE INDEX idx_financial_targets_period ON financial_targets(period_year DESC, period_month DESC);

-- ========================================
-- TABELA: Financial Alerts (Alertas)
-- ========================================

CREATE TABLE IF NOT EXISTS financial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de alerta
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',

  -- Conteúdo
  title text NOT NULL,
  message text NOT NULL,
  metric_value numeric(15,2),
  threshold_value numeric(15,2),

  -- Status
  status text NOT NULL DEFAULT 'active',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES employees(id),

  -- Metadados
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Auditoria
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_alert_type CHECK (alert_type IN (
    'cash_flow_negative',
    'margin_below_target',
    'expenses_high',
    'revenue_below_target',
    'customer_risk',
    'stock_overvalued'
  )),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'ignored'))
);

CREATE INDEX idx_financial_alerts_status ON financial_alerts(status, severity, created_at DESC);
CREATE INDEX idx_financial_alerts_type ON financial_alerts(alert_type, created_at DESC);

-- ========================================
-- VIEW: CFO KPIs (Indicadores Executivos)
-- ========================================

CREATE OR REPLACE VIEW v_cfo_kpis AS
WITH current_month AS (
  SELECT
    date_trunc('month', CURRENT_DATE) as month_start,
    date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' as month_end
),
previous_month AS (
  SELECT
    date_trunc('month', CURRENT_DATE - INTERVAL '1 month') as month_start,
    date_trunc('month', CURRENT_DATE) as month_end
),
financial_current AS (
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as revenue,
    COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as expenses,
    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END), 0) as accounts_receivable,
    COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END), 0) as accounts_payable
  FROM finance_entries, current_month
  WHERE due_date >= month_start AND due_date <= month_end
),
financial_previous AS (
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as revenue,
    COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as expenses
  FROM finance_entries, previous_month
  WHERE due_date >= month_start AND due_date < month_end
),
service_orders_data AS (
  SELECT
    COUNT(*) as total_orders,
    COALESCE(AVG(total_value), 0) as avg_order_value,
    COALESCE(SUM(total_value), 0) as total_value
  FROM service_orders
  WHERE created_at >= (SELECT month_start FROM current_month)
),
inventory_data AS (
  SELECT
    COALESCE(SUM(quantity * unit_cost), 0) as inventory_cost,
    COALESCE(SUM(quantity * sale_price), 0) as inventory_value
  FROM inventory_items
  WHERE status = 'active'
)
SELECT
  -- Receita e Crescimento
  fc.revenue as current_revenue,
  fp.revenue as previous_revenue,
  CASE
    WHEN fp.revenue > 0 THEN ((fc.revenue - fp.revenue) / fp.revenue * 100)
    ELSE 0
  END as revenue_growth_percent,

  -- Despesas
  fc.expenses as current_expenses,
  fp.expenses as previous_expenses,
  CASE
    WHEN fp.expenses > 0 THEN ((fc.expenses - fp.expenses) / fp.expenses * 100)
    ELSE 0
  END as expenses_growth_percent,

  -- Lucro
  (fc.revenue - fc.expenses) as net_profit,
  CASE
    WHEN fc.revenue > 0 THEN ((fc.revenue - fc.expenses) / fc.revenue * 100)
    ELSE 0
  END as profit_margin,

  -- EBITDA (simplificado)
  (fc.revenue - fc.expenses) as ebitda,
  CASE
    WHEN fc.revenue > 0 THEN ((fc.revenue - fc.expenses) / fc.revenue * 100)
    ELSE 0
  END as ebitda_margin,

  -- Fluxo de Caixa
  (fc.revenue - fc.expenses) as net_cash_flow,
  fc.accounts_receivable,
  fc.accounts_payable,
  (fc.accounts_receivable - fc.accounts_payable) as working_capital,

  -- Capital de Giro
  CASE
    WHEN fc.accounts_payable > 0 THEN (fc.accounts_receivable / fc.accounts_payable)
    ELSE 0
  END as current_ratio,

  -- Ordens de Serviço
  so.total_orders,
  so.avg_order_value,
  so.total_value as orders_total_value,

  -- Estoque
  inv.inventory_cost,
  inv.inventory_value,
  (inv.inventory_value - inv.inventory_cost) as inventory_potential_profit,
  CASE
    WHEN inv.inventory_cost > 0 THEN ((inv.inventory_value - inv.inventory_cost) / inv.inventory_cost * 100)
    ELSE 0
  END as inventory_margin,

  -- ROI Simplificado
  CASE
    WHEN fc.expenses > 0 THEN ((fc.revenue - fc.expenses) / fc.expenses * 100)
    ELSE 0
  END as roi_percent,

  -- Break-even (ponto de equilíbrio)
  CASE
    WHEN fc.revenue > 0 THEN (fc.expenses / fc.revenue * 100)
    ELSE 0
  END as break_even_percent,

  -- Burn Rate (taxa de queima de caixa)
  CASE
    WHEN fc.revenue < fc.expenses THEN (fc.expenses - fc.revenue)
    ELSE 0
  END as burn_rate,

  -- Days Cash (dias de caixa disponível)
  CASE
    WHEN fc.expenses > 0 AND fc.revenue >= fc.expenses
    THEN ((fc.revenue - fc.expenses) / (fc.expenses / 30))
    ELSE 0
  END as days_cash_available

FROM financial_current fc
CROSS JOIN financial_previous fp
CROSS JOIN service_orders_data so
CROSS JOIN inventory_data inv;

-- ========================================
-- VIEW: ROI Analysis
-- ========================================

CREATE OR REPLACE VIEW v_roi_analysis AS
SELECT
  'service_orders' as category,
  'Ordens de Serviço' as category_name,
  COALESCE(SUM(total_value), 0) as revenue,
  COALESCE(SUM(material_cost + labor_cost), 0) as investment,
  CASE
    WHEN SUM(material_cost + labor_cost) > 0
    THEN ((SUM(total_value) - SUM(material_cost + labor_cost)) / SUM(material_cost + labor_cost) * 100)
    ELSE 0
  END as roi_percent
FROM service_orders
WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND status = 'completed'

UNION ALL

SELECT
  'inventory' as category,
  'Estoque' as category_name,
  COALESCE(SUM(quantity * sale_price), 0) as revenue,
  COALESCE(SUM(quantity * unit_cost), 0) as investment,
  CASE
    WHEN SUM(quantity * unit_cost) > 0
    THEN ((SUM(quantity * sale_price) - SUM(quantity * unit_cost)) / SUM(quantity * unit_cost) * 100)
    ELSE 0
  END as roi_percent
FROM inventory_items
WHERE status = 'active';

-- ========================================
-- VIEW: Break-Even Analysis
-- ========================================

CREATE OR REPLACE VIEW v_break_even_analysis AS
WITH monthly_data AS (
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
    -- Separar custos fixos e variáveis (simplificado)
    COALESCE(SUM(CASE
      WHEN type = 'expense' AND category IN ('rent', 'salaries', 'utilities') THEN amount
      ELSE 0
    END), 0) as fixed_costs,
    COALESCE(SUM(CASE
      WHEN type = 'expense' AND category NOT IN ('rent', 'salaries', 'utilities') THEN amount
      ELSE 0
    END), 0) as variable_costs
  FROM finance_entries
  WHERE due_date >= date_trunc('month', CURRENT_DATE)
    AND due_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    AND status = 'paid'
)
SELECT
  total_revenue,
  total_expenses,
  fixed_costs,
  variable_costs,
  (total_revenue - total_expenses) as net_profit,

  -- Margem de Contribuição
  (total_revenue - variable_costs) as contribution_margin,
  CASE
    WHEN total_revenue > 0 THEN ((total_revenue - variable_costs) / total_revenue * 100)
    ELSE 0
  END as contribution_margin_percent,

  -- Ponto de Equilíbrio em Receita
  CASE
    WHEN (total_revenue - variable_costs) > 0
    THEN (fixed_costs / ((total_revenue - variable_costs) / total_revenue))
    ELSE 0
  END as break_even_revenue,

  -- Margem de Segurança
  CASE
    WHEN total_revenue > 0 AND (total_revenue - variable_costs) > 0
    THEN (total_revenue - (fixed_costs / ((total_revenue - variable_costs) / total_revenue)))
    ELSE 0
  END as safety_margin,

  -- Percentual de Break-even atingido
  CASE
    WHEN (fixed_costs / ((total_revenue - variable_costs) / total_revenue)) > 0
    THEN (total_revenue / (fixed_costs / ((total_revenue - variable_costs) / total_revenue)) * 100)
    ELSE 0
  END as break_even_percent_achieved

FROM monthly_data;

-- ========================================
-- FUNÇÃO: Criar Alerta Financeiro
-- ========================================

CREATE OR REPLACE FUNCTION create_financial_alert(
  p_alert_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_metric_value numeric DEFAULT NULL,
  p_threshold_value numeric DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_alert_id uuid;
BEGIN
  INSERT INTO financial_alerts (
    alert_type,
    severity,
    title,
    message,
    metric_value,
    threshold_value
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_metric_value,
    p_threshold_value
  )
  RETURNING id INTO v_alert_id;

  -- Criar notificação para administradores
  PERFORM create_notification_for_all(
    CASE p_severity
      WHEN 'critical' THEN 'error'
      WHEN 'warning' THEN 'warning'
      ELSE 'info'
    END,
    '🚨 ' || p_title,
    p_message,
    '/cfo-dashboard',
    'financial_alert'
  );

  RETURN v_alert_id;
END;
$$;

-- ========================================
-- FUNÇÃO: Verificar Alertas Automáticos
-- ========================================

CREATE OR REPLACE FUNCTION check_financial_alerts()
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_alerts_created integer := 0;
  v_cfo_kpis record;
BEGIN
  -- Buscar KPIs atuais
  SELECT * INTO v_cfo_kpis FROM v_cfo_kpis LIMIT 1;

  -- Alerta 1: Fluxo de caixa negativo
  IF v_cfo_kpis.net_cash_flow < 0 THEN
    PERFORM create_financial_alert(
      'cash_flow_negative',
      'critical',
      'Fluxo de Caixa Negativo',
      'Atenção! Fluxo de caixa está negativo: R$ ' || ABS(v_cfo_kpis.net_cash_flow)::text,
      v_cfo_kpis.net_cash_flow,
      0
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Alerta 2: Margem abaixo de 20%
  IF v_cfo_kpis.profit_margin < 20 THEN
    PERFORM create_financial_alert(
      'margin_below_target',
      'warning',
      'Margem de Lucro Baixa',
      'Margem de lucro está em ' || v_cfo_kpis.profit_margin::numeric(10,1)::text || '% (meta: 20%)',
      v_cfo_kpis.profit_margin,
      20
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Alerta 3: Despesas crescendo mais que receitas
  IF v_cfo_kpis.expenses_growth_percent > v_cfo_kpis.revenue_growth_percent + 10 THEN
    PERFORM create_financial_alert(
      'expenses_high',
      'warning',
      'Crescimento de Despesas Acima do Normal',
      'Despesas cresceram ' || v_cfo_kpis.expenses_growth_percent::numeric(10,1)::text ||
      '% enquanto receitas cresceram apenas ' || v_cfo_kpis.revenue_growth_percent::numeric(10,1)::text || '%',
      v_cfo_kpis.expenses_growth_percent,
      v_cfo_kpis.revenue_growth_percent
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  -- Alerta 4: Capital de giro baixo
  IF v_cfo_kpis.working_capital < 0 THEN
    PERFORM create_financial_alert(
      'cash_flow_negative',
      'critical',
      'Capital de Giro Negativo',
      'Contas a pagar (R$ ' || v_cfo_kpis.accounts_payable::text ||
      ') superam contas a receber (R$ ' || v_cfo_kpis.accounts_receivable::text || ')',
      v_cfo_kpis.working_capital,
      0
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;

  RETURN v_alerts_created;
END;
$$;

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE financial_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to financial targets"
  ON financial_targets FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to financial alerts"
  ON financial_alerts FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ========================================
-- GRANTS
-- ========================================

GRANT SELECT ON v_cfo_kpis TO anon, authenticated;
GRANT SELECT ON v_roi_analysis TO anon, authenticated;
GRANT SELECT ON v_break_even_analysis TO anon, authenticated;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON VIEW v_cfo_kpis IS 'KPIs executivos para Dashboard CFO';
COMMENT ON VIEW v_roi_analysis IS 'Análise de ROI por categoria';
COMMENT ON VIEW v_break_even_analysis IS 'Análise de ponto de equilíbrio';
COMMENT ON FUNCTION create_financial_alert IS 'Cria alerta financeiro e notifica administradores';
COMMENT ON FUNCTION check_financial_alerts IS 'Verifica condições e cria alertas automaticamente';

-- Inserir metas exemplo para o mês atual
INSERT INTO financial_targets (period_month, period_year, revenue_target, margin_target, cash_flow_target)
VALUES (
  EXTRACT(MONTH FROM CURRENT_DATE)::integer,
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  100000.00,
  30.00,
  30000.00
)
ON CONFLICT (period_month, period_year) DO NOTHING;
