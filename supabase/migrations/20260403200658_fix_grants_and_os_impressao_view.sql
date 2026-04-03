/*
  # Grants and OS Impression View

  ## Summary
  1. Grants full access on service_order_items and customer_assets to authenticated role
  2. Creates/replaces the v_os_impressao_final view that consolidates service order data
     including all items (services + labor) for printing/PDF generation
  
  ## Notes
  - os_products and service_contracts do not exist in this schema; items come from service_order_items
  - service_order_items uses: service_order_id, descricao, quantity, unit_price
*/

-- 1. Grants on existing tables
GRANT ALL ON TABLE public.service_order_items TO authenticated;
GRANT ALL ON TABLE public.customer_assets TO authenticated;

-- 2. Create/replace the OS print view using actual schema columns
CREATE OR REPLACE VIEW v_os_impressao_final AS
SELECT
    so.id,
    so.order_number,
    so.status,
    so.client_name,
    so.client_phone,
    so.client_address,
    so.client_city,
    so.equipment,
    so.brand,
    so.model,
    so.description,
    so.notes,
    so.technician_notes,
    so.total_value,
    so.payment_method,
    so.payment_terms,
    so.scheduled_at,
    so.completed_at,
    (
        SELECT json_agg(
            json_build_object(
                'description', soi.descricao,
                'quantity',    soi.quantity,
                'price',       soi.unit_price,
                'completed',   soi.completed
            ) ORDER BY soi.created_at
        )
        FROM public.service_order_items soi
        WHERE soi.service_order_id = so.id
    ) AS todos_os_itens
FROM public.service_orders so;

GRANT SELECT ON v_os_impressao_final TO authenticated;

NOTIFY pgrst, 'reload schema';
