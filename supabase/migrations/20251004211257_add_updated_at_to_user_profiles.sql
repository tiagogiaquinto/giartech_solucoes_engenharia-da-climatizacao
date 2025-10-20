/*
  # Adicionar campo updated_at à tabela user_profiles
  
  ## Mudanças
  
  - Adiciona campo updated_at para compatibilidade com triggers existentes
  
  ## Segurança
  
  - Sem mudanças nas políticas RLS
*/

-- Adicionar campo updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
