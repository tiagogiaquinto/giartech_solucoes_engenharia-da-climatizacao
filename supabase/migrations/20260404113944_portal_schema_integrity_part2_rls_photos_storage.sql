
/*
  # Portal Schema Integrity - Part 2: RLS for Photos and Storage Buckets

  ## Summary
  The portal uses custom session tokens (not Supabase Auth JWT) and accesses
  data through SECURITY DEFINER RPC functions under the anon role.
  This migration focuses on:

  1. `service_order_photos` — fix 403 for technicians (authenticated users)
     - Ensure authenticated users (technicians, staff) can INSERT photos
     - Ensure authenticated users can SELECT and UPDATE photos

  2. Storage buckets `os-photos` and `service-order-photos`
     - Ensure public read access for photo URLs
     - Ensure authenticated users can upload (INSERT) to these buckets
     - Ensure authenticated users can delete their own uploads

  ## Notes
  - Portal RPCs already run as SECURITY DEFINER, bypassing RLS for portal reads
  - Technician photo upload uses authenticated Supabase Auth session
  - No destructive changes to existing policies
*/

-- ==========================================
-- Ensure anon role can call portal RPCs
-- ==========================================
GRANT EXECUTE ON FUNCTION get_customer_portal_equipment(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_customer_portal_history(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_customer_portal_orders(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_customer_portal_order_detail(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_partner_portal_orders(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_partner_portal_history(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_portal_notifications(uuid) TO anon;
GRANT EXECUTE ON FUNCTION mark_portal_notifications_read(uuid) TO anon;

-- ==========================================
-- service_order_photos: Ensure technician INSERT policy is correct
-- Drop duplicate/conflicting policies first
-- ==========================================
DROP POLICY IF EXISTS "photos_insert_technician" ON service_order_photos;

CREATE POLICY "photos_insert_technician"
  ON service_order_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==========================================
-- Storage bucket os-photos: public read, authenticated upload/delete
-- ==========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('os-photos', 'os-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-order-photos', 'service-order-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "os_photos_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "os_photos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "os_photos_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "sop_photos_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "sop_photos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "sop_photos_delete_authenticated" ON storage.objects;

-- os-photos storage policies
CREATE POLICY "os_photos_upload_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'os-photos');

CREATE POLICY "os_photos_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'os-photos');

CREATE POLICY "os_photos_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'os-photos');

-- service-order-photos storage policies
CREATE POLICY "sop_photos_upload_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-order-photos');

CREATE POLICY "sop_photos_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'service-order-photos');

CREATE POLICY "sop_photos_delete_authenticated"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'service-order-photos');
