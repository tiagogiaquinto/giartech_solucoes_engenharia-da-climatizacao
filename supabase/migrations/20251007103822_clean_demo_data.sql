/*
  # Limpeza de Dados Fictícios do Sistema
  
  Remove todos os dados de demonstração/teste do sistema, mantendo apenas a estrutura.
  
  ## Tabelas Limpas:
  - service_orders - Ordens de serviço
  - customers - Clientes
  - finance_entries - Lançamentos financeiros
  - agenda - Eventos da agenda
  - inventory_items - Itens do estoque
  - service_catalog - Catálogo de serviços
  - employees - Funcionários
  - materials - Materiais
  - equipments - Equipamentos
  - projects - Projetos
  - contracts - Contratos
  - suppliers - Fornecedores
  - crm_leads - Leads do CRM
  - wpp_messages - Mensagens WhatsApp
  
  ## Observação:
  Dados de configuração e categorias são mantidos.
*/

-- Desabilitar temporariamente as foreign keys
SET session_replication_role = replica;

-- Limpar dados relacionados primeiro (ordem importa por causa de FKs)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE service_order_team CASCADE;
TRUNCATE TABLE service_order_materials CASCADE;
TRUNCATE TABLE service_order_labor CASCADE;
TRUNCATE TABLE service_order_items CASCADE;
TRUNCATE TABLE order_staff CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE service_orders CASCADE;
TRUNCATE TABLE orders CASCADE;

TRUNCATE TABLE finance_invoices CASCADE;
TRUNCATE TABLE financial_transactions CASCADE;
TRUNCATE TABLE finance_entries CASCADE;

TRUNCATE TABLE inventory_movements CASCADE;
TRUNCATE TABLE stock_movements CASCADE;
TRUNCATE TABLE inventory_items CASCADE;

TRUNCATE TABLE catalog_service_tasks CASCADE;
TRUNCATE TABLE catalog_service_materials CASCADE;
TRUNCATE TABLE service_catalog_steps CASCADE;
TRUNCATE TABLE service_catalog_materials CASCADE;
TRUNCATE TABLE service_catalog_labor CASCADE;
TRUNCATE TABLE service_catalog CASCADE;
TRUNCATE TABLE catalog_services CASCADE;

TRUNCATE TABLE customer_equipment CASCADE;
TRUNCATE TABLE customer_contacts CASCADE;
TRUNCATE TABLE customer_addresses CASCADE;
TRUNCATE TABLE contracts CASCADE;
TRUNCATE TABLE customers CASCADE;

TRUNCATE TABLE agenda CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE crm_leads CASCADE;

TRUNCATE TABLE wpp_messages CASCADE;
TRUNCATE TABLE wpp_contact_tags CASCADE;
TRUNCATE TABLE wpp_contacts CASCADE;
TRUNCATE TABLE wpp_campaigns CASCADE;

TRUNCATE TABLE materials CASCADE;
TRUNCATE TABLE equipments CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE staff CASCADE;

-- Reabilitar foreign keys
SET session_replication_role = DEFAULT;
