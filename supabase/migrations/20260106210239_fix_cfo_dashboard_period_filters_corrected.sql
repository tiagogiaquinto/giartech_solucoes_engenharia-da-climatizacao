/*
  # Correção dos Filtros de Período do Dashboard CFO - Versão Corrigida

  ## Ajustes
  1. Usar campo `data` para finance_entries
  2. Usar campo `service_date` para service_orders
  3. Criar funções RPC para filtrar por período específico
  4. Garantir separação precisa entre períodos

  ## Views Recriadas
  - v_cfo_kpis (com filtros corretos)
  - v_financial_summary (com data correta)
  - v_financial_categories_summary (com data correta)
  
  ## Funções Criadas
  - get_cfo_kpis_by_period(start_date, end_date)
  - get_financial_summary_by_period(period_id)
*/

-- 1. Dropar views existentes
DROP VIEW IF EXISTS v_cfo_kpis CASCADE;
DROP VIEW IF EXISTS v_financial_categories_summary CASCADE;
DROP VIEW IF EXISTS v_financial_summary CASCADE;

-- 2. Recriar v_financial_summary com campo data correto
CREATE VIEW v_financial_summary AS
SELECT
  -- Receitas
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS receitas_recebidas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber'), 0) AS receitas_a_receber,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) AS receitas_total,
  
  -- Despesas
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS despesas_pagas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar'), 0) AS despesas_a_pagar,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa'), 0) AS despesas_total,
  
  -- Resultado
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) -
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS saldo_realizado,
  
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) -
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa'), 0) AS saldo_previsto,
  
  -- Contadores
  COUNT(*) FILTER (WHERE tipo = 'receita') AS qtd_receitas,
  COUNT(*) FILTER (WHERE tipo = 'despesa') AS qtd_despesas,
  COUNT(*) AS total_lancamentos
  
FROM finance_entries
WHERE status <> 'cancelado'
  AND EXTRACT(year FROM data) = EXTRACT(year FROM CURRENT_DATE);

COMMENT ON VIEW v_financial_summary IS 'Resumo financeiro do ano atual usando campo data dos lançamentos';

-- 3. Recriar v_financial_categories_summary com data correta
CREATE VIEW v_financial_categories_summary AS
WITH totals_by_type AS (
  SELECT 
    tipo,
    SUM(valor) AS total_tipo
  FROM finance_entries
  WHERE EXTRACT(year FROM data) = EXTRACT(year FROM CURRENT_DATE)
    AND status <> 'cancelado'
  GROUP BY tipo
)
SELECT
  COALESCE(fc.name, 'Sem Categoria') AS categoria,
  fe.tipo,
  COUNT(*) AS total_lancamentos,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.status IN ('recebido', 'pago')), 0) AS valor_realizado,
  COALESCE(SUM(fe.valor), 0) AS valor_total,
  CASE 
    WHEN tbt.total_tipo > 0 
    THEN ROUND((COALESCE(SUM(fe.valor), 0) / tbt.total_tipo) * 100, 2)
    ELSE 0
  END AS percentual_do_tipo
FROM finance_entries fe
LEFT JOIN financial_categories fc ON fc.id = fe.category_id
CROSS JOIN totals_by_type tbt
WHERE fe.tipo = tbt.tipo
  AND EXTRACT(year FROM fe.data) = EXTRACT(year FROM CURRENT_DATE)
  AND fe.status <> 'cancelado'
GROUP BY fc.name, fe.tipo, tbt.total_tipo
ORDER BY valor_total DESC;

COMMENT ON VIEW v_financial_categories_summary IS 'Resumo por categoria usando campo data dos lançamentos';

