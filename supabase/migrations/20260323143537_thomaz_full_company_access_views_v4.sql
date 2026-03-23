/*
  # Thomaz AI - Acesso Completo aos Dados da Empresa (v4 - fix extract)

  Corrige o uso de EXTRACT com subtração de datas (usa INTERVAL e DATE_PART).
*/

-- ─── VIEW: Snapshot Consolidado ───────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_company_snapshot CASCADE;
CREATE OR REPLACE VIEW v_thomaz_company_snapshot AS
SELECT
  (SELECT COALESCE(SUM(valor), 0) FROM finance_entries
    WHERE tipo IN ('receita','entrada')
    AND status IN ('pago','paid','confirmado')
    AND DATE_PART('month', COALESCE(data_vencimento, data)::date) = DATE_PART('month', NOW())
    AND DATE_PART('year', COALESCE(data_vencimento, data)::date) = DATE_PART('year', NOW())
  ) AS receita_mes_atual,

  (SELECT COALESCE(SUM(valor), 0) FROM finance_entries
    WHERE tipo IN ('despesa','saida','saída','expense')
    AND status IN ('pago','paid','confirmado')
    AND DATE_PART('month', COALESCE(data_vencimento, data)::date) = DATE_PART('month', NOW())
    AND DATE_PART('year', COALESCE(data_vencimento, data)::date) = DATE_PART('year', NOW())
  ) AS despesa_mes_atual,

  (SELECT COALESCE(SUM(valor), 0) FROM finance_entries
    WHERE tipo IN ('receita','entrada')
    AND status NOT IN ('pago','paid','confirmado','cancelado')
    AND COALESCE(data_vencimento, data)::date >= CURRENT_DATE
  ) AS receitas_a_receber,

  (SELECT COALESCE(SUM(valor), 0) FROM finance_entries
    WHERE tipo IN ('despesa','saida','saída','expense')
    AND status NOT IN ('pago','paid','confirmado','cancelado')
    AND COALESCE(data_vencimento, data)::date >= CURRENT_DATE
  ) AS despesas_a_pagar,

  (SELECT COALESCE(SUM(valor), 0) FROM finance_entries
    WHERE tipo IN ('receita','entrada')
    AND status NOT IN ('pago','paid','confirmado','cancelado')
    AND COALESCE(data_vencimento, data)::date < CURRENT_DATE
  ) AS receitas_vencidas,

  (SELECT COALESCE(SUM(valor), 0) FROM finance_entries
    WHERE tipo IN ('despesa','saida','saída','expense')
    AND status NOT IN ('pago','paid','confirmado','cancelado')
    AND COALESCE(data_vencimento, data)::date < CURRENT_DATE
  ) AS despesas_vencidas,

  (SELECT COUNT(*) FROM service_orders
    WHERE status IN ('aberto','pendente','aguardando','open','pending')
  ) AS os_abertas,

  (SELECT COUNT(*) FROM service_orders
    WHERE status IN ('em_andamento','em andamento','in_progress','execucao')
  ) AS os_em_andamento,

  (SELECT COUNT(*) FROM service_orders
    WHERE status IN ('concluido','concluída','finalizado','fechado','completed','done')
    AND COALESCE(completion_date, updated_at)::date >= DATE_TRUNC('month', NOW())
  ) AS os_concluidas_mes,

  (SELECT COALESCE(SUM(COALESCE(total_value, total_cost, 0)), 0) FROM service_orders
    WHERE status IN ('concluido','concluída','finalizado','fechado','completed','done')
    AND COALESCE(completion_date, updated_at)::date >= DATE_TRUNC('month', NOW())
  ) AS faturamento_os_mes,

  (SELECT COUNT(*) FROM agenda_events
    WHERE start_date::date = CURRENT_DATE AND status NOT IN ('cancelado','cancelled')
  ) AS eventos_hoje,

  (SELECT COUNT(*) FROM agenda_events
    WHERE start_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND status NOT IN ('cancelado','cancelled')
  ) AS eventos_proximos_7_dias,

  (SELECT COUNT(*) FROM inventory_items
    WHERE quantity <= COALESCE(min_quantity, 0) AND active = true
  ) AS itens_estoque_critico,

  (SELECT COUNT(*) FROM inventory_items WHERE quantity = 0 AND active = true) AS itens_sem_estoque,

  (SELECT COALESCE(SUM(quantity * COALESCE(unit_cost, 0)), 0) FROM inventory_items WHERE active = true) AS valor_estoque_total,

  (SELECT COUNT(*) FROM customers) AS total_clientes,
  (SELECT COUNT(*) FROM customers WHERE created_at >= NOW() - INTERVAL '30 days') AS novos_clientes_30d,

  (SELECT COUNT(*) FROM crm_opportunities
    WHERE status NOT IN ('fechado','perdido','cancelado','fechado_perdido')
  ) AS oportunidades_ativas,

  (SELECT COALESCE(SUM(COALESCE(valor, valor_estimado, 0)), 0) FROM crm_opportunities
    WHERE status NOT IN ('fechado','perdido','cancelado','fechado_perdido')
  ) AS valor_pipeline_crm,

  (SELECT COUNT(*) FROM employees WHERE active = true) AS funcionarios_ativos,
  (SELECT COALESCE(SUM(balance), 0) FROM bank_accounts WHERE active = true) AS saldo_contas,
  (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('pendente','aprovado','em_andamento','aguardando_entrega')) AS pedidos_compra_abertos,

  NOW() AS snapshot_timestamp;

