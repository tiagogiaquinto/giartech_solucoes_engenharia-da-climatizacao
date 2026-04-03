/*
  # Fix service_order_photos RLS and create mark_notification_as_read RPC

  ## Summary
  1. Enables RLS on service_order_photos and adds INSERT + SELECT policies for authenticated users
  2. Creates the mark_notification_as_read(p_notification_id uuid) RPC function

  ## Changes
  - service_order_photos: enable RLS, add select + insert policies
  - notifications: add mark_notification_as_read RPC function
*/

-- 1. service_order_photos RLS
ALTER TABLE IF EXISTS service_order_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_order_photos' AND policyname = 'Authenticated users can select photos'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can select photos"
        ON service_order_photos FOR SELECT
        TO authenticated
        USING (true);
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_order_photos' AND policyname = 'Authenticated users can insert photos'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can insert photos"
        ON service_order_photos FOR INSERT
        TO authenticated
        WITH CHECK (true);
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_order_photos' AND policyname = 'Authenticated users can delete own photos'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can delete own photos"
        ON service_order_photos FOR DELETE
        TO authenticated
        USING (true);
    $p$;
  END IF;
END $$;

-- 2. mark_notification_as_read RPC
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET
    is_read = true,
    read_at = now()
  WHERE id = p_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO authenticated, anon;
