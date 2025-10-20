/*
  # Migrar dados completos de agenda para agenda_events
  
  1. Mapeamento de event_type
    - pessoal → other
    - operacional → task
    - financeiro → reminder
    - cobrar → reminder
    - meeting → meeting
  
  2. Mapeamento de status
    - confirmed → scheduled
    - scheduled → scheduled
    - completed → completed
    - null → scheduled
*/

-- Migrar dados com mapeamento completo
INSERT INTO agenda_events (
  id,
  title,
  description,
  start_date,
  end_date,
  event_type,
  customer_id,
  employee_id,
  location,
  status,
  priority,
  all_day,
  notes,
  created_at,
  updated_at
)
SELECT 
  id,
  title,
  description,
  start_date,
  end_date,
  CASE event_type
    WHEN 'pessoal' THEN 'other'
    WHEN 'operacional' THEN 'task'
    WHEN 'financeiro' THEN 'reminder'
    WHEN 'cobrar' THEN 'reminder'
    WHEN 'meeting' THEN 'meeting'
    ELSE 'other'
  END as event_type,
  customer_id,
  staff_id as employee_id,
  location,
  CASE status
    WHEN 'confirmed' THEN 'scheduled'
    WHEN 'scheduled' THEN 'scheduled'
    WHEN 'completed' THEN 'completed'
    ELSE 'scheduled'
  END as status,
  COALESCE(priority, 'medium') as priority,
  COALESCE(all_day, false) as all_day,
  notes,
  created_at,
  updated_at
FROM agenda
ON CONFLICT (id) DO NOTHING;