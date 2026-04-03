/*
  # Fix v_financial_intelligence for Cash Flow Chart (v2)

  ## Problem
  The view v_financial_intelligence was reading from service_orders and did not expose
  the fields expected by CFODashboard.tsx: `type` (entrada/saida), `amount`, `reference_date`.

  ## Solution
  Drop and recreate the view mapping finance_entries fields to what CFODashboard expects.
*/

DROP VIEW IF EXISTS v_financial_intelligence;

CREATE VIEW v_financial_intelligence AS
SELECT
  id,
  descricao AS description,
  valor AS amount,
  CASE
    WHEN tipo IN ('receita', 'entrada', 'income', 'revenue') THEN 'entrada'
    ELSE 'saida'
  END AS type,
  COALESCE(data_pagamento, data, due_date, data_vencimento)::date AS reference_date,
  categoria AS category,
  status,
  customer_id,
  created_at
FROM finance_entries
WHERE COALESCE(data_pagamento, data, due_date, data_vencimento) IS NOT NULL;

GRANT SELECT ON v_financial_intelligence TO anon, authenticated;
