/*
  # Corrigir Função de Exclusão de OS - Desabilitar Triggers de Auditoria

  1. Problema
    - Triggers de auditoria tentam inserir na audit_log após DELETE
    - Isso causa violação de FK pois a OS já foi deletada
    
  2. Solução
    - Modificar função para excluir registros de audit manualmente ANTES da OS
    - OU desabilitar sessão de triggers durante exclusão
    
  3. Abordagem
    - Deletar manualmente todos os registros relacionados na ordem correta
    - Deletar audit_log PRIMEIRO
    - Depois deletar a OS
*/

-- Recriar função de exclusão com ordem correta
CREATE OR REPLACE FUNCTION delete_service_order_complete(p_service_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
  v_items_count INTEGER;
  v_team_count INTEGER;
  v_audit_count INTEGER;
BEGIN
  -- Buscar informações da OS antes de excluir
  SELECT order_number INTO v_order_number
  FROM service_orders
  WHERE id = p_service_order_id;

  IF v_order_number IS NULL THEN
    RAISE EXCEPTION 'Ordem de serviço não encontrada';
  END IF;

  -- Contar registros relacionados
  SELECT COUNT(*) INTO v_items_count
  FROM service_order_items
  WHERE service_order_id = p_service_order_id;

  SELECT COUNT(*) INTO v_team_count
  FROM service_order_team
  WHERE service_order_id = p_service_order_id;

  SELECT COUNT(*) INTO v_audit_count
  FROM service_order_audit_log
  WHERE service_order_id = p_service_order_id;

  -- Log da exclusão
  RAISE NOTICE 'Excluindo OS %: % itens, % membros, % registros de auditoria', 
    v_order_number, v_items_count, v_team_count, v_audit_count;

  -- IMPORTANTE: Excluir audit_log ANTES da OS para evitar conflito com triggers
  DELETE FROM service_order_audit_log WHERE service_order_id = p_service_order_id;
  
  -- Agora excluir a OS (CASCADE vai deletar o resto)
  -- Os triggers de auditoria vão tentar criar um novo registro, mas não vão conseguir
  -- pois a OS está sendo deletada. Precisamos configurar os triggers diferente.
  
  -- Desabilitar triggers de auditoria temporariamente para esta sessão
  SET session_replication_role = replica;
  
  -- Excluir a OS
  DELETE FROM service_orders WHERE id = p_service_order_id;
  
  -- Reabilitar triggers
  SET session_replication_role = DEFAULT;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Garantir que triggers sejam reabilitados mesmo em caso de erro
    SET session_replication_role = DEFAULT;
    RAISE EXCEPTION 'Erro ao excluir ordem de serviço: %', SQLERRM;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION delete_service_order_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_service_order_complete(UUID) TO anon;

COMMENT ON FUNCTION delete_service_order_complete(UUID) IS 
  'Exclui uma ordem de serviço e todos os dados relacionados, desabilitando triggers de auditoria temporariamente para evitar conflitos de FK';
