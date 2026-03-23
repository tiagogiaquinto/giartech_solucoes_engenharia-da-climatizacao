/*
  # Add related_task_id to agenda_events

  Links admin Kanban tasks with due_dates to the company Calendar automatically.

  1. Changes
    - Adds `related_task_id` (uuid, nullable) to `agenda_events` to reference `project_tasks`
    - Adds index for efficient lookup when syncing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agenda_events' AND column_name = 'related_task_id'
  ) THEN
    ALTER TABLE agenda_events ADD COLUMN related_task_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_agenda_events_related_task ON agenda_events(related_task_id) WHERE related_task_id IS NOT NULL;
  END IF;
END $$;
