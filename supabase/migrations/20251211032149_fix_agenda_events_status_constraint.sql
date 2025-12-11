/*
  # Fix Agenda Events - Update Status Constraint
  
  1. Changes
    - Update status constraint to accept frontend Portuguese values
    - Previous types: 'scheduled', 'in_progress', 'completed', 'cancelled'
    - New types: 'a_fazer', 'em_andamento', 'feito', 'cancelado', 'scheduled', 'in_progress', 'completed', 'cancelled'
    
  2. Reason
    - Frontend uses Portuguese status values
    - This was causing 400 errors when updating events
    - Keep both English and Portuguese for compatibility
*/

-- Drop the old constraint
ALTER TABLE agenda_events DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with Portuguese and English values
ALTER TABLE agenda_events 
ADD CONSTRAINT valid_status 
CHECK (status IN (
  'a_fazer',
  'em_andamento', 
  'feito',
  'cancelado',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
));

-- Update default value to Portuguese
ALTER TABLE agenda_events 
ALTER COLUMN status SET DEFAULT 'a_fazer';
