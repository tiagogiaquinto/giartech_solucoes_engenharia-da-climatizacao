/*
  # Adicionar Relatório e Orientações às Propostas/OS
  
  1. Novos Campos
    - `relatorio_tecnico` (text) - Relatório técnico detalhado do serviço
    - `orientacoes_servico` (text) - Orientações e instruções para execução
    - `escopo_detalhado` (text) - Escopo detalhado do serviço (já pode existir)
  
  2. Objetivo
    - Incluir relatório técnico nas propostas
    - Adicionar orientações de serviço
    - Melhorar documentação dos serviços
    - Permitir ocultar valores (show_value já existe)
*/

-- Adicionar campos de relatório e orientações
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'relatorio_tecnico') THEN
    ALTER TABLE service_orders ADD COLUMN relatorio_tecnico text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'orientacoes_servico') THEN
    ALTER TABLE service_orders ADD COLUMN orientacoes_servico text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'escopo_detalhado') THEN
    ALTER TABLE service_orders ADD COLUMN escopo_detalhado text;
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN service_orders.relatorio_tecnico IS 'Relatório técnico detalhado do serviço executado ou a executar';
COMMENT ON COLUMN service_orders.orientacoes_servico IS 'Orientações e instruções para a equipe executar o serviço';
COMMENT ON COLUMN service_orders.escopo_detalhado IS 'Escopo detalhado de tudo que será executado no serviço';
COMMENT ON COLUMN service_orders.show_value IS 'Define se os valores serão exibidos no PDF (true=exibir, false=ocultar)';
