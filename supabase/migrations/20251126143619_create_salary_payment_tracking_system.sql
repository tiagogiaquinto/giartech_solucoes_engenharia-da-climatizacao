/*
  # Sistema Completo de Rastreamento de Pagamentos de Salário

  ## 1. Tabelas Criadas
    
    ### employee_salary_tracking
    - `id` (uuid, PK): Identificador único
    - `employee_id` (uuid, FK): Referência ao funcionário
    - `reference_month` (date): Mês de referência do salário
    - `base_salary` (numeric): Salário base do funcionário
    - `bonuses` (numeric): Bônus e adicionais
    - `discounts` (numeric): Descontos aplicados
    - `gross_amount` (numeric, GENERATED): Valor bruto calculado
    - `paid_amount` (numeric): Total já pago
    - `remaining_amount` (numeric, GENERATED): Saldo devedor
    - `payment_status` (text): Status do pagamento
    - `due_date` (date): Data de vencimento
    - `created_at`, `updated_at` (timestamptz)

    ### salary_partial_payments
    - `id` (uuid, PK): Identificador único
    - `salary_tracking_id` (uuid, FK): Referência ao salário
    - `amount` (numeric): Valor do pagamento parcial
    - `payment_date` (date): Data do pagamento
    - `payment_method` (text): Forma de pagamento
    - `finance_entry_id` (uuid, FK): Vinculação ao financeiro
    - `notes` (text): Observações
    - `created_at` (timestamptz)

    ### salary_advance_payments
    - `id` (uuid, PK): Identificador único
    - `employee_id` (uuid, FK): Referência ao funcionário
    - `amount` (numeric): Valor do vale
    - `advance_date` (date): Data do adiantamento
    - `deducted_from_month` (date): Mês que será descontado
    - `status` (text): Status do vale
    - `finance_entry_id` (uuid, FK): Vinculação ao financeiro
    - `notes` (text): Observações
    - `created_at` (timestamptz)

  ## 2. Views Criadas
    - `v_employee_salary_summary`: Resumo por funcionário
    - `v_pending_salary_payments`: Salários pendentes
    - `v_salary_payment_history`: Histórico completo

  ## 3. Funções Criadas
    - `create_monthly_salaries()`: Cria salários do mês
    - `register_salary_payment()`: Registra pagamento parcial
    - `update_salary_payment_status()`: Atualiza status automaticamente

  ## 4. Triggers
    - Atualização automática de status
    - Criação automática de lançamento financeiro
    - Validação de valores

  ## 5. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso configuradas
    - Validações no banco de dados
*/

-- =====================================================
-- 1. TABELA DE RASTREAMENTO DE SALÁRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_salary_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  base_salary numeric(15,2) NOT NULL DEFAULT 0,
  bonuses numeric(15,2) DEFAULT 0,
  discounts numeric(15,2) DEFAULT 0,
  gross_amount numeric(15,2) GENERATED ALWAYS AS (base_salary + COALESCE(bonuses, 0) - COALESCE(discounts, 0)) STORED,
  paid_amount numeric(15,2) DEFAULT 0,
  remaining_amount numeric(15,2) GENERATED ALWAYS AS (base_salary + COALESCE(bonuses, 0) - COALESCE(discounts, 0) - COALESCE(paid_amount, 0)) STORED,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  due_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, reference_month)
);

CREATE INDEX IF NOT EXISTS idx_salary_tracking_employee ON employee_salary_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_tracking_month ON employee_salary_tracking(reference_month);
CREATE INDEX IF NOT EXISTS idx_salary_tracking_status ON employee_salary_tracking(payment_status);
CREATE INDEX IF NOT EXISTS idx_salary_tracking_due_date ON employee_salary_tracking(due_date);

