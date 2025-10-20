-- ============================================================
-- DASHBOARD EXECUTIVO COMPLETO - GIARTECH
-- Views para tomada de decisão estratégica
-- Métricas de todas as áreas da empresa
-- ============================================================

-- ============================================================
-- PARTE 1: VIEW PRINCIPAL - MÉTRICAS GERAIS
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_metrics AS
SELECT
  -- ORDENS DE SERVIÇO
  (SELECT COUNT(*) FROM service_orders) as total_service_orders,
  (SELECT COUNT(*) FROM service_orders WHERE status = 'pending') as orders_pending,
  (SELECT COUNT(*) FROM service_orders WHERE status = 'in_progress') as orders_in_progress,
  (SELECT COUNT(*) FROM service_orders WHERE status = 'completed') as orders_completed,
  (SELECT COUNT(*) FROM service_orders WHERE status = 'cancelled') as orders_cancelled,

  -- CLIENTES
  (SELECT COUNT(*) FROM clients WHERE is_active = true) as total_clients,
  (SELECT COUNT(*) FROM clients WHERE is_active = true AND client_type = 'PF') as clients_pf,
  (SELECT COUNT(*) FROM clients WHERE is_active = true AND client_type = 'PJ') as clients_pj,
  (SELECT COUNT(*) FROM clients WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_clients_30d,

  -- ESTOQUE
  (SELECT COUNT(*) FROM inventory WHERE is_active = true) as total_inventory_items,
  (SELECT COALESCE(SUM(quantity), 0) FROM inventory WHERE is_active = true) as total_inventory_quantity,
  (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM inventory WHERE is_active = true) as total_inventory_value,
  (SELECT COUNT(*) FROM inventory WHERE quantity < min_quantity AND is_active = true) as items_low_stock,

  -- FUNCIONÁRIOS
  (SELECT COUNT(*) FROM users WHERE role != 'client') as total_employees,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,

  -- FORNECEDORES
  (SELECT COUNT(*) FROM suppliers WHERE is_active = true) as total_suppliers,

  -- PROJETOS
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'active') as projects_active,
  (SELECT COUNT(*) FROM projects WHERE status = 'completed') as projects_completed,

  -- EVENTOS/AGENDA
  (SELECT COUNT(*) FROM calendar_events WHERE start_date >= CURRENT_DATE) as upcoming_events,
  (SELECT COUNT(*) FROM calendar_events WHERE start_date = CURRENT_DATE) as events_today,

  -- SERVIÇOS NO CATÁLOGO
  (SELECT COUNT(*) FROM service_catalog WHERE is_active = true) as total_services;

-- ============================================================
-- PARTE 2: VIEW FINANCEIRA - RECEITAS E DESPESAS
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_financial AS
SELECT
  -- RECEITAS
  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'paid'
  ) as total_income_paid,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'pending'
  ) as total_income_pending,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as income_current_month,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
   AND date < DATE_TRUNC('month', CURRENT_DATE)
  ) as income_last_month,

  -- DESPESAS
  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'paid'
  ) as total_expense_paid,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'pending'
  ) as total_expense_pending,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as expense_current_month,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'paid'
   AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
   AND date < DATE_TRUNC('month', CURRENT_DATE)
  ) as expense_last_month,

  -- CONTAS A RECEBER
  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'pending'
  ) as accounts_receivable_count,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'income' AND status = 'pending'
  ) as accounts_receivable_value,

  -- CONTAS A PAGAR
  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'pending'
  ) as accounts_payable_count,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE type = 'expense' AND status = 'pending'
  ) as accounts_payable_value,

  -- CONTAS VENCIDAS
  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE status = 'pending'
   AND date < CURRENT_DATE
  ) as overdue_count,

  (SELECT COALESCE(SUM(amount), 0)
   FROM financial_transactions
   WHERE status = 'pending'
   AND date < CURRENT_DATE
  ) as overdue_value,

  -- SALDO EM CONTAS
  (SELECT COALESCE(SUM(current_balance), 0)
   FROM bank_accounts
   WHERE is_active = true
  ) as total_bank_balance,

  -- NÚMERO DE TRANSAÇÕES
  (SELECT COUNT(*)
   FROM financial_transactions
  ) as total_transactions,

  (SELECT COUNT(*)
   FROM financial_transactions
   WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
  ) as transactions_current_month;

-- ============================================================
-- PARTE 3: VIEW FATURAMENTO MENSAL (Últimos 12 Meses)
-- ============================================================

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  TO_CHAR(date, 'YYYY-MM') as month,
  TO_CHAR(date, 'Mon/YYYY') as month_label,
  EXTRACT(YEAR FROM date) as year,
  EXTRACT(MONTH FROM date) as month_number,

  COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as income,
  COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as expense,
  COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as profit,

  COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
  COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count

