/*
  # Normalizar Service Order Items - Versão Final

  1. Preencher descricao usando catalog quando disponível
  2. Preencher escopo_detalhado com textos profissionais
  3. Sincronizar campos português/inglês
  4. Garantir valores numéricos zerados

  Nota: Triggers foram corrigidos e funcionam corretamente
*/

-- PARTE 1: Preencher descricao usando service_catalog
UPDATE service_order_items soi
SET descricao = COALESCE(
  soi.descricao,
  soi.notes,
  sc.name,
  'Serviço Técnico'
)
FROM service_catalog sc
WHERE soi.service_catalog_id = sc.id
  AND (soi.descricao IS NULL OR soi.descricao = '');

-- Preencher descricao para items sem catalog
UPDATE service_order_items
SET descricao = COALESCE(descricao, notes, 'Serviço Técnico')
WHERE (descricao IS NULL OR descricao = '');

-- PARTE 2: Preencher escopo_detalhado
UPDATE service_order_items
SET escopo_detalhado = CASE
  WHEN escopo_detalhado IS NOT NULL AND escopo_detalhado != '' THEN escopo_detalhado
  WHEN notes IS NOT NULL AND notes != '' THEN notes
  WHEN descricao IS NOT NULL AND descricao != '' THEN descricao || ' - Execução conforme especificações técnicas.'
  ELSE 'Execução conforme especificações técnicas e normas vigentes.'
END
WHERE escopo_detalhado IS NULL OR escopo_detalhado = '';

-- PARTE 3: Sincronizar campos numéricos português/inglês
UPDATE service_order_items
SET 
  quantidade = COALESCE(quantidade, quantity, 1),
  preco_unitario = COALESCE(preco_unitario, unit_price, 0),
  preco_total = COALESCE(preco_total, total_price, 0),
  tempo_estimado_minutos = COALESCE(tempo_estimado_minutos, estimated_duration, 0)
WHERE quantidade IS NULL 
   OR preco_unitario IS NULL
   OR preco_total IS NULL
   OR tempo_estimado_minutos IS NULL;

-- PARTE 4: Garantir campos de custo zerados
UPDATE service_order_items
SET 
  custo_materiais = COALESCE(custo_materiais, 0),
  custo_mao_obra = COALESCE(custo_mao_obra, 0),
  custo_total = COALESCE(custo_total, 0),
  lucro = COALESCE(lucro, 0),
  margem_lucro = COALESCE(margem_lucro, 0);

-- PARTE 5: Sincronizar de volta para campos inglês
UPDATE service_order_items
SET 
  quantity = quantidade,
  unit_price = preco_unitario,
  total_price = preco_total,
  estimated_duration = tempo_estimado_minutos
WHERE quantidade IS NOT NULL;