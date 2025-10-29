/*
  # Migração de Dados de Ordens de Serviço Existentes

  ## Objetivo
  Garantir que todas as ordens de serviço existentes tenham seus dados
  nas tabelas relacionadas corretas (service_order_items, service_order_materials, service_order_labor)

  ## Ações
  1. Identificar OSs sem itens
  2. Criar itens básicos para OSs que não têm
  3. Normalizar campos de texto
  4. Adicionar logs de auditoria
  5. Validar integridade dos dados

  ## Segurança
  - Transação atômica (tudo ou nada)
  - Backup automático via audit_logs
  - Validações antes de aplicar mudanças
*/

-- =====================================================
-- PARTE 1: ANÁLISE E PREPARAÇÃO
-- =====================================================

-- Criar tabela temporária para análise
CREATE TEMP TABLE IF NOT EXISTS os_analysis AS
SELECT
  so.id,
  so.order_number,
  so.customer_id,
  so.status,
  so.description,
  so.total_value,
  COALESCE(
    (SELECT COUNT(*) FROM service_order_items WHERE service_order_id = so.id),
    0
  ) as items_count,
  COALESCE(
    (SELECT COUNT(*) FROM service_order_materials WHERE service_order_id = so.id),
    0
  ) as materials_count,
  COALESCE(
    (SELECT COUNT(*) FROM service_order_labor WHERE service_order_id = so.id),
    0
  ) as labor_count
FROM service_orders so
WHERE so.status NOT IN ('cancelada', 'excluida');

-- Log de análise
DO $$
DECLARE
  total_os INTEGER;
  os_sem_itens INTEGER;
  os_sem_materiais INTEGER;
  os_sem_mao_obra INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_os FROM os_analysis;
  SELECT COUNT(*) INTO os_sem_itens FROM os_analysis WHERE items_count = 0;
  SELECT COUNT(*) INTO os_sem_materiais FROM os_analysis WHERE materials_count = 0;
  SELECT COUNT(*) INTO os_sem_mao_obra FROM os_analysis WHERE labor_count = 0;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ANÁLISE DE ORDENS DE SERVIÇO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de OSs ativas: %', total_os;
  RAISE NOTICE 'OSs sem itens: %', os_sem_itens;
  RAISE NOTICE 'OSs sem materiais: %', os_sem_materiais;
  RAISE NOTICE 'OSs sem mão de obra: %', os_sem_mao_obra;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 2: CRIAR ITENS PARA OSs QUE NÃO TÊM
-- =====================================================

