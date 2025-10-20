/*
  # Create Rental Schedules Table

  ## Description
  Creates rental schedules table for recurring rental billing and automatic invoice generation

  ## Tables Created
  1. rental_schedules - Recurring rental/lease schedules

  ## Security
  - RLS enabled
  - Public access for development
*/

-- Create rental_schedules table
CREATE TABLE IF NOT EXISTS rental_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly')),
  rental_value NUMERIC(15,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE NOT NULL,
  last_billing_date DATE,
  active BOOLEAN DEFAULT true,
  auto_generate_invoice BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rental_schedules_customer ON rental_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_rental_schedules_next_billing ON rental_schedules(next_billing_date) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_rental_schedules_active ON rental_schedules(active);

-- Enable RLS
ALTER TABLE rental_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all operations on rental_schedules" ON rental_schedules;
CREATE POLICY "Allow all operations on rental_schedules" ON rental_schedules FOR ALL USING (true) WITH CHECK (true);

-- Add comments
COMMENT ON TABLE rental_schedules IS 'Programações de locações e faturamentos recorrentes';
COMMENT ON COLUMN rental_schedules.auto_generate_invoice IS 'Se true, gera automaticamente lançamento financeiro na data de faturamento';
COMMENT ON COLUMN rental_schedules.next_billing_date IS 'Próxima data de faturamento/cobrança';
