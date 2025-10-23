/*
  # Adicionar colunas faltantes para compatibilidade

  1. Alterações
    - Adiciona alias `nome` para `name` em employees (via view ou computed column)
    - Adiciona alias `nome` para `name` em staff (via view ou computed column)
    - Adiciona `unit_of_measure` em materials como alias de `unit`
    - Adiciona `escopo_detalhado` em service_order_items se não existir
    
  2. Objetivo
    - Manter compatibilidade com código frontend que usa esses nomes
*/

-- Adicionar unit_of_measure como alias de unit em materials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' 
    AND column_name = 'unit_of_measure'
  ) THEN
    ALTER TABLE materials ADD COLUMN unit_of_measure text 
    GENERATED ALWAYS AS (unit) STORED;
  END IF;
END $$;

-- Verificar se escopo_detalhado existe em service_order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_order_items' 
    AND column_name = 'escopo_detalhado'
  ) THEN
    ALTER TABLE service_order_items ADD COLUMN escopo_detalhado text;
  END IF;
END $$;

-- Criar views com alias para employees e staff
-- View para employees com campo 'nome'
CREATE OR REPLACE VIEW v_employees_with_nome AS
SELECT 
  id,
  name,
  name as nome,  -- alias
  email,
  phone,
  role,
  active,
  created_at,
  updated_at,
  salary,
  cpf,
  rg,
  birth_date,
  admission_date,
  department,
  address_street,
  address_number,
  address_complement,
  address_neighborhood,
  address_city,
  address_state,
  address_zip_code,
  bank_name,
  bank_agency,
  bank_account,
  bank_account_type,
  pix_key,
  driver_license_number,
  driver_license_category,
  driver_license_expiry,
  emergency_contact_name,
  emergency_contact_phone,
  custo_hora,
  especialidade,
  nivel
FROM employees;

-- View para staff com campo 'nome'
CREATE OR REPLACE VIEW v_staff_with_nome AS
SELECT 
  id,
  name,
  name as nome,  -- alias
  email,
  phone,
  role,
  department,
  hire_date,
  salary,
  status,
  user_id,
  notes,
  created_at,
  updated_at
FROM staff;

-- Grant permissions nas views
GRANT SELECT ON v_employees_with_nome TO anon, authenticated;
GRANT SELECT ON v_staff_with_nome TO anon, authenticated;
