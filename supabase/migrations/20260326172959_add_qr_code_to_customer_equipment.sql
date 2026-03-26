/*
  # QR Code de Adesivagem em Equipamentos

  ## Objetivo
  Permite que o técnico, ao finalizar uma OS, vincule um ID de adesivo (QR Code)
  ao cadastro do equipamento do cliente. O cliente pode então escanear o QR Code
  para acessar o portal Giartech Care com informações do equipamento.

  ## Mudanças

  ### Tabela `customer_equipment`
  - Adiciona `qr_code_token` (uuid, unique) — token único do adesivo colado na máquina
  - Adiciona `qr_code_linked_at` (timestamptz) — data de adesivagem
  - Adiciona `qr_code_linked_by` — nome do técnico que fez a adesivagem
  - Adiciona `qr_code_linked_os_id` (uuid) — OS onde o adesivo foi vinculado

  ### Nova tabela `qr_code_scans`
  - Registra cada vez que um QR Code é escaneado (analytics)

  ### Função RPC `get_care_asset_by_token`
  - Recriada para buscar dados completos do equipamento pelo token do QR Code
  - Retorna dados públicos (sem autenticação necessária) para o portal Care

  ### Função RPC `link_qr_code_to_equipment`
  - Vincula um token de QR Code a um equipamento
  - Chamada pelo técnico ao finalizar a OS

  ## Segurança
  - `qr_code_scans` tem RLS com acesso autenticado
  - `get_care_asset_by_token` é SECURITY DEFINER para acesso público ao portal
*/

-- Adiciona colunas de QR Code na tabela de equipamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_equipment' AND column_name = 'qr_code_token'
  ) THEN
    ALTER TABLE customer_equipment ADD COLUMN qr_code_token uuid UNIQUE DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_equipment' AND column_name = 'qr_code_linked_at'
  ) THEN
    ALTER TABLE customer_equipment ADD COLUMN qr_code_linked_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_equipment' AND column_name = 'qr_code_linked_by'
  ) THEN
    ALTER TABLE customer_equipment ADD COLUMN qr_code_linked_by text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_equipment' AND column_name = 'qr_code_linked_os_id'
  ) THEN
    ALTER TABLE customer_equipment ADD COLUMN qr_code_linked_os_id uuid DEFAULT NULL;
  END IF;
END $$;

-- Tabela de analytics de escaneamentos
CREATE TABLE IF NOT EXISTS qr_code_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_token uuid NOT NULL,
  scanned_at timestamptz DEFAULT now(),
  user_agent text,
  referrer text
);

ALTER TABLE qr_code_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert scans"
  ON qr_code_scans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view scans"
  ON qr_code_scans FOR SELECT
  TO authenticated
  USING (true);

-- Index para busca por token
CREATE INDEX IF NOT EXISTS idx_customer_equipment_qr_token
  ON customer_equipment (qr_code_token)
  WHERE qr_code_token IS NOT NULL;

-- Recria função get_care_asset_by_token com dados completos
CREATE OR REPLACE FUNCTION get_care_asset_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_equipment record;
BEGIN
  SELECT
    ce.id,
    ce.name,
    ce.model,
    ce.brand,
    ce.serial_number,
    ce.location,
    ce.last_maintenance_date,
    ce.next_maintenance_date,
    ce.asset_health,
    ce.pmoc_active,
    ce.qr_code_token,
    c.name AS customer_name,
    (
      SELECT e.name
      FROM service_orders so
      JOIN employees e ON e.id = so.assigned_employee_id
      WHERE so.status = 'concluido'
        AND so.customer_equipment_id = ce.id
      ORDER BY so.updated_at DESC
      LIMIT 1
    ) AS last_technician,
    (
      SELECT so.updated_at
      FROM service_orders so
      WHERE so.status = 'concluido'
        AND so.customer_equipment_id = ce.id
      ORDER BY so.updated_at DESC
      LIMIT 1
    ) AS last_service_date
  INTO v_equipment
  FROM customer_equipment ce
  LEFT JOIN customers c ON c.id = ce.customer_id
  WHERE ce.qr_code_token = p_token
  LIMIT 1;

  IF v_equipment.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'asset_id', v_equipment.id,
    'asset_name', v_equipment.name,
    'model', v_equipment.model,
    'brand', v_equipment.brand,
    'serial_number', v_equipment.serial_number,
    'location', v_equipment.location,
    'last_maintenance', CASE WHEN v_equipment.last_maintenance_date IS NOT NULL
      THEN to_char(v_equipment.last_maintenance_date, 'YYYY-MM-DD') ELSE NULL END,
    'last_service_date', CASE WHEN v_equipment.last_service_date IS NOT NULL
      THEN to_char(v_equipment.last_service_date, 'YYYY-MM-DD') ELSE NULL END,
    'next_maintenance', CASE WHEN v_equipment.next_maintenance_date IS NOT NULL
      THEN to_char(v_equipment.next_maintenance_date, 'YYYY-MM-DD') ELSE NULL END,
    'last_technician', v_equipment.last_technician,
    'pmoc_active', COALESCE(v_equipment.pmoc_active, false),
    'asset_health', COALESCE(v_equipment.asset_health, 'good'),
    'customer_name', v_equipment.customer_name,
    'qr_code_token', v_equipment.qr_code_token
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_care_asset_by_token(uuid) TO anon, authenticated;

-- Função para vincular QR Code a equipamento (chamada pelo técnico)
CREATE OR REPLACE FUNCTION link_qr_code_to_equipment(
  p_equipment_id uuid,
  p_qr_token uuid,
  p_technician_name text DEFAULT NULL,
  p_os_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
BEGIN
  -- Verifica se token já está em uso em outro equipamento
  SELECT id INTO v_existing
  FROM customer_equipment
  WHERE qr_code_token = p_qr_token AND id != p_equipment_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token já está vinculado a outro equipamento');
  END IF;

  UPDATE customer_equipment
  SET
    qr_code_token = p_qr_token,
    qr_code_linked_at = now(),
    qr_code_linked_by = p_technician_name,
    qr_code_linked_os_id = p_os_id
  WHERE id = p_equipment_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION link_qr_code_to_equipment(uuid, uuid, text, uuid) TO authenticated;
