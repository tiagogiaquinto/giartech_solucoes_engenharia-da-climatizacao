/*
  # Fix v_financial_intelligence — read from finance_entries

  ## Problem
  The v_financial_intelligence view was reading from the `cash_flow` table which
  is empty. All real financial data (1,075 entries) lives in `finance_entries`.

  ## Fix
  Rebuild v_financial_intelligence to read from `finance_entries`, mapping:
    - descricao  → description
    - valor      → amount
    - tipo       → type  (receita/entrada → 'entrada', despesa/saida → 'saida')
    - categoria  → category
    - data / data_vencimento / due_date → reference_date (best available date)

  Time-truncated columns (dia, semana, mes, trimestre) remain identical.
  The `os_id` column is kept as NULL since finance_entries has no direct FK.
*/

DROP VIEW IF EXISTS public.v_financial_intelligence;

CREATE VIEW public.v_financial_intelligence AS
SELECT
  id,
  descricao                                              AS description,
  COALESCE(valor, 0)                                    AS amount,
  CASE
    WHEN LOWER(tipo) IN ('receita', 'entrada', 'income', 'revenue') THEN 'entrada'
    ELSE 'saida'
  END                                                   AS type,
  COALESCE(categoria, subcategoria, 'geral')            AS category,
  COALESCE(data_pagamento, data, data_vencimento, due_date, CURRENT_DATE) AS reference_date,
  NULL::uuid                                            AS os_id,
  created_at,
  date_trunc('day',     COALESCE(data_pagamento, data, data_vencimento, due_date, CURRENT_DATE)::timestamptz) AS dia,
  date_trunc('week',    COALESCE(data_pagamento, data, data_vencimento, due_date, CURRENT_DATE)::timestamptz) AS semana,
  date_trunc('month',   COALESCE(data_pagamento, data, data_vencimento, due_date, CURRENT_DATE)::timestamptz) AS mes,
  date_trunc('quarter', COALESCE(data_pagamento, data, data_vencimento, due_date, CURRENT_DATE)::timestamptz) AS trimestre
FROM public.finance_entries
WHERE status NOT IN ('cancelado', 'cancelada', 'void')
   OR status IS NULL;

GRANT SELECT ON public.v_financial_intelligence TO authenticated, anon;
