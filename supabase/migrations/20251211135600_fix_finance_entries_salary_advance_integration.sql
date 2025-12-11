/*
  # Corrigir Integração de Vales com Finance Entries

  ## 1. Problema
    - Função `register_salary_advance` usa colunas em inglês
    - Tabela `finance_entries` usa colunas em português
    - Faltam colunas necessárias (employee_id, data_pagamento)

  ## 2. Alterações
    - Adicionar coluna `employee_id` à tabela finance_entries
    - Adicionar coluna `data_pagamento` à tabela finance_entries
    - Recriar função `register_salary_advance` com nomes corretos

  ## 3. Colunas Corretas
    - descricao (não description)
    - valor (não amount)
    - tipo (não type)
    - categoria (não category)
    - data_vencimento (não due_date)
    - forma_pagamento (não payment_method)
    - observacoes (não notes)
*/

-- =====================================================
-- 1. ADICIONAR COLUNAS FALTANTES À FINANCE_ENTRIES
-- =====================================================

-- Adicionar employee_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'finance_entries' AND column_name = 'employee_id'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_finance_entries_employee ON finance_entries(employee_id);
  END IF;
END $$;

-- Adicionar data_pagamento se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'finance_entries' AND column_name = 'data_pagamento'
  ) THEN
    ALTER TABLE finance_entries ADD COLUMN data_pagamento DATE;
    CREATE INDEX IF NOT EXISTS idx_finance_entries_data_pagamento ON finance_entries(data_pagamento);
  END IF;
END $$;

-- =====================================================
-- 2. RECRIAR FUNÇÃO COM NOMES CORRETOS
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
  
  -- Criar lançamento financeiro COM NOMES CORRETOS EM PORTUGUÊS
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
    'saida',
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
-- 3. GARANTIR PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION register_salary_advance TO authenticated;
GRANT EXECUTE ON FUNCTION register_salary_advance TO anon;

-- =====================================================
-- 4. COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN finance_entries.employee_id IS 'Referência ao funcionário quando o lançamento é relacionado a salário/vale';
COMMENT ON COLUMN finance_entries.data_pagamento IS 'Data efetiva do pagamento (diferente da data de vencimento)';
COMMENT ON FUNCTION register_salary_advance IS 'Registra vale/adiantamento com criação automática de lançamento financeiro. USA NOMES EM PORTUGUÊS.';
