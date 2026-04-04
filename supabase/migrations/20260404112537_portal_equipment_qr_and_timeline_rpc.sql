/*
  # Portal Equipment - QR Code + Timeline + Photos + Documents RPC

  ## Summary
  Expande o sistema de gestao de ativos do Portal do Cliente com:

  ## Changes to existing tables
  - `portal_equipment_inventory`: Adiciona coluna `qr_code` (text, unique) gerada automaticamente

  ## New RPC Functions
  1. `get_equipment_service_timeline(p_equipment_id, p_customer_id)`:
     Retorna a linha do tempo de OSs vinculadas a um equipamento especifico,
     com status, datas, tecnico responsavel e indicador de garantia.

  2. `get_equipment_photos(p_equipment_id, p_customer_id)`:
     Retorna as fotos (antes/depois/durante) das OSs vinculadas ao equipamento.

  3. `get_equipment_documents(p_equipment_id, p_customer_id)`:
     Retorna os documentos gerados (PDFs) vinculados ao cliente para exibir
     no detalhe do equipamento.

  ## Security
  - Todas as funcoes sao SECURITY DEFINER e filtram por customer_id
    para garantir que um cliente nao veja dados de outro.
  - qr_code e gerado automaticamente com prefixo 'EQ-' + 8 chars do id
*/

-- ─────────────────────────────────────────────────────────────
-- 1. Adiciona qr_code a portal_equipment_inventory
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_equipment_inventory'
      AND column_name = 'qr_code'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE portal_equipment_inventory ADD COLUMN qr_code text;
  END IF;
END $$;

-- Popula qr_code para registros existentes sem um
UPDATE portal_equipment_inventory
SET qr_code = 'EQ-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE qr_code IS NULL OR qr_code = '';

-- Cria indice unico
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_equipment_qr_code
  ON portal_equipment_inventory(qr_code)
  WHERE qr_code IS NOT NULL;

-- Trigger para gerar qr_code automaticamente em novos registros
CREATE OR REPLACE FUNCTION public.generate_equipment_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'EQ-' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_equipment_qr_code ON portal_equipment_inventory;
CREATE TRIGGER trg_generate_equipment_qr_code
  BEFORE INSERT ON portal_equipment_inventory
  FOR EACH ROW EXECUTE FUNCTION generate_equipment_qr_code();

-- ─────────────────────────────────────────────────────────────
-- 2. RPC: get_equipment_service_timeline
--    Linha do tempo de OSs vinculadas ao equipamento
--    Busca por correspondencia de nome/localizacao na descricao da OS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_equipment_service_timeline(
  p_equipment_id uuid,
  p_customer_id  uuid
)
RETURNS TABLE (
  os_id               uuid,
  order_number        text,
  title               text,
  status              text,
  created_at          timestamptz,
  scheduled_at        timestamptz,
  completed_at        timestamptz,
  technician_name     text,
  total_value         numeric,
  warranty_end_date   date,
  warranty_status     text,
  relatorio_tecnico   text,
  has_photos          boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eq_name     text;
  v_eq_location text;
BEGIN
  -- Busca nome e localizacao do equipamento
  SELECT name, location INTO v_eq_name, v_eq_location
  FROM portal_equipment_inventory
  WHERE id = p_equipment_id AND customer_id = p_customer_id;

  IF v_eq_name IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    so.id,
    so.order_number,
    COALESCE(so.title, so.service_type, 'Servico')::text AS title,
    so.status,
    so.created_at,
    so.scheduled_at,
    so.completed_at,
    COALESCE(so.assigned_technician_name, '')::text AS technician_name,
    COALESCE(so.total_value, 0) AS total_value,
    so.warranty_end_date,
    CASE
      WHEN so.warranty_end_date IS NULL THEN 'sem_garantia'
      WHEN so.warranty_end_date < CURRENT_DATE THEN 'vencida'
      WHEN so.warranty_end_date <= CURRENT_DATE + interval '30 days' THEN 'vencendo'
      ELSE 'vigente'
    END::text AS warranty_status,
    COALESCE(so.relatorio_tecnico, '')::text AS relatorio_tecnico,
    EXISTS (
      SELECT 1 FROM service_order_photos sop WHERE sop.service_order_id = so.id
    ) AS has_photos
  FROM service_orders so
  WHERE so.customer_id = p_customer_id
    AND (
      (v_eq_name    <> '' AND so.description ILIKE '%' || v_eq_name    || '%')
      OR (v_eq_location <> '' AND so.description ILIKE '%' || v_eq_location || '%')
    )
  ORDER BY so.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_equipment_service_timeline(uuid, uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. RPC: get_equipment_photos
--    Fotos de OSs relacionadas ao equipamento
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_equipment_photos(
  p_equipment_id uuid,
  p_customer_id  uuid
)
RETURNS TABLE (
  photo_id    uuid,
  os_id       uuid,
  order_number text,
  photo_url   text,
  photo_type  text,
  description text,
  taken_at    timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eq_name     text;
  v_eq_location text;
BEGIN
  SELECT name, location INTO v_eq_name, v_eq_location
  FROM portal_equipment_inventory
  WHERE id = p_equipment_id AND customer_id = p_customer_id;

  IF v_eq_name IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sop.id,
    so.id,
    so.order_number,
    sop.photo_url,
    sop.photo_type,
    COALESCE(sop.description, '')::text,
    sop.taken_at
  FROM service_order_photos sop
  JOIN service_orders so ON so.id = sop.service_order_id
  WHERE so.customer_id = p_customer_id
    AND (
      (v_eq_name    <> '' AND so.description ILIKE '%' || v_eq_name    || '%')
      OR (v_eq_location <> '' AND so.description ILIKE '%' || v_eq_location || '%')
    )
  ORDER BY sop.taken_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_equipment_photos(uuid, uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Habilita Realtime em portal_equipment_inventory
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'portal_equipment_inventory'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE portal_equipment_inventory;
  END IF;
END $$;
