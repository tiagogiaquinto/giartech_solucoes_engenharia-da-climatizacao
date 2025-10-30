/*
  # Sistema Completo de Sincronização OS → Agenda → Financeiro

  1. Sincronização Automática
    - OS Criada → Evento na Agenda
    - OS Atualizada → Atualiza Evento
    - OS Concluída → Lançamento Financeiro
    - Cliente Alterado → Atualiza Agenda

  2. Efeito Cascata
    - Mudança de status propaga para todos os sistemas
    - Atualização de valores sincroniza financeiro
    - Alteração de datas atualiza agenda

  3. Regras de Negócio
    - Evento criado automaticamente ao criar OS
    - Status da agenda reflete status da OS
    - Financeiro criado apenas quando OS concluída
    - Cancelamento propaga para todos os sistemas
*/

-- ==================================
-- 1. FUNÇÃO: Sincronizar OS → Agenda
-- ==================================
CREATE OR REPLACE FUNCTION sync_service_order_to_agenda()
RETURNS TRIGGER AS $$
DECLARE
  v_event_id uuid;
  v_event_status text;
  v_event_title text;
  v_customer_name text;
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_description text;
BEGIN
  -- Buscar nome do cliente
  SELECT COALESCE(nome_fantasia, nome_razao) INTO v_customer_name
  FROM customers
  WHERE id = NEW.customer_id;

  -- Definir título do evento
  v_event_title := 'OS ' || COALESCE(NEW.order_number, SUBSTRING(NEW.id::text, 1, 8)) || 
                   CASE WHEN v_customer_name IS NOT NULL 
                        THEN ' - ' || v_customer_name 
                        ELSE '' 
                   END;

  -- Definir descrição
  v_description := COALESCE(NEW.escopo_detalhado, NEW.description, NEW.title, 'Ordem de Serviço');

  -- Mapear status da OS para status do evento
  v_event_status := CASE 
    WHEN NEW.status IN ('pendente', 'pending', 'aberta', 'open') THEN 'scheduled'
    WHEN NEW.status IN ('em_andamento', 'in_progress') THEN 'in_progress'
    WHEN NEW.status IN ('concluido', 'completed', 'finalizada', 'finished') THEN 'completed'
    WHEN NEW.status IN ('cancelada', 'cancelado', 'cancelled') THEN 'cancelled'
    WHEN NEW.status IN ('pausado', 'paused') THEN 'scheduled'
    ELSE 'scheduled'
  END;

  -- Definir datas do evento
  v_start_date := COALESCE(NEW.scheduled_at, NEW.created_at);
  v_end_date := COALESCE(NEW.sla_deadline, NEW.due_date::timestamptz, v_start_date + interval '2 hours');

  -- Verificar se já existe evento para esta OS
  SELECT id INTO v_event_id
  FROM agenda_events
  WHERE service_order_id = NEW.id;

  IF v_event_id IS NOT NULL THEN
    -- Atualizar evento existente
    UPDATE agenda_events
    SET 
      title = v_event_title,
      description = v_description,
      start_date = v_start_date,
      end_date = v_end_date,
      status = v_event_status,
      customer_id = NEW.customer_id,
      location = NEW.client_address,
      notes = NEW.notes,
      priority = NEW.priority,
      updated_at = now()
    WHERE id = v_event_id;
  ELSE
    -- Criar novo evento
    INSERT INTO agenda_events (
      title,
      description,
      start_date,
      end_date,
      event_type,
      customer_id,
      service_order_id,
      location,
      status,
      priority,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_event_title,
      v_description,
      v_start_date,
      v_end_date,
      'service_order',
      NEW.customer_id,
      NEW.id,
      NEW.client_address,
      v_event_status,
      NEW.priority,
      NEW.notes,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================
-- 2. FUNÇÃO: Sincronizar OS → Financeiro
-- ==================================
CREATE OR REPLACE FUNCTION sync_service_order_to_finance()
RETURNS TRIGGER AS $$
DECLARE
  v_finance_id uuid;
  v_description text;
  v_short_desc text;
BEGIN
  -- Só processar se houver valor total
  IF NEW.total_amount > 0 THEN
    
    -- Preparar descrição
    v_short_desc := COALESCE(NEW.title, NEW.description, NEW.escopo_detalhado, 'Serviço');
    v_description := 'OS ' || COALESCE(NEW.order_number, SUBSTRING(NEW.id::text, 1, 8)) || 
                     ' - ' || LEFT(v_short_desc, 80);

    -- Se OS concluída, criar/atualizar lançamento
    IF NEW.status IN ('concluido', 'completed', 'finalizada', 'finished') THEN
      
      -- Verificar se já existe lançamento
      SELECT id INTO v_finance_id
      FROM finance_entries
      WHERE descricao LIKE 'OS ' || COALESCE(NEW.order_number, SUBSTRING(NEW.id::text, 1, 8)) || '%'
      LIMIT 1;

      IF v_finance_id IS NOT NULL THEN
        -- Atualizar existente
        UPDATE finance_entries
        SET 
          valor = NEW.total_amount,
          status = 'a_receber',
          data_vencimento = COALESCE(NEW.due_date, NEW.service_date, current_date + interval '7 days'),
          customer_id = NEW.customer_id,
          forma_pagamento = COALESCE(NEW.payment_method, 'a_definir'),
          observacoes = 'Atualizado automaticamente em ' || to_char(now(), 'DD/MM/YYYY HH24:MI'),
          updated_at = now()
        WHERE id = v_finance_id;
      ELSE
        -- Criar novo
        INSERT INTO finance_entries (
          descricao,
          valor,
          tipo,
          status,
          data,
          data_vencimento,
          customer_id,
          categoria,
          forma_pagamento,
          observacoes,
          created_at,
          updated_at
        ) VALUES (
          v_description,
          NEW.total_amount,
          'receita',
          'a_receber',
          current_date,
          COALESCE(NEW.due_date, NEW.service_date, current_date + interval '7 days'),
          NEW.customer_id,
          'Serviços',
          COALESCE(NEW.payment_method, 'a_definir'),
          'Gerado automaticamente em ' || to_char(now(), 'DD/MM/YYYY HH24:MI'),
          now(),
          now()
        );
      END IF;
      
    -- Se OS cancelada, cancelar lançamento
    ELSIF NEW.status IN ('cancelada', 'cancelado', 'cancelled') THEN
      UPDATE finance_entries
      SET 
        status = 'cancelado',
        observacoes = COALESCE(observacoes, '') || ' | OS cancelada em ' || to_char(now(), 'DD/MM/YYYY HH24:MI'),
        updated_at = now()
      WHERE descricao LIKE 'OS ' || COALESCE(NEW.order_number, SUBSTRING(NEW.id::text, 1, 8)) || '%';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================
-- 3. FUNÇÃO: Atualizar Agenda ao Mudar Cliente
-- ==================================
CREATE OR REPLACE FUNCTION update_agenda_on_customer_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agenda_events ae
  SET 
    title = CASE 
      WHEN ae.service_order_id IS NOT NULL THEN
        'OS ' || (SELECT COALESCE(order_number, SUBSTRING(id::text, 1, 8)) FROM service_orders WHERE id = ae.service_order_id) || 
        ' - ' || COALESCE(NEW.nome_fantasia, NEW.nome_razao)
      ELSE 
        ae.title
    END,
    updated_at = now()
  WHERE ae.customer_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================
-- 4. CRIAR TRIGGERS
-- ==================================

DROP TRIGGER IF EXISTS trigger_sync_service_order_create ON service_orders;
CREATE TRIGGER trigger_sync_service_order_create
  AFTER INSERT ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_service_order_to_agenda();

DROP TRIGGER IF EXISTS trigger_sync_service_order_update ON service_orders;
CREATE TRIGGER trigger_sync_service_order_update
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at OR
    OLD.due_date IS DISTINCT FROM NEW.due_date OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
    OLD.customer_id IS DISTINCT FROM NEW.customer_id OR
    OLD.priority IS DISTINCT FROM NEW.priority
  )
  EXECUTE FUNCTION sync_service_order_to_agenda();

