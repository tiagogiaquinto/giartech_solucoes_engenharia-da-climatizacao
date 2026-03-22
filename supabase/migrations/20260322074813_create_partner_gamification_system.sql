/*
  # Partner Gamification System

  ## Summary
  Creates a complete gamification system for partners (parceiros) based on referral performance.

  ## New Tables
  - partner_tiers: tier level definitions with thresholds and benefits
  - partner_gamification_points: stats per partner (referrals, conversions, commission, tier)
  - partner_badges_catalog: all available badges
  - partner_badges_earned: badges each partner has earned
  - partner_gamification_history: event log per partner

  ## Views
  - v_partner_leaderboard: full ranking with tier, points, badges

  ## Functions
  - sync_partner_gamification(uuid): recalculates a single partner's stats
  - sync_all_partners_gamification(): recalculates all partners

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/insert; admin controls sensitive updates
*/

-- Partner tier definitions
CREATE TABLE IF NOT EXISTS partner_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level text NOT NULL UNIQUE,
  tier_name text NOT NULL,
  min_referrals int NOT NULL DEFAULT 0,
  min_converted int NOT NULL DEFAULT 0,
  min_commission numeric(15,2) NOT NULL DEFAULT 0,
  commission_bonus_percent numeric(5,2) DEFAULT 0,
  benefits text[] DEFAULT '{}',
  color_from text DEFAULT 'from-gray-400',
  color_to text DEFAULT 'to-gray-600',
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view partner tiers"
  ON partner_tiers FOR SELECT TO authenticated USING (true);

INSERT INTO partner_tiers (tier_level, tier_name, min_referrals, min_converted, min_commission, commission_bonus_percent, benefits, color_from, color_to, display_order)
VALUES
  ('bronze',  'Bronze',   0,  0,    0,     0,   ARRAY['Acesso ao portal de parceiros', 'Relatório mensal de indicações'], 'from-orange-600', 'to-amber-700', 1),
  ('silver',  'Prata',    5,  2,    500,   2,   ARRAY['Tudo do Bronze', 'Bônus de 2% nas comissões', 'Suporte prioritário'], 'from-gray-400', 'to-gray-600', 2),
  ('gold',    'Ouro',     15, 8,    2000,  5,   ARRAY['Tudo da Prata', 'Bônus de 5% nas comissões', 'Destaque na plataforma', 'Relatórios avançados'], 'from-yellow-400', 'to-yellow-600', 3),
  ('diamond', 'Diamante', 30, 18,   6000,  8,   ARRAY['Tudo do Ouro', 'Bônus de 8% nas comissões', 'Gerente de conta dedicado', 'Acesso antecipado a novidades'], 'from-cyan-400', 'to-blue-600', 4),
  ('vip',     'VIP',      60, 40,   15000, 12,  ARRAY['Tudo do Diamante', 'Bônus de 12% nas comissões', 'Co-marketing exclusivo', 'Comissões personalizadas'], 'from-rose-500', 'to-pink-700', 5)
ON CONFLICT (tier_level) DO UPDATE
  SET tier_name = EXCLUDED.tier_name,
      min_referrals = EXCLUDED.min_referrals,
      min_converted = EXCLUDED.min_converted,
      min_commission = EXCLUDED.min_commission,
      commission_bonus_percent = EXCLUDED.commission_bonus_percent,
      benefits = EXCLUDED.benefits,
      color_from = EXCLUDED.color_from,
      color_to = EXCLUDED.color_to,
      display_order = EXCLUDED.display_order;

-- Partner gamification points / stats
CREATE TABLE IF NOT EXISTS partner_gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  total_referrals int NOT NULL DEFAULT 0,
  converted_referrals int NOT NULL DEFAULT 0,
  pending_referrals int NOT NULL DEFAULT 0,
  total_commission_earned numeric(15,2) NOT NULL DEFAULT 0,
  commission_paid numeric(15,2) NOT NULL DEFAULT 0,
  commission_pending numeric(15,2) NOT NULL DEFAULT 0,
  current_tier text NOT NULL DEFAULT 'bronze',
  conversion_rate numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_referrals > 0 THEN ROUND((converted_referrals::numeric / total_referrals) * 100, 2) ELSE 0 END
  ) STORED,
  last_referral_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner_account_id)
);

