/*
  # Sistema de Geração de Faturas
  
  1. Tabelas
    - invoices - Faturas geradas
    - invoice_items - Itens da fatura
    - invoice_payments - Pagamentos recebidos
    
  2. Funcionalidades
    - Gerar fatura a partir de ordem de serviço
    - Gerar fatura manual
    - Registrar pagamentos
    - Controle de status
    - Histórico completo
*/

-- =====================================================
-- 1. TABELA: FATURAS
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Numeração
  invoice_number text UNIQUE NOT NULL,
  invoice_series text DEFAULT 'A',
  
  -- Relacionamentos
  customer_id uuid REFERENCES customers(id) NOT NULL,
  service_order_id uuid REFERENCES service_orders(id),
  
  -- Datas
  issue_date date DEFAULT CURRENT_DATE NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  
  -- Valores
  subtotal numeric(15,2) DEFAULT 0 NOT NULL,
  discount_amount numeric(15,2) DEFAULT 0,
  tax_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) DEFAULT 0 NOT NULL,
  paid_amount numeric(15,2) DEFAULT 0,
  balance_due numeric(15,2) DEFAULT 0,
  
  -- Status
  status text DEFAULT 'draft',
  CONSTRAINT check_invoice_status CHECK (status IN ('draft', 'issued', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  
  -- Informações de Pagamento
  payment_method text,
  payment_terms text DEFAULT '30 dias',
  bank_account_id uuid REFERENCES bank_accounts(id),
  
  -- Notas e Observações
  notes text,
  internal_notes text,
  payment_instructions text,
  
  -- Dados Fiscais (opcional)
  nfe_number text,
  nfe_key text,
  nfe_issued_at timestamptz,
  
  -- Metadados
  created_by uuid REFERENCES user_accounts(id),
  cancelled_by uuid REFERENCES user_accounts(id),
  cancelled_at timestamptz,
  cancellation_reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_service_order ON invoices(service_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- =====================================================
-- 2. TABELA: ITENS DA FATURA
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações do Item
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1 NOT NULL,
  unit_price numeric(15,2) NOT NULL,
  discount_percent numeric(5,2) DEFAULT 0,
  discount_amount numeric(15,2) DEFAULT 0,
  tax_percent numeric(5,2) DEFAULT 0,
  tax_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) NOT NULL,
  
  -- Relacionamentos (opcional)
  service_id uuid REFERENCES service_catalog(id),
  material_id uuid REFERENCES inventory_items(id),
  
  -- Ordem
  line_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =====================================================
-- 3. TABELA: PAGAMENTOS DA FATURA
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do Pagamento
  payment_date date DEFAULT CURRENT_DATE NOT NULL,
  amount numeric(15,2) NOT NULL,
  payment_method text NOT NULL,
  
  -- Referências
  bank_account_id uuid REFERENCES bank_accounts(id),
  finance_entry_id uuid REFERENCES finance_entries(id),
  
  -- Informações Adicionais
  reference_number text,
  notes text,
  
  -- Metadados
  recorded_by uuid REFERENCES user_accounts(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date);

-- =====================================================
-- 4. FUNÇÃO: GERAR NÚMERO DE FATURA
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(p_series text DEFAULT 'A')
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_month text;
  v_sequence integer;
  v_number text;
BEGIN
  v_year := to_char(CURRENT_DATE, 'YYYY');
  v_month := to_char(CURRENT_DATE, 'MM');
  
  -- Obter próximo número da sequência
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS integer)), 0) + 1
  INTO v_sequence
  FROM invoices
  WHERE invoice_number LIKE 'FAT-' || p_series || '-' || v_year || v_month || '%';
  
  -- Formatar: FAT-A-YYYYMM-0001
  v_number := 'FAT-' || p_series || '-' || v_year || v_month || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_number;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO: GERAR FATURA DE ORDEM DE SERVIÇO
-- =====================================================

