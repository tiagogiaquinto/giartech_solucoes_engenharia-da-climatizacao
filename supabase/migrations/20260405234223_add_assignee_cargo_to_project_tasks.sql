/*
  # Add assignee_cargo to project_tasks

  Adds a column to store the job title (cargo) and department of the assigned employee,
  so the TaskBoard can display who is responsible and their role.

  Changes:
  - `project_tasks`: new column `assignee_cargo` (text) - job title of the assignee
  - `project_tasks`: new column `assignee_department` (text) - department of the assignee
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assignee_cargo'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assignee_cargo text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'assignee_department'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN assignee_department text;
  END IF;
END $$;
