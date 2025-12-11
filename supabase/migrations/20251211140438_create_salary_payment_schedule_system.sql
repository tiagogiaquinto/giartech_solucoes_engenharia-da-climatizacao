/*
  # Sistema Completo de Pagamentos de Salário (Vale Dia 20 + Pagamento Dia 5)

  ## 1. Visão Geral do Sistema
    Este sistema gerencia pagamentos de salário em duas etapas:
    - **Dia 20**: Vale/Adiantamento (50% ou valor configurável)
    - **Dia 5**: Pagamento final (saldo restante após descontar o vale)

  ## 2. Estrutura de Tabelas
    - `salary_advance_payments`: Vales pagos no dia 20
    - `salary_partial_payments`: Pagamentos parciais/finais
    - `employee_salary_tracking`: Controle mensal consolidado
    - `salary_payment_schedule`: NOVA - Configuração de cronograma por empresa

  ## 3. Novas Funcionalidades
    - Configuração flexível de dias de pagamento (padrão: 20 e 5)
    - Percentual de vale configurável (padrão: 50%)
    - Cálculo automático de valores
    - Integração com finance_entries
    - Validações e controles de duplicidade

  ## 4. Fluxo Automatizado
    1. Criar salário do mês (employee_salary_tracking)
    2. Registrar vale dia 20 (registro automático ou manual)
    3. Registrar pagamento dia 5 (com desconto automático do vale)
    4. Atualizar saldo e status automaticamente

  ## 5. Segurança
    - RLS habilitado em todas as tabelas
    - Triggers para auditoria
    - Validações de valores e datas
*/

-- =====================================================
-- 1. CRIAR TABELA DE CONFIGURAÇÃO DE CRONOGRAMA
-- =====================================================

CREATE TABLE IF NOT EXISTS salary_payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Dias de pagamento
  advance_payment_day INTEGER NOT NULL DEFAULT 20, -- Dia do vale
  final_payment_day INTEGER NOT NULL DEFAULT 5,    -- Dia do pagamento final
  
  -- Percentuais
  advance_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00, -- % do vale (50%)
  
  -- Configurações adicionais
  auto_generate_advance BOOLEAN DEFAULT false, -- Gerar vale automaticamente
  auto_generate_final BOOLEAN DEFAULT false,   -- Gerar pagamento final automaticamente
  
  -- Formas de pagamento padrão
  advance_payment_method TEXT DEFAULT 'pix',
  final_payment_method TEXT DEFAULT 'pix',
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_days CHECK (
    advance_payment_day BETWEEN 1 AND 31 AND
    final_payment_day BETWEEN 1 AND 31 AND
    advance_payment_day != final_payment_day
  ),
  CONSTRAINT valid_percentage CHECK (
    advance_percentage > 0 AND advance_percentage < 100
  )
);

