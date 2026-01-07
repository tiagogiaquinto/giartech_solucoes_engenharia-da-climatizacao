/*
  # Adicionar colunas de modo à tabela de contexto
  
  1. Alterações
    - Adicionar mode_code
    - Adicionar detected_intent
    - Adicionar confidence_score
    - Adicionar transition_from
    - Adicionar transition_reason
*/

-- Adicionar colunas de modo se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'thomaz_conversation_context' AND column_name = 'mode_code'
  ) THEN
    ALTER TABLE thomaz_conversation_context
    ADD COLUMN mode_code text,
    ADD COLUMN detected_intent text,
    ADD COLUMN confidence_score numeric(3,2),
    ADD COLUMN transition_from text,
    ADD COLUMN transition_reason text,
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Criar índice na session_id se não existir
CREATE INDEX IF NOT EXISTS idx_thomaz_conv_ctx_session 
ON thomaz_conversation_context(session_id);
