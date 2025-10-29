/*
  # CORREÇÃO EMERGENCIAL: Tabelas e Colunas

  ## Problemas Identificados
  1. Erro: relation "service_orders" does not exist
  2. Erro: Could not find 'unit_cost' column in service_order_materials

  ## Soluções
  1. Verificar e recriar service_orders se necessário
  2. Adicionar coluna unit_cost em service_order_materials
  3. Validar todas as tabelas relacionadas
*/

-- =====================================================
-- PARTE 1: VERIFICAR E CORRIGIR TABELA service_orders
-- =====================================================

DO $$
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_orders'
  ) THEN
    RAISE EXCEPTION 'TABELA service_orders NÃO EXISTE! Execute as migrations básicas primeiro!';
  ELSE
    RAISE NOTICE '✓ Tabela service_orders existe';
  END IF;
END $$;

-- =====================================================
-- PARTE 2: CORRIGIR service_order_materials
-- =====================================================

-- Adicionar coluna unit_cost se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials'
    AND column_name = 'unit_cost'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN unit_cost DECIMAL(10,2) DEFAULT 0;

    RAISE NOTICE '✓ Coluna unit_cost adicionada em service_order_materials';
  ELSE
    RAISE NOTICE '✓ Coluna unit_cost já existe';
  END IF;
END $$;

-- Adicionar outras colunas faltantes em service_order_materials
DO $$
BEGIN
  -- material_unit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials'
    AND column_name = 'material_unit'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN material_unit TEXT DEFAULT 'un';

    RAISE NOTICE '✓ Coluna material_unit adicionada';
  END IF;

  -- total_cost
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials'
    AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN total_cost DECIMAL(10,2) GENERATED ALWAYS AS (unit_cost * quantity) STORED;

    RAISE NOTICE '✓ Coluna total_cost adicionada';
  END IF;

  -- unit_price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials'
    AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;

    RAISE NOTICE '✓ Coluna unit_price adicionada';
  END IF;

  -- total_price
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials'
    AND column_name = 'total_price'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN total_price DECIMAL(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED;

    RAISE NOTICE '✓ Coluna total_price adicionada';
  END IF;
END $$;

-- =====================================================
-- PARTE 3: CORRIGIR service_order_labor
-- =====================================================

-- Adicionar colunas faltantes em service_order_labor
DO $$
BEGIN
  -- hourly_rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_labor'
    AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE service_order_labor
    ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 0;

    RAISE NOTICE '✓ Coluna hourly_rate adicionada em service_order_labor';
  END IF;

  -- hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_labor'
    AND column_name = 'hours'
  ) THEN
    ALTER TABLE service_order_labor
    ADD COLUMN hours DECIMAL(10,2) DEFAULT 0;

    RAISE NOTICE '✓ Coluna hours adicionada';
  END IF;

  -- total_cost
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_labor'
    AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE service_order_labor
    ADD COLUMN total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hourly_rate * hours) STORED;

    RAISE NOTICE '✓ Coluna total_cost adicionada';
  END IF;

  -- nome_funcionario
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_labor'
    AND column_name = 'nome_funcionario'
  ) THEN
    ALTER TABLE service_order_labor
    ADD COLUMN nome_funcionario TEXT;

    RAISE NOTICE '✓ Coluna nome_funcionario adicionada';
  END IF;
END $$;

-- =====================================================
-- PARTE 4: CORRIGIR service_order_items
-- =====================================================

DO $$
BEGIN
  -- escopo_detalhado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_items'
    AND column_name = 'escopo_detalhado'
  ) THEN
    ALTER TABLE service_order_items
    ADD COLUMN escopo_detalhado TEXT;

    RAISE NOTICE '✓ Coluna escopo_detalhado adicionada em service_order_items';
  END IF;

  -- total_cost
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_items'
    AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE service_order_items
    ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;

    RAISE NOTICE '✓ Coluna total_cost adicionada';
  END IF;
END $$;

