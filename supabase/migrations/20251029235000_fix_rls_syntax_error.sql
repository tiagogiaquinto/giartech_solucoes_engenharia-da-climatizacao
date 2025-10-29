/*
  # CORREÇÃO: Erro de Sintaxe RLS

  ## ERRO
  LINHA 142: ALTER TABLE service_catalog DISABLE ROW NÍVEL DE SEGURANÇA;

  ## CORREÇÃO
  Sintaxe correta para desabilitar RLS
*/

-- =====================================================
-- DESABILITAR RLS (SINTAXE CORRETA)
-- =====================================================

ALTER TABLE service_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_labor DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONCEDER PERMISSÕES TOTAIS AO ANON
-- =====================================================

GRANT ALL ON service_orders TO anon, authenticated;
GRANT ALL ON service_order_items TO anon, authenticated;
GRANT ALL ON service_order_materials TO anon, authenticated;
GRANT ALL ON service_order_labor TO anon, authenticated;
GRANT ALL ON service_order_costs TO anon, authenticated;
GRANT ALL ON service_catalog TO anon, authenticated;
GRANT ALL ON customers TO anon, authenticated;
GRANT ALL ON employees TO anon, authenticated;
GRANT ALL ON materials TO anon, authenticated;
GRANT ALL ON inventory_items TO anon, authenticated;
GRANT ALL ON bank_accounts TO anon, authenticated;
GRANT ALL ON finance_entries TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- ADICIONAR COLUNAS FALTANTES
-- =====================================================

-- service_catalog
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS escopo_servico TEXT;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS escopo_detalhado TEXT;
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS scope TEXT;

-- service_order_items
ALTER TABLE service_order_items ADD COLUMN IF NOT EXISTS escopo_detalhado TEXT;
ALTER TABLE service_order_items ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- service_order_materials
ALTER TABLE service_order_materials ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_order_materials ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_order_materials ADD COLUMN IF NOT EXISTS material_unit TEXT DEFAULT 'un';

-- service_order_labor
ALTER TABLE service_order_labor ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;
ALTER TABLE service_order_labor ADD COLUMN IF NOT EXISTS nome_funcionario TEXT;

-- =====================================================
-- RELATÓRIO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  CORREÇÃO APLICADA COM SUCESSO         ║';
  RAISE NOTICE '╠════════════════════════════════════════╣';
  RAISE NOTICE '║  ✓ RLS desabilitado                    ║';
  RAISE NOTICE '║  ✓ Permissões concedidas               ║';
  RAISE NOTICE '║  ✓ Colunas adicionadas                 ║';
  RAISE NOTICE '╠════════════════════════════════════════╣';
  RAISE NOTICE '║  AGORA VOLTE AO SISTEMA E TESTE!       ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
