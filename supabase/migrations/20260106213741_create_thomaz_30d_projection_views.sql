/*
  # Criar Views de Compromissos Futuros 30 Dias para Thomaz
  
  1. Novas Views
    - `v_thomaz_future_commitments_30d` - Compromissos próximos 30 dias
    - `v_thomaz_cash_projection_30d` - Projeção de caixa com análise de risco
    
  2. Benefícios
    - Visão de curto prazo (30 dias) do fluxo de caixa
    - Identificação de contas que terão entrada/saída significativa
    - Base para alertas de insuficiência de caixa futuro
    - Planejamento de transferências preventivas
    - Análise de risco automatizada
    - Estimativa de dias até esgotamento do saldo
    
  3. Campos Principais
    - impacto_30d: Impacto líquido (receitas - despesas)
    - saldo_projetado_30d: Saldo estimado em 30 dias
    - status_risco_30d: CRITICO/ALTO/MODERADO/SAUDAVEL
    - alerta_inversao_saldo: TRUE se vai de positivo para negativo
    - dias_ate_esgotamento: Estimativa de dias até zerar
    
  4. Security
    - Views com permissões para anon e authenticated
*/

-- Drop views se existirem
DROP VIEW IF EXISTS v_thomaz_cash_projection_30d CASCADE;
DROP VIEW IF EXISTS v_thomaz_future_commitments_30d CASCADE;

-- 1. Criar view de compromissos futuros 30 dias
CREATE OR REPLACE VIEW v_thomaz_future_commitments_30d AS
SELECT
  fe.bank_account_id,
  
  -- Impacto líquido nos próximos 30 dias (receitas - despesas)
  COALESCE(
    SUM(
      CASE
        WHEN fe.tipo = 'receita' THEN fe.valor
        WHEN fe.tipo = 'despesa' THEN -fe.valor
        ELSE 0
      END
    ), 0
  ) AS impacto_30d,
  
  -- Detalhamento adicional útil
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita'), 0) AS receitas_30d,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'despesa'), 0) AS despesas_30d,
  
  -- Contadores
  COUNT(*) FILTER (WHERE fe.tipo = 'receita') AS qtd_receitas_30d,
  COUNT(*) FILTER (WHERE fe.tipo = 'despesa') AS qtd_despesas_30d,
  
  -- Média diária de impacto
  COALESCE(
    SUM(
      CASE
        WHEN fe.tipo = 'receita' THEN fe.valor
        WHEN fe.tipo = 'despesa' THEN -fe.valor
        ELSE 0
      END
    ), 0
  ) / 30.0 AS impacto_medio_diario,
  
  -- Primeira e última data de vencimento no período
  MIN(fe.data_vencimento) AS primeiro_vencimento,
  MAX(fe.data_vencimento) AS ultimo_vencimento

FROM finance_entries fe
WHERE fe.data_vencimento > CURRENT_DATE
  AND fe.data_vencimento <= CURRENT_DATE + INTERVAL '30 days'
  AND fe.status IN ('pendente', 'confirmado')
  
GROUP BY fe.bank_account_id;