-- 4. Recriar v_cfo_kpis com campos corretos
CREATE VIEW v_cfo_kpis AS
WITH financial_summary AS (
  SELECT
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS total_revenue,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS total_expenses,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber'), 0) AS accounts_receivable,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar'), 0) AS accounts_payable
  FROM finance_entries
  WHERE EXTRACT(year FROM data) = EXTRACT(year FROM CURRENT_DATE)
    AND status <> 'cancelado'
),
orders_summary AS (
  SELECT
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')) AS total_completed_orders,
    COUNT(*) FILTER (WHERE status IN ('aberta', 'em_andamento', 'in_progress')) AS orders_in_progress,
    COALESCE(SUM(total_value) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS total_revenue_from_orders,
    COALESCE(AVG(total_value) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS avg_order_value,
    COALESCE(AVG(lucro_total) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS avg_profit_per_order
  FROM service_orders
  WHERE EXTRACT(year FROM COALESCE(service_date, created_at)) = EXTRACT(year FROM CURRENT_DATE)
),
inventory_summary AS (
  SELECT
    COALESCE(SUM(quantity * unit_cost), 0) AS total_inventory_cost,
    COALESCE(SUM(quantity * unit_price), 0) AS total_inventory_value,
    COALESCE(SUM(quantity * (unit_price - unit_cost)), 0) AS potential_profit,
    CASE 
      WHEN SUM(quantity * unit_cost) > 0 
      THEN COALESCE(SUM(quantity * unit_price), 0) / SUM(quantity * unit_cost)
      ELSE 0
    END AS inventory_turnover
  FROM inventory_items
  WHERE active = true
),
customer_summary AS (
  SELECT
    COUNT(*) AS total_customers,
    COUNT(*) FILTER (WHERE cnpj IS NOT NULL AND cnpj <> '') AS total_customers_pj,
    COUNT(*) FILTER (WHERE (cnpj IS NULL OR cnpj = '') AND cpf IS NOT NULL) AS total_customers_pf,
    COUNT(*) FILTER (WHERE EXTRACT(year FROM created_at) = EXTRACT(year FROM CURRENT_DATE)) AS active_customers
  FROM customers
)
SELECT
  -- Revenue & Expenses
  fs.total_revenue,
  fs.total_expenses,
  fs.total_revenue - fs.total_expenses AS net_profit,
  
  -- Margins
  CASE 
    WHEN fs.total_revenue > 0 
    THEN ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_revenue) * 100, 2)
    ELSE 0
  END AS profit_margin,
  
  (fs.total_revenue - fs.total_expenses) * 1.05 AS ebitda,
  
  CASE 
    WHEN fs.total_revenue > 0 
    THEN ROUND((((fs.total_revenue - fs.total_expenses) * 1.05) / fs.total_revenue) * 100, 2)
    ELSE 0
  END AS ebitda_margin,
  
  CASE 
    WHEN fs.total_revenue > 0 
    THEN ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_revenue) * 100, 2)
    ELSE 0
  END AS gross_margin,
  
  CASE 
    WHEN fs.total_revenue > 0 
    THEN ROUND(((fs.total_revenue - (fs.total_expenses * 0.8)) / fs.total_revenue) * 100, 2)
    ELSE 0
  END AS operating_margin,
  
  -- Working Capital
  fs.accounts_receivable,
  fs.accounts_payable,
  fs.accounts_receivable - fs.accounts_payable AS net_working_capital,
  
  -- Customer Metrics
  cs.total_customers,
  cs.total_customers_pj,
  cs.total_customers_pf,
  cs.active_customers,
  
  CASE 
    WHEN cs.total_customers > 0 
    THEN ROUND((cs.active_customers::numeric / cs.total_customers::numeric) * 100, 2)
    ELSE 0
  END AS customer_retention_rate,
  
  CASE 
    WHEN cs.total_customers > 0 
    THEN ROUND(fs.total_revenue / cs.total_customers::numeric, 2)
    ELSE 0
  END AS avg_customer_ltv,
  
  -- Order Metrics
  os.total_completed_orders,
  os.orders_in_progress,
  os.avg_order_value,
  os.total_revenue_from_orders,
  os.avg_profit_per_order,
  
  -- Inventory Metrics
  inv.total_inventory_cost,
  inv.total_inventory_value,
  inv.potential_profit,
  ROUND(inv.inventory_turnover, 2) AS inventory_turnover,
  
  -- Performance Indicators
  CASE 
    WHEN fs.total_expenses > 0 
    THEN ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_expenses) * 100, 2)
    ELSE 0
  END AS roi_percentage,
  
  CASE 
    WHEN (fs.total_revenue - fs.total_expenses) > 0 
    THEN ROUND(fs.total_expenses / ((fs.total_revenue - fs.total_expenses) / 365), 0)
    ELSE 999
  END AS payback_period_days,
  
  ROUND(fs.total_expenses / 1.2, 2) AS break_even_point,
  
  CASE 
    WHEN fs.total_revenue > 0 
    THEN ROUND(((fs.total_revenue - fs.total_expenses) / fs.total_revenue) * 100, 2)
    ELSE 0
  END AS operational_efficiency,
  
  CURRENT_TIMESTAMP AS calculated_at
  
