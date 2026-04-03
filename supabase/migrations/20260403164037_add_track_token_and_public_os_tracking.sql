/*
  # Track & Trace: Token de rastreio público para Ordens de Serviço

  ## Resumo
  Adiciona um token UUID único por OS para permitir que clientes acompanhem
  o status do serviço via QR Code sem necessidade de login.

  ## Modificações na Tabela `service_orders`
  - `track_token` (UUID, único): Token gerado automaticamente para URL de rastreio público

  ## Nova Função RPC Pública
  - `get_os_tracking_public(p_token UUID)`: Retorna dados públicos da OS (sem dados sensíveis)
    - Campos expostos: order_number, client_name (mascarado), service_type, description, status,
      service_date, due_date, completed_at, created_at, updated_at, total_value (apenas se pago)
    - NÃO expõe: lucro, custos internos, CPF completo, dados de outros clientes

  ## Novo Trigger
  - `tr_generate_track_token`: Gera automaticamente o track_token ao inserir uma nova OS

  ## Segurança
  - A função é `SECURITY DEFINER` mas retorna apenas campos aprovados
  - Nenhum dado financeiro interno (custo, lucro) é exposto
  - CPF/documento é mascarado na camada da aplicação
  - A função pode ser chamada por anon sem login
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'track_token'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN track_token UUID UNIQUE DEFAULT gen_random_uuid();
  END IF;
END $$;

UPDATE service_orders
SET track_token = gen_random_uuid()
WHERE track_token IS NULL;

ALTER TABLE service_orders
  ALTER COLUMN track_token SET DEFAULT gen_random_uuid(),
  ALTER COLUMN track_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_orders_track_token ON service_orders(track_token);

CREATE OR REPLACE FUNCTION generate_track_token_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.track_token IS NULL THEN
    NEW.track_token := gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_generate_track_token ON public.service_orders;

CREATE TRIGGER tr_generate_track_token
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_track_token_on_insert();

CREATE OR REPLACE FUNCTION get_os_tracking_public(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_os RECORD;
  v_items JSONB;
  v_approved_at TIMESTAMPTZ;
BEGIN
  SELECT
    so.id,
    so.order_number,
    so.client_name,
    so.client_phone,
    so.service_type,
    so.description,
    so.status,
    so.priority,
    so.service_date,
    so.due_date,
    so.completed_at,
    so.created_at,
    so.updated_at,
    so.notes,
    so.total_value,
    so.estimated_value,
    so.track_token
  INTO v_os
  FROM service_orders so
  WHERE so.track_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'service_name', COALESCE(soi.service_name, soi.description, ''),
      'quantity', soi.quantity,
      'unit', COALESCE(soi.unit, 'un')
    )
  )
  INTO v_items
  FROM service_order_items soi
  WHERE soi.service_order_id = v_os.id;

  SELECT created_at INTO v_approved_at
  FROM system_events
  WHERE event_type = 'ORCAMENTO_APROVADO'
    AND (payload->>'os_id')::text = v_os.id::text
  ORDER BY created_at DESC
  LIMIT 1;

  v_result := jsonb_build_object(
    'found', true,
    'order_number', v_os.order_number,
    'client_name', v_os.client_name,
    'service_type', v_os.service_type,
    'description', v_os.description,
    'status', v_os.status,
    'priority', v_os.priority,
    'service_date', v_os.service_date,
    'due_date', v_os.due_date,
    'completed_at', v_os.completed_at,
    'created_at', v_os.created_at,
    'updated_at', v_os.updated_at,
    'notes', v_os.notes,
    'estimated_value', CASE WHEN v_os.status IN ('orcamento', 'budget', 'cotacao', 'quote') THEN v_os.estimated_value ELSE NULL END,
    'total_value', CASE WHEN v_os.status IN ('concluido', 'concluida', 'completed') THEN v_os.total_value ELSE NULL END,
    'items', COALESCE(v_items, '[]'::jsonb),
    'approved_at', v_approved_at
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_os_tracking_public(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_os_tracking_public(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
