# 🔍 Diagnóstico: Mapeamento Frontend ↔ Database

## ⚠️ PROBLEMA IDENTIFICADO

O frontend está tentando acessar tabelas com nomes diferentes dos que existem no banco de dados.

---

## 📊 TABELAS NO BANCO DE DADOS (52 tabelas)

```
✅ agenda
✅ audit_logs
✅ bank_accounts
✅ catalog_service_materials
✅ catalog_service_tasks
✅ catalog_services
✅ company_settings
✅ contract_types
✅ contracts
✅ crm_leads
✅ customer_addresses
✅ customer_contacts
✅ customer_equipment
✅ customers
✅ employees
✅ empresas
✅ equipments
✅ finance_entries
✅ finance_invoices
✅ financial_categories
✅ financial_transactions
✅ inventory_items
✅ inventory_movements
✅ materials
✅ order_items
✅ order_staff
✅ orders
✅ projects
✅ service_catalog
✅ service_catalog_labor
✅ service_catalog_materials
✅ service_catalog_steps
✅ service_order_items
✅ service_order_labor
✅ service_order_materials
✅ service_order_team
✅ service_orders
✅ staff
✅ stock_movements
✅ suppliers
✅ tenants
✅ user_credentials
✅ user_invitations
✅ user_menu_order
✅ user_profiles
✅ users
✅ wpp_accounts
✅ wpp_campaigns
✅ wpp_contact_tags
✅ wpp_contacts
✅ wpp_messages
✅ wpp_tags
```

---

## 🔴 CONFLITOS IDENTIFICADOS

### **1. CLIENTES**

**Frontend tenta acessar:**
- `clients` ❌ (NÃO EXISTE)

**Banco tem:**
- `customers` ✅

**Arquivo:** `src/lib/supabase.ts:599, 615`

**Impacto:**
- Inserções de clientes FALHAM
- Listagem de clientes FALHA

---

### **2. CATÁLOGO DE SERVIÇOS**

**Frontend tenta acessar:**
- `service_catalog` ✅ (existe)
- `catalog_services` ✅ (existe)

**ATENÇÃO:** Frontend usa DOIS nomes diferentes!

**Arquivos:**
- `src/lib/supabase.ts:701` → `service_catalog`
- `src/lib/supabase.ts:716` → `catalog_services`

**Impacto:**
- Inconsistência nas operações
- Algumas queries funcionam, outras não

---

## 🎯 TABELAS USADAS PELO FRONTEND

| Frontend Usa | Banco Tem | Status |
|-------------|-----------|---------|
| `service_orders` | ✅ `service_orders` | OK |
| `service_order_items` | ✅ `service_order_items` | OK |
| `service_order_team` | ✅ `service_order_team` | OK |
| `employees` | ✅ `employees` | OK |
| `user_invitations` | ✅ `user_invitations` | OK |
| `customer_addresses` | ✅ `customer_addresses` | OK |
| `customer_contacts` | ✅ `customer_contacts` | OK |
| `customer_equipment` | ✅ `customer_equipment` | OK |
| `materials` | ✅ `materials` | OK |
| `inventory_items` | ✅ `inventory_items` | OK |
| `customers` | ✅ `customers` | OK |
| **`clients`** | ❌ **NÃO EXISTE** | **ERRO** |
| `contracts` | ✅ `contracts` | OK |
| `service_catalog` | ✅ `service_catalog` | OK |
| `catalog_services` | ✅ `catalog_services` | **DUPLICADO** |
| `user_profiles` | ✅ `user_profiles` | OK |
| `agenda` | ✅ `agenda` | OK |
| `orders` | ✅ `orders` | OK |

---

## 🔧 SOLUÇÕES POSSÍVEIS

### **Opção 1: Criar ALIAS no Banco** (RECOMENDADO)

Criar uma VIEW chamada `clients` que aponta para `customers`:

```sql
CREATE VIEW clients AS SELECT * FROM customers;
```

**Vantagens:**
- Não precisa alterar código
- Compatível com ambos os nomes
- Rápido de implementar

**Desvantagens:**
- Mantém inconsistência

---

### **Opção 2: Corrigir Frontend**

Alterar todas as referências de `clients` para `customers`:

**Arquivos a modificar:**
- `src/lib/supabase.ts` (linhas 599, 615)

**Vantagens:**
- Código limpo e consistente
- Remove ambiguidade

**Desvantagens:**
- Precisa testar todas as funcionalidades

---

### **Opção 3: Padronizar Catálogo**

Decidir entre `service_catalog` ou `catalog_services` e usar apenas um:

**Se escolher `service_catalog`:**
```sql
DROP TABLE catalog_services;
-- Renomear referências
```

**Se escolher `catalog_services`:**
```sql
DROP TABLE service_catalog;
-- Atualizar frontend
```

---

## 🚨 IMPACTO ATUAL

### **Funcionalidades QUEBRADAS:**

1. ❌ **Cadastro de Clientes** (usa `clients`)
2. ❌ **Listagem de Clientes** (usa `clients`)
3. ⚠️ **Catálogo de Serviços** (usa 2 nomes diferentes)

### **Funcionalidades OK:**

1. ✅ Ordens de Serviço
2. ✅ Agenda
3. ✅ Funcionários
4. ✅ Materiais
5. ✅ Inventário
6. ✅ Endereços de Clientes
7. ✅ Contatos de Clientes
8. ✅ Equipamentos de Clientes

---

## 📝 RECOMENDAÇÃO FINAL

**IMPLEMENTAR AS 3 SOLUÇÕES:**

1. ✅ **Criar VIEW `clients`** → Solução imediata
2. ✅ **Corrigir frontend** → Longo prazo
3. ✅ **Padronizar catálogo** → Manutenibilidade

---

## 🎯 PLANO DE AÇÃO

### **Fase 1: Correção Imediata (5 min)**
```sql
-- Criar alias para clients
CREATE VIEW clients AS SELECT * FROM customers;

-- Garantir que ambas as tabelas de catálogo existam
-- (já existem)
```

### **Fase 2: Correção de Código (10 min)**
- Substituir `clients` por `customers` em `supabase.ts`
- Padronizar uso de `service_catalog`

### **Fase 3: Teste (15 min)**
- Testar cadastro de cliente
- Testar listagem de cliente
- Testar catálogo de serviços

---

## 📊 ESTATÍSTICAS

- **Total de tabelas no banco:** 52
- **Tabelas usadas pelo frontend:** 18
- **Conflitos críticos:** 1 (`clients`)
- **Inconsistências:** 1 (`catalog_services` vs `service_catalog`)
- **Taxa de compatibilidade:** 94.4% (17/18 OK)

---

## ✅ PRÓXIMO PASSO

**Implementar VIEW `clients` + Corrigir frontend**
