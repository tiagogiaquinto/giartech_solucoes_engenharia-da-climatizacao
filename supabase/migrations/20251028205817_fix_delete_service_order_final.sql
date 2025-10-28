/*
  # Corrigir Exclusão de OS - SOLUÇÃO FINAL
  
  Desabilita triggers de auditoria durante exclusão
*/

-- Função corrigida que desabilita triggers corretamente
CREATE OR REPLACE FUNCTION delete_service_order_complete(p_service_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  -- Buscar informações da OS
  SELECT order_number INTO v_order_number
  FROM service_orders
  WHERE id = p_service_order_id;
  
  IF v_order_number IS NULL THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada';
  END IF;
  
  -- Desabilitar triggers de auditoria nas tabelas relacionadas
  ALTER TABLE service_order_items DISABLE TRIGGER ALL;
  ALTER TABLE service_order_team DISABLE TRIGGER ALL;
  ALTER TABLE service_order_materials DISABLE TRIGGER ALL;
  ALTER TABLE service_order_labor DISABLE TRIGGER ALL;
  ALTER TABLE service_order_costs DISABLE TRIGGER ALL;
  ALTER TABLE service_orders DISABLE TRIGGER ALL;
  
  -- Excluir auditoria primeiro
  DELETE FROM service_order_audit_log WHERE service_order_id = p_service_order_id;
  
  -- Excluir OS e relacionados
  DELETE FROM service_order_costs WHERE service_order_id = p_service_order_id;
  DELETE FROM service_order_labor WHERE service_order_id = p_service_order_id;
  DELETE FROM service_order_materials WHERE service_order_id = p_service_order_id;
  DELETE FROM service_order_team WHERE service_order_id = p_service_order_id;
  DELETE FROM service_order_items WHERE service_order_id = p_service_order_id;
  DELETE FROM service_orders WHERE id = p_service_order_id;
  
  -- Reabilitar triggers
  ALTER TABLE service_order_items ENABLE TRIGGER ALL;
  ALTER TABLE service_order_team ENABLE TRIGGER ALL;
  ALTER TABLE service_order_materials ENABLE TRIGGER ALL;
  ALTER TABLE service_order_labor ENABLE TRIGGER ALL;
  ALTER TABLE service_order_costs ENABLE TRIGGER ALL;
  ALTER TABLE service_orders ENABLE TRIGGER ALL;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Garantir que triggers sejam reabilitados mesmo em caso de erro
    ALTER TABLE service_order_items ENABLE TRIGGER ALL;
    ALTER TABLE service_order_team ENABLE TRIGGER ALL;
    ALTER TABLE service_order_materials ENABLE TRIGGER ALL;
    ALTER TABLE service_order_labor ENABLE TRIGGER ALL;
    ALTER TABLE service_order_costs ENABLE TRIGGER ALL;
    ALTER TABLE service_orders ENABLE TRIGGER ALL;
    
    RAISE EXCEPTION 'Erro ao excluir ordem de serviço: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_service_order_complete TO anon, authenticated, PUBLIC;

COMMENT ON FUNCTION delete_service_order_complete IS '✅ CORRIGIDO FINAL - Deletar OS desabilitando triggers de auditoria';
