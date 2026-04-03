/*
  # Portal do Cliente: Histórico de Manutenções, Garantias e Endereços

  ## Resumo
  Cria funções RPC para o portal do cliente exibir:
  1. Histórico completo de serviços realizados por OS, com itens executados
  2. Garantia de cada OS (prazo, tipo, data de vencimento, status)
  3. Endereços de serviço vinculados a cada OS do cliente

  ## Novas funções RPC
  - `get_customer_portal_order_detail` - detalhe completo de uma OS
  - `get_customer_portal_history` - histórico completo de manutenções agrupado
  - `get_customer_portal_addresses` - endereços de serviço do cliente
*/

-- ================================================================
-- 1. Histórico completo de manutenções por OS
-- ================================================================
CREATE OR REPLACE FUNCTION get_customer_portal_history(p_customer_id uuid)
RETURNS TABLE (
  os_id              uuid,
  order_number       text,
  title              text,
  service_type       text,
  status             text,
  created_at         timestamptz,
  scheduled_at       timestamptz,
  completed_at       timestamptz,
  technician_name    text,
  total_value        numeric,
  warranty_period    integer,
  warranty_type      text,
  warranty_end_date  date,
  warranty_status    text,
  relatorio_tecnico  text,
  services_performed jsonb,
  address_label      text,
  address_full       text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id                                                          AS os_id,
    so.order_number,
    COALESCE(so.title, so.service_type, 'Serviço')::text          AS title,
    COALESCE(so.service_type, '')::text                           AS service_type,
    so.status,
    so.created_at,
    so.scheduled_at,
    so.completed_at,
    COALESCE(so.assigned_technician_name, '')::text               AS technician_name,
    COALESCE(so.total_value, 0)                                   AS total_value,
    so.warranty_period,
    COALESCE(so.warranty_type, '')::text                          AS warranty_type,
    so.warranty_end_date,
    CASE
      WHEN so.warranty_end_date IS NULL THEN 'sem_garantia'
      WHEN so.warranty_end_date < CURRENT_DATE THEN 'vencida'
      WHEN so.warranty_end_date <= CURRENT_DATE + interval '30 days' THEN 'vencendo'
      ELSE 'vigente'
    END::text                                                      AS warranty_status,
    COALESCE(so.relatorio_tecnico, '')::text                      AS relatorio_tecnico,
    -- itens de serviço executados
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',          soi.id,
        'name',        COALESCE(soi.service_name, soi.descricao, ''),
        'description', COALESCE(soi.service_description, soi.escopo_detalhado, ''),
        'quantity',    COALESCE(soi.quantity, soi.quantidade, 1),
        'unit',        COALESCE(soi.unit, ''),
        'completed',   COALESCE(soi.completed, false),
        'completed_at', soi.completed_at
      ))
      FROM service_order_items soi
      WHERE soi.service_order_id = so.id
    ), '[]'::jsonb)                                               AS services_performed,
    -- endereço principal da OS
    COALESCE(soa.label, '')::text                                 AS address_label,
    COALESCE(
      NULLIF(trim(
        CONCAT_WS(', ',
          NULLIF(trim(COALESCE(soa.logradouro,'')), ''),
          NULLIF(trim(COALESCE(soa.numero,'')), ''),
          NULLIF(trim(COALESCE(soa.bairro,'')), ''),
          NULLIF(trim(COALESCE(soa.cidade,'')), ''),
          NULLIF(trim(COALESCE(soa.estado,'')), '')
        )
      ), ''),
      -- fallback para campos diretos da OS
      NULLIF(trim(
        CONCAT_WS(', ',
          NULLIF(trim(COALESCE(so.client_address,'')), ''),
          NULLIF(trim(COALESCE(so.client_city,'')), ''),
          NULLIF(trim(COALESCE(so.client_state,'')), '')
        )
      ), ''),
      ''
    )::text                                                        AS address_full
  FROM service_orders so
  LEFT JOIN service_order_addresses soa
    ON soa.service_order_id = so.id AND soa.is_primary = true
  WHERE so.customer_id = p_customer_id
  ORDER BY so.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_portal_history(uuid) TO anon, authenticated;