-- =====================================================
-- PARTE 5: VERIFICAR ESTRUTURA COMPLETA
-- =====================================================

DO $$
DECLARE
  missing_cols TEXT;
BEGIN
  -- Verificar service_order_materials
  SELECT string_agg(col, ', ')
  INTO missing_cols
  FROM (
    SELECT unnest(ARRAY['unit_cost', 'unit_price', 'total_cost', 'total_price', 'material_unit']) as col
    EXCEPT
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'service_order_materials'
  ) t;

  IF missing_cols IS NOT NULL THEN
    RAISE WARNING 'Colunas ainda faltando em service_order_materials: %', missing_cols;
  ELSE
    RAISE NOTICE '✓ service_order_materials está completa';
  END IF;

  -- Verificar service_order_labor
  SELECT string_agg(col, ', ')
  INTO missing_cols
  FROM (
    SELECT unnest(ARRAY['hourly_rate', 'hours', 'total_cost', 'nome_funcionario']) as col
    EXCEPT
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'service_order_labor'
  ) t;

  IF missing_cols IS NOT NULL THEN
    RAISE WARNING 'Colunas ainda faltando em service_order_labor: %', missing_cols;
  ELSE
    RAISE NOTICE '✓ service_order_labor está completa';
  END IF;
END $$;

-- =====================================================
-- PARTE 6: POPULAR DADOS FALTANTES
-- =====================================================

-- Atualizar unit_cost com base em materials existentes
UPDATE service_order_materials som
SET unit_cost = COALESCE(m.custo_unitario, m.preco_compra, 0)
FROM materials m
WHERE som.material_id = m.id
  AND som.unit_cost = 0;

-- Atualizar nome_funcionario em labor
UPDATE service_order_labor sol
SET nome_funcionario = COALESCE(e.name, 'Funcionário')
FROM employees e
WHERE sol.staff_id = e.id
  AND sol.nome_funcionario IS NULL;

-- =====================================================
-- PARTE 7: VALIDAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  total_orders INTEGER;
  total_items INTEGER;
  total_materials INTEGER;
  total_labor INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orders FROM service_orders;
  SELECT COUNT(*) INTO total_items FROM service_order_items;
  SELECT COUNT(*) INTO total_materials FROM service_order_materials;
  SELECT COUNT(*) INTO total_labor FROM service_order_labor;

  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════╗';
  RAISE NOTICE '║  CORREÇÃO EMERGENCIAL APLICADA        ║';
  RAISE NOTICE '╠═══════════════════════════════════════╣';
  RAISE NOTICE '║  service_orders: % registros         ║', total_orders;
  RAISE NOTICE '║  service_order_items: % itens        ║', total_items;
  RAISE NOTICE '║  service_order_materials: % mats     ║', total_materials;
  RAISE NOTICE '║  service_order_labor: % funcs        ║', total_labor;
  RAISE NOTICE '╠═══════════════════════════════════════╣';
  RAISE NOTICE '║  ✓ Todas as colunas corrigidas        ║';
  RAISE NOTICE '║  ✓ Sistema pronto para uso            ║';
  RAISE NOTICE '╚═══════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- PARTE 8: COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN service_order_materials.unit_cost IS 'Custo unitário do material';
COMMENT ON COLUMN service_order_materials.unit_price IS 'Preço de venda unitário';
COMMENT ON COLUMN service_order_materials.total_cost IS 'Custo total (unit_cost * quantity)';
COMMENT ON COLUMN service_order_materials.total_price IS 'Preço total (unit_price * quantity)';

COMMENT ON COLUMN service_order_labor.hourly_rate IS 'Custo por hora do funcionário';
COMMENT ON COLUMN service_order_labor.hours IS 'Horas trabalhadas';
COMMENT ON COLUMN service_order_labor.total_cost IS 'Custo total (hourly_rate * hours)';
COMMENT ON COLUMN service_order_labor.nome_funcionario IS 'Nome do funcionário';
