# 🗺️ Mapeamento Completo: Frontend ↔ Database

## ✅ CORREÇÕES APLICADAS

### 1. VIEW `clients` Criada
```sql
CREATE VIEW clients AS SELECT * FROM customers;
```
✅ Frontend pode usar `clients` ou `customers`

---

## 📊 CATÁLOGO DE SERVIÇOS - DUAS TABELAS DIFERENTES!

### **service_catalog** (Tabela Principal)
```
Campos:
- id, name, description, category
- base_price, estimated_duration
- active, created_at, updated_at
```

### **catalog_services** (Tabela Completa)
```
Campos:
- id, code, name, description, category
- base_price, estimated_hours, complexity
- requires_certification, active
- created_at, updated_at
```

### ⚠️ Diferenças:
- `catalog_services` tem mais campos (code, complexity, requires_certification)
- `service_catalog` tem `estimated_duration` (numeric)
- `catalog_services` tem `estimated_hours` (numeric)

---

## 🎯 RECOMENDAÇÃO

**Usar `service_catalog` como padrão** porque:
1. É mais simples
2. Nome mais descritivo (service_catalog)
3. Frontend já está usando em vários lugares

**OU**

**Consolidar em uma tabela única** e migrar dados

---

## 📋 TABELAS PRINCIPAIS E SUAS RELAÇÕES

### **Clientes**
- ✅ `customers` (real)
- ✅ `clients` (VIEW → customers)

### **Ordens de Serviço**
- ✅ `service_orders`
- ✅ `orders`

### **Itens de Ordem**
- ✅ `service_order_items`
- ✅ `order_items`

### **Equipe da Ordem**
- ✅ `service_order_team`
- ✅ `order_staff`

### **Funcionários**
- ✅ `employees`
- ✅ `staff`

### **Materiais**
- ✅ `materials`

### **Estoque**
- ✅ `inventory_items`
- ✅ `inventory_movements`

### **Agenda**
- ✅ `agenda`

### **Financeiro**
- ✅ `finance_entries`
- ✅ `financial_transactions`
- ✅ `financial_categories`

### **Catálogo**
- ⚠️ `service_catalog`
- ⚠️ `catalog_services`

---

## 🔧 QUERIES DO FRONTEND

### Onde está usando `clients`:
```typescript
// src/lib/supabase.ts:599
.from('clients')
.select('*')

// src/lib/supabase.ts:615
.from('clients')
.insert([clientData])
```

### Onde está usando catálogo:
```typescript
// src/lib/supabase.ts:701
.from('service_catalog')
.select('*')

// src/lib/supabase.ts:716
.from('catalog_services')
.select('*')
```

---

## ✅ STATUS DAS CORREÇÕES

| Problema | Solução | Status |
|----------|---------|---------|
| `clients` não existe | VIEW criada | ✅ RESOLVIDO |
| Dois catálogos | Usar `service_catalog` | ⚠️ PADRONIZAR |
| `orders` vs `service_orders` | Ambos existem | ✅ OK |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ **FEITO**: VIEW `clients` criada
2. 🔄 **FAZER**: Padronizar frontend para usar `service_catalog`
3. 🔄 **FAZER**: Testar inserções
4. ✅ **TESTAR**: Sistema completo

---

## 📝 COMANDOS ÚTEIS

### Verificar VIEW:
```sql
SELECT * FROM clients LIMIT 5;
```

### Contar registros:
```sql
SELECT
  (SELECT COUNT(*) FROM customers) as customers_count,
  (SELECT COUNT(*) FROM clients) as clients_count;
```

### Ver ambos os catálogos:
```sql
SELECT 'service_catalog' as source, COUNT(*) FROM service_catalog
UNION ALL
SELECT 'catalog_services', COUNT(*) FROM catalog_services;
```
