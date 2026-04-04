/*
  # Create mark_notification_as_read RPC function

  ## Purpose
  Creates the `mark_notification_as_read` function used by the NotificationHub 
  to mark individual notifications as read when the user clicks "Ciente".

  ## Changes
  - Creates `mark_notification_as_read(p_notification_id uuid)` function
  - Marks the notification as read by setting `read_at` timestamp
  - Accessible to anon and authenticated roles
  - Returns void (no error if notification not found)
*/

CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE notifications
  SET
    read_at = now(),
    is_read = true
  WHERE id = p_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(uuid) TO anon, authenticated;
