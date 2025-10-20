/*
  # Atualizar Configurações da Empresa - Giartech Soluções
  
  1. Adicionar Campos
    - Instagram, site, PIX
    - Endereço detalhado (rua, número, bairro, cidade, estado, CEP)
    - Conta bancária
  
  2. Inserir Dados
    - Giartech Soluções completo
    - CNPJ: 37.509.897/0001-93
    - Endereço: Rua Quito, 14, Nossa Sra do Ó
    - Banco: CORA
*/

-- Adicionar novos campos se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'instagram') THEN
    ALTER TABLE company_settings ADD COLUMN instagram text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'website') THEN
    ALTER TABLE company_settings ADD COLUMN website text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'pix_key') THEN
    ALTER TABLE company_settings ADD COLUMN pix_key text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'address_street') THEN
    ALTER TABLE company_settings ADD COLUMN address_street text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'address_number') THEN
    ALTER TABLE company_settings ADD COLUMN address_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'address_neighborhood') THEN
    ALTER TABLE company_settings ADD COLUMN address_neighborhood text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'address_city') THEN
    ALTER TABLE company_settings ADD COLUMN address_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'address_state') THEN
    ALTER TABLE company_settings ADD COLUMN address_state text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'address_zip') THEN
    ALTER TABLE company_settings ADD COLUMN address_zip text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'bank_account_id') THEN
    ALTER TABLE company_settings ADD COLUMN bank_account_id uuid REFERENCES bank_accounts(id);
  END IF;
END $$;

-- Limpar dados antigos
DELETE FROM company_settings;

-- Inserir dados da Giartech Soluções
INSERT INTO company_settings (
  company_name,
  cnpj,
  phone,
  email,
  website,
  instagram,
  pix_key,
  address_street,
  address_number,
  address_neighborhood,
  address_city,
  address_state,
  address_zip,
  address,
  bank_account_id
) VALUES (
  'Giartech Soluções',
  '37.509.897/0001-93',
  '(11) 5555-2560',
  'diretor@giartechsolucoes.com.br',
  'giartechsolucoes.com.br',
  '@giartech.soluções',
  '37.509.897/0001-93',
  'Rua Quito',
  '14',
  'Nossa Sra do Ó',
  'São Paulo',
  'SP',
  '02734-010',
  'Rua Quito, 14, Nossa Sra do Ó, São Paulo - SP, CEP 02734-010',
  'd0dbcf3c-f30c-4a0e-a29f-b3a956710303'
);

-- Garantir RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem visualizar configurações da empresa" ON company_settings;
DROP POLICY IF EXISTS "Apenas autenticados podem atualizar configurações" ON company_settings;
DROP POLICY IF EXISTS "Apenas autenticados podem inserir configurações" ON company_settings;

CREATE POLICY "Todos podem visualizar configurações da empresa"
  ON company_settings FOR SELECT
  USING (true);

CREATE POLICY "Apenas autenticados podem atualizar configurações"
  ON company_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Apenas autenticados podem inserir configurações"
  ON company_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
