/*
  # Campos de Customização de Materiais por OS

  ## O que esta migration faz:

  1. **Campos na tabela `service_order_materials`**
     - `tipo_uso` — Define se o material é de "consumo" ou "locacao"
     - `observacoes_tecnicas` — Observações técnicas sobre uso específico nesta OS
     - `preco_unitario_negociado` — Preço unitário negociado para esta OS (não altera catálogo global)
     - `quantidade_disponivel_estoque` — Cache da quantidade em estoque no momento da inserção
     - `alerta_estoque` — Flag indicando se havia estoque insuficiente ao inserir

  ## Tabelas modificadas:
  - `service_order_materials`: adiciona campos de customização por OS

  ## Notas:
  - Todos os campos novos têm valores padrão para não quebrar dados existentes
  - Os dados de customização são específicos desta OS e não afetam o catálogo global
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials' AND column_name = 'tipo_uso'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN tipo_uso text DEFAULT 'consumo'
      CHECK (tipo_uso IN ('consumo', 'locacao'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials' AND column_name = 'observacoes_tecnicas'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN observacoes_tecnicas text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials' AND column_name = 'preco_unitario_negociado'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN preco_unitario_negociado numeric(12,2);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials' AND column_name = 'quantidade_disponivel_estoque'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN quantidade_disponivel_estoque numeric(12,3);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_order_materials' AND column_name = 'alerta_estoque'
  ) THEN
    ALTER TABLE service_order_materials
    ADD COLUMN alerta_estoque boolean DEFAULT false;
  END IF;
END $$;
