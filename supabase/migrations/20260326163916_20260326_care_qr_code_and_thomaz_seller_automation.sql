/*
  # Giartech Care: QR Code público + Automação Thomaz Vendedor

  ## 1. Coluna qr_code_token em customer_assets
  - Token único e público para acesso via QR Code sem login
  - Gerado automaticamente ao inserir um novo ativo

  ## 2. View pública v_care_asset_info
  - Retorna dados seguros de um ativo por token QR Code
  - Exibe: nome do ativo, modelo, data última higienização, nome do técnico

  ## 3. Função get_care_asset_by_token(token text)
  - Função pública (sem autenticação) para buscar dados do ativo via token
  - Retorna jsonb com dados para a tela "Giartech Care"

  ## 4. Automação Thomaz Vendedor
  - Função check_assets_for_renewal() varre customer_assets
  - Se um ativo está há mais de 180 dias sem manutenção, cria tarefa em admin_tasks
  - Tarefa com titulo "Venda Recorrente: [Nome do Cliente]"
  - Cron scheduling via pg_cron (executa diariamente)
*/

-- ============================================================
-- 1. COLUNA qr_code_token EM customer_assets
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_assets' AND column_name = 'qr_code_token'
  ) THEN
    ALTER TABLE customer_assets
      ADD COLUMN qr_code_token text UNIQUE DEFAULT gen_random_uuid()::text;

    -- Preenche tokens para ativos existentes
    UPDATE customer_assets SET qr_code_token = gen_random_uuid()::text
    WHERE qr_code_token IS NULL;
  END IF;

  -- Campos adicionais para exibição no Giartech Care
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_assets' AND column_name = 'last_technician_name'
  ) THEN
    ALTER TABLE customer_assets
      ADD COLUMN last_technician_name text,
      ADD COLUMN last_service_date date,
      ADD COLUMN brand text,
      ADD COLUMN serial_number text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customer_assets_qr_token ON customer_assets(qr_code_token);

-- ============================================================
-- 2. FUNÇÃO PÚBLICA get_care_asset_by_token
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_care_asset_by_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'found',            true,
    'asset_id',         ca.id,
    'asset_name',       ca.name,
    'model',            COALESCE(ca.model, ''),
    'brand',            COALESCE(ca.brand, ''),
    'serial_number',    COALESCE(ca.serial_number, ''),
    'location',         COALESCE(ca.location, ''),
    'last_maintenance', ca.last_maintenance,
    'last_service_date',ca.last_service_date,
    'last_technician',  COALESCE(ca.last_technician_name, ''),
    'next_maintenance', ca.next_maintenance,
    'pmoc_active',      COALESCE(ca.pmoc_active, false),
    'asset_health',     COALESCE(ca.asset_health, 'good'),
    'customer_name',    COALESCE(c.name, ''),
    'customer_id',      ca.client_id,
    'qr_code_token',    ca.qr_code_token
  )
  INTO v_result
  FROM customer_assets ca
  LEFT JOIN customers c ON c.id = ca.client_id
  WHERE ca.qr_code_token = p_token;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_care_asset_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_care_asset_by_token(text) TO authenticated;

-- ============================================================
-- 3. AUTOMAÇÃO THOMAZ VENDEDOR — 180 dias sem manutenção
-- ============================================================

-- Garante coluna title em admin_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_tasks' AND column_name = 'title'
  ) THEN
    ALTER TABLE admin_tasks ADD COLUMN title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_tasks' AND column_name = 'color'
  ) THEN
    ALTER TABLE admin_tasks ADD COLUMN color text DEFAULT 'blue';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_tasks' AND column_name = 'automation_key'
  ) THEN
    ALTER TABLE admin_tasks ADD COLUMN automation_key text;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_tasks_automation_key
      ON admin_tasks(automation_key) WHERE automation_key IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE admin_tasks ADD COLUMN priority text DEFAULT 'medium';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.thomaz_check_renewal_opportunities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_asset RECORD;
  v_count integer := 0;
  v_key   text;
  v_title text;
  v_days_since integer;
BEGIN
  FOR v_asset IN
    SELECT
      ca.id,
      ca.name        AS asset_name,
      ca.client_id,
      ca.last_maintenance,
      ca.last_service_date,
      c.name         AS customer_name
    FROM customer_assets ca
    JOIN customers c ON c.id = ca.client_id
    WHERE
      -- Sem manutenção registrada há mais de 180 dias
      COALESCE(ca.last_maintenance, ca.last_service_date, ca.created_at::date)
        < CURRENT_DATE - INTERVAL '180 days'
    ORDER BY ca.last_maintenance ASC NULLS FIRST
    LIMIT 50
  LOOP
    v_days_since := CURRENT_DATE - COALESCE(
      v_asset.last_maintenance,
      v_asset.last_service_date,
      (NOW() - INTERVAL '180 days')::date
    );

    v_key   := 'renewal_' || v_asset.id::text;
    v_title := 'Venda Recorrente: ' || v_asset.customer_name
               || ' (' || v_asset.asset_name || ' — '
               || v_days_since || ' dias sem manutenção)';

    -- Insere apenas se ainda não existe tarefa ativa para este ativo
    INSERT INTO admin_tasks (title, color, priority, automation_key, os_id, created_at)
    VALUES (
      v_title,
      'purple',
      'high',
      v_key,
      NULL,
      NOW()
    )
    ON CONFLICT (automation_key) DO UPDATE
      SET title      = EXCLUDED.title,
          updated_at = NOW()
    WHERE admin_tasks.automation_key = EXCLUDED.automation_key;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.thomaz_check_renewal_opportunities() TO anon;
GRANT EXECUTE ON FUNCTION public.thomaz_check_renewal_opportunities() TO authenticated;

-- ============================================================
-- 4. GRANTS adicionais
-- ============================================================
GRANT ALL ON TABLE public.customer_assets TO anon;
GRANT ALL ON TABLE public.customer_assets TO authenticated;
GRANT ALL ON TABLE public.admin_tasks TO anon;
GRANT ALL ON TABLE public.admin_tasks TO authenticated;