DROP TRIGGER IF EXISTS trigger_sync_finance_on_os_update ON service_orders;
CREATE TRIGGER trigger_sync_finance_on_os_update
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount
  )
  EXECUTE FUNCTION sync_service_order_to_finance();

DROP TRIGGER IF EXISTS trigger_update_agenda_on_customer_change ON customers;
CREATE TRIGGER trigger_update_agenda_on_customer_change
  AFTER UPDATE ON customers
  FOR EACH ROW
  WHEN (
    OLD.nome_razao IS DISTINCT FROM NEW.nome_razao OR
    OLD.nome_fantasia IS DISTINCT FROM NEW.nome_fantasia
  )
  EXECUTE FUNCTION update_agenda_on_customer_change();

-- ==================================
-- 5. INSERIR AUTOMAÇÕES PADRÃO
-- ==================================

-- Deletar duplicadas se existirem
DELETE FROM automation_rules 
WHERE name IN (
  'Sincronizar OS para Agenda',
  'Sincronizar OS Concluída para Financeiro',
  'Notificar OS Concluída',
  'Atualizar Agenda ao Alterar Cliente',
  'Cancelar Lançamento ao Cancelar OS'
);

-- Inserir automações
INSERT INTO automation_rules (name, description, trigger_type, trigger_conditions, actions, is_active, priority, execution_count)
VALUES 
  (
    'Sincronizar OS para Agenda',
    'Cria ou atualiza automaticamente um evento na agenda quando uma OS é criada ou modificada',
    'service_order_created',
    '{"auto_sync": true, "create_event": true}',
    '[{"type": "sync_agenda", "config": {"create_event": true, "update_on_status_change": true, "sync_dates": true}}]',
    true,
    10,
    0
  ),
  (
    'Sincronizar OS Concluída para Financeiro',
    'Cria automaticamente um lançamento financeiro a receber quando uma OS é concluída',
    'service_order_completed',
    '{"auto_sync": true, "min_amount": 0, "require_completed_status": true}',
    '[{"type": "sync_finance", "config": {"create_entry": true, "entry_type": "receita", "status": "a_receber"}}]',
    true,
    10,
    0
  ),
  (
    'Notificar OS Concluída',
    'Envia notificação quando uma OS é marcada como concluída',
    'service_order_completed',
    '{"notify_on_complete": true}',
    '[{"type": "notification", "config": {"message": "OS concluída com sucesso!", "title": "Ordem de Serviço Finalizada"}}]',
    true,
    5,
    0
  ),
  (
    'Atualizar Agenda ao Alterar Cliente',
    'Atualiza automaticamente todos os eventos da agenda quando o nome do cliente é alterado',
    'customer_created',
    '{"auto_sync": true, "update_on_name_change": true}',
    '[{"type": "sync_agenda", "config": {"update_on_customer_change": true, "update_titles": true}}]',
    true,
    8,
    0
  ),
  (
    'Cancelar Lançamento ao Cancelar OS',
    'Cancela automaticamente o lançamento financeiro quando uma OS é cancelada',
    'service_order_completed',
    '{"cancel_on_os_cancel": true}',
    '[{"type": "sync_finance", "config": {"cancel_entry": true, "status": "cancelado"}}]',
    true,
    9,
    0
  );

-- ==================================
-- 6. DOCUMENTAÇÃO
-- ==================================
COMMENT ON FUNCTION sync_service_order_to_agenda() IS 'Sincroniza OS→Agenda: Cria evento ao criar OS, atualiza ao modificar status/datas/prioridade';
COMMENT ON FUNCTION sync_service_order_to_finance() IS 'Sincroniza OS→Financeiro: Cria lançamento a receber ao concluir OS, cancela ao cancelar OS';
COMMENT ON FUNCTION update_agenda_on_customer_change() IS 'Atualiza títulos dos eventos na agenda quando nome do cliente é alterado';
COMMENT ON TRIGGER trigger_sync_service_order_create ON service_orders IS 'Cria automaticamente evento na agenda ao criar OS';
COMMENT ON TRIGGER trigger_sync_service_order_update ON service_orders IS 'Atualiza evento na agenda ao modificar OS';
COMMENT ON TRIGGER trigger_sync_finance_on_os_update ON service_orders IS 'Sincroniza financeiro ao concluir/cancelar OS';
COMMENT ON TRIGGER trigger_update_agenda_on_customer_change ON customers IS 'Atualiza agenda ao mudar nome do cliente';
