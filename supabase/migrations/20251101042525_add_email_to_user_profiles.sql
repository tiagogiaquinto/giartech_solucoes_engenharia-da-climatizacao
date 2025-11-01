/*
  # Adicionar coluna email à tabela user_profiles

  1. Alterações
    - Adiciona coluna `email` (text, unique) à tabela `user_profiles`
    - Preenche emails existentes a partir de auth.users
    - Cria índice para performance
  
  2. Segurança
    - Mantém RLS existente
*/

-- Adicionar coluna email
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email);

-- Preencher emails existentes a partir de auth.users (se houver)
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
AND up.email IS NULL;
