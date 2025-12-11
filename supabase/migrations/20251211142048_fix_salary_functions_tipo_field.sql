/*
  # Corrigir Campo 'tipo' nas Funções de Salário

  ## Problema
    - Funções usando 'saida' no campo tipo
    - Tabela finance_entries só aceita 'receita' ou 'despesa'
    - Constraint: CHECK (tipo = ANY (ARRAY['receita', 'despesa']))

  ## Solução
    - Alterar todas as funções para usar 'despesa' ao invés de 'saida'
    - Funções afetadas:
      * register_salary_advance
      * register_monthly_advance
      * register_final_salary_payment
*/

-- =====================================================
-- 1. CORRIGIR register_salary_advance
-- =====================================================

CREATE OR REPLACE FUNCTION register_salary_advance(
  p_employee_id uuid,
  p_amount numeric,
  p_advance_date date DEFAULT CURRENT_DATE,
  p_deducted_from_month date DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(
  advance_id uuid,
  finance_entry_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance_id uuid;
  v_finance_id uuid;
  v_employee record;
  v_bank_account_id uuid;
  v_deduct_month date;
BEGIN
  -- Buscar informações do funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = p_employee_id AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found or inactive';
  END IF;
  
  -- Validar valor
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Advance amount must be greater than zero';
  END IF;
  
  -- Definir mês de desconto (próximo mês se não informado)
  v_deduct_month := COALESCE(
    p_deducted_from_month,
    date_trunc('month', CURRENT_DATE + interval '1 month')::date
  );
  
  -- Buscar conta bancária padrão
  SELECT id INTO v_bank_account_id
  FROM bank_accounts
  WHERE is_default = true
  LIMIT 1;
  
  -- Criar lançamento financeiro COM TIPO CORRETO: 'despesa'
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
    'Vale/Adiantamento - ' || v_employee.name,
    p_amount,
    'despesa',  -- CORRIGIDO: era 'saida'
    'Salários',
    'pago',
    p_advance_date,
    p_advance_date,
    p_advance_date,
    'pix',
    v_bank_account_id,
    p_employee_id,
    COALESCE(p_notes, 'Adiantamento salarial')
  )
  RETURNING id INTO v_finance_id;
  
  -- Registrar vale
  INSERT INTO salary_advance_payments (
    employee_id,
    amount,
    advance_date,
    deducted_from_month,
    status,
    finance_entry_id,
    notes
  ) VALUES (
    p_employee_id,
    p_amount,
    p_advance_date,
    v_deduct_month,
    'pending',
    v_finance_id,
    p_notes
  )
  RETURNING id INTO v_advance_id;
  
  RETURN QUERY SELECT v_advance_id, v_finance_id;
END;
$$;

-- =====================================================
-- 2. CORRIGIR register_monthly_advance
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
  
  -- Criar lançamento financeiro COM TIPO CORRETO: 'despesa'
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
    'despesa',  -- CORRIGIDO: era 'saida'
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
  
  -- Atualizar salary_tracking se já existir
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) + v_calculated_amount,
    remaining_amount = COALESCE(gross_amount, base_salary) - COALESCE(paid_amount, 0) - v_calculated_amount,
    updated_at = now()
  WHERE employee_id = p_employee_id
  AND reference_month = date_trunc('month', p_reference_month)::DATE;
  
  RETURN QUERY SELECT v_advance_id, v_finance_id, v_calculated_amount;
END;
$$;

-- =====================================================
-- 3. CORRIGIR register_final_salary_payment
-- =====================================================