CREATE OR REPLACE FUNCTION generate_invoice_from_service_order(
  p_service_order_id uuid,
  p_due_date date DEFAULT NULL,
  p_payment_terms text DEFAULT '30 dias',
  p_created_by uuid DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_id uuid;
  v_invoice_number text;
  v_service_order record;
  v_item record;
  v_total numeric;
BEGIN
  -- Buscar ordem de serviço
  SELECT * INTO v_service_order
  FROM service_orders
  WHERE id = p_service_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ordem de serviço não encontrada');
  END IF;
  
  -- Verificar se já existe fatura
  IF EXISTS (SELECT 1 FROM invoices WHERE service_order_id = p_service_order_id AND status != 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Já existe uma fatura para esta ordem de serviço');
  END IF;
  
  -- Gerar número da fatura
  v_invoice_number := generate_invoice_number('A');
  
  -- Calcular data de vencimento
  IF p_due_date IS NULL THEN
    p_due_date := CURRENT_DATE + INTERVAL '30 days';
  END IF;
  
  -- Criar fatura
  INSERT INTO invoices (
    invoice_number,
    customer_id,
    service_order_id,
    issue_date,
    due_date,
    payment_terms,
    subtotal,
    total_amount,
    balance_due,
    status,
    notes,
    created_by
  ) VALUES (
    v_invoice_number,
    v_service_order.customer_id,
    p_service_order_id,
    CURRENT_DATE,
    p_due_date,
    p_payment_terms,
    v_service_order.total_value,
    v_service_order.total_value,
    v_service_order.total_value,
    'issued',
    'Fatura gerada automaticamente da OS #' || v_service_order.order_number,
    p_created_by
  )
  RETURNING id, total_amount INTO v_invoice_id, v_total;
  
  -- Criar itens da fatura (serviços)
  FOR v_item IN 
    SELECT * FROM service_order_items WHERE service_order_id = p_service_order_id
  LOOP
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      total_amount,
      service_id
    ) VALUES (
      v_invoice_id,
      v_item.service_description,
      v_item.quantity,
      v_item.unit_price,
      v_item.total_price,
      v_item.service_id
    );
  END LOOP;
  
  -- Criar itens da fatura (materiais)
  FOR v_item IN 
    SELECT * FROM service_order_materials WHERE service_order_id = p_service_order_id
  LOOP
    INSERT INTO invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      total_amount,
      material_id
    ) VALUES (
      v_invoice_id,
      v_item.material_name || ' (Material)',
      v_item.quantity,
      v_item.unit_price,
      v_item.total_price,
      v_item.material_id
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'total_amount', v_total,
    'due_date', p_due_date
  );
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: REGISTRAR PAGAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION register_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_date date DEFAULT NULL,
  p_payment_method text DEFAULT 'Transferência',
  p_bank_account_id uuid DEFAULT NULL,
  p_reference_number text DEFAULT NULL,
  p_recorded_by uuid DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice record;
  v_payment_id uuid;
  v_new_paid_amount numeric;
  v_new_balance numeric;
  v_new_status text;
  v_finance_entry_id uuid;
BEGIN
  -- Buscar fatura
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fatura não encontrada');
  END IF;
  
  IF v_invoice.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Fatura cancelada');
  END IF;
  
  -- Data padrão
  IF p_payment_date IS NULL THEN
    p_payment_date := CURRENT_DATE;
  END IF;
  
  -- Criar lançamento financeiro
  INSERT INTO finance_entries (
    descricao,
    valor,
    tipo,
    status,
    data,
    customer_id,
    forma_pagamento,
    bank_account_id
  ) VALUES (
    'Pagamento Fatura ' || v_invoice.invoice_number,
    p_amount,
    'receita',
    'paid',
    p_payment_date,
    v_invoice.customer_id,
    p_payment_method,
    p_bank_account_id
  )
  RETURNING id INTO v_finance_entry_id;
  
  -- Registrar pagamento
  INSERT INTO invoice_payments (
    invoice_id,
    amount,
    payment_date,
    payment_method,
    bank_account_id,
    finance_entry_id,
    reference_number,
    recorded_by
  ) VALUES (
    p_invoice_id,
    p_amount,
    p_payment_date,
    p_payment_method,
    p_bank_account_id,
    v_finance_entry_id,
    p_reference_number,
    p_recorded_by
  )
  RETURNING id INTO v_payment_id;
  
  -- Calcular novos valores
  v_new_paid_amount := v_invoice.paid_amount + p_amount;
  v_new_balance := v_invoice.total_amount - v_new_paid_amount;
  
  -- Determinar novo status
  IF v_new_balance <= 0 THEN
    v_new_status := 'paid';
  ELSIF v_new_paid_amount > 0 THEN
    v_new_status := 'partially_paid';
  ELSE
    v_new_status := v_invoice.status;
  END IF;
  
  -- Atualizar fatura
  UPDATE invoices
  SET paid_amount = v_new_paid_amount,
      balance_due = v_new_balance,
      status = v_new_status,
      payment_date = CASE WHEN v_new_status = 'paid' THEN p_payment_date ELSE payment_date END,
      updated_at = now()
  WHERE id = p_invoice_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'finance_entry_id', v_finance_entry_id,
    'new_balance', v_new_balance,
    'new_status', v_new_status
  );
