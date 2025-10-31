/*
  # Adicionar constraint única em user_id
  
  1. Mudanças
    - Adiciona UNIQUE constraint em user_id
    - Permite apenas 1 registro de configurações por usuário
    - Necessário para ON CONFLICT (UPSERT)
    
  2. Benefícios
    - Evita duplicação de configurações
    - Permite UPSERT (INSERT ... ON CONFLICT)
    - Mantém integridade dos dados
*/

-- Adicionar constraint única para user_id
ALTER TABLE user_settings 
  ADD CONSTRAINT user_settings_user_id_unique 
  UNIQUE (user_id);

-- Comentário
COMMENT ON CONSTRAINT user_settings_user_id_unique ON user_settings IS 
  'Garante que cada usuário tem apenas um registro de configurações';
