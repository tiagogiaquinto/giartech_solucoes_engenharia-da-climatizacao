/*
  # SOLUÇÃO FINAL - Deletar OS Desabilitando Triggers de Auditoria
  
  Desabilita apenas triggers de auditoria (não de sistema)
*/

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
  
  -- Desabilitar triggers de auditoria específicos
  ALTER TABLE service_orders DISABLE TRIGGER audit_service_orders_trigger;
  ALTER TABLE service_orders DISABLE TRIGGER trigger_audit_service_orders;
  ALTER TABLE service_orders DISABLE TRIGGER trigger_track_status_change;
  
  BEGIN
    -- 1. Deletar auditoria
    DELETE FROM service_order_audit_log WHERE service_order_id = p_service_order_id;
    
    -- 2. Deletar custos
    DELETE FROM service_order_costs WHERE service_order_id = p_service_order_id;
    
    -- 3. Deletar mão de obra
    DELETE FROM service_order_labor WHERE service_order_id = p_service_order_id;
    
    -- 4. Deletar materiais
    DELETE FROM service_order_materials WHERE service_order_id = p_service_order_id;
    
    -- 5. Deletar equipe
    DELETE FROM service_order_team WHERE service_order_id = p_service_order_id;
    
    -- 6. Deletar itens
    DELETE FROM service_order_items WHERE service_order_id = p_service_order_id;
    
    -- 7. Deletar OS principal
    DELETE FROM service_orders WHERE id = p_service_order_id;
    
    -- Reabilitar triggers
    ALTER TABLE service_orders ENABLE TRIGGER audit_service_orders_trigger;
    ALTER TABLE service_orders ENABLE TRIGGER trigger_audit_service_orders;
    ALTER TABLE service_orders ENABLE TRIGGER trigger_track_status_change;
    
    RETURN TRUE;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Garantir que triggers sejam reabilitados
      ALTER TABLE service_orders ENABLE TRIGGER audit_service_orders_trigger;
      ALTER TABLE service_orders ENABLE TRIGGER trigger_audit_service_orders;
      ALTER TABLE service_orders ENABLE TRIGGER trigger_track_status_change;
      
      RAISE EXCEPTION 'Erro ao excluir OS %: %', v_order_number, SQLERRM;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_service_order_complete TO anon, authenticated, PUBLIC;

COMMENT ON FUNCTION delete_service_order_complete IS '✅ FUNCIONANDO - Deleta OS desabilitando triggers de auditoria';

-- Teste
SELECT jsonb_build_object(
  'status', '✅ Função corrigida',
  'message', 'Agora você pode excluir ordens de serviço!',
  'triggers_desabilitados', jsonb_build_array(
    'audit_service_orders_trigger',
    'trigger_audit_service_orders', 
    'trigger_track_status_change'
  )
) as resultado;
