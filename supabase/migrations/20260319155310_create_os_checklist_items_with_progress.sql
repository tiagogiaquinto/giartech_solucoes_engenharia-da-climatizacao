
/*
  # Checklist de Execução de OS com Progresso Automático

  ## Resumo
  Cria o sistema de checklist para execução de Ordens de Serviço no aplicativo mobile do técnico,
  com atualização automática do percentual de progresso da OS pai.

  ## Novas Tabelas
  - `os_checklist_items`: Itens de checklist vinculados a uma OS
    - `id` (uuid, PK)
    - `os_id` (uuid, FK → service_orders.id, CASCADE DELETE)
    - `description` (text): Descrição da tarefa
    - `is_completed` (boolean, default false): Status de conclusão
    - `position` (integer): Ordem de exibição
    - `updated_at` (timestamptz): Atualização automática

  ## Alteração em Tabela Existente
  - `service_orders`: adicionada coluna `progress_percent` (numeric, default 0)
    - Representa o percentual de tarefas concluídas (0 a 100)

  ## Funções e Triggers
  - `update_os_progress_percentage()`: Recalcula progress_percent toda vez que
    um item do checklist é inserido, atualizado ou deletado.
  - Trigger `tr_sync_os_progress` dispara após INSERT, UPDATE e DELETE em os_checklist_items

  ## Segurança
  - RLS habilitado na tabela os_checklist_items
  - Leitura: roles 'anon' e 'authenticated'
  - Escrita (INSERT/UPDATE/DELETE): somente 'authenticated'
  - Realtime habilitado para sincronização ao vivo no mobile
*/

-- 1. Adicionar coluna progress_percent em service_orders (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'progress_percent'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN progress_percent numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- 2. Criar tabela os_checklist_items
CREATE TABLE IF NOT EXISTS os_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  description text NOT NULL,
  is_completed boolean DEFAULT false NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Índice para buscas por os_id
CREATE INDEX IF NOT EXISTS idx_os_checklist_items_os_id ON os_checklist_items(os_id);

-- 4. Função de atualização automática de updated_at
CREATE OR REPLACE FUNCTION set_os_checklist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_os_checklist_updated_at ON os_checklist_items;
CREATE TRIGGER tr_os_checklist_updated_at
BEFORE UPDATE ON os_checklist_items
FOR EACH ROW EXECUTE FUNCTION set_os_checklist_updated_at();

-- 5. Função que recalcula progress_percent na service_orders pai
CREATE OR REPLACE FUNCTION update_os_progress_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_os_id := OLD.os_id;
  ELSE
    v_os_id := NEW.os_id;
  END IF;

  UPDATE service_orders
  SET progress_percent = (
    SELECT
      COALESCE(
        (COUNT(CASE WHEN is_completed THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100,
        0
      )
    FROM os_checklist_items
    WHERE os_id = v_os_id
  )
  WHERE id = v_os_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Trigger que dispara após qualquer alteração no checklist
DROP TRIGGER IF EXISTS tr_sync_os_progress ON os_checklist_items;
CREATE TRIGGER tr_sync_os_progress
AFTER INSERT OR UPDATE OF is_completed OR DELETE ON os_checklist_items
FOR EACH ROW EXECUTE FUNCTION update_os_progress_percentage();

-- 7. RLS
ALTER TABLE os_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem visualizar checklist de OS"
  ON os_checklist_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Autenticados podem inserir itens de checklist"
  ON os_checklist_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Autenticados podem atualizar itens de checklist"
  ON os_checklist_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Autenticados podem excluir itens de checklist"
  ON os_checklist_items FOR DELETE
  TO authenticated
  USING (true);

-- 8. Habilitar Realtime para sincronização ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE os_checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE service_orders;
