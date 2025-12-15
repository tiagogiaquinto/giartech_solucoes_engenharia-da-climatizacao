/*
  # Add Complete Contract and PMOC Fields - Fixed

  This migration adds comprehensive fields for service contracts and PMOC (Maintenance, Operation and Control Plan) contracts.

  ## Changes
  
  1. Add PMOC-specific fields to contracts table
  2. Add technical responsibility fields
  3. Add equipment and maintenance schedule fields
  4. Add compliance and regulatory fields
  5. Create views for contract management
  
  ## PMOC Requirements (Lei 13.589/2018)
  - Equipment technical data
  - Maintenance schedules
  - Technical responsibility
  - Regulatory compliance
  - Service scope
*/

-- Add comprehensive contract fields
DO $$
BEGIN
  -- Contract identification and parties
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_number') THEN
    ALTER TABLE contracts ADD COLUMN contract_number TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_type') THEN
    ALTER TABLE contracts ADD COLUMN contract_type TEXT DEFAULT 'servico';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'is_pmoc') THEN
    ALTER TABLE contracts ADD COLUMN is_pmoc BOOLEAN DEFAULT false;
  END IF;

  -- Contract parties
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contractor_name') THEN
    ALTER TABLE contracts ADD COLUMN contractor_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contractor_document') THEN
    ALTER TABLE contracts ADD COLUMN contractor_document TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contractor_address') THEN
    ALTER TABLE contracts ADD COLUMN contractor_address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contractor_representative') THEN
    ALTER TABLE contracts ADD COLUMN contractor_representative TEXT;
  END IF;

  -- Contract dates and validity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'start_date') THEN
    ALTER TABLE contracts ADD COLUMN start_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'end_date') THEN
    ALTER TABLE contracts ADD COLUMN end_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'renewal_type') THEN
    ALTER TABLE contracts ADD COLUMN renewal_type TEXT DEFAULT 'manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'renewal_period_months') THEN
    ALTER TABLE contracts ADD COLUMN renewal_period_months INTEGER DEFAULT 12;
  END IF;

  -- Financial information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_value') THEN
    ALTER TABLE contracts ADD COLUMN contract_value DECIMAL(15,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'payment_frequency') THEN
    ALTER TABLE contracts ADD COLUMN payment_frequency TEXT DEFAULT 'mensal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'payment_day') THEN
    ALTER TABLE contracts ADD COLUMN payment_day INTEGER DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'late_fee_percentage') THEN
    ALTER TABLE contracts ADD COLUMN late_fee_percentage DECIMAL(5,2) DEFAULT 2.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'interest_rate_monthly') THEN
    ALTER TABLE contracts ADD COLUMN interest_rate_monthly DECIMAL(5,2) DEFAULT 1.00;
  END IF;

  -- Services and scope
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'services_included') THEN
    ALTER TABLE contracts ADD COLUMN services_included TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'services_excluded') THEN
    ALTER TABLE contracts ADD COLUMN services_excluded TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'scope_description') THEN
    ALTER TABLE contracts ADD COLUMN scope_description TEXT;
  END IF;

  -- Warranty and guarantees
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'warranty_period_days') THEN
    ALTER TABLE contracts ADD COLUMN warranty_period_days INTEGER DEFAULT 90;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'warranty_coverage') THEN
    ALTER TABLE contracts ADD COLUMN warranty_coverage TEXT;
  END IF;

  -- === PMOC SPECIFIC FIELDS ===
  
  -- Equipment and system data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_system_type') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_system_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_total_btu') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_total_btu BIGINT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_equipment_count') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_equipment_count INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_equipment_list') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_equipment_list JSONB;
  END IF;

  -- Technical responsibility
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_responsible_technician') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_responsible_technician TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_technician_crea') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_technician_crea TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_technician_art') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_technician_art TEXT;
  END IF;

  -- Maintenance schedule
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_maintenance_frequency') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_maintenance_frequency TEXT DEFAULT 'mensal';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_maintenance_schedule') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_maintenance_schedule JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_emergency_attendance') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_emergency_attendance BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_attendance_sla_hours') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_attendance_sla_hours INTEGER DEFAULT 24;
  END IF;

  -- Regulatory compliance
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_compliance_law') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_compliance_law TEXT DEFAULT 'Lei 13.589/2018';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_environmental_standards') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_environmental_standards TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_inspection_reports') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_inspection_reports BOOLEAN DEFAULT true;
  END IF;

  -- Air quality and filters
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_filter_change_frequency') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_filter_change_frequency TEXT DEFAULT 'trimestral';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'pmoc_air_quality_monitoring') THEN
    ALTER TABLE contracts ADD COLUMN pmoc_air_quality_monitoring BOOLEAN DEFAULT true;
  END IF;

  -- Contract termination
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'termination_notice_days') THEN
    ALTER TABLE contracts ADD COLUMN termination_notice_days INTEGER DEFAULT 30;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'termination_penalty') THEN
    ALTER TABLE contracts ADD COLUMN termination_penalty TEXT;
  END IF;

  -- Additional clauses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'special_clauses') THEN
    ALTER TABLE contracts ADD COLUMN special_clauses TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'confidentiality_clause') THEN
    ALTER TABLE contracts ADD COLUMN confidentiality_clause TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'jurisdiction') THEN
    ALTER TABLE contracts ADD COLUMN jurisdiction TEXT;
  END IF;

  -- Documents and attachments
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'attachments') THEN
    ALTER TABLE contracts ADD COLUMN attachments JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'signed_document_url') THEN
    ALTER TABLE contracts ADD COLUMN signed_document_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'signature_date') THEN
    ALTER TABLE contracts ADD COLUMN signature_date DATE;
  END IF;

  -- Status and tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'status') THEN
    ALTER TABLE contracts ADD COLUMN status TEXT DEFAULT 'rascunho';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'last_review_date') THEN
    ALTER TABLE contracts ADD COLUMN last_review_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'next_review_date') THEN
    ALTER TABLE contracts ADD COLUMN next_review_date DATE;
  END IF;

