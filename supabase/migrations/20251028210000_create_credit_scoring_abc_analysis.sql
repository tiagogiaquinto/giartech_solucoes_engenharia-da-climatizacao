/*
  # Sistema de Credit Scoring e Análise ABC de Clientes

  1. Credit Scoring
    - Tabela customer_credit_score
    - Cálculo automático de score
    - Histórico de mudanças
    - Limites de crédito sugeridos

  2. Análise ABC
    - Segmentação de clientes
    - Cálculo automático de classe
    - Estratégias diferenciadas
    - Métricas por classe

  3. Clientes em Risco
    - Identificação automática
    - Score de risco
    - Alertas preventivos
*/

-- ========================================
-- TABELA: Customer Credit Score
-- ========================================

CREATE TABLE IF NOT EXISTS customer_credit_score (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,

  -- Score (0-1000)
  score integer NOT NULL DEFAULT 500,
  score_category text NOT NULL DEFAULT 'medium',

  -- Fatores do Score
  payment_history_score integer DEFAULT 0,
  purchase_frequency_score integer DEFAULT 0,
  average_ticket_score integer DEFAULT 0,
  customer_age_score integer DEFAULT 0,
  default_history_score integer DEFAULT 0,

  -- Limite de Crédito
  suggested_credit_limit numeric(15,2) DEFAULT 0,
  current_credit_limit numeric(15,2) DEFAULT 0,
  available_credit numeric(15,2) DEFAULT 0,

  -- Status
  status text NOT NULL DEFAULT 'active',
  last_calculated_at timestamptz DEFAULT now(),

  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 1000),
  CONSTRAINT valid_category CHECK (score_category IN ('excellent', 'good', 'medium', 'poor', 'high_risk')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'blocked')),
  CONSTRAINT unique_customer_score UNIQUE (customer_id)
);

CREATE INDEX idx_customer_credit_score_customer ON customer_credit_score(customer_id);
CREATE INDEX idx_customer_credit_score_category ON customer_credit_score(score_category, score DESC);
CREATE INDEX idx_customer_credit_score_score ON customer_credit_score(score DESC);

-- ========================================
-- TABELA: Customer ABC Classification
-- ========================================

CREATE TABLE IF NOT EXISTS customer_abc_classification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,

  -- Classificação ABC
  abc_class text NOT NULL DEFAULT 'C',

  -- Métricas
  total_revenue numeric(15,2) DEFAULT 0,
  total_orders integer DEFAULT 0,
  average_order_value numeric(15,2) DEFAULT 0,
  lifetime_value numeric(15,2) DEFAULT 0,
  avg_margin_percent numeric(5,2) DEFAULT 0,

  -- Ranking
  revenue_rank integer,
  percentile numeric(5,2),

  -- Estratégia Recomendada
  recommended_strategy text,

  -- Status
  last_calculated_at timestamptz DEFAULT now(),

  -- Auditoria
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_abc_class CHECK (abc_class IN ('A', 'B', 'C')),
  CONSTRAINT unique_customer_abc UNIQUE (customer_id)
);

CREATE INDEX idx_customer_abc_class ON customer_abc_classification(abc_class, revenue_rank);
CREATE INDEX idx_customer_abc_revenue ON customer_abc_classification(total_revenue DESC);

-- ========================================
-- TABELA: Customer Risk Assessment
-- ========================================

CREATE TABLE IF NOT EXISTS customer_risk_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,

  -- Score de Risco (0-100, quanto maior, maior o risco)
  risk_score integer DEFAULT 0,
  risk_level text DEFAULT 'low',

  -- Fatores de Risco
  days_since_last_purchase integer DEFAULT 0,
  ticket_reduction_percent numeric(5,2) DEFAULT 0,
  payment_delay_days integer DEFAULT 0,
  complaint_count integer DEFAULT 0,

  -- Status
  is_at_risk boolean DEFAULT false,
  churn_probability numeric(5,2) DEFAULT 0,

  -- Ações Recomendadas
  recommended_actions jsonb DEFAULT '[]'::jsonb,

  -- Auditoria
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100),
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT unique_customer_risk UNIQUE (customer_id)
);