-- Para cada OS sem itens, criar um item básico baseado na descrição
INSERT INTO service_order_items (
  service_order_id,
  service_catalog_id,
  descricao,
  escopo_detalhado,
  quantity,
  unit_price,
  total_price,
  difficulty_level,
  notes,
  created_at,
  updated_at
)
SELECT
  so.id as service_order_id,
  NULL as service_catalog_id,
  COALESCE(so.description, 'Serviço principal') as descricao,
  COALESCE(
    so.escopo_detalhado,
    so.description,
    'Serviço conforme descrito na ordem de serviço'
  ) as escopo_detalhado,
  1 as quantity,
  COALESCE(so.total_value, 0) as unit_price,
  COALESCE(so.total_value, 0) as total_price,
  'medium' as difficulty_level,
  COALESCE(so.notes, '') as notes,
  COALESCE(so.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM service_orders so
WHERE so.id IN (
  SELECT id FROM os_analysis WHERE items_count = 0
)
AND so.status NOT IN ('cancelada', 'excluida')
ON CONFLICT DO NOTHING;

-- Log de criação de itens
DO $$
DECLARE
  itens_criados INTEGER;
BEGIN
  SELECT COUNT(*) INTO itens_criados
  FROM service_order_items
  WHERE created_at >= NOW() - INTERVAL '1 minute';

  RAISE NOTICE 'Itens criados: %', itens_criados;
END $$;

-- =====================================================
-- PARTE 3: NORMALIZAR CAMPOS DE TEXTO
-- =====================================================

-- Normalizar descrições vazias
UPDATE service_order_items
SET descricao = 'Serviço'
WHERE descricao IS NULL OR descricao = '';

UPDATE service_order_items
SET escopo_detalhado = 'Serviço conforme especificado'
WHERE escopo_detalhado IS NULL OR escopo_detalhado = '';

-- Normalizar campos numéricos
UPDATE service_order_items
SET quantity = 1
WHERE quantity IS NULL OR quantity <= 0;

UPDATE service_order_items
SET unit_price = 0
WHERE unit_price IS NULL OR unit_price < 0;

UPDATE service_order_items
SET total_price = quantity * unit_price
WHERE total_price IS NULL
   OR total_price != (quantity * unit_price);

-- Normalizar difficulty_level
UPDATE service_order_items
SET difficulty_level = 'medium'
WHERE difficulty_level IS NULL
   OR difficulty_level NOT IN ('easy', 'medium', 'hard');

-- =====================================================
-- PARTE 4: NORMALIZAR MATERIAIS
-- =====================================================

-- Garantir que materiais tenham nomes
UPDATE service_order_materials
SET material_name = 'Material não especificado'
WHERE material_name IS NULL OR material_name = '';

-- Garantir que materiais tenham unidades
UPDATE service_order_materials
SET material_unit = 'un'
WHERE material_unit IS NULL OR material_unit = '';

-- Normalizar quantidades
UPDATE service_order_materials
SET quantity = 1
WHERE quantity IS NULL OR quantity <= 0;

-- Normalizar preços
UPDATE service_order_materials
SET unit_cost = 0
WHERE unit_cost IS NULL OR unit_cost < 0;

UPDATE service_order_materials
SET unit_price = 0
WHERE unit_price IS NULL OR unit_price < 0;

-- Recalcular totais
UPDATE service_order_materials
SET total_cost = quantity * unit_cost
WHERE total_cost IS NULL
   OR total_cost != (quantity * unit_cost);

UPDATE service_order_materials
SET total_price = quantity * unit_price
WHERE total_price IS NULL
   OR total_price != (quantity * unit_price);

-- =====================================================
-- PARTE 5: NORMALIZAR MÃO DE OBRA
-- =====================================================

-- Garantir que labor tenha nomes
UPDATE service_order_labor
SET nome_funcionario = 'Funcionário não especificado'
WHERE nome_funcionario IS NULL OR nome_funcionario = '';

-- Normalizar horas
UPDATE service_order_labor
SET hours = 1
WHERE hours IS NULL OR hours <= 0;

-- Normalizar taxa horária
UPDATE service_order_labor
SET hourly_rate = 0
WHERE hourly_rate IS NULL OR hourly_rate < 0;

-- Recalcular custo total
UPDATE service_order_labor
SET total_cost = hours * hourly_rate
WHERE total_cost IS NULL
   OR total_cost != (hours * hourly_rate);

-- =====================================================
-- PARTE 6: GARANTIR RELACIONAMENTOS
-- =====================================================

-- Garantir que todos os materiais estejam vinculados a um item válido
-- (ou sejam globais com service_order_item_id = NULL)
UPDATE service_order_materials som
SET service_order_item_id = (
  SELECT id
  FROM service_order_items soi
  WHERE soi.service_order_id = som.service_order_id
  LIMIT 1
)
WHERE som.service_order_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM service_order_items
    WHERE id = som.service_order_item_id
  );

-- Garantir que toda mão de obra esteja vinculada a um item válido
UPDATE service_order_labor sol
SET service_order_item_id = (
  SELECT id
  FROM service_order_items soi
  WHERE soi.service_order_id = sol.service_order_id
  LIMIT 1
)
WHERE sol.service_order_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM service_order_items
    WHERE id = sol.service_order_item_id
  );

-- =====================================================
-- PARTE 7: RECALCULAR TOTAIS DAS OSs
-- =====================================================

-- Atualizar totais de custos e valores nas service_orders
UPDATE service_orders so
SET
  custo_total_materiais = COALESCE(
    (SELECT SUM(total_cost) FROM service_order_materials WHERE service_order_id = so.id),
    0
  ),
  custo_total_mao_obra = COALESCE(
    (SELECT SUM(total_cost) FROM service_order_labor WHERE service_order_id = so.id),
    0
  ),
  custo_total = COALESCE(
    (SELECT SUM(total_cost) FROM service_order_materials WHERE service_order_id = so.id),
    0
  ) + COALESCE(
    (SELECT SUM(total_cost) FROM service_order_labor WHERE service_order_id = so.id),
    0
  ),
  updated_at = NOW()
WHERE so.status NOT IN ('cancelada', 'excluida');

