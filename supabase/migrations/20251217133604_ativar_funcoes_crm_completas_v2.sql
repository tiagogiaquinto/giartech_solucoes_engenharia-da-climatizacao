/*
  # ATIVAÇÃO COMPLETA DAS FUNCIONALIDADES DO CRM PROFISSIONAL

  Implementa:
  1. Campo data_proximo_contato para follow-ups
  2. Função automática de alerta de follow-up
  3. View para oportunidades com follow-up vencido
  4. Trigger para calcular dias desde último contato
*/

-- =============================================
-- 1. ADICIONAR CAMPOS DE FOLLOW-UP
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_opportunities' AND column_name = 'data_proximo_contato'
  ) THEN
    ALTER TABLE crm_opportunities ADD COLUMN data_proximo_contato date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_opportunities' AND column_name = 'ultimo_tipo_contato'
  ) THEN
    ALTER TABLE crm_opportunities ADD COLUMN ultimo_tipo_contato text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_opportunities' AND column_name = 'proxima_acao'
  ) THEN
    ALTER TABLE crm_opportunities ADD COLUMN proxima_acao text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'crm_opportunities' AND column_name = 'prioridade_followup'
  ) THEN
    ALTER TABLE crm_opportunities ADD COLUMN prioridade_followup text DEFAULT 'media';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_opportunities_prioridade_followup_check'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD CONSTRAINT crm_opportunities_prioridade_followup_check 
    CHECK (prioridade_followup IN ('baixa', 'media', 'alta', 'urgente'));
  END IF;
END $$;

-- =============================================
-- 2. VIEW DE FOLLOW-UPS VENCIDOS
-- =============================================

CREATE OR REPLACE VIEW v_crm_followups_vencidos AS
SELECT
  o.id,
  o.titulo,
  o.valor,
  o.temperatura,
  o.lead_score,
  o.data_proximo_contato,
  o.prioridade_followup,
  o.proxima_acao,
  o.ultimo_tipo_contato,
  (CURRENT_DATE - o.data_proximo_contato) as dias_atrasado,
  c.nome_razao as cliente_nome,
  c.whatsapp as cliente_whatsapp,
  c.celular as cliente_celular,
  c.email as cliente_email,
  up.full_name as responsavel_nome,
  up.email as responsavel_email,
  s.nome as stage_nome,
  s.cor as stage_cor,
  p.nome as pipeline_nome
FROM crm_opportunities o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN user_profiles up ON o.owner_id = up.id
LEFT JOIN crm_stages s ON o.stage_id = s.id
LEFT JOIN crm_pipelines p ON o.pipeline_id = p.id
WHERE o.status = 'aberto'
  AND o.data_proximo_contato IS NOT NULL
  AND o.data_proximo_contato < CURRENT_DATE
ORDER BY o.data_proximo_contato ASC, o.prioridade_followup DESC;

-- =============================================
-- 3. VIEW DE FOLLOW-UPS PRÓXIMOS (2 DIAS)
-- =============================================

CREATE OR REPLACE VIEW v_crm_followups_proximos AS
SELECT
  o.id,
  o.titulo,
  o.valor,
  o.temperatura,
  o.lead_score,
  o.data_proximo_contato,
  o.prioridade_followup,
  o.proxima_acao,
  o.ultimo_tipo_contato,
  (o.data_proximo_contato - CURRENT_DATE) as dias_restantes,
  c.nome_razao as cliente_nome,
  c.whatsapp as cliente_whatsapp,
  c.celular as cliente_celular,
  c.email as cliente_email,
  up.full_name as responsavel_nome,
  up.email as responsavel_email,
  s.nome as stage_nome,
  s.cor as stage_cor,
  p.nome as pipeline_nome
FROM crm_opportunities o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN user_profiles up ON o.owner_id = up.id
LEFT JOIN crm_stages s ON o.stage_id = s.id
LEFT JOIN crm_pipelines p ON o.pipeline_id = p.id
WHERE o.status = 'aberto'
  AND o.data_proximo_contato IS NOT NULL
  AND o.data_proximo_contato >= CURRENT_DATE
  AND o.data_proximo_contato <= CURRENT_DATE + 2
ORDER BY o.data_proximo_contato ASC, o.prioridade_followup DESC;

-- =============================================
-- 4. FUNÇÃO PARA SUGERIR PRÓXIMO FOLLOW-UP
-- =============================================

CREATE OR REPLACE FUNCTION sugerir_proximo_followup(
  p_opportunity_id uuid,
  p_tipo_contato text
)
RETURNS date AS $$
DECLARE
  v_temperatura text;
  v_lead_score integer;
  v_dias_sugeridos integer;
  v_data_sugerida date;
