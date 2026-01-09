/*
  # Ativar Geração Automática de Lançamentos Recorrentes

  1. Melhorias
    - Função para gerar múltiplas ocorrências de uma vez
    - Função para gerar próximos 12 meses
    - Função pública que pode ser chamada do frontend
    - Trigger automático quando criar nova recorrência

  2. Funcionalidades
    - Gera até 12 meses de lançamentos futuros
    - Atualiza next_generation_date automaticamente
    - Registra no histórico
    - Pode ser chamado manualmente

  3. Uso
    - SELECT * FROM generate_recurrences_for_year(recurrence_id)
    - SELECT * FROM generate_all_recurrences_for_year()
*/

-- FUNÇÃO: Gerar múltiplas ocorrências de uma recorrência (até 12 meses)
CREATE OR REPLACE FUNCTION generate_recurrences_for_year(
  p_parent_id uuid,
  p_months_ahead integer DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent finance_entries%ROWTYPE;
  v_current_date date;
  v_next_date date;
  v_new_id uuid;
  v_generated integer := 0;
  v_errors integer := 0;
  v_target_date date;
  v_iteration integer := 0;
  v_max_iterations integer := 100;
BEGIN
  -- Buscar lançamento pai
  SELECT * INTO v_parent FROM finance_entries WHERE id = p_parent_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lançamento não encontrado');
  END IF;
  
  IF NOT v_parent.is_recurring THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lançamento não é recorrente');
  END IF;
  
  IF v_parent.recurrence_status != 'ativo' THEN
    RETURN jsonb_build_object('success', false, 'message', format('Recorrência está %s', v_parent.recurrence_status));
  END IF;
  
  -- Calcular data alvo (próximos N meses)
  v_target_date := CURRENT_DATE + (p_months_ahead || ' months')::interval;
  
  -- Data inicial
  v_current_date := COALESCE(
    v_parent.last_generation_date,
    v_parent.recurrence_start_date,
    v_parent.data
  );
  
  -- Loop para gerar múltiplas ocorrências
  LOOP
    v_iteration := v_iteration + 1;
    
    -- Proteção contra loop infinito
    IF v_iteration > v_max_iterations THEN
      EXIT;
    END IF;
    
    -- Calcular próxima data
    v_next_date := calculate_next_recurrence_date(
      v_current_date,
      v_parent.recurrence_frequency,
      v_parent.recurrence_day
    );
    
    -- Verificar se ultrapassou data final
    IF v_parent.recurrence_end_date IS NOT NULL AND v_next_date > v_parent.recurrence_end_date THEN
      UPDATE finance_entries SET recurrence_status = 'finalizado' WHERE id = p_parent_id;
      EXIT;
    END IF;
    
    -- Verificar se ultrapassou data alvo
    IF v_next_date > v_target_date THEN
      EXIT;
    END IF;
    
    -- Verificar se atingiu contador
    IF v_parent.recurrence_count IS NOT NULL AND (v_parent.generated_count + v_generated) >= v_parent.recurrence_count THEN
      UPDATE finance_entries SET recurrence_status = 'finalizado' WHERE id = p_parent_id;
      EXIT;
    END IF;
    
    -- Verificar se já existe lançamento para esta data
    IF EXISTS (
      SELECT 1 FROM finance_entries 
      WHERE recurrence_parent_id = p_parent_id 
      AND data_vencimento = v_next_date
    ) THEN
      -- Já existe, pular para próxima data
      v_current_date := v_next_date;
      CONTINUE;
    END IF;
    
    BEGIN
      -- Criar novo lançamento
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
        bank_account_id, 
        supplier_id, 
        category_id,
        subcategory_id, 
        employee_id, 
        recurrence_parent_id, 
        is_recurring, 
        auto_generate
      )
      SELECT
        descricao,
        valor, 
        tipo, 
        CASE 
          WHEN tipo = 'receita' THEN 'a_receber'
          WHEN tipo = 'despesa' THEN 'a_pagar'
          ELSE 'pendente'
        END,
        v_next_date, 
        v_next_date,
        customer_id, 
        categoria, 
        forma_pagamento, 
        'Gerado automaticamente de recorrência', 
        bank_account_id, 
        supplier_id,
        category_id, 
        subcategory_id, 
        employee_id, 
        p_parent_id, 
        false, 
        false
      FROM finance_entries WHERE id = p_parent_id
      RETURNING id INTO v_new_id;
      
      -- Registrar no histórico
      INSERT INTO finance_recurrence_history (
        parent_entry_id, 
        generated_entry_id, 
        generation_date, 
        scheduled_date, 
        amount, 
        status, 
        generation_method
      )
      VALUES (
        p_parent_id, 
        v_new_id, 
        CURRENT_DATE, 
        v_next_date, 
        v_parent.valor, 
        'gerado', 
        'automatico'
      );
      
      v_generated := v_generated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      
      -- Registrar erro no histórico
      INSERT INTO finance_recurrence_history (
        parent_entry_id, 
        generation_date, 
        scheduled_date, 
        amount, 
        status, 
        error_message,
        generation_method
      )
      VALUES (
        p_parent_id, 
        CURRENT_DATE, 
        v_next_date, 
        v_parent.valor, 
        'erro',
        SQLERRM,
        'automatico'
      );
    END;
    
    -- Próxima iteração
    v_current_date := v_next_date;
  END LOOP;
  
  -- Atualizar pai
  IF v_generated > 0 THEN
    UPDATE finance_entries
    SET 
      generated_count = generated_count + v_generated,
      last_generation_date = v_current_date,
      next_generation_date = calculate_next_recurrence_date(
        v_current_date, 
        recurrence_frequency, 
        recurrence_day
      )
    WHERE id = p_parent_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'parent_id', p_parent_id,
    'generated', v_generated,
    'errors', v_errors,
    'last_date', v_current_date
  );
