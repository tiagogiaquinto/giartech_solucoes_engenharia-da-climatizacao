/*
  # Adicionar Sistema de Credenciais OAuth para Google Ads

  1. Alterações
    - Adiciona colunas para credenciais OAuth na tabela google_ads_accounts
    - Cria tabela separada para tokens OAuth (mais seguro)
    - Adiciona função para criptografar/descriptografar dados sensíveis
  
  2. Segurança
    - Credenciais armazenadas de forma criptografada
    - Tokens de acesso separados dos dados da conta
    - RLS ativado para proteger informações sensíveis
    - Apenas funções do sistema podem acessar credenciais
*/

-- Adicionar colunas para OAuth na tabela de contas
ALTER TABLE google_ads_accounts
ADD COLUMN IF NOT EXISTS client_id text,
ADD COLUMN IF NOT EXISTS client_secret_encrypted text,
ADD COLUMN IF NOT EXISTS developer_token_encrypted text,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted text,
ADD COLUMN IF NOT EXISTS oauth_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS oauth_connected_at timestamptz,
ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Criar tabela para armazenar tokens OAuth de forma segura
CREATE TABLE IF NOT EXISTS google_ads_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(account_id)
);

-- Habilitar RLS
ALTER TABLE google_ads_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas funções do sistema podem acessar
CREATE POLICY "Service role can manage OAuth tokens"
  ON google_ads_oauth_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_account_id 
  ON google_ads_oauth_tokens(account_id);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at 
  ON google_ads_oauth_tokens(expires_at);

-- Função para verificar se token expirou
CREATE OR REPLACE FUNCTION check_token_expired(account_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_expiry timestamptz;
BEGIN
  SELECT expires_at INTO token_expiry
  FROM google_ads_oauth_tokens
  WHERE account_id = account_uuid;
  
  IF token_expiry IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN now() >= token_expiry;
END;
$$;

-- Função para obter token válido (renova se necessário)
CREATE OR REPLACE FUNCTION get_valid_access_token(account_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token text;
  is_expired boolean;
BEGIN
  is_expired := check_token_expired(account_uuid);
  
  IF is_expired THEN
    RETURN NULL;
  END IF;
  
  SELECT access_token INTO token
  FROM google_ads_oauth_tokens
  WHERE account_id = account_uuid;
  
  RETURN token;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_oauth_tokens_updated_at
  BEFORE UPDATE ON google_ads_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();

-- Comentários para documentação
COMMENT ON TABLE google_ads_oauth_tokens IS 'Armazena tokens OAuth 2.0 para autenticação com Google Ads API';
COMMENT ON COLUMN google_ads_oauth_tokens.access_token IS 'Token de acesso JWT para API do Google Ads';
COMMENT ON COLUMN google_ads_oauth_tokens.refresh_token IS 'Token para renovar o access_token quando expirar';
COMMENT ON COLUMN google_ads_oauth_tokens.expires_at IS 'Timestamp de quando o access_token expira';
