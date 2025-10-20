# Estrutura do Banco de Dados - Sistema de Gestão de OS

## Visão Geral

Banco de dados completo criado no **Supabase (PostgreSQL)** para gerenciar todo o sistema de ordens de serviço, incluindo clientes, estoque, financeiro, usuários e contratos.

---

## 📊 Tabelas Criadas (20 tabelas)

### 1. **Gestão de Usuários e Autenticação**

#### `users`
Gerenciamento completo de usuários do sistema
- **Campos principais**: id, email, name, avatar, role, status, department_id, phone, last_login
- **Roles**: admin, manager, technician, external, viewer
- **Status**: active, inactive, pending, suspended
- **RLS**: Usuários veem próprio perfil / Admins veem todos

#### `departments`
Departamentos da empresa
- **Campos**: id, name, description, manager_id, is_active
- **RLS**: Todos veem / Apenas admins gerenciam

#### `permissions`
Permissões específicas do sistema
- **Campos**: id, name, description, category
- **RLS**: Todos autenticados podem visualizar

#### `role_permissions`
Relacionamento entre roles e permissões
- **Campos**: id, role, permission_id
- **RLS**: Todos autenticados podem visualizar

---

### 2. **Gestão de Clientes**

#### `clients`
Cadastro de clientes PF (Pessoa Física) e PJ (Pessoa Jurídica)
- **Campos principais**: id, name, email, phone, address, client_type, document
- **Campos PJ**: company_name, trade_name, state_registration
- **RLS**: Todos veem / Técnicos+ podem criar/editar / Admins deletam

#### `contracts`
Contratos de manutenção e SLA
- **Campos**: id, client_id, contract_number, title, start_date, end_date, contract_type, frequency, value, status
- **SLA**: sla_response_time, sla_resolution_time, sla_availability
- **Tipos**: maintenance, support, service, consulting
- **Status**: active, expired, cancelled, suspended
- **Frequência**: monthly, quarterly, biannual, annual, custom
- **RLS**: Todos veem / Managers+ gerenciam

#### `client_inventory`
Equipamentos e inventário dos clientes
- **Campos**: id, client_id, equipment, brand, model, serial_number, install_date, last_maintenance, next_maintenance
- **RLS**: Todos veem / Técnicos+ gerenciam

---

### 3. **Gestão de Ordens de Serviço**

#### `service_orders`
Ordens de serviço principais
- **Campos**: id, order_number, client_id, client_name, client_phone, client_address, service_type, description
- **Status**: pending, in_progress, completed, cancelled, on_hold
- **Prioridade**: low, medium, high, urgent
- **Valores**: estimated_value, actual_value
- **Atribuição**: assigned_to, assigned_user_id, created_by
- **RLS**: Todos veem / Técnicos+ criam/editam / Admins deletam

#### `service_order_history`
Histórico de alterações das OS
- **Campos**: id, service_order_id, changed_by, field_name, old_value, new_value
- **RLS**: Todos autenticados podem visualizar

#### `service_catalog`
Catálogo de serviços disponíveis
- **Campos**: id, name, description, category, estimated_duration, base_price, is_active
- **RLS**: Todos veem / Managers+ gerenciam

---

### 4. **Gestão de Estoque**

#### `inventory_items`
Itens do estoque
- **Campos**: id, name, category, quantity, min_stock, price, supplier, description, sku, location
- **RLS**: Todos veem / Técnicos+ gerenciam

#### `inventory_movements`
Movimentações de estoque (entrada, saída, ajuste, devolução)
- **Campos**: id, inventory_item_id, movement_type, quantity, reference_id, reference_type, notes, created_by
- **Tipos**: in, out, adjustment, return
- **RLS**: Todos veem / Técnicos+ criam

---

### 5. **Integração Financeira**

#### `financial_tasks`
Tarefas de cobrança vinculadas às OS
- **Campos**: id, order_number, service_order_id, client_name, client_type, service_value, status, due_date
- **Status**: pending, invoiced, paid, overdue, cancelled
- **Métodos pagamento**: cash, credit_card, debit_card, bank_transfer, pix, check, other
- **RLS**: Apenas Managers+ veem e gerenciam

#### `invoices`
Notas fiscais emitidas
- **Campos**: id, number, order_number, service_order_id, client_id, client_name, value, issue_date, due_date, status
- **Status**: draft, sent, paid, overdue, cancelled
- **Arquivos**: pdf_url, xml_url
- **RLS**: Apenas Managers+ veem e gerenciam

#### `invoice_items`
Itens das notas fiscais
- **Campos**: id, invoice_id, description, quantity, unit_price, total
- **RLS**: Apenas Managers+ visualizam

#### `payments`
Registros de pagamentos recebidos
- **Campos**: id, invoice_id, amount, payment_date, payment_method, transaction_id, created_by
- **RLS**: Managers+ veem / Managers+ criam

