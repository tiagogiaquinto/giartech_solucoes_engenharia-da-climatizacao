/*
  # Corrigir Função calculate_service_order_totals

  1. Remove função antiga com erro
  2. Recria função correta que atualiza totais da service order
  3. Garante referência correta à tabela service_orders

  Correção:
  - Tabela service_orders existe e é válida
  - Função deve usar NEW.service_order_id corretamente
*/

-- Remover trigger e função antiga
DROP TRIGGER IF EXISTS trigger_calculate_service_order_totals ON service_order_items;
DROP FUNCTION IF EXISTS calculate_service_order_totals() CASCADE;

-- Recriar função correta
CREATE OR REPLACE FUNCTION calculate_service_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar totais na service_order correspondente
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    total_estimated_duration = (
      SELECT COALESCE(SUM(estimated_duration * quantity), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    updated_at = now()
  WHERE id = NEW.service_order_id;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trigger_calculate_service_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();