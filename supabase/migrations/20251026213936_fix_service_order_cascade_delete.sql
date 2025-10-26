/*
  # Corrigir Exclusão em Cascata de Ordens de Serviço

  1. Problema
    - Ao excluir uma OS, há erro de constraint de chave estrangeira
    - Tabelas relacionadas impedem a exclusão
    
  2. Solução
    - Adicionar ON DELETE CASCADE em todas as tabelas relacionadas
    - Criar função auxiliar para exclusão completa
    
  3. Tabelas Afetadas
    - service_order_items
    - service_order_team  
    - service_order_materials
    - service_order_labor
    - service_order_costs
    - service_order_audit_log
    - service_order_status_timeline
    - service_order_checklists
    - agenda_events (quando vinculado)
*/

-- Remover constraints antigas e adicionar com CASCADE

-- service_order_items
ALTER TABLE service_order_items 
  DROP CONSTRAINT IF EXISTS service_order_items_service_order_id_fkey;

ALTER TABLE service_order_items
  ADD CONSTRAINT service_order_items_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE CASCADE;

-- service_order_team
ALTER TABLE service_order_team 
  DROP CONSTRAINT IF EXISTS service_order_team_service_order_id_fkey;

ALTER TABLE service_order_team
  ADD CONSTRAINT service_order_team_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE CASCADE;

-- service_order_materials
ALTER TABLE service_order_materials 
  DROP CONSTRAINT IF EXISTS service_order_materials_service_order_id_fkey;

ALTER TABLE service_order_materials
  ADD CONSTRAINT service_order_materials_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE CASCADE;

-- service_order_labor
ALTER TABLE service_order_labor 
  DROP CONSTRAINT IF EXISTS service_order_labor_service_order_id_fkey;

ALTER TABLE service_order_labor
  ADD CONSTRAINT service_order_labor_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE CASCADE;

-- service_order_costs
ALTER TABLE service_order_costs 
  DROP CONSTRAINT IF EXISTS service_order_costs_service_order_id_fkey;

ALTER TABLE service_order_costs
  ADD CONSTRAINT service_order_costs_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE CASCADE;

-- service_order_audit_log (PRINCIPAL CAUSA DO ERRO)
ALTER TABLE service_order_audit_log 
  DROP CONSTRAINT IF EXISTS service_order_audit_log_service_order_id_fkey;

ALTER TABLE service_order_audit_log
  ADD CONSTRAINT service_order_audit_log_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE CASCADE;

-- service_order_status_timeline
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'service_order_status_timeline'
  ) THEN
    ALTER TABLE service_order_status_timeline 
      DROP CONSTRAINT IF EXISTS service_order_status_timeline_service_order_id_fkey;
    
    ALTER TABLE service_order_status_timeline
      ADD CONSTRAINT service_order_status_timeline_service_order_id_fkey 
      FOREIGN KEY (service_order_id) 
      REFERENCES service_orders(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- service_order_checklists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'service_order_checklists'
  ) THEN
    ALTER TABLE service_order_checklists 
      DROP CONSTRAINT IF EXISTS service_order_checklists_service_order_id_fkey;
    
    ALTER TABLE service_order_checklists
      ADD CONSTRAINT service_order_checklists_service_order_id_fkey 
      FOREIGN KEY (service_order_id) 
      REFERENCES service_orders(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- agenda_events (SET NULL pois pode existir sem OS)
ALTER TABLE agenda_events 
  DROP CONSTRAINT IF EXISTS agenda_events_service_order_id_fkey;

ALTER TABLE agenda_events
  ADD CONSTRAINT agenda_events_service_order_id_fkey 
  FOREIGN KEY (service_order_id) 
  REFERENCES service_orders(id) 
  ON DELETE SET NULL;

-- Criar função auxiliar para exclusão com log
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

  -- Log da exclusão
  RAISE NOTICE 'Excluindo OS %: % itens, % membros da equipe', 
    v_order_number, v_items_count, v_team_count;

  -- Excluir a OS (CASCADE vai deletar tudo automaticamente)
  DELETE FROM service_orders WHERE id = p_service_order_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao excluir ordem de serviço: %', SQLERRM;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION delete_service_order_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_service_order_complete(UUID) TO anon;

COMMENT ON FUNCTION delete_service_order_complete(UUID) IS 
  'Exclui uma ordem de serviço e todos os dados relacionados automaticamente via CASCADE';
