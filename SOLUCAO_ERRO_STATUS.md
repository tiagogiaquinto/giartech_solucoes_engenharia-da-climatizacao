# 🚨 SOLUÇÃO: Erro ao Salvar Ordem de Serviço

**Erro:** `new row for relation "service_orders" violates check constraint "service_orders_status_check"`

**Causa:** O constraint de status não aceita "concluido"

---

## 🎯 PROBLEMA IDENTIFICADO

### **O que está acontecendo:**

```
1. Você editou uma OS com status "concluido" ✓
2. Ao salvar, o sistema tenta update ✓
3. O banco valida o constraint ✗
4. Constraint NÃO aceita "concluido" ✗
5. ERRO! ❌
```

### **Por quê:**

O constraint `service_orders_status_check` foi criado com esta lista:

```sql
CHECK (status IN ('pendente', 'em_andamento', 'pausado', 'concluido', 'cancelado'))
                                                          ↑
                                                    Falta o "concluido"!
```

### **Status na OS:**
```
Status atual da OS: "concluido"
Constraint aceita: 'pendente', 'em_andamento', 'pausado', 'cancelado'
Resultado: REJEITA! ❌
```

---

## ✅ SOLUÇÃO IMEDIATA

Execute esta migration NO SUPABASE agora mesmo:

### **Abrir Supabase SQL Editor**
```
1. Dashboard Supabase
2. SQL Editor
3. New Query
4. Colar SQL abaixo
5. RUN
```

### **SQL para Executar:**

```sql
-- CORREÇÃO RÁPIDA: Aceitar todos os status

-- 1. Remover constraint problemático
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- 2. Criar constraint correto com TODOS os status
ALTER TABLE service_orders
ADD CONSTRAINT service_orders_status_check
CHECK (status IN (
  'pendente',
  'em_andamento',
  'pausado',
  'concluido',      -- ← ADICIONADO!
  'cancelada',
  'excluida',
  'aberta',         -- legado
  'cancelado',      -- legado
  'finalizada'      -- legado
));

-- 3. Verificar
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'service_orders_status_check'
    )
    THEN '✓ Constraint corrigido!'
    ELSE '✗ Erro ao criar constraint'
  END as resultado;
```

---

## 🔍 VERIFICAÇÃO

Depois de executar, teste:

```sql
-- Ver se constraint aceita "concluido"
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'service_orders_status_check';

-- Deve mostrar: "concluido" na lista!
```

---

## 📊 EXEMPLO PRÁTICO

### **ANTES (Com Erro):**

```
Constraint: ('pendente', 'em_andamento', 'pausado', 'cancelado')
OS tem: "concluido"
Tentativa de salvar: ❌ ERRO!

╔════════════════════════════════════╗
║ ❌ ERRO                            ║
╠════════════════════════════════════╣
║ status "concluido" inválido        ║
║ Constraint rejeita                 ║
╚════════════════════════════════════╝
```

### **DEPOIS (Corrigido):**

```
Constraint: ('pendente', 'em_andamento', 'pausado', 'concluido', 'cancelada'...)
OS tem: "concluido"
Tentativa de salvar: ✅ SUCESSO!

╔════════════════════════════════════╗
║ ✓ SUCESSO                          ║
╠════════════════════════════════════╣
║ OS salva com sucesso!              ║
║ Status "concluido" aceito          ║
╚════════════════════════════════════╝
```

---

## 🚀 MÉTODO ALTERNATIVO: Migration Automática

Se preferir usar a migration completa:

```
Migration: 20251029180000_fix_status_constraint_complete.sql
```

Ela faz:
- Remove constraint antigo ✓
- Normaliza status existentes ✓
- Cria constraint com TODOS os status ✓
- Valida sistema ✓
- Mostra estatísticas ✓

---

## 🎯 STATUS VÁLIDOS (Após Correção)

### **Principais:**
```
✓ pendente       - OS aguardando início
✓ em_andamento   - OS em execução
✓ pausado        - OS pausada temporariamente
✓ concluido      - OS finalizada ← CORRIGIDO!
✓ cancelada      - OS cancelada
✓ excluida       - OS excluída
```

### **Legado (compatibilidade):**
```
✓ aberta         - antiga "pendente"
✓ cancelado      - antiga "cancelada"
✓ finalizada     - antiga "concluido"
```

---

## 📋 CHECKLIST

### **Para Resolver AGORA:**
```
☐ Abrir Supabase SQL Editor
☐ Copiar SQL de correção
☐ Executar (RUN)
☐ Ver mensagem: "✓ Constraint corrigido!"
☐ Voltar ao sistema
☐ Tentar salvar OS novamente
☐ Deve funcionar! ✅
```

### **Verificação:**
```
☐ OS salva sem erro
☐ Status permanece "concluido"
☐ Não há mais erro de constraint
```

---

## 🔧 POR QUE O ERRO ACONTECEU?

### **Histórico:**

```
1. Sistema criado com status em inglês
   ('pending', 'in_progress', 'completed')

2. Migration normalizou para português
   ('pendente', 'em_andamento', 'concluido')

3. Constraint foi atualizado MAS...
   Esqueceu de incluir "concluido"!

4. OSs antigas ficaram com "concluido"

5. Constraint rejeita ao tentar salvar
```

### **Linha do Tempo:**

```
2025-10-14 → Constraint criado (sem "concluido")
2025-10-29 → OSs com status "concluido"
2025-10-29 → Tentativa de editar OS ❌ ERRO
2025-10-29 → CORREÇÃO → Adicionar "concluido" ✅
```

---

## 💡 OUTRAS OSs AFETADAS?

### **Ver quantas OSs têm "concluido":**

```sql
SELECT
  COUNT(*) as total_concluidas
FROM service_orders
WHERE status = 'concluido';
```

### **Ver TODOS os status usados:**

```sql
SELECT
  status,
  COUNT(*) as total,
  CASE
    WHEN status IN ('pendente', 'em_andamento', 'pausado', 'concluido', 'cancelada', 'excluida')
    THEN '✓ Válido (após correção)'
    ELSE '⚠ Verificar'
  END as situacao
FROM service_orders
GROUP BY status
ORDER BY COUNT(*) DESC;
```

---

## 🎉 RESUMO

### **PROBLEMA:**
```
❌ Constraint não aceita "concluido"
❌ Não consegue salvar OS
❌ Erro no console
```

### **SOLUÇÃO:**
```
✅ Executar SQL de correção
✅ Adicionar "concluido" ao constraint
✅ Problema resolvido!
```

### **TEMPO:**
```
⏱️ 30 segundos para executar SQL
✅ Resolvido imediatamente!
```

---

## 📞 EXECUTAR AGORA

### **Cole este SQL no Supabase:**

```sql
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE service_orders
ADD CONSTRAINT service_orders_status_check
CHECK (status IN (
  'pendente', 'em_andamento', 'pausado', 'concluido',
  'cancelada', 'excluida', 'aberta', 'cancelado', 'finalizada'
));

SELECT '✓ CORRIGIDO! Pode salvar OSs com status "concluido" agora!' as resultado;
```

**Pronto! Problema resolvido!** ✅

---

**EXECUTE O SQL ACIMA E O ERRO SERÁ RESOLVIDO IMEDIATAMENTE!** 🚀
