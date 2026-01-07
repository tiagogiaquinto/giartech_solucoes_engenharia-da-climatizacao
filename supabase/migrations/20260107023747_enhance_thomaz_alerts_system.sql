/*
  # Melhorar Sistema de Alertas do Thomaz
  
  1. Adicionar Campos Faltantes
    - area (além de affected_area)
    - nivel_risco (mapeado de severity)
    - explicacao_tecnica (explicação detalhada)
    - evidencias (jsonb com dados estruturados)
    - sugestoes (jsonb com ações acionáveis)
    - status (novo/visto/resolvido)
    - prioridade (1-10)
    - expires_at
    
  2. Funções de Geração Automática
    - Alertas de projeção 30 dias
    - Alertas de inadimplência
    - Alertas de inversão de saldo
    - Alertas de esgotamento
    
  3. Integração
    - v_thomaz_cash_projection_30d
    - finance_entries
*/

-- Adicionar campos novos à tabela existente
ALTER TABLE thomaz_alerts
  ADD COLUMN IF NOT EXISTS area text CHECK (area IN ('financeiro', 'operacional', 'tecnico', 'comercial', 'estrategico')),
  ADD COLUMN IF NOT EXISTS nivel_risco text CHECK (nivel_risco IN ('saudavel', 'atencao', 'critico')),
  ADD COLUMN IF NOT EXISTS mensagem_humana text,
  ADD COLUMN IF NOT EXISTS explicacao_tecnica text,
  ADD COLUMN IF NOT EXISTS evidencias jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sugestoes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_contexto jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'novo' CHECK (status IN ('novo', 'visto', 'resolvido', 'ignorado')),
  ADD COLUMN IF NOT EXISTS prioridade integer DEFAULT 5 CHECK (prioridade BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolution_note text;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_thomaz_alerts_area_status ON thomaz_alerts(area, status);
CREATE INDEX IF NOT EXISTS idx_thomaz_alerts_nivel_risco ON thomaz_alerts(nivel_risco, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thomaz_alerts_prioridade ON thomaz_alerts(prioridade DESC, created_at DESC);

-- Função para limpar alertas expirados
CREATE OR REPLACE FUNCTION cleanup_expired_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE thomaz_alerts
  SET status = 'ignorado',
      is_active = false,
      resolution_note = 'Expirado automaticamente'
  WHERE expires_at IS NOT NULL
    AND expires_at < now()
    AND status IN ('novo', 'visto');
END;
$$;

-- Função para upsert de alertas (evita duplicados)
CREATE OR REPLACE FUNCTION upsert_thomaz_alert(
  p_area text,
  p_titulo text,
  p_nivel_risco text,
  p_mensagem_humana text,
  p_explicacao_tecnica text,
  p_evidencias jsonb,
  p_sugestoes jsonb,
  p_dados_contexto jsonb,
  p_prioridade integer,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id uuid;
  v_existing_id uuid;
BEGIN
  SELECT id INTO v_existing_id
  FROM thomaz_alerts
  WHERE area = p_area
    AND title = p_titulo
    AND status IN ('novo', 'visto')
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE thomaz_alerts
    SET nivel_risco = p_nivel_risco,
        severity = p_nivel_risco,
        mensagem_humana = p_mensagem_humana,
        description = p_mensagem_humana,
        explicacao_tecnica = p_explicacao_tecnica,
        evidencias = p_evidencias,
        sugestoes = p_sugestoes,
        dados_contexto = p_dados_contexto,
        data_snapshot = p_evidencias,
        prioridade = p_prioridade,
        expires_at = p_expires_at,
        created_at = now(),
        is_active = true
    WHERE id = v_existing_id;
    
    RETURN v_existing_id;
  ELSE
    INSERT INTO thomaz_alerts (
      area, title, nivel_risco, severity, mensagem_humana, description,
      explicacao_tecnica, evidencias, sugestoes, dados_contexto,
      data_snapshot, prioridade, expires_at, status, is_active,
      alert_type, affected_area
    ) VALUES (
      p_area, p_titulo, p_nivel_risco, p_nivel_risco, p_mensagem_humana, p_mensagem_humana,
      p_explicacao_tecnica, p_evidencias, p_sugestoes, p_dados_contexto,
      p_evidencias, p_prioridade, p_expires_at, 'novo', true,
      p_area, p_area
    )
    RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
  END IF;
END;
$$;

-- Gerar alertas de projeção de caixa
CREATE OR REPLACE FUNCTION generate_cash_projection_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_critical_count integer := 0;
  v_inversion_count integer := 0;
  v_depletion_count integer := 0;
  v_contas_criticas jsonb;
  v_contas_inversao jsonb;
  v_contas_esgotamento jsonb;
  v_alerts_created integer := 0;
BEGIN
  PERFORM cleanup_expired_alerts();
  
  SELECT COUNT(*) INTO v_critical_count
  FROM v_thomaz_cash_projection_30d
  WHERE status_risco_30d = 'RISCO_CRITICO';
  
  IF v_critical_count > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'conta', conta,
        'saldo_atual', saldo_atual,
        'saldo_projetado', saldo_projetado_30d,
        'dias_ate_esgotamento', dias_ate_esgotamento
      )
    ) INTO v_contas_criticas
    FROM v_thomaz_cash_projection_30d
    WHERE status_risco_30d = 'RISCO_CRITICO';
    
    PERFORM upsert_thomaz_alert(
      'financeiro',
      'Risco Crítico de Caixa - Próximos 30 Dias',
      'critico',
      format('%s conta(s) terão saldo NEGATIVO nos próximos 30 dias!', v_critical_count),
      'Baseado em lançamentos financeiros confirmados e pendentes dos próximos 30 dias.',
      jsonb_build_array(jsonb_build_object('view', 'v_thomaz_cash_projection_30d', 'contas', v_contas_criticas)),
      jsonb_build_array(
        jsonb_build_object('texto', 'Revisar despesas próximos 30 dias', 'impacto', 'alto', 'acao', '/financeiro'),
        jsonb_build_object('texto', 'Intensificar cobranças', 'impacto', 'alto', 'acao', '/financeiro'),
        jsonb_build_object('texto', 'Renegociar prazos', 'impacto', 'medio', 'acao', '/suppliers'),
        jsonb_build_object('texto', 'Linha de crédito preventiva', 'impacto', 'alto', 'acao', '/bank-accounts')
      ),
      jsonb_build_object('count', v_critical_count),
      10,
      now() + INTERVAL '7 days'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;
  
  SELECT COUNT(*) INTO v_inversion_count
  FROM v_thomaz_cash_projection_30d
  WHERE alerta_inversao_saldo = true;
  
  IF v_inversion_count > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object('conta', conta, 'saldo_atual', saldo_atual, 'saldo_projetado', saldo_projetado_30d)
    ) INTO v_contas_inversao
    FROM v_thomaz_cash_projection_30d
    WHERE alerta_inversao_saldo = true;
    
    PERFORM upsert_thomaz_alert(
      'financeiro',
      'Inversão de Saldo Detectada',
      'critico',
      format('%s conta(s) vão de POSITIVO para NEGATIVO!', v_inversion_count),
      'Contas atualmente positivas inverterão para negativo nos próximos 30 dias.',
      jsonb_build_array(jsonb_build_object('view', 'v_thomaz_cash_projection_30d', 'contas', v_contas_inversao)),
      jsonb_build_array(
        jsonb_build_object('texto', 'Transferências preventivas', 'impacto', 'alto', 'acao', '/bank-accounts'),
        jsonb_build_object('texto', 'Antecipar receitas', 'impacto', 'alto', 'acao', '/financeiro')
      ),
      jsonb_build_object('count', v_inversion_count),
      9,
      now() + INTERVAL '5 days'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;
  
  SELECT COUNT(*) INTO v_depletion_count
  FROM v_thomaz_cash_projection_30d
  WHERE dias_ate_esgotamento IS NOT NULL AND dias_ate_esgotamento < 15;
  
  IF v_depletion_count > 0 THEN
    WITH contas_ordenadas AS (
      SELECT conta, saldo_atual, dias_ate_esgotamento
      FROM v_thomaz_cash_projection_30d
      WHERE dias_ate_esgotamento IS NOT NULL AND dias_ate_esgotamento < 15
      ORDER BY dias_ate_esgotamento
    )
    SELECT jsonb_agg(
      jsonb_build_object('conta', conta, 'saldo_atual', saldo_atual, 'dias', dias_ate_esgotamento)
    ) INTO v_contas_esgotamento
    FROM contas_ordenadas;
    
    PERFORM upsert_thomaz_alert(
      'financeiro',
      'Esgotamento de Contas Iminente',
      'atencao',
      format('%s conta(s) podem esgotar em menos de 15 dias!', v_depletion_count),
      'Estimativa baseada no impacto médio diário atual.',
      jsonb_build_array(jsonb_build_object('view', 'v_thomaz_cash_projection_30d', 'contas', v_contas_esgotamento)),
      jsonb_build_array(
        jsonb_build_object('texto', 'Monitorar diariamente', 'impacto', 'medio', 'acao', '/dashboard'),
        jsonb_build_object('texto', 'Reduzir despesas não essenciais', 'impacto', 'medio', 'acao', '/financeiro')
      ),
      jsonb_build_object('count', v_depletion_count),
      7,
      now() + INTERVAL '3 days'
    );
    v_alerts_created := v_alerts_created + 1;
  END IF;
  
  RETURN v_alerts_created;
END;
$$;

-- Gerar alertas de inadimplência
CREATE OR REPLACE FUNCTION generate_receivables_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_overdue_amount numeric;
  v_overdue_count integer;
BEGIN
  SELECT COALESCE(SUM(valor), 0), COUNT(*)
  INTO v_overdue_amount, v_overdue_count
  FROM finance_entries
  WHERE tipo = 'receita'
    AND status IN ('pendente', 'confirmado')
    AND data_vencimento < CURRENT_DATE;
  
  IF v_overdue_amount > 1000 THEN
    PERFORM upsert_thomaz_alert(
      'financeiro',
      'Receitas Vencidas - Inadimplência',
      CASE
        WHEN v_overdue_amount > 50000 THEN 'critico'
        WHEN v_overdue_amount > 10000 THEN 'atencao'
        ELSE 'saudavel'
      END,
      format('R$ %s em receitas VENCIDAS (%s lançamentos)!',
        to_char(v_overdue_amount, 'FM999G999G999D00'),
        v_overdue_count
      ),
      'Lançamentos de receita que passaram do vencimento e não foram recebidos.',
      jsonb_build_array(
        jsonb_build_object(
          'table', 'finance_entries',
          'valor_total', v_overdue_amount,
          'quantidade', v_overdue_count
        )
      ),
      jsonb_build_array(
        jsonb_build_object('texto', 'Ver receitas vencidas', 'impacto', 'alto', 'acao', '/financeiro'),
        jsonb_build_object('texto', 'Contatar clientes', 'impacto', 'alto', 'acao', '/customers'),
        jsonb_build_object('texto', 'Oferecer desconto', 'impacto', 'medio', 'acao', '/financeiro')
      ),
      jsonb_build_object('valor_total', v_overdue_amount, 'count', v_overdue_count),
      8,
      now() + INTERVAL '7 days'
    );
    RETURN 1;
  END IF;
  
  RETURN 0;
END;
$$;

-- Função principal
CREATE OR REPLACE FUNCTION thomaz_generate_all_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_projection_alerts integer;
  v_receivables_alerts integer;
  v_total_new integer;
BEGIN
  v_projection_alerts := generate_cash_projection_alerts();
  v_receivables_alerts := generate_receivables_alerts();
  
  SELECT COUNT(*) INTO v_total_new
  FROM thomaz_alerts
  WHERE status = 'novo';
  
  SELECT jsonb_build_object(
    'success', true,
    'alerts_generated', v_projection_alerts + v_receivables_alerts,
    'total_new_alerts', v_total_new,
    'timestamp', now(),
    'details', jsonb_build_object(
      'projection_alerts', v_projection_alerts,
      'receivables_alerts', v_receivables_alerts
    ),
    'summary', COALESCE((
      SELECT jsonb_object_agg(nivel_risco, count)
      FROM (
        SELECT nivel_risco, COUNT(*) as count
        FROM thomaz_alerts
        WHERE status = 'novo'
        GROUP BY nivel_risco
      ) t
    ), '{}'::jsonb)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_alerts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_thomaz_alert TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_cash_projection_alerts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_receivables_alerts() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_generate_all_alerts() TO anon, authenticated;

-- Comentários
COMMENT ON FUNCTION thomaz_generate_all_alerts() IS 'Gera todos os alertas do Thomaz AI - executar periodicamente ou sob demanda para manter alertas atualizados';
COMMENT ON FUNCTION generate_cash_projection_alerts() IS 'Gera alertas baseados na projeção de caixa 30 dias - risco crítico, inversão, esgotamento';
COMMENT ON FUNCTION generate_receivables_alerts() IS 'Gera alertas de receitas vencidas e inadimplência';
