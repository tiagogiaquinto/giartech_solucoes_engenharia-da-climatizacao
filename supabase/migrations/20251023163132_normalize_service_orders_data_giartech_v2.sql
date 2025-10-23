/*
  # Normalizar Dados de Service Orders para Padrão Giartech

  1. Normalização de Campos de Texto
    - Sincroniza title e description
    - Define valores padrão profissionais para campos vazios
    - Garante equipment, brand, model preenchidos

  2. Normalização de Campos Numéricos
    - Define valores zero para custos e descontos não preenchidos
    - Sincroniza campos duplicados

  3. Textos Padrão Profissionais
    - additional_info, relatorio_tecnico, orientacoes_servico
    - escopo_detalhado quando não especificado
*/

-- PARTE 1: Normalizar service_orders

-- Sincronizar title e description
UPDATE service_orders
SET title = description
WHERE (title IS NULL OR title = '')
  AND description IS NOT NULL 
  AND description != '';

UPDATE service_orders
SET description = title
WHERE (description IS NULL OR description = '')
  AND title IS NOT NULL 
  AND title != '';

-- Definir prazo padrão
UPDATE service_orders
SET prazo_execucao_dias = 15
WHERE prazo_execucao_dias IS NULL OR prazo_execucao_dias = 0;

-- Definir equipment padrão
UPDATE service_orders
SET equipment = 'Equipamentos Diversos'
WHERE equipment IS NULL OR equipment = '';

-- Garantir brand e model como strings vazias
UPDATE service_orders
SET 
  brand = COALESCE(brand, ''),
  model = COALESCE(model, '');

-- Preencher additional_info
UPDATE service_orders
SET additional_info = 'Trabalhamos para que seus projetos se tornem realidade. Estamos à disposição para quaisquer esclarecimentos.'
WHERE additional_info IS NULL OR additional_info = '';

-- Preencher relatorio_tecnico
UPDATE service_orders
SET relatorio_tecnico = 'Relatório técnico será fornecido após conclusão dos serviços.'
WHERE relatorio_tecnico IS NULL OR relatorio_tecnico = '';

-- Preencher orientacoes_servico
UPDATE service_orders
SET orientacoes_servico = 'Seguir as orientações técnicas fornecidas pela equipe. Manter área de trabalho limpa e organizada.'
WHERE orientacoes_servico IS NULL OR orientacoes_servico = '';

-- Preencher escopo_detalhado
UPDATE service_orders
SET escopo_detalhado = COALESCE(description, 'Execução dos serviços conforme especificações técnicas.')
WHERE escopo_detalhado IS NULL OR escopo_detalhado = '';

-- Garantir valores numéricos zerados para descontos
UPDATE service_orders
SET 
  desconto_percentual = COALESCE(desconto_percentual, 0),
  desconto_valor = COALESCE(desconto_valor, 0),
  discount_amount = COALESCE(discount_amount, 0);

-- Garantir valores de custos zerados
UPDATE service_orders
SET 
  custo_combustivel = COALESCE(custo_combustivel, 0),
  custo_insumos = COALESCE(custo_insumos, 0),
  custo_materiais = COALESCE(custo_materiais, 0),
  custo_total = COALESCE(custo_total, 0),
  custo_total_mao_obra = COALESCE(custo_total_mao_obra, 0),
  custo_total_materiais = COALESCE(custo_total_materiais, 0),
  material_total_cost = COALESCE(material_total_cost, 0),
  total_additional_costs = COALESCE(total_additional_costs, 0),
  total_cost = COALESCE(total_cost, 0);