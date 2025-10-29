-- =====================================================
-- QUERIES PRONTAS: CENTRO DE CUSTOS E ROI
-- =====================================================
-- Cole estas queries no Supabase SQL Editor para análises rápidas

-- =====================================================
-- 1. VERIFICAR INSTALAÇÃO DO SISTEMA
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT
  'cost_centers' as tabela,
  COUNT(*) as registros
FROM cost_centers
UNION ALL
SELECT
  'service_order_costs',
  COUNT(*)
FROM service_order_costs;

-- Listar centros de custo disponíveis
SELECT
  code,
  name,
  department,
  budget_monthly,
  is_active
FROM cost_centers
ORDER BY code;

-- =====================================================
-- 2. ANÁLISE DE ROI POR TIPO DE SERVIÇO
-- =====================================================

-- Ver quais tipos de serviço são mais lucrativos
SELECT
  service_type,
  completed_services as "OSs Concluídas",
  TO_CHAR(avg_revenue, 'FM999,999.00') as "Receita Média",
  TO_CHAR(avg_actual_cost, 'FM999,999.00') as "Custo Médio",
  TO_CHAR(avg_profit, 'FM999,999.00') as "Lucro Médio",
  TO_CHAR(avg_margin, 'FM90.00') || '%' as "Margem %",
  TO_CHAR(avg_roi, 'FM990.00') || '%' as "ROI %",
  service_classification as "Classificação"
FROM v_service_roi_by_type
ORDER BY avg_roi DESC;

-- =====================================================
-- 3. TOP 10 OSs MAIS LUCRATIVAS
-- =====================================================

SELECT
  order_number as "OS",
  client_name as "Cliente",
  service_type as "Tipo",
  TO_CHAR(revenue, 'FM999,999.00') as "Receita",
  TO_CHAR(actual_cost, 'FM999,999.00') as "Custo",
  TO_CHAR(profit, 'FM999,999.00') as "Lucro",
  TO_CHAR(profit_margin, 'FM90.00') || '%' as "Margem",
  TO_CHAR(roi, 'FM990.00') || '%' as "ROI"
FROM v_service_order_profitability
WHERE status = 'concluido'
ORDER BY roi DESC
LIMIT 10;

-- =====================================================
-- 4. BOTTOM 10 OSs (MENOR ROI)
-- =====================================================

SELECT
  order_number as "OS",
  client_name as "Cliente",
  service_type as "Tipo",
  TO_CHAR(revenue, 'FM999,999.00') as "Receita",
  TO_CHAR(actual_cost, 'FM999,999.00') as "Custo",
  TO_CHAR(profit, 'FM999,999.00') as "Lucro",
  TO_CHAR(roi, 'FM990.00') || '%' as "ROI",
  roi_classification as "Class."
FROM v_service_order_profitability
WHERE status = 'concluido'
ORDER BY roi ASC
LIMIT 10;

-- =====================================================
-- 5. ANÁLISE DE CUSTOS EXTRAS POR CATEGORIA
-- =====================================================

SELECT
  category as "Categoria",
  occurrence_count as "Ocorrências",
  TO_CHAR(total_amount, 'FM999,999.00') as "Total",
  TO_CHAR(avg_amount, 'FM999,999.00') as "Média",
  TO_CHAR(max_amount, 'FM999,999.00') as "Máximo",
  warranty_count as "Em Garantia",
  unplanned_count as "Não Planejados"
FROM v_cost_analysis
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY category, occurrence_count, total_amount, avg_amount, max_amount, warranty_count, unplanned_count
ORDER BY total_amount DESC;

-- =====================================================
-- 6. CUSTOS DE GARANTIA (ALERTAS)
-- =====================================================

-- Ver quais OSs tiveram custos de garantia
SELECT
  order_number as "OS",
  client_name as "Cliente",
  service_type as "Tipo",
  TO_CHAR(warranty_costs, 'FM999,999.00') as "Custo Garantia",
  TO_CHAR(revenue, 'FM999,999.00') as "Receita",
  TO_CHAR((warranty_costs / NULLIF(revenue, 0) * 100), 'FM90.00') || '%' as "% da Receita",
  CASE
    WHEN (warranty_costs / NULLIF(revenue, 0) * 100) > 20 THEN '🔴 CRÍTICO'
    WHEN (warranty_costs / NULLIF(revenue, 0) * 100) > 10 THEN '🟡 ATENÇÃO'
    ELSE '🟢 OK'
  END as "Status"
FROM v_service_order_profitability
WHERE warranty_costs > 0
ORDER BY (warranty_costs / NULLIF(revenue, 0)) DESC;

