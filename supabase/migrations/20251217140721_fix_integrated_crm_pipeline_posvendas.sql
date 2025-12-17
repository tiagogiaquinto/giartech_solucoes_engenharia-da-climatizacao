/*
  # CORREÇÃO E CRIAÇÃO DO SISTEMA DE ESTEIRA INTEGRADA CRM + PÓS-VENDA
  
  ## Corrige funções existentes e adiciona nova estrutura
*/

-- ============================================================================
-- 1. REMOVER FUNÇÕES DUPLICADAS
-- ============================================================================

DROP FUNCTION IF EXISTS move_opportunity_to_stage CASCADE;
DROP FUNCTION IF EXISTS create_pos_venda_from_opportunity CASCADE;
DROP FUNCTION IF EXISTS auto_move_pos_venda_stages CASCADE;

-- ============================================================================
-- 2. CRIAR STAGES DO PIPELINE DE PÓS-VENDA
-- ============================================================================

DO $$
DECLARE
  v_pipeline_id uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- Limpar stages antigos se existirem
  DELETE FROM crm_stages WHERE pipeline_id = v_pipeline_id;

  -- Onboarding/Ativação (0-7 dias)
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Onboarding',
    'Cliente novo - ativação e onboarding inicial (0-7 dias)',
    1,
    '#10b981', -- verde
    100,
    7,
    false,
    false
  );

  -- Follow-up Curto (7-30 dias)
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Follow-up Curto',
    'Acompanhamento inicial - primeiras semanas (7-30 dias)',
    2,
    '#3b82f6', -- azul
    100,
    15,
    false,
    false
  );

  -- Follow-up Longo (30-90 dias)
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Follow-up Longo',
    'Verificação de satisfação - primeiro trimestre (30-90 dias)',
    3,
    '#8b5cf6', -- roxo
    100,
    30,
    false,
    false
  );

  -- Retenção/Upsell (90+ dias)
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Retenção/Upsell',
    'Oportunidades de expansão e novos serviços (90+ dias)',
    4,
    '#f59e0b', -- laranja
    100,
    45,
    false,
    false
  );

  -- Indicação/Referral
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Indicação/Referral',
    'Clientes promotores - programa de indicação',
    5,
    '#ec4899', -- rosa
    100,
    60,
    false,
    false
  );

  -- Churn Risk
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Churn Risk',
    'Cliente em risco - ação urgente necessária',
    6,
    '#ef4444', -- vermelho
    50,
    7,
    false,
    false
  );

  -- Cliente Inativo
  INSERT INTO crm_stages (id, pipeline_id, nome, descricao, ordem, cor, probabilidade, rotting_days, is_closed, is_won)
  VALUES (
    gen_random_uuid(),
    v_pipeline_id,
    'Cliente Inativo',
    'Cliente que não responde ou cancelou',
    7,
    '#6b7280', -- cinza
    0,
    null,
    true,
    false
  );
END $$;

