/*
  # Portal Realtime Sync - Document Views Log + Partner Orders RPC v3

  ## Summary
  Infraestrutura de banco de dados para suporte ao Portal em tempo real.
  Corrige get_partner_portal_orders existente com DROP+CREATE.

  ## Changes
  - Cria tabela portal_document_views para log de "visto pelo cliente"
  - RPC log_portal_document_view, get_portal_document_views
  - Recria get_partner_portal_orders com colunas corretas da tabela partner_referrals
  - Habilita Realtime nas tabelas do portal
*/

-- ─────────────────────────────────────────────────────────────
-- 1. Tabela de log de visualizações de documentos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_document_views (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_account_id uuid REFERENCES portal_accounts(id) ON DELETE CASCADE,
  customer_id       uuid REFERENCES customers(id) ON DELETE CASCADE,
  document_name     text NOT NULL DEFAULT '',
  document_type     text NOT NULL DEFAULT 'outros',
  viewed_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portal_document_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portal_document_views' AND policyname = 'Admin pode ver logs de visualizacao'
  ) THEN
    CREATE POLICY "Admin pode ver logs de visualizacao"
      ON portal_document_views FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portal_document_views' AND policyname = 'Portal pode inserir log de visualizacao'
  ) THEN
    CREATE POLICY "Portal pode inserir log de visualizacao"
      ON portal_document_views FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_portal_document_views_customer  ON portal_document_views(customer_id);
CREATE INDEX IF NOT EXISTS idx_portal_document_views_account   ON portal_document_views(portal_account_id);
CREATE INDEX IF NOT EXISTS idx_portal_document_views_viewed_at ON portal_document_views(viewed_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. RPC: log_portal_document_view
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_portal_document_view(
  p_portal_account_id uuid,
  p_customer_id       uuid,
  p_document_name     text,
  p_document_type     text DEFAULT 'outros'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO portal_document_views (portal_account_id, customer_id, document_name, document_type)
  VALUES (p_portal_account_id, p_customer_id, p_document_name, p_document_type);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_portal_document_view(uuid, uuid, text, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. RPC: get_portal_document_views (painel admin)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_portal_document_views(
  p_customer_id uuid DEFAULT NULL,
  p_limit       integer DEFAULT 100
)
RETURNS TABLE (
  id                uuid,
  portal_account_id uuid,
  customer_id       uuid,
  customer_name     text,
  full_name         text,
  document_name     text,
  document_type     text,
  viewed_at         timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dv.id,
    dv.portal_account_id,
    dv.customer_id,
    COALESCE(c.name, '')::text       AS customer_name,
    COALESCE(pa.full_name, '')::text AS full_name,
    dv.document_name,
    dv.document_type,
    dv.viewed_at
  FROM portal_document_views dv
  LEFT JOIN customers       c  ON c.id  = dv.customer_id
  LEFT JOIN portal_accounts pa ON pa.id = dv.portal_account_id
  WHERE (p_customer_id IS NULL OR dv.customer_id = p_customer_id)
  ORDER BY dv.viewed_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_portal_document_views(uuid, integer) TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Recria get_partner_portal_orders com colunas corretas
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_partner_portal_orders(uuid);

CREATE FUNCTION public.get_partner_portal_orders(p_partner_account_id uuid)
RETURNS TABLE (
  id                uuid,
  customer_name     text,
  customer_phone    text,
  customer_email    text,
  customer_document text,
  status            text,
  commission_type   text,
  commission_value  numeric,
  commission_paid   boolean,
  notes             text,
  created_at        timestamptz,
  updated_at        timestamptz,
  os_id             uuid,
  os_number         text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    COALESCE(pr.customer_name, '')::text,
    COALESCE(pr.customer_phone, '')::text,
    COALESCE(pr.customer_email, '')::text,
    COALESCE(pr.customer_document, '')::text,
    COALESCE(pr.status, 'pendente')::text,
    COALESCE(pr.commission_type, 'fixed')::text,
    COALESCE(pr.commission_value, 0),
    COALESCE(pr.commission_paid, false),
    COALESCE(pr.notes, '')::text,
    pr.created_at,
    pr.updated_at,
    pr.service_order_id,
    COALESCE(so.order_number, '')::text
  FROM partner_referrals pr
  LEFT JOIN service_orders so ON so.id = pr.service_order_id
  WHERE pr.partner_account_id = p_partner_account_id
  ORDER BY pr.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_portal_orders(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. Habilitar Realtime nas tabelas dos portais
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'service_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'partner_referrals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE partner_referrals;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'portal_document_views'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE portal_document_views;
  END IF;
END $$;