-- =====================================================
-- 7. DASHBOARD CFO - MÊS ATUAL
-- =====================================================

SELECT
  cost_center_name as "Centro de Custo",
  department as "Departamento",
  total_orders as "Total OSs",
  completed_orders as "Concluídas",
  TO_CHAR(total_revenue, 'FM999,999.00') as "Receita",
  TO_CHAR(total_actual_cost, 'FM999,999.00') as "Custo",
  TO_CHAR(total_extra_costs, 'FM999,999.00') as "Custos Extras",
  TO_CHAR(total_profit, 'FM999,999.00') as "Lucro",
  TO_CHAR(avg_margin, 'FM90.00') || '%' as "Margem Média",
  TO_CHAR(avg_roi, 'FM990.00') || '%' as "ROI Médio"
FROM v_cfo_cost_analysis
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_revenue DESC;

-- =====================================================
-- 8. TENDÊNCIA DE CUSTOS EXTRAS (ÚLTIMOS 6 MESES)
-- =====================================================

SELECT
  TO_CHAR(month, 'YYYY-MM') as "Mês",
  COUNT(DISTINCT service_order_id) as "OSs com Extras",
  COUNT(*) as "Total de Custos",
  TO_CHAR(SUM(amount), 'FM999,999.00') as "Total Gasto",
  TO_CHAR(AVG(amount), 'FM999,999.00') as "Média por Custo"
FROM service_order_costs
WHERE cost_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY month
ORDER BY month DESC;

-- =====================================================
-- 9. EFICIÊNCIA POR DEPARTAMENTO
-- =====================================================

SELECT
  department as "Departamento",
  COUNT(DISTINCT cost_center_name) as "Centros de Custo",
  SUM(total_orders) as "Total OSs",
  TO_CHAR(SUM(total_revenue), 'FM999,999,999.00') as "Receita Total",
  TO_CHAR(SUM(total_actual_cost), 'FM999,999,999.00') as "Custo Total",
  TO_CHAR(SUM(total_profit), 'FM999,999,999.00') as "Lucro Total",
  TO_CHAR(AVG(avg_margin), 'FM90.00') || '%' as "Margem Média",
  TO_CHAR(AVG(avg_roi), 'FM990.00') || '%' as "ROI Médio",
  CASE
    WHEN AVG(avg_roi) >= 40 THEN '⭐⭐⭐ Excelente'
    WHEN AVG(avg_roi) >= 25 THEN '⭐⭐ Bom'
    WHEN AVG(avg_roi) >= 10 THEN '⭐ Regular'
    ELSE '❌ Revisar'
  END as "Avaliação"
FROM v_cfo_cost_analysis
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY department
ORDER BY AVG(avg_roi) DESC;

-- =====================================================
-- 10. CUSTOS POR TIPO (PIZZA CHART)
-- =====================================================

SELECT
  category as "Tipo de Custo",
  COUNT(*) as "Quantidade",
  TO_CHAR(SUM(amount), 'FM999,999.00') as "Total",
  TO_CHAR(
    (SUM(amount) / (SELECT SUM(amount) FROM service_order_costs WHERE EXTRACT(YEAR FROM cost_date) = EXTRACT(YEAR FROM CURRENT_DATE)) * 100),
    'FM90.0'
  ) || '%' as "% do Total"
FROM service_order_costs
WHERE EXTRACT(YEAR FROM cost_date) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY category
ORDER BY SUM(amount) DESC;

-- =====================================================
-- 11. OSs COM DESVIO DE CUSTO ALTO (> 30%)
-- =====================================================

SELECT
  order_number as "OS",
  client_name as "Cliente",
  service_type as "Tipo",
  TO_CHAR(planned_cost, 'FM999,999.00') as "Planejado",
  TO_CHAR(actual_cost, 'FM999,999.00') as "Real",
  TO_CHAR(cost_variance, 'FM999,999.00') as "Diferença",
  TO_CHAR(cost_variance_percent, 'FM990.0') || '%' as "% Desvio",
  extra_cost_count as "Qtd Extras",
  CASE
    WHEN cost_variance_percent > 50 THEN '🔴 CRÍTICO'
    WHEN cost_variance_percent > 30 THEN '🟡 ALTO'
    ELSE '🟢 OK'
  END as "Alerta"
FROM v_service_order_profitability
WHERE cost_variance_percent > 30
  AND status = 'concluido'
ORDER BY cost_variance_percent DESC;