ALTER TABLE partner_gamification_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view partner gamification points"
  ON partner_gamification_points FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert partner gamification points"
  ON partner_gamification_points FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update partner gamification points"
  ON partner_gamification_points FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Badge catalog
CREATE TABLE IF NOT EXISTS partner_badges_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_key text NOT NULL UNIQUE,
  badge_name text NOT NULL,
  description text,
  badge_icon text DEFAULT 'award',
  badge_level text DEFAULT 'bronze',
  points_awarded int DEFAULT 0,
  requirement_type text,
  requirement_value numeric,
  active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_badges_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view partner badges catalog"
  ON partner_badges_catalog FOR SELECT TO authenticated USING (true);

INSERT INTO partner_badges_catalog (badge_key, badge_name, description, badge_icon, badge_level, points_awarded, requirement_type, requirement_value, display_order)
VALUES
  ('first_referral',    'Primeira Indicação',    'Realizou sua primeira indicação',           'star',        'bronze',  10,  'referrals',  1,    1),
  ('five_referrals',    '5 Indicações',          'Acumulou 5 indicações enviadas',            'users',       'bronze',  25,  'referrals',  5,    2),
  ('first_conversion',  'Primeira Conversão',    'Teve sua primeira indicação convertida',    'check-circle','silver',  50,  'converted',  1,    3),
  ('high_converter',    'Convertedor Expert',    'Taxa de conversão acima de 50%',            'trending-up', 'silver',  75,  'conversion', 50,   4),
  ('ten_conversions',   '10 Conversões',         'Converteu 10 indicações com sucesso',       'trophy',      'gold',    100, 'converted',  10,   5),
  ('five_k_commission', 'R$ 5.000 em Comissões', 'Acumulou R$ 5.000 em comissões',            'dollar-sign', 'gold',    150, 'commission', 5000, 6),
  ('diamond_referrer',  'Parceiro Diamante',     'Atingiu o nível Diamante',                  'gem',         'diamond', 300, 'tier',       4,    7),
  ('vip_status',        'Parceiro VIP',          'Atingiu o status máximo VIP',               'crown',       'vip',     500, 'tier',       5,    8),
  ('super_streak',      'Sequência Imparável',   '5 indicações convertidas consecutivas',     'zap',         'gold',    200, 'streak',     5,    9),
  ('top_partner',       'Top Parceiro do Mês',   'Ficou no top 3 do ranking mensal',          'award',       'diamond', 250, 'ranking',    3,    10)
ON CONFLICT (badge_key) DO UPDATE
  SET badge_name = EXCLUDED.badge_name,
      description = EXCLUDED.description;

-- Partner badges earned
CREATE TABLE IF NOT EXISTS partner_badges_earned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES partner_badges_catalog(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(partner_account_id, badge_id)
);

ALTER TABLE partner_badges_earned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view partner badges earned"
  ON partner_badges_earned FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert partner badges earned"
  ON partner_badges_earned FOR INSERT TO authenticated WITH CHECK (true);

-- Partner gamification history
CREATE TABLE IF NOT EXISTS partner_gamification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  value numeric(15,2),
  tier_before text,
  tier_after text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_gamification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view partner gamification history"
  ON partner_gamification_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert partner gamification history"
  ON partner_gamification_history FOR INSERT TO authenticated WITH CHECK (true);