GRANT SELECT ON v_thomaz_company_snapshot TO anon, authenticated;

-- ─── VIEW: Agenda ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_agenda_today CASCADE;
CREATE OR REPLACE VIEW v_thomaz_agenda_today AS
SELECT
  ae.id,
  ae.title AS titulo,
  ae.description AS descricao,
  ae.start_date AS data_inicio,
  ae.end_date AS data_fim,
  ae.event_type AS tipo_evento,
  ae.status,
  ae.priority AS prioridade,
  ae.location AS local,
  ae.notes,
  c.nome_razao AS cliente_nome,
  e.name AS responsavel_nome,
  CASE
    WHEN ae.start_date::date = CURRENT_DATE THEN 'hoje'
    WHEN ae.start_date::date = CURRENT_DATE + 1 THEN 'amanha'
    ELSE 'proximos_dias'
  END AS quando
FROM agenda_events ae
LEFT JOIN customers c ON c.id = ae.customer_id
LEFT JOIN employees e ON e.id = ae.employee_id
WHERE ae.start_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND ae.status NOT IN ('cancelado','cancelled')
ORDER BY ae.start_date ASC;

GRANT SELECT ON v_thomaz_agenda_today TO anon, authenticated;

-- ─── VIEW: OS Resumo ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_os_summary CASCADE;
CREATE OR REPLACE VIEW v_thomaz_os_summary AS
SELECT
  so.id,
  so.order_number,
  so.status,
  so.client_name AS cliente_nome,
  so.client_phone AS cliente_telefone,
  COALESCE(so.total_value, so.total_cost, 0) AS valor_total,
  so.service_type,
  so.service_date,
  so.completion_date,
  so.due_date,
  so.created_at,
  so.notes,
  so.description AS descricao,
  c.nome_razao AS cliente_cadastrado,
  c.celular AS cliente_celular,
  (CURRENT_DATE - so.created_at::date) AS dias_em_aberto
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id
WHERE so.status NOT IN ('cancelado','cancelled')
ORDER BY so.created_at DESC
LIMIT 300;

GRANT SELECT ON v_thomaz_os_summary TO anon, authenticated;

-- ─── VIEW: Financeiro ─────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_financial_summary CASCADE;
CREATE OR REPLACE VIEW v_thomaz_financial_summary AS
SELECT
  fe.id,
  fe.tipo,
  fe.descricao,
  fe.valor,
  fe.status,
  COALESCE(fe.data_vencimento, fe.due_date, fe.data) AS data_vencimento,
  fe.data,
  fe.categoria,
  fe.subcategoria,
  fe.is_recurring AS recorrente,
  ba.account_name AS conta_bancaria,
  ba.bank_name AS banco,
  c.nome_razao AS cliente_nome,
  CASE
    WHEN COALESCE(fe.data_vencimento, fe.due_date, fe.data)::date < CURRENT_DATE
      AND fe.status NOT IN ('pago','paid','confirmado','cancelado')
    THEN true ELSE false
  END AS vencido,
  GREATEST(0, (CURRENT_DATE - COALESCE(fe.data_vencimento, fe.due_date, fe.data)::date)) AS dias_atraso
