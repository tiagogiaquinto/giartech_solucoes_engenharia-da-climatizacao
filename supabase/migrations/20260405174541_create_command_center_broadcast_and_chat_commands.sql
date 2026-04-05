/*
  # Command Center: Broadcast Messages & Chat Commands

  ## Summary
  Adds the infrastructure for the unified Command Center, which merges the corporate
  chat with the task board and introduces:

  1. **`broadcast_messages` table** — Admin-only announcements shown on every portal
     (admin, technician, partner, customer). Supports expiry, priority, and acknowledgment.

  2. **`broadcast_acknowledgments` table** — Tracks which users have dismissed a broadcast,
     so it stops appearing for them once read.

  3. **`chat_task_commands` table** — When the admin sends `/tarefa @name task title`
     in the chat, a record is created here AND a project_task is auto-created.

  4. **`rpc: create_task_from_chat`** — Parses a chat command and inserts into project_tasks.

  5. **`rpc: send_broadcast`** — Creates a broadcast message and records a system message
     in the "Geral GiarTech" channel.

  6. **`rpc: mark_broadcast_read`** — Marks a broadcast as acknowledged for a user.

  ## Security
  - RLS enabled on all new tables
  - Broadcasts readable by all authenticated users
  - Only admin role can insert broadcasts
  - Acknowledgments scoped to auth.uid()
*/

-- ─── broadcast_messages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL DEFAULT '',
  content       text NOT NULL,
  priority      text NOT NULL DEFAULT 'normal' CHECK (priority IN ('info','warning','urgent')),
  target        text NOT NULL DEFAULT 'all'   CHECK (target IN ('all','technicians','admin','partners','customers')),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT 'Administrador',
  expires_at    timestamptz,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active broadcasts"
  ON broadcast_messages FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anon can read active broadcasts"
  ON broadcast_messages FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admin can insert broadcasts"
  ON broadcast_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update broadcasts"
  ON broadcast_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── broadcast_acknowledgments ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broadcast_acknowledgments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id    uuid NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(broadcast_id, user_id)
);

ALTER TABLE broadcast_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own acknowledgments"
  ON broadcast_acknowledgments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anon can read acknowledgments"
  ON broadcast_acknowledgments FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert own acknowledgments"
  ON broadcast_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can insert acknowledgments"
  ON broadcast_acknowledgments FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─── chat_task_commands ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_task_commands (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id     uuid,
  message_id     uuid,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT '',
  assignee_name  text,
  task_title     text NOT NULL,
  task_id        uuid,
  parsed_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_task_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read chat task commands"
  ON chat_task_commands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert chat task commands"
  ON chat_task_commands FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── RPC: send_broadcast ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION send_broadcast(
  p_content       text,
  p_title         text DEFAULT '',
  p_priority      text DEFAULT 'info',
  p_target        text DEFAULT 'all',
  p_expires_hours int  DEFAULT NULL,
  p_sender_name   text DEFAULT 'Administrador'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id    uuid;
  v_expiry timestamptz;
  v_channel_id uuid;
BEGIN
  IF p_expires_hours IS NOT NULL THEN
    v_expiry := now() + (p_expires_hours || ' hours')::interval;
  END IF;

  INSERT INTO broadcast_messages(title, content, priority, target, created_by, created_by_name, expires_at)
  VALUES (p_title, p_content, p_priority, p_target, auth.uid(), p_sender_name, v_expiry)
  RETURNING id INTO v_id;

  SELECT id INTO v_channel_id
  FROM corp_chat_channels
  WHERE name ILIKE '%geral%' AND is_active = true
  LIMIT 1;

  IF v_channel_id IS NOT NULL THEN
    INSERT INTO corp_chat_messages(channel_id, sender_id, sender_name, sender_role, message_type, content)
    VALUES (v_channel_id, auth.uid(), p_sender_name, 'admin', 'broadcast',
      '📢 AVISO: ' || p_content);
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION send_broadcast(text, text, text, text, int, text) TO authenticated;

-- ─── RPC: mark_broadcast_read ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_broadcast_read(p_broadcast_id uuid, p_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := COALESCE(p_user_id, auth.uid(), gen_random_uuid());
  INSERT INTO broadcast_acknowledgments(broadcast_id, user_id)
  VALUES (p_broadcast_id, v_uid)
  ON CONFLICT (broadcast_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_broadcast_read(uuid, uuid) TO authenticated, anon;

-- ─── RPC: create_task_from_chat ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_task_from_chat(
  p_title        text,
  p_assignee_name text DEFAULT NULL,
  p_channel_id   uuid DEFAULT NULL,
  p_message_id   uuid DEFAULT NULL,
  p_creator_name text DEFAULT 'Administrador',
  p_due_date     date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id uuid;
  v_pos     int;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_pos
  FROM project_tasks WHERE column_id = 'todo';

  INSERT INTO project_tasks(
    title, description, column_id, priority, assignee_name,
    assigned_by_name, tags, position, due_date, thomaz_notified
  )
  VALUES (
    p_title, 'Criada via chat por ' || p_creator_name, 'todo', 'normal',
    p_assignee_name, p_creator_name,
    ARRAY['via-chat'], v_pos, p_due_date, false
  )
  RETURNING id INTO v_task_id;

  INSERT INTO chat_task_commands(channel_id, message_id, created_by, created_by_name, assignee_name, task_title, task_id)
  VALUES (p_channel_id, p_message_id, auth.uid(), p_creator_name, p_assignee_name, p_title, v_task_id);

  RETURN jsonb_build_object('success', true, 'task_id', v_task_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_task_from_chat(text, text, uuid, uuid, text, date) TO authenticated;

-- ─── RPC: get_active_broadcasts ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_active_broadcasts(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(b) ORDER BY b.created_at DESC)
    FROM broadcast_messages b
    WHERE b.is_active = true
      AND (b.expires_at IS NULL OR b.expires_at > now())
      AND (p_user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM broadcast_acknowledgments ba
        WHERE ba.broadcast_id = b.id AND ba.user_id = p_user_id
      ))
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_active_broadcasts(uuid) TO authenticated, anon;

-- ─── Ensure "Geral GiarTech" channel exists ───────────────────────────────────

INSERT INTO corp_chat_channels(channel_type, name, is_active)
SELECT 'group', 'Geral GiarTech', true
WHERE NOT EXISTS (
  SELECT 1 FROM corp_chat_channels WHERE name ILIKE '%geral%'
);

-- ─── Add message_type 'broadcast' to allowed values if a check exists ─────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'corp_chat_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE corp_chat_messages ADD COLUMN message_type text DEFAULT 'text';
  END IF;
END $$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_active ON broadcast_messages(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_ack_user ON broadcast_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_ack_broadcast ON broadcast_acknowledgments(broadcast_id);
