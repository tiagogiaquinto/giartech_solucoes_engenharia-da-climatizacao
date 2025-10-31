/*
  # Corrigir Foreign Key da tabela user_settings
  
  1. Problema
    - user_settings tem FK para auth.users(id)
    - Mas estamos usando user_id que pode não existir em auth.users
    
  2. Solução
    - Remover a constraint de foreign key
    - Permitir qualquer UUID como user_id
    - Manter índice para performance
    
  3. Segurança
    - RLS continua ativo
    - Validação em nível de aplicação
*/

-- Remover a constraint de foreign key existente
ALTER TABLE user_settings 
  DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- Garantir que o índice existe para performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
  ON user_settings(user_id);

-- Comentário
COMMENT ON COLUMN user_settings.user_id IS 'ID do usuário (UUID) - sem FK para permitir mock users';
