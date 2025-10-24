/*
  # Ativar Todas as Melhorias - Versão Corrigida
  
  Sinônimos, Padrões NLP e Funções Auxiliares
*/

-- =====================================================
-- 1. LIMPAR E INSERIR SINÔNIMOS
-- =====================================================

DELETE FROM thomaz_synonyms WHERE word IN (
  'salvar', 'cancelar', 'enviar', 'receber', 'pagar', 'cobrar', 
  'duplicar', 'importar', 'exportar', 'aprovado', 'reprovado', 
  'agendado', 'atrasado', 'urgente', 'funcionário', 'fornecedor',
  'equipamento', 'documento', 'contrato', 'proposta', 'faturamento',
  'custo', 'desconto', 'acréscimo', 'saldo', 'parcela', 'diário',
  'semanal', 'quinzenal', 'trimestral', 'semestral', 'anual',
  'meta', 'resultado', 'indicador', 'produtividade', 'melhor',
  'pior', 'maior', 'menor', 'rápido', 'lento'
);

INSERT INTO thomaz_synonyms (word, synonyms, category) VALUES
('salvar', '["gravar", "guardar", "persistir"]'::jsonb, 'ação'),
('cancelar', '["abortar", "desistir", "interromper"]'::jsonb, 'ação'),
('enviar', '["mandar", "transmitir", "despachar"]'::jsonb, 'ação'),
('receber', '["obter", "ganhar", "conseguir"]'::jsonb, 'ação'),
('pagar', '["quitar", "liquidar", "saldar"]'::jsonb, 'ação'),
('cobrar', '["faturar", "debitar", "lançar"]'::jsonb, 'ação'),
('duplicar', '["copiar", "replicar", "clonar"]'::jsonb, 'ação'),
('importar', '["carregar", "trazer"]'::jsonb, 'ação'),
('exportar', '["extrair", "baixar", "gerar"]'::jsonb, 'ação'),
('aprovado', '["aceito", "validado", "ok"]'::jsonb, 'status'),
('reprovado', '["negado", "rejeitado"]'::jsonb, 'status'),
('agendado', '["marcado", "programado"]'::jsonb, 'status'),
('atrasado', '["vencido", "em atraso"]'::jsonb, 'status'),
('urgente', '["prioritário", "crítico"]'::jsonb, 'status'),
('funcionário', '["colaborador", "empregado", "staff"]'::jsonb, 'entidade'),
('fornecedor', '["supplier", "vendedor"]'::jsonb, 'entidade'),
('equipamento', '["máquina", "ferramenta"]'::jsonb, 'entidade'),
('documento', '["arquivo", "registro"]'::jsonb, 'entidade'),
('contrato', '["acordo", "termo"]'::jsonb, 'entidade'),
('proposta', '["orçamento", "cotação"]'::jsonb, 'entidade'),
('faturamento', '["receita bruta", "vendas"]'::jsonb, 'financeiro'),
('custo', '["gasto", "despesa"]'::jsonb, 'financeiro'),
('desconto', '["abatimento", "redução"]'::jsonb, 'financeiro'),
('acréscimo', '["juros", "multa"]'::jsonb, 'financeiro'),
('saldo', '["balance", "disponível"]'::jsonb, 'financeiro'),
('parcela', '["prestação", "quota"]'::jsonb, 'financeiro'),
('diário', '["por dia", "daily"]'::jsonb, 'tempo'),
('semanal', '["por semana", "weekly"]'::jsonb, 'tempo'),
('quinzenal', '["a cada 15 dias"]'::jsonb, 'tempo'),
('trimestral', '["a cada 3 meses"]'::jsonb, 'tempo'),
('semestral', '["a cada 6 meses"]'::jsonb, 'tempo'),
('anual', '["por ano", "yearly"]'::jsonb, 'tempo'),
('meta', '["objetivo", "target", "goal"]'::jsonb, 'metrica'),
('resultado', '["desempenho", "performance"]'::jsonb, 'metrica'),
('indicador', '["métrica", "kpi", "índice"]'::jsonb, 'metrica'),
('produtividade', '["eficiência", "rendimento"]'::jsonb, 'metrica'),
('melhor', '["ótimo", "excelente", "top"]'::jsonb, 'qualificador'),
('pior', '["ruim", "inferior", "baixo"]'::jsonb, 'qualificador'),
('maior', '["superior", "mais alto"]'::jsonb, 'qualificador'),
('menor', '["inferior", "mais baixo"]'::jsonb, 'qualificador'),
('rápido', '["ágil", "veloz", "quick"]'::jsonb, 'qualificador'),
('lento', '["demorado", "slow"]'::jsonb, 'qualificador');