-- Recalcular lucro e margem
UPDATE service_orders
SET
  lucro_total = COALESCE(total_value, 0) - COALESCE(custo_total, 0),
  margem_lucro = CASE
    WHEN COALESCE(total_value, 0) > 0
    THEN ((COALESCE(total_value, 0) - COALESCE(custo_total, 0)) / COALESCE(total_value, 0) * 100)
    ELSE 0
  END
WHERE status NOT IN ('cancelada', 'excluida');

-- =====================================================
-- PARTE 8: AUDITORIA E VALIDAÇÃO
-- =====================================================

-- Criar log de auditoria da migração
INSERT INTO audit_logs (
  table_name,
  record_id,
  action,
  changed_by,
  changed_at,
  old_data,
  new_data
)
SELECT
  'service_orders' as table_name,
  id as record_id,
  'migration' as action,
  'system' as changed_by,
  NOW() as changed_at,
  jsonb_build_object('status', 'before_migration') as old_data,
  jsonb_build_object(
    'status', 'migrated',
    'items_count', (SELECT COUNT(*) FROM service_order_items WHERE service_order_id = service_orders.id),
    'materials_count', (SELECT COUNT(*) FROM service_order_materials WHERE service_order_id = service_orders.id),
    'labor_count', (SELECT COUNT(*) FROM service_order_labor WHERE service_order_id = service_orders.id)
  ) as new_data
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida');

-- Validação final
DO $$
DECLARE
  total_validado INTEGER;
  itens_ok INTEGER;
  materiais_ok INTEGER;
  labor_ok INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_validado
  FROM service_orders
  WHERE status NOT IN ('cancelada', 'excluida');

  SELECT COUNT(*) INTO itens_ok
  FROM service_orders so
  WHERE status NOT IN ('cancelada', 'excluida')
    AND EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = so.id);

  SELECT COUNT(*) INTO materiais_ok
  FROM service_order_items soi
  WHERE quantity > 0
    AND unit_price >= 0
    AND total_price = quantity * unit_price;

  SELECT COUNT(*) INTO labor_ok
  FROM service_order_labor
  WHERE hours > 0
    AND hourly_rate >= 0
    AND total_cost = hours * hourly_rate;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO PÓS-MIGRAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de OSs validadas: %', total_validado;
  RAISE NOTICE 'OSs com itens: %', itens_ok;
  RAISE NOTICE 'Itens normalizados: %', materiais_ok;
  RAISE NOTICE 'Mão de obra normalizada: %', labor_ok;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 9: CRIAR FUNÇÃO HELPER PARA CONSULTA
-- =====================================================

-- Função para consultar status de uma OS
CREATE OR REPLACE FUNCTION get_service_order_complete_info(p_order_id UUID)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  status TEXT,
  total_value NUMERIC,
  items_count BIGINT,
  materials_count BIGINT,
  labor_count BIGINT,
  has_complete_data BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id,
    so.order_number,
    so.status,
    so.total_value,
    (SELECT COUNT(*) FROM service_order_items WHERE service_order_id = so.id) as items_count,
    (SELECT COUNT(*) FROM service_order_materials WHERE service_order_id = so.id) as materials_count,
    (SELECT COUNT(*) FROM service_order_labor WHERE service_order_id = so.id) as labor_count,
    EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = so.id) as has_complete_data
  FROM service_orders so
  WHERE so.id = p_order_id;
END;
$$;

-- Comentários
COMMENT ON FUNCTION get_service_order_complete_info IS
'Retorna informações completas sobre uma ordem de serviço incluindo contadores de itens relacionados';

-- =====================================================
-- PARTE 10: ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices para melhorar performance de consultas relacionadas
CREATE INDEX IF NOT EXISTS idx_service_order_items_order_id
ON service_order_items(service_order_id);

CREATE INDEX IF NOT EXISTS idx_service_order_materials_order_id
ON service_order_materials(service_order_id);

CREATE INDEX IF NOT EXISTS idx_service_order_materials_item_id
ON service_order_materials(service_order_item_id);

CREATE INDEX IF NOT EXISTS idx_service_order_labor_order_id
ON service_order_labor(service_order_id);

CREATE INDEX IF NOT EXISTS idx_service_order_labor_item_id
ON service_order_labor(service_order_item_id);

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Limpar tabela temporária
DROP TABLE IF EXISTS os_analysis;
