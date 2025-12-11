/*
  # Corrigir Funções - Remover Atualização de Colunas Geradas

  ## Problema
    - remaining_amount é coluna GENERATED ALWAYS
    - gross_amount é coluna GENERATED ALWAYS
    - Não podem ser atualizadas diretamente

  ## Colunas Geradas
    - gross_amount = base_salary + bonuses - discounts
    - remaining_amount = gross_amount - paid_amount

  ## Solução
    - Remover tentativas de atualizar essas colunas
    - Apenas atualizar: paid_amount
    - As colunas geradas se atualizam automaticamente
*/

-- =====================================================
-- 1. CORRIGIR register_monthly_advance
-- =====================================================

CREATE OR REPLACE FUNCTION register_monthly_advance(
  p_employee_id UUID,
  p_reference_month DATE,
  p_amount NUMERIC DEFAULT NULL,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  advance_id UUID,
  finance_entry_id UUID,
  amount_paid NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance_id UUID;
  v_finance_id UUID;
  v_employee RECORD;
  v_bank_account_id UUID;
  v_schedule RECORD;
  v_calculated_amount NUMERIC;
  v_salary_tracking_id UUID;
BEGIN
  -- Buscar funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = p_employee_id AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcionário não encontrado ou inativo';
  END IF;
  
  -- Buscar configuração de cronograma
  SELECT * INTO v_schedule
  FROM salary_payment_schedule
  WHERE active = true
  LIMIT 1;
  
  -- Calcular valor do vale (se não fornecido)
  v_calculated_amount := COALESCE(
    p_amount,
    (v_employee.salary * v_schedule.advance_percentage / 100)
  );
  
  -- Validar valor
  IF v_calculated_amount <= 0 THEN
    RAISE EXCEPTION 'Valor do vale deve ser maior que zero';
  END IF;
  
  IF v_calculated_amount > v_employee.salary THEN
    RAISE EXCEPTION 'Valor do vale não pode ser maior que o salário base';
  END IF;
  
  -- Verificar se já existe vale para este mês
  IF EXISTS (
    SELECT 1 FROM salary_advance_payments
    WHERE employee_id = p_employee_id
    AND deducted_from_month = date_trunc('month', p_reference_month)::DATE
    AND status = 'pending'
    AND payment_type = 'advance'
  ) THEN
    RAISE EXCEPTION 'Já existe vale registrado para este funcionário neste mês';
  END IF;
  
  -- Buscar conta bancária padrão
  SELECT id INTO v_bank_account_id
  FROM bank_accounts
  WHERE is_default = true
  LIMIT 1;
  
  -- Criar lançamento financeiro
  INSERT INTO finance_entries (
    descricao,
    valor,
    tipo,
    categoria,
    status,
    data_vencimento,
    data_pagamento,
    data,
    forma_pagamento,
    bank_account_id,
    employee_id,
    observacoes
  ) VALUES (
    'Vale Dia 20 - ' || v_employee.name || ' - ' || to_char(p_reference_month, 'MM/YYYY'),
    v_calculated_amount,
    'despesa',
    'Salários',
    'pago',
    p_payment_date,
    p_payment_date,
    p_payment_date,
    v_schedule.advance_payment_method,
    v_bank_account_id,
    p_employee_id,
    COALESCE(p_notes, 'Vale mensal - pagamento dia 20')
  )
  RETURNING id INTO v_finance_id;
  
  -- Registrar vale
  INSERT INTO salary_advance_payments (
    employee_id,
    amount,
    advance_date,
    deducted_from_month,
    status,
    payment_type,
    finance_entry_id,
    notes
  ) VALUES (
    p_employee_id,
    v_calculated_amount,
    p_payment_date,
    date_trunc('month', p_reference_month)::DATE,
    'pending',
    'advance',
    v_finance_id,
    p_notes
  )
  RETURNING id INTO v_advance_id;
  
  -- Atualizar salary_tracking se já existir (APENAS paid_amount)
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) + v_calculated_amount,
    updated_at = now()
  WHERE employee_id = p_employee_id
  AND reference_month = date_trunc('month', p_reference_month)::DATE;
  
  RETURN QUERY SELECT v_advance_id, v_finance_id, v_calculated_amount;
END;
$$;

-- =====================================================
-- 2. CORRIGIR cancel_advance_payment
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
  
  -- Atualizar salary_tracking (reverter valor pago) - APENAS paid_amount
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) - v_advance.amount,
    updated_at = now()
  WHERE employee_id = v_advance.employee_id
  AND reference_month = v_advance.deducted_from_month;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 3. CORRIGIR cancel_final_payment
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
  
  -- Atualizar salary_tracking (APENAS paid_amount e payment_status)
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) - v_payment.amount,
    payment_status = 'pending',
    updated_at = now()
  WHERE id = v_payment.salary_tracking_id;
  
  -- Deletar pagamento
  DELETE FROM salary_partial_payments WHERE id = p_payment_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 4. GARANTIR PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION register_monthly_advance TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cancel_advance_payment TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cancel_final_payment TO authenticated, anon;

-- =====================================================
-- 5. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION register_monthly_advance IS 'Registra vale dia 20 - corrigido para não atualizar colunas geradas';
COMMENT ON FUNCTION cancel_advance_payment IS 'Cancela vale - corrigido para não atualizar colunas geradas';
COMMENT ON FUNCTION cancel_final_payment IS 'Cancela pagamento final - corrigido para não atualizar colunas geradas';