-- =====================================================
-- 2. PADRÕES NLP ADICIONAIS
-- =====================================================

INSERT INTO thomaz_nlp_patterns (pattern, intent, response_template, keywords, confidence) VALUES
('(exportar|baixar) (.*)',
 'exportar_dados',
 'Gerando arquivo...',
 '["exportar", "baixar"]'::jsonb,
 0.80),

('(qual|como est[aá]) (o status|situa[çc][ãa]o) (.*)',
 'consultar_status',
 'Consultando status...',
 '["status", "situação"]'::jsonb,
 0.75),

('(preciso|quero) (criar|adicionar) (.*)',
 'comando_criar',
 'Vou ajudar...',
 '["criar", "adicionar"]'::jsonb,
 0.75),

('(me ajuda|preciso de ajuda) (.*)',
 'solicitar_ajuda',
 'Claro! Vou te ajudar...',
 '["ajuda", "socorro"]'::jsonb,
 0.75),

('(resumo|sum[aá]rio) (.*)',
 'gerar_resumo',
 'Gerando resumo...',
 '["resumo", "sumário"]'::jsonb,
 0.75),

('(hist[oó]rico|evolu[çc][ãa]o) (.*)',
 'buscar_historico',
 'Buscando histórico...',
 '["histórico", "evolução"]'::jsonb,
 0.75),

('(otimize|melhore) (.*)',
 'otimizar_processo',
 'Analisando melhorias...',
 '["otimize", "melhore"]'::jsonb,
 0.75)

ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. SUGESTÕES INTELIGENTES
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_smart_suggestions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suggestions JSONB := '[]';
  v_os_pend INTEGER;
  v_os_atras INTEGER;
  v_estoque INTEGER;
  v_vencidos INTEGER;
  v_vencendo INTEGER;
BEGIN
  -- OSs Pendentes
  SELECT COUNT(*) INTO v_os_pend
  FROM service_orders WHERE status = 'pending';
  
  IF v_os_pend > 0 THEN
    suggestions := suggestions || jsonb_build_object(
      'tipo', 'acao',
      'prioridade', 'alta',
      'icone', '📋',
      'titulo', 'OSs Pendentes',
      'mensagem', format('%s ordem(ns) aguardando', v_os_pend),
      'acao', 'Ver OSs'
    );
  END IF;
  
  -- OSs Atrasadas
  SELECT COUNT(*) INTO v_os_atras
  FROM service_orders
  WHERE status IN ('pending', 'in_progress')
  AND scheduled_at < CURRENT_DATE;
  
  IF v_os_atras > 0 THEN
    suggestions := suggestions || jsonb_build_object(
      'tipo', 'urgente',
      'prioridade', 'critica',
      'icone', '🚨',
      'titulo', 'OSs ATRASADAS',
      'mensagem', format('%s ordem(ns) atrasadas!', v_os_atras),
      'acao', 'Ver URGENTE'
    );
  END IF;
  
  -- Estoque Baixo
  SELECT COUNT(*) INTO v_estoque
  FROM materials WHERE quantity < 10;
  
  IF v_estoque > 0 THEN
    suggestions := suggestions || jsonb_build_object(
      'tipo', 'alerta',
      'prioridade', 'media',
      'icone', '📦',
      'titulo', 'Estoque Baixo',
      'mensagem', format('%s item(ns) precisam reposição', v_estoque),
      'acao', 'Ver Itens'
    );
  END IF;
  
  -- Vencidos
  SELECT COUNT(*) INTO v_vencidos
  FROM finance_entries
  WHERE status = 'pendente' AND data < CURRENT_DATE;
  
  IF v_vencidos > 0 THEN
    suggestions := suggestions || jsonb_build_object(
      'tipo', 'urgente',
      'prioridade', 'critica',
      'icone', '💰',
      'titulo', 'Lançamentos VENCIDOS',
      'mensagem', format('%s em atraso!', v_vencidos),
      'acao', 'Ver AGORA'
    );
  END IF;
  
  -- Vencendo
  SELECT COUNT(*) INTO v_vencendo
  FROM finance_entries
  WHERE status = 'pendente'
  AND data BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
  
  IF v_vencendo > 0 THEN
    suggestions := suggestions || jsonb_build_object(
      'tipo', 'alerta',
      'prioridade', 'alta',
      'icone', '⏰',
      'titulo', 'Vencimentos Próximos',
      'mensagem', format('%s vencem em 7 dias', v_vencendo),
      'acao', 'Ver Próximos'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'sugestoes', suggestions,
    'total', jsonb_array_length(suggestions),
    'has_critico', v_os_atras > 0 OR v_vencidos > 0,
    'timestamp', NOW()
  );
