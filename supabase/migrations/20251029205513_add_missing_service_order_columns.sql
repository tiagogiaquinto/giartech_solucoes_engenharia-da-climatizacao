/*
  # Adicionar Colunas Faltantes em Tabelas de Service Orders

  ## Problema
  - Faltam colunas necessárias para criação/edição de OS
  
  ## Solução
  - Adicionar colunas faltantes em service_order_items
  - Adicionar colunas faltantes em service_order_materials
  - Adicionar colunas faltantes em service_order_labor
*/

-- =====================================================
-- SERVICE_ORDER_ITEMS
-- =====================================================

ALTER TABLE service_order_items 
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT 60;

ALTER TABLE service_order_items 
ADD COLUMN IF NOT EXISTS complexity_level TEXT DEFAULT 'medium';

ALTER TABLE service_order_items 
ADD COLUMN IF NOT EXISTS actual_time_minutes INTEGER;

-- =====================================================
-- SERVICE_ORDER_MATERIALS
-- =====================================================

ALTER TABLE service_order_materials 
ADD COLUMN IF NOT EXISTS material_name TEXT;

ALTER TABLE service_order_materials 
ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- =====================================================
-- SERVICE_ORDER_LABOR
-- =====================================================

ALTER TABLE service_order_labor 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

ALTER TABLE service_order_labor 
ADD COLUMN IF NOT EXISTS role TEXT;

-- =====================================================
-- SERVICE_ORDERS (campos adicionais)
-- =====================================================

ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS estimated_completion_time INTEGER;

ALTER TABLE service_orders 
ADD COLUMN IF NOT EXISTS actual_completion_time INTEGER;

-- Comentários
COMMENT ON COLUMN service_order_items.estimated_time_minutes IS 'Tempo estimado em minutos';
COMMENT ON COLUMN service_order_items.actual_time_minutes IS 'Tempo real gasto em minutos';
COMMENT ON COLUMN service_orders.estimated_completion_time IS 'Tempo total estimado em minutos';
COMMENT ON COLUMN service_orders.actual_completion_time IS 'Tempo total real em minutos';
