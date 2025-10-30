/*
  # Limpar todos os items duplicados de serviço

  1. Problema
    - Várias OSs têm items de serviço duplicados
    - Cada salvamento estava criando duplicatas devido ao trigger com erro

  2. Solução
    - Para cada OS, manter apenas o item mais ANTIGO de cada serviço
    - Deletar todas as duplicatas mais recentes
    - Usar ROW_NUMBER() para identificar duplicatas
*/

-- Deletar items duplicados, mantendo apenas o mais antigo
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY service_order_id, 
                   COALESCE(service_catalog_id::text, ''), 
                   descricao
      ORDER BY created_at ASC
    ) as rn
  FROM service_order_items
)
DELETE FROM service_order_items
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
)
RETURNING id, service_order_id, descricao;