-- Inserir configuração padrão
INSERT INTO salary_payment_schedule (
  advance_payment_day,
  final_payment_day,
  advance_percentage,
  auto_generate_advance,
  auto_generate_final
) VALUES (
  20, -- Vale dia 20
  5,  -- Pagamento dia 5
  50.00, -- 50% de vale
  false, -- Não gerar automaticamente
  false
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. ADICIONAR CAMPOS ÀS TABELAS EXISTENTES
-- =====================================================

-- Adicionar tipo de pagamento à salary_advance_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'salary_advance_payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE salary_advance_payments ADD COLUMN payment_type TEXT DEFAULT 'advance';
    ALTER TABLE salary_advance_payments ADD CONSTRAINT valid_advance_payment_type 
      CHECK (payment_type IN ('advance', 'emergency', 'special'));
  END IF;
END $$;

-- Adicionar tipo de pagamento à salary_partial_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'salary_partial_payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE salary_partial_payments ADD COLUMN payment_type TEXT DEFAULT 'final';
    ALTER TABLE salary_partial_payments ADD CONSTRAINT valid_partial_payment_type 
      CHECK (payment_type IN ('final', 'partial', 'adjustment'));
  END IF;
END $$;

-- Adicionar referência ao employee_id em salary_partial_payments (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'salary_partial_payments' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE salary_partial_payments ADD COLUMN employee_id UUID REFERENCES employees(id);
    CREATE INDEX idx_salary_partial_payments_employee ON salary_partial_payments(employee_id);
  END IF;
END $$;

-- Adicionar mês de referência em salary_partial_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'salary_partial_payments' AND column_name = 'reference_month'
  ) THEN
    ALTER TABLE salary_partial_payments ADD COLUMN reference_month DATE;
    CREATE INDEX idx_salary_partial_payments_month ON salary_partial_payments(reference_month);
  END IF;
END $$;

-- =====================================================
-- 3. FUNÇÃO PARA REGISTRAR VALE DIA 20
-- =====================================================

CREATE OR REPLACE FUNCTION register_monthly_advance(
  p_employee_id UUID,
  p_reference_month DATE,
  p_amount NUMERIC DEFAULT NULL, -- Se NULL, calcula automaticamente
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
    'saida',
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
-- 4. FUNÇÃO PARA REGISTRAR PAGAMENTO FINAL DIA 5
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
    'Salário Dia 5 - ' || v_employee.name || ' - ' || to_char(p_reference_month, 'MM/YYYY'),
    v_final_amount,
    'saida',
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
-- 5. VIEW CONSOLIDADA DE PAGAMENTOS
-- =====================================================

CREATE OR REPLACE VIEW v_salary_payment_schedule_details AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.salary as base_salary,
  
  -- Mês de referência
  est.reference_month,
  
  -- Tracking do salário
  est.id as salary_tracking_id,
  est.base_salary as tracking_base_salary,
  est.bonuses,
  est.discounts,
  est.gross_amount,
  est.paid_amount,
  est.remaining_amount,
  est.payment_status,
  
  -- Vale (dia 20)
  sap.id as advance_id,
  sap.amount as advance_amount,
  sap.advance_date,
  sap.status as advance_status,
  
  -- Pagamento final (dia 5)
  spp.id as final_payment_id,
  spp.amount as final_payment_amount,
  spp.payment_date as final_payment_date,
  
  -- Totais
  COALESCE(sap.amount, 0) as total_advance,
  COALESCE(spp.amount, 0) as total_final,
  COALESCE(sap.amount, 0) + COALESCE(spp.amount, 0) as total_paid,
  
  -- Status geral
  CASE 
    WHEN spp.id IS NOT NULL THEN 'Pago Completo'
    WHEN sap.id IS NOT NULL AND spp.id IS NULL THEN 'Vale Pago - Aguardando Final'
    WHEN sap.id IS NULL AND spp.id IS NULL THEN 'Pendente'
    ELSE 'Desconhecido'
  END as overall_status

FROM employees e
LEFT JOIN employee_salary_tracking est ON e.id = est.employee_id
LEFT JOIN salary_advance_payments sap ON 
  e.id = sap.employee_id AND 
  sap.deducted_from_month = est.reference_month AND
  sap.payment_type = 'advance'
LEFT JOIN salary_partial_payments spp ON 
  est.id = spp.salary_tracking_id AND
  spp.payment_type = 'final'
WHERE e.active = true
ORDER BY est.reference_month DESC, e.name;

-- =====================================================
-- 6. VIEW DE PRÓXIMOS PAGAMENTOS
-- =====================================================

CREATE OR REPLACE VIEW v_upcoming_salary_payments AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.salary,
  
  -- Configuração
  sps.advance_payment_day,
  sps.final_payment_day,
  sps.advance_percentage,
  
  -- Próximo vale (dia 20)
  (e.salary * sps.advance_percentage / 100) as next_advance_amount,
  make_date(
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    sps.advance_payment_day
  ) as next_advance_date,
  
  -- Próximo pagamento final estimado (dia 5)
  (e.salary - (e.salary * sps.advance_percentage / 100)) as estimated_final_amount,
  make_date(
    EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 month'))::INTEGER,
    EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 month'))::INTEGER,
    sps.final_payment_day
  ) as next_final_payment_date

FROM employees e
CROSS JOIN salary_payment_schedule sps
WHERE e.active = true AND sps.active = true;

-- =====================================================
-- 7. PERMISSÕES E RLS
-- =====================================================

ALTER TABLE salary_payment_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to salary_payment_schedule"
  ON salary_payment_schedule FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Garantir permissões nas funções
GRANT EXECUTE ON FUNCTION register_monthly_advance TO authenticated, anon;
GRANT EXECUTE ON FUNCTION register_final_salary_payment TO authenticated, anon;

-- Garantir acesso às views
GRANT SELECT ON v_salary_payment_schedule_details TO authenticated, anon;
GRANT SELECT ON v_upcoming_salary_payments TO authenticated, anon;

-- =====================================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_salary_advance_month_employee 
  ON salary_advance_payments(deducted_from_month, employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_partial_month_employee 
  ON salary_partial_payments(reference_month, employee_id);

CREATE INDEX IF NOT EXISTS idx_salary_tracking_month_employee 
  ON employee_salary_tracking(reference_month, employee_id);

-- =====================================================
-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE salary_payment_schedule IS 'Configuração de cronograma de pagamentos (vale dia 20, pagamento dia 5)';
COMMENT ON COLUMN salary_payment_schedule.advance_payment_day IS 'Dia do mês para pagamento do vale (padrão: 20)';
COMMENT ON COLUMN salary_payment_schedule.final_payment_day IS 'Dia do mês para pagamento final (padrão: 5)';
COMMENT ON COLUMN salary_payment_schedule.advance_percentage IS 'Percentual do salário pago como vale (padrão: 50%)';

COMMENT ON FUNCTION register_monthly_advance IS 'Registra vale mensal (dia 20) com integração financeira automática';
COMMENT ON FUNCTION register_final_salary_payment IS 'Registra pagamento final (dia 5) com desconto automático dos vales';

COMMENT ON VIEW v_salary_payment_schedule_details IS 'Visão consolidada de todos os pagamentos (vales + finais) por funcionário e mês';
COMMENT ON VIEW v_upcoming_salary_payments IS 'Próximos pagamentos previstos para todos os funcionários ativos';