BEGIN
  SELECT temperatura, lead_score
  INTO v_temperatura, v_lead_score
  FROM crm_opportunities
  WHERE id = p_opportunity_id;

  CASE v_temperatura
    WHEN 'quente' THEN
      CASE p_tipo_contato
        WHEN 'meeting' THEN v_dias_sugeridos := 1;
        WHEN 'call' THEN v_dias_sugeridos := 2;
        WHEN 'email' THEN v_dias_sugeridos := 3;
        ELSE v_dias_sugeridos := 2;
      END CASE;
    WHEN 'morno' THEN
      CASE p_tipo_contato
        WHEN 'meeting' THEN v_dias_sugeridos := 3;
        WHEN 'call' THEN v_dias_sugeridos := 5;
        WHEN 'email' THEN v_dias_sugeridos := 7;
        ELSE v_dias_sugeridos := 5;
      END CASE;
    WHEN 'frio' THEN
      CASE p_tipo_contato
        WHEN 'meeting' THEN v_dias_sugeridos := 7;
        WHEN 'call' THEN v_dias_sugeridos := 10;
        WHEN 'email' THEN v_dias_sugeridos := 14;
        ELSE v_dias_sugeridos := 10;
      END CASE;
    ELSE
      v_dias_sugeridos := 7;
  END CASE;

  IF v_lead_score >= 80 THEN
    v_dias_sugeridos := GREATEST(1, v_dias_sugeridos - 2);
  ELSIF v_lead_score >= 60 THEN
    v_dias_sugeridos := GREATEST(1, v_dias_sugeridos - 1);
  END IF;

  v_data_sugerida := CURRENT_DATE + v_dias_sugeridos;

  RETURN v_data_sugerida;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. FUNÇÃO PARA REGISTRAR ATIVIDADE E AUTO-FOLLOW-UP
-- =============================================

CREATE OR REPLACE FUNCTION registrar_atividade_crm(
  p_opportunity_id uuid,
  p_tipo text,
  p_assunto text DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_resultado text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_activity_id uuid;
  v_data_followup date;
  v_proxima_acao text;
BEGIN
  INSERT INTO crm_activities (
    opportunity_id,
    tipo,
    assunto,
    descricao,
    resultado,
    status,
    data_atividade
  )
  VALUES (
    p_opportunity_id,
    p_tipo,
    COALESCE(p_assunto, 'Contato realizado'),
    p_descricao,
    p_resultado,
    'completado',
    now()
  )
  RETURNING id INTO v_activity_id;

  v_data_followup := sugerir_proximo_followup(p_opportunity_id, p_tipo);

  CASE p_tipo
    WHEN 'email' THEN v_proxima_acao := 'Ligar para verificar se recebeu o email';
    WHEN 'call' THEN v_proxima_acao := 'Enviar proposta comercial';
    WHEN 'meeting' THEN v_proxima_acao := 'Enviar follow-up com próximos passos';
    WHEN 'whatsapp' THEN v_proxima_acao := 'Agendar ligação ou reunião';
    ELSE v_proxima_acao := 'Realizar follow-up';
  END CASE;

  UPDATE crm_opportunities
  SET
    data_ultimo_contato = now(),
    ultimo_tipo_contato = p_tipo,
    data_proximo_contato = v_data_followup,
    proxima_acao = v_proxima_acao,
    num_interacoes = COALESCE(num_interacoes, 0) + 1
  WHERE id = p_opportunity_id;

  RETURN jsonb_build_object(
    'activity_id', v_activity_id,
    'proximo_followup', v_data_followup,
    'proxima_acao', v_proxima_acao,
    'success', true
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. FUNÇÃO RPC PARA DASHBOARD
-- =============================================

CREATE OR REPLACE FUNCTION get_crm_followup_stats()
RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_vencidos', COUNT(*) FILTER (WHERE data_proximo_contato < CURRENT_DATE),
    'total_hoje', COUNT(*) FILTER (WHERE data_proximo_contato = CURRENT_DATE),
    'total_proximos_2_dias', COUNT(*) FILTER (WHERE data_proximo_contato BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + 2),
    'total_urgentes', COUNT(*) FILTER (WHERE prioridade_followup = 'urgente'),
    'total_altas', COUNT(*) FILTER (WHERE prioridade_followup = 'alta'),
    'valor_total_vencidos', COALESCE(SUM(valor) FILTER (WHERE data_proximo_contato < CURRENT_DATE), 0),
    'valor_total_proximos', COALESCE(SUM(valor) FILTER (WHERE data_proximo_contato BETWEEN CURRENT_DATE AND CURRENT_DATE + 2), 0)
  )
  INTO v_stats
  FROM crm_opportunities
  WHERE status = 'aberto'
    AND data_proximo_contato IS NOT NULL;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. GRANTS E PERMISSÕES
-- =============================================

GRANT SELECT ON v_crm_followups_vencidos TO authenticated, anon;
GRANT SELECT ON v_crm_followups_proximos TO authenticated, anon;
GRANT EXECUTE ON FUNCTION sugerir_proximo_followup TO authenticated, anon;
GRANT EXECUTE ON FUNCTION registrar_atividade_crm TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_crm_followup_stats TO authenticated, anon;

-- =============================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_followup_date
  ON crm_opportunities(data_proximo_contato)
  WHERE status = 'aberto' AND data_proximo_contato IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_prioridade
  ON crm_opportunities(prioridade_followup)
  WHERE status = 'aberto';

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_ultimo_contato
  ON crm_opportunities(data_ultimo_contato)
  WHERE status = 'aberto';
