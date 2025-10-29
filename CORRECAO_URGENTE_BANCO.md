# 🚨 CORREÇÃO URGENTE: Erros no Banco de Dados

**Erros Identificados:**
1. ❌ `relation "service_orders" does not exist`
2. ❌ `Could not find 'unit_cost' column in service_order_materials`

---

## 🚀 SOLUÇÃO RÁPIDA (30 Segundos)

Execute este SQL NO SUPABASE AGORA:

```sql
-- Adicionar colunas faltantes em service_order_materials
ALTER TABLE service_order_materials
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_unit TEXT DEFAULT 'un',
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;

-- Adicionar colunas calculadas
ALTER TABLE service_order_materials
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) GENERATED ALWAYS AS (unit_cost * quantity) STORED,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED;

-- Adicionar colunas em service_order_labor
ALTER TABLE service_order_labor
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hours DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hourly_rate * hours) STORED,
ADD COLUMN IF NOT EXISTS nome_funcionario TEXT;

-- Adicionar colunas em service_order_items
ALTER TABLE service_order_items
ADD COLUMN IF NOT EXISTS escopo_detalhado TEXT,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- Verificar
SELECT '✅ COLUNAS ADICIONADAS!' as resultado;
```

---

## ✅ DEPOIS DE EXECUTAR

Recarregue a página e tente salvar a OS novamente.

---

## 🔍 SE NÃO FUNCIONAR

### **Problema: "relation service_orders does not exist"**

Isso significa que a tabela principal não existe. Execute:

```sql
-- Verificar se a tabela existe:
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'service_orders';

-- Se retornar vazio, você precisa executar as migrations básicas primeiro!
```

### **Se a tabela não existe, execute:**

```sql
-- Listar todas as tabelas:
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Procurar por variações do nome:
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%order%';
```

---

## 📋 CHECKLIST

```
☐ Abrir Supabase SQL Editor
☐ Executar SQL de correção
☐ Ver mensagem "✅ COLUNAS ADICIONADAS!"
☐ Voltar ao sistema
☐ Recarregar página (F5)
☐ Tentar salvar OS novamente
☐ Deve funcionar! ✅
```

---

**EXECUTE O SQL ACIMA AGORA!** 🚀
