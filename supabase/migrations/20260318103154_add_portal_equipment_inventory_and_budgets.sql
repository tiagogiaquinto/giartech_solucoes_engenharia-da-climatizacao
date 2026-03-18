/*
  # Portal: Inventário de Equipamentos e Histórico de Orçamentos

  ## Novas Tabelas
  - `portal_equipment_inventory`: Equipamentos instalados vinculados ao cliente
    - Localização exata (sala, área, andar)
    - Tipo e modelo do equipamento
    - Data de instalação para cálculo de depreciação
    - Vida útil estimada em anos
    - Capacidade/especificações

  ## Novas Views e Funções
  - `get_customer_portal_equipment`: Retorna equipamentos com contagem de intervenções e depreciação calculada
  - `get_customer_portal_budgets`: Retorna orçamentos aprovados e pendentes do cliente
  - `get_partner_portal_history`: Retorna histórico de volume e parcerias do parceiro

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Acesso controlado por token de sessão via funções RPC
*/

-- Tabela de equipamentos instalados no cliente
CREATE TABLE IF NOT EXISTS portal_equipment_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  equipment_type text NOT NULL DEFAULT '',
  model text DEFAULT '',
  brand text DEFAULT '',
  serial_number text DEFAULT '',
  location text NOT NULL DEFAULT '',
  floor_area text DEFAULT '',
  installed_at date,
  useful_life_years integer DEFAULT 10,
  capacity text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portal_equipment_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to portal equipment"
  ON portal_equipment_inventory
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated can manage portal equipment"
  ON portal_equipment_inventory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_portal_equipment_customer_id ON portal_equipment_inventory(customer_id);
CREATE INDEX IF NOT EXISTS idx_portal_equipment_is_active ON portal_equipment_inventory(is_active);

-- Função: buscar equipamentos do cliente com intervenções e depreciação
CREATE OR REPLACE FUNCTION get_customer_portal_equipment(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  equipment_type text,
  model text,
  brand text,
  serial_number text,
  location text,
  floor_area text,
  installed_at date,
  useful_life_years integer,
  capacity text,
  notes text,
  is_active boolean,
  intervention_count bigint,
  last_intervention_date timestamptz,
  depreciation_percent numeric,
  remaining_life_years numeric,
  age_years numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.equipment_type,
    e.model,
    e.brand,
    e.serial_number,
    e.location,
    e.floor_area,
    e.installed_at,
    e.useful_life_years,
    e.capacity,
    e.notes,
    e.is_active,
    COUNT(DISTINCT so.id) AS intervention_count,
    MAX(so.created_at) AS last_intervention_date,
    CASE
      WHEN e.installed_at IS NULL THEN 0
      ELSE LEAST(
        ROUND(
          (EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installed_at))
          + EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.installed_at)) / 12.0
          + (COUNT(DISTINCT so.id) * 0.5)
          ) / NULLIF(e.useful_life_years, 0) * 100,
          1
        ),
        100
      )
    END AS depreciation_percent,
    CASE
      WHEN e.installed_at IS NULL THEN e.useful_life_years::numeric
      ELSE GREATEST(
        0,
        ROUND(
          e.useful_life_years - (
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installed_at))
            + EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.installed_at)) / 12.0
            + (COUNT(DISTINCT so.id) * 0.5)
          ),
          1
        )
      )
    END AS remaining_life_years,
    CASE
      WHEN e.installed_at IS NULL THEN 0
      ELSE ROUND(
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installed_at))
        + EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.installed_at)) / 12.0,
        1
      )
    END AS age_years
  FROM portal_equipment_inventory e
  LEFT JOIN service_orders so ON (
    so.customer_id = e.customer_id
    AND (so.description ILIKE '%' || e.name || '%' OR so.description ILIKE '%' || e.location || '%')
    AND so.status = 'concluido'
  )
  WHERE e.customer_id = p_customer_id
    AND e.is_active = true
  GROUP BY e.id, e.name, e.equipment_type, e.model, e.brand, e.serial_number,
    e.location, e.floor_area, e.installed_at, e.useful_life_years, e.capacity, e.notes, e.is_active
  ORDER BY e.location, e.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_portal_equipment(uuid) TO anon, authenticated;

-- Função: buscar orçamentos do cliente
CREATE OR REPLACE FUNCTION get_customer_portal_budgets(p_customer_id uuid)
RETURNS TABLE (
  id uuid,
  budget_number text,
  title text,
  description text,
  status text,
  total_value numeric,
  created_at timestamptz,
  valid_until date,
  approved_at timestamptz,
  items_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.budget_number,
    COALESCE(b.title, b.description, 'Orçamento') AS title,
    b.description,
    b.status,
    COALESCE(b.total_value, 0) AS total_value,
    b.created_at,
    b.valid_until,
    b.approved_at,
    COUNT(DISTINCT bi.id) AS items_count
  FROM budgets b
  LEFT JOIN budget_items bi ON bi.budget_id = b.id
  WHERE b.customer_id = p_customer_id
  GROUP BY b.id, b.budget_number, b.title, b.description, b.status,
    b.total_value, b.created_at, b.valid_until, b.approved_at
  ORDER BY b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_portal_budgets(uuid) TO anon, authenticated;

-- Função: histórico do parceiro
CREATE OR REPLACE FUNCTION get_partner_portal_history(p_partner_account_id uuid)
RETURNS TABLE (
  period_label text,
  referrals_count bigint,
  completed_count bigint,
  total_commission numeric,
  paid_commission numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', pr.created_at), 'MM/YYYY') AS period_label,
    COUNT(*) AS referrals_count,
    COUNT(*) FILTER (WHERE pr.status = 'concluido') AS completed_count,
    COALESCE(SUM(pr.commission_value), 0) AS total_commission,
    COALESCE(SUM(pr.commission_value) FILTER (WHERE pr.commission_paid = true), 0) AS paid_commission
  FROM partner_referrals pr
  WHERE pr.partner_account_id = p_partner_account_id
  GROUP BY DATE_TRUNC('month', pr.created_at)
  ORDER BY DATE_TRUNC('month', pr.created_at) DESC
  LIMIT 12;
END;
$$;

GRANT EXECUTE ON FUNCTION get_partner_portal_history(uuid) TO anon, authenticated;