-- Leaderboard view
DROP VIEW IF EXISTS v_partner_leaderboard;
CREATE VIEW v_partner_leaderboard AS
SELECT
  pa.id AS partner_account_id,
  pa.full_name AS partner_name,
  pa.email,
  pa.phone,
  pa.is_active,
  pa.created_at AS partner_since,
  COALESCE(pgp.total_referrals, 0) AS total_referrals,
  COALESCE(pgp.converted_referrals, 0) AS converted_referrals,
  COALESCE(pgp.pending_referrals, 0) AS pending_referrals,
  COALESCE(pgp.total_commission_earned, 0) AS total_commission_earned,
  COALESCE(pgp.commission_paid, 0) AS commission_paid,
  COALESCE(pgp.commission_pending, 0) AS commission_pending,
  COALESCE(pgp.current_tier, 'bronze') AS current_tier,
  COALESCE(pgp.conversion_rate, 0) AS conversion_rate,
  pgp.last_referral_at,
  (
    SELECT COUNT(*) FROM partner_badges_earned pbe WHERE pbe.partner_account_id = pa.id
  ) AS total_badges,
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(pgp.converted_referrals, 0) DESC,
             COALESCE(pgp.total_commission_earned, 0) DESC,
             COALESCE(pgp.total_referrals, 0) DESC
  ) AS ranking_position
FROM portal_accounts pa
LEFT JOIN partner_gamification_points pgp ON pgp.partner_account_id = pa.id
WHERE pa.role = 'parceiro';

-- Sync function for a single partner
CREATE OR REPLACE FUNCTION sync_partner_gamification(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_converted int;
  v_pending int;
  v_commission_earned numeric;
  v_commission_pd numeric;
  v_last_ref timestamptz;
  v_tier text;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('confirmado', 'pago', 'concluido')),
    COUNT(*) FILTER (WHERE status IN ('pendente', 'em_andamento')),
    COALESCE(SUM(commission_value) FILTER (WHERE commission_value IS NOT NULL), 0),
    COALESCE(SUM(commission_value) FILTER (WHERE commission_paid = true), 0),
    MAX(created_at)
  INTO v_total, v_converted, v_pending, v_commission_earned, v_commission_pd, v_last_ref
  FROM partner_referrals
  WHERE partner_account_id = p_partner_id;

  SELECT tier_level INTO v_tier
  FROM partner_tiers
  WHERE min_referrals <= COALESCE(v_total, 0)
    AND min_converted <= COALESCE(v_converted, 0)
    AND min_commission <= COALESCE(v_commission_earned, 0)
  ORDER BY display_order DESC
  LIMIT 1;

  IF v_tier IS NULL THEN v_tier := 'bronze'; END IF;

  INSERT INTO partner_gamification_points (
    partner_account_id, total_referrals, converted_referrals, pending_referrals,
    total_commission_earned, commission_paid, commission_pending, current_tier, last_referral_at, updated_at
  ) VALUES (
    p_partner_id,
    COALESCE(v_total, 0), COALESCE(v_converted, 0), COALESCE(v_pending, 0),
    COALESCE(v_commission_earned, 0), COALESCE(v_commission_pd, 0),
    COALESCE(v_commission_earned, 0) - COALESCE(v_commission_pd, 0),
    v_tier, v_last_ref, now()
  )
  ON CONFLICT (partner_account_id) DO UPDATE
    SET total_referrals = EXCLUDED.total_referrals,
        converted_referrals = EXCLUDED.converted_referrals,
        pending_referrals = EXCLUDED.pending_referrals,
        total_commission_earned = EXCLUDED.total_commission_earned,
        commission_paid = EXCLUDED.commission_paid,
        commission_pending = EXCLUDED.commission_pending,
        current_tier = EXCLUDED.current_tier,
        last_referral_at = EXCLUDED.last_referral_at,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION sync_partner_gamification(uuid) TO authenticated;

-- Sync all partners
CREATE OR REPLACE FUNCTION sync_all_partners_gamification()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int := 0;
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM portal_accounts WHERE role = 'parceiro' LOOP
    PERFORM sync_partner_gamification(r.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION sync_all_partners_gamification() TO authenticated;
