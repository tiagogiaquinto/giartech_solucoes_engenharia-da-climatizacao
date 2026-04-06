/*
  # Portal Service Requests — Alerts in Task Board

  ## What this migration does:

  1. Adds a `source` column to `project_tasks` so tasks created from portal
     service requests can be identified and filtered (value: 'portal_request').
  2. Adds a `source_id` column to link the task back to `portal_service_requests.id`.
  3. Adds a `source_customer_name` column for display purposes.
  4. Creates a DB function `fn_portal_request_create_task()` that automatically
     inserts a row into `project_tasks` whenever a new portal_service_request is
     created, so the internal team sees it immediately in the Task Board.
  5. Creates the trigger `trg_portal_request_create_task` that calls the function.
  6. Grants EXECUTE on the new function to anon and authenticated roles.

  ## New columns on project_tasks:
  - `source`               text  — origin of the task ('manual' | 'portal_request' | 'os_completion' etc.)
  - `source_id`            uuid  — FK-like reference to the originating record (not a hard FK to allow flexibility)
  - `source_customer_name` text  — customer name copied at creation time for fast display

  ## Security:
  - No RLS changes needed (project_tasks already has policies).
  - Function runs as SECURITY DEFINER so the anon portal role can insert tasks.
*/

-- 1. Add new columns to project_tasks (safe, idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'source'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN source text DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN source_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_tasks' AND column_name = 'source_customer_name'
  ) THEN
    ALTER TABLE project_tasks ADD COLUMN source_customer_name text;
  END IF;
END $$;

-- 2. Function: create a task in project_tasks when a portal_service_request is inserted
CREATE OR REPLACE FUNCTION fn_portal_request_create_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_name  text := 'Cliente';
  v_priority       text := 'normal';
  v_title          text;
BEGIN
  -- Resolve customer name from customers table
  SELECT COALESCE(name, 'Cliente')
    INTO v_customer_name
    FROM customers
   WHERE id = NEW.customer_id
   LIMIT 1;

  -- Map portal priority to project_tasks priority
  v_priority := CASE NEW.priority
    WHEN 'urgente' THEN 'urgent'
    WHEN 'alta'    THEN 'high'
    WHEN 'baixa'   THEN 'low'
    ELSE 'normal'
  END;

  -- Build title
  v_title := 'Solicitação Portal: ' || COALESCE(NEW.title, 'Sem título') || ' — ' || v_customer_name;

  -- Insert task into the kanban board
  INSERT INTO project_tasks (
    title,
    description,
    column_id,
    priority,
    category,
    source,
    source_id,
    source_customer_name,
    tags
  ) VALUES (
    v_title,
    COALESCE(NEW.description, ''),
    'todo',
    v_priority,
    'solicitacao_portal',
    'portal_request',
    NEW.id,
    v_customer_name,
    ARRAY['portal', 'solicitacao']
  );

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to portal_service_requests
DROP TRIGGER IF EXISTS trg_portal_request_create_task ON portal_service_requests;

CREATE TRIGGER trg_portal_request_create_task
  AFTER INSERT ON portal_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION fn_portal_request_create_task();

-- 4. Grant execute on the function
GRANT EXECUTE ON FUNCTION fn_portal_request_create_task() TO anon, authenticated;
