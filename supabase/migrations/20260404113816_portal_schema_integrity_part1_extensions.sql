
/*
  # Portal Schema Integrity - Part 1: Schema Extensions

  ## Summary
  Extends existing tables to support portal flows correctly:

  1. `service_order_photos`
     - Add `milestone_id` FK to `os_milestones` (optional, links photos to a specific milestone)

  2. `customer_equipment`
     - Add `last_maintenance` date column for tracking last OS finalized date
     - Add `next_maintenance` date column for scheduling

  3. `service_orders`
     - Ensure `portal_account_id` and `partner_account_id` columns exist (already exist, confirmed)
     - Add index on `customer_id` and `partner_id` for performance

  ## Notes
  - All changes use IF NOT EXISTS to be safe/idempotent
  - No destructive operations
*/

-- Add milestone_id to service_order_photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_photos' AND column_name = 'milestone_id'
  ) THEN
    ALTER TABLE service_order_photos
      ADD COLUMN milestone_id uuid REFERENCES os_milestones(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add last_maintenance and next_maintenance to customer_equipment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_equipment' AND column_name = 'last_maintenance'
  ) THEN
    ALTER TABLE customer_equipment ADD COLUMN last_maintenance date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_equipment' AND column_name = 'next_maintenance'
  ) THEN
    ALTER TABLE customer_equipment ADD COLUMN next_maintenance date;
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_service_orders_customer_id ON service_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_partner_id ON service_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_portal_account_id ON service_orders(portal_account_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_partner_account_id ON service_orders(partner_account_id);
CREATE INDEX IF NOT EXISTS idx_service_order_photos_milestone_id ON service_order_photos(milestone_id);
CREATE INDEX IF NOT EXISTS idx_customer_equipment_customer_id ON customer_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_os_milestones_service_order_id ON os_milestones(service_order_id);
