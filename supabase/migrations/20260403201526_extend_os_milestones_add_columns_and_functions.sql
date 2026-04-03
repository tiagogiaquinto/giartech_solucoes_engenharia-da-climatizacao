/*
  # Extend os_milestones for Cronograma Vivo

  ## Summary
  The os_milestones table already exists with Portuguese column names.
  This migration:
  1. Adds missing columns needed for the "living schedule" feature:
     - title (alias for etapa_nome via generated column approach — we add it as real column)
     - description
     - position (alias for ordem)
     - scheduled_at (alias for data_agendada)
     - actual_at (real execution timestamp, separate from data_conclusao)
     - completed_by
     - notes (alias for observacoes)
  2. Normalizes status CHECK to include all needed values
  3. Creates RPC functions for rescheduling and completing milestones
  4. Fixes service_order_photos RLS and notifications function

  ## Notes
  - We ADD columns only if they don't exist to avoid errors on re-run
  - The existing Portuguese columns (etapa_nome, data_agendada, etc.) are kept for compatibility
*/

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='title') THEN
    ALTER TABLE os_milestones ADD COLUMN title text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='description') THEN
    ALTER TABLE os_milestones ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='scheduled_at') THEN
    ALTER TABLE os_milestones ADD COLUMN scheduled_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='actual_at') THEN
    ALTER TABLE os_milestones ADD COLUMN actual_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='completed_by') THEN
    ALTER TABLE os_milestones ADD COLUMN completed_by text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='notes') THEN
    ALTER TABLE os_milestones ADD COLUMN notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='os_milestones' AND column_name='position') THEN
    ALTER TABLE os_milestones ADD COLUMN position integer DEFAULT 0;
  END IF;
END $$;

-- Sync title ↔ etapa_nome, scheduled_at ↔ data_agendada for existing rows
UPDATE os_milestones SET
  title        = COALESCE(title, etapa_nome),
  scheduled_at = COALESCE(scheduled_at, data_agendada),
  notes        = COALESCE(notes, observacoes),
  position     = COALESCE(position, ordem);

-- Drop old status constraint and add normalised one
ALTER TABLE os_milestones DROP CONSTRAINT IF EXISTS os_milestones_status_check;
ALTER TABLE os_milestones
  ADD CONSTRAINT os_milestones_status_check
  CHECK (status IN ('agendado','em_andamento','concluido','atrasado','pendente','cancelado'));

-- Ensure RLS is on
ALTER TABLE os_milestones ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies cleanly
DROP POLICY IF EXISTS "milestones select"  ON os_milestones;
DROP POLICY IF EXISTS "milestones insert"  ON os_milestones;
DROP POLICY IF EXISTS "milestones update"  ON os_milestones;
DROP POLICY IF EXISTS "milestones delete"  ON os_milestones;

CREATE POLICY "milestones select" ON os_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "milestones insert" ON os_milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "milestones update" ON os_milestones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "milestones delete" ON os_milestones FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_os_milestones_soid  ON os_milestones(service_order_id);
CREATE INDEX IF NOT EXISTS idx_os_milestones_status ON os_milestones(status);
CREATE INDEX IF NOT EXISTS idx_os_milestones_sched  ON os_milestones(scheduled_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_os_milestones_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_os_milestones_updated_at ON os_milestones;
CREATE TRIGGER trg_os_milestones_updated_at
  BEFORE UPDATE ON os_milestones
  FOR EACH ROW EXECUTE FUNCTION update_os_milestones_updated_at();

-- RPC: reschedule milestone and sync its agenda event
CREATE OR REPLACE FUNCTION reschedule_milestone(
  p_milestone_id uuid,
  p_new_date     timestamptz
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_agenda_id uuid;
BEGIN
  SELECT agenda_event_id INTO v_agenda_id
  FROM os_milestones WHERE id = p_milestone_id;

  UPDATE os_milestones
  SET scheduled_at  = p_new_date,
      data_agendada = p_new_date,
      status = CASE WHEN status = 'atrasado' THEN 'agendado' ELSE status END
  WHERE id = p_milestone_id;

  IF v_agenda_id IS NOT NULL THEN
    UPDATE agenda_events
    SET start_date = p_new_date,
        end_date   = p_new_date + INTERVAL '1 hour'
    WHERE id = v_agenda_id;
  END IF;
END;
$$;

-- RPC: complete a milestone, record real timestamp
CREATE OR REPLACE FUNCTION complete_milestone(
  p_milestone_id uuid,
  p_completed_by text DEFAULT NULL,
  p_notes        text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE os_milestones
  SET status         = 'concluido',
      actual_at      = now(),
      data_conclusao = now(),
      completed_by   = COALESCE(p_completed_by, completed_by),
      notes          = COALESCE(p_notes, notes)
  WHERE id = p_milestone_id;
END;
$$;

-- RPC: auto-mark overdue open milestones as atrasado
CREATE OR REPLACE FUNCTION auto_mark_late_milestones()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  UPDATE os_milestones
  SET status = 'atrasado'
  WHERE status IN ('agendado','em_andamento')
    AND scheduled_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION reschedule_milestone(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_milestone(uuid, text, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION auto_mark_late_milestones()             TO authenticated;
GRANT ALL ON TABLE os_milestones TO authenticated;

-- Fix service_order_photos RLS (403 errors)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_order_photos' AND table_schema = 'public') THEN
    ALTER TABLE service_order_photos ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "photos select" ON service_order_photos;
    DROP POLICY IF EXISTS "photos insert" ON service_order_photos;
    DROP POLICY IF EXISTS "photos update" ON service_order_photos;
    DROP POLICY IF EXISTS "photos delete" ON service_order_photos;

    EXECUTE 'CREATE POLICY "photos select" ON service_order_photos FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "photos insert" ON service_order_photos FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "photos update" ON service_order_photos FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "photos delete" ON service_order_photos FOR DELETE TO authenticated USING (true)';

    EXECUTE 'GRANT ALL ON TABLE service_order_photos TO authenticated';
  END IF;
END $$;

-- Notifications upsert helper (fixes 404 on notify_user RPC)
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id   uuid,
  p_title     text,
  p_message   text,
  p_type      text DEFAULT 'info',
  p_entity_type text DEFAULT NULL,
  p_entity_id   uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO notifications(user_id, title, message, type, entity_type, entity_id, is_read, created_at)
  VALUES (p_user_id, p_title, p_message, p_type, p_entity_type, p_entity_id, false, now())
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION notify_user(uuid, text, text, text, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
