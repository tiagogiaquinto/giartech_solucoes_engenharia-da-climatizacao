/*
  # Corrigir trigger de user_profiles
  
  ## Mudanças
  
  - Atualiza função do trigger para usar os nomes corretos dos campos
  - user_profiles usa 'criado_em' em vez de 'created_at'
  
  ## Segurança
  
  - Sem mudanças nas políticas RLS
*/

-- Recriar a função de trigger para user_profiles com os campos corretos
CREATE OR REPLACE FUNCTION trigger_set_timestamp_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS user_profiles_timestamps ON user_profiles;
DROP TRIGGER IF EXISTS set_timestamp_on_user_profiles ON user_profiles;

CREATE TRIGGER user_profiles_timestamps
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp_user_profiles();
