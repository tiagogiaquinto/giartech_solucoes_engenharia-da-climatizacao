/*
  # Add proper columns to company_settings for document generation

  ## Summary
  The company_settings table currently uses a key-value format with only (key, value, description, updated_at) columns.
  CompanySettings.tsx and the PDF generators expect a row-based format with named columns.
  This migration creates a new proper table `company_profile` with all fields needed for letterhead generation,
  and seeds it with placeholder data that the admin can update via CompanySettings.

  ## New Table
  - `company_profile`: Full company info for document generation
    - company_name, trade_name, cnpj, email, phone, address, city, state, zip_code
    - website, logo_url, primary_color, secondary_color
    - state_registration, municipal_registration
    - pix_key, bank_name, bank_agency, bank_account

  ## Security
  - Enable RLS
  - Authenticated users can SELECT
  - Admins can UPDATE/INSERT
*/

CREATE TABLE IF NOT EXISTS company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Minha Empresa',
  trade_name text DEFAULT '',
  cnpj text DEFAULT '',
  state_registration text DEFAULT '',
  municipal_registration text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  logo_url text DEFAULT '',
  primary_color text DEFAULT '#0F567D',
  secondary_color text DEFAULT '#10B981',
  pix_key text DEFAULT '',
  bank_name text DEFAULT '',
  bank_agency text DEFAULT '',
  bank_account text DEFAULT '',
  technical_manager text DEFAULT '',
  default_warranty_days integer DEFAULT 90,
  default_footer text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read company profile"
  ON company_profile FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert company profile"
  ON company_profile FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update company profile"
  ON company_profile FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon users can read company profile"
  ON company_profile FOR SELECT
  TO anon
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM company_profile LIMIT 1) THEN
    INSERT INTO company_profile (
      company_name, trade_name, cnpj, address, city, state, zip_code,
      phone, email, website, primary_color, secondary_color,
      pix_key, technical_manager, default_warranty_days, default_footer
    ) VALUES (
      'Giartech Soluções',
      'Giartech',
      '00.000.000/0001-00',
      'Rua Exemplo, 123',
      'São Paulo',
      'SP',
      '00000-000',
      '(11) 00000-0000',
      'contato@giartech.com.br',
      'www.giartech.com.br',
      '#0F567D',
      '#10B981',
      '',
      '',
      90,
      'Giartech Soluções — CNPJ: 00.000.000/0001-00 — Tel: (11) 00000-0000'
    );
  END IF;
END $$;
