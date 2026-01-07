/*
  # Corrigir função de detecção de modo
  
  Ajustar para usar jsonb correto na conversation_history
*/

CREATE OR REPLACE FUNCTION thomaz_detect_mode_and_intent(
  user_message text,
  session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  detected_modes jsonb := '[]'::jsonb;
  best_mode text;
  detected_intent text;
  confidence numeric;
  mode_record record;
  max_score numeric := 0;
  current_score numeric;
BEGIN
  -- Analisar cada modo e calcular score
  FOR mode_record IN 
    SELECT * FROM thomaz_cognitive_modes WHERE active = true ORDER BY priority DESC
  LOOP
    current_score := 0;
    
    -- Verificar keywords (cada match = +1)
    FOR i IN 1..array_length(mode_record.trigger_keywords, 1) LOOP
      IF user_message ILIKE '%' || mode_record.trigger_keywords[i] || '%' THEN
        current_score := current_score + 1;
      END IF;
    END LOOP;
    
    -- Verificar patterns (cada match = +2, vale mais)
    FOR i IN 1..array_length(mode_record.trigger_patterns, 1) LOOP
      IF user_message ~ mode_record.trigger_patterns[i] THEN
        current_score := current_score + 2;
      END IF;
    END LOOP;
    
    -- Se teve algum match, adicionar aos candidatos
    IF current_score > 0 THEN
      detected_modes := detected_modes || jsonb_build_object(
        'mode', mode_record.mode_code,
        'mode_name', mode_record.mode_name,
        'score', current_score
      );
      
      -- Atualizar melhor modo
      IF current_score > max_score THEN
        max_score := current_score;
        best_mode := mode_record.mode_code;
      END IF;
    END IF;
  END LOOP;
  
  -- Se não detectou nenhum modo, usar STRATEGIC como padrão
  IF best_mode IS NULL THEN
    best_mode := 'STRATEGIC';
    confidence := 0.5;
    detected_intent := 'general_question';
  ELSE
    -- Calcular confiança (normalizar score)
    confidence := LEAST(0.95, 0.5 + (max_score * 0.15));
    
    -- Detectar intenção específica dentro do modo
    SELECT 
      intent_name
    INTO detected_intent
    FROM thomaz_intent_detection
    WHERE mode_code = best_mode
    AND active = true
    AND (
      -- Match por keyword
      EXISTS (
        SELECT 1 FROM unnest(keywords) k
        WHERE user_message ILIKE '%' || k || '%'
      )
      OR
      -- Match por pattern
      EXISTS (
        SELECT 1 FROM unnest(patterns) p
        WHERE user_message ~ p
      )
    )
    ORDER BY confidence_threshold DESC
    LIMIT 1;
    
    -- Se não encontrou intenção específica, usar genérica
    IF detected_intent IS NULL THEN
      detected_intent := best_mode || '_general';
    END IF;
  END IF;
  
  -- Salvar contexto se tiver session_id
  IF session_id IS NOT NULL THEN
    INSERT INTO thomaz_conversation_context (
      session_id,
      mode_code,
      detected_intent,
      confidence_score,
      conversation_history
    ) VALUES (
      session_id,
      best_mode,
      detected_intent,
      confidence,
      jsonb_build_object(
        'messages', jsonb_build_array(
          jsonb_build_object(
            'user_message', user_message,
            'mode_detected', best_mode,
            'timestamp', now()
          )
        )
      )
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
      transition_from = thomaz_conversation_context.mode_code,
      transition_reason = CASE 
        WHEN thomaz_conversation_context.mode_code != EXCLUDED.mode_code 
        THEN 'Mudança de contexto detectada'
        ELSE NULL
      END,
      mode_code = EXCLUDED.mode_code,
      detected_intent = EXCLUDED.detected_intent,
      confidence_score = EXCLUDED.confidence_score,
      conversation_history = jsonb_set(
        COALESCE(thomaz_conversation_context.conversation_history, '{}'::jsonb),
        '{messages}',
        COALESCE(thomaz_conversation_context.conversation_history->'messages', '[]'::jsonb) || 
        jsonb_build_array(
          jsonb_build_object(
            'user_message', user_message,
            'mode_detected', best_mode,
            'timestamp', now()
          )
        )
      ),
      updated_at = now();
  END IF;
  
  RETURN jsonb_build_object(
    'mode', best_mode,
    'intent', detected_intent,
    'confidence', confidence,
    'all_candidates', detected_modes,
    'explanation', 'Modo selecionado: ' || best_mode || ' com confiança de ' || (confidence * 100)::text || '%'
  );
END;
$$;

-- Grant
GRANT EXECUTE ON FUNCTION thomaz_detect_mode_and_intent TO anon, authenticated;