FROM finance_entries fe
LEFT JOIN bank_accounts ba ON ba.id = fe.bank_account_id
LEFT JOIN customers c ON c.id = fe.customer_id
ORDER BY COALESCE(fe.data_vencimento, fe.due_date, fe.data) DESC
LIMIT 500;

GRANT SELECT ON v_thomaz_financial_summary TO anon, authenticated;

-- ─── VIEW: Estoque ────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_inventory_status CASCADE;
CREATE OR REPLACE VIEW v_thomaz_inventory_status AS
SELECT
  ii.id,
  ii.name AS nome,
  ii.code AS codigo,
  ii.category AS categoria,
  ii.quantity AS quantidade,
  COALESCE(ii.min_quantity, 0) AS estoque_minimo,
  COALESCE(ii.unit_cost, 0) AS preco_custo,
  COALESCE(ii.unit_price, 0) AS preco_venda,
  ii.unit AS unidade,
  ii.supplier_name AS fornecedor,
  CASE
    WHEN ii.quantity = 0 THEN 'sem_estoque'
    WHEN ii.quantity <= COALESCE(ii.min_quantity, 0) THEN 'critico'
    WHEN ii.quantity <= COALESCE(ii.min_quantity, 0) * 1.5 THEN 'baixo'
    ELSE 'normal'
  END AS status_estoque,
  (ii.quantity * COALESCE(ii.unit_cost, 0)) AS valor_total_custo,
  (ii.quantity * COALESCE(ii.unit_price, 0)) AS valor_total_venda
FROM inventory_items ii
WHERE ii.active = true
ORDER BY
  CASE WHEN ii.quantity = 0 THEN 0 WHEN ii.quantity <= COALESCE(ii.min_quantity,0) THEN 1 ELSE 2 END,
  ii.name;

GRANT SELECT ON v_thomaz_inventory_status TO anon, authenticated;

-- ─── VIEW: CRM Pipeline ───────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_crm_pipeline CASCADE;
CREATE OR REPLACE VIEW v_thomaz_crm_pipeline AS
SELECT
  op.id,
  op.titulo,
  COALESCE(op.valor, op.valor_estimado, 0) AS valor,
  op.status,
  op.origem,
  op.temperatura,
  op.lead_score,
  op.data_fechamento_esperada,
  op.data_criacao,
  op.dias_no_pipeline,
  c.nome_razao AS cliente_nome,
  c.celular AS cliente_telefone,
  e.name AS responsavel,
  (COALESCE(op.valor, op.valor_estimado, 0) * COALESCE(op.lead_score, 50) / 100.0) AS valor_ponderado,
  CASE
    WHEN op.data_fechamento_esperada IS NOT NULL
    THEN (op.data_fechamento_esperada::date - CURRENT_DATE)
    ELSE NULL
  END AS dias_para_fechamento
FROM crm_opportunities op
LEFT JOIN customers c ON c.id = op.customer_id
LEFT JOIN employees e ON e.id = op.owner_id
WHERE op.status NOT IN ('perdido','cancelado','fechado_perdido')
ORDER BY COALESCE(op.valor, op.valor_estimado, 0) DESC NULLS LAST;

GRANT SELECT ON v_thomaz_crm_pipeline TO anon, authenticated;

-- ─── VIEW: Clientes ───────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_customers_summary CASCADE;
CREATE OR REPLACE VIEW v_thomaz_customers_summary AS
SELECT
  c.id,
  c.nome_razao AS nome,
  c.nome_fantasia,
  c.email,
  c.telefone,
  c.celular,
  c.whatsapp,
  c.tipo_pessoa AS tipo,
  c.created_at,
  COUNT(DISTINCT so.id) AS total_os,
  COALESCE(SUM(COALESCE(so.total_value, so.total_cost, 0)) FILTER (
    WHERE so.status IN ('concluido','concluída','finalizado','fechado','completed','done')
  ), 0) AS receita_total,
  MAX(so.created_at) AS ultima_os,
  COUNT(DISTINCT so.id) FILTER (
    WHERE so.status IN ('aberto','pendente','em_andamento','em andamento','in_progress')
  ) AS os_ativas,
  COUNT(DISTINCT op.id) FILTER (
    WHERE op.status NOT IN ('perdido','cancelado','fechado_perdido')
  ) AS oportunidades_ativas
