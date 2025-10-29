# ⚡ CORREÇÃO URGENTE - EXECUTE AGORA!

**Problema:** Colunas e tabelas faltando no banco
**Erros:** 404 e 400 ao salvar OS
**Status:** ✅ CORREÇÃO PRONTA

---

## 🔥 ERROS IDENTIFICADOS NO CONSOLE

```
❌ "relation \"service_orders\" does not exist" (404)
❌ "column service_catalog_1.escopo_servico does not exist" (400)
```

---

## ⚡ SOLUÇÃO URGENTE

### **EXECUTE AGORA NO SUPABASE SQL EDITOR:**

```sql
-- Cole TODO o conteúdo de:
-- 20251029230000_fix_missing_columns_urgent.sql
```

**O que vai fazer:**
1. ✅ Verificar se tabelas existem
2. ✅ Adicionar coluna `escopo_servico` em `service_catalog`
3. ✅ Adicionar coluna `escopo_detalhado` em `service_catalog`
4. ✅ Adicionar todas as colunas faltantes
5. ✅ Desabilitar RLS (desenvolvimento)
6. ✅ Conceder permissões ao anon
7. ✅ Corrigir função de cálculo

**Deve aparecer:**
```
╔════════════════════════════════════════════╗
║  CORREÇÃO URGENTE APLICADA                 ║
╠════════════════════════════════════════════╣
║  ✓ Tabelas verificadas                     ║
║  ✓ Colunas faltantes adicionadas           ║
║  ✓ RLS desabilitado (desenvolvimento)      ║
║  ✓ Permissões concedidas                   ║
║  ✓ Função de cálculo corrigida             ║
╠════════════════════════════════════════════╣
║  AGORA TESTE NO SISTEMA!                   ║
╚════════════════════════════════════════════╝
```

---

## 🚀 DEPOIS DE EXECUTAR

1. **Volte ao navegador**
2. **Recarregue a página (F5)**
3. **Tente salvar a OS novamente**
4. **Deve funcionar!** ✅

---

## 📋 COLUNAS QUE SERÃO ADICIONADAS

### **service_catalog:**
```sql
✅ escopo_servico TEXT
✅ escopo_detalhado TEXT
✅ scope TEXT
```

### **service_order_items:**
```sql
✅ escopo_detalhado TEXT
✅ total_cost DECIMAL(10,2) DEFAULT 0
```

### **service_order_materials:**
```sql
✅ unit_cost DECIMAL(10,2) DEFAULT 0
✅ total_cost DECIMAL(10,2) DEFAULT 0
✅ material_unit TEXT DEFAULT 'un'
```

### **service_order_labor:**
```sql
✅ total_cost DECIMAL(10,2) DEFAULT 0
✅ nome_funcionario TEXT
```

---

## ✅ CHECKLIST

```
☐ Abrir Supabase SQL Editor
☐ Colar SQL da migration
☐ Executar (Run)
☐ Ver mensagem de sucesso
☐ Voltar ao navegador
☐ Recarregar página (F5)
☐ Tentar salvar OS
☐ Confirmar: FUNCIONOU! ✅
```

---

**EXECUTE AGORA! ⚡**
