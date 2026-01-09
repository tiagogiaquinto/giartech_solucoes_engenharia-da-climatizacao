/*
  # Corrigir valores padrão para lead_capture_campaigns
  
  1. Adicionar valores default para campos obrigatórios
  2. Permitir que status tenha um valor padrão
  3. Facilitar criação de campanhas
*/

-- Adicionar valores padrão para campos obrigatórios
ALTER TABLE lead_capture_campaigns 
  ALTER COLUMN status SET DEFAULT 'ativo';

-- Garantir que todos os campos necessários têm defaults adequados
ALTER TABLE lead_capture_campaigns 
  ALTER COLUMN filters SET DEFAULT '{}'::jsonb;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_status ON lead_capture_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_search_type ON lead_capture_campaigns(search_type);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_is_active ON lead_capture_campaigns(is_active);