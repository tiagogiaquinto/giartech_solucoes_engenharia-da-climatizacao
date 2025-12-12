/*
  # Sistema Completo de Gamificação para CLIENTES

  ## 1. PONTOS DE CLIENTES
    - Acúmulo de pontos por compras
    - Pontos por indicações
    - Pontos por avaliações
    - Histórico completo de pontos
    
  ## 2. NÍVEIS/TIERS DE CLIENTES
    - Bronze (0-999 pontos)
    - Prata (1.000-2.999 pontos)
    - Ouro (3.000-6.999 pontos)
    - Diamante (7.000-14.999 pontos)
    - VIP (15.000+ pontos)
    
  ## 3. BADGES E CONQUISTAS
    - Primeira compra
    - Comprador frequente
    - Indicador expert
    - Cliente fiel
    - Pagador pontual
    
  ## 4. RECOMPENSAS POR NÍVEL
    - Descontos progressivos
    - Prioridade no atendimento
    - Brindes exclusivos
    - Atendimento VIP
    
  ## 5. ALIMENTAÇÃO AUTOMÁTICA
    - OS concluída → gera pontos
    - Indicação confirmada → bônus de pontos
    - Pagamento em dia → pontos extras
*/

-- ============================================================================
-- 1. CONFIGURAÇÃO DO SISTEMA DE GAMIFICAÇÃO
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_gamification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pontos por real gasto
  points_per_real_spent numeric(10,2) DEFAULT 1.00,
  
  -- Multiplicadores por tipo de serviço
  installation_multiplier numeric(5,2) DEFAULT 2.00,
  maintenance_multiplier numeric(5,2) DEFAULT 1.00,
  retrofit_multiplier numeric(5,2) DEFAULT 2.50,
  contract_multiplier numeric(5,2) DEFAULT 1.50,
  
  -- Bônus especiais
  referral_bonus_points integer DEFAULT 500,
  review_bonus_points integer DEFAULT 100,
  on_time_payment_bonus integer DEFAULT 50,
  birthday_bonus_points integer DEFAULT 200,
  
  -- Níveis e requisitos
  bronze_min_points integer DEFAULT 0,
  silver_min_points integer DEFAULT 1000,
  gold_min_points integer DEFAULT 3000,
  diamond_min_points integer DEFAULT 7000,
  vip_min_points integer DEFAULT 15000,
  
  -- Descontos por nível (%)
  bronze_discount numeric(5,2) DEFAULT 0.00,
  silver_discount numeric(5,2) DEFAULT 5.00,
  gold_discount numeric(5,2) DEFAULT 10.00,
  diamond_discount numeric(5,2) DEFAULT 15.00,
  vip_discount numeric(5,2) DEFAULT 20.00,
  
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO customer_gamification_config (active)
SELECT true
WHERE NOT EXISTS (SELECT 1 FROM customer_gamification_config LIMIT 1);

-- ============================================================================
-- 2. PONTOS DOS CLIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Pontos
  total_points integer DEFAULT 0,
  available_points integer DEFAULT 0,
  used_points integer DEFAULT 0,
  
  -- Nível atual (calculado automaticamente)
  current_tier text DEFAULT 'bronze',
  
  -- Estatísticas
  total_purchases integer DEFAULT 0,
  total_spent numeric(15,2) DEFAULT 0,
  total_referrals integer DEFAULT 0,
  successful_referrals integer DEFAULT 0,
  
  -- Datas importantes
  first_purchase_date date,
  last_purchase_date date,
  tier_achieved_date date,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_points_customer ON customer_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_points_tier ON customer_points(current_tier);
CREATE INDEX IF NOT EXISTS idx_customer_points_total ON customer_points(total_points DESC);

