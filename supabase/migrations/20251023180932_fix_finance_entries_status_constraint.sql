/*
  # Fix finance_entries status constraint

  1. Changes
    - Update status constraint to accept both old and new values
    - Add: 'pendente', 'pago', 'recebido' (frontend values)
    - Keep: 'a_pagar', 'a_receber', 'pago', 'recebido' (backend values)
    
  2. Notes
    - Allows frontend to use 'pendente' which will be mapped correctly
    - Maintains backward compatibility
*/

-- Drop old constraint
ALTER TABLE finance_entries 
DROP CONSTRAINT IF EXISTS finance_entries_status_check;

-- Add new constraint with all possible values
ALTER TABLE finance_entries 
ADD CONSTRAINT finance_entries_status_check 
CHECK (status IN (
  'pendente',
  'pago', 
  'recebido',
  'a_pagar', 
  'a_receber',
  'cancelado',
  'vencido'
));
