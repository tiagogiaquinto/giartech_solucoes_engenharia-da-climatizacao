/*
  # Sistema de Orçamentos PDF
  
  1. Nova Tabela:
    - `budgets`: Armazena orçamentos gerados
      - Número único do orçamento
      - Dados do cliente
      - Status (rascunho, enviado, aprovado, rejeitado, expirado)
      - Valor total
      - Data de validade
      - Dados completos em JSON (items, observações, etc)
  
  2. Segurança:
    - RLS habilitado
    - Usuários autenticados podem gerenciar orçamentos
  
  3. Índices:
    - Número do orçamento
    - Status
    - Cliente
    - Datas
*/

-- Criar tabela de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_document text NOT NULL,
  customer_email text,
  customer_phone text,
  status text CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')) DEFAULT 'draft',
  total numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  taxes numeric(12,2) DEFAULT 0,
  valid_until timestamptz NOT NULL,
  payment_terms text,
  observations text,
  data jsonb NOT NULL,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz
);

-- Habilitar RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Usuários autenticados podem ver orçamentos" ON budgets;
CREATE POLICY "Usuários autenticados podem ver orçamentos"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar orçamentos" ON budgets;
CREATE POLICY "Usuários autenticados podem criar orçamentos"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar orçamentos" ON budgets;
CREATE POLICY "Usuários autenticados podem atualizar orçamentos"
  ON budgets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários autenticados podem deletar orçamentos" ON budgets;
CREATE POLICY "Usuários autenticados podem deletar orçamentos"
  ON budgets FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para anon (para visualização pública via link)
DROP POLICY IF EXISTS "Anon pode ver orçamentos compartilhados" ON budgets;
CREATE POLICY "Anon pode ver orçamentos compartilhados"
  ON budgets FOR SELECT
  TO anon
  USING (status IN ('sent', 'approved'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budgets_number ON budgets(number);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_customer_name ON budgets(customer_name);
CREATE INDEX IF NOT EXISTS idx_budgets_customer_document ON budgets(customer_document);
CREATE INDEX IF NOT EXISTS idx_budgets_created_by ON budgets(created_by);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_valid_until ON budgets(valid_until);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Atualizar timestamps de status
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    NEW.sent_at = now();
  END IF;
  
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = now();
  END IF;
  
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_budgets_updated_at ON budgets;
CREATE TRIGGER trigger_update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();

-- Função para expirar orçamentos automaticamente
CREATE OR REPLACE FUNCTION expire_old_budgets()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE budgets
  SET status = 'expired'
  WHERE status IN ('draft', 'sent')
  AND valid_until < now();
END;
$$;

-- View para estatísticas de orçamentos
CREATE OR REPLACE VIEW v_budget_stats AS
SELECT
  COUNT(*) as total_budgets,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  SUM(total) as total_value,
  SUM(total) FILTER (WHERE status = 'approved') as approved_value,
  AVG(total) as average_value,
  MAX(total) as max_value,
  MIN(total) as min_value,
  COUNT(DISTINCT customer_document) as unique_customers,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days
FROM budgets;

-- View para orçamentos recentes
CREATE OR REPLACE VIEW v_recent_budgets AS
SELECT
  b.id,
  b.number,
  b.customer_name,
  b.customer_document,
  b.status,
  b.total,
  b.created_at,
  b.valid_until,
  b.sent_at,
  b.approved_at,
  up.full_name as created_by_name,
  CASE
    WHEN b.valid_until < now() AND b.status IN ('draft', 'sent') THEN 'expired'
    ELSE b.status
  END as current_status
FROM budgets b
LEFT JOIN user_profiles up ON b.created_by = up.id
ORDER BY b.created_at DESC
LIMIT 50;

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO authenticated;
GRANT SELECT ON budgets TO anon;
GRANT SELECT ON v_budget_stats TO authenticated, anon;
GRANT SELECT ON v_recent_budgets TO authenticated, anon;
GRANT EXECUTE ON FUNCTION expire_old_budgets() TO authenticated;

-- Comentários
COMMENT ON TABLE budgets IS 'Armazena orçamentos gerados em PDF com todos os dados';
COMMENT ON COLUMN budgets.number IS 'Número único do orçamento (ex: ORC-2025001)';
COMMENT ON COLUMN budgets.data IS 'Dados completos do orçamento em JSON incluindo items, cliente, empresa, etc';
COMMENT ON COLUMN budgets.status IS 'Status do orçamento: draft, sent, approved, rejected, expired';
COMMENT ON FUNCTION expire_old_budgets() IS 'Expira automaticamente orçamentos que passaram da data de validade';
COMMENT ON VIEW v_budget_stats IS 'Estatísticas agregadas de orçamentos';
COMMENT ON VIEW v_recent_budgets IS 'Orçamentos recentes com informações do criador';