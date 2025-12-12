/*
  # Sistema Completo de Gamificação e Indicação

  ## 1. Auditoria de Gamificação
    - Log completo de todas as ações
    
  ## 2. Indicação de Clientes
    - Registro de indicações
    - Geração automática de créditos
    - Saldo de créditos por cliente
    
  ## 3. Alimentação Automática
    - OSs concluídas atualizam metas
    - Indicações geram créditos automaticamente
*/

-- ==================================================================
-- 1. AUDITORIA
-- ==================================================================

CREATE TABLE IF NOT EXISTS gamification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  value_before numeric(15,2),
  value_after numeric(15,2),
  difference numeric(15,2),
  executed_by uuid,
  execution_type text DEFAULT 'manual',
  related_table text,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_action ON gamification_audit_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON gamification_audit_log(entity_type, entity_id);

-- ==================================================================
-- 2. CONFIGURAÇÃO DE INDICAÇÕES
-- ==================================================================

CREATE TABLE IF NOT EXISTS referral_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_cashback_percent numeric(5,2) DEFAULT 5.00,
  maintenance_cashback_percent numeric(5,2) DEFAULT 3.00,
  retrofit_cashback_percent numeric(5,2) DEFAULT 7.00,
  contract_cashback_percent numeric(5,2) DEFAULT 4.00,
  minimum_order_value numeric(15,2) DEFAULT 500.00,
  minimum_credit_generated numeric(15,2) DEFAULT 25.00,
  credit_expiration_days integer DEFAULT 365,
  max_credit_usage_percent numeric(5,2) DEFAULT 50.00,
  allow_credit_transfer boolean DEFAULT false,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO referral_config (active, notes) 
SELECT true, 'Configuração padrão do programa de indicação'
WHERE NOT EXISTS (SELECT 1 FROM referral_config LIMIT 1);

-- ==================================================================
-- 3. INDICAÇÕES
-- ==================================================================

