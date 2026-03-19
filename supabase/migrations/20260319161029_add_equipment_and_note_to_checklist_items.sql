
/*
  # Adicionar colunas de vinculação de equipamento e observação técnica em os_checklist_items

  ## Alterações
  - `os_checklist_items`: adicionadas colunas opcionais
    - `equipment_id` (uuid, nullable): vincula a etapa a um equipamento do cliente (customer_equipment)
    - `technical_note` (text, nullable): observação técnica para o técnico nessa etapa específica
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'os_checklist_items' AND column_name = 'equipment_id'
  ) THEN
    ALTER TABLE os_checklist_items ADD COLUMN equipment_id uuid REFERENCES customer_equipment(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'os_checklist_items' AND column_name = 'technical_note'
  ) THEN
    ALTER TABLE os_checklist_items ADD COLUMN technical_note text;
  END IF;
END $$;
