/*
  # Sistema de Metas, Rankings e Gamificação

  1. Novas Tabelas
    - `company_goals` - Metas da empresa (supergoal)
      - `id` (uuid, PK)
      - `period_type` (text) - mensal, trimestral, anual
      - `start_date` (date)
      - `end_date` (date)
      - `target_amount` (numeric) - valor da meta
      - `bonus_pool` (numeric) - valor total do bônus a distribuir
      - `achieved_amount` (numeric) - valor alcançado
      - `status` (text) - ativa, concluida, cancelada
      - `created_at`, `updated_at`

    - `employee_goals` - Metas individuais dos funcionários
      - `id` (uuid, PK)
      - `employee_id` (uuid, FK)
      - `company_goal_id` (uuid, FK) - vincula à meta da empresa
      - `target_amount` (numeric)
      - `achieved_amount` (numeric)
      - `bonus_percentage` (numeric) - % de bônus ao atingir
      - `super_bonus_percentage` (numeric) - % extra ao superar 110%
      - `status` (text)
      - `created_at`, `updated_at`

    - `rankings_config` - Configuração de premiações
      - `id` (uuid, PK)
      - `ranking_type` (text) - vendas, oss_concluidas, satisfacao
      - `period` (text) - mensal, trimestral, anual
      - `first_place_prize` (text)
      - `second_place_prize` (text)
      - `third_place_prize` (text)
      - `active` (boolean)
      - `created_at`, `updated_at`

    - `employee_achievements` - Conquistas e badges
      - `id` (uuid, PK)
      - `employee_id` (uuid, FK)
      - `achievement_type` (text) - meta_atingida, top_vendedor, recorde_mensal
      - `badge_level` (text) - bronze, prata, ouro, diamante
      - `description` (text)
      - `earned_date` (date)
      - `points` (integer)

    - `ranking_history` - Histórico de rankings
      - `id` (uuid, PK)
      - `period_start` (date)
      - `period_end` (date)
      - `ranking_type` (text)
      - `employee_id` (uuid, FK)
      - `position` (integer)
      - `total_amount` (numeric)
      - `total_count` (integer)
      - `prize_received` (text)

  2. Views
    - `v_current_individual_goals` - Metas individuais ativas
    - `v_current_company_goal` - Meta da empresa ativa
    - `v_sales_ranking` - Ranking de vendas atual
    - `v_employee_performance_score` - Score de performance

  3. Functions
    - `calculate_goal_bonus()` - Calcula bônus ao atingir meta
    - `update_employee_goal_achievement()` - Atualiza metas
    - `award_achievement()` - Concede conquista/badge
*/

