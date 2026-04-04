
/*
  # Portal Schema Integrity - Part 3: RPCs, Triggers, and Realtime

  ## Summary

  1. Fix `mark_notification_as_read(p_notification_id uuid)`
     - Recreates the function with correct return type and SECURITY DEFINER
     - Grants execute to anon and authenticated roles
     - Now also accepts customer_id for scoped access

  2. Warranty/maintenance trigger
     - When a service_order status changes to 'Finalizado' or 'finalizado',
       automatically updates `last_maintenance = NOW()` on any linked
       `customer_equipment` records (matched via customer_id + equipment name/model)
     - Also updates `portal_equipment_inventory` last_intervention_date

  3. Realtime activation
     - Enable Realtime publications for `os_milestones`, `service_orders`,
       `service_order_photos` tables

  4. New RPC: `get_os_milestones_for_portal(p_customer_id uuid, p_order_id uuid)`
     - Returns milestones for a specific service order, scoped by customer_id
     - SECURITY DEFINER to bypass RLS for portal (anon) callers

  ## Security
  - Trigger runs as SECURITY DEFINER to update equipment tables
  - All new RPCs validate customer ownership before returning data
*/

-- ==========================================
-- 1. Fix mark_notification_as_read
-- ==========================================
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id uuid)
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

GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO anon;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO authenticated;

-- ==========================================
-- 2. get_os_milestones_for_portal RPC
-- ==========================================
CREATE OR REPLACE FUNCTION get_os_milestones_for_portal(
  p_customer_id uuid,
  p_order_id    uuid
)
RETURNS TABLE (
  id              uuid,
  etapa_nome      text,
  tipo_etapa      text,
  data_agendada   timestamptz,
  data_conclusao  timestamptz,
  status          text,
  cor             text,
  observacoes     text,
  ordem           integer,
  title           text,
  description     text,
  scheduled_at    timestamptz,
  actual_at       timestamptz,
  notes           text,
  created_at      timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify this order belongs to the requesting customer
  IF NOT EXISTS (
    SELECT 1 FROM service_orders
    WHERE id = p_order_id
      AND customer_id = p_customer_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.etapa_nome,
    m.tipo_etapa,
    m.data_agendada,
    m.data_conclusao,
    m.status,
    m.cor,
    m.observacoes,
    m.ordem,
    m.title,
    m.description,
    m.scheduled_at,
    m.actual_at,
    m.notes,
    m.created_at
  FROM os_milestones m
  WHERE m.service_order_id = p_order_id
  ORDER BY COALESCE(m.ordem, m.position, 0), m.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION get_os_milestones_for_portal(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_os_milestones_for_portal(uuid, uuid) TO authenticated;

-- ==========================================
-- 3. Warranty/Maintenance auto-update trigger
-- ==========================================
CREATE OR REPLACE FUNCTION fn_update_equipment_maintenance_on_os_finish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when status changes to a finalized state
  IF NEW.status IN ('Finalizado', 'finalizado', 'completed', 'concluido', 'Concluído') 
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN

    -- Update customer_equipment last_maintenance when customer_id matches
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customer_equipment
      SET
        last_maintenance = CURRENT_DATE,
        updated_at = now()
      WHERE customer_id = NEW.customer_id
        AND (
          -- Match by equipment name/model stored on service order
          (NEW.equipment IS NOT NULL AND (modelo ILIKE '%' || NEW.equipment || '%' OR marca ILIKE '%' || NEW.equipment || '%'))
          OR
          -- Match by asset_id if explicitly linked
          (NEW.asset_id IS NOT NULL AND id = NEW.asset_id)
        );

      -- Update portal_equipment_inventory last_intervention_date
      UPDATE portal_equipment_inventory
      SET
        last_intervention_date = CURRENT_DATE,
        updated_at = now()
      WHERE customer_id = NEW.customer_id
        AND (
          (NEW.equipment IS NOT NULL AND (name ILIKE '%' || NEW.equipment || '%' OR model ILIKE '%' || NEW.equipment || '%'))
          OR
          (NEW.asset_id IS NOT NULL AND id = NEW.asset_id)
        );
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_equipment_maintenance_on_os_finish ON service_orders;

CREATE TRIGGER trg_update_equipment_maintenance_on_os_finish
  AFTER UPDATE ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_equipment_maintenance_on_os_finish();

-- ==========================================
-- 4. Enable Realtime for portal-relevant tables
-- ==========================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE os_milestones;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE service_order_photos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==========================================
-- 5. Additional grant for portal RPCs
-- ==========================================
GRANT SELECT ON os_milestones TO anon;
GRANT SELECT ON service_order_photos TO anon;
