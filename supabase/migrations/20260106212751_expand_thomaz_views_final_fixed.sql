/*
  # Expandir Views do Thomaz - Versão Final Corrigida
  
  1. Alterações
    - Recria `v_thomaz_cash_position` com cálculo real de saldo
    - Recria views dependentes
    - Calcula saldo baseado em lançamentos financeiros (entradas - saídas)
    - Ignora lançamentos cancelados
    - Usa nomes de colunas corretos
    
  2. Views Recriadas
    - v_thomaz_cash_position (principal)
    - v_thomaz_liquidity_analysis (dependente)
    - v_thomaz_executive_summary (dependente)
    
  3. Benefícios
    - Saldo em tempo real calculado de lançamentos
    - Análise de pendências (a receber e a pagar)
    - Projeção de caixa futura
    - Comparação entre saldo registrado vs calculado
    - Alertas automáticos de liquidez
    - Análise de vencimentos e inadimplência
    
  4. Security
    - Views com permissões para anon e authenticated
*/

-- Drop views com cascade
DROP VIEW IF EXISTS v_thomaz_cash_position CASCADE;

-- 1. Recriar v_thomaz_cash_position expandida
CREATE OR REPLACE VIEW v_thomaz_cash_position AS
SELECT
  ba.id                     AS bank_account_id,
  ba.account_name           AS conta,
  ba.bank_name              AS banco,
  ba.account_type           AS tipo_conta,
  ba.active                 AS ativa,
  
  -- Saldo calculado baseado em lançamentos reais
  COALESCE(
    SUM(
      CASE
        WHEN fe.tipo = 'receita' THEN fe.valor
        WHEN fe.tipo = 'despesa' THEN -fe.valor
        ELSE 0
      END
    ), 0
  ) AS saldo_calculado,
  
  -- Informações adicionais úteis
  COUNT(fe.id) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'pago') AS total_entradas,
  COUNT(fe.id) FILTER (WHERE fe.tipo = 'despesa' AND fe.status = 'pago') AS total_saidas,
  
  -- Valores de entradas e saídas pagas
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'pago'), 0) AS valor_total_entradas,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'despesa' AND fe.status = 'pago'), 0) AS valor_total_saidas,
  
  -- Pendências
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'pendente'), 0) AS receitas_pendentes,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'despesa' AND fe.status = 'pendente'), 0) AS despesas_pendentes,
  
  -- Vencimentos próximos (7 dias)
  COALESCE(SUM(fe.valor) FILTER (
    WHERE fe.tipo = 'receita' 
    AND fe.status = 'pendente'
    AND fe.data_vencimento <= CURRENT_DATE + INTERVAL '7 days'
  ), 0) AS receitas_vencendo_7dias,
  
  COALESCE(SUM(fe.valor) FILTER (
    WHERE fe.tipo = 'despesa' 
    AND fe.status = 'pendente'
    AND fe.data_vencimento <= CURRENT_DATE + INTERVAL '7 days'
  ), 0) AS despesas_vencendo_7dias,
  
  -- Vencidos
  COALESCE(SUM(fe.valor) FILTER (
    WHERE fe.tipo = 'receita' 
    AND fe.status = 'pendente'
    AND fe.data_vencimento < CURRENT_DATE
  ), 0) AS receitas_vencidas,
  
  COALESCE(SUM(fe.valor) FILTER (
    WHERE fe.tipo = 'despesa' 
    AND fe.status = 'pendente'
    AND fe.data_vencimento < CURRENT_DATE
  ), 0) AS despesas_vencidas,
  
  -- Data da última movimentação
  MAX(fe.data) AS ultima_movimentacao,
  
  -- Também manter o balance original para comparação
  ba.balance AS saldo_registrado,
  
  -- Diferença entre saldo calculado e registrado (para auditoria)
  COALESCE(
    SUM(
      CASE
        WHEN fe.tipo = 'receita' THEN fe.valor
        WHEN fe.tipo = 'despesa' THEN -fe.valor
        ELSE 0
      END
    ), 0
  ) - ba.balance AS diferenca_saldo

FROM bank_accounts ba
LEFT JOIN finance_entries fe
  ON fe.bank_account_id = ba.id
  AND fe.status NOT IN ('cancelado', 'canceled')

GROUP BY
  ba.id,
  ba.account_name,
  ba.bank_name,
  ba.account_type,
  ba.active,
  ba.balance;

