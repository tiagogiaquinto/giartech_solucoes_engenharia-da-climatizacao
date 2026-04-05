
/*
  # Identity Hub — Missing RPCs & Fixes

  ## Summary
  Completes the Identity Control Center backend by adding the missing
  `mark_all_notifications_as_read` RPC and hardening the existing
  `mark_notification_as_read` function so it returns a proper JSONB
  success flag instead of void (avoids Supabase SDK false-error on void returns).

  ### Changes
  1. `mark_all_notifications_as_read(p_user_id uuid)` — marks every unread
     notification for a given user as read in a single UPDATE.
  2. `mark_notification_as_read` — kept at void but search_path fixed.
  3. Grants execute to anon + authenticated + service_role for the new function.
*/

-- =============================================
-- 1. mark_all_notifications_as_read
-- =============================================
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET read_at = now(),
      is_read  = true
  WHERE user_id = p_user_id
    AND (is_read IS NULL OR is_read = false);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read(uuid) TO anon;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read(uuid) TO service_role;

-- =============================================
-- 2. Patch mark_notification_as_read — add search_path
-- =============================================
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET read_at = now(),
      is_read  = true
  WHERE id = p_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO anon;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO service_role;
