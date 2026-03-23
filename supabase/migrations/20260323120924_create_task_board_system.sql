/*
  # Create Task Board System (Giartech Task Board - ClickUp Style)

  ## Summary
  Creates a complete task management system for the administrative kanban board.

  ## New Tables
  - `project_tasks` — Main task records with columns, priorities, assignments, deadlines
  - `project_task_subtasks` — Subtasks/checklist items per task
  - `project_task_comments` — Internal chat/comments per task

  ## Columns
  - todo, in_progress, review, blocked, done

  ## Priority levels
  - urgent (red), high (orange), normal (blue), low (gray)

  ## Security
  - RLS enabled on all tables
  - Authenticated users have full CRUD access (single-tenant system)
*/

CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  column_id text NOT NULL DEFAULT 'todo' CHECK (column_id IN ('todo', 'in_progress', 'review', 'blocked', 'done')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  assignee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  assignee_name text,
  assignee_avatar text,
  due_date date,
  category text DEFAULT 'geral',
  tags text[] DEFAULT '{}',
  position integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  blocked_since timestamptz,
  thomaz_notified boolean DEFAULT false
);

ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select tasks"
  ON project_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tasks"
  ON project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON project_tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON project_tasks FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS project_task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select subtasks"
  ON project_task_subtasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subtasks"
  ON project_task_subtasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subtasks"
  ON project_task_subtasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subtasks"
  ON project_task_subtasks FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS project_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Sistema',
  author_avatar text,
  body text NOT NULL,
  is_thomaz boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select comments"
  ON project_task_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON project_task_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete comments"
  ON project_task_comments FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_project_tasks_column ON project_tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON project_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_project_task_subtasks_task ON project_task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_project_task_comments_task ON project_task_comments(task_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_tasks' AND column_name = 'updated_at') THEN
    ALTER TABLE project_tasks ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_project_tasks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER trg_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_project_tasks_updated_at();

INSERT INTO project_tasks (title, description, column_id, priority, assignee_name, due_date, category, position)
VALUES
  ('Conciliação Bancária — Março', 'Verificar extratos e lançamentos do mês de março no sistema financeiro.', 'blocked', 'urgent', 'Financeiro', CURRENT_DATE - INTERVAL '3 days', 'financeiro', 1),
  ('Enviar Propostas Pendentes', 'Finalizar e enviar orçamentos para 3 clientes aguardando retorno.', 'in_progress', 'high', 'Comercial', CURRENT_DATE + INTERVAL '2 days', 'comercial', 1),
  ('Revisão de Contratos Q1', 'Revisar contratos vigentes antes do vencimento trimestral.', 'review', 'normal', 'Jurídico', CURRENT_DATE + INTERVAL '5 days', 'juridico', 1),
  ('Atualizar Catálogo de Serviços', 'Adicionar novos serviços e atualizar preços no catálogo.', 'todo', 'normal', 'Marketing', CURRENT_DATE + INTERVAL '7 days', 'operacional', 1),
  ('Fechar Relatório Mensal', 'Consolidar dados financeiros e operacionais do mês anterior.', 'todo', 'high', 'Diretor', CURRENT_DATE + INTERVAL '1 day', 'financeiro', 2)
ON CONFLICT DO NOTHING;
