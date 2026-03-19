/*
  # Fix sync_service_order_to_agenda - invalid status 'pending'

  ## Problem
  The trigger function `sync_service_order_to_agenda()` maps unrecognized OS
  statuses to 'pending', but the `valid_status` constraint on `agenda_events`
  does NOT include 'pending'. Valid values are:
    'a_fazer', 'em_andamento', 'feito', 'cancelado',
    'scheduled', 'in_progress', 'completed', 'cancelled'

  This causes every new service order INSERT and UPDATE to fail with:
  "new row for relation agenda_events violates check constraint valid_status"

  ## Fix
  Replace 'pending' with 'a_fazer' in both INSERT and UPDATE branches.
  Full mapping:
    - concluido        -> completed
    - em_andamento     -> in_progress
    - cancelado        -> cancelled
    - everything else  -> a_fazer  (was 'pending', now valid)
*/

CREATE OR REPLACE FUNCTION public.sync_service_order_to_agenda()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start_date timestamptz;
  v_end_date timestamptz;
BEGIN
  v_start_date := COALESCE(NEW.service_date::timestamptz, NEW.due_date::timestamptz, NEW.created_at, NOW());
  v_end_date := v_start_date + interval '2 hours';

  IF TG_OP = 'INSERT' THEN
    INSERT INTO agenda_events (
      title,
      start_time,
      start_date,
      end_date,
      event_type,
      service_order_id,
      customer_id,
      description,
      status
    ) VALUES (
      'OS: ' || COALESCE(NEW.order_number, 'Nova OS'),
      v_start_date,
      v_start_date::date,
      v_end_date::date,
      'operacional',
      NEW.id,
      NEW.customer_id,
      COALESCE(NEW.description, ''),
      CASE
        WHEN NEW.status IN ('concluido', 'completed') THEN 'completed'
        WHEN NEW.status IN ('em_andamento', 'in_progress') THEN 'in_progress'
        WHEN NEW.status IN ('cancelado', 'cancelled') THEN 'cancelled'
        ELSE 'a_fazer'
      END
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE agenda_events
    SET
      title = 'OS: ' || COALESCE(NEW.order_number, 'OS'),
      start_time = v_start_date,
      start_date = v_start_date::date,
      end_date = v_end_date::date,
      customer_id = NEW.customer_id,
      description = COALESCE(NEW.description, description),
      status = CASE
        WHEN NEW.status IN ('concluido', 'completed') THEN 'completed'
        WHEN NEW.status IN ('em_andamento', 'in_progress') THEN 'in_progress'
        WHEN NEW.status IN ('cancelado', 'cancelled') THEN 'cancelled'
        ELSE 'a_fazer'
      END
    WHERE service_order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;
