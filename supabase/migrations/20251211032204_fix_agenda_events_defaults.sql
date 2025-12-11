/*
  # Fix Agenda Events - Update Default Values
  
  1. Changes
    - Update event_type default to Portuguese value
    - Previous default: 'meeting'
    - New default: 'pessoal'
    
  2. Reason
    - Frontend uses Portuguese values by default
    - Ensures consistency with frontend expectations
*/

-- Update default event_type to Portuguese
ALTER TABLE agenda_events 
ALTER COLUMN event_type SET DEFAULT 'pessoal';