-- 2. Criar view consolidada de projeção de caixa com compromissos
CREATE OR REPLACE VIEW v_thomaz_cash_projection_30d AS
SELECT
  cp.bank_account_id,
  cp.conta,
  cp.banco,
  cp.tipo_conta,
  cp.ativa,
  
  -- Posição atual
  cp.saldo_calculado AS saldo_atual,
  
  -- Pendências já existentes
  cp.receitas_pendentes AS receitas_pendentes_total,
  cp.despesas_pendentes AS despesas_pendentes_total,
  
  -- Compromissos 30 dias específicos
  COALESCE(fc.impacto_30d, 0) AS impacto_30d,
  COALESCE(fc.receitas_30d, 0) AS receitas_30d,
  COALESCE(fc.despesas_30d, 0) AS despesas_30d,
  COALESCE(fc.qtd_receitas_30d, 0) AS qtd_receitas_30d,
  COALESCE(fc.qtd_despesas_30d, 0) AS qtd_despesas_30d,
  COALESCE(fc.impacto_medio_diario, 0) AS impacto_medio_diario,
  fc.primeiro_vencimento,
  fc.ultimo_vencimento,
  
  -- Projeção de saldo 30 dias
  cp.saldo_calculado + COALESCE(fc.impacto_30d, 0) AS saldo_projetado_30d,
  
  -- Status de risco baseado na projeção
  CASE
    WHEN cp.saldo_calculado + COALESCE(fc.impacto_30d, 0) < 0 THEN 'RISCO_CRITICO'
    WHEN cp.saldo_calculado + COALESCE(fc.impacto_30d, 0) < 1000 THEN 'RISCO_ALTO'
    WHEN cp.saldo_calculado + COALESCE(fc.impacto_30d, 0) < 5000 THEN 'RISCO_MODERADO'
    ELSE 'SAUDAVEL'
  END AS status_risco_30d,
  
  -- Alertas críticos
  CASE
    WHEN cp.saldo_calculado > 0 AND (cp.saldo_calculado + COALESCE(fc.impacto_30d, 0)) < 0 
      THEN true
    ELSE false
  END AS alerta_inversao_saldo,
  
  CASE
    WHEN cp.saldo_calculado < 5000 AND (cp.saldo_calculado + COALESCE(fc.impacto_30d, 0)) < cp.saldo_calculado
      THEN true
    ELSE false
  END AS alerta_reducao_critica,
  
  -- Dias até esgotamento (se impacto médio for negativo)
  CASE
    WHEN COALESCE(fc.impacto_medio_diario, 0) < 0 
      THEN ROUND((cp.saldo_calculado / ABS(fc.impacto_medio_diario))::numeric, 0)
    ELSE NULL
  END AS dias_ate_esgotamento,
  
  -- Percentual de variação esperada
  CASE
    WHEN cp.saldo_calculado <> 0
      THEN ROUND((COALESCE(fc.impacto_30d, 0) / cp.saldo_calculado * 100)::numeric, 2)
    ELSE NULL
  END AS percentual_variacao

FROM v_thomaz_cash_position cp
LEFT JOIN v_thomaz_future_commitments_30d fc
  ON fc.bank_account_id = cp.bank_account_id
WHERE cp.ativa = true;

-- Grant permissions
GRANT SELECT ON v_thomaz_future_commitments_30d TO anon, authenticated;
GRANT SELECT ON v_thomaz_cash_projection_30d TO anon, authenticated;

-- Criar índices para performance (sem WHERE com funções não-immutable)
CREATE INDEX IF NOT EXISTS idx_finance_entries_vencimento_status_tipo
  ON finance_entries(bank_account_id, data_vencimento, status, tipo);

-- Comentários detalhados
COMMENT ON VIEW v_thomaz_future_commitments_30d IS 'Compromissos financeiros dos próximos 30 dias por conta bancária - usado para projeções de curto prazo';
COMMENT ON VIEW v_thomaz_cash_projection_30d IS 'Projeção completa de caixa com análise de risco, alertas e estimativa de esgotamento para 30 dias';

COMMENT ON COLUMN v_thomaz_future_commitments_30d.impacto_30d IS 'Impacto líquido nos próximos 30 dias (receitas - despesas futuras)';
COMMENT ON COLUMN v_thomaz_future_commitments_30d.impacto_medio_diario IS 'Média diária de impacto (útil para estimar dias até esgotamento)';

COMMENT ON COLUMN v_thomaz_cash_projection_30d.saldo_atual IS 'Saldo calculado atual da conta';
COMMENT ON COLUMN v_thomaz_cash_projection_30d.saldo_projetado_30d IS 'Saldo projetado para 30 dias (atual + impacto_30d)';
COMMENT ON COLUMN v_thomaz_cash_projection_30d.status_risco_30d IS 'Classificação de risco: RISCO_CRITICO (<0), RISCO_ALTO (<1k), RISCO_MODERADO (<5k), SAUDAVEL (>=5k)';
COMMENT ON COLUMN v_thomaz_cash_projection_30d.alerta_inversao_saldo IS 'TRUE se saldo vai de positivo para negativo nos próximos 30 dias - ATENÇÃO CRÍTICA';
COMMENT ON COLUMN v_thomaz_cash_projection_30d.alerta_reducao_critica IS 'TRUE se conta já está baixa e vai reduzir mais - ATENÇÃO';
COMMENT ON COLUMN v_thomaz_cash_projection_30d.dias_ate_esgotamento IS 'Estimativa de dias até o saldo zerar (baseado em impacto médio diário negativo)';
COMMENT ON COLUMN v_thomaz_cash_projection_30d.percentual_variacao IS 'Percentual de variação esperada do saldo em 30 dias';
