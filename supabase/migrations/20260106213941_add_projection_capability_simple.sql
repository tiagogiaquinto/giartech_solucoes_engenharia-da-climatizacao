/*
  # Adicionar Capacidade de Projeção de Caixa 30 Dias
  
  1. Nova Capacidade
    - Adiciona capacidade "cash_projection_30d" ao sistema de inteligência do Thomaz
    - Permite análise preditiva de curto prazo  
    - Identifica riscos futuros automaticamente
    
  2. Integração
    - Conecta com as views v_thomaz_future_commitments_30d e v_thomaz_cash_projection_30d
    - Fornece insights sobre esgotamento de contas
    - Alertas de inversão de saldo
    
  3. Método de Análise
    - O método analyzeCashProjection30d() foi adicionado ao thomazUltraService.ts
    - Gera análise completa com alertas e recomendações
*/

-- Verificar se já existe e deletar se existir
DELETE FROM thomaz_analytical_capabilities WHERE capability_name = 'cash_projection_30d';

-- Inserir nova capacidade analítica
INSERT INTO thomaz_analytical_capabilities (
  capability_name,
  capability_type,
  description,
  related_views,
  related_tables,
  trigger_keywords,
  analysis_depth,
  requires_context,
  is_active
) VALUES (
  'cash_projection_30d',
  'predictive_financial',
  'Projeção de caixa para os próximos 30 dias com análise de risco, alertas de esgotamento de saldo, identificação de inversão positivo->negativo, e estimativa de dias até zerar conta',
  ARRAY[
    'v_thomaz_cash_projection_30d',
    'v_thomaz_future_commitments_30d',
    'v_thomaz_cash_position'
  ],
  ARRAY[
    'finance_entries',
    'bank_accounts'
  ],
  ARRAY[
    'projeção',
    'projetar',
    'futuro',
    'próximos 30 dias',
    'próximos dias',
    'daqui 30 dias',
    'daqui a 30 dias',
    'próximo mês',
    'mês que vem',
    'tendência',
    'previsão',
    'estimativa',
    'vai acabar',
    'vai esgotar',
    'vai zerar',
    'risco futuro',
    'dias até',
    'quando vai acabar',
    'quanto tempo tenho',
    'alerta futuro',
    'inversão de saldo',
    'saldo projetado',
    'projeção 30 dias',
    'análise preditiva',
    'perspectiva',
    'horizonte'
  ],
  'comprehensive',
  false,
  true
);

-- Comentário descritivo
COMMENT ON TABLE thomaz_analytical_capabilities IS 'Capacidades analíticas do Thomaz AI - define quais análises ele pode realizar automaticamente com base em keywords e contexto';