END;
$$;

-- =====================================================
-- 7. VIEW: FATURAS COM DETALHES
-- =====================================================

CREATE OR REPLACE VIEW v_invoices_detailed AS
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_series,
  i.issue_date,
  i.due_date,
  i.payment_date,
  i.status,
  i.total_amount,
  i.paid_amount,
  i.balance_due,
  i.payment_method,
  i.payment_terms,
  i.notes,
  
  -- Cliente
  c.nome_razao as customer_name,
  c.email as customer_email,
  c.telefone as customer_phone,
  c.cnpj as customer_cnpj,
  c.cpf as customer_cpf,
  
  -- Ordem de Serviço
  so.order_number as service_order_number,
  so.status as service_order_status,
  
  -- Contagens
  (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as items_count,
  (SELECT COUNT(*) FROM invoice_payments WHERE invoice_id = i.id) as payments_count,
  
  -- Datas
  i.created_at,
  i.updated_at,
  
  -- Status de vencimento
  CASE 
    WHEN i.status = 'paid' THEN 'Pago'
    WHEN i.due_date < CURRENT_DATE AND i.status NOT IN ('paid', 'cancelled') THEN 'Vencido'
    WHEN i.due_date = CURRENT_DATE THEN 'Vence Hoje'
    WHEN i.due_date <= CURRENT_DATE + 7 THEN 'Próximo ao Vencimento'
    ELSE 'No Prazo'
  END as due_status,
  
  -- Dias até/desde vencimento
  CASE 
    WHEN i.status != 'paid' THEN CURRENT_DATE - i.due_date
    ELSE NULL
  END as days_overdue

FROM invoices i
JOIN customers c ON i.customer_id = c.id
LEFT JOIN service_orders so ON i.service_order_id = so.id
ORDER BY i.created_at DESC;

-- =====================================================
-- 8. RLS
-- =====================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access invoices" ON invoices;
CREATE POLICY "Public access invoices" ON invoices FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public access invoice_items" ON invoice_items;
CREATE POLICY "Public access invoice_items" ON invoice_items FOR ALL TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public access invoice_payments" ON invoice_payments;
CREATE POLICY "Public access invoice_payments" ON invoice_payments FOR ALL TO anon, authenticated USING (true);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE invoices IS '✅ ATIVO - Sistema de faturas para cobrança de clientes';
COMMENT ON TABLE invoice_items IS '✅ ATIVO - Itens/linhas das faturas';
COMMENT ON TABLE invoice_payments IS '✅ ATIVO - Pagamentos recebidos de faturas';
COMMENT ON FUNCTION generate_invoice_number IS '✅ ATIVO - Gerar número sequencial de fatura';
COMMENT ON FUNCTION generate_invoice_from_service_order IS '✅ ATIVO - Gerar fatura automaticamente de OS';
COMMENT ON FUNCTION register_invoice_payment IS '✅ ATIVO - Registrar pagamento de fatura';
COMMENT ON VIEW v_invoices_detailed IS '✅ ATIVO - View completa de faturas com todos os dados';
