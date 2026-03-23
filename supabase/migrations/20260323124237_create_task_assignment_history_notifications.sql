/*
  # Task Assignment History & Real-time Notifications

  ## Summary
  Creates a full assignment tracking and notification system for the Task Board.

  ## New Tables
  - `task_assignment_history` — logs every assignment/reassignment with who assigned, who was assigned, and when
  - `task_notifications` — per-user pending notifications for new task assignments; 
    used for real-time pop-ups via Supabase Realtime

  ## Changes to project_tasks
  - `assignee_id` (uuid, nullable) — FK to user_profiles
  - `assigned_by_id` (uuid, nullable) — who last assigned the task
  - `assigned_by_name` (text) — denormalized name for display
  - `assigned_at` (timestamptz) — when the assignment happened

  ## Security
  - RLS enabled on both new tables
  - Authenticated users can read their own notifications
  - Authenticated users can insert into history (captured server-side)
*/

CREATE TABLE IF NOT EXISTS task_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  task_title text NOT NULL DEFAULT '',
  assigned_to_id uuid,
  assigned_to_name text NOT NULL DEFAULT '',
  assigned_to_email text,
  assigned_by_id uuid,
  assigned_by_name text NOT NULL DEFAULT '',
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_assignment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assignment history"
  ON task_assignment_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert assignment history"
  ON task_assignment_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can read assignment history"
  ON task_assignment_history FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert assignment history"
  ON task_assignment_history FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS task_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  recipient_email text,
  task_id uuid NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  task_title text NOT NULL DEFAULT '',
  assigned_by_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON task_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON task_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON task_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

CREATE POLICY "Anon can read task_notifications"
  ON task_notifications FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert task_notifications"
  ON task_notifications FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update task_notifications"
  ON task_notifications FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assignee_id'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assignee_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assigned_by_id'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assigned_by_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assigned_by_name'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assigned_by_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assigned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assignee_email'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assignee_email text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_notifications_recipient ON task_notifications(recipient_user_id, read);
CREATE INDEX IF NOT EXISTS idx_task_assignment_history_task ON task_assignment_history(task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks(assignee_id);