FROM financial_transactions
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
  AND status = 'paid'
GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon/YYYY'), EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY year DESC, month_number DESC;

-- ============================================================
-- PARTE 4: VIEW ÚLTIMAS TRANSAÇÕES
-- ============================================================

CREATE OR REPLACE VIEW v_recent_transactions AS
SELECT
  ft.id,
  ft.description,
  ft.amount,
  ft.type,
  ft.status,
  ft.date,
  ft.payment_method,
  ft.created_at,

  fc.name as category_name,
  fc.color as category_color,

  c.name as client_name,
  c.company_name as client_company,

  s.full_name as supplier_name,
  s.company_name as supplier_company,

  ba.account_name as bank_account_name,

  so.order_number as service_order_number

FROM financial_transactions ft
LEFT JOIN financial_categories fc ON ft.category_id = fc.id
LEFT JOIN clients c ON ft.client_id = c.id
LEFT JOIN suppliers s ON ft.supplier_id = s.id
LEFT JOIN bank_accounts ba ON ft.account_id = ba.id
LEFT JOIN service_orders so ON ft.service_order_id = so.id

ORDER BY ft.created_at DESC
LIMIT 20;

-- ============================================================
-- PARTE 5: VIEW ORDENS DE SERVIÇO ATIVAS
-- ============================================================

CREATE OR REPLACE VIEW v_active_service_orders AS
SELECT
  so.id,
  so.order_number,
  so.title,
  so.status,
  so.priority,
  so.start_date,
  so.deadline,
  so.estimated_cost,
  so.final_cost,
  so.created_at,

  c.name as client_name,
  c.company_name as client_company,
  c.client_type,

  u.full_name as responsible_name,

  CASE
    WHEN so.deadline < CURRENT_DATE AND so.status NOT IN ('completed', 'cancelled') THEN true
    ELSE false
  END as is_overdue,

  CASE
    WHEN so.deadline <= CURRENT_DATE + INTERVAL '3 days' AND so.status NOT IN ('completed', 'cancelled') THEN true
    ELSE false
  END as is_urgent

FROM service_orders so
LEFT JOIN clients c ON so.client_id = c.id
LEFT JOIN users u ON so.assigned_to = u.id

WHERE so.status IN ('pending', 'in_progress')
ORDER BY
  CASE so.priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  so.deadline ASC;

-- ============================================================
-- PARTE 6: VIEW TOP CLIENTES (Por Faturamento)
-- ============================================================

CREATE OR REPLACE VIEW v_top_clients AS
SELECT
  c.id,
  c.name,
  c.company_name,
  c.client_type,
  c.email,
  c.phone,

  COUNT(DISTINCT so.id) as total_orders,
  COUNT(DISTINCT CASE WHEN so.status = 'completed' THEN so.id END) as completed_orders,

  COALESCE(SUM(CASE WHEN ft.type = 'income' AND ft.status = 'paid' THEN ft.amount END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN ft.type = 'income' AND ft.status = 'pending' THEN ft.amount END), 0) as pending_revenue,

  MAX(so.created_at) as last_order_date

FROM clients c
LEFT JOIN service_orders so ON so.client_id = c.id
LEFT JOIN financial_transactions ft ON ft.client_id = c.id

WHERE c.is_active = true
GROUP BY c.id, c.name, c.company_name, c.client_type, c.email, c.phone
HAVING COUNT(DISTINCT so.id) > 0
ORDER BY total_revenue DESC
LIMIT 10;

-- ============================================================
-- PARTE 7: VIEW ALERTAS E NOTIFICAÇÕES
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard_alerts AS
SELECT
  'low_stock' as alert_type,
  'warning' as severity,
  COUNT(*) as count,
  'Itens com estoque baixo' as message
FROM inventory
WHERE quantity < min_quantity AND is_active = true
HAVING COUNT(*) > 0

UNION ALL

SELECT
  'overdue_orders' as alert_type,
  'danger' as severity,
  COUNT(*) as count,
  'Ordens de serviço atrasadas' as message
FROM service_orders
WHERE deadline < CURRENT_DATE AND status IN ('pending', 'in_progress')
HAVING COUNT(*) > 0

UNION ALL

SELECT
  'overdue_payments' as alert_type,
  'danger' as severity,
  COUNT(*) as count,
  'Pagamentos vencidos' as message
FROM financial_transactions
WHERE status = 'pending' AND date < CURRENT_DATE
HAVING COUNT(*) > 0

UNION ALL

SELECT
  'pending_receivables' as alert_type,
  'info' as severity,
  COUNT(*) as count,
  'Contas a receber' as message
FROM financial_transactions
WHERE type = 'income' AND status = 'pending'
HAVING COUNT(*) > 0

UNION ALL

