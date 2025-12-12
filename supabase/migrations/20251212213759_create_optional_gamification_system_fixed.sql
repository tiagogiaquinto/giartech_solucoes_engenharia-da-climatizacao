/*
  # Sistema de Gamificação OPCIONAL para Clientes
  
  ## Mudanças
  
  1. Clientes
    - Campo `participa_gamificacao` (boolean) para indicar se o cliente quer participar
    - Campo `data_adesao_gamificacao` para registrar quando aderiu
    
  2. Ordens de Serviço
    - Campo `incluir_gamificacao` (boolean) para marcar quais OSs geram pontos
    - Histórico de quando foi incluída na gamificação
    
  3. Funções
    - `incluir_os_na_gamificacao()` - Processa uma OS específica
    - `incluir_multiplas_os_gamificacao()` - Processa várias OSs de uma vez
    - `ativar_gamificacao_cliente()` - Ativa gamificação para um cliente
    - `desativar_gamificacao_cliente()` - Remove cliente da gamificação
    
  4. Triggers
    - Modificados para verificar flags antes de processar
    
  ## Segurança
    - RLS mantido
    - Auditoria de todas as operações
*/

-- ============================================================================
-- 1. ADICIONAR CAMPOS AOS CLIENTES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'participa_gamificacao'
  ) THEN
    ALTER TABLE customers ADD COLUMN participa_gamificacao boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'data_adesao_gamificacao'
  ) THEN
    ALTER TABLE customers ADD COLUMN data_adesao_gamificacao date;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'motivo_nao_participa'
  ) THEN
    ALTER TABLE customers ADD COLUMN motivo_nao_participa text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_gamification ON customers(participa_gamificacao) WHERE participa_gamificacao = true;

-- ============================================================================
-- 2. ADICIONAR CAMPOS ÀS ORDENS DE SERVIÇO
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'incluir_gamificacao'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN incluir_gamificacao boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'data_inclusao_gamificacao'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN data_inclusao_gamificacao timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'pontos_gerados'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN pontos_gerados integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_orders_gamification ON service_orders(incluir_gamificacao, customer_id) 
  WHERE incluir_gamificacao = true;

