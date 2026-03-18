/*
  # Add Portal Account and Partner Account to Service Orders

  ## Summary
  Links service orders to external portal accounts (clients and partners),
  enabling the Customer Portal and Partner Portal dashboards to show relevant OS data.

  ## New Columns on service_orders
  - `portal_account_id` (uuid, FK → portal_accounts) - the client portal account that owns this OS
  - `partner_account_id` (uuid, FK → portal_accounts) - optional partner that referred/indicou this OS

  ## New Table: partner_commission_rules
  - Stores per-partner commission configuration (fixed value or percentage)
  - Used by OS financial summary to show commission deduction

  ## Security
  - RLS enabled on partner_commission_rules
  - Policies: anon/authenticated full access (matches existing open-access pattern)

  ## Notes
  1. Both columns are nullable - existing OS data is preserved
  2. partner_referrals table (from portal migration) auto-links when partner_account_id is set
  3. A trigger auto-creates a partner_referral record when partner_account_id is set on insert/update
*/

-- Add portal_account_id to service_orders (client portal link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'portal_account_id'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN portal_account_id uuid REFERENCES portal_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add partner_account_id to service_orders (partner referral link)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'partner_account_id'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN partner_account_id uuid REFERENCES portal_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for portal lookups
CREATE INDEX IF NOT EXISTS idx_service_orders_portal_account_id ON service_orders(portal_account_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_partner_account_id ON service_orders(partner_account_id);

-- Partner commission rules table
CREATE TABLE IF NOT EXISTS partner_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_account_id uuid NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
  commission_type text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value numeric(10, 2) NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'parts', 'labor')),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partner_commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read partner_commission_rules"
  ON partner_commission_rules FOR SELECT
  TO anon USING (true);

CREATE POLICY "authenticated can manage partner_commission_rules"
  ON partner_commission_rules FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update partner_commission_rules"
  ON partner_commission_rules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can delete partner_commission_rules"
  ON partner_commission_rules FOR DELETE
  TO authenticated USING (true);

-- Grant access
GRANT ALL ON partner_commission_rules TO anon, authenticated;

-- Trigger: auto-create partner_referral when partner_account_id is set on a service order
CREATE OR REPLACE FUNCTION auto_create_partner_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_type text := 'percentage';
  v_commission_value numeric := 0;
BEGIN
  -- Only act when partner_account_id is set (insert with value, or update that changes the value)
  IF NEW.partner_account_id IS NOT NULL AND
     (TG_OP = 'INSERT' OR OLD.partner_account_id IS DISTINCT FROM NEW.partner_account_id)
  THEN
    -- Get commission rule if any
    SELECT commission_type, commission_value
      INTO v_commission_type, v_commission_value
      FROM partner_commission_rules
      WHERE partner_account_id = NEW.partner_account_id AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1;

    -- Upsert referral record
    INSERT INTO partner_referrals (
      partner_account_id,
      service_order_id,
      commission_type,
      commission_value,
      status
    ) VALUES (
      NEW.partner_account_id,
      NEW.id,
      v_commission_type,
      v_commission_value,
      CASE
        WHEN NEW.status IN ('concluida', 'faturada') THEN 'confirmed'
        ELSE 'pending'
      END
    )
    ON CONFLICT (partner_account_id, service_order_id) DO NOTHING;
  END IF;

  -- Update referral status when OS is completed
  IF NEW.partner_account_id IS NOT NULL AND
     TG_OP = 'UPDATE' AND
     NEW.status IN ('concluida', 'faturada') AND
     OLD.status NOT IN ('concluida', 'faturada')
  THEN
    UPDATE partner_referrals
      SET status = 'confirmed'
      WHERE service_order_id = NEW.id AND partner_account_id = NEW.partner_account_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_partner_referral ON service_orders;
CREATE TRIGGER trg_auto_create_partner_referral
  AFTER INSERT OR UPDATE OF partner_account_id, status
  ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_partner_referral();

-- Ensure partner_referrals has a unique constraint to support ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_referrals_partner_os_unique'
  ) THEN
    ALTER TABLE partner_referrals
      ADD CONSTRAINT partner_referrals_partner_os_unique
      UNIQUE (partner_account_id, service_order_id);
  END IF;
END $$;

-- View: os_with_portal_info - enriched OS data including portal account info
CREATE OR REPLACE VIEW os_with_portal_info AS
SELECT
  so.*,
  pa_client.full_name AS portal_client_name,
  pa_client.email AS portal_client_email,
  pa_client.document_cpf_cnpj AS portal_client_document,
  pa_partner.full_name AS portal_partner_name,
  pa_partner.email AS portal_partner_email,
  pcr.commission_type AS partner_commission_type,
  pcr.commission_value AS partner_commission_value,
  CASE
    WHEN pcr.commission_type = 'percentage' THEN ROUND(COALESCE(so.final_total, so.total_value, 0) * pcr.commission_value / 100, 2)
    WHEN pcr.commission_type = 'fixed' THEN pcr.commission_value
    ELSE 0
  END AS partner_commission_amount
FROM service_orders so
LEFT JOIN portal_accounts pa_client ON pa_client.id = so.portal_account_id AND pa_client.role = 'cliente'
LEFT JOIN portal_accounts pa_partner ON pa_partner.id = so.partner_account_id AND pa_partner.role = 'parceiro'
LEFT JOIN partner_commission_rules pcr ON pcr.partner_account_id = so.partner_account_id AND pcr.is_active = true;

GRANT SELECT ON os_with_portal_info TO anon, authenticated;
