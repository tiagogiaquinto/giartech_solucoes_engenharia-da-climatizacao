/*
  # Fix: Mapear Severity Corretamente
  
  1. Problema
    - Campo severity aceita: info, warning, critical
    - Estávamos passando: saudavel, atencao, critico
    
  2. Solução
    - Mapear corretamente na função upsert_thomaz_alert
    - critico -> critical
    - atencao -> warning
    - saudavel -> info
*/

CREATE OR REPLACE FUNCTION upsert_thomaz_alert(
  p_area text,
  p_titulo text,
  p_nivel_risco text,
  p_mensagem_humana text,
  p_explicacao_tecnica text,
  p_evidencias jsonb,
  p_sugestoes jsonb,
  p_dados_contexto jsonb,
  p_prioridade integer,
  p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id uuid;
  v_existing_id uuid;
  v_severity text;
BEGIN
  v_severity := CASE p_nivel_risco
    WHEN 'critico' THEN 'critical'
    WHEN 'atencao' THEN 'warning'
    WHEN 'saudavel' THEN 'info'
    ELSE 'warning'
  END;
  
  SELECT id INTO v_existing_id
  FROM thomaz_alerts
  WHERE area = p_area
    AND title = p_titulo
    AND status IN ('novo', 'visto')
  LIMIT 1;
  
  IF v_existing_id IS NOT NULL THEN
    UPDATE thomaz_alerts
    SET nivel_risco = p_nivel_risco,
        severity = v_severity,
        mensagem_humana = p_mensagem_humana,
        description = p_mensagem_humana,
        explicacao_tecnica = p_explicacao_tecnica,
        evidencias = p_evidencias,
        sugestoes = p_sugestoes,
        dados_contexto = p_dados_contexto,
        data_snapshot = p_evidencias,
        prioridade = p_prioridade,
        expires_at = p_expires_at,
        created_at = now(),
        is_active = true
    WHERE id = v_existing_id;
    
    RETURN v_existing_id;
  ELSE
    INSERT INTO thomaz_alerts (
      area, title, nivel_risco, severity, mensagem_humana, description,
      explicacao_tecnica, evidencias, sugestoes, dados_contexto,
      data_snapshot, prioridade, expires_at, status, is_active,
      alert_type, affected_area
    ) VALUES (
      p_area, p_titulo, p_nivel_risco, v_severity, p_mensagem_humana, p_mensagem_humana,
      p_explicacao_tecnica, p_evidencias, p_sugestoes, p_dados_contexto,
      p_evidencias, p_prioridade, p_expires_at, 'novo', true,
      p_area, p_area
    )
    RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_thomaz_alert TO anon, authenticated;