-- Tabela de metas da empresa (Supergoal)
CREATE TABLE IF NOT EXISTS company_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL CHECK (period_type IN ('mensal', 'trimestral', 'semestral', 'anual')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_amount numeric(15,2) NOT NULL DEFAULT 0,
  bonus_pool numeric(15,2) NOT NULL DEFAULT 0,
  achieved_amount numeric(15,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'cancelada')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de metas individuais
CREATE TABLE IF NOT EXISTS employee_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_goal_id uuid REFERENCES company_goals(id) ON DELETE SET NULL,
  target_amount numeric(15,2) NOT NULL DEFAULT 0,
  achieved_amount numeric(15,2) DEFAULT 0,
  bonus_percentage numeric(5,2) NOT NULL DEFAULT 5.00,
  super_bonus_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  bonus_earned numeric(15,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'concluida', 'cancelada')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de configuração de rankings e premiações
CREATE TABLE IF NOT EXISTS rankings_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_type text NOT NULL CHECK (ranking_type IN ('vendas', 'oss_concluidas', 'satisfacao', 'pontualidade')),
  period text NOT NULL CHECK (period IN ('mensal', 'trimestral', 'anual')),
  first_place_prize text,
  second_place_prize text,
  third_place_prize text,
  first_place_value numeric(15,2),
  second_place_value numeric(15,2),
  third_place_value numeric(15,2),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de conquistas e badges
CREATE TABLE IF NOT EXISTS employee_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  badge_level text CHECK (badge_level IN ('bronze', 'prata', 'ouro', 'diamante', 'lendario')),
  title text NOT NULL,
  description text,
  earned_date date DEFAULT CURRENT_DATE,
  points integer DEFAULT 0,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de histórico de rankings
CREATE TABLE IF NOT EXISTS ranking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  ranking_type text NOT NULL,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  position integer NOT NULL,
  total_amount numeric(15,2) DEFAULT 0,
  total_count integer DEFAULT 0,
  prize_received text,
  prize_value numeric(15,2),
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_company_goals_status ON company_goals(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_goals_employee ON employee_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_goals_status ON employee_goals(status);
CREATE INDEX IF NOT EXISTS idx_employee_achievements_employee ON employee_achievements(employee_id);
CREATE INDEX IF NOT EXISTS idx_ranking_history_employee ON ranking_history(employee_id, period_start);

-- View: Metas individuais ativas com progresso
CREATE OR REPLACE VIEW v_current_individual_goals AS
SELECT
  eg.id,
  eg.employee_id,
  e.name as employee_name,
  e.role,
  eg.target_amount,
  eg.achieved_amount,
  CASE
    WHEN eg.target_amount > 0 THEN (eg.achieved_amount / eg.target_amount * 100)
    ELSE 0
  END as progress_percentage,
  eg.bonus_percentage,
  eg.super_bonus_percentage,
  eg.bonus_earned,
  CASE
    WHEN eg.achieved_amount >= eg.target_amount THEN 'Atingida'
    WHEN eg.achieved_amount >= (eg.target_amount * 0.8) THEN 'Perto'
    ELSE 'Em Progresso'
  END as status_label,
  cg.period_type,
  cg.start_date,
  cg.end_date,
  CURRENT_DATE <= cg.end_date as is_active,
  eg.created_at
FROM employee_goals eg
JOIN employees e ON e.id = eg.employee_id
LEFT JOIN company_goals cg ON cg.id = eg.company_goal_id
WHERE eg.status = 'ativa'
ORDER BY progress_percentage DESC;

-- View: Meta da empresa ativa
CREATE OR REPLACE VIEW v_current_company_goal AS
SELECT
  cg.id,
  cg.period_type,
  cg.start_date,
  cg.end_date,
  cg.target_amount,
  cg.bonus_pool,
  cg.achieved_amount,
  CASE
    WHEN cg.target_amount > 0 THEN (cg.achieved_amount / cg.target_amount * 100)
    ELSE 0
  END as progress_percentage,
  CASE
    WHEN cg.achieved_amount >= cg.target_amount THEN 'Atingida'
    WHEN cg.achieved_amount >= (cg.target_amount * 0.9) THEN 'Quase Lá'
    ELSE 'Em Progresso'
  END as status_label,
  COUNT(DISTINCT eg.employee_id) as total_employees,
  cg.status,
  cg.notes
FROM company_goals cg
LEFT JOIN employee_goals eg ON eg.company_goal_id = cg.id
WHERE cg.status = 'ativa' AND CURRENT_DATE BETWEEN cg.start_date AND cg.end_date
GROUP BY cg.id;

-- View: Ranking de vendas atual
CREATE OR REPLACE VIEW v_sales_ranking AS
WITH current_month AS (
  SELECT
    DATE_TRUNC('month', CURRENT_DATE)::date as start_date,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date as end_date
),
employee_sales AS (
  SELECT
    sot.employee_id,
    e.name as employee_name,
    e.role,
    COUNT(DISTINCT so.id) as total_orders,
    SUM(so.total) as total_revenue,
    AVG(so.total) as avg_order_value
  FROM service_order_team sot
  JOIN service_orders so ON so.id = sot.service_order_id
  JOIN employees e ON e.id = sot.employee_id
  CROSS JOIN current_month cm
  WHERE so.created_at >= cm.start_date
    AND so.created_at <= cm.end_date
    AND so.status IN ('concluido', 'em_andamento')
  GROUP BY sot.employee_id, e.name, e.role
)
SELECT
  ROW_NUMBER() OVER (ORDER BY total_revenue DESC) as position,
  employee_id,
  employee_name,
  role,
  total_orders,
  total_revenue,
  avg_order_value,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) = 1 THEN '🥇 Primeiro'
    WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) = 2 THEN '🥈 Segundo'
    WHEN ROW_NUMBER() OVER (ORDER BY total_revenue DESC) = 3 THEN '🥉 Terceiro'
    ELSE CAST(ROW_NUMBER() OVER (ORDER BY total_revenue DESC) AS text) || 'º'
  END as position_label
FROM employee_sales
ORDER BY position;

-- View: Score de performance do funcionário
CREATE OR REPLACE VIEW v_employee_performance_score AS
SELECT
  e.id as employee_id,
  e.name as employee_name,
  e.role,
  COUNT(DISTINCT sot.service_order_id) as total_orders_participated,
  COUNT(DISTINCT CASE WHEN so.status = 'concluido' THEN sot.service_order_id END) as completed_orders,
  SUM(CASE WHEN so.status = 'concluido' THEN so.total ELSE 0 END) as total_revenue_generated,
  COUNT(DISTINCT ea.id) as total_achievements,
  COALESCE(SUM(ea.points), 0) as total_points,
  CASE
    WHEN COALESCE(SUM(ea.points), 0) >= 1000 THEN 'diamante'
    WHEN COALESCE(SUM(ea.points), 0) >= 500 THEN 'ouro'
    WHEN COALESCE(SUM(ea.points), 0) >= 250 THEN 'prata'
    ELSE 'bronze'
  END as current_tier