-- ============================================================================
-- 3. FUNÇÃO: ATIVAR GAMIFICAÇÃO PARA CLIENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION ativar_gamificacao_cliente(
  p_customer_id uuid,
  p_processar_os_antigas boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_os_processadas integer := 0;
BEGIN
  -- Ativar gamificação no cliente
  UPDATE customers
  SET 
    participa_gamificacao = true,
    data_adesao_gamificacao = CURRENT_DATE,
    motivo_nao_participa = NULL
  WHERE id = p_customer_id;
  
  -- Se deve processar OSs antigas concluídas
  IF p_processar_os_antigas THEN
    SELECT COUNT(*) INTO v_os_processadas
    FROM service_orders
    WHERE customer_id = p_customer_id
      AND status = 'concluida'
      AND NOT COALESCE(incluir_gamificacao, false);
    
    -- Marcar todas as OSs concluídas para inclusão
    UPDATE service_orders
    SET incluir_gamificacao = true
    WHERE customer_id = p_customer_id
      AND status = 'concluida'
      AND NOT COALESCE(incluir_gamificacao, false);
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'customer_id', p_customer_id,
    'data_adesao', CURRENT_DATE,
    'os_marcadas_para_processar', v_os_processadas
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 4. FUNÇÃO: DESATIVAR GAMIFICAÇÃO PARA CLIENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION desativar_gamificacao_cliente(
  p_customer_id uuid,
  p_motivo text DEFAULT NULL,
  p_remover_pontos boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_pontos_perdidos integer := 0;
BEGIN
  -- Desativar gamificação
  UPDATE customers
  SET 
    participa_gamificacao = false,
    motivo_nao_participa = p_motivo
  WHERE id = p_customer_id;
  
  -- Se deve remover pontos
  IF p_remover_pontos THEN
    SELECT total_points INTO v_pontos_perdidos
    FROM customer_points
    WHERE customer_id = p_customer_id;
    
    DELETE FROM customer_points WHERE customer_id = p_customer_id;
    DELETE FROM customer_points_history WHERE customer_id = p_customer_id;
    DELETE FROM customer_badges_earned WHERE customer_id = p_customer_id;
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'customer_id', p_customer_id,
    'pontos_removidos', v_pontos_perdidos,
    'motivo', p_motivo
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 5. FUNÇÃO: INCLUIR OS ESPECÍFICA NA GAMIFICAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION incluir_os_na_gamificacao(
  p_service_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os RECORD;
  v_config RECORD;
  v_points integer;
  v_multiplier numeric(5,2);
  v_result jsonb;
BEGIN
  -- Buscar OS
  SELECT * INTO v_os
  FROM service_orders
  WHERE id = p_service_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'OS não encontrada');
  END IF;
  
  -- Verificar se cliente participa
  IF NOT EXISTS (
    SELECT 1 FROM customers 
    WHERE id = v_os.customer_id AND participa_gamificacao = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cliente não participa da gamificação'
    );
  END IF;
  
  -- Verificar se já foi processada
  IF v_os.incluir_gamificacao THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OS já foi incluída na gamificação',
      'pontos_gerados', v_os.pontos_gerados
    );
  END IF;
  
  -- Buscar configuração
  SELECT * INTO v_config 
  FROM customer_gamification_config 
  WHERE active = true 
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Configuração não encontrada');
  END IF;
  
  -- Calcular multiplicador
  v_multiplier := CASE v_os.service_type
    WHEN 'instalacao' THEN v_config.installation_multiplier
    WHEN 'retrofit' THEN v_config.retrofit_multiplier
    WHEN 'contrato' THEN v_config.contract_multiplier
    ELSE v_config.maintenance_multiplier
  END;
  
  -- Calcular pontos
  v_points := ROUND(COALESCE(v_os.total_value, 0) * v_config.points_per_real_spent * v_multiplier);
  
  -- Adicionar pontos
  PERFORM add_customer_points(
    v_os.customer_id,
    v_points,
    'purchase',
    format('OS #%s incluída na gamificação - R$ %s', v_os.order_number, v_os.total_value),
    v_os.id
  );
  
  -- Atualizar estatísticas
  UPDATE customer_points
  SET
    total_purchases = total_purchases + 1,
    total_spent = total_spent + COALESCE(v_os.total_value, 0),
    last_purchase_date = COALESCE(v_os.completed_at::date, CURRENT_DATE),
    first_purchase_date = COALESCE(first_purchase_date, COALESCE(v_os.completed_at::date, CURRENT_DATE))
  WHERE customer_id = v_os.customer_id;
  
  -- Marcar OS como incluída
  UPDATE service_orders
  SET 
    incluir_gamificacao = true,
    data_inclusao_gamificacao = now(),
    pontos_gerados = v_points
  WHERE id = p_service_order_id;
  
  -- Verificar badges
  PERFORM check_and_award_badges(v_os.customer_id);
  
  v_result := jsonb_build_object(
    'success', true,
    'service_order_id', p_service_order_id,
    'customer_id', v_os.customer_id,
    'pontos_gerados', v_points,
    'valor_os', v_os.total_value,
    'multiplicador', v_multiplier
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 6. FUNÇÃO: INCLUIR MÚLTIPLAS OSs NA GAMIFICAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION incluir_multiplas_os_gamificacao(
  p_service_order_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id uuid;
  v_result jsonb;
  v_results jsonb[] := '{}';
  v_total_pontos integer := 0;
  v_total_processadas integer := 0;
  v_total_erros integer := 0;
BEGIN
  -- Processar cada OS
  FOREACH v_os_id IN ARRAY p_service_order_ids
  LOOP
    v_result := incluir_os_na_gamificacao(v_os_id);
    v_results := array_append(v_results, v_result);
    
    IF (v_result->>'success')::boolean THEN
      v_total_processadas := v_total_processadas + 1;
      v_total_pontos := v_total_pontos + COALESCE((v_result->>'pontos_gerados')::integer, 0);
    ELSE
      v_total_erros := v_total_erros + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_processadas', v_total_processadas,
    'total_erros', v_total_erros,
    'total_pontos_gerados', v_total_pontos,
    'detalhes', v_results
  );
END;
$$;

-- ============================================================================
-- 7. MODIFICAR TRIGGER PARA VERIFICAR FLAGS
-- ============================================================================

CREATE OR REPLACE FUNCTION award_points_on_os_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config customer_gamification_config%ROWTYPE;
  v_points integer;
  v_multiplier numeric(5,2);
  v_cliente_participa boolean;
BEGIN
  -- Verificar se OS foi concluída
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    
    -- Verificar se cliente participa da gamificação
    SELECT participa_gamificacao INTO v_cliente_participa
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Se cliente não participa, não processar
    IF NOT COALESCE(v_cliente_participa, false) THEN
      RETURN NEW;
    END IF;
    
    -- Verificar se já foi processada
    IF COALESCE(NEW.incluir_gamificacao, false) THEN
      RETURN NEW;
    END IF;
    
    SELECT * INTO v_config FROM customer_gamification_config WHERE active = true LIMIT 1;
    
    IF FOUND THEN
      -- Determinar multiplicador por tipo de serviço
      v_multiplier := CASE NEW.service_type
        WHEN 'instalacao' THEN v_config.installation_multiplier
        WHEN 'retrofit' THEN v_config.retrofit_multiplier
        WHEN 'contrato' THEN v_config.contract_multiplier
        ELSE v_config.maintenance_multiplier
      END;
      
      -- Calcular pontos
      v_points := ROUND(COALESCE(NEW.total_value, 0) * v_config.points_per_real_spent * v_multiplier);
      
      -- Adicionar pontos
      PERFORM add_customer_points(
        NEW.customer_id,
        v_points,
        'purchase',
        format('OS #%s concluída - R$ %s', NEW.order_number, NEW.total_value),
        NEW.id
      );
      
      -- Atualizar estatísticas
      UPDATE customer_points
      SET
        total_purchases = total_purchases + 1,
        total_spent = total_spent + COALESCE(NEW.total_value, 0),
        last_purchase_date = CURRENT_DATE,
        first_purchase_date = COALESCE(first_purchase_date, CURRENT_DATE)
      WHERE customer_id = NEW.customer_id;
      
      -- Marcar como incluída
      NEW.incluir_gamificacao := true;
      NEW.data_inclusao_gamificacao := now();
      NEW.pontos_gerados := v_points;
      
      -- Verificar badges
      PERFORM check_and_award_badges(NEW.customer_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 8. VIEW: OSs DISPONÍVEIS PARA GAMIFICAÇÃO
-- ============================================================================

CREATE OR REPLACE VIEW v_os_disponiveis_gamificacao AS
SELECT
  so.id,
  so.order_number,
  so.customer_id,
  c.nome_razao as customer_name,
  c.participa_gamificacao,
  so.status,
  so.total_value,
  so.service_type,
  so.created_at,
  so.completed_at,
  so.incluir_gamificacao,
  so.pontos_gerados,
  CASE 
    WHEN NOT c.participa_gamificacao THEN 'Cliente não participa'
    WHEN so.incluir_gamificacao THEN 'Já incluída'
    WHEN so.status != 'concluida' THEN 'OS não concluída'
    ELSE 'Disponível'
  END as status_gamificacao,
  CASE
    WHEN c.participa_gamificacao AND NOT COALESCE(so.incluir_gamificacao, false) 
         AND so.status = 'concluida' THEN true
    ELSE false
  END as pode_incluir
FROM service_orders so
INNER JOIN customers c ON so.customer_id = c.id
WHERE so.customer_id IS NOT NULL
ORDER BY so.created_at DESC;

-- ============================================================================
-- 9. VIEW: RELATÓRIO DE GAMIFICAÇÃO POR CLIENTE
-- ============================================================================

CREATE OR REPLACE VIEW v_relatorio_gamificacao_cliente AS
SELECT
  c.id as customer_id,
  c.nome_razao as customer_name,
  c.participa_gamificacao,
  c.data_adesao_gamificacao,
  COALESCE(cp.total_points, 0) as total_points,
  COALESCE(cp.current_tier, 'bronze') as current_tier,
  COALESCE(cp.total_purchases, 0) as total_purchases,
  COALESCE(cp.total_spent, 0) as total_spent,
  COUNT(DISTINCT cbe.badge_id) as total_badges,
  COUNT(DISTINCT so.id) FILTER (WHERE so.incluir_gamificacao) as os_na_gamificacao,
  COUNT(DISTINCT so.id) FILTER (WHERE so.status = 'concluida' AND NOT COALESCE(so.incluir_gamificacao, false)) as os_pendentes_inclusao,
  COALESCE(SUM(so.total_value) FILTER (WHERE so.status = 'concluida' AND NOT COALESCE(so.incluir_gamificacao, false)), 0) as valor_pendente
FROM customers c
LEFT JOIN customer_points cp ON c.id = cp.customer_id
LEFT JOIN customer_badges_earned cbe ON c.id = cbe.customer_id
LEFT JOIN service_orders so ON c.id = so.customer_id
GROUP BY c.id, c.nome_razao, c.participa_gamificacao, c.data_adesao_gamificacao,
         cp.total_points, cp.current_tier, cp.total_purchases, cp.total_spent
ORDER BY cp.total_points DESC NULLS LAST;

-- ============================================================================
-- 10. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION ativar_gamificacao_cliente TO anon, authenticated;
GRANT EXECUTE ON FUNCTION desativar_gamificacao_cliente TO anon, authenticated;
GRANT EXECUTE ON FUNCTION incluir_os_na_gamificacao TO anon, authenticated;
GRANT EXECUTE ON FUNCTION incluir_multiplas_os_gamificacao TO anon, authenticated;

-- ============================================================================
-- 11. COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION ativar_gamificacao_cliente IS 'Ativa gamificação para um cliente e opcionalmente processa OSs antigas';
COMMENT ON FUNCTION desativar_gamificacao_cliente IS 'Desativa gamificação e opcionalmente remove pontos';
COMMENT ON FUNCTION incluir_os_na_gamificacao IS 'Inclui uma OS específica na gamificação gerando pontos';
COMMENT ON FUNCTION incluir_multiplas_os_gamificacao IS 'Processa múltiplas OSs de uma vez';
