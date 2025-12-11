/*
  # Funções Auxiliares e Automações para Sistema de Pagamento

  ## 1. Funções Auxiliares
    - Criar salário do mês com valores pré-calculados
    - Verificar pendências de pagamento
    - Obter histórico completo de pagamentos
    - Cancelar pagamentos

  ## 2. Triggers de Auditoria
    - Log de alterações em pagamentos
    - Validações automáticas

  ## 3. Relatórios e Dashboards
    - Resumo mensal de pagamentos
    - Relatório de vales pendentes
    - Projeção de gastos com folha
*/

-- =====================================================
-- 1. FUNÇÃO PARA CRIAR SALÁRIO DO MÊS AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION create_monthly_salary(
  p_employee_id UUID,
  p_reference_month DATE,
  p_bonuses NUMERIC DEFAULT 0,
  p_discounts NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  salary_tracking_id UUID,
  base_salary NUMERIC,
  gross_amount NUMERIC,
  next_advance_amount NUMERIC,
  next_advance_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_salary_tracking_id UUID;
  v_employee RECORD;
  v_schedule RECORD;
  v_base_salary NUMERIC;
  v_gross_amount NUMERIC;
  v_next_advance NUMERIC;
  v_next_advance_date DATE;
BEGIN
  -- Buscar funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = p_employee_id AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcionário não encontrado ou inativo';
  END IF;
  
  -- Verificar se já existe salário para este mês
  IF EXISTS (
    SELECT 1 FROM employee_salary_tracking
    WHERE employee_id = p_employee_id
    AND reference_month = date_trunc('month', p_reference_month)::DATE
  ) THEN
    RAISE EXCEPTION 'Já existe salário cadastrado para este funcionário neste mês';
  END IF;
  
  -- Buscar configuração
  SELECT * INTO v_schedule
  FROM salary_payment_schedule
  WHERE active = true
  LIMIT 1;
  
  -- Calcular valores
  v_base_salary := v_employee.salary;
  v_gross_amount := v_base_salary + COALESCE(p_bonuses, 0) - COALESCE(p_discounts, 0);
  v_next_advance := v_base_salary * v_schedule.advance_percentage / 100;
  
  -- Calcular próxima data de vale (dia 20 do mês)
  v_next_advance_date := make_date(
    EXTRACT(YEAR FROM p_reference_month)::INTEGER,
    EXTRACT(MONTH FROM p_reference_month)::INTEGER,
    v_schedule.advance_payment_day
  );
  
  -- Criar registro de salário
  INSERT INTO employee_salary_tracking (
    employee_id,
    reference_month,
    base_salary,
    bonuses,
    discounts,
    gross_amount,
    paid_amount,
    remaining_amount,
    payment_status,
    due_date,
    notes
  ) VALUES (
    p_employee_id,
    date_trunc('month', p_reference_month)::DATE,
    v_base_salary,
    COALESCE(p_bonuses, 0),
    COALESCE(p_discounts, 0),
    v_gross_amount,
    0, -- Ainda não pago
    v_gross_amount, -- Tudo pendente
    'pending',
    v_next_advance_date, -- Vence no dia do vale
    p_notes
  )
  RETURNING id INTO v_salary_tracking_id;
  
  RETURN QUERY SELECT 
    v_salary_tracking_id,
    v_base_salary,
    v_gross_amount,
    v_next_advance,
    v_next_advance_date;
END;
$$;

-- =====================================================
-- 2. FUNÇÃO PARA OBTER RESUMO DE PAGAMENTOS DO MÊS
-- =====================================================

CREATE OR REPLACE FUNCTION get_monthly_payment_summary(
  p_reference_month DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_employees BIGINT,
  total_base_salary NUMERIC,
  total_advances_paid NUMERIC,
  total_final_paid NUMERIC,
  total_paid NUMERIC,
  total_pending NUMERIC,
  employees_with_advance BIGINT,
  employees_with_final BIGINT,
  employees_fully_paid BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT e.id)::BIGINT as total_employees,
    COALESCE(SUM(e.salary), 0) as total_base_salary,
    COALESCE(SUM(sap.amount), 0) as total_advances_paid,
    COALESCE(SUM(spp.amount), 0) as total_final_paid,
    COALESCE(SUM(sap.amount), 0) + COALESCE(SUM(spp.amount), 0) as total_paid,
    COALESCE(SUM(est.remaining_amount), 0) as total_pending,
    COUNT(DISTINCT sap.employee_id)::BIGINT as employees_with_advance,
    COUNT(DISTINCT spp.employee_id)::BIGINT as employees_with_final,
    COUNT(DISTINCT CASE WHEN est.payment_status = 'paid' THEN e.id END)::BIGINT as employees_fully_paid
  FROM employees e
  LEFT JOIN employee_salary_tracking est ON 
    e.id = est.employee_id AND 
    est.reference_month = date_trunc('month', p_reference_month)::DATE
  LEFT JOIN salary_advance_payments sap ON 
    e.id = sap.employee_id AND 
    sap.deducted_from_month = date_trunc('month', p_reference_month)::DATE
  LEFT JOIN salary_partial_payments spp ON 
    est.id = spp.salary_tracking_id AND
    spp.payment_type = 'final'
  WHERE e.active = true;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO PARA VERIFICAR PENDÊNCIAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_payments(
  p_payment_type TEXT DEFAULT 'all' -- 'advance', 'final', 'all'
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  reference_month DATE,
  pending_type TEXT,
  expected_amount NUMERIC,
  expected_date DATE,
  days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule RECORD;
BEGIN
  -- Buscar configuração
  SELECT * INTO v_schedule
  FROM salary_payment_schedule
  WHERE active = true
  LIMIT 1;

  RETURN QUERY
  -- Vales pendentes (dia 20)
  SELECT 
    e.id,
    e.name,
    est.reference_month,
    'Vale Dia 20'::TEXT as pending_type,
    (e.salary * v_schedule.advance_percentage / 100) as expected_amount,
    make_date(
      EXTRACT(YEAR FROM est.reference_month)::INTEGER,
      EXTRACT(MONTH FROM est.reference_month)::INTEGER,
      v_schedule.advance_payment_day
    ) as expected_date,
    (CURRENT_DATE - make_date(
      EXTRACT(YEAR FROM est.reference_month)::INTEGER,
      EXTRACT(MONTH FROM est.reference_month)::INTEGER,
      v_schedule.advance_payment_day
    ))::INTEGER as days_overdue
  FROM employees e
  JOIN employee_salary_tracking est ON e.id = est.employee_id
  LEFT JOIN salary_advance_payments sap ON 
    e.id = sap.employee_id AND 
    sap.deducted_from_month = est.reference_month AND
    sap.payment_type = 'advance'
  WHERE e.active = true
  AND est.payment_status != 'paid'
  AND sap.id IS NULL -- Não tem vale registrado
  AND (p_payment_type = 'all' OR p_payment_type = 'advance')
  
  UNION ALL
  
  -- Pagamentos finais pendentes (dia 5)
  SELECT 
    e.id,
    e.name,
    est.reference_month,
    'Pagamento Final Dia 5'::TEXT as pending_type,
    est.remaining_amount as expected_amount,
    make_date(
      EXTRACT(YEAR FROM (est.reference_month + INTERVAL '1 month'))::INTEGER,
      EXTRACT(MONTH FROM (est.reference_month + INTERVAL '1 month'))::INTEGER,
      v_schedule.final_payment_day
    ) as expected_date,
    (CURRENT_DATE - make_date(
      EXTRACT(YEAR FROM (est.reference_month + INTERVAL '1 month'))::INTEGER,
      EXTRACT(MONTH FROM (est.reference_month + INTERVAL '1 month'))::INTEGER,
      v_schedule.final_payment_day
    ))::INTEGER as days_overdue
  FROM employees e
  JOIN employee_salary_tracking est ON e.id = est.employee_id
  LEFT JOIN salary_partial_payments spp ON 
    est.id = spp.salary_tracking_id AND
    spp.payment_type = 'final'
  WHERE e.active = true
  AND est.payment_status != 'paid'
  AND est.remaining_amount > 0
  AND spp.id IS NULL -- Não tem pagamento final registrado
  AND (p_payment_type = 'all' OR p_payment_type = 'final')
  
  ORDER BY expected_date, employee_name;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO PARA CANCELAR VALE
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_advance_payment(
  p_advance_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance RECORD;
  v_salary_tracking RECORD;
BEGIN
  -- Buscar vale
  SELECT * INTO v_advance
  FROM salary_advance_payments
  WHERE id = p_advance_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vale não encontrado';
  END IF;
  
  IF v_advance.status != 'pending' THEN
    RAISE EXCEPTION 'Apenas vales pendentes podem ser cancelados. Status atual: %', v_advance.status;
  END IF;
  
  -- Cancelar lançamento financeiro associado
  IF v_advance.finance_entry_id IS NOT NULL THEN
    UPDATE finance_entries
    SET status = 'cancelado',
        observacoes = COALESCE(observacoes, '') || ' | Cancelado: ' || COALESCE(p_reason, 'Sem motivo')
    WHERE id = v_advance.finance_entry_id;
  END IF;
  
  -- Atualizar vale
  UPDATE salary_advance_payments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes, '') || ' | Cancelado: ' || COALESCE(p_reason, 'Sem motivo')
  WHERE id = p_advance_id;
  
  -- Atualizar salary_tracking (reverter valor pago)
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) - v_advance.amount,
    remaining_amount = COALESCE(remaining_amount, 0) + v_advance.amount,
    updated_at = now()
  WHERE employee_id = v_advance.employee_id
  AND reference_month = v_advance.deducted_from_month;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO PARA CANCELAR PAGAMENTO FINAL
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_final_payment(
  p_payment_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
  v_advance RECORD;
BEGIN
  -- Buscar pagamento
  SELECT * INTO v_payment
  FROM salary_partial_payments
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado';
  END IF;
  
  -- Cancelar lançamento financeiro associado
  IF v_payment.finance_entry_id IS NOT NULL THEN
    UPDATE finance_entries
    SET status = 'cancelado',
        observacoes = COALESCE(observacoes, '') || ' | Cancelado: ' || COALESCE(p_reason, 'Sem motivo')
    WHERE id = v_payment.finance_entry_id;
  END IF;
  
  -- Reverter status dos vales para pending
  UPDATE salary_advance_payments
  SET status = 'pending'
  WHERE employee_id = v_payment.employee_id
  AND deducted_from_month = v_payment.reference_month
  AND status = 'deducted';
  
  -- Atualizar salary_tracking
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) - v_payment.amount,
    remaining_amount = COALESCE(remaining_amount, 0) + v_payment.amount,
    payment_status = 'pending',
    updated_at = now()
  WHERE id = v_payment.salary_tracking_id;
  
  -- Deletar pagamento
  DELETE FROM salary_partial_payments WHERE id = p_payment_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 6. VIEW DE HISTÓRICO COMPLETO
-- =====================================================

CREATE OR REPLACE VIEW v_complete_payment_history AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.cpf,
  
  -- Data e tipo
  COALESCE(sap.advance_date, spp.payment_date) as payment_date,
  COALESCE(sap.deducted_from_month, spp.reference_month) as reference_month,
  CASE 
    WHEN sap.id IS NOT NULL THEN 'Vale Dia 20'
    WHEN spp.id IS NOT NULL THEN 'Pagamento Final Dia 5'
  END as payment_type,
  
  -- Valores
  COALESCE(sap.amount, spp.amount) as amount,
  
  -- Status
  COALESCE(sap.status, 'paid') as status,
  
  -- Integração financeira
  COALESCE(sap.finance_entry_id, spp.finance_entry_id) as finance_entry_id,
  fe.status as finance_status,
  
  -- Observações
  COALESCE(sap.notes, spp.notes) as notes,
  
  -- Timestamps
  COALESCE(sap.created_at, spp.created_at) as created_at

FROM employees e
LEFT JOIN salary_advance_payments sap ON e.id = sap.employee_id
LEFT JOIN salary_partial_payments spp ON e.id = spp.employee_id
LEFT JOIN finance_entries fe ON COALESCE(sap.finance_entry_id, spp.finance_entry_id) = fe.id
WHERE e.active = true
AND (sap.id IS NOT NULL OR spp.id IS NOT NULL)
ORDER BY payment_date DESC, e.name;

-- =====================================================
-- 7. TRIGGER PARA VALIDAR DATAS
-- =====================================================

CREATE OR REPLACE FUNCTION validate_payment_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule RECORD;
BEGIN
  -- Buscar configuração
  SELECT * INTO v_schedule
  FROM salary_payment_schedule
  WHERE active = true
  LIMIT 1;
  
  -- Validar data do vale (deve ser próxima ao dia configurado)
  IF TG_TABLE_NAME = 'salary_advance_payments' THEN
    IF EXTRACT(DAY FROM NEW.advance_date) != v_schedule.advance_payment_day THEN
      RAISE WARNING 'Data do vale (%) diferente do dia configurado (%). Recomenda-se usar dia %.', 
        NEW.advance_date, 
        v_schedule.advance_payment_day,
        v_schedule.advance_payment_day;
    END IF;
  END IF;
  
  -- Validar data do pagamento final (deve ser próxima ao dia configurado)
  IF TG_TABLE_NAME = 'salary_partial_payments' AND NEW.payment_type = 'final' THEN
    IF EXTRACT(DAY FROM NEW.payment_date) != v_schedule.final_payment_day THEN
      RAISE WARNING 'Data do pagamento final (%) diferente do dia configurado (%). Recomenda-se usar dia %.', 
        NEW.payment_date, 
        v_schedule.final_payment_day,
        v_schedule.final_payment_day;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_advance_dates ON salary_advance_payments;
CREATE TRIGGER trg_validate_advance_dates
  BEFORE INSERT OR UPDATE ON salary_advance_payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_dates();

DROP TRIGGER IF EXISTS trg_validate_partial_dates ON salary_partial_payments;
CREATE TRIGGER trg_validate_partial_dates
  BEFORE INSERT OR UPDATE ON salary_partial_payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_dates();

-- =====================================================
-- 8. PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION create_monthly_salary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_monthly_payment_summary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_pending_payments TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cancel_advance_payment TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cancel_final_payment TO authenticated, anon;

GRANT SELECT ON v_complete_payment_history TO authenticated, anon;

-- =====================================================
-- 9. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION create_monthly_salary IS 'Cria registro mensal de salário com cálculos automáticos';
COMMENT ON FUNCTION get_monthly_payment_summary IS 'Resumo consolidado de pagamentos do mês';
COMMENT ON FUNCTION get_pending_payments IS 'Lista pagamentos pendentes (vales e finais)';
COMMENT ON FUNCTION cancel_advance_payment IS 'Cancela vale e reverte valores no tracking';
COMMENT ON FUNCTION cancel_final_payment IS 'Cancela pagamento final e reverte vales';
COMMENT ON VIEW v_complete_payment_history IS 'Histórico completo de todos os pagamentos (vales + finais)';
