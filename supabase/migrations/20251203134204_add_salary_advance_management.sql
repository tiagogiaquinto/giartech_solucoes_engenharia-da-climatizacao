/*
  # Sistema de Vales/Adiantamentos Salariais com Desconto Automático

  ## 1. Novas Funções
    - `register_salary_advance()`: Registra vale/adiantamento
    - `deduct_advance_from_salary()`: Desconta vale do salário
    - `cancel_salary_advance()`: Cancela vale

  ## 2. Triggers Automáticos
    - Desconto automático de vales ao criar salário do mês
    - Validações de valores

  ## 3. Views Adicionais
    - `v_employee_advances`: Vales por funcionário
    - `v_pending_advances`: Vales pendentes de desconto
*/

-- =====================================================
-- 1. FUNÇÃO PARA REGISTRAR VALE/ADIANTAMENTO
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
  
  -- Criar lançamento financeiro
  INSERT INTO finance_entries (
    description,
    amount,
    type,
    category,
    status,
    due_date,
    payment_date,
    payment_method,
    bank_account_id,
    employee_id,
    notes
  ) VALUES (
    'Vale/Adiantamento - ' || v_employee.name,
    p_amount,
    'saida',
    'Salários',
    'pago',
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
-- 2. FUNÇÃO PARA DESCONTAR VALE DO SALÁRIO
-- =====================================================

CREATE OR REPLACE FUNCTION deduct_advance_from_salary(
  p_advance_id uuid,
  p_salary_tracking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance record;
  v_salary record;
BEGIN
  -- Buscar vale
  SELECT * INTO v_advance
  FROM salary_advance_payments
  WHERE id = p_advance_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advance not found or already deducted';
  END IF;
  
  -- Buscar salário
  SELECT * INTO v_salary
  FROM employee_salary_tracking
  WHERE id = p_salary_tracking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salary tracking not found';
  END IF;
  
  -- Verificar se é o funcionário correto
  IF v_advance.employee_id != v_salary.employee_id THEN
    RAISE EXCEPTION 'Advance and salary do not match the same employee';
  END IF;
  
  -- Aplicar desconto no salário
  UPDATE employee_salary_tracking
  SET 
    discounts = COALESCE(discounts, 0) + v_advance.amount,
    notes = COALESCE(notes, '') || ' | Vale descontado: R$ ' || v_advance.amount::text,
    updated_at = now()
  WHERE id = p_salary_tracking_id;
  
  -- Marcar vale como descontado
  UPDATE salary_advance_payments
  SET status = 'deducted'
  WHERE id = p_advance_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO PARA CANCELAR VALE
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_salary_advance(
  p_advance_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar vale como cancelado
  UPDATE salary_advance_payments
  SET 
    status = 'cancelled',
    notes = COALESCE(notes, '') || ' | Cancelado: ' || COALESCE(p_reason, 'Sem motivo especificado')
  WHERE id = p_advance_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Advance not found or already processed';
  END IF;
  
  RETURN true;
END;
$$;

-- =====================================================
-- 4. TRIGGER PARA DESCONTO AUTOMÁTICO DE VALES
-- =====================================================

CREATE OR REPLACE FUNCTION auto_deduct_advances_on_salary_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_advance record;
  v_total_advances numeric := 0;
BEGIN
  -- Buscar vales pendentes para este funcionário e mês
  FOR v_advance IN
    SELECT *
    FROM salary_advance_payments
    WHERE employee_id = NEW.employee_id
    AND deducted_from_month = NEW.reference_month
    AND status = 'pending'
  LOOP
    -- Aplicar desconto
    v_total_advances := v_total_advances + v_advance.amount;
    
    -- Marcar vale como descontado
    UPDATE salary_advance_payments
    SET status = 'deducted'
    WHERE id = v_advance.id;
  END LOOP;
  
  -- Se houver vales, atualizar o salário
  IF v_total_advances > 0 THEN
    UPDATE employee_salary_tracking
    SET 
      discounts = COALESCE(discounts, 0) + v_total_advances,
      notes = COALESCE(notes, '') || ' | Vales descontados: R$ ' || v_total_advances::text
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_deduct_advances ON employee_salary_tracking;
CREATE TRIGGER trg_auto_deduct_advances
  AFTER INSERT ON employee_salary_tracking
  FOR EACH ROW
  EXECUTE FUNCTION auto_deduct_advances_on_salary_creation();

-- =====================================================
-- 5. VIEW DE VALES POR FUNCIONÁRIO
-- =====================================================

CREATE OR REPLACE VIEW v_employee_advances AS
SELECT 
  sap.id as advance_id,
  sap.employee_id,
  e.name as employee_name,
  sap.amount,
  sap.advance_date,
  sap.deducted_from_month,
  sap.status,
  sap.notes,
  fe.id as finance_entry_id,
  fe.status as finance_status,
  sap.created_at
FROM salary_advance_payments sap
JOIN employees e ON sap.employee_id = e.id
LEFT JOIN finance_entries fe ON sap.finance_entry_id = fe.id
ORDER BY sap.advance_date DESC;

-- =====================================================
-- 6. VIEW DE VALES PENDENTES DE DESCONTO
-- =====================================================

CREATE OR REPLACE VIEW v_pending_advances AS
SELECT 
  sap.id as advance_id,
  sap.employee_id,
  e.name as employee_name,
  e.salary as employee_salary,
  sap.amount,
  sap.advance_date,
  sap.deducted_from_month,
  CASE 
    WHEN sap.deducted_from_month < date_trunc('month', CURRENT_DATE)::date THEN 
      'overdue'
    WHEN sap.deducted_from_month = date_trunc('month', CURRENT_DATE)::date THEN 
      'current'
    ELSE 
      'future'
  END as deduction_timing,
  sap.notes,
  sap.created_at
FROM salary_advance_payments sap
JOIN employees e ON sap.employee_id = e.id
WHERE sap.status = 'pending'
ORDER BY sap.deducted_from_month, e.name;

-- =====================================================
-- 7. VIEW DE RESUMO DE VALES
-- =====================================================

CREATE OR REPLACE VIEW v_advance_summary AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.salary as current_salary,
  COUNT(CASE WHEN sap.status = 'pending' THEN 1 END) as pending_count,
  COALESCE(SUM(CASE WHEN sap.status = 'pending' THEN sap.amount ELSE 0 END), 0) as pending_amount,
  COUNT(CASE WHEN sap.status = 'deducted' THEN 1 END) as deducted_count,
  COALESCE(SUM(CASE WHEN sap.status = 'deducted' THEN sap.amount ELSE 0 END), 0) as deducted_amount,
  COUNT(CASE WHEN sap.status = 'cancelled' THEN 1 END) as cancelled_count,
  MAX(sap.advance_date) as last_advance_date
FROM employees e
LEFT JOIN salary_advance_payments sap ON e.id = sap.employee_id
GROUP BY e.id, e.name, e.salary;

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION register_salary_advance IS 'Registra vale/adiantamento com criação automática de lançamento financeiro';
COMMENT ON FUNCTION deduct_advance_from_salary IS 'Desconta vale manualmente de um salário específico';
COMMENT ON FUNCTION cancel_salary_advance IS 'Cancela vale pendente';
COMMENT ON FUNCTION auto_deduct_advances_on_salary_creation IS 'Desconta automaticamente vales pendentes ao criar salário do mês';
COMMENT ON VIEW v_employee_advances IS 'Lista completa de vales por funcionário';
COMMENT ON VIEW v_pending_advances IS 'Vales pendentes de desconto com timing';
COMMENT ON VIEW v_advance_summary IS 'Resumo de vales por funcionário';