CREATE OR REPLACE FUNCTION register_final_salary_payment(
  p_employee_id UUID,
  p_reference_month DATE,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  payment_id UUID,
  finance_entry_id UUID,
  amount_paid NUMERIC,
  advance_deducted NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
  v_finance_id UUID;
  v_employee RECORD;
  v_bank_account_id UUID;
  v_schedule RECORD;
  v_salary_tracking RECORD;
  v_advance_total NUMERIC := 0;
  v_final_amount NUMERIC;
  v_advance RECORD;
BEGIN
  -- Buscar funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = p_employee_id AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcionário não encontrado ou inativo';
  END IF;
  
  -- Buscar configuração
  SELECT * INTO v_schedule
  FROM salary_payment_schedule
  WHERE active = true
  LIMIT 1;
  
  -- Buscar tracking do salário
  SELECT * INTO v_salary_tracking
  FROM employee_salary_tracking
  WHERE employee_id = p_employee_id
  AND reference_month = date_trunc('month', p_reference_month)::DATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Não existe registro de salário para este mês. Crie o salário primeiro.';
  END IF;
  
  -- Buscar vales pendentes deste mês
  FOR v_advance IN
    SELECT *
    FROM salary_advance_payments
    WHERE employee_id = p_employee_id
    AND deducted_from_month = date_trunc('month', p_reference_month)::DATE
    AND status = 'pending'
  LOOP
    v_advance_total := v_advance_total + v_advance.amount;
    
    -- Marcar vale como descontado
    UPDATE salary_advance_payments
    SET status = 'deducted'
    WHERE id = v_advance.id;
  END LOOP;
  
  -- Calcular valor final (salário bruto - vales - descontos + bônus)
  v_final_amount := 
    COALESCE(v_salary_tracking.gross_amount, v_salary_tracking.base_salary)
    + COALESCE(v_salary_tracking.bonuses, 0)
    - COALESCE(v_salary_tracking.discounts, 0)
    - v_advance_total;
  
  -- Validar valor
  IF v_final_amount < 0 THEN
    RAISE EXCEPTION 'Valor final negativo. Verifique vales e descontos. Valor calculado: %', v_final_amount;
  END IF;
  
  -- Verificar se já existe pagamento final
  IF EXISTS (
    SELECT 1 FROM salary_partial_payments
    WHERE salary_tracking_id = v_salary_tracking.id
    AND payment_type = 'final'
  ) THEN
    RAISE EXCEPTION 'Já existe pagamento final registrado para este salário';
  END IF;
  
  -- Buscar conta bancária padrão
  SELECT id INTO v_bank_account_id
  FROM bank_accounts
  WHERE is_default = true
  LIMIT 1;
  
  -- Criar lançamento financeiro COM TIPO CORRETO: 'despesa'
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
    'Salário Dia 5 - ' || v_employee.name || ' - ' || to_char(p_reference_month, 'MM/YYYY'),
    v_final_amount,
    'despesa',  -- CORRIGIDO: era 'saida'
    'Salários',
    'pago',
    p_payment_date,
    p_payment_date,
    p_payment_date,
    v_schedule.final_payment_method,
    v_bank_account_id,
    p_employee_id,
    COALESCE(p_notes, 'Pagamento final - dia 5 (com desconto de vale: R$ ' || v_advance_total::TEXT || ')')
  )
  RETURNING id INTO v_finance_id;
  
  -- Registrar pagamento parcial
  INSERT INTO salary_partial_payments (
    salary_tracking_id,
    employee_id,
    reference_month,
    amount,
    payment_date,
    payment_method,
    payment_type,
    finance_entry_id,
    notes
  ) VALUES (
    v_salary_tracking.id,
    p_employee_id,
    date_trunc('month', p_reference_month)::DATE,
    v_final_amount,
    p_payment_date,
    v_schedule.final_payment_method,
    'final',
    v_finance_id,
    p_notes
  )
  RETURNING id INTO v_payment_id;
  
  -- Atualizar salary_tracking
  UPDATE employee_salary_tracking
  SET 
    paid_amount = COALESCE(paid_amount, 0) + v_final_amount,
    remaining_amount = 0,
    payment_status = 'paid',
    updated_at = now()
  WHERE id = v_salary_tracking.id;
  
  RETURN QUERY SELECT v_payment_id, v_finance_id, v_final_amount, v_advance_total;
END;
$$;

-- =====================================================
-- 4. GARANTIR PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION register_salary_advance TO authenticated, anon;
GRANT EXECUTE ON FUNCTION register_monthly_advance TO authenticated, anon;
GRANT EXECUTE ON FUNCTION register_final_salary_payment TO authenticated, anon;

-- =====================================================
-- 5. COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION register_salary_advance IS 'Registra vale/adiantamento com tipo DESPESA (corrigido)';
COMMENT ON FUNCTION register_monthly_advance IS 'Registra vale dia 20 com tipo DESPESA (corrigido)';
COMMENT ON FUNCTION register_final_salary_payment IS 'Registra pagamento dia 5 com tipo DESPESA (corrigido)';
