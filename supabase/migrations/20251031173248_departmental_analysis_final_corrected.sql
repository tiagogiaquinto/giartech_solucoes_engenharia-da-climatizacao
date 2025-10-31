/*
  # Sistema de Análise Departamental - Versão Final

  Views consolidadas para análise de todos os departamentos
*/

-- 1. COMERCIAL
CREATE OR REPLACE VIEW v_dept_commercial AS
SELECT
  COUNT(*) FILTER (WHERE status = 'cotacao') as cotacoes,
  COUNT(*) FILTER (WHERE status IN ('pendente', 'em_andamento', 'in_progress')) as os_ativas,
  COUNT(*) FILTER (WHERE status IN ('concluido', 'completed')) as os_concluidas,
  COALESCE(SUM(total_value) FILTER (WHERE status = 'cotacao'), 0) as valor_cotacoes,
  COALESCE(SUM(total_value) FILTER (WHERE status IN ('concluido', 'completed')), 0) as valor_faturado,
  ROUND(AVG(total_value), 2) as ticket_medio
FROM service_orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 2. FINANCEIRO
CREATE OR REPLACE VIEW v_dept_financial AS
SELECT
  COUNT(*) FILTER (WHERE tipo = 'receita' AND status = 'pendente') as a_receber_qtd,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pendente'), 0) as a_receber_valor,
  COUNT(*) FILTER (WHERE tipo = 'despesa' AND status = 'pendente') as a_pagar_qtd,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pendente'), 0) as a_pagar_valor,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'pago'), 0) -
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) as saldo_realizado,
  (SELECT COALESCE(SUM(balance), 0) FROM bank_accounts WHERE active = true) as saldo_bancos
FROM finance_entries;

-- 3. OPERACIONAL
CREATE OR REPLACE VIEW v_dept_operational AS
SELECT
  COUNT(DISTINCT so.id) FILTER (WHERE so.status IN ('em_andamento', 'in_progress')) as os_execucao,
  COUNT(DISTINCT so.id) FILTER (WHERE so.status = 'pausado') as os_pausadas,
  COUNT(DISTINCT sot.employee_id) as funcionarios_alocados,
  COALESCE(SUM(so.custo_total), 0) as custo_total,
  COALESCE(SUM(so.lucro_total), 0) as lucro_total,
  ROUND((SUM(so.lucro_total) / NULLIF(SUM(so.total_value), 0)) * 100, 2) as margem_percent
FROM service_orders so
LEFT JOIN service_order_team sot ON sot.service_order_id = so.id
WHERE so.created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 4. ESTOQUE
CREATE OR REPLACE VIEW v_dept_inventory AS
SELECT
  COUNT(*) as total_itens,
  COUNT(*) FILTER (WHERE quantity <= COALESCE(min_quantity, 0)) as itens_criticos,
  COALESCE(SUM(quantity * COALESCE(unit_price, 0)), 0) as valor_total
FROM inventory_items
WHERE active = true;

-- 5. RH
CREATE OR REPLACE VIEW v_dept_hr AS
SELECT
  COUNT(*) as total_funcionarios,
  COUNT(*) FILTER (WHERE active = true) as funcionarios_ativos,
  COALESCE(SUM(salary), 0) as folha_total,
  ROUND(AVG(salary), 2) as salario_medio,
  COUNT(DISTINCT department) as departamentos_ativos
FROM employees;

-- 6. CRM
CREATE OR REPLACE VIEW v_dept_crm AS
SELECT
  COUNT(*) as total_clientes,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as clientes_novos_mes,
  (SELECT COUNT(DISTINCT customer_id) FROM service_orders WHERE created_at >= CURRENT_DATE - INTERVAL '90 days') as clientes_ativos
FROM customers;

-- 7. COMPRAS
CREATE OR REPLACE VIEW v_dept_purchasing AS
SELECT
  COUNT(*) as total_pedidos,
  COUNT(*) FILTER (WHERE status = 'pending') as pedidos_pendentes,
  COALESCE(SUM(final_amount), 0) as valor_total
FROM purchase_orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';

-- 8. ADMINISTRATIVO
CREATE OR REPLACE VIEW v_dept_administrative AS
SELECT
  (SELECT COUNT(*) FROM contracts WHERE status = 'active') as contratos_ativos,
  (SELECT COUNT(*) FROM automation_rules WHERE is_active = true) as automacoes_ativas,
  (SELECT COUNT(*) FROM documents WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as docs_mes;

-- DASHBOARD CONSOLIDADO
CREATE OR REPLACE VIEW v_dashboard_todos_departamentos AS
SELECT
  'Comercial' as departamento,
  (SELECT cotacoes FROM v_dept_commercial) as metrica1,
  (SELECT os_ativas FROM v_dept_commercial) as metrica2,
  (SELECT valor_faturado FROM v_dept_commercial) as valor
UNION ALL
SELECT 'Financeiro',
  (SELECT a_receber_valor FROM v_dept_financial),
  (SELECT a_pagar_valor FROM v_dept_financial),
  (SELECT saldo_bancos FROM v_dept_financial)
UNION ALL
SELECT 'Operacional',
  (SELECT os_execucao FROM v_dept_operational),
  (SELECT funcionarios_alocados FROM v_dept_operational),
  (SELECT lucro_total FROM v_dept_operational)
UNION ALL
SELECT 'Estoque',
  (SELECT total_itens FROM v_dept_inventory),
  (SELECT itens_criticos FROM v_dept_inventory),
  (SELECT valor_total FROM v_dept_inventory)
UNION ALL
SELECT 'RH',
  (SELECT funcionarios_ativos FROM v_dept_hr),
  (SELECT total_funcionarios FROM v_dept_hr),
  (SELECT folha_total FROM v_dept_hr)
UNION ALL
SELECT 'CRM',
  (SELECT total_clientes FROM v_dept_crm),
  (SELECT clientes_ativos FROM v_dept_crm),
  0 as valor
UNION ALL
SELECT 'Compras',
  (SELECT total_pedidos FROM v_dept_purchasing),
  (SELECT pedidos_pendentes FROM v_dept_purchasing),
  (SELECT valor_total FROM v_dept_purchasing)
UNION ALL
SELECT 'Administrativo',
  (SELECT contratos_ativos FROM v_dept_administrative),
  (SELECT automacoes_ativas FROM v_dept_administrative),
  (SELECT docs_mes FROM v_dept_administrative);

COMMENT ON VIEW v_dashboard_todos_departamentos IS 'Dashboard consolidado com métricas de todos os departamentos para análise integrada';