---

### 6. **Outras Entidades**

#### `projects`
Projetos e agrupamentos de OS
- **Campos**: id, name, description, client_id, start_date, end_date, status, manager_id, budget
- **RLS**: Todos veem / Managers+ gerenciam

#### `attachments`
Arquivos anexados (vinculados a qualquer entidade)
- **Campos**: id, reference_id, reference_type, file_name, file_url, file_size, mime_type, uploaded_by
- **RLS**: Todos veem / Usuário só cria próprios anexos

#### `notifications`
Notificações do sistema
- **Campos**: id, user_id, title, message, type, status, reference_id, reference_type
- **Tipos**: info, warning, error, success
- **Status**: unread, read, archived
- **RLS**: Usuários veem e atualizam apenas próprias notificações

#### `audit_logs`
Logs de auditoria completa do sistema
- **Campos**: id, user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent
- **RLS**: Apenas admins visualizam

---

## 🔐 Segurança (Row Level Security)

**Todas as tabelas têm RLS habilitado** com políticas específicas:

### Níveis de Acesso:
1. **Admin**: Acesso total a tudo
2. **Manager**: Acesso a gestão operacional e financeira
3. **Technician**: Acesso a OS, clientes e estoque
4. **External**: Acesso limitado conforme configuração
5. **Viewer**: Apenas visualização

### Políticas Principais:
- **Usuários veem apenas próprio perfil** (exceto admins)
- **Dados financeiros apenas para Managers+**
- **Todos veem clientes e OS**
- **Técnicos+ podem criar/editar OS**
- **Apenas admins deletam registros críticos**
- **Notificações privadas por usuário**
- **Audit logs apenas para admins**

---

## ⚡ Funcionalidades Automáticas

### Triggers Implementados:
- **Auto-atualização de `updated_at`** em 11 tabelas principais
- Sistema pronto para triggers de:
  - Criação automática de tarefas financeiras ao concluir OS
  - Geração automática de números de controle
  - Validação de estoque mínimo
  - Notificações automáticas

### Índices de Performance:
Criados 30+ índices para otimizar consultas em:
- Emails, roles e status de usuários
- Tipos e documentos de clientes
- Números, status e datas de OS
- SKUs e categorias de estoque
- Status e datas financeiras
- Números de contratos

---

## 📋 ENUMs Disponíveis

### Tipos de Dados Estruturados:
- **user_role**: admin, manager, technician, external, viewer
- **user_status**: active, inactive, pending, suspended
- **client_type**: PF, PJ
- **order_status**: pending, in_progress, completed, cancelled, on_hold
- **order_priority**: low, medium, high, urgent
- **contract_status**: active, expired, cancelled, suspended
- **contract_type**: maintenance, support, service, consulting
- **frequency_type**: monthly, quarterly, biannual, annual, custom
- **financial_status**: pending, invoiced, paid, overdue, cancelled
- **invoice_status**: draft, sent, paid, overdue, cancelled
- **payment_method**: cash, credit_card, debit_card, bank_transfer, pix, check, other
- **movement_type**: in, out, adjustment, return
- **notification_type**: info, warning, error, success
- **notification_status**: unread, read, archived

---

## 🔄 Relacionamentos

### Principais Foreign Keys:
- `users.department_id` → `departments.id`
- `clients.id` ← `contracts.client_id`
- `clients.id` ← `client_inventory.client_id`
- `clients.id` ← `service_orders.client_id`
- `service_orders.id` ← `service_order_history.service_order_id`
- `service_orders.id` ← `financial_tasks.service_order_id`
- `service_orders.id` ← `invoices.service_order_id`
- `invoices.id` ← `invoice_items.invoice_id`
- `invoices.id` ← `payments.invoice_id`
- `inventory_items.id` ← `inventory_movements.inventory_item_id`

---

## 📊 Estatísticas

- **Total de Tabelas**: 20
- **Total de ENUMs**: 14
- **Total de Índices**: 30+
- **Total de Triggers**: 11
- **Total de Políticas RLS**: 40+

---

## 🚀 Próximos Passos

1. **Inserir dados de exemplo** para testes
2. **Configurar autenticação Supabase** no frontend
3. **Criar views materializadas** para relatórios
4. **Implementar triggers adicionais** para automações
5. **Configurar backup automático**
6. **Adicionar full-text search** em campos relevantes

---

## 📝 Observações Importantes

- ✅ Todas as tabelas usam UUID como chave primária
- ✅ Timestamps automáticos (created_at, updated_at)
- ✅ Suporte completo para PostgreSQL 14+
- ✅ Extensões habilitadas: uuid-ossp, pgcrypto
- ✅ RLS configurado em 100% das tabelas
- ✅ Índices otimizados para consultas comuns
- ✅ Estrutura preparada para escalar

---

**Banco de dados criado com sucesso no Supabase!** ✨