FROM customers c
LEFT JOIN service_orders so ON so.customer_id = c.id
LEFT JOIN crm_opportunities op ON op.customer_id = c.id
GROUP BY c.id, c.nome_razao, c.nome_fantasia, c.email, c.telefone, c.celular, c.whatsapp, c.tipo_pessoa, c.created_at
ORDER BY receita_total DESC NULLS LAST;

GRANT SELECT ON v_thomaz_customers_summary TO anon, authenticated;

-- ─── VIEW: Funcionários ───────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_employees_summary CASCADE;
CREATE OR REPLACE VIEW v_thomaz_employees_summary AS
SELECT
  e.id,
  e.name AS nome,
  e.role AS cargo,
  e.department AS departamento,
  e.email,
  e.phone AS telefone,
  e.admission_date AS data_admissao,
  e.salary,
  e.active,
  COUNT(DISTINCT so.id) AS os_atribuidas,
  COUNT(DISTINCT so.id) FILTER (
    WHERE so.status IN ('concluido','concluída','finalizado','fechado','completed','done')
  ) AS os_concluidas,
  COALESCE(SUM(COALESCE(so.total_value, so.total_cost, 0)) FILTER (
    WHERE so.status IN ('concluido','concluída','finalizado','fechado','completed','done')
  ), 0) AS faturamento_gerado
FROM employees e
LEFT JOIN service_orders so ON so.assigned_to = e.id::text
GROUP BY e.id, e.name, e.role, e.department, e.email, e.phone, e.admission_date, e.salary, e.active
ORDER BY e.active DESC, faturamento_gerado DESC NULLS LAST;

GRANT SELECT ON v_thomaz_employees_summary TO anon, authenticated;

-- ─── VIEW: Fornecedores ───────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_thomaz_suppliers_summary CASCADE;
CREATE OR REPLACE VIEW v_thomaz_suppliers_summary AS
SELECT
  s.id,
  s.name AS nome,
  s.email,
  s.phone AS telefone,
  s.contact_person AS contato,
  s.payment_terms AS prazo_pagamento,
  s.active AS ativo,
  s.created_at,
  COUNT(DISTINCT po.id) AS total_pedidos,
  COALESCE(SUM(po.final_amount), 0) AS valor_total_compras,
  MAX(po.created_at) AS ultima_compra
FROM suppliers s
LEFT JOIN purchase_orders po ON po.supplier_name = s.name
GROUP BY s.id, s.name, s.email, s.phone, s.contact_person, s.payment_terms, s.active, s.created_at
ORDER BY valor_total_compras DESC NULLS LAST;

GRANT SELECT ON v_thomaz_suppliers_summary TO anon, authenticated;

-- ─── FUNÇÃO RPC: Contexto Completo ────────────────────────────────────────────
DROP FUNCTION IF EXISTS thomaz_get_full_company_context();
CREATE OR REPLACE FUNCTION thomaz_get_full_company_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot   jsonb;
  v_os         jsonb;
  v_agenda     jsonb;
  v_financeiro jsonb;
  v_estoque    jsonb;
  v_crm        jsonb;
  v_clientes   jsonb;
  v_func       jsonb;
  v_fornec     jsonb;
  v_compras    jsonb;
  v_contas     jsonb;
