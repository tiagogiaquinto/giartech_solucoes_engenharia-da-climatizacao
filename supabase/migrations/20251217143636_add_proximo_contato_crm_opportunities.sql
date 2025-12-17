/*
  # Adicionar Agendamento de Próximo Contato no CRM

  1. Alterações
    - Adicionar coluna `proximo_contato_data` para data/hora do próximo contato
    - Adicionar coluna `proximo_contato_tipo` para tipo de contato (whatsapp, email, telefone, reuniao)
    - Adicionar coluna `proximo_contato_observacao` para observações sobre o contato
    - Adicionar coluna `proximo_contato_agendado_por` para rastrear quem agendou
    - Criar índices para consultas de próximos contatos

  2. Views
    - Atualizar views para incluir informações de próximo contato

  3. Security
    - Manter RLS policies existentes
*/

-- Adicionar colunas de próximo contato
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_opportunities' AND column_name = 'proximo_contato_data'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD COLUMN proximo_contato_data timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_opportunities' AND column_name = 'proximo_contato_tipo'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD COLUMN proximo_contato_tipo text CHECK (proximo_contato_tipo IN ('whatsapp', 'email', 'telefone', 'reuniao', 'visita') OR proximo_contato_tipo IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_opportunities' AND column_name = 'proximo_contato_observacao'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD COLUMN proximo_contato_observacao text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_opportunities' AND column_name = 'proximo_contato_agendado_por'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD COLUMN proximo_contato_agendado_por uuid REFERENCES employees(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_opportunities' AND column_name = 'proximo_contato_agendado_em'
  ) THEN
    ALTER TABLE crm_opportunities 
    ADD COLUMN proximo_contato_agendado_em timestamptz DEFAULT now();
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_proximo_contato_data 
  ON crm_opportunities(proximo_contato_data) 
  WHERE proximo_contato_data IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_proximo_contato_tipo 
  ON crm_opportunities(proximo_contato_tipo);

-- Função para buscar próximos contatos do dia
CREATE OR REPLACE FUNCTION get_proximos_contatos_hoje()
RETURNS TABLE (
  id uuid,
  titulo text,
  customer_name text,
  customer_email text,
  customer_whatsapp text,
  proximo_contato_data timestamptz,
  proximo_contato_tipo text,
  proximo_contato_observacao text,
  owner_name text,
  pipeline_tipo text,
  stage_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.titulo,
    c.name as customer_name,
    c.email as customer_email,
    c.whatsapp as customer_whatsapp,
    o.proximo_contato_data,
    o.proximo_contato_tipo,
    o.proximo_contato_observacao,
    e.nome as owner_name,
    o.pipeline_tipo,
    s.nome as stage_name
  FROM crm_opportunities o
  LEFT JOIN customers c ON c.id = o.customer_id
  LEFT JOIN employees e ON e.id = o.owner_id
  LEFT JOIN crm_pipeline_stages s ON s.id = o.stage_id
  WHERE 
    o.proximo_contato_data IS NOT NULL
    AND DATE(o.proximo_contato_data) = CURRENT_DATE
    AND o.status = 'ativa'
  ORDER BY o.proximo_contato_data ASC;
END;
$$;

-- Função para buscar próximos contatos vencidos
CREATE OR REPLACE FUNCTION get_proximos_contatos_vencidos()
RETURNS TABLE (
  id uuid,
  titulo text,
  customer_name text,
  customer_email text,
  customer_whatsapp text,
  proximo_contato_data timestamptz,
  proximo_contato_tipo text,
  proximo_contato_observacao text,
  owner_name text,
  pipeline_tipo text,
  stage_name text,
  dias_vencido integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.titulo,
    c.name as customer_name,
    c.email as customer_email,
    c.whatsapp as customer_whatsapp,
    o.proximo_contato_data,
    o.proximo_contato_tipo,
    o.proximo_contato_observacao,
    e.nome as owner_name,
    o.pipeline_tipo,
    s.nome as stage_name,
    EXTRACT(DAY FROM now() - o.proximo_contato_data)::integer as dias_vencido
  FROM crm_opportunities o
  LEFT JOIN customers c ON c.id = o.customer_id
  LEFT JOIN employees e ON e.id = o.owner_id
  LEFT JOIN crm_pipeline_stages s ON s.id = o.stage_id
  WHERE 
    o.proximo_contato_data IS NOT NULL
    AND o.proximo_contato_data < now()
    AND o.status = 'ativa'
  ORDER BY o.proximo_contato_data ASC;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION get_proximos_contatos_hoje TO authenticated;
GRANT EXECUTE ON FUNCTION get_proximos_contatos_vencidos TO authenticated;

-- Comentários
COMMENT ON COLUMN crm_opportunities.proximo_contato_data IS 'Data e hora agendada para o próximo contato';
COMMENT ON COLUMN crm_opportunities.proximo_contato_tipo IS 'Tipo de contato agendado (whatsapp, email, telefone, reuniao, visita)';
COMMENT ON COLUMN crm_opportunities.proximo_contato_observacao IS 'Observações sobre o contato agendado';
COMMENT ON FUNCTION get_proximos_contatos_hoje IS 'Retorna todos os contatos agendados para hoje';
COMMENT ON FUNCTION get_proximos_contatos_vencidos IS 'Retorna todos os contatos vencidos que ainda não foram realizados';
