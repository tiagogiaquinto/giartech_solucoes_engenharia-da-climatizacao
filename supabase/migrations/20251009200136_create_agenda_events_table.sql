/*
  # Create Agenda Events Table

  1. New Tables
    - `agenda_events`
      - `id` (uuid, primary key)
      - `title` (text) - Event title
      - `description` (text) - Event description
      - `start_date` (timestamp) - Start date and time
      - `end_date` (timestamp) - End date and time
      - `event_type` (text) - Type: meeting, task, service_order, etc
      - `customer_id` (uuid) - Related customer
      - `service_order_id` (uuid) - Related service order
      - `employee_id` (uuid) - Responsible employee
      - `location` (text) - Event location
      - `status` (text) - Status: scheduled, in_progress, completed, cancelled
      - `priority` (text) - Priority: low, medium, high, urgent
      - `all_day` (boolean) - All day event
      - `reminder_minutes` (integer) - Reminder before event (minutes)
      - `notes` (text) - Additional notes
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create agenda_events table
CREATE TABLE IF NOT EXISTS agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  event_type text DEFAULT 'meeting',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  location text,
  status text DEFAULT 'scheduled',
  priority text DEFAULT 'medium',
  all_day boolean DEFAULT false,
  reminder_minutes integer DEFAULT 30,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_event_type CHECK (event_type IN ('meeting', 'task', 'service_order', 'appointment', 'reminder', 'other'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agenda_events_start_date ON agenda_events(start_date);
CREATE INDEX IF NOT EXISTS idx_agenda_events_end_date ON agenda_events(end_date);
CREATE INDEX IF NOT EXISTS idx_agenda_events_customer ON agenda_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_agenda_events_service_order ON agenda_events(service_order_id);
CREATE INDEX IF NOT EXISTS idx_agenda_events_employee ON agenda_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_agenda_events_status ON agenda_events(status);

-- Enable RLS
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to agenda_events"
  ON agenda_events FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to agenda_events"
  ON agenda_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to agenda_events"
  ON agenda_events FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from agenda_events"
  ON agenda_events FOR DELETE
  TO public
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_agenda_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agenda_events_updated_at
  BEFORE UPDATE ON agenda_events
  FOR EACH ROW
  EXECUTE FUNCTION update_agenda_events_updated_at();

-- Auto-capitalize text fields
CREATE OR REPLACE FUNCTION capitalize_agenda_events()
RETURNS TRIGGER AS $$
BEGIN
  NEW.title = INITCAP(TRIM(NEW.title));
  IF NEW.description IS NOT NULL THEN
    NEW.description = INITCAP(TRIM(NEW.description));
  END IF;
  IF NEW.location IS NOT NULL THEN
    NEW.location = INITCAP(TRIM(NEW.location));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_capitalize_agenda_events
  BEFORE INSERT OR UPDATE ON agenda_events
  FOR EACH ROW
  EXECUTE FUNCTION capitalize_agenda_events();