BEGIN
  SELECT row_to_json(t) INTO v_snapshot
  FROM (SELECT * FROM v_thomaz_company_snapshot LIMIT 1) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_os
  FROM (
    SELECT order_number, status, cliente_nome, valor_total, service_type,
           service_date, due_date, dias_em_aberto, descricao
    FROM v_thomaz_os_summary
    WHERE status IN ('aberto','pendente','aguardando','open','pending',
                     'em_andamento','em andamento','in_progress','execucao')
    ORDER BY dias_em_aberto DESC NULLS LAST
    LIMIT 15
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_agenda
  FROM (
    SELECT titulo, data_inicio, data_fim, tipo_evento, status,
           cliente_nome, responsavel_nome, local, quando, notes
    FROM v_thomaz_agenda_today
    ORDER BY data_inicio LIMIT 20
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_financeiro
  FROM (
    SELECT tipo, descricao, valor, status, data_vencimento, vencido,
           dias_atraso, cliente_nome, conta_bancaria, banco, categoria
    FROM v_thomaz_financial_summary
    WHERE status NOT IN ('pago','paid','confirmado','cancelado')
      AND (vencido = true
           OR COALESCE(data_vencimento, data)::date <= CURRENT_DATE + 30)
    ORDER BY CASE WHEN vencido THEN 0 ELSE 1 END, data_vencimento ASC NULLS LAST
    LIMIT 30
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_estoque
  FROM (
    SELECT nome, quantidade, estoque_minimo, status_estoque,
           preco_custo, preco_venda, fornecedor, categoria
    FROM v_thomaz_inventory_status
    WHERE status_estoque IN ('sem_estoque','critico','baixo')
    ORDER BY CASE status_estoque WHEN 'sem_estoque' THEN 0 WHEN 'critico' THEN 1 ELSE 2 END, nome
    LIMIT 20
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_crm
  FROM (
    SELECT titulo, valor, status, origem, temperatura, lead_score,
           cliente_nome, responsavel, valor_ponderado, dias_para_fechamento,
           dias_no_pipeline, data_fechamento_esperada
    FROM v_thomaz_crm_pipeline
    ORDER BY valor DESC NULLS LAST LIMIT 10
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_clientes
  FROM (
    SELECT nome, tipo, total_os, receita_total, os_ativas,
           oportunidades_ativas, ultima_os, telefone, whatsapp
    FROM v_thomaz_customers_summary
    WHERE receita_total > 0
    ORDER BY receita_total DESC LIMIT 10
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_func
  FROM (
    SELECT nome, cargo, departamento, salary, os_atribuidas,
           os_concluidas, faturamento_gerado
    FROM v_thomaz_employees_summary
    WHERE active = true
    ORDER BY faturamento_gerado DESC NULLS LAST
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_fornec
  FROM (
    SELECT nome, telefone, contato, prazo_pagamento,
           total_pedidos, valor_total_compras, ultima_compra
    FROM v_thomaz_suppliers_summary
    WHERE ativo = true
    ORDER BY valor_total_compras DESC NULLS LAST LIMIT 10
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_compras
  FROM (
    SELECT order_number, supplier_name, status, final_amount,
           order_date, expected_delivery_date, notes
    FROM purchase_orders
    WHERE status IN ('pendente','aprovado','em_andamento','aguardando_entrega')
    ORDER BY order_date DESC NULLS LAST LIMIT 10
  ) t;

  SELECT jsonb_agg(row_to_json(t)) INTO v_contas
  FROM (
    SELECT account_name, bank_name, account_type, balance, is_default
    FROM bank_accounts WHERE active = true
    ORDER BY is_default DESC, balance DESC
  ) t;

  RETURN jsonb_build_object(
    'snapshot',            COALESCE(v_snapshot, '{}'::jsonb),
    'os_em_aberto',        COALESCE(v_os, '[]'::jsonb),
    'agenda',              COALESCE(v_agenda, '[]'::jsonb),
    'financeiro_pendente', COALESCE(v_financeiro, '[]'::jsonb),
    'estoque_alertas',     COALESCE(v_estoque, '[]'::jsonb),
    'crm_pipeline',        COALESCE(v_crm, '[]'::jsonb),
    'top_clientes',        COALESCE(v_clientes, '[]'::jsonb),
    'funcionarios',        COALESCE(v_func, '[]'::jsonb),
    'fornecedores',        COALESCE(v_fornec, '[]'::jsonb),
    'compras_abertas',     COALESCE(v_compras, '[]'::jsonb),
    'contas_bancarias',    COALESCE(v_contas, '[]'::jsonb),
    'gerado_em',           NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION thomaz_get_full_company_context() TO anon, authenticated;
