/*
  # Add invoice_issued flag to service_orders

  ## Summary
  Adds a nullable `invoice_issued` timestamp column to `service_orders`.
  The Thomaz AI monitors completed OS where this column is NULL and
  completed_at is more than 48 hours ago, triggering a critical billing alert.

  ## Changes
  - `service_orders.invoice_issued` (timestamptz, nullable) — set when billing is initiated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'invoice_issued'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN invoice_issued timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_orders_billing
  ON service_orders(status, completed_at)
  WHERE invoice_issued IS NULL AND status = 'completed';