END;
$$;

-- =====================================================
-- 4. RESPOSTAS RÁPIDAS
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_quick_responses(
  user_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_lower TEXT;
  response JSONB;
BEGIN
  query_lower := LOWER(TRIM(user_query));
  
  CASE
    WHEN query_lower ~ '^(dashboard|painel)$' THEN
      response := jsonb_build_object(
        'tipo', 'shortcut',
        'resposta', 'Abrindo Dashboard...',
        'acao', 'navigate',
        'destino', '/dashboard'
      );
    
    WHEN query_lower ~ '^(os|ordens)$' THEN
      response := jsonb_build_object(
        'tipo', 'shortcut',
        'resposta', 'Abrindo OSs...',
        'acao', 'navigate',
        'destino', '/service-orders'
      );
    
    WHEN query_lower ~ '^(financeiro)$' THEN
      response := jsonb_build_object(
        'tipo', 'shortcut',
        'resposta', 'Abrindo Financeiro...',
        'acao', 'navigate',
        'destino', '/financial'
      );
    
    WHEN query_lower ~ '^(clientes)$' THEN
      response := jsonb_build_object(
        'tipo', 'shortcut',
        'resposta', 'Abrindo Clientes...',
        'acao', 'navigate',
        'destino', '/clients'
      );
    
    WHEN query_lower ~ '^(estoque)$' THEN
      response := jsonb_build_object(
        'tipo', 'shortcut',
        'resposta', 'Abrindo Estoque...',
        'acao', 'navigate',
        'destino', '/inventory'
      );
    
    WHEN query_lower ~ '^(ajuda|help)$' THEN
      response := jsonb_build_object(
        'tipo', 'ajuda',
        'resposta', '🆘 Como posso ajudar?',
        'opcoes', '["Dashboard", "Criar OS", "Financeiro", "Clientes"]'::jsonb
      );
    
    ELSE
      response := NULL;
  END CASE;
  
  RETURN response;
END;
$$;

-- =====================================================
-- 5. ANÁLISE COMPLETA
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_complete_analysis()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'tipo', 'analise_completa',
    'timestamp', NOW(),
    'crescimento', thomaz_analyze_growth(),
    'oportunidades', thomaz_identify_opportunities(),
    'performance', thomaz_performance_insights(),
    'saude', thomaz_analyze_business_health(),
    'previsao', thomaz_predict_revenue(),
    'sugestoes', thomaz_smart_suggestions()
  );
END;
$$;

-- =====================================================
-- Permissões
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_quick_responses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_smart_suggestions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_complete_analysis TO anon, authenticated;
