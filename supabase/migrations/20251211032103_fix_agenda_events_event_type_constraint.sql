/*
  # Fix Agenda Events - Update Event Type Constraint
  
  1. Changes
    - Update event_type constraint to accept frontend types
    - Previous types: 'meeting', 'task', 'service_order', 'appointment', 'reminder', 'other'
    - New types: 'pessoal', 'networking', 'financeiro', 'operacional', 'cobrar', 'pagar', 'meeting', 'task', 'service_order', 'appointment', 'reminder', 'other'
    
  2. Reason
    - Frontend uses different type values than database constraint
    - This was causing 400 errors when updating events
    - Users couldn't save edited events
*/

-- Drop the old constraint
ALTER TABLE agenda_events DROP CONSTRAINT IF EXISTS valid_event_type;

-- Add new constraint with frontend types
ALTER TABLE agenda_events 
ADD CONSTRAINT valid_event_type 
CHECK (event_type IN (
  'pessoal', 
  'networking', 
  'financeiro', 
  'operacional', 
  'cobrar', 
  'pagar',
  'meeting', 
  'task', 
  'service_order', 
  'appointment', 
  'reminder', 
  'other'
));

-- Update existing events with old types to new types (if any)
UPDATE agenda_events 
SET event_type = 'pessoal' 
WHERE event_type = 'meeting';

UPDATE agenda_events 
SET event_type = 'operacional' 
WHERE event_type = 'task';