FROM employees e
LEFT JOIN service_order_team sot ON sot.employee_id = e.id
LEFT JOIN service_orders so ON so.id = sot.service_order_id
LEFT JOIN employee_achievements ea ON ea.employee_id = e.id
WHERE e.active = true
GROUP BY e.id, e.name, e.role
ORDER BY total_points DESC;

-- Function: Calcular bônus individual
CREATE OR REPLACE FUNCTION calculate_goal_bonus()
RETURNS trigger AS $$
BEGIN
  IF NEW.achieved_amount >= NEW.target_amount THEN
    IF NEW.achieved_amount >= (NEW.target_amount * 1.10) THEN
      NEW.bonus_earned := (NEW.achieved_amount * NEW.super_bonus_percentage / 100);
    ELSE
      NEW.bonus_earned := (NEW.achieved_amount * NEW.bonus_percentage / 100);
    END IF;

    IF NEW.status = 'ativa' THEN
      NEW.status := 'concluida';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_calculate_bonus
  BEFORE UPDATE ON employee_goals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_goal_bonus();

-- Function: Atualizar valor alcançado nas metas
CREATE OR REPLACE FUNCTION update_employee_goal_achievement()
RETURNS void AS $$
DECLARE
  goal_record RECORD;
  employee_revenue numeric;
BEGIN
  FOR goal_record IN
    SELECT eg.id, eg.employee_id, cg.start_date, cg.end_date
    FROM employee_goals eg
    JOIN company_goals cg ON cg.id = eg.company_goal_id
    WHERE eg.status = 'ativa' AND cg.status = 'ativa'
  LOOP
    SELECT COALESCE(SUM(so.total), 0) INTO employee_revenue
    FROM service_order_team sot
    JOIN service_orders so ON so.id = sot.service_order_id
    WHERE sot.employee_id = goal_record.employee_id
      AND so.created_at >= goal_record.start_date
      AND so.created_at <= goal_record.end_date
      AND so.status IN ('concluido', 'em_andamento');

    UPDATE employee_goals
    SET achieved_amount = employee_revenue,
        updated_at = now()
    WHERE id = goal_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Conceder conquista
CREATE OR REPLACE FUNCTION award_achievement(
  p_employee_id uuid,
  p_achievement_type text,
  p_title text,
  p_description text,
  p_badge_level text DEFAULT 'bronze',
  p_points integer DEFAULT 100
)
RETURNS uuid AS $$
DECLARE
  achievement_id uuid;
BEGIN
  INSERT INTO employee_achievements (
    employee_id,
    achievement_type,
    badge_level,
    title,
    description,
    points
  ) VALUES (
    p_employee_id,
    p_achievement_type,
    p_badge_level,
    p_title,
    p_description,
    p_points
  )
  RETURNING id INTO achievement_id;

  RETURN achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE company_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar metas da empresa" ON company_goals FOR SELECT USING (true);
CREATE POLICY "Todos podem visualizar metas individuais" ON employee_goals FOR SELECT USING (true);
CREATE POLICY "Todos podem visualizar rankings" ON rankings_config FOR SELECT USING (true);
CREATE POLICY "Todos podem visualizar conquistas" ON employee_achievements FOR SELECT USING (true);
CREATE POLICY "Todos podem visualizar histórico" ON ranking_history FOR SELECT USING (true);

CREATE POLICY "Anon pode gerenciar metas empresa" ON company_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon pode gerenciar metas individuais" ON employee_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon pode gerenciar rankings" ON rankings_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon pode gerenciar conquistas" ON employee_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon pode gerenciar histórico" ON ranking_history FOR ALL USING (true) WITH CHECK (true);

-- Inserir configurações padrão de rankings
INSERT INTO rankings_config (ranking_type, period, first_place_prize, second_place_prize, third_place_prize, first_place_value, second_place_value, third_place_value)
VALUES
  ('vendas', 'mensal', 'R$ 1.000 + Troféu', 'R$ 500 + Medalha', 'R$ 300 + Certificado', 1000, 500, 300),
  ('oss_concluidas', 'mensal', 'R$ 800 + Troféu', 'R$ 400 + Medalha', 'R$ 200 + Certificado', 800, 400, 200)
ON CONFLICT DO NOTHING;