-- =====================================================
-- 12. ANÁLISE DE COMBUSTÍVEL
-- =====================================================

SELECT
  TO_CHAR(cost_date, 'YYYY-MM') as "Mês",
  COUNT(*) as "Abastecimentos",
  TO_CHAR(SUM(amount), 'FM999,999.00') as "Total Gasto",
  TO_CHAR(AVG(amount), 'FM999.00') as "Média/Abast.",
  TO_CHAR(MIN(amount), 'FM999.00') as "Mínimo",
  TO_CHAR(MAX(amount), 'FM999.00') as "Máximo"
FROM service_order_costs
WHERE category = 'combustivel'
  AND cost_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(cost_date, 'YYYY-MM')
ORDER BY "Mês" DESC;

-- =====================================================
-- 13. RELATÓRIO EXECUTIVO COMPLETO
-- =====================================================

SELECT * FROM get_cost_center_report(
  NULL,  -- Todos os centros de custo
  DATE_TRUNC('year', CURRENT_DATE)::date,  -- Início do ano
  CURRENT_DATE  -- Até hoje
);

-- =====================================================
-- 14. ANÁLISE TEMPORAL DE ROI
-- =====================================================

SELECT
  TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as "Mês",
  COUNT(*) as "OSs",
  TO_CHAR(AVG(roi), 'FM990.00') || '%' as "ROI Médio",
  TO_CHAR(AVG(profit_margin), 'FM90.00') || '%' as "Margem Média",
  TO_CHAR(SUM(revenue), 'FM999,999,999.00') as "Receita",
  TO_CHAR(SUM(profit), 'FM999,999,999.00') as "Lucro"
FROM v_service_order_profitability
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
  AND status = 'concluido'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY DATE_TRUNC('month', created_at) DESC;

-- =====================================================
-- 15. RANKING DE CLIENTES POR RENTABILIDADE
-- =====================================================

SELECT
  client_name as "Cliente",
  COUNT(*) as "OSs",
  TO_CHAR(SUM(revenue), 'FM999,999.00') as "Receita Total",
  TO_CHAR(SUM(profit), 'FM999,999.00') as "Lucro Total",
  TO_CHAR(AVG(profit_margin), 'FM90.00') || '%' as "Margem Média",
  TO_CHAR(AVG(roi), 'FM990.00') || '%' as "ROI Médio",
  CASE
    WHEN AVG(roi) >= 40 THEN '🌟 VIP'
    WHEN AVG(roi) >= 25 THEN '⭐ Premium'
    WHEN AVG(roi) >= 10 THEN '✓ Regular'
    ELSE '⚠️ Revisar'
  END as "Classificação"
FROM v_service_order_profitability
WHERE status = 'concluido'
GROUP BY client_name
HAVING COUNT(*) >= 3  -- Mínimo 3 OSs
ORDER BY AVG(roi) DESC
LIMIT 20;

-- =====================================================
-- 16. INSERIR CUSTO EXTRA - TEMPLATE
-- =====================================================

/*
-- Template para inserir custo extra:

INSERT INTO service_order_costs (
  service_order_id,
  category,
  cost_type,
  description,
  amount,
  cost_date,
  is_warranty,
  is_planned,
  cost_center_id,
  created_by
) VALUES (
  'UUID_DA_OS',
  'combustivel',  -- ou: material_extra, pedagio, alimentacao, etc
  'combustivel',
  'Descrição detalhada do custo',
  150.00,
  CURRENT_DATE,
  false,  -- true se for custo de garantia
  false,  -- true se foi planejado
  (SELECT id FROM cost_centers WHERE code = 'CC-008'),
  'nome_do_usuario'
);
*/

-- =====================================================
-- 17. ATUALIZAR CENTRO DE CUSTO DE UMA OS
-- =====================================================

/*
-- Associar OS a um centro de custo:

UPDATE service_orders
SET cost_center_id = (SELECT id FROM cost_centers WHERE code = 'CC-002')
WHERE order_number = '05/2025';
*/

-- =====================================================
-- 18. CRIAR NOVO CENTRO DE CUSTO
-- =====================================================

/*
INSERT INTO cost_centers (
  code,
  name,
  description,
  department,
  budget_monthly,
  is_active
) VALUES (
  'CC-011',
  'Nome do Centro',
  'Descrição detalhada',
  'Departamento',
  10000.00,
  true
);
*/

-- =====================================================
-- FIM DAS QUERIES
-- =====================================================

-- Mensagem de confirmação
SELECT
  '✅ Queries prontas para uso!' as mensagem,
  '📊 Total de queries: 18' as info;