FROM financial_summary fs
CROSS JOIN orders_summary os
CROSS JOIN inventory_summary inv
CROSS JOIN customer_summary cs;

COMMENT ON VIEW v_cfo_kpis IS 'KPIs do CFO usando campo data dos lançamentos financeiros e service_date das OS';

-- 5. Função para buscar KPIs por período específico
CREATE OR REPLACE FUNCTION get_cfo_kpis_by_period(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_expenses NUMERIC,
  net_profit NUMERIC,
  profit_margin NUMERIC,
  ebitda NUMERIC,
  ebitda_margin NUMERIC,
  accounts_receivable NUMERIC,
  accounts_payable NUMERIC,
  net_working_capital NUMERIC,
  total_orders BIGINT,
  completed_orders BIGINT,
  avg_order_value NUMERIC,
  total_customers BIGINT,
  active_customers BIGINT,
  roi_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH financial_data AS (
    SELECT
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS revenue,
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS expenses,
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber'), 0) AS receivable,
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar'), 0) AS payable
    FROM finance_entries
    WHERE data BETWEEN p_start_date AND p_end_date
      AND status <> 'cancelado'
  ),
  orders_data AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')) AS completed,
      COALESCE(AVG(total_value) FILTER (WHERE status IN ('concluida', 'completed', 'finalizada')), 0) AS avg_value
    FROM service_orders
    WHERE COALESCE(service_date, created_at::date) BETWEEN p_start_date AND p_end_date
  ),
  customer_data AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE created_at::date BETWEEN p_start_date AND p_end_date) AS active
    FROM customers
  )
  SELECT
    fd.revenue,
    fd.expenses,
    fd.revenue - fd.expenses,
    CASE WHEN fd.revenue > 0 THEN ROUND(((fd.revenue - fd.expenses) / fd.revenue) * 100, 2) ELSE 0 END,
    (fd.revenue - fd.expenses) * 1.05,
    CASE WHEN fd.revenue > 0 THEN ROUND((((fd.revenue - fd.expenses) * 1.05) / fd.revenue) * 100, 2) ELSE 0 END,
    fd.receivable,
    fd.payable,
    fd.receivable - fd.payable,
    od.total,
    od.completed,
    od.avg_value,
    cd.total,
    cd.active,
    CASE WHEN fd.expenses > 0 THEN ROUND(((fd.revenue - fd.expenses) / fd.expenses) * 100, 2) ELSE 0 END
  FROM financial_data fd
  CROSS JOIN orders_data od
  CROSS JOIN customer_data cd;
END;
$$;

COMMENT ON FUNCTION get_cfo_kpis_by_period IS 'Retorna KPIs do CFO para um período específico usando campo data';

-- 6. Função para buscar resumo financeiro por period_id
CREATE OR REPLACE FUNCTION get_financial_summary_by_period(p_period_id UUID)
RETURNS TABLE (
  period_name TEXT,
  start_date DATE,
  end_date DATE,
  total_revenue NUMERIC,
  total_expenses NUMERIC,
  net_profit NUMERIC,
  profit_margin NUMERIC,
  total_lancamentos BIGINT,
  receitas_qty BIGINT,
  despesas_qty BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_period_name TEXT;
BEGIN
  -- Buscar período
  SELECT fp.start_date, fp.end_date, fp.period_name
  INTO v_start_date, v_end_date, v_period_name
  FROM financial_periods fp
  WHERE fp.id = p_period_id;
  
  IF v_start_date IS NULL THEN
    RAISE EXCEPTION 'Período não encontrado';
  END IF;
  
  -- Retornar dados
  RETURN QUERY
  SELECT
    v_period_name,
    v_start_date,
    v_end_date,
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0),
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0),
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) -
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0),
    CASE 
      WHEN SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido') > 0
      THEN ROUND((
        (COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) -
         COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0)) /
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 1)
      ) * 100, 2)
      ELSE 0
    END,
    COUNT(*),
    COUNT(*) FILTER (WHERE tipo = 'receita'),
    COUNT(*) FILTER (WHERE tipo = 'despesa')
  FROM finance_entries
  WHERE data BETWEEN v_start_date AND v_end_date
    AND status <> 'cancelado';
