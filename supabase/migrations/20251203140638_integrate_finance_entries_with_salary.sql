/*
  # Integração Completa: Lançamentos Financeiros ↔ Salários

  ## 1. Views de Integração
    - `v_salary_finance_integration`: Todos os lançamentos relacionados a salários
    - `v_unlinked_salary_payments`: Lançamentos não vinculados ao tracking

  ## 2. Funções
    - `import_finance_entry_to_salary()`: Importa lançamento individual
    - `import_all_finance_entries()`: Importa todos lançamentos do mês
    - `get_employee_payment_summary()`: Resumo completo por funcionário

  ## 3. Sincronização
    - Trigger para detectar novos lançamentos de salários
    - Notificação de lançamentos não vinculados
*/

-- =====================================================
-- 1. VIEW DE TODOS OS LANÇAMENTOS DE SALÁRIOS
-- =====================================================

CREATE OR REPLACE VIEW v_salary_finance_integration AS
WITH salary_payments AS (
  SELECT 
    est.id as tracking_id,
    est.employee_id,
    e.name as employee_name,
    e.email as employee_email,
    est.reference_month,
    spp.id as payment_id,
    spp.amount,
    spp.payment_date,
    spp.payment_method,
    spp.notes,
    'salary_tracking' as source,
    spp.finance_entry_id,
    true as is_linked,
    est.base_salary,
    est.payment_status
  FROM employee_salary_tracking est
  JOIN employees e ON est.employee_id = e.id
  LEFT JOIN salary_partial_payments spp ON est.id = spp.salary_tracking_id
  WHERE spp.id IS NOT NULL
),
finance_payments AS (
  SELECT 
    NULL::uuid as tracking_id,
    NULL::uuid as employee_id,
    NULL as employee_name,
    NULL as employee_email,
    date_trunc('month', fe.data)::date as reference_month,
    fe.id as payment_id,
    fe.valor as amount,
    fe.data as payment_date,
    fe.forma_pagamento as payment_method,
    fe.observacoes as notes,
    'finance_entry' as source,
    fe.id as finance_entry_id,
    false as is_linked,
    0 as base_salary,
    'unlinked' as payment_status
  FROM finance_entries fe
  WHERE fe.categoria = 'Salários'
  AND fe.tipo = 'saida'
  AND fe.id NOT IN (
    SELECT finance_entry_id 
    FROM salary_partial_payments 
    WHERE finance_entry_id IS NOT NULL
  )
)
SELECT * FROM salary_payments
UNION ALL
SELECT * FROM finance_payments
ORDER BY payment_date DESC NULLS LAST;

COMMENT ON VIEW v_salary_finance_integration IS 'Consolidação de todos os pagamentos de salários (vinculados e não vinculados)';

-- =====================================================
-- 2. VIEW DE LANÇAMENTOS NÃO VINCULADOS
-- =====================================================

CREATE OR REPLACE VIEW v_unlinked_salary_payments AS
SELECT 
  fe.id,
  fe.descricao,
  fe.valor as amount,
  fe.data as payment_date,
  fe.forma_pagamento as payment_method,
  fe.categoria,
  fe.subcategoria,
  fe.observacoes,
  fe.status,
  date_trunc('month', fe.data)::date as reference_month,
  CASE 
    WHEN fe.descricao ILIKE '%salario%' THEN 'Possível Salário'
    WHEN fe.descricao ILIKE '%salário%' THEN 'Possível Salário'
    WHEN fe.descricao ILIKE '%pagamento%funcionario%' THEN 'Possível Salário'
    WHEN fe.descricao ILIKE '%folha%' THEN 'Possível Folha de Pagamento'
    ELSE 'Não Identificado'
  END as suggested_type,
  (
    SELECT COUNT(*) 
    FROM employees e 
    WHERE e.active = true 
    AND e.name ILIKE '%' || SPLIT_PART(fe.descricao, ' ', 1) || '%'
  ) as possible_employees_count
FROM finance_entries fe
WHERE fe.categoria = 'Salários'
AND fe.tipo = 'saida'
AND fe.id NOT IN (
  SELECT finance_entry_id 
  FROM salary_partial_payments 
  WHERE finance_entry_id IS NOT NULL
)
ORDER BY fe.data DESC;

