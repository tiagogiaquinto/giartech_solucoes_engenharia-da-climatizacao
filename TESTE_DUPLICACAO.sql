-- =====================================================
-- TESTE: Verificar Duplicação de Serviços
-- =====================================================

-- 1. Verificar se há itens duplicados
SELECT
  'ITENS DUPLICADOS' as tipo,
  service_order_id,
  descricao,
  unit_price,
  COUNT(*) as quantidade_duplicados,
  ARRAY_AGG(id) as ids_duplicados
FROM service_order_items
GROUP BY service_order_id, descricao, unit_price
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC;

-- 2. Verificar materiais duplicados
SELECT
  'MATERIAIS DUPLICADOS' as tipo,
  service_order_id,
  material_name,
  COUNT(*) as quantidade_duplicados,
  ARRAY_AGG(id) as ids_duplicados
FROM service_order_materials
GROUP BY service_order_id, material_name
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC;

-- 3. Verificar mão de obra duplicada
SELECT
  'MAO DE OBRA DUPLICADA' as tipo,
  service_order_id,
  nome_funcionario,
  COUNT(*) as quantidade_duplicados,
  ARRAY_AGG(id) as ids_duplicados
FROM service_order_labor
GROUP BY service_order_id, nome_funcionario
HAVING COUNT(*) > 1
ORDER BY quantidade_duplicados DESC;

-- 4. Ver última OS modificada
SELECT
  'ULTIMA OS MODIFICADA' as tipo,
  id,
  order_number,
  client_name,
  status,
  updated_at,
  (SELECT COUNT(*) FROM service_order_items WHERE service_order_id = service_orders.id) as total_itens
FROM service_orders
ORDER BY updated_at DESC
LIMIT 5;

-- 5. Ver itens da última OS
WITH last_os AS (
  SELECT id FROM service_orders ORDER BY updated_at DESC LIMIT 1
)
SELECT
  'ITENS DA ULTIMA OS' as tipo,
  soi.id,
  soi.descricao,
  soi.quantity,
  soi.unit_price,
  soi.total_price,
  soi.created_at
FROM service_order_items soi
JOIN last_os ON last_os.id = soi.service_order_id
ORDER BY soi.created_at DESC;

-- 6. Verificar triggers ativos
SELECT
  'TRIGGERS ATIVOS' as tipo,
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('service_order_items', 'service_order_materials', 'service_order_labor')
ORDER BY event_object_table, trigger_name;

-- 7. Verificar se função delete_service_order_safe existe
SELECT
  'FUNCAO DELETE SAFE' as tipo,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name LIKE '%delete_service_order%'
ORDER BY routine_name;
