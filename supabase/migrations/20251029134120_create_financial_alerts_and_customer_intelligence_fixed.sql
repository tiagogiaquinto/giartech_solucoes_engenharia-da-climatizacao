/*
  # Criar Tabelas e Views para Dashboard CFO

  1. Tabelas Criadas
    - `financial_alerts` - Alertas financeiros automáticos
    
  2. Views Criadas
    - `v_customer_intelligence` - Inteligência de clientes
    
  3. Funcionalidades
    - Alertas de saúde financeira
    - Análise de clientes por receita
    - Indicadores de risco
*/

-- Criar tabela de alertas financeiros
CREATE TABLE IF NOT EXISTS financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT,
  current_value NUMERIC DEFAULT 0,
  threshold_value NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Allow read access to financial_alerts" ON financial_alerts;
DROP POLICY IF EXISTS "Allow insert access to financial_alerts" ON financial_alerts;
DROP POLICY IF EXISTS "Allow update access to financial_alerts" ON financial_alerts;

CREATE POLICY "Allow read access to financial_alerts"
  ON financial_alerts
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert access to financial_alerts"
  ON financial_alerts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to financial_alerts"
  ON financial_alerts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_financial_alerts_active ON financial_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_severity ON financial_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_created ON financial_alerts(created_at);

-- View de inteligência de clientes
DROP VIEW IF EXISTS v_customer_intelligence CASCADE;

CREATE OR REPLACE VIEW v_customer_intelligence AS
WITH customer_revenues AS (
  SELECT
    c.id AS customer_id,
    c.nome_razao AS customer_name,
    c.cnpj AS cnpj,
    c.cpf AS cpf,
    c.email,
    c.telefone AS phone,
    
    -- Receitas do cliente
    COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita' AND fe.status = 'recebido'), 0) AS total_revenue,
    COALESCE(COUNT(fe.id) FILTER (WHERE fe.tipo = 'receita'), 0) AS total_transactions,
    
    -- Ordens de serviço
    COALESCE(COUNT(so.id), 0) AS total_orders,
    COALESCE(AVG(so.total_value), 0) AS avg_order_value,
    
    -- Última compra
    MAX(GREATEST(COALESCE(fe.data, '1900-01-01'::date), COALESCE(so.created_at::date, '1900-01-01'::date))) AS last_purchase_date,
    
    -- Score de risco (0-100, quanto menor melhor)
    CASE
      WHEN COUNT(fe.id) FILTER (WHERE fe.status = 'a_receber' AND fe.data_vencimento < CURRENT_DATE) > 0 THEN 80
      WHEN COUNT(fe.id) FILTER (WHERE fe.status = 'a_receber') > 5 THEN 60
      WHEN MAX(GREATEST(COALESCE(fe.data, '1900-01-01'::date), COALESCE(so.created_at::date, '1900-01-01'::date))) < CURRENT_DATE - INTERVAL '6 months' THEN 70
      WHEN MAX(GREATEST(COALESCE(fe.data, '1900-01-01'::date), COALESCE(so.created_at::date, '1900-01-01'::date))) < CURRENT_DATE - INTERVAL '3 months' THEN 50
      ELSE 20
    END AS churn_probability
    
  FROM customers c
  LEFT JOIN finance_entries fe ON fe.customer_id = c.id
  LEFT JOIN service_orders so ON so.customer_id = c.id
  WHERE EXTRACT(YEAR FROM COALESCE(fe.created_at, so.created_at, c.created_at)) >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
  GROUP BY c.id, c.nome_razao, c.cnpj, c.cpf, c.email, c.telefone
  HAVING COALESCE(SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita'), 0) > 0
     OR COALESCE(COUNT(so.id), 0) > 0
)
SELECT
  customer_id,
  customer_name,
  cnpj,
  cpf,
  email,
  phone,
  total_revenue,
  total_transactions,
  total_orders,
  ROUND(avg_order_value::numeric, 2) AS avg_order_value,
  last_purchase_date::text AS last_purchase_date,
  churn_probability,
  CASE
    WHEN churn_probability >= 70 THEN 'high'
    WHEN churn_probability >= 50 THEN 'medium'
    ELSE 'low'
  END AS risk_level
FROM customer_revenues
ORDER BY total_revenue DESC;

-- Grant permissions
GRANT SELECT ON v_customer_intelligence TO anon, authenticated;

-- Função para gerar alertas automáticos
CREATE OR REPLACE FUNCTION generate_financial_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contas_vencidas NUMERIC;
  v_capital_negativo NUMERIC;
  v_margem_baixa NUMERIC;
BEGIN
  -- Limpar alertas antigos
  DELETE FROM financial_alerts WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
  
  -- Alerta: Contas vencidas
  SELECT COALESCE(SUM(valor), 0) INTO v_contas_vencidas
  FROM finance_entries
  WHERE status IN ('a_receber', 'a_pagar')
    AND data_vencimento < CURRENT_DATE;
  
  IF v_contas_vencidas > 1000 THEN
    INSERT INTO financial_alerts (alert_type, severity, title, description, current_value, threshold_value)
    VALUES (
      'overdue',
      CASE WHEN v_contas_vencidas > 5000 THEN 'critical' ELSE 'warning' END,
      'Contas Vencidas',
      'Existem contas vencidas que precisam de atenção',
      v_contas_vencidas,
      1000
    );
  END IF;
  
  -- Alerta: Capital de giro negativo
  SELECT 
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'a_receber'), 0) -
    COALESCE(SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'a_pagar'), 0)
  INTO v_capital_negativo
  FROM finance_entries;
  
  IF v_capital_negativo < 0 THEN
    INSERT INTO financial_alerts (alert_type, severity, title, description, current_value, threshold_value)
    VALUES (
      'negative_capital',
      'warning',
      'Capital de Giro Negativo',
      'Suas contas a pagar são maiores que contas a receber',
      v_capital_negativo,
      0
    );
  END IF;
  
  -- Alerta: Margem de lucro baixa
  SELECT 
    CASE 
      WHEN SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido') > 0 THEN
        ((SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido') - 
          SUM(valor) FILTER (WHERE tipo = 'despesa' AND status = 'pago')) / 
         SUM(valor) FILTER (WHERE tipo = 'receita' AND status = 'recebido') * 100)
      ELSE 0
    END
  INTO v_margem_baixa
  FROM finance_entries
  WHERE EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  IF v_margem_baixa < 20 AND v_margem_baixa > 0 THEN
    INSERT INTO financial_alerts (alert_type, severity, title, description, current_value, threshold_value)
    VALUES (
      'low_margin',
      'warning',
      'Margem de Lucro Baixa',
      'A margem de lucro deste mês está abaixo de 20%',
      v_margem_baixa,
      20
    );
  END IF;
  
END;
$$;

-- Executar geração de alertas
SELECT generate_financial_alerts();