-- ================================================================
-- 2. Endereços de serviço únicos do cliente
-- ================================================================
CREATE OR REPLACE FUNCTION get_customer_portal_addresses(p_customer_id uuid)
RETURNS TABLE (
  address_full   text,
  label          text,
  os_count       bigint,
  last_service   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH os_addresses AS (
    -- endereços da tabela service_order_addresses
    SELECT
      trim(
        CONCAT_WS(', ',
          NULLIF(trim(COALESCE(soa.logradouro,'')), ''),
          NULLIF(trim(COALESCE(soa.numero,'')), ''),
          NULLIF(trim(COALESCE(soa.bairro,'')), ''),
          NULLIF(trim(COALESCE(soa.cidade,'')), ''),
          NULLIF(trim(COALESCE(soa.estado,'')), '')
        )
      )                         AS addr,
      COALESCE(soa.label, '')   AS lbl,
      so.created_at
    FROM service_orders so
    JOIN service_order_addresses soa ON soa.service_order_id = so.id
    WHERE so.customer_id = p_customer_id
      AND soa.logradouro IS NOT NULL AND trim(soa.logradouro) <> ''

    UNION ALL

    -- endereços diretos na OS
    SELECT
      trim(
        CONCAT_WS(', ',
          NULLIF(trim(COALESCE(so.client_address,'')), ''),
          NULLIF(trim(COALESCE(so.client_city,'')), ''),
          NULLIF(trim(COALESCE(so.client_state,'')), '')
        )
      )       AS addr,
      ''      AS lbl,
      so.created_at
    FROM service_orders so
    WHERE so.customer_id = p_customer_id
      AND so.client_address IS NOT NULL AND trim(so.client_address) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM service_order_addresses soa2
        WHERE soa2.service_order_id = so.id
      )
  )
  SELECT
    addr::text            AS address_full,
    MAX(lbl)::text        AS label,
    COUNT(*)              AS os_count,
    MAX(created_at)       AS last_service
  FROM os_addresses
  WHERE addr IS NOT NULL AND addr <> ''
  GROUP BY addr
  ORDER BY MAX(created_at) DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_portal_addresses(uuid) TO anon, authenticated;

-- ================================================================
-- 3. Detalhe de uma OS específica para o cliente
-- ================================================================
CREATE OR REPLACE FUNCTION get_customer_portal_order_detail(
  p_customer_id uuid,
  p_order_id    uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so  service_orders%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_so
  FROM service_orders
  WHERE id = p_order_id AND customer_id = p_customer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT jsonb_build_object(
    'found',             true,
    'id',                v_so.id,
    'order_number',      v_so.order_number,
    'title',             COALESCE(v_so.title, v_so.service_type, 'Serviço'),
    'description',       COALESCE(v_so.description, ''),
    'service_type',      COALESCE(v_so.service_type, ''),
    'status',            v_so.status,
    'priority',          COALESCE(v_so.priority, 'normal'),
    'created_at',        v_so.created_at,
    'scheduled_at',      v_so.scheduled_at,
    'completed_at',      v_so.completed_at,
    'total_value',       COALESCE(v_so.total_value, 0),
    'technician_name',   COALESCE(v_so.assigned_technician_name, ''),
    'warranty_period',   v_so.warranty_period,
    'warranty_type',     COALESCE(v_so.warranty_type, ''),
    'warranty_end_date', v_so.warranty_end_date,
    'warranty_terms',    COALESCE(v_so.warranty_terms, ''),
    'warranty_status',   CASE
      WHEN v_so.warranty_end_date IS NULL THEN 'sem_garantia'
      WHEN v_so.warranty_end_date < CURRENT_DATE THEN 'vencida'
      WHEN v_so.warranty_end_date <= CURRENT_DATE + interval '30 days' THEN 'vencendo'
      ELSE 'vigente'
    END,
    'relatorio_tecnico',     COALESCE(v_so.relatorio_tecnico, ''),
    'orientacoes_servico',   COALESCE(v_so.orientacoes_servico, ''),
    'payment_method',        COALESCE(v_so.payment_method, ''),
    'payment_status',        COALESCE(v_so.payment_status, ''),
    'track_token',           COALESCE(v_so.track_token, ''),
    -- itens executados
    'items', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',          soi.id,
        'name',        COALESCE(soi.service_name, soi.descricao, ''),
        'description', COALESCE(soi.service_description, soi.escopo_detalhado, ''),
        'quantity',    COALESCE(soi.quantity, soi.quantidade, 1),
        'unit',        COALESCE(soi.unit, ''),
        'unit_price',  COALESCE(soi.unit_price, soi.preco_unitario, 0),
        'total_price', COALESCE(soi.total_price, soi.preco_total, 0),
        'completed',   COALESCE(soi.completed, false),
        'completed_at', soi.completed_at,
        'warranty_info', COALESCE(soi.warranty_info, '')
      )), '[]'::jsonb)
      FROM service_order_items soi
      WHERE soi.service_order_id = v_so.id
    ),
    -- endereços da OS
    'addresses', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',          soa.id,
        'label',       COALESCE(soa.label, ''),
        'logradouro',  COALESCE(soa.logradouro, ''),
        'numero',      COALESCE(soa.numero, ''),
        'complemento', COALESCE(soa.complemento, ''),
        'bairro',      COALESCE(soa.bairro, ''),
        'cidade',      COALESCE(soa.cidade, ''),
        'estado',      COALESCE(soa.estado, ''),
        'cep',         COALESCE(soa.cep, ''),
        'referencia',  COALESCE(soa.referencia, ''),
        'is_primary',  COALESCE(soa.is_primary, false)
      ) ORDER BY soa.is_primary DESC), '[]'::jsonb)
      FROM service_order_addresses soa
      WHERE soa.service_order_id = v_so.id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_portal_order_detail(uuid, uuid) TO anon, authenticated;
