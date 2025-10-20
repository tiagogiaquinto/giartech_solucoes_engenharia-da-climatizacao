/*
  # Correção de Segurança - Parte 1: Índices para Foreign Keys
  
  ## Problema
  20 foreign keys sem índices causando baixa performance em queries
  
  ## Solução
  Criar índices para todas as foreign keys não indexadas
  
  ## Performance
  - Melhora drasticamente JOINs
  - Reduz tempo de consultas com WHERE em FKs
  - Essencial para integridade referencial rápida
*/

-- AGENDA
CREATE INDEX IF NOT EXISTS idx_agenda_customer_id ON agenda(customer_id);
CREATE INDEX IF NOT EXISTS idx_agenda_order_id ON agenda(order_id);

-- CATALOG_SERVICES
CREATE INDEX IF NOT EXISTS idx_catalog_services_categoria_id ON catalog_services(categoria_id);

-- EQUIPMENTS
CREATE INDEX IF NOT EXISTS idx_equipments_address_id ON equipments(address_id);

-- FINANCE_ENTRIES
CREATE INDEX IF NOT EXISTS idx_finance_entries_categoria_id ON finance_entries(categoria_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_customer_id ON finance_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_order_id ON finance_entries(order_id);

-- INVENTORY_MOVEMENTS
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);

-- ORDER_ITEMS
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_order_items_servico_id ON order_items(servico_id);

-- ORDER_STAFF
CREATE INDEX IF NOT EXISTS idx_order_staff_staff_id ON order_staff(staff_id);

-- ORDERS
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id);

-- SERVICE_CATALOG_LABOR
CREATE INDEX IF NOT EXISTS idx_service_catalog_labor_service_id ON service_catalog_labor(service_catalog_id);

-- SERVICE_CATALOG_MATERIALS
CREATE INDEX IF NOT EXISTS idx_service_catalog_materials_service_id ON service_catalog_materials(service_catalog_id);

-- SERVICE_ORDER_ITEMS
CREATE INDEX IF NOT EXISTS idx_service_order_items_tenant_id ON service_order_items(tenant_id);

-- STOCK_MOVEMENTS
CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON stock_movements(order_id);

-- WPP_CAMPAIGNS
CREATE INDEX IF NOT EXISTS idx_wpp_campaigns_account_id ON wpp_campaigns(account_id);

-- WPP_CONTACT_TAGS
CREATE INDEX IF NOT EXISTS idx_wpp_contact_tags_tag_id ON wpp_contact_tags(tag_id);

-- WPP_CONTACTS
CREATE INDEX IF NOT EXISTS idx_wpp_contacts_customer_id ON wpp_contacts(customer_id);

-- WPP_MESSAGES
CREATE INDEX IF NOT EXISTS idx_wpp_messages_account_id ON wpp_messages(account_id);
