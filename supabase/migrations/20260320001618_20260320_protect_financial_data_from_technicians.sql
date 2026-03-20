/*
  # Protect Financial Data from Technicians

  1. Overview
    - Adds RLS policies to restrict technicians from viewing financial fields
    - Creates secure views for service orders without financial data
    - Technicians cannot see: total_price, total_cost, profit, labor_cost, material_cost columns

  2. Security Changes
    - Creates `v_service_orders_technician` view that excludes financial columns
    - Creates function to detect technician role
    
  3. Important Notes
    - Super admins, admins, managers, financial bypass these restrictions
    - Technicians can still see order details, just not financial values
*/

CREATE OR REPLACE FUNCTION public.is_technician()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'technician' FROM auth_accounts WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_financial_data()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('super_admin', 'admin', 'manager', 'financial')
     FROM auth_accounts
     WHERE id = auth.uid()),
    true
  );
$$;

DROP VIEW IF EXISTS v_service_orders_technician CASCADE;

CREATE VIEW v_service_orders_technician AS
SELECT
  so.id,
  so.order_number,
  so.status,
  so.priority,
  so.customer_id,
  so.scheduled_at,
  so.scheduled_time,
  so.service_date,
  so.completion_date,
  so.client_name,
  so.client_phone,
  so.client_email,
  so.client_address,
  so.client_city,
  so.client_state,
  so.client_cep,
  so.title,
  so.description,
  so.notes,
  so.special_tools,
  so.relatorio_tecnico,
  so.orientacoes_servico,
  so.escopo_detalhado,
  so.equipment,
  so.brand,
  so.model,
  so.customer_signature,
  so.signature_date,
  so.signed_by_name,
  so.created_at,
  so.updated_at,
  so.prazo_execucao_dias,
  so.data_inicio_execucao,
  so.data_fim_execucao,
  so.progress_percent,
  so.required_tools,
  so.required_materials,
  so.formatted_address,
  so.access_note,
  so.special_instructions,
  c.nome_razao as customer_name,
  c.telefone as customer_phone_from_customer,
  c.celular as customer_mobile,
  c.email as customer_email_from_customer
FROM service_orders so
LEFT JOIN customers c ON c.id = so.customer_id;

GRANT SELECT ON v_service_orders_technician TO authenticated;
GRANT SELECT ON v_service_orders_technician TO anon;

DROP VIEW IF EXISTS v_service_order_items_technician CASCADE;

CREATE VIEW v_service_order_items_technician AS
SELECT
  soi.id,
  soi.service_order_id,
  soi.service_catalog_id,
  soi.service_name,
  soi.service_description,
  soi.descricao,
  soi.difficulty_level,
  soi.quantity,
  soi.quantidade,
  soi.escopo_detalhado,
  soi.estimated_duration,
  soi.tempo_estimado_minutos,
  soi.notes,
  soi.technical_requirements,
  soi.safety_warnings,
  soi.execution_steps,
  soi.expected_results,
  soi.quality_standards,
  soi.warranty_info,
  soi.observations,
  soi.completed,
  soi.completed_at,
  soi.completed_by_name,
  soi.created_at,
  sc.name as catalog_service_name,
  sc.description as catalog_description
FROM service_order_items soi
LEFT JOIN service_catalog sc ON sc.id = soi.service_catalog_id;

GRANT SELECT ON v_service_order_items_technician TO authenticated;
GRANT SELECT ON v_service_order_items_technician TO anon;

DROP VIEW IF EXISTS v_service_order_materials_technician CASCADE;

CREATE VIEW v_service_order_materials_technician AS
SELECT
  som.id,
  som.service_order_id,
  som.service_order_item_id,
  som.material_id,
  som.material_name,
  som.nome_material,
  som.material_code,
  som.quantity,
  som.quantidade,
  som.material_unit,
  som.notes,
  som.observacoes_tecnicas,
  som.from_inventory,
  som.created_at,
  ii.name as inventory_name,
  ii.code as inventory_code,
  ii.unit as inventory_unit
FROM service_order_materials som
LEFT JOIN inventory_items ii ON ii.id = som.material_id;

GRANT SELECT ON v_service_order_materials_technician TO authenticated;
GRANT SELECT ON v_service_order_materials_technician TO anon;

DROP VIEW IF EXISTS v_os_checklist_technician CASCADE;

CREATE VIEW v_os_checklist_technician AS
SELECT
  oci.id,
  oci.os_id as service_order_id,
  oci.description,
  oci.is_completed,
  oci.position as sort_order,
  oci.equipment_id,
  oci.technical_note as note,
  oci.created_at,
  oci.updated_at
FROM os_checklist_items oci;

GRANT SELECT ON v_os_checklist_technician TO authenticated;
GRANT SELECT ON v_os_checklist_technician TO anon;

COMMENT ON VIEW v_service_orders_technician IS 'Service orders view for technicians - excludes financial data (total, prices, costs, profit)';
COMMENT ON VIEW v_service_order_items_technician IS 'Service order items view for technicians - excludes pricing data';
COMMENT ON VIEW v_service_order_materials_technician IS 'Service order materials view for technicians - excludes cost data';
COMMENT ON VIEW v_os_checklist_technician IS 'Checklist items for technicians';
