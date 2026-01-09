/*
  # Views e Funções do Sistema de Leads - v2

  1. Views com colunas corretas
  2. Funções auxiliares
*/

-- VIEWS
CREATE OR REPLACE VIEW v_lead_capture_metrics AS
SELECT
  COUNT(*) FILTER (WHERE status = 'novo') as leads_novos,
  COUNT(*) FILTER (WHERE status = 'contatado') as leads_contatados,
  COUNT(*) FILTER (WHERE status = 'qualificado') as leads_qualificados,
  COUNT(*) FILTER (WHERE status = 'convertido') as leads_convertidos,
  COUNT(*) FILTER (WHERE status = 'descartado') as leads_descartados,
  COUNT(*) as total_leads,
  COUNT(DISTINCT campaign_id) as total_campanhas,
  COUNT(*) FILTER (WHERE captured_at >= CURRENT_DATE - INTERVAL '30 days') as leads_ultimo_mes,
  COUNT(*) FILTER (WHERE captured_at >= CURRENT_DATE - INTERVAL '7 days') as leads_ultima_semana,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'convertido')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status != 'novo'), 0) * 100), 2
  ) as taxa_conversao
FROM captured_leads;

CREATE OR REPLACE VIEW v_leads_by_status AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE priority = 'alta') as alta_prioridade,
  COUNT(*) FILTER (WHERE priority = 'média') as media_prioridade,
  COUNT(*) FILTER (WHERE priority = 'baixa') as baixa_prioridade,
  MAX(captured_at) as ultimo_lead
FROM captured_leads
GROUP BY status;

CREATE OR REPLACE VIEW v_campaign_performance AS
SELECT
  c.id,
  c.name,
  c.status as campaign_status,
  c.search_type,
  c.total_leads_captured,
  COUNT(l.id) as leads_atuais,
  COUNT(l.id) FILTER (WHERE l.status = 'convertido') as conversoes,
  COUNT(l.id) FILTER (WHERE l.status = 'qualificado') as qualificados,
  ROUND(
    (COUNT(l.id) FILTER (WHERE l.status = 'convertido')::numeric /
    NULLIF(COUNT(l.id), 0) * 100), 2
  ) as taxa_conversao,
  c.last_capture_at,
  c.created_at
FROM lead_capture_campaigns c
LEFT JOIN captured_leads l ON l.campaign_id = c.id
GROUP BY c.id, c.name, c.status, c.search_type, c.total_leads_captured, c.last_capture_at, c.created_at;

-- FUNÇÕES
CREATE OR REPLACE FUNCTION convert_lead_to_customer(
  p_lead_id uuid,
  p_converted_by uuid
)
RETURNS uuid AS $$
DECLARE
  v_lead captured_leads;
  v_customer_id uuid;
BEGIN
  SELECT * INTO v_lead FROM captured_leads WHERE id = p_lead_id;

  IF v_lead IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  INSERT INTO customers (
    nome,
    email,
    telefone,
    whatsapp,
    cnpj,
    endereco,
    cidade,
    estado,
    cep,
    tipo,
    tags,
    observacoes,
    created_at
  ) VALUES (
    v_lead.company_name,
    v_lead.email,
    v_lead.phone,
    v_lead.whatsapp,
    v_lead.cnpj,
    v_lead.address,
    v_lead.city,
    v_lead.state,
    v_lead.cep,
    'Jurídica',
    v_lead.tags,
    'Convertido de lead #' || v_lead.id || E'\n' || COALESCE(v_lead.notes, ''),
    now()
  ) RETURNING id INTO v_customer_id;

  UPDATE captured_leads
  SET status = 'convertido',
      converted_to_customer_id = v_customer_id,
      updated_at = now()
  WHERE id = p_lead_id;

  INSERT INTO lead_activities (
    lead_id,
    activity_type,
    description,
    outcome,
    performed_by,
    performed_at
  ) VALUES (
    p_lead_id,
    'anotação',
    'Lead convertido em cliente',
    'sucesso',
    p_converted_by,
    now()
  );

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION convert_lead_to_customer TO authenticated, anon;

CREATE OR REPLACE FUNCTION get_lead_statistics(
  p_campaign_id uuid DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_leads bigint,
  novos bigint,
  contatados bigint,
  qualificados bigint,
  convertidos bigint,
  descartados bigint,
  taxa_conversao numeric,
  media_dias_conversao numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_leads,
    COUNT(*) FILTER (WHERE status = 'novo')::bigint as novos,
    COUNT(*) FILTER (WHERE status = 'contatado')::bigint as contatados,
    COUNT(*) FILTER (WHERE status = 'qualificado')::bigint as qualificados,
    COUNT(*) FILTER (WHERE status = 'convertido')::bigint as convertidos,
    COUNT(*) FILTER (WHERE status = 'descartado')::bigint as descartados,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'convertido')::numeric /
      NULLIF(COUNT(*), 0) * 100), 2
    ) as taxa_conversao,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (updated_at - captured_at)) / 86400)
      FILTER (WHERE status = 'convertido'), 2
    ) as media_dias_conversao
  FROM captured_leads
  WHERE (p_campaign_id IS NULL OR campaign_id = p_campaign_id)
    AND (p_date_from IS NULL OR captured_at >= p_date_from)
    AND (p_date_to IS NULL OR captured_at <= p_date_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_lead_statistics TO authenticated, anon;