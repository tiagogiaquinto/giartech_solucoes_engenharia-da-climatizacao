/*
  # Create Suppliers System

  1. New Tables
    - `suppliers` - Tabela de fornecedores
      
  2. Changes
    - Add supplier_id to materials table
    - Add supplier_id to financial_transactions table
    
  3. Security
    - Enable RLS with policies for development
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  pais TEXT DEFAULT 'Brasil',
  contact_person TEXT,
  payment_terms TEXT,
  payment_methods TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add supplier_id to materials if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'materials' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE materials ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
    CREATE INDEX idx_materials_supplier_id ON materials(supplier_id);
  END IF;
END $$;

-- Add supplier_id to financial_transactions if not exists  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_transactions' AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
    CREATE INDEX idx_financial_transactions_supplier_id ON financial_transactions(supplier_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;

CREATE POLICY "anon_select_suppliers" ON suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_suppliers" ON suppliers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_suppliers" ON suppliers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_suppliers" ON suppliers FOR DELETE TO anon USING (true);

-- Triggers
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_suppliers_updated_at();

CREATE OR REPLACE FUNCTION trigger_capitalize_suppliers()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.razao_social IS NOT NULL THEN NEW.razao_social := INITCAP(NEW.razao_social); END IF;
  IF NEW.nome_fantasia IS NOT NULL THEN NEW.nome_fantasia := INITCAP(NEW.nome_fantasia); END IF;
  IF NEW.contact_person IS NOT NULL THEN NEW.contact_person := INITCAP(NEW.contact_person); END IF;
  IF NEW.logradouro IS NOT NULL THEN NEW.logradouro := INITCAP(NEW.logradouro); END IF;
  IF NEW.bairro IS NOT NULL THEN NEW.bairro := INITCAP(NEW.bairro); END IF;
  IF NEW.cidade IS NOT NULL THEN NEW.cidade := INITCAP(NEW.cidade); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_capitalize_suppliers_data ON suppliers;
CREATE TRIGGER trigger_capitalize_suppliers_data
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_capitalize_suppliers();

-- View with stats
CREATE OR REPLACE VIEW suppliers_with_stats AS
SELECT 
  s.*,
  COUNT(DISTINCT m.id) as materials_count,
  COUNT(DISTINCT ft.id) as transactions_count,
  COALESCE(SUM(CASE WHEN ft.transaction_type = 'despesa' THEN ft.amount ELSE 0 END), 0) as total_spent,
  COALESCE(MAX(ft.transaction_date), NULL) as last_purchase_date
FROM suppliers s
LEFT JOIN materials m ON s.id = m.supplier_id
LEFT JOIN financial_transactions ft ON s.id = ft.supplier_id
GROUP BY s.id;