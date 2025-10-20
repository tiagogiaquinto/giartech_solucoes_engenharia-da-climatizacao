/*
  # Adicionar campos para eventos de agenda

  1. Alterações
    - Adicionar campos type, priority, assigned_to, location à tabela agenda
    - Modificar campo status para aceitar os valores corretos
  
  2. Campos Adicionados
    - priority: prioridade (low, medium, high)  
    - assigned_to: responsável pelo evento
    - location: local do evento
*/

-- Adicionar campos se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda' AND column_name = 'priority'
  ) THEN
    ALTER TABLE agenda ADD COLUMN priority TEXT DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE agenda ADD COLUMN assigned_to TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda' AND column_name = 'location'
  ) THEN
    ALTER TABLE agenda ADD COLUMN location TEXT;
  END IF;
END $$;