-- ============================================================================
-- 3. HISTÓRICO DE PONTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_points_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Tipo de transação
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'purchase',           -- Compra realizada
    'referral',          -- Indicação bem-sucedida
    'review',            -- Avaliação deixada
    'on_time_payment',   -- Pagamento em dia
    'birthday',          -- Aniversário
    'bonus',             -- Bônus manual
    'redemption',        -- Resgate de pontos
    'expiration',        -- Expiração de pontos
    'adjustment'         -- Ajuste manual
  )),
  
  -- Pontos
  points integer NOT NULL,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  
  -- Relacionamentos
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES customer_referrals(id) ON DELETE SET NULL,
  
  -- Descrição
  description text NOT NULL,
  notes text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_points_history_customer ON customer_points_history(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_type ON customer_points_history(transaction_type);

-- ============================================================================
-- 4. BADGES E CONQUISTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações do badge
  badge_code text NOT NULL UNIQUE,
  badge_name text NOT NULL,
  description text,
  badge_icon text,
  
  -- Tipo e nível
  badge_type text NOT NULL CHECK (badge_type IN (
    'purchase',      -- Relacionado a compras
    'referral',      -- Relacionado a indicações
    'loyalty',       -- Relacionado a fidelidade
    'payment',       -- Relacionado a pagamentos
    'engagement',    -- Relacionado a engajamento
    'special'        -- Especiais
  )),
  
  badge_level text CHECK (badge_level IN ('bronze', 'silver', 'gold', 'diamond', 'legendary')),
  
  -- Requisitos
  required_purchases integer,
  required_points integer,
  required_referrals integer,
  required_amount_spent numeric(15,2),
  
  -- Recompensa
  reward_points integer DEFAULT 0,
  
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_badges_type ON customer_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_active ON customer_badges(active);

-- ============================================================================
-- 5. BADGES CONQUISTADOS PELOS CLIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_badges_earned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES customer_badges(id) ON DELETE CASCADE,
  
  earned_date date DEFAULT CURRENT_DATE,
  notified boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(customer_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_earned_customer ON customer_badges_earned(customer_id);
CREATE INDEX IF NOT EXISTS idx_badges_earned_date ON customer_badges_earned(earned_date DESC);

-- ============================================================================
-- 6. RECOMPENSAS E BENEFÍCIOS POR NÍVEL
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_tier_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tier_level text NOT NULL CHECK (tier_level IN ('bronze', 'silver', 'gold', 'diamond', 'vip')),
  benefit_type text NOT NULL,
  benefit_description text NOT NULL,
  benefit_value text,
  
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tier_benefits_tier ON customer_tier_benefits(tier_level);

-- ============================================================================
-- 7. INSERIR BADGES PADRÃO
-- ============================================================================

INSERT INTO customer_badges (badge_code, badge_name, description, badge_type, badge_level, required_purchases, reward_points) VALUES
('first_purchase', 'Primeira Compra', 'Realizou sua primeira compra', 'purchase', 'bronze', 1, 100),
('buyer_5', 'Comprador Iniciante', 'Realizou 5 compras', 'purchase', 'bronze', 5, 200),
('buyer_10', 'Comprador Frequente', 'Realizou 10 compras', 'purchase', 'silver', 10, 500),
('buyer_25', 'Comprador Assíduo', 'Realizou 25 compras', 'purchase', 'gold', 25, 1000),
('buyer_50', 'Comprador Expert', 'Realizou 50 compras', 'purchase', 'diamond', 50, 2500),
('buyer_100', 'Comprador Lendário', 'Realizou 100 compras', 'purchase', 'legendary', 100, 5000),

('referrer_1', 'Primeiro Indicador', 'Indicou 1 cliente', 'referral', 'bronze', NULL, 100),
('referrer_3', 'Indicador Bronze', 'Indicou 3 clientes', 'referral', 'bronze', NULL, 300),
('referrer_5', 'Indicador Prata', 'Indicou 5 clientes', 'referral', 'silver', NULL, 600),
('referrer_10', 'Indicador Ouro', 'Indicou 10 clientes', 'referral', 'gold', NULL, 1500),
('referrer_20', 'Indicador Diamante', 'Indicou 20 clientes', 'referral', 'diamond', NULL, 3500),

('loyal_1year', 'Cliente Fiel - 1 Ano', 'Cliente há 1 ano', 'loyalty', 'silver', NULL, 500),
('loyal_2years', 'Cliente Fiel - 2 Anos', 'Cliente há 2 anos', 'loyalty', 'gold', NULL, 1200),
('loyal_5years', 'Cliente Fiel - 5 Anos', 'Cliente há 5 anos', 'loyalty', 'diamond', NULL, 3000),

('big_spender_10k', 'Grande Comprador', 'Gastou R$ 10.000', 'purchase', 'silver', NULL, 500),
('big_spender_50k', 'Mega Comprador', 'Gastou R$ 50.000', 'purchase', 'gold', NULL, 2000),
('big_spender_100k', 'Ultra Comprador', 'Gastou R$ 100.000', 'purchase', 'diamond', NULL, 5000)

ON CONFLICT (badge_code) DO NOTHING;

-- ============================================================================
-- 8. INSERIR BENEFÍCIOS POR NÍVEL
-- ============================================================================

INSERT INTO customer_tier_benefits (tier_level, benefit_type, benefit_description, benefit_value, display_order) VALUES
-- Bronze
('bronze', 'discount', 'Sem desconto', '0%', 1),
('bronze', 'support', 'Suporte padrão', 'Horário comercial', 2),
('bronze', 'priority', 'Atendimento normal', 'Ordem de chegada', 3),

-- Prata
('silver', 'discount', 'Desconto em serviços', '5%', 1),
('silver', 'support', 'Suporte estendido', 'Até 20h', 2),
('silver', 'priority', 'Prioridade básica', 'Fila preferencial', 3),
('silver', 'gift', 'Brindes em compras', 'Acima de R$ 1.000', 4),

-- Ouro
('gold', 'discount', 'Desconto em serviços', '10%', 1),
('gold', 'support', 'Suporte prioritário', '24/7', 2),
('gold', 'priority', 'Alta prioridade', 'Atendimento rápido', 3),
('gold', 'gift', 'Brindes premium', 'Em todas as compras', 4),
('gold', 'maintenance', 'Manutenção gratuita', '1x por ano', 5),

-- Diamante
('diamond', 'discount', 'Desconto em serviços', '15%', 1),
('diamond', 'support', 'Suporte VIP', '24/7 com técnico dedicado', 2),
('diamond', 'priority', 'Prioridade máxima', 'Atendimento imediato', 3),
('diamond', 'gift', 'Brindes exclusivos', 'Kit premium', 4),
('diamond', 'maintenance', 'Manutenção gratuita', '2x por ano', 5),
('diamond', 'emergency', 'Atendimento emergencial', 'Grátis', 6),

-- VIP
('vip', 'discount', 'Desconto em serviços', '20%', 1),
('vip', 'support', 'Gerente de conta dedicado', 'Contato direto', 2),
('vip', 'priority', 'Prioridade absoluta', 'Primeiro da fila sempre', 3),
('vip', 'gift', 'Presentes VIP', 'Exclusivos e personalizados', 4),
('vip', 'maintenance', 'Manutenção ilimitada', 'Sem limite', 5),
('vip', 'emergency', 'Atendimento emergencial', 'Grátis e prioritário', 6),
('vip', 'consulting', 'Consultoria técnica', 'Trimestral gratuita', 7),
('vip', 'events', 'Eventos exclusivos', 'Convites especiais', 8)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

-- Function: Calcular nível do cliente
CREATE OR REPLACE FUNCTION calculate_customer_tier(p_points integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_config customer_gamification_config%ROWTYPE;
BEGIN
  SELECT * INTO v_config FROM customer_gamification_config WHERE active = true LIMIT 1;
  
  IF p_points >= v_config.vip_min_points THEN
    RETURN 'vip';
  ELSIF p_points >= v_config.diamond_min_points THEN
    RETURN 'diamond';
  ELSIF p_points >= v_config.gold_min_points THEN
    RETURN 'gold';
  ELSIF p_points >= v_config.silver_min_points THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- Function: Adicionar pontos ao cliente
CREATE OR REPLACE FUNCTION add_customer_points(
  p_customer_id uuid,
  p_points integer,
  p_transaction_type text,
  p_description text,
  p_service_order_id uuid DEFAULT NULL,
  p_referral_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points customer_points%ROWTYPE;
  v_new_total integer;
  v_new_tier text;
  v_old_tier text;
BEGIN
  -- Buscar ou criar registro de pontos
  SELECT * INTO v_current_points
  FROM customer_points
  WHERE customer_id = p_customer_id;
  
  IF NOT FOUND THEN
    INSERT INTO customer_points (customer_id, total_points, available_points)
    VALUES (p_customer_id, 0, 0)
    RETURNING * INTO v_current_points;
  END IF;
  
  v_new_total := v_current_points.total_points + p_points;
  v_old_tier := v_current_points.current_tier;
  v_new_tier := calculate_customer_tier(v_new_total);
  
  -- Atualizar pontos
  UPDATE customer_points
  SET
    total_points = v_new_total,
    available_points = available_points + p_points,
    current_tier = v_new_tier,
    tier_achieved_date = CASE 
      WHEN v_new_tier != v_old_tier THEN CURRENT_DATE
      ELSE tier_achieved_date
    END,
    updated_at = now()
  WHERE customer_id = p_customer_id;
  
  -- Registrar histórico
  INSERT INTO customer_points_history (
    customer_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    service_order_id,
    referral_id,
    description
  ) VALUES (
    p_customer_id,
    p_transaction_type,
    p_points,
    v_current_points.total_points,
    v_new_total,
    p_service_order_id,
    p_referral_id,
    p_description
  );
  
  -- Log de auditoria
  INSERT INTO gamification_audit_log (
    action_type,
    entity_type,
    entity_id,
    description,
    value_before,
    value_after,
    difference,
    execution_type,
    related_table
  ) VALUES (
    'pontos_adicionados',
    'customer',
    p_customer_id,
    p_description,
    v_current_points.total_points,
    v_new_total,
    p_points,
    'automatic',
    'customer_points'
  );
  
  -- Se mudou de nível, registrar
  IF v_new_tier != v_old_tier THEN
    INSERT INTO gamification_audit_log (
      action_type,
      entity_type,
      entity_id,
      description,
      execution_type
    ) VALUES (
      'conquista_concedida',
      'customer',
      p_customer_id,
      format('Cliente subiu para nível %s', UPPER(v_new_tier)),
      'automatic'
    );
  END IF;
END;
$$;

-- Function: Verificar e conceder badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points customer_points%ROWTYPE;
  v_badge customer_badges%ROWTYPE;
BEGIN
  SELECT * INTO v_points FROM customer_points WHERE customer_id = p_customer_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Verificar todos os badges
  FOR v_badge IN (
    SELECT * FROM customer_badges 
    WHERE active = true
    AND id NOT IN (
      SELECT badge_id FROM customer_badges_earned WHERE customer_id = p_customer_id
    )
  ) LOOP
    DECLARE
      v_qualifies boolean := false;
    BEGIN
      -- Verificar requisitos
      IF v_badge.required_purchases IS NOT NULL THEN
        v_qualifies := v_points.total_purchases >= v_badge.required_purchases;
      END IF;
      
      IF v_badge.required_points IS NOT NULL THEN
        v_qualifies := v_points.total_points >= v_badge.required_points;
      END IF;
      
      IF v_badge.required_referrals IS NOT NULL THEN
        v_qualifies := v_points.successful_referrals >= v_badge.required_referrals;
      END IF;
      
      IF v_badge.required_amount_spent IS NOT NULL THEN
        v_qualifies := v_points.total_spent >= v_badge.required_amount_spent;
      END IF;
      
      -- Conceder badge se qualificado
      IF v_qualifies THEN
        INSERT INTO customer_badges_earned (customer_id, badge_id)
        VALUES (p_customer_id, v_badge.id)
        ON CONFLICT (customer_id, badge_id) DO NOTHING;
        
        -- Dar pontos de recompensa
        IF v_badge.reward_points > 0 THEN
          PERFORM add_customer_points(
            p_customer_id,
            v_badge.reward_points,
            'bonus',
            format('Conquistou badge: %s', v_badge.badge_name)
          );
        END IF;
      END IF;
    END;
  END LOOP;
END;
$$;

-- ============================================================================
-- 10. TRIGGERS PARA ALIMENTAÇÃO AUTOMÁTICA
-- ============================================================================

-- Trigger: Adicionar pontos quando OS for concluída
CREATE OR REPLACE FUNCTION award_points_on_os_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config customer_gamification_config%ROWTYPE;
  v_points integer;
  v_multiplier numeric(5,2);
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    
    SELECT * INTO v_config FROM customer_gamification_config WHERE active = true LIMIT 1;
    
    IF FOUND THEN
      -- Determinar multiplicador por tipo de serviço
      v_multiplier := CASE NEW.service_type
        WHEN 'instalacao' THEN v_config.installation_multiplier
        WHEN 'retrofit' THEN v_config.retrofit_multiplier
        WHEN 'contrato' THEN v_config.contract_multiplier
        ELSE v_config.maintenance_multiplier
      END;
      
      -- Calcular pontos
      v_points := ROUND(NEW.total_value * v_config.points_per_real_spent * v_multiplier);
      
      -- Adicionar pontos
      PERFORM add_customer_points(
        NEW.customer_id,
        v_points,
        'purchase',
        format('Compra de %s no valor de R$ %s', NEW.service_type, NEW.total_value),
        NEW.id
      );
      
      -- Atualizar estatísticas
      UPDATE customer_points
      SET
        total_purchases = total_purchases + 1,
        total_spent = total_spent + NEW.total_value,
        last_purchase_date = CURRENT_DATE,
        first_purchase_date = COALESCE(first_purchase_date, CURRENT_DATE)
      WHERE customer_id = NEW.customer_id;
      
      -- Verificar badges
      PERFORM check_and_award_badges(NEW.customer_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_points_on_os ON service_orders;
CREATE TRIGGER trigger_award_points_on_os
  AFTER INSERT OR UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION award_points_on_os_completion();

-- Trigger: Bônus de pontos por indicação bem-sucedida
CREATE OR REPLACE FUNCTION award_referral_bonus_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config customer_gamification_config%ROWTYPE;
BEGIN
  IF NEW.status = 'credito_gerado' AND (OLD.status IS NULL OR OLD.status != 'credito_gerado') THEN
    
    SELECT * INTO v_config FROM customer_gamification_config WHERE active = true LIMIT 1;
    
    IF FOUND THEN
      -- Adicionar pontos bônus por indicação
      PERFORM add_customer_points(
        NEW.referrer_customer_id,
        v_config.referral_bonus_points,
        'referral',
        'Bônus por indicação bem-sucedida',
        NEW.service_order_id,
        NEW.id
      );
      
      -- Atualizar estatísticas
      UPDATE customer_points
      SET
        total_referrals = total_referrals + 1,
        successful_referrals = successful_referrals + 1
      WHERE customer_id = NEW.referrer_customer_id;
      
      -- Verificar badges de indicação
      PERFORM check_and_award_badges(NEW.referrer_customer_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_referral_points ON customer_referrals;
CREATE TRIGGER trigger_award_referral_points
  AFTER INSERT OR UPDATE ON customer_referrals
  FOR EACH ROW
  EXECUTE FUNCTION award_referral_bonus_points();

-- ============================================================================
-- 11. VIEWS ÚTEIS
-- ============================================================================

-- View: Leaderboard de clientes
CREATE OR REPLACE VIEW v_customer_leaderboard AS
SELECT
  c.id,
  c.nome_razao as customer_name,
  cp.total_points,
  cp.current_tier,
  cp.total_purchases,
  cp.total_spent,
  COUNT(cbe.id) as total_badges,
  RANK() OVER (ORDER BY cp.total_points DESC) as ranking_position
FROM customers c
INNER JOIN customer_points cp ON c.id = cp.customer_id
LEFT JOIN customer_badges_earned cbe ON c.id = cbe.customer_id
GROUP BY c.id, c.nome_razao, cp.total_points, cp.current_tier, cp.total_purchases, cp.total_spent
ORDER BY cp.total_points DESC;

-- View: Próximos a subir de nível
CREATE OR REPLACE VIEW v_customers_near_tier_up AS
SELECT
  c.id,
  c.nome_razao as customer_name,
  cp.current_tier,
  cp.total_points,
  CASE cp.current_tier
    WHEN 'bronze' THEN 1000
    WHEN 'silver' THEN 3000
    WHEN 'gold' THEN 7000
    WHEN 'diamond' THEN 15000
    ELSE 999999
  END as next_tier_points,
  CASE cp.current_tier
    WHEN 'bronze' THEN 1000 - cp.total_points
    WHEN 'silver' THEN 3000 - cp.total_points
    WHEN 'gold' THEN 7000 - cp.total_points
    WHEN 'diamond' THEN 15000 - cp.total_points
    ELSE 0
  END as points_needed
FROM customers c
INNER JOIN customer_points cp ON c.id = cp.customer_id
WHERE cp.current_tier != 'vip'
  AND CASE cp.current_tier
    WHEN 'bronze' THEN 1000 - cp.total_points
    WHEN 'silver' THEN 3000 - cp.total_points
    WHEN 'gold' THEN 7000 - cp.total_points
    WHEN 'diamond' THEN 15000 - cp.total_points
  END BETWEEN 1 AND 500
ORDER BY points_needed ASC;

-- ============================================================================
-- 12. RLS POLICIES
-- ============================================================================

ALTER TABLE customer_gamification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_badges_earned ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tier_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all gamification config" ON customer_gamification_config;
DROP POLICY IF EXISTS "Allow all customer points" ON customer_points;
DROP POLICY IF EXISTS "Allow all points history" ON customer_points_history;
DROP POLICY IF EXISTS "Allow all badges" ON customer_badges;
DROP POLICY IF EXISTS "Allow all badges earned" ON customer_badges_earned;
DROP POLICY IF EXISTS "Allow all tier benefits" ON customer_tier_benefits;

CREATE POLICY "Allow all gamification config" ON customer_gamification_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all customer points" ON customer_points FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all points history" ON customer_points_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all badges" ON customer_badges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all badges earned" ON customer_badges_earned FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tier benefits" ON customer_tier_benefits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 13. COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE customer_gamification_config IS 'Configurações do sistema de gamificação para clientes';
COMMENT ON TABLE customer_points IS 'Pontos e estatísticas de cada cliente';
COMMENT ON TABLE customer_points_history IS 'Histórico completo de pontos ganhos/gastos';
COMMENT ON TABLE customer_badges IS 'Catálogo de badges disponíveis';
COMMENT ON TABLE customer_badges_earned IS 'Badges conquistados por cada cliente';
COMMENT ON TABLE customer_tier_benefits IS 'Benefícios de cada nível/tier';

COMMENT ON FUNCTION calculate_customer_tier IS 'Calcula o nível do cliente baseado nos pontos';
COMMENT ON FUNCTION add_customer_points IS 'Adiciona pontos ao cliente e registra histórico';
COMMENT ON FUNCTION check_and_award_badges IS 'Verifica e concede badges automaticamente';
COMMENT ON FUNCTION award_points_on_os_completion IS 'Concede pontos automaticamente ao concluir OS';
COMMENT ON FUNCTION award_referral_bonus_points IS 'Concede pontos bônus por indicação bem-sucedida';
