/*
  # Criar Views para Dashboard Financeiro

  1. Views Criadas
    - `v_financial_summary` - Resumo financeiro consolidado
    - `v_financial_monthly_trend` - Tendências mensais
    - `v_financial_categories_summary` - Resumo por categoria
    
  2. Dados em Tempo Real
    - Receitas recebidas e a receber
    - Despesas pagas e a pagar
    - Análise por categoria
    - Tendências mensais
*/

-- View de resumo financeiro consolidado
CREATE OR REPLACE VIEW v_financial_summary AS
SELECT
  -- Receitas
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS receitas_recebidas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber'), 0) AS receitas_a_receber,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) AS receitas_total,
  
  -- Despesas
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS despesas_pagas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar'), 0) AS despesas_a_pagar,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa'), 0) AS despesas_total,
  
  -- Saldos
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) -
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS saldo_realizado,
  
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita'), 0) -
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa'), 0) AS saldo_previsto,
  
  -- Contadores
  COUNT(*) FILTER (WHERE tipo = 'receita') AS total_lancamentos_receita,
  COUNT(*) FILTER (WHERE tipo = 'despesa') AS total_lancamentos_despesa,
  COUNT(*) FILTER (WHERE tipo = 'receita' AND status = 'a_receber') AS total_a_receber,
  COUNT(*) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar') AS total_a_pagar,
  
  -- Vencimentos
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber' AND data_vencimento < CURRENT_DATE), 0) AS receitas_vencidas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar' AND data_vencimento < CURRENT_DATE), 0) AS despesas_vencidas,
  COUNT(*) FILTER (WHERE tipo = 'receita' AND status = 'a_receber' AND data_vencimento < CURRENT_DATE) AS total_receitas_vencidas,
  COUNT(*) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar' AND data_vencimento < CURRENT_DATE) AS total_despesas_vencidas,
  
  CURRENT_TIMESTAMP AS calculated_at
FROM finance_entries
WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

-- View de tendências mensais
CREATE OR REPLACE VIEW v_financial_monthly_trend AS
SELECT
  DATE_TRUNC('month', data) AS mes,
  TO_CHAR(data, 'Mon/YYYY') AS mes_nome,
  
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) AS receitas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS despesas,
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido'), 0) -
  COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago'), 0) AS saldo,
  
  COUNT(*) FILTER (WHERE tipo = 'receita') AS qtd_receitas,
  COUNT(*) FILTER (WHERE tipo = 'despesa') AS qtd_despesas
FROM finance_entries
WHERE data >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', data), TO_CHAR(data, 'Mon/YYYY')
ORDER BY mes DESC;

-- View de resumo por categoria
CREATE OR REPLACE VIEW v_financial_categories_summary AS
WITH totals_by_type AS (
  SELECT 
    tipo,
    SUM(valor) AS total_tipo
  FROM finance_entries
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY tipo
)
SELECT
  COALESCE(fc.name, 'Sem Categoria') AS categoria,
  fe.tipo,
  COUNT(*) AS total_lancamentos,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.status IN ('recebido', 'pago')), 0) AS total_realizado,
  COALESCE(SUM(fe.valor) FILTER (WHERE fe.status IN ('a_receber', 'a_pagar')), 0) AS total_pendente,
  COALESCE(SUM(fe.valor), 0) AS total_geral,
  ROUND(
    CASE 
      WHEN tbt.total_tipo > 0 THEN
        (SUM(fe.valor) * 100.0 / tbt.total_tipo)
      ELSE 0
    END, 2
  ) AS percentual
FROM finance_entries fe
LEFT JOIN financial_categories fc ON fe.category_id = fc.id
LEFT JOIN totals_by_type tbt ON fe.tipo = tbt.tipo
WHERE EXTRACT(YEAR FROM fe.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY fc.name, fe.tipo, tbt.total_tipo
ORDER BY fe.tipo, total_geral DESC;

-- Grant permissions
GRANT SELECT ON v_financial_summary TO anon, authenticated;
GRANT SELECT ON v_financial_monthly_trend TO anon, authenticated;
GRANT SELECT ON v_financial_categories_summary TO anon, authenticated;
