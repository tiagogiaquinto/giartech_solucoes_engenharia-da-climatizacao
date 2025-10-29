-- =====================================================
-- SCRIPT DE VERIFICAÇÃO DE OSs EXISTENTES
-- Execute ANTES da migration para ver o estado atual
-- =====================================================

-- 1. Contar OSs ativas
SELECT
  '1. OSs ATIVAS' as analise,
  COUNT(*) as total
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida');

-- 2. OSs sem itens
SELECT
  '2. OSs SEM ITENS' as analise,
  COUNT(*) as total
FROM service_orders so
WHERE status NOT IN ('cancelada', 'excluida')
  AND NOT EXISTS (
    SELECT 1 FROM service_order_items WHERE service_order_id = so.id
  );

-- 3. OSs sem materiais
SELECT
  '3. OSs SEM MATERIAIS' as analise,
  COUNT(*) as total
FROM service_orders so
WHERE status NOT IN ('cancelada', 'excluida')
  AND NOT EXISTS (
    SELECT 1 FROM service_order_materials WHERE service_order_id = so.id
  );

-- 4. OSs sem mão de obra
SELECT
  '4. OSs SEM MÃO DE OBRA' as analise,
  COUNT(*) as total
FROM service_orders so
WHERE status NOT IN ('cancelada', 'excluida')
  AND NOT EXISTS (
    SELECT 1 FROM service_order_labor WHERE service_order_id = so.id
  );

-- 5. Detalhes das OSs (primeiras 10)
SELECT
  so.order_number as "Número",
  so.status as "Status",
  so.total_value as "Valor Total",
  COALESCE(
    (SELECT COUNT(*) FROM service_order_items WHERE service_order_id = so.id),
    0
  ) as "Qtd Itens",
  COALESCE(
    (SELECT COUNT(*) FROM service_order_materials WHERE service_order_id = so.id),
    0
  ) as "Qtd Materiais",
  COALESCE(
    (SELECT COUNT(*) FROM service_order_labor WHERE service_order_id = so.id),
    0
  ) as "Qtd Mão Obra"
FROM service_orders so
WHERE status NOT IN ('cancelada', 'excluida')
ORDER BY so.created_at DESC
LIMIT 10;

-- 6. OSs problemáticas (sem nenhum dado relacionado)
SELECT
  so.order_number as "Número OS",
  so.client_name as "Cliente",
  so.status as "Status",
  so.total_value as "Valor",
  so.created_at as "Criada em"
FROM service_orders so
WHERE status NOT IN ('cancelada', 'excluida')
  AND NOT EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = so.id)
  AND NOT EXISTS (SELECT 1 FROM service_order_materials WHERE service_order_id = so.id)
  AND NOT EXISTS (SELECT 1 FROM service_order_labor WHERE service_order_id = so.id)
ORDER BY so.created_at DESC;

-- 7. Resumo por status
SELECT
  status as "Status",
  COUNT(*) as "Total",
  COUNT(CASE
    WHEN EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = service_orders.id)
    THEN 1
  END) as "Com Itens",
  COUNT(CASE
    WHEN NOT EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = service_orders.id)
    THEN 1
  END) as "Sem Itens"
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida')
GROUP BY status
ORDER BY COUNT(*) DESC;

-- 8. Valores totais
SELECT
  'TOTAIS' as analise,
  SUM(total_value) as "Valor Total OSs",
  SUM(custo_total) as "Custo Total",
  SUM(lucro_total) as "Lucro Total",
  AVG(margem_lucro) as "Margem Média %"
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida');