-- =====================================================
-- 2. TABELA DE PAGAMENTOS PARCIAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS salary_partial_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_tracking_id uuid NOT NULL REFERENCES employee_salary_tracking(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'pix' CHECK (payment_method IN ('dinheiro', 'pix', 'transferencia', 'cheque', 'cartao')),
  finance_entry_id uuid REFERENCES finance_entries(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partial_payments_salary ON salary_partial_payments(salary_tracking_id);
CREATE INDEX IF NOT EXISTS idx_partial_payments_date ON salary_partial_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_partial_payments_finance ON salary_partial_payments(finance_entry_id);

-- =====================================================
-- 3. TABELA DE VALES/ADIANTAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS salary_advance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  advance_date date NOT NULL DEFAULT CURRENT_DATE,
  deducted_from_month date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'deducted', 'cancelled')),
  finance_entry_id uuid REFERENCES finance_entries(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advance_payments_employee ON salary_advance_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_month ON salary_advance_payments(deducted_from_month);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON salary_advance_payments(status);

-- =====================================================
-- 4. FUNÇÃO PARA CRIAR SALÁRIOS MENSAIS
-- =====================================================

CREATE OR REPLACE FUNCTION create_monthly_salaries(
  p_reference_month date DEFAULT CURRENT_DATE,
  p_due_day integer DEFAULT 5
)
RETURNS TABLE(
  created_count integer,
  total_amount numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_count integer := 0;
  v_total_amount numeric := 0;
  v_due_date date;
  v_employee record;
BEGIN
  -- Calcular data de vencimento (dia 5 do mês seguinte)
  v_due_date := (date_trunc('month', p_reference_month) + interval '1 month' + (p_due_day - 1 || ' days')::interval)::date;
  
  -- Criar registro de salário para cada funcionário ativo
  FOR v_employee IN 
    SELECT id, salary 
    FROM employees 
    WHERE active = true AND salary > 0
  LOOP
    -- Verificar se já existe para este mês
    IF NOT EXISTS (
      SELECT 1 FROM employee_salary_tracking 
      WHERE employee_id = v_employee.id 
      AND reference_month = date_trunc('month', p_reference_month)::date
    ) THEN
      -- Inserir novo registro
      INSERT INTO employee_salary_tracking (
        employee_id,
        reference_month,
        base_salary,
        due_date
      ) VALUES (
        v_employee.id,
        date_trunc('month', p_reference_month)::date,
        v_employee.salary,
        v_due_date
      );
      
      v_created_count := v_created_count + 1;
      v_total_amount := v_total_amount + v_employee.salary;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_created_count, v_total_amount;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO PARA REGISTRAR PAGAMENTO PARCIAL
-- =====================================================

CREATE OR REPLACE FUNCTION register_salary_payment(
  p_salary_id uuid,
  p_amount numeric,
  p_payment_method text DEFAULT 'pix',
  p_payment_date date DEFAULT CURRENT_DATE,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(
  payment_id uuid,
  finance_entry_id uuid,
  remaining_amount numeric,
  new_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id uuid;
  v_finance_id uuid;
  v_salary record;
  v_employee record;
  v_remaining numeric;
  v_new_status text;
  v_bank_account_id uuid;
BEGIN
  -- Buscar informações do salário
  SELECT * INTO v_salary
  FROM employee_salary_tracking
  WHERE id = p_salary_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salary tracking record not found';
  END IF;
  
  -- Buscar informações do funcionário
  SELECT * INTO v_employee
  FROM employees
  WHERE id = v_salary.employee_id;
  
  -- Validar valor do pagamento
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  
  IF p_amount > (v_salary.gross_amount - v_salary.paid_amount) THEN
    RAISE EXCEPTION 'Payment amount exceeds remaining balance';
  END IF;
  
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
    'Pagamento de Salário - ' || v_employee.name || ' - ' || TO_CHAR(v_salary.reference_month, 'MM/YYYY'),
    p_amount,
    'saida',
    'Salários',
    'pago',
    v_salary.due_date,
    p_payment_date,
    p_payment_method,
    v_bank_account_id,
    v_salary.employee_id,
    COALESCE(p_notes, 'Pagamento parcial de salário')
  )
  RETURNING id INTO v_finance_id;
  
  -- Registrar pagamento parcial
  INSERT INTO salary_partial_payments (
    salary_tracking_id,
    amount,
    payment_date,
    payment_method,
    finance_entry_id,
    notes
  ) VALUES (
    p_salary_id,
    p_amount,
    p_payment_date,
    p_payment_method,
    v_finance_id,
    p_notes
  )
  RETURNING id INTO v_payment_id;
  
  -- Atualizar valor pago no tracking
  UPDATE employee_salary_tracking
  SET 
    paid_amount = paid_amount + p_amount,
    updated_at = now()
  WHERE id = p_salary_id;
  
  -- Calcular novo saldo e status
  SELECT 
    gross_amount - (paid_amount + p_amount),
    CASE 
      WHEN (paid_amount + p_amount) >= gross_amount THEN 'paid'
      WHEN (paid_amount + p_amount) > 0 THEN 'partial'
      ELSE 'pending'
    END
  INTO v_remaining, v_new_status
  FROM employee_salary_tracking
  WHERE id = p_salary_id;
  
  -- Atualizar status
  UPDATE employee_salary_tracking
  SET payment_status = v_new_status
  WHERE id = p_salary_id;
  
  RETURN QUERY SELECT v_payment_id, v_finance_id, v_remaining, v_new_status;
END;
$$;

-- =====================================================
-- 6. TRIGGER PARA ATUALIZAR STATUS AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_salary_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar status baseado no valor pago e data de vencimento
  UPDATE employee_salary_tracking
  SET 
    payment_status = CASE
      WHEN paid_amount >= gross_amount THEN 'paid'
      WHEN paid_amount > 0 AND paid_amount < gross_amount THEN 'partial'
      WHEN due_date < CURRENT_DATE AND paid_amount = 0 THEN 'overdue'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_salary_status ON employee_salary_tracking;
CREATE TRIGGER trg_update_salary_status
  AFTER INSERT OR UPDATE OF paid_amount ON employee_salary_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_payment_status();

-- =====================================================
-- 7. VIEW DE RESUMO POR FUNCIONÁRIO
-- =====================================================

CREATE OR REPLACE VIEW v_employee_salary_summary AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.salary as current_salary,
  COUNT(DISTINCT est.id) as total_months,
  SUM(est.gross_amount) as total_gross,
  SUM(est.paid_amount) as total_paid,
  SUM(est.remaining_amount) as total_remaining,
  COUNT(CASE WHEN est.payment_status = 'pending' THEN 1 END) as months_pending,
  COUNT(CASE WHEN est.payment_status = 'partial' THEN 1 END) as months_partial,
  COUNT(CASE WHEN est.payment_status = 'paid' THEN 1 END) as months_paid,
  COUNT(CASE WHEN est.payment_status = 'overdue' THEN 1 END) as months_overdue
FROM employees e
LEFT JOIN employee_salary_tracking est ON e.id = est.employee_id
GROUP BY e.id, e.name, e.salary;

-- =====================================================
-- 8. VIEW DE SALÁRIOS PENDENTES
-- =====================================================

CREATE OR REPLACE VIEW v_pending_salary_payments AS
SELECT 
  est.id,
  est.employee_id,
  e.name as employee_name,
  e.salary as current_salary,
  est.reference_month,
  est.base_salary,
  est.bonuses,
  est.discounts,
  est.gross_amount,
  est.paid_amount,
  est.remaining_amount,
  est.payment_status,
  est.due_date,
  CASE 
    WHEN est.due_date < CURRENT_DATE THEN est.due_date - CURRENT_DATE
    ELSE 0
  END as days_overdue,
  (
    SELECT COUNT(*) 
    FROM salary_partial_payments spp 
    WHERE spp.salary_tracking_id = est.id
  ) as payment_count
FROM employee_salary_tracking est
JOIN employees e ON est.employee_id = e.id
WHERE est.payment_status IN ('pending', 'partial', 'overdue')
ORDER BY 
  CASE est.payment_status
    WHEN 'overdue' THEN 1
    WHEN 'partial' THEN 2
    WHEN 'pending' THEN 3
  END,
  est.due_date;

-- =====================================================
-- 9. VIEW DE HISTÓRICO DE PAGAMENTOS
-- =====================================================

CREATE OR REPLACE VIEW v_salary_payment_history AS
SELECT 
  spp.id as payment_id,
  spp.salary_tracking_id,
  e.name as employee_name,
  est.reference_month,
  spp.amount as payment_amount,
  spp.payment_date,
  spp.payment_method,
  spp.notes,
  fe.id as finance_entry_id,
  fe.status as finance_status,
  spp.created_at
FROM salary_partial_payments spp
JOIN employee_salary_tracking est ON spp.salary_tracking_id = est.id
JOIN employees e ON est.employee_id = e.id
LEFT JOIN finance_entries fe ON spp.finance_entry_id = fe.id
ORDER BY spp.payment_date DESC, spp.created_at DESC;

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

ALTER TABLE employee_salary_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_partial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_advance_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para anonymous (acesso total durante desenvolvimento)
CREATE POLICY "Allow anonymous all on employee_salary_tracking"
  ON employee_salary_tracking FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous all on salary_partial_payments"
  ON salary_partial_payments FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous all on salary_advance_payments"
  ON salary_advance_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas para authenticated
CREATE POLICY "Allow authenticated all on employee_salary_tracking"
  ON employee_salary_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated all on salary_partial_payments"
  ON salary_partial_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated all on salary_advance_payments"
  ON salary_advance_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- 11. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE employee_salary_tracking IS 'Rastreamento mensal de salários com cálculo automático de saldo devedor';
COMMENT ON TABLE salary_partial_payments IS 'Registro de pagamentos parciais de salários';
COMMENT ON TABLE salary_advance_payments IS 'Controle de vales e adiantamentos salariais';
COMMENT ON FUNCTION create_monthly_salaries IS 'Cria registros de salário para todos os funcionários ativos de um mês';
COMMENT ON FUNCTION register_salary_payment IS 'Registra pagamento parcial de salário com criação automática de lançamento financeiro';