END $$;

-- Create view for PMOC contracts
DROP VIEW IF EXISTS v_pmoc_contracts CASCADE;
CREATE VIEW v_pmoc_contracts AS
SELECT
  c.*,
  cu.nome_razao as customer_name,
  cu.cnpj as customer_document,
  CASE
    WHEN c.end_date < CURRENT_DATE THEN 'Vencido'
    WHEN c.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'A Vencer'
    WHEN c.status = 'ativo' THEN 'Ativo'
    ELSE INITCAP(c.status)
  END as contract_status_display,
  c.end_date - CURRENT_DATE as days_until_expiration
FROM contracts c
LEFT JOIN customers cu ON c.customer_id = cu.id
WHERE c.is_pmoc = true;

-- Create view for service contracts
DROP VIEW IF EXISTS v_service_contracts CASCADE;
CREATE VIEW v_service_contracts AS
SELECT
  c.*,
  cu.nome_razao as customer_name,
  cu.cnpj as customer_document,
  CASE
    WHEN c.end_date < CURRENT_DATE THEN 'Vencido'
    WHEN c.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'A Vencer'
    WHEN c.status = 'ativo' THEN 'Ativo'
    ELSE INITCAP(c.status)
  END as contract_status_display,
  c.end_date - CURRENT_DATE as days_until_expiration
FROM contracts c
LEFT JOIN customers cu ON c.customer_id = cu.id
WHERE COALESCE(c.is_pmoc, false) = false;

-- Grant permissions
GRANT SELECT ON v_pmoc_contracts TO anon, authenticated;
GRANT SELECT ON v_service_contracts TO anon, authenticated;

-- Add constraint for contract type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_type_check'
  ) THEN
    ALTER TABLE contracts ADD CONSTRAINT contracts_type_check 
    CHECK (contract_type IN ('servico', 'pmoc', 'manutencao', 'venda', 'locacao', 'consultoria'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add constraint for status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_status_check'
  ) THEN
    ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
    CHECK (status IN ('rascunho', 'pendente', 'ativo', 'suspenso', 'cancelado', 'finalizado'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT 'CT' || year_suffix || '-' || LPAD((COALESCE(MAX(
    CASE 
      WHEN contract_number LIKE 'CT' || year_suffix || '-%' 
      THEN CAST(SUBSTRING(contract_number FROM '\d+$') AS INTEGER)
      ELSE 0
    END
  ), 0) + 1)::TEXT, 4, '0')
  INTO new_number
  FROM contracts;
  
  RETURN new_number;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_contract_number TO anon, authenticated;