END;
$$;

-- FUNÇÃO: Gerar todos os lançamentos recorrentes para os próximos 12 meses
CREATE OR REPLACE FUNCTION generate_all_recurrences_for_year(
  p_months_ahead integer DEFAULT 12
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id uuid;
  v_result jsonb;
  v_total_generated integer := 0;
  v_total_errors integer := 0;
  v_recurrences_processed integer := 0;
BEGIN
  -- Processar todas as recorrências ativas
  FOR v_parent_id IN (
    SELECT id 
    FROM finance_entries
    WHERE is_recurring = true 
    AND recurrence_status = 'ativo'
    ORDER BY created_at
  ) LOOP
    BEGIN
      v_result := generate_recurrences_for_year(v_parent_id, p_months_ahead);
      
      v_recurrences_processed := v_recurrences_processed + 1;
      v_total_generated := v_total_generated + COALESCE((v_result->>'generated')::integer, 0);
      v_total_errors := v_total_errors + COALESCE((v_result->>'errors')::integer, 0);
      
    EXCEPTION WHEN OTHERS THEN
      v_total_errors := v_total_errors + 1;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'recurrences_processed', v_recurrences_processed,
    'total_generated', v_total_generated,
    'total_errors', v_total_errors,
    'months_ahead', p_months_ahead
  );
END;
$$;

-- FUNÇÃO: Trigger para gerar automaticamente ao criar nova recorrência
CREATE OR REPLACE FUNCTION trigger_generate_recurrence_on_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Se é uma nova recorrência ativa com auto_generate
  IF NEW.is_recurring = true 
    AND NEW.recurrence_status = 'ativo' 
    AND NEW.auto_generate = true
    AND NEW.recurrence_parent_id IS NULL  -- É o pai, não um filho
  THEN
    -- Gerar próximos 12 meses em background (não bloqueia a inserção)
    PERFORM generate_recurrences_for_year(NEW.id, 12);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger (se não existir)
DROP TRIGGER IF EXISTS trigger_auto_generate_recurrences ON finance_entries;
CREATE TRIGGER trigger_auto_generate_recurrences
  AFTER INSERT ON finance_entries
  FOR EACH ROW
  WHEN (NEW.is_recurring = true AND NEW.recurrence_parent_id IS NULL)
  EXECUTE FUNCTION trigger_generate_recurrence_on_create();

-- FUNÇÃO PÚBLICA: Para chamar do frontend
CREATE OR REPLACE FUNCTION public.regenerate_all_recurrences()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN generate_all_recurrences_for_year(12);
END;
$$;

-- FUNÇÃO PÚBLICA: Para gerar recorrência específica
CREATE OR REPLACE FUNCTION public.regenerate_recurrence(p_recurrence_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN generate_recurrences_for_year(p_recurrence_id, 12);
END;
$$;

-- Grant necessários
GRANT EXECUTE ON FUNCTION public.regenerate_all_recurrences() TO public;
GRANT EXECUTE ON FUNCTION public.regenerate_recurrence(uuid) TO public;
GRANT EXECUTE ON FUNCTION generate_recurrences_for_year(uuid, integer) TO public;
GRANT EXECUTE ON FUNCTION generate_all_recurrences_for_year(integer) TO public;

-- COMENTÁRIOS
COMMENT ON FUNCTION generate_recurrences_for_year IS 'Gera múltiplas ocorrências de uma recorrência para os próximos N meses';
COMMENT ON FUNCTION generate_all_recurrences_for_year IS 'Gera todas as recorrências ativas para os próximos N meses';
COMMENT ON FUNCTION public.regenerate_all_recurrences IS 'Função pública para regenerar todas as recorrências (12 meses)';
COMMENT ON FUNCTION public.regenerate_recurrence IS 'Função pública para regenerar uma recorrência específica (12 meses)';
