/*
  # Expand Employee Registration System
  
  1. New Columns in employees table
    - cpf: Employee CPF number
    - rg: Employee RG number
    - birth_date: Birth date
    - admission_date: Date of admission
    - department: Department/Sector
    - address_street: Street address
    - address_number: Address number
    - address_complement: Address complement
    - address_neighborhood: Neighborhood
    - address_city: City
    - address_state: State
    - address_zip_code: ZIP/CEP code
    - bank_name: Bank name
    - bank_agency: Bank agency
    - bank_account: Bank account number
    - bank_account_type: Account type (checking/savings)
    - pix_key: PIX key
    - driver_license_number: Driver license number
    - driver_license_category: License category (A, B, C, D, E, AB, etc)
    - driver_license_expiry: License expiration date
    - emergency_contact_name: Emergency contact name
    - emergency_contact_phone: Emergency contact phone
  
  2. New Tables
    - employee_documents: Store document files
      - id (uuid, primary key)
      - employee_id (uuid, foreign key)
      - document_type (text): 'driver_license', 'certificate', 'training', 'contract', 'other'
      - file_name (text)
      - file_url (text)
      - file_size (integer)
      - uploaded_at (timestamp)
      - notes (text)
  
  3. Security
    - Enable RLS on employee_documents
    - Add policies for authenticated users
*/

-- Add new columns to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS admission_date date DEFAULT CURRENT_DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department text;

-- Address fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_street text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_number text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_complement text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_neighborhood text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_state text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_zip_code text;

-- Banking fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_agency text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_type text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pix_key text;

-- Driver license fields
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_number text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_category text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_expiry date;

-- Emergency contact
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('driver_license', 'certificate', 'training', 'contract', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  notes text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_documents
CREATE POLICY "Allow authenticated users to view employee documents"
  ON employee_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert employee documents"
  ON employee_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update employee documents"
  ON employee_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete employee documents"
  ON employee_documents
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON employees(cpf);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