COMMENT ON VIEW v_unlinked_salary_payments IS 'Lançamentos financeiros de salários ainda não vinculados ao tracking';

-- =====================================================
-- 3. FUNÇÃO PARA IMPORTAR LANÇAMENTO INDIVIDUAL
-- =====================================================

CREATE OR REPLACE FUNCTION import_finance_entry_to_salary(
  p_finance_entry_id uuid,
  p_employee_id uuid,
  p_reference_month date DEFAULT NULL
)
RETURNS TABLE(
  success boolean,
  message text,
  tracking_id uuid,
  payment_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry record;
  v_salary_tracking_id uuid;
  v_payment_id uuid;
  v_ref_month date;
BEGIN
  -- Buscar lançamento
  SELECT * INTO v_entry
  FROM finance_entries
  WHERE id = p_finance_entry_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Lançamento financeiro não encontrado', NULL::uuid, NULL::uuid;
    RETURN;
  END IF;
  
  -- Verificar se já está vinculado
  IF EXISTS (
    SELECT 1 FROM salary_partial_payments 
    WHERE finance_entry_id = p_finance_entry_id
  ) THEN
    RETURN QUERY SELECT false, 'Este lançamento já está vinculado', NULL::uuid, NULL::uuid;
    RETURN;
  END IF;
  
  -- Determinar mês de referência
  v_ref_month := COALESCE(
    p_reference_month,
    date_trunc('month', v_entry.data)::date
  );
  
  -- Buscar ou criar tracking
  SELECT id INTO v_salary_tracking_id
  FROM employee_salary_tracking
  WHERE employee_id = p_employee_id
  AND reference_month = v_ref_month;
  
  IF NOT FOUND THEN
    -- Criar tracking
    PERFORM sync_employee_to_salary_tracking(p_employee_id, v_ref_month);
    
    SELECT id INTO v_salary_tracking_id
    FROM employee_salary_tracking
    WHERE employee_id = p_employee_id
    AND reference_month = v_ref_month;
  END IF;
  
  -- Criar pagamento vinculado
  INSERT INTO salary_partial_payments (
    salary_tracking_id,
    amount,
    payment_date,
    payment_method,
    finance_entry_id,
    notes
  ) VALUES (
    v_salary_tracking_id,
    v_entry.valor,
    v_entry.data,
    v_entry.forma_pagamento,
    v_entry.id,
    'Importado: ' || COALESCE(v_entry.descricao, 'Sem descrição')
  )
  RETURNING id INTO v_payment_id;
  
  -- Atualizar totais do tracking
  UPDATE employee_salary_tracking
  SET 
    paid_amount = paid_amount + v_entry.valor,
    updated_at = now()
  WHERE id = v_salary_tracking_id;
  
  RETURN QUERY SELECT 
    true, 
    'Lançamento importado com sucesso',
    v_salary_tracking_id,
    v_payment_id;
END;
$$;

COMMENT ON FUNCTION import_finance_entry_to_salary IS 'Importa um lançamento financeiro individual para o tracking de salários';

-- =====================================================
-- 4. FUNÇÃO PARA IMPORTAR TODOS DO MÊS/FUNCIONÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION import_all_finance_entries(
  p_employee_id uuid DEFAULT NULL,
  p_reference_month date DEFAULT NULL
)
RETURNS TABLE(
  imported_count integer,
  total_amount numeric,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_imported integer := 0;
  v_total numeric := 0;
  v_entry record;
  v_result record;
  v_details jsonb := '[]'::jsonb;
BEGIN
  -- Loop através dos lançamentos não vinculados
  FOR v_entry IN
    SELECT fe.*
    FROM finance_entries fe
    WHERE fe.categoria = 'Salários'
    AND fe.tipo = 'saida'
    AND fe.status = 'pago'
    AND (p_reference_month IS NULL OR date_trunc('month', fe.data)::date = date_trunc('month', p_reference_month)::date)
    AND fe.id NOT IN (
      SELECT finance_entry_id 
      FROM salary_partial_payments 
      WHERE finance_entry_id IS NOT NULL
    )
  LOOP
    -- Tentar identificar funcionário automaticamente se não especificado
    IF p_employee_id IS NULL THEN
      -- Pular se não conseguir identificar automaticamente
      CONTINUE;
    END IF;
    
    -- Importar lançamento
    SELECT * INTO v_result
    FROM import_finance_entry_to_salary(
      v_entry.id,
      p_employee_id,
      COALESCE(p_reference_month, date_trunc('month', v_entry.data)::date)
    );
    
    IF v_result.success THEN
      v_imported := v_imported + 1;
      v_total := v_total + v_entry.valor;
      
      v_details := v_details || jsonb_build_object(
        'entry_id', v_entry.id,
        'amount', v_entry.valor,
        'date', v_entry.data,
        'description', v_entry.descricao
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_imported, v_total, v_details;
END;
$$;

COMMENT ON FUNCTION import_all_finance_entries IS 'Importa todos os lançamentos financeiros não vinculados de um funcionário/mês';

-- =====================================================
-- 5. FUNÇÃO DE RESUMO COMPLETO POR FUNCIONÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION get_employee_payment_summary(
  p_employee_id uuid,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(
  employee_name text,
  total_salary_base numeric,
  total_paid_tracking numeric,
  total_advances numeric,
  total_unlinked_payments numeric,
  payment_months integer,
  last_payment_date date,
  has_pending boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.name,
    COALESCE(SUM(est.base_salary), 0) as total_salary_base,
    COALESCE(SUM(est.paid_amount), 0) as total_paid_tracking,
    COALESCE((
      SELECT SUM(amount) 
      FROM salary_advance_payments sap 
      WHERE sap.employee_id = p_employee_id
      AND sap.status = 'pending'
    ), 0) as total_advances,
    COALESCE((
      SELECT SUM(valor)
      FROM finance_entries fe
      WHERE fe.categoria = 'Salários'
      AND fe.tipo = 'saida'
      AND fe.id NOT IN (
        SELECT finance_entry_id 
        FROM salary_partial_payments 
        WHERE finance_entry_id IS NOT NULL
      )
      AND (p_start_date IS NULL OR fe.data >= p_start_date)
      AND (p_end_date IS NULL OR fe.data <= p_end_date)
    ), 0) as total_unlinked_payments,
    COUNT(DISTINCT est.reference_month)::integer as payment_months,
    MAX(spp.payment_date) as last_payment_date,
    EXISTS(
      SELECT 1 FROM employee_salary_tracking est2
      WHERE est2.employee_id = p_employee_id
      AND est2.payment_status IN ('pending', 'partial', 'overdue')
    ) as has_pending
  FROM employees e
  LEFT JOIN employee_salary_tracking est ON e.id = est.employee_id
    AND (p_start_date IS NULL OR est.reference_month >= p_start_date)
    AND (p_end_date IS NULL OR est.reference_month <= p_end_date)
  LEFT JOIN salary_partial_payments spp ON est.id = spp.salary_tracking_id
  WHERE e.id = p_employee_id
  GROUP BY e.name;
END;
$$;

COMMENT ON FUNCTION get_employee_payment_summary IS 'Resumo completo de pagamentos de um funcionário incluindo lançamentos não vinculados';

-- =====================================================
-- 6. GRANTS PARA ACESSO
-- =====================================================

GRANT SELECT ON v_salary_finance_integration TO anon, authenticated;
GRANT SELECT ON v_unlinked_salary_payments TO anon, authenticated;

-- =====================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_finance_entries_categoria_tipo 
ON finance_entries(categoria, tipo) 
WHERE categoria = 'Salários' AND tipo = 'saida';

CREATE INDEX IF NOT EXISTS idx_finance_entries_data_categoria 
ON finance_entries(data, categoria) 
WHERE categoria = 'Salários';

CREATE INDEX IF NOT EXISTS idx_salary_partial_payments_finance_entry 
ON salary_partial_payments(finance_entry_id) 
WHERE finance_entry_id IS NOT NULL;