CREATE INDEX idx_customer_risk_level ON customer_risk_assessment(risk_level, risk_score DESC);
CREATE INDEX idx_customer_risk_at_risk ON customer_risk_assessment(is_at_risk, risk_score DESC) WHERE is_at_risk = true;

-- ========================================
-- FUNÇÃO: Calcular Credit Score
-- ========================================

CREATE OR REPLACE FUNCTION calculate_customer_credit_score(p_customer_id uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_score integer := 500; -- Base score
  v_payment_score integer := 0;
  v_frequency_score integer := 0;
  v_ticket_score integer := 0;
  v_age_score integer := 0;
  v_default_score integer := 0;
  v_category text;
  v_credit_limit numeric;

  -- Dados do cliente
  v_total_orders integer;
  v_paid_on_time integer;
  v_avg_ticket numeric;
  v_customer_age_days integer;
  v_total_revenue numeric;
  v_overdue_count integer;
BEGIN
  -- 1. Histórico de Pagamentos (0-300 pontos)
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'paid' AND paid_at <= due_date) as paid_on_time,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue
  INTO v_total_orders, v_paid_on_time, v_overdue_count
  FROM finance_entries
  WHERE customer_id = p_customer_id AND type = 'income';

  IF v_total_orders > 0 THEN
    v_payment_score := LEAST(300, (v_paid_on_time::numeric / v_total_orders * 300)::integer);
    v_default_score := GREATEST(-200, -50 * v_overdue_count);
  END IF;

  -- 2. Frequência de Compras (0-200 pontos)
  SELECT COUNT(*) INTO v_total_orders
  FROM service_orders
  WHERE customer_id = p_customer_id AND status = 'completed';

  v_frequency_score := CASE
    WHEN v_total_orders >= 50 THEN 200
    WHEN v_total_orders >= 20 THEN 150
    WHEN v_total_orders >= 10 THEN 100
    WHEN v_total_orders >= 5 THEN 50
    ELSE 0
  END;

  -- 3. Ticket Médio (0-200 pontos)
  SELECT
    COALESCE(AVG(total_value), 0),
    COALESCE(SUM(total_value), 0)
  INTO v_avg_ticket, v_total_revenue
  FROM service_orders
  WHERE customer_id = p_customer_id AND status = 'completed';

  v_ticket_score := CASE
    WHEN v_avg_ticket >= 10000 THEN 200
    WHEN v_avg_ticket >= 5000 THEN 150
    WHEN v_avg_ticket >= 2000 THEN 100
    WHEN v_avg_ticket >= 1000 THEN 50
    ELSE 0
  END;

  -- 4. Tempo como Cliente (0-200 pontos)
  SELECT EXTRACT(DAY FROM CURRENT_DATE - created_at)::integer
  INTO v_customer_age_days
  FROM customers
  WHERE id = p_customer_id;

  v_age_score := CASE
    WHEN v_customer_age_days >= 730 THEN 200  -- 2+ anos
    WHEN v_customer_age_days >= 365 THEN 150  -- 1+ ano
    WHEN v_customer_age_days >= 180 THEN 100  -- 6+ meses
    WHEN v_customer_age_days >= 90 THEN 50    -- 3+ meses
    ELSE 0
  END;

  -- Calcular score final
  v_score := v_score + v_payment_score + v_frequency_score + v_ticket_score + v_age_score + v_default_score;
  v_score := GREATEST(0, LEAST(1000, v_score)); -- Limitar entre 0-1000

  -- Definir categoria
  v_category := CASE
    WHEN v_score >= 901 THEN 'excellent'
    WHEN v_score >= 701 THEN 'good'
    WHEN v_score >= 501 THEN 'medium'
    WHEN v_score >= 301 THEN 'poor'
    ELSE 'high_risk'
  END;

  -- Calcular limite de crédito sugerido
  v_credit_limit := CASE
    WHEN v_score >= 901 THEN v_avg_ticket * 5
    WHEN v_score >= 701 THEN v_avg_ticket * 3
    WHEN v_score >= 501 THEN v_avg_ticket * 2
    WHEN v_score >= 301 THEN v_avg_ticket * 1
    ELSE 0
  END;

  -- Inserir ou atualizar score
  INSERT INTO customer_credit_score (
    customer_id, score, score_category,
    payment_history_score, purchase_frequency_score,
    average_ticket_score, customer_age_score, default_history_score,
    suggested_credit_limit, current_credit_limit, available_credit,
    last_calculated_at, updated_at
  ) VALUES (
    p_customer_id, v_score, v_category,
    v_payment_score, v_frequency_score,
    v_ticket_score, v_age_score, v_default_score,
    v_credit_limit, v_credit_limit, v_credit_limit,
    now(), now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    score = EXCLUDED.score,
    score_category = EXCLUDED.score_category,
    payment_history_score = EXCLUDED.payment_history_score,
    purchase_frequency_score = EXCLUDED.purchase_frequency_score,
    average_ticket_score = EXCLUDED.average_ticket_score,
    customer_age_score = EXCLUDED.customer_age_score,
    default_history_score = EXCLUDED.default_history_score,
    suggested_credit_limit = EXCLUDED.suggested_credit_limit,
    last_calculated_at = now(),
    updated_at = now();

  RETURN v_score;
END;
$$;

-- ========================================
-- FUNÇÃO: Calcular ABC Classification
-- ========================================

CREATE OR REPLACE FUNCTION calculate_customer_abc_classification()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer record;
  v_total_customers integer;
  v_rank integer := 0;
  v_cumulative_revenue numeric := 0;
  v_total_revenue numeric;
  v_percentile numeric;
  v_abc_class text;
  v_strategy text;
BEGIN
  -- Calcular receita total
  SELECT COALESCE(SUM(total_value), 0) INTO v_total_revenue
  FROM service_orders
  WHERE status = 'completed';

  -- Contar clientes
  SELECT COUNT(*) INTO v_total_customers FROM customers WHERE status = 'active';

  -- Processar cada cliente por ordem de receita
  FOR v_customer IN
    SELECT
      c.id,
      c.name,
      COALESCE(SUM(so.total_value), 0) as total_revenue,
      COUNT(so.id) as total_orders,
      COALESCE(AVG(so.total_value), 0) as avg_order_value,
      COALESCE(AVG(so.margin_percent), 0) as avg_margin
    FROM customers c
    LEFT JOIN service_orders so ON c.id = so.customer_id AND so.status = 'completed'
    WHERE c.status = 'active'
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
  LOOP
    v_rank := v_rank + 1;
    v_cumulative_revenue := v_cumulative_revenue + v_customer.total_revenue;
    v_percentile := (v_cumulative_revenue / NULLIF(v_total_revenue, 0) * 100)::numeric(5,2);

    -- Classificar ABC
    IF v_percentile <= 80 THEN
      v_abc_class := 'A';
      v_strategy := 'VIP: Gerente dedicado, atendimento personalizado, condições especiais';
    ELSIF v_percentile <= 95 THEN
      v_abc_class := 'B';
      v_strategy := 'Premium: Programa fidelidade, up-sell, contato regular';
    ELSE
      v_abc_class := 'C';
      v_strategy := 'Regular: Automação, eficiência, cross-sell oportunista';
    END IF;

    -- Inserir ou atualizar
    INSERT INTO customer_abc_classification (
      customer_id, abc_class,
      total_revenue, total_orders, average_order_value,
      lifetime_value, avg_margin_percent,
      revenue_rank, percentile,
      recommended_strategy,
      last_calculated_at, updated_at
    ) VALUES (
      v_customer.id, v_abc_class,
      v_customer.total_revenue, v_customer.total_orders, v_customer.avg_order_value,
      v_customer.total_revenue, v_customer.avg_margin,
      v_rank, v_percentile,
      v_strategy,
      now(), now()
    )
    ON CONFLICT (customer_id) DO UPDATE SET
      abc_class = EXCLUDED.abc_class,
      total_revenue = EXCLUDED.total_revenue,
      total_orders = EXCLUDED.total_orders,
      average_order_value = EXCLUDED.average_order_value,
      lifetime_value = EXCLUDED.lifetime_value,
      avg_margin_percent = EXCLUDED.avg_margin_percent,
      revenue_rank = EXCLUDED.revenue_rank,
      percentile = EXCLUDED.percentile,
      recommended_strategy = EXCLUDED.recommended_strategy,
      last_calculated_at = now(),
      updated_at = now();
  END LOOP;
END;
$$;

-- ========================================
-- FUNÇÃO: Avaliar Risco de Cliente
-- ========================================

CREATE OR REPLACE FUNCTION assess_customer_risk(p_customer_id uuid)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_risk_score integer := 0;
  v_risk_level text := 'low';
  v_days_since_last integer;
  v_ticket_reduction numeric;
  v_payment_delay integer;
  v_is_at_risk boolean := false;
  v_actions jsonb := '[]'::jsonb;
  v_last_order_date date;
  v_avg_ticket_current numeric;
  v_avg_ticket_previous numeric;
BEGIN
  -- 1. Dias desde última compra (0-40 pontos)
  SELECT MAX(created_at)::date INTO v_last_order_date
  FROM service_orders
  WHERE customer_id = p_customer_id;

  v_days_since_last := COALESCE(CURRENT_DATE - v_last_order_date, 999);

  v_risk_score := v_risk_score + CASE
    WHEN v_days_since_last >= 180 THEN 40
    WHEN v_days_since_last >= 120 THEN 30
    WHEN v_days_since_last >= 90 THEN 20
    WHEN v_days_since_last >= 60 THEN 10
    ELSE 0
  END;

  IF v_days_since_last > 60 THEN
    v_actions := v_actions || '{"action": "contact_customer", "priority": "high", "message": "Cliente sem compras há ' || v_days_since_last || ' dias"}'::jsonb;
  END IF;

  -- 2. Redução de ticket médio (0-30 pontos)
  SELECT AVG(total_value) INTO v_avg_ticket_current
  FROM service_orders
  WHERE customer_id = p_customer_id
    AND created_at >= CURRENT_DATE - INTERVAL '3 months';

  SELECT AVG(total_value) INTO v_avg_ticket_previous
  FROM service_orders
  WHERE customer_id = p_customer_id
    AND created_at >= CURRENT_DATE - INTERVAL '6 months'
    AND created_at < CURRENT_DATE - INTERVAL '3 months';

  IF v_avg_ticket_previous > 0 THEN
    v_ticket_reduction := ((v_avg_ticket_previous - v_avg_ticket_current) / v_avg_ticket_previous * 100)::numeric(5,2);

    v_risk_score := v_risk_score + CASE
      WHEN v_ticket_reduction >= 50 THEN 30
      WHEN v_ticket_reduction >= 30 THEN 20
      WHEN v_ticket_reduction >= 15 THEN 10
      ELSE 0
    END;

    IF v_ticket_reduction > 30 THEN
      v_actions := v_actions || '{"action": "review_pricing", "priority": "medium", "message": "Ticket médio reduziu ' || v_ticket_reduction::text || '%"}'::jsonb;
    END IF;
  END IF;

  -- 3. Atraso em pagamentos (0-30 pontos)
  SELECT
    AVG(EXTRACT(DAY FROM paid_at - due_date))::integer
  INTO v_payment_delay
  FROM finance_entries
  WHERE customer_id = p_customer_id
    AND type = 'income'
    AND status = 'paid'
    AND paid_at > due_date;

  v_payment_delay := COALESCE(v_payment_delay, 0);

  v_risk_score := v_risk_score + CASE
    WHEN v_payment_delay >= 30 THEN 30
    WHEN v_payment_delay >= 15 THEN 20
    WHEN v_payment_delay >= 7 THEN 10
    ELSE 0
  END;

  IF v_payment_delay > 15 THEN
    v_actions := v_actions || '{"action": "review_credit", "priority": "high", "message": "Atraso médio de ' || v_payment_delay::text || ' dias"}'::jsonb;
  END IF;

  -- Determinar nível de risco
  v_risk_level := CASE
    WHEN v_risk_score >= 70 THEN 'critical'
    WHEN v_risk_score >= 50 THEN 'high'
    WHEN v_risk_score >= 30 THEN 'medium'
    ELSE 'low'
  END;

  v_is_at_risk := v_risk_score >= 50;

  -- Inserir ou atualizar
  INSERT INTO customer_risk_assessment (
    customer_id, risk_score, risk_level,
    days_since_last_purchase, ticket_reduction_percent, payment_delay_days,
    is_at_risk, churn_probability,
    recommended_actions,
    last_calculated_at, updated_at
  ) VALUES (
    p_customer_id, v_risk_score, v_risk_level,
    v_days_since_last, COALESCE(v_ticket_reduction, 0), v_payment_delay,
    v_is_at_risk, (v_risk_score / 100.0 * 100)::numeric(5,2),
    v_actions,
    now(), now()
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    risk_score = EXCLUDED.risk_score,
    risk_level = EXCLUDED.risk_level,
    days_since_last_purchase = EXCLUDED.days_since_last_purchase,
    ticket_reduction_percent = EXCLUDED.ticket_reduction_percent,
    payment_delay_days = EXCLUDED.payment_delay_days,
    is_at_risk = EXCLUDED.is_at_risk,
    churn_probability = EXCLUDED.churn_probability,
    recommended_actions = EXCLUDED.recommended_actions,
    last_calculated_at = now(),
    updated_at = now();

  RETURN v_risk_score;
END;
$$;

-- ========================================
-- VIEW: Customer Intelligence Dashboard
-- ========================================

CREATE OR REPLACE VIEW v_customer_intelligence AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,

  -- Credit Score
  cs.score as credit_score,
  cs.score_category,
  cs.suggested_credit_limit,
  cs.available_credit,

  -- ABC Classification
  abc.abc_class,
  abc.total_revenue,
  abc.total_orders,
  abc.average_order_value,
  abc.lifetime_value,
  abc.revenue_rank,
  abc.recommended_strategy,

  -- Risk Assessment
  ra.risk_score,
  ra.risk_level,
  ra.is_at_risk,
  ra.churn_probability,
  ra.days_since_last_purchase,
  ra.recommended_actions,

  -- Status Geral
  CASE
    WHEN ra.is_at_risk THEN 'at_risk'
    WHEN abc.abc_class = 'A' THEN 'vip'
    WHEN abc.abc_class = 'B' THEN 'premium'
    ELSE 'regular'
  END as customer_status

FROM customers c
LEFT JOIN customer_credit_score cs ON c.id = cs.customer_id
LEFT JOIN customer_abc_classification abc ON c.id = abc.customer_id
LEFT JOIN customer_risk_assessment ra ON c.id = ra.customer_id
WHERE c.status = 'active';

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE customer_credit_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_abc_classification ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_risk_assessment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to credit scores"
  ON customer_credit_score FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to abc classification"
  ON customer_abc_classification FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to risk assessment"
  ON customer_risk_assessment FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ========================================
-- GRANTS
-- ========================================

GRANT SELECT ON v_customer_intelligence TO anon, authenticated;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON TABLE customer_credit_score IS 'Score de crédito de clientes (0-1000)';
COMMENT ON TABLE customer_abc_classification IS 'Classificação ABC de clientes por faturamento';
COMMENT ON TABLE customer_risk_assessment IS 'Avaliação de risco de churn de clientes';
COMMENT ON FUNCTION calculate_customer_credit_score IS 'Calcula score de crédito baseado em histórico';
COMMENT ON FUNCTION calculate_customer_abc_classification IS 'Classifica todos os clientes em A, B ou C';
COMMENT ON FUNCTION assess_customer_risk IS 'Avalia risco de perda do cliente';
COMMENT ON VIEW v_customer_intelligence IS 'Inteligência completa sobre clientes: score, ABC, risco';