CREATE TABLE IF NOT EXISTS customer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referred_customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  referral_date date DEFAULT CURRENT_DATE,
  referral_source text,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  service_type text,
  order_value numeric(15,2) DEFAULT 0,
  cashback_percent numeric(5,2) DEFAULT 0,
  credit_amount numeric(15,2) DEFAULT 0,
  status text DEFAULT 'pendente',
  confirmed_at timestamptz,
  credit_generated_at timestamptz,
  credit_expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ref_referrer ON customer_referrals(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_ref_referred ON customer_referrals(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_ref_status ON customer_referrals(status);

-- ==================================================================
-- 4. CRÉDITOS
-- ==================================================================

CREATE TABLE IF NOT EXISTS customer_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_type text NOT NULL,
  original_amount numeric(15,2) DEFAULT 0,
  used_amount numeric(15,2) DEFAULT 0,
  available_amount numeric(15,2) DEFAULT 0,
  referral_id uuid REFERENCES customer_referrals(id) ON DELETE SET NULL,
  source_description text,
  issued_date date DEFAULT CURRENT_DATE,
  expiration_date date,
  status text DEFAULT 'ativo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cred_customer ON customer_credits(customer_id);
CREATE INDEX IF NOT EXISTS idx_cred_status ON customer_credits(status);

-- ==================================================================
-- 5. TRANSAÇÕES DE CRÉDITO
-- ==================================================================

CREATE TABLE IF NOT EXISTS customer_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_id uuid NOT NULL REFERENCES customer_credits(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  amount numeric(15,2) NOT NULL,
  balance_before numeric(15,2) NOT NULL,
  balance_after numeric(15,2) NOT NULL,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  description text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trans_customer ON customer_credit_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_trans_credit ON customer_credit_transactions(credit_id);

-- ==================================================================
-- 6. TRIGGER PARA ATUALIZAR SALDO
-- ==================================================================

CREATE OR REPLACE FUNCTION update_credit_available_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.available_amount := NEW.original_amount - NEW.used_amount;
  
  IF NEW.available_amount <= 0 AND NEW.status = 'ativo' THEN
    NEW.status := 'utilizado';
  END IF;
  
  IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < CURRENT_DATE AND NEW.status = 'ativo' THEN
    NEW.status := 'expirado';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_credit_available ON customer_credits;
CREATE TRIGGER trigger_update_credit_available
  BEFORE INSERT OR UPDATE ON customer_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_available_amount();

-- ==================================================================
-- 7. FUNCTION: REGISTRAR INDICAÇÃO
-- ==================================================================

CREATE OR REPLACE FUNCTION register_customer_referral(
  p_referrer_id uuid,
  p_referred_id uuid,
  p_source text DEFAULT 'direta'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_id uuid;
BEGIN
  IF p_referrer_id = p_referred_id THEN
    RAISE EXCEPTION 'Cliente não pode indicar a si mesmo';
  END IF;
  
  INSERT INTO customer_referrals (
    referrer_customer_id,
    referred_customer_id,
    referral_source,
    status
  ) VALUES (
    p_referrer_id,
    p_referred_id,
    p_source,
    'pendente'
  )
  RETURNING id INTO v_referral_id;
  
  RETURN v_referral_id;
END;
$$;

-- ==================================================================
-- 8. FUNCTION: GERAR CRÉDITO
-- ==================================================================

CREATE OR REPLACE FUNCTION confirm_referral_and_generate_credit(
  p_referral_id uuid,
  p_service_order_id uuid,
  p_order_value numeric,
  p_service_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config referral_config%ROWTYPE;
  v_cashback_percent numeric(5,2);
  v_credit_amount numeric(15,2);
  v_referrer_id uuid;
  v_credit_id uuid;
BEGIN
  SELECT * INTO v_config FROM referral_config WHERE active = true LIMIT 1;
  
  IF NOT FOUND OR p_order_value < v_config.minimum_order_value THEN
    RETURN;
  END IF;
  
  v_cashback_percent := CASE p_service_type
    WHEN 'instalacao' THEN v_config.installation_cashback_percent
    WHEN 'manutencao' THEN v_config.maintenance_cashback_percent
    WHEN 'retrofit' THEN v_config.retrofit_cashback_percent
    WHEN 'contrato' THEN v_config.contract_cashback_percent
    ELSE 3.00
  END;
  
  v_credit_amount := ROUND((p_order_value * v_cashback_percent / 100), 2);
  
  IF v_credit_amount < v_config.minimum_credit_generated THEN
    RETURN;
  END IF;
  
  UPDATE customer_referrals
  SET 
    service_order_id = p_service_order_id,
    service_type = p_service_type,
    order_value = p_order_value,
    cashback_percent = v_cashback_percent,
    credit_amount = v_credit_amount,
    status = 'credito_gerado',
    confirmed_at = now(),
    credit_generated_at = now(),
    credit_expires_at = CURRENT_DATE + v_config.credit_expiration_days,
    updated_at = now()
  WHERE id = p_referral_id
  RETURNING referrer_customer_id INTO v_referrer_id;
  
  INSERT INTO customer_credits (
    customer_id,
    credit_type,
    original_amount,
    referral_id,
    source_description,
    expiration_date,
    status
  ) VALUES (
    v_referrer_id,
    'indicacao',
    v_credit_amount,
    p_referral_id,
    'Crédito por indicação de cliente',
    CURRENT_DATE + v_config.credit_expiration_days,
    'ativo'
  )
  RETURNING id INTO v_credit_id;
  
  INSERT INTO customer_credit_transactions (
    customer_id,
    credit_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    service_order_id,
    description
  ) VALUES (
    v_referrer_id,
    v_credit_id,
    'credito',
    v_credit_amount,
    0,
    v_credit_amount,
    p_service_order_id,
    format('Crédito por indicação: %s%% de R$ %s', v_cashback_percent, p_order_value)
  );
END;
$$;

-- ==================================================================
-- 9. FUNCTION: UTILIZAR CRÉDITO
-- ==================================================================

CREATE OR REPLACE FUNCTION use_customer_credit(
  p_customer_id uuid,
  p_service_order_id uuid,
  p_amount_to_use numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_amount_used numeric(15,2) := 0;
  v_remaining numeric(15,2);
  v_credit record;
BEGIN
  v_remaining := p_amount_to_use;
  
  FOR v_credit IN (
    SELECT *
    FROM customer_credits
    WHERE customer_id = p_customer_id
      AND status = 'ativo'
      AND available_amount > 0
      AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
    ORDER BY 
      CASE WHEN expiration_date IS NULL THEN 1 ELSE 0 END,
      expiration_date ASC
  ) LOOP
    DECLARE
      v_to_use numeric(15,2);
    BEGIN
      v_to_use := LEAST(v_credit.available_amount, v_remaining);
      
      UPDATE customer_credits
      SET used_amount = used_amount + v_to_use
      WHERE id = v_credit.id;
      
      INSERT INTO customer_credit_transactions (
        customer_id,
        credit_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        service_order_id,
        description
      ) VALUES (
        p_customer_id,
        v_credit.id,
        'utilizacao',
        v_to_use,
        v_credit.available_amount,
        v_credit.available_amount - v_to_use,
        p_service_order_id,
        'Crédito utilizado em OS'
      );
      
      v_amount_used := v_amount_used + v_to_use;
      v_remaining := v_remaining - v_to_use;
      
      EXIT WHEN v_remaining <= 0;
    END;
  END LOOP;
  
  RETURN v_amount_used;
END;
$$;

-- ==================================================================
-- 10. TRIGGER: ATUALIZAR METAS E GERAR CRÉDITOS
-- ==================================================================

CREATE OR REPLACE FUNCTION update_goals_and_referrals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    
    v_employee_id := NEW.created_by;
    
    UPDATE employee_goals
    SET 
      achieved_amount = achieved_amount + NEW.total_value,
      updated_at = now()
    WHERE employee_id = v_employee_id
      AND status = 'ativa';
    
    IF EXISTS (
      SELECT 1 FROM customer_referrals
      WHERE referred_customer_id = NEW.customer_id
        AND status = 'pendente'
    ) THEN
      PERFORM confirm_referral_and_generate_credit(
        (SELECT id FROM customer_referrals WHERE referred_customer_id = NEW.customer_id AND status = 'pendente' LIMIT 1),
        NEW.id,
        NEW.total_value,
        COALESCE(NEW.service_type, 'manutencao')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_goals_and_referrals ON service_orders;
CREATE TRIGGER trigger_update_goals_and_referrals
  AFTER INSERT OR UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_and_referrals();

-- ==================================================================
-- 11. RLS
-- ==================================================================

ALTER TABLE gamification_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all audit" ON gamification_audit_log;
DROP POLICY IF EXISTS "Allow all config" ON referral_config;
DROP POLICY IF EXISTS "Allow all referrals" ON customer_referrals;
DROP POLICY IF EXISTS "Allow all credits" ON customer_credits;
DROP POLICY IF EXISTS "Allow all transactions" ON customer_credit_transactions;

CREATE POLICY "Allow all audit" ON gamification_audit_log FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all config" ON referral_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all referrals" ON customer_referrals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all credits" ON customer_credits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all transactions" ON customer_credit_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
