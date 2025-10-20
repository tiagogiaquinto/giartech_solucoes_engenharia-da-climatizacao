/*
  # Corrigir Status nas Views Financeiras

  ## Problema
  Views estão usando status 'pendente' mas na tabela são 'a_pagar' e outros

  ## Solução
  Recriar views com status corretos
*/

DROP VIEW IF EXISTS v_consolidated_financial_summary CASCADE;
DROP VIEW IF EXISTS v_margin_analysis CASCADE;

-- ============================================================================
-- VIEW: Resumo Financeiro Consolidado (CORRIGIDA)
-- ============================================================================

CREATE VIEW v_consolidated_financial_summary AS
SELECT
  fp.id as period_id,
  fp.period_name,
  fp.start_date,
  fp.end_date,
  
  -- Receitas
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as total_revenue,
  
  -- Despesas
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as total_expenses,
  
  -- Resultado
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE -fe.valor END), 0) as net_result,
  
  -- Fluxo de caixa
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as cash_inflow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as cash_outflow,
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE -fe.valor END), 0) as net_cash_flow,
  
  -- Contas a receber (status diferente de 'recebido')
  COALESCE(SUM(CASE 
    WHEN fe.tipo = 'receita' AND fe.status != 'recebido' THEN fe.valor 
    ELSE 0 
  END), 0) as accounts_receivable,
  
  -- Contas a pagar (status = 'a_pagar')
  COALESCE(SUM(CASE 
    WHEN fe.tipo = 'despesa' AND fe.status = 'a_pagar' THEN fe.valor 
    ELSE 0 
  END), 0) as accounts_payable

FROM financial_periods fp
LEFT JOIN finance_entries fe ON 
  fe.data >= fp.start_date AND 
  fe.data <= fp.end_date
WHERE fp.period_type = 'monthly'
GROUP BY fp.id, fp.period_name, fp.start_date, fp.end_date;

-- ============================================================================
-- VIEW: Análise de Margens (CORRIGIDA)
-- ============================================================================

CREATE VIEW v_margin_analysis AS
SELECT
  fp.id as period_id,
  fp.period_name,
  
  -- Receitas
  COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0) as revenue,
  
  -- Custos
  COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0) as costs,
  
  -- Margem Bruta
  CASE 
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) - 
           SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) / 
           SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
    ELSE 0
  END as gross_margin_percent,
  
  -- Margem Operacional
  CASE 
    WHEN SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) > 0
    THEN ((SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) - 
           SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END)) / 
           SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END) * 100)
    ELSE 0
  END as operating_margin_percent

FROM financial_periods fp
LEFT JOIN finance_entries fe ON 
  fe.data >= fp.start_date AND 
  fe.data <= fp.end_date
WHERE fp.period_type = 'monthly'
GROUP BY fp.id, fp.period_name;

COMMENT ON VIEW v_consolidated_financial_summary IS 'Resumo financeiro consolidado com status corretos';
COMMENT ON VIEW v_margin_analysis IS 'Análise de margens com status corretos';