SELECT
  'pending_payables' as alert_type,
  'warning' as severity,
  COUNT(*) as count,
  'Contas a pagar' as message
FROM financial_transactions
WHERE type = 'expense' AND status = 'pending'
HAVING COUNT(*) > 0;

-- ============================================================
-- PARTE 8: VIEW PERFORMANCE POR CATEGORIA
-- ============================================================

CREATE OR REPLACE VIEW v_category_performance AS
SELECT
  fc.id,
  fc.name,
  fc.type,
  fc.color,

  COUNT(ft.id) as transaction_count,
  COALESCE(SUM(ft.amount), 0) as total_amount,
  COALESCE(AVG(ft.amount), 0) as average_amount,

  COUNT(CASE WHEN ft.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN ft.status = 'pending' THEN 1 END) as pending_count,

  COALESCE(SUM(CASE WHEN ft.status = 'paid' THEN ft.amount END), 0) as paid_amount,
  COALESCE(SUM(CASE WHEN ft.status = 'pending' THEN ft.amount END), 0) as pending_amount

FROM financial_categories fc
LEFT JOIN financial_transactions ft ON ft.category_id = fc.id

GROUP BY fc.id, fc.name, fc.type, fc.color
HAVING COUNT(ft.id) > 0
ORDER BY total_amount DESC;

-- ============================================================
-- PARTE 9: FUNÇÃO - CALCULAR LUCRO DO MÊS
-- ============================================================

CREATE OR REPLACE FUNCTION get_month_profit(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  month_name TEXT,
  income NUMERIC,
  expense NUMERIC,
  profit NUMERIC,
  profit_margin NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(target_date, 'Mon/YYYY') as month_name,
    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 0) as income,
    COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount END), 0) as expense,
    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 0) -
    COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount END), 0) as profit,
    CASE
      WHEN COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 0) > 0
      THEN (
        (COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 0) -
         COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount END), 0)) /
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 1)
      ) * 100
      ELSE 0
    END as profit_margin
  FROM financial_transactions
  WHERE date >= DATE_TRUNC('month', target_date)
    AND date < DATE_TRUNC('month', target_date) + INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTE 10: FUNÇÃO - RESUMO EXECUTIVO
-- ============================================================

CREATE OR REPLACE FUNCTION get_executive_summary()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_label TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Faturamento Total
  SELECT
    'total_revenue'::TEXT,
    COALESCE(SUM(amount), 0),
    'Faturamento Total'::TEXT
  FROM financial_transactions
  WHERE type = 'income' AND status = 'paid'

  UNION ALL

  -- Lucro Total
  SELECT
    'total_profit'::TEXT,
    COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount
                      WHEN type = 'expense' AND status = 'paid' THEN -amount
                 END), 0),
    'Lucro Total'::TEXT
  FROM financial_transactions

  UNION ALL

  -- Margem de Lucro
  SELECT
    'profit_margin'::TEXT,
    CASE
      WHEN COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 0) > 0
      THEN (
        (COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 0) -
         COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount END), 0)) /
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount END), 1)
      ) * 100
      ELSE 0
    END,
    'Margem de Lucro %'::TEXT
  FROM financial_transactions

  UNION ALL

  -- Ticket Médio
  SELECT
    'average_ticket'::TEXT,
    COALESCE(AVG(amount), 0),
    'Ticket Médio'::TEXT
  FROM financial_transactions
  WHERE type = 'income' AND status = 'paid';

END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTE 11: VERIFICAÇÕES E TESTES
-- ============================================================

-- Verificar métricas gerais
SELECT * FROM v_dashboard_metrics;

-- Verificar métricas financeiras
SELECT * FROM v_dashboard_financial;

-- Verificar faturamento mensal
SELECT * FROM v_monthly_revenue LIMIT 6;

-- Verificar últimas transações
SELECT * FROM v_recent_transactions LIMIT 5;

-- Verificar ordens ativas
SELECT * FROM v_active_service_orders LIMIT 5;

-- Verificar top clientes
SELECT * FROM v_top_clients LIMIT 5;

-- Verificar alertas
SELECT * FROM v_dashboard_alerts;

-- Verificar performance por categoria
SELECT * FROM v_category_performance LIMIT 5;

-- Testar função de lucro do mês
SELECT * FROM get_month_profit(CURRENT_DATE);

-- Testar resumo executivo
SELECT * FROM get_executive_summary();

-- ============================================================
-- FIM - DASHBOARD EXECUTIVO COMPLETO!
-- ============================================================

SELECT
  'DASHBOARD EXECUTIVO INSTALADO COM SUCESSO!' as status,
  '9 Views + 2 Funções criadas' as info,
  'Todas as métricas disponíveis para tomada de decisão' as description;