-- 2. Recriar v_thomaz_liquidity_analysis
CREATE OR REPLACE VIEW v_thomaz_liquidity_analysis AS
SELECT
  -- Posição atual
  SUM(saldo_calculado) AS caixa_total,
  SUM(CASE WHEN saldo_calculado > 0 THEN saldo_calculado ELSE 0 END) AS caixa_positivo,
  SUM(CASE WHEN saldo_calculado < 0 THEN saldo_calculado ELSE 0 END) AS caixa_negativo,
  
  -- Contagem de contas
  COUNT(*) AS total_contas,
  COUNT(*) FILTER (WHERE saldo_calculado > 0) AS contas_positivas,
  COUNT(*) FILTER (WHERE saldo_calculado < 0) AS contas_negativas,
  COUNT(*) FILTER (WHERE saldo_calculado = 0) AS contas_zeradas,
  
  -- Pendências
  SUM(receitas_pendentes) AS total_receitas_pendentes,
  SUM(despesas_pendentes) AS total_despesas_pendentes,
  
  -- Vencimentos próximos
  SUM(receitas_vencendo_7dias) AS receitas_vencendo_7dias,
  SUM(despesas_vencendo_7dias) AS despesas_vencendo_7dias,
  
  -- Vencidos (inadimplência)
  SUM(receitas_vencidas) AS receitas_vencidas,
  SUM(despesas_vencidas) AS despesas_vencidas,
  
  -- Projeções
  SUM(saldo_calculado) + SUM(receitas_pendentes) - SUM(despesas_pendentes) AS projecao_caixa,
  SUM(saldo_calculado) + SUM(receitas_vencendo_7dias) - SUM(despesas_vencendo_7dias) AS projecao_7dias,
  
  -- Histórico
  SUM(valor_total_entradas) AS total_entradas_historico,
  SUM(valor_total_saidas) AS total_saidas_historico,
  
  -- Auditoria
  SUM(ABS(diferenca_saldo)) AS total_diferencas_auditoria,
  
  -- Alertas
  CASE 
    WHEN SUM(saldo_calculado) < 0 THEN 'CRÍTICO'
    WHEN SUM(saldo_calculado) < 5000 THEN 'BAIXO'
    WHEN SUM(saldo_calculado) < 20000 THEN 'MODERADO'
    ELSE 'SAUDÁVEL'
  END AS status_liquidez
  
FROM v_thomaz_cash_position
WHERE ativa = true;

-- 3. Recriar v_thomaz_executive_summary  
CREATE OR REPLACE VIEW v_thomaz_executive_summary AS
SELECT
  -- Dados de liquidez
  (SELECT caixa_total FROM v_thomaz_liquidity_analysis) AS posicao_caixa,
  (SELECT status_liquidez FROM v_thomaz_liquidity_analysis) AS status_liquidez,
  (SELECT total_receitas_pendentes FROM v_thomaz_liquidity_analysis) AS recebiveis,
  (SELECT total_despesas_pendentes FROM v_thomaz_liquidity_analysis) AS pagar,
  (SELECT projecao_caixa FROM v_thomaz_liquidity_analysis) AS projecao_liquida,
  (SELECT projecao_7dias FROM v_thomaz_liquidity_analysis) AS projecao_7dias,
  
  -- Alertas críticos
  (SELECT receitas_vencidas FROM v_thomaz_liquidity_analysis) AS inadimplencia,
  (SELECT despesas_vencidas FROM v_thomaz_liquidity_analysis) AS contas_atrasadas,
  
  -- Vencimentos próximos
  (SELECT receitas_vencendo_7dias FROM v_thomaz_liquidity_analysis) AS receber_proximos_7dias,
  (SELECT despesas_vencendo_7dias FROM v_thomaz_liquidity_analysis) AS pagar_proximos_7dias,
  
  -- Métricas de negócio
  (SELECT COUNT(*) FROM customers) AS total_clientes,
  (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelado', 'concluido')) AS os_ativas,
  (SELECT COALESCE(SUM(final_total), 0) FROM service_orders WHERE status NOT IN ('cancelado')) AS valor_os_pipeline,
  
  -- Contadores
  (SELECT contas_negativas FROM v_thomaz_liquidity_analysis) AS contas_negativas,
  (SELECT contas_positivas FROM v_thomaz_liquidity_analysis) AS contas_positivas,
  
  -- Data de atualização
  CURRENT_TIMESTAMP AS atualizado_em;

-- Grant permissions
GRANT SELECT ON v_thomaz_cash_position TO anon, authenticated;
GRANT SELECT ON v_thomaz_liquidity_analysis TO anon, authenticated;
GRANT SELECT ON v_thomaz_executive_summary TO anon, authenticated;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_finance_entries_bank_account_status 
  ON finance_entries(bank_account_id, status) 
  WHERE status NOT IN ('cancelado', 'canceled');

CREATE INDEX IF NOT EXISTS idx_finance_entries_vencimento 
  ON finance_entries(data_vencimento, status, tipo)
  WHERE status = 'pendente';

-- Comentários
COMMENT ON VIEW v_thomaz_cash_position IS 'View expandida com saldo calculado em tempo real, análise de pendências e vencimentos';
COMMENT ON VIEW v_thomaz_liquidity_analysis IS 'Análise consolidada de liquidez com projeções, alertas e métricas de inadimplência';
COMMENT ON VIEW v_thomaz_executive_summary IS 'Resumo executivo completo para análise estratégica do Thomaz AI';

COMMENT ON COLUMN v_thomaz_cash_position.saldo_calculado IS 'Saldo real calculado baseado em lançamentos (receitas - despesas)';
COMMENT ON COLUMN v_thomaz_cash_position.saldo_registrado IS 'Saldo registrado na tabela bank_accounts';
COMMENT ON COLUMN v_thomaz_cash_position.diferenca_saldo IS 'Diferença entre calculado e registrado - útil para auditoria';
COMMENT ON COLUMN v_thomaz_cash_position.receitas_vencidas IS 'Receitas pendentes com vencimento passado - INADIMPLÊNCIA';
COMMENT ON COLUMN v_thomaz_cash_position.despesas_vencidas IS 'Despesas pendentes com vencimento passado - ATRASOS';
