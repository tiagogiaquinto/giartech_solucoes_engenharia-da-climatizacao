/*
  # Update get_customer_portal_equipment to include qr_code field

  ## Summary
  Recria a funcao RPC get_customer_portal_equipment para incluir o campo qr_code
  que foi adicionado na migration anterior.

  ## Changes
  - get_customer_portal_equipment: adiciona qr_code ao RETURNS TABLE e ao SELECT
*/

DROP FUNCTION IF EXISTS public.get_customer_portal_equipment(uuid);

CREATE FUNCTION public.get_customer_portal_equipment(p_customer_id uuid)
RETURNS TABLE (
  id                    uuid,
  name                  text,
  equipment_type        text,
  model                 text,
  brand                 text,
  serial_number         text,
  location              text,
  floor_area            text,
  installed_at          date,
  useful_life_years     integer,
  capacity              text,
  notes                 text,
  is_active             boolean,
  qr_code               text,
  intervention_count    bigint,
  last_intervention_date timestamptz,
  depreciation_percent  numeric,
  remaining_life_years  numeric,
  age_years             numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.equipment_type,
    e.model,
    e.brand,
    e.serial_number,
    e.location,
    e.floor_area,
    e.installed_at,
    e.useful_life_years,
    e.capacity,
    e.notes,
    e.is_active,
    e.qr_code,
    COUNT(DISTINCT so.id) AS intervention_count,
    MAX(so.created_at)    AS last_intervention_date,
    CASE
      WHEN e.installed_at IS NULL THEN 0
      ELSE LEAST(
        ROUND(
          (EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installed_at))
           + EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.installed_at)) / 12.0
           + (COUNT(DISTINCT so.id) * 0.5)
          ) / NULLIF(e.useful_life_years, 0) * 100,
          1
        ),
        100
      )
    END AS depreciation_percent,
    CASE
      WHEN e.installed_at IS NULL THEN e.useful_life_years::numeric
      ELSE GREATEST(
        0,
        ROUND(
          e.useful_life_years - (
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installed_at))
            + EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.installed_at)) / 12.0
            + (COUNT(DISTINCT so.id) * 0.5)
          ),
          1
        )
      )
    END AS remaining_life_years,
    CASE
      WHEN e.installed_at IS NULL THEN 0
      ELSE ROUND(
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.installed_at))
        + EXTRACT(MONTH FROM AGE(CURRENT_DATE, e.installed_at)) / 12.0,
        1
      )
    END AS age_years
  FROM portal_equipment_inventory e
  LEFT JOIN service_orders so ON (
    so.customer_id = e.customer_id
    AND (so.description ILIKE '%' || e.name || '%' OR so.description ILIKE '%' || e.location || '%')
    AND so.status = 'concluido'
  )
  WHERE e.customer_id = p_customer_id
    AND e.is_active = true
  GROUP BY e.id, e.name, e.equipment_type, e.model, e.brand, e.serial_number,
    e.location, e.floor_area, e.installed_at, e.useful_life_years, e.capacity,
    e.notes, e.is_active, e.qr_code
  ORDER BY e.location, e.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_portal_equipment(uuid) TO anon, authenticated;