-- ============================================================================
-- 3. CRIAR TABELA DE HISTÓRICO DE MOVIMENTAÇÃO NA ESTEIRA
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_opportunity_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES crm_opportunities(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES crm_stages(id),
  to_stage_id uuid REFERENCES crm_stages(id),
  moved_by uuid REFERENCES employees(id),
  moved_at timestamptz DEFAULT now(),
  time_in_previous_stage interval,
  reason text,
  automated boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE crm_opportunity_stage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura histórico movimentação" ON crm_opportunity_stage_history;
DROP POLICY IF EXISTS "Permitir inserção histórico movimentação" ON crm_opportunity_stage_history;

CREATE POLICY "Permitir leitura histórico movimentação"
  ON crm_opportunity_stage_history FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção histórico movimentação"
  ON crm_opportunity_stage_history FOR INSERT
  WITH CHECK (true);

DROP INDEX IF EXISTS idx_stage_history_opportunity;
DROP INDEX IF EXISTS idx_stage_history_moved_at;

CREATE INDEX idx_stage_history_opportunity 
  ON crm_opportunity_stage_history(opportunity_id);
CREATE INDEX idx_stage_history_moved_at 
  ON crm_opportunity_stage_history(moved_at DESC);

-- ============================================================================
-- 4. FUNÇÃO: MOVER OPORTUNIDADE DE STAGE (COM HISTÓRICO)
-- ============================================================================

CREATE OR REPLACE FUNCTION move_opportunity_to_stage_v2(
  p_opportunity_id uuid,
  p_new_stage_id uuid,
  p_moved_by uuid DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_automated boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_stage_id uuid;
  v_old_stage_entered_at timestamptz;
  v_time_in_stage interval;
  v_new_pipeline_id uuid;
  v_is_won boolean;
  v_customer_id uuid;
  v_valor numeric;
  v_titulo text;
BEGIN
  -- Buscar dados atuais da oportunidade
  SELECT 
    stage_id, 
    updated_at, 
    customer_id,
    valor,
    titulo
  INTO 
    v_old_stage_id, 
    v_old_stage_entered_at,
    v_customer_id,
    v_valor,
    v_titulo
  FROM crm_opportunities
  WHERE id = p_opportunity_id;

  -- Calcular tempo no stage anterior
  v_time_in_stage := now() - v_old_stage_entered_at;

  -- Buscar informações do novo stage
  SELECT pipeline_id, COALESCE(is_won, false)
  INTO v_new_pipeline_id, v_is_won
  FROM crm_stages
  WHERE id = p_new_stage_id;

  -- Atualizar a oportunidade
  UPDATE crm_opportunities
  SET 
    stage_id = p_new_stage_id,
    pipeline_id = v_new_pipeline_id,
    updated_at = now(),
    -- Se for stage "Ganho", registrar data de fechamento
    data_fechamento_real = CASE 
      WHEN v_is_won THEN COALESCE(data_fechamento_real, CURRENT_DATE)
      ELSE data_fechamento_real
    END,
    status = CASE 
      WHEN v_is_won THEN 'ganho'
      ELSE status
    END
  WHERE id = p_opportunity_id;

  -- Registrar no histórico
  INSERT INTO crm_opportunity_stage_history (
    opportunity_id,
    from_stage_id,
    to_stage_id,
    moved_by,
    time_in_previous_stage,
    reason,
    automated
  ) VALUES (
    p_opportunity_id,
    v_old_stage_id,
    p_new_stage_id,
    p_moved_by,
    v_time_in_stage,
    p_reason,
    p_automated
  );

  -- SE A OPORTUNIDADE FOI GANHA, CRIAR AUTOMATICAMENTE NO PÓS-VENDA
  IF v_is_won AND v_customer_id IS NOT NULL THEN
    PERFORM create_pos_venda_from_won_opportunity(
      p_opportunity_id,
      v_customer_id,
      v_valor,
      v_titulo
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Oportunidade movida com sucesso',
    'time_in_previous_stage', v_time_in_stage,
    'created_pos_venda', v_is_won
  );
END;
$$;

-- ============================================================================
-- 5. FUNÇÃO: CRIAR CARD DE PÓS-VENDA AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION create_pos_venda_from_won_opportunity(
  p_opportunity_id uuid,
  p_customer_id uuid,
  p_valor numeric,
  p_titulo text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_onboarding_stage_id uuid;
  v_new_opp_id uuid;
  v_pipeline_posvenda_id uuid := '00000000-0000-0000-0000-000000000003';
  v_existing_opp uuid;
BEGIN
  -- Verificar se já existe oportunidade de pós-venda para este cliente
  SELECT id INTO v_existing_opp
  FROM crm_opportunities
  WHERE customer_id = p_customer_id
    AND pipeline_id = v_pipeline_posvenda_id
    AND status = 'aberto'
    AND custom_fields->>'origem_opportunity_id' = p_opportunity_id::text
  LIMIT 1;

  -- Se já existe, não criar duplicado
  IF v_existing_opp IS NOT NULL THEN
    RETURN v_existing_opp;
  END IF;

  -- Buscar o stage de Onboarding do pipeline de pós-venda
  SELECT id INTO v_onboarding_stage_id
  FROM crm_stages
  WHERE pipeline_id = v_pipeline_posvenda_id
    AND nome = 'Onboarding'
  LIMIT 1;

  -- Se não encontrou o stage, retornar null
  IF v_onboarding_stage_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Criar nova oportunidade no Pós-Venda
  INSERT INTO crm_opportunities (
    titulo,
    descricao,
    customer_id,
    pipeline_id,
    stage_id,
    valor,
    status,
    temperatura,
    lead_score,
    prioridade,
    data_criacao,
    data_proximo_contato,
    origem,
    custom_fields
  ) VALUES (
    'Pós-Venda: ' || COALESCE(p_titulo, 'Cliente Novo'),
    'Cliente gerado automaticamente da oportunidade ' || p_opportunity_id,
    p_customer_id,
    v_pipeline_posvenda_id,
    v_onboarding_stage_id,
    COALESCE(p_valor, 0),
    'aberto',
    'quente',
    100,
    'alta',
    CURRENT_DATE,
    CURRENT_DATE + interval '3 days', -- Follow-up em 3 dias
    'conversao_venda',
    jsonb_build_object(
      'origem_opportunity_id', p_opportunity_id,
      'data_conversao', now(),
      'tipo', 'pos_venda_automatico'
    )
  ) RETURNING id INTO v_new_opp_id;

  -- Registrar no histórico
  INSERT INTO crm_opportunity_stage_history (
    opportunity_id,
    from_stage_id,
    to_stage_id,
    time_in_previous_stage,
    reason,
    automated
  ) VALUES (
    v_new_opp_id,
    NULL,
    v_onboarding_stage_id,
    interval '0',
    'Criado automaticamente após venda ganha',
    true
  );

  RETURN v_new_opp_id;
END;
$$;

-- ============================================================================
-- 6. TRIGGER: AUTOMATIZAR MOVIMENTAÇÃO POR TEMPO
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_move_pos_venda_by_time()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pipeline_posvenda_id uuid := '00000000-0000-0000-0000-000000000003';
  v_stage_followup_curto uuid;
  v_stage_followup_longo uuid;
  v_stage_retencao uuid;
  v_opp record;
  v_count integer := 0;
BEGIN
  -- Buscar IDs dos stages
  SELECT id INTO v_stage_followup_curto FROM crm_stages 
  WHERE pipeline_id = v_pipeline_posvenda_id AND nome = 'Follow-up Curto' LIMIT 1;
  
  SELECT id INTO v_stage_followup_longo FROM crm_stages 
  WHERE pipeline_id = v_pipeline_posvenda_id AND nome = 'Follow-up Longo' LIMIT 1;
  
  SELECT id INTO v_stage_retencao FROM crm_stages 
  WHERE pipeline_id = v_pipeline_posvenda_id AND nome = 'Retenção/Upsell' LIMIT 1;

  -- Mover de Onboarding para Follow-up Curto (após 7 dias)
  IF v_stage_followup_curto IS NOT NULL THEN
    FOR v_opp IN 
      SELECT o.id, o.stage_id
      FROM crm_opportunities o
      JOIN crm_stages s ON s.id = o.stage_id
      WHERE s.pipeline_id = v_pipeline_posvenda_id
        AND s.nome = 'Onboarding'
        AND o.updated_at < now() - interval '7 days'
        AND o.status = 'aberto'
    LOOP
      PERFORM move_opportunity_to_stage_v2(
        v_opp.id,
        v_stage_followup_curto,
        NULL,
        'Movido automaticamente após 7 dias em Onboarding',
        true
      );
      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- Mover de Follow-up Curto para Follow-up Longo (após 30 dias)
  IF v_stage_followup_longo IS NOT NULL THEN
    FOR v_opp IN 
      SELECT o.id, o.stage_id
      FROM crm_opportunities o
      JOIN crm_stages s ON s.id = o.stage_id
      WHERE s.pipeline_id = v_pipeline_posvenda_id
        AND s.nome = 'Follow-up Curto'
        AND o.updated_at < now() - interval '30 days'
        AND o.status = 'aberto'
    LOOP
      PERFORM move_opportunity_to_stage_v2(
        v_opp.id,
        v_stage_followup_longo,
        NULL,
        'Movido automaticamente após 30 dias',
        true
      );
      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- Mover de Follow-up Longo para Retenção/Upsell (após 90 dias)
  IF v_stage_retencao IS NOT NULL THEN
    FOR v_opp IN 
      SELECT o.id, o.stage_id
      FROM crm_opportunities o
      JOIN crm_stages s ON s.id = o.stage_id
      WHERE s.pipeline_id = v_pipeline_posvenda_id
        AND s.nome = 'Follow-up Longo'
        AND o.updated_at < now() - interval '90 days'
        AND o.status = 'aberto'
    LOOP
      PERFORM move_opportunity_to_stage_v2(
        v_opp.id,
        v_stage_retencao,
        NULL,
        'Movido automaticamente para programa de retenção',
        true
      );
      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- 7. CRIAR VIEW UNIFICADA: ESTEIRA COMPLETA
-- ============================================================================

CREATE OR REPLACE VIEW v_crm_esteira_completa AS
SELECT 
  o.id,
  o.titulo,
  o.customer_id,
  c.nome_razao as customer_name,
  c.whatsapp as customer_whatsapp,
  c.celular as customer_celular,
  c.email as customer_email,
  o.valor,
  o.lead_score,
  o.temperatura,
  o.prioridade,
  o.status,
  p.id as pipeline_id,
  p.nome as pipeline_nome,
  p.tipo as pipeline_tipo,
  s.id as stage_id,
  s.nome as stage_nome,
  s.cor as stage_cor,
  s.ordem as stage_ordem,
  s.probabilidade,
  e.id as owner_id,
  e.name as owner_name,
  o.data_criacao,
  o.data_fechamento_esperada,
  o.data_proximo_contato,
  o.dias_no_pipeline,
  o.dias_sem_atividade,
  o.is_rotting,
  o.num_interacoes,
  o.custom_fields,
  -- Calcular dias no stage atual
  EXTRACT(day FROM now() - o.updated_at)::integer as dias_no_stage_atual,
  -- Determinar próxima ação
  CASE 
    WHEN o.data_proximo_contato IS NOT NULL AND o.data_proximo_contato <= CURRENT_DATE THEN 'Contato Urgente'
    WHEN o.dias_sem_atividade > 7 THEN 'Reativar Contato'
    WHEN s.nome = 'Onboarding' THEN 'Welcome Call'
    WHEN s.nome = 'Follow-up Curto' THEN 'Verificar Satisfação'
    WHEN s.nome = 'Follow-up Longo' THEN 'Pesquisa NPS'
    WHEN s.nome = 'Retenção/Upsell' THEN 'Apresentar Novos Serviços'
    WHEN s.nome = 'Indicação/Referral' THEN 'Solicitar Indicação'
    WHEN s.nome = 'Churn Risk' THEN 'Ação de Retenção URGENTE'
    ELSE 'Acompanhar Pipeline'
  END as proxima_acao_sugerida,
  -- Score de saúde do cliente (0-100)
  CASE 
    WHEN p.tipo = 'pos_venda' THEN
      GREATEST(0, LEAST(100, 
        100 
        - (COALESCE(o.dias_sem_atividade, 0) * 2)
        - (CASE WHEN o.data_proximo_contato < CURRENT_DATE THEN 20 ELSE 0 END)
        + (COALESCE(o.num_interacoes, 0) * 5)
      ))
    ELSE NULL
  END as cliente_health_score
FROM crm_opportunities o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN crm_stages s ON s.id = o.stage_id
LEFT JOIN crm_pipelines p ON p.id = o.pipeline_id
LEFT JOIN employees e ON e.id = o.owner_id
WHERE o.is_archived = false
ORDER BY 
  p.ordem,
  s.ordem,
  o.data_proximo_contato NULLS LAST;

-- Permissões
GRANT SELECT ON v_crm_esteira_completa TO anon, authenticated;

-- ============================================================================
-- 8. CRIAR FUNÇÃO PARA DASHBOARD DE ESTEIRA
-- ============================================================================

CREATE OR REPLACE FUNCTION get_esteira_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_na_esteira', COUNT(*),
    'total_valor', COALESCE(SUM(valor), 0),
    'por_pipeline', (
      SELECT jsonb_object_agg(
        pipeline_nome,
        jsonb_build_object(
          'total', count,
          'valor', valor
        )
      )
      FROM (
        SELECT 
          pipeline_nome,
          COUNT(*)::integer as count,
          COALESCE(SUM(valor), 0) as valor
        FROM v_crm_esteira_completa
        WHERE status = 'aberto'
        GROUP BY pipeline_nome
      ) t
    ),
    'alertas_urgentes', (
      SELECT COUNT(*)
      FROM v_crm_esteira_completa
      WHERE proxima_acao_sugerida LIKE '%URGENTE%'
        AND status = 'aberto'
    ),
    'health_score_medio', (
      SELECT COALESCE(AVG(cliente_health_score), 0)
      FROM v_crm_esteira_completa
      WHERE cliente_health_score IS NOT NULL
        AND status = 'aberto'
    )
  ) INTO v_result
  FROM v_crm_esteira_completa
  WHERE status = 'aberto';

  RETURN v_result;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_esteira_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION move_opportunity_to_stage_v2(uuid, uuid, uuid, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_pos_venda_from_won_opportunity(uuid, uuid, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auto_move_pos_venda_by_time() TO anon, authenticated;
