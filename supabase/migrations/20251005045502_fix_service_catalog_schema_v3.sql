/*
  # Correção e Unificação do Schema de Catálogo de Serviços
  
  ## Problema Identificado
  - service_catalog é uma VIEW, não uma tabela
  - catalog_services usa campos em português
  - Frontend espera usar service_catalog como tabela
  
  ## Solução
  1. Remover view se existir
  2. Criar tabela service_catalog completa
  3. Migrar dados de catalog_services
  4. Manter catalog_services como fallback
*/

-- Drop view se existir
DROP VIEW IF EXISTS service_catalog CASCADE;

-- Criar tabela service_catalog
CREATE TABLE IF NOT EXISTS service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados principais
  nome text NOT NULL,
  descricao text,
  categoria text,
  
  -- Preços e custos
  preco_base numeric DEFAULT 0,
  custo_materiais numeric DEFAULT 0,
  custo_mao_obra numeric DEFAULT 0,
  custo_total numeric DEFAULT 0,
  preco_sugerido numeric DEFAULT 0,
  margem_lucro numeric DEFAULT 0,
  
  -- Tempo
  tempo_estimado_minutos integer DEFAULT 0,
  
  -- Observações
  observacoes text,
  
  -- Status
  ativo boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrar dados de catalog_services
INSERT INTO service_catalog (id, nome, descricao, categoria, preco_base, tempo_estimado_minutos, margem_lucro, observacoes, ativo, created_at)
SELECT 
  id,
  nome,
  descricao,
  'outros' as categoria,
  COALESCE(preco, 0),
  COALESCE(tempo_estimado_minutos, 0),
  COALESCE(margem_lucro, 0),
  observacoes,
  COALESCE(ativo, true),
  now()
FROM catalog_services
WHERE NOT EXISTS (SELECT 1 FROM service_catalog WHERE service_catalog.id = catalog_services.id)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;

-- Drop policies antigas
DROP POLICY IF EXISTS "Permitir leitura de serviços ativos" ON service_catalog;
DROP POLICY IF EXISTS "Permitir leitura de serviços" ON service_catalog;
DROP POLICY IF EXISTS "Permitir inserção para autenticados" ON service_catalog;
DROP POLICY IF EXISTS "Permitir atualização para autenticados" ON service_catalog;
DROP POLICY IF EXISTS "Permitir exclusão para autenticados" ON service_catalog;

-- Criar policies permissivas (sem RLS restritivo)
CREATE POLICY "Acesso total service_catalog"
  ON service_catalog
  USING (true)
  WITH CHECK (true);

-- Ajustar foreign keys
DO $$
BEGIN
  -- service_catalog_materials
  ALTER TABLE service_catalog_materials DROP CONSTRAINT IF EXISTS service_catalog_materials_service_catalog_id_fkey;
  ALTER TABLE service_catalog_materials
  ADD CONSTRAINT service_catalog_materials_service_catalog_id_fkey
  FOREIGN KEY (service_catalog_id) REFERENCES service_catalog(id) ON DELETE CASCADE;
  
  -- service_catalog_labor
  ALTER TABLE service_catalog_labor DROP CONSTRAINT IF EXISTS service_catalog_labor_service_catalog_id_fkey;
  ALTER TABLE service_catalog_labor
  ADD CONSTRAINT service_catalog_labor_service_catalog_id_fkey
  FOREIGN KEY (service_catalog_id) REFERENCES service_catalog(id) ON DELETE CASCADE;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_service_catalog_categoria ON service_catalog(categoria);
CREATE INDEX IF NOT EXISTS idx_service_catalog_ativo ON service_catalog(ativo);
CREATE INDEX IF NOT EXISTS idx_service_catalog_nome ON service_catalog(nome);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_service_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_catalog_updated_at ON service_catalog;
CREATE TRIGGER service_catalog_updated_at
  BEFORE UPDATE ON service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_service_catalog_updated_at();

-- Inserir serviços de exemplo
INSERT INTO service_catalog (nome, descricao, categoria, preco_base, tempo_estimado_minutos, ativo) VALUES
('Instalação de Ar Condicionado Split 9k BTU', 'Instalação completa com tubulação até 3 metros', 'instalacao', 300, 120, true),
('Instalação de Ar Condicionado Split 12k BTU', 'Instalação completa com tubulação até 5 metros', 'instalacao', 350, 150, true),
('Instalação de Ar Condicionado Split 18k BTU', 'Instalação completa com tubulação até 7 metros', 'instalacao', 450, 180, true),
('Manutenção Preventiva AC Split', 'Limpeza, revisão e verificação geral', 'manutencao', 120, 60, true),
('Recarga de Gás R410A', 'Recarga completa do sistema', 'reparo', 150, 45, true),
('Limpeza Completa', 'Limpeza profunda das unidades', 'limpeza', 100, 90, true)
ON CONFLICT (id) DO NOTHING;