END;
$$;

COMMENT ON FUNCTION get_financial_summary_by_period IS 'Retorna resumo financeiro para um período específico via period_id';

-- 7. Função para comparar dois períodos
CREATE OR REPLACE FUNCTION compare_periods(
  p_period_id_1 UUID,
  p_period_id_2 UUID
)
RETURNS TABLE (
  metric TEXT,
  period_1_name TEXT,
  period_1_value NUMERIC,
  period_2_name TEXT,
  period_2_value NUMERIC,
  variance NUMERIC,
  variance_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p1_start DATE;
  v_p1_end DATE;
  v_p1_name TEXT;
  v_p2_start DATE;
  v_p2_end DATE;
  v_p2_name TEXT;
BEGIN
  -- Buscar períodos
  SELECT start_date, end_date, period_name INTO v_p1_start, v_p1_end, v_p1_name
  FROM financial_periods WHERE id = p_period_id_1;
  
  SELECT start_date, end_date, period_name INTO v_p2_start, v_p2_end, v_p2_name
  FROM financial_periods WHERE id = p_period_id_2;
  
  IF v_p1_start IS NULL OR v_p2_start IS NULL THEN
    RAISE EXCEPTION 'Um ou ambos os períodos não foram encontrados';
  END IF;
  
  -- Retornar comparação
  RETURN QUERY
  WITH p1_data AS (
    SELECT
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS revenue,
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS expenses
    FROM finance_entries
    WHERE data BETWEEN v_p1_start AND v_p1_end
      AND status <> 'cancelado'
  ),
  p2_data AS (
    SELECT
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS revenue,
      COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS expenses
    FROM finance_entries
    WHERE data BETWEEN v_p2_start AND v_p2_end
      AND status <> 'cancelado'
  )
  SELECT 'Receitas'::TEXT, v_p1_name, p1.revenue, v_p2_name, p2.revenue,
         p2.revenue - p1.revenue,
         CASE WHEN p1.revenue > 0 THEN ROUND(((p2.revenue - p1.revenue) / p1.revenue) * 100, 2) ELSE 0 END
  FROM p1_data p1, p2_data p2
  UNION ALL
  SELECT 'Despesas'::TEXT, v_p1_name, p1.expenses, v_p2_name, p2.expenses,
         p2.expenses - p1.expenses,
         CASE WHEN p1.expenses > 0 THEN ROUND(((p2.expenses - p1.expenses) / p1.expenses) * 100, 2) ELSE 0 END
  FROM p1_data p1, p2_data p2
  UNION ALL
  SELECT 'Lucro'::TEXT, v_p1_name, p1.revenue - p1.expenses, v_p2_name, p2.revenue - p2.expenses,
         (p2.revenue - p2.expenses) - (p1.revenue - p1.expenses),
         CASE WHEN (p1.revenue - p1.expenses) > 0 
              THEN ROUND((((p2.revenue - p2.expenses) - (p1.revenue - p1.expenses)) / (p1.revenue - p1.expenses)) * 100, 2)
              ELSE 0 END
  FROM p1_data p1, p2_data p2;
END;
$$;

COMMENT ON FUNCTION compare_periods IS 'Compara métricas financeiras entre dois períodos';

-- 8. Grants
GRANT SELECT ON v_financial_summary TO authenticated, anon;
GRANT SELECT ON v_financial_categories_summary TO authenticated, anon;
GRANT SELECT ON v_cfo_kpis TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_cfo_kpis_by_period TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_financial_summary_by_period TO authenticated, anon;
GRANT EXECUTE ON FUNCTION compare_periods TO authenticated, anon;
