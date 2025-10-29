# 🎯 Guia: Executar Correções do Sistema

**CNPJ da Empresa:** 37.509.897/0001-93
**Objetivo:** Configurar empresa e corrigir todas as OSs

---

## 📋 ORDEM DE EXECUÇÃO

Execute as migrations nesta ordem exata:

### **1️⃣ PRIMEIRO: Configurar CNPJ da Empresa**
```
Migration: 20251029165500_configure_company_cnpj.sql
Objetivo: Configurar CNPJ 37.509.897/0001-93 em company_settings
Tempo: ~2 segundos
```

### **2️⃣ SEGUNDO: Migrar Dados das OSs Existentes**
```
Migration: 20251029160000_migrate_existing_service_orders.sql
Objetivo: Criar itens para OSs que não têm
Tempo: ~30 segundos (dependendo da quantidade)
```

### **3️⃣ TERCEIRO: Corrigir PIX de Todas as OSs**
```
Migration: 20251029170000_fix_payment_pix_all_orders.sql
Objetivo: Atualizar payment_pix com CNPJ da empresa
Tempo: ~10 segundos (dependendo da quantidade)
```

---

## 🚀 MÉTODO 1: APLICAÇÃO AUTOMÁTICA (Recomendado)

### **As migrations serão aplicadas automaticamente quando você:**

```bash
1. Fazer push/commit do código
2. Deploy no Supabase
3. Supabase detecta novas migrations
4. Executa em ordem numérica automaticamente
5. Você vê os logs no Dashboard
```

### **Ordem automática (pelo timestamp no nome):**
```
✓ 20251029165500_configure_company_cnpj.sql         (1º)
✓ 20251029160000_migrate_existing_service_orders.sql (2º)
✓ 20251029170000_fix_payment_pix_all_orders.sql     (3º)
```

**⚠️ IMPORTANTE:** O Supabase executa migrations em ordem alfabética/numérica dos timestamps no nome do arquivo!

---

## 🖥️ MÉTODO 2: EXECUÇÃO MANUAL (SQL Editor)

Se você preferir executar manualmente ou testar antes:

### **Passo 1: Abrir Supabase Dashboard**
```
1. Acessar https://supabase.com
2. Selecionar seu projeto
3. Ir em "SQL Editor"
4. Clicar em "New Query"
```

### **Passo 2: Executar Migration 1**
```sql
-- Cole TODO o conteúdo de:
-- 20251029165500_configure_company_cnpj.sql

-- Clique em RUN (Ctrl+Enter)

-- Aguarde ver a mensagem:
╔═══════════════════════════════════════╗
║   CNPJ DA EMPRESA CONFIGURADO         ║
╠═══════════════════════════════════════╣
║   CNPJ: 37.509.897/0001-93           ║
║   Status: ✓ ATIVO                     ║
╚═══════════════════════════════════════╝
```

### **Passo 3: Validar Migration 1**
```sql
-- Verificar se CNPJ foi configurado:
SELECT
  company_name as "Empresa",
  cnpj as "CNPJ",
  email as "Email"
FROM company_settings;

-- Resultado esperado:
-- Empresa            | CNPJ              | Email
-- Giartech Soluções  | 37.509.897/0001-93| contato@giartech.com
```

### **Passo 4: Executar Migration 2**
```sql
-- Cole TODO o conteúdo de:
-- 20251029160000_migrate_existing_service_orders.sql

-- Clique em RUN

-- Aguarde mensagens como:
NOTICE: Total de OSs ativas: 15
NOTICE: OSs sem itens: 12
NOTICE: Itens criados: 12
NOTICE: MIGRAÇÃO CONCLUÍDA COM SUCESSO!
```

### **Passo 5: Validar Migration 2**
```sql
-- Ver OSs com itens criados:
SELECT
  so.order_number as "OS",
  COUNT(soi.id) as "Qtd Itens"
FROM service_orders so
LEFT JOIN service_order_items soi ON soi.service_order_id = so.id
WHERE so.status NOT IN ('cancelada', 'excluida')
GROUP BY so.order_number
ORDER BY so.created_at DESC
LIMIT 10;

-- Todas devem ter pelo menos 1 item
```

### **Passo 6: Executar Migration 3**
```sql
-- Cole TODO o conteúdo de:
-- 20251029170000_fix_payment_pix_all_orders.sql

-- Clique em RUN

-- Aguarde mensagens como:
NOTICE: CNPJ da Empresa: 37.509.897/0001-93
NOTICE: Total de OSs: 150
NOTICE: OSs atualizadas: 120
NOTICE: Percentual correto: 100%
NOTICE: ✓ SUCESSO: Todas as OSs ativas têm PIX da empresa!
```

### **Passo 7: Validar Migration 3**
```sql
-- Ver OSs com PIX corrigido:
SELECT
  order_number as "OS",
  client_name as "Cliente",
  payment_pix as "PIX (deve ser 37.509.897/0001-93)"
FROM service_orders
WHERE status NOT IN ('cancelada', 'excluida')
ORDER BY created_at DESC
LIMIT 10;

-- Todas devem ter: 37.509.897/0001-93
```

---

## ✅ VERIFICAÇÃO COMPLETA FINAL

Após executar TODAS as 3 migrations, execute esta query de verificação:

```sql
-- VERIFICAÇÃO COMPLETA DO SISTEMA
SELECT
  '1. Empresa Configurada' as verificacao,
  (SELECT cnpj FROM company_settings LIMIT 1) as resultado,
  CASE
    WHEN (SELECT cnpj FROM company_settings LIMIT 1) = '37.509.897/0001-93'
    THEN '✓ OK'
    ELSE '✗ ERRO'
  END as status

UNION ALL

SELECT
  '2. OSs com Itens' as verificacao,
  CONCAT(
    (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelada', 'excluida') AND EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = service_orders.id)),
    ' de ',
    (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelada', 'excluida'))
  ) as resultado,
  CASE
    WHEN (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelada', 'excluida') AND NOT EXISTS (SELECT 1 FROM service_order_items WHERE service_order_id = service_orders.id)) = 0
    THEN '✓ OK'
    ELSE '⚠ Revisar'
  END as status

UNION ALL

SELECT
  '3. OSs com PIX Empresa' as verificacao,
  CONCAT(
    (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelada', 'excluida') AND payment_pix = '37.509.897/0001-93'),
    ' de ',
    (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelada', 'excluida'))
  ) as resultado,
  CASE
    WHEN (SELECT COUNT(*) FROM service_orders WHERE status NOT IN ('cancelada', 'excluida') AND payment_pix != '37.509.897/0001-93') = 0
    THEN '✓ OK'
    ELSE '⚠ Revisar'
  END as status;
```

### **Resultado Esperado:**
```
verificacao           | resultado          | status
----------------------------------------------------
1. Empresa Configurada| 37.509.897/0001-93| ✓ OK
2. OSs com Itens      | 15 de 15          | ✓ OK
3. OSs com PIX Empresa| 15 de 15          | ✓ OK
```

**Se todos os status = ✓ OK → PERFEITO! Sistema 100% corrigido!**

---

## 🎯 RESUMO VISUAL

### **ANTES das Migrations:**
```
╔════════════════════════════════════════════════╗
║  company_settings                              ║
║  └── cnpj: NULL ou diferente ❌                ║
╠════════════════════════════════════════════════╣
║  service_orders                                ║
║  ├── OS-001                                    ║
║  │   ├── Items: []          ❌                 ║
║  │   └── payment_pix: cliente ❌               ║
║  ├── OS-002                                    ║
║  │   ├── Items: []          ❌                 ║
║  │   └── payment_pix: cliente ❌               ║
║  └── OS-003                                    ║
║      ├── Items: []          ❌                 ║
║      └── payment_pix: NULL  ❌                 ║
╚════════════════════════════════════════════════╝
```

### **DEPOIS das Migrations:**
```
╔════════════════════════════════════════════════╗
║  company_settings                              ║
║  └── cnpj: 37.509.897/0001-93 ✅              ║
╠════════════════════════════════════════════════╣
║  service_orders                                ║
║  ├── OS-001                                    ║
║  │   ├── Items: [1 item]    ✅                ║
║  │   └── payment_pix: 37.509.897/0001-93 ✅   ║
║  ├── OS-002                                    ║
║  │   ├── Items: [1 item]    ✅                ║
║  │   └── payment_pix: 37.509.897/0001-93 ✅   ║
║  └── OS-003                                    ║
║      ├── Items: [1 item]    ✅                ║
║      └── payment_pix: 37.509.897/0001-93 ✅   ║
╚════════════════════════════════════════════════╝
```

---

## 📊 CHECKLIST DE EXECUÇÃO

### **Antes de Começar:**
```
☐ Fazer backup do banco (recomendado)
☐ Ter acesso ao Supabase Dashboard
☐ Ler este guia completamente
☐ Escolher método (automático ou manual)
```

### **Durante Execução:**
```
☐ Migration 1: Configurar CNPJ empresa
☐ Validar Migration 1
☐ Migration 2: Migrar OSs existentes
☐ Validar Migration 2
☐ Migration 3: Corrigir PIX de todas OSs
☐ Validar Migration 3
```

### **Após Execução:**
```
☐ Executar query de verificação completa
☐ Conferir que todos status = ✓ OK
☐ Testar criar nova OS
☐ Testar gerar PDF de OS antiga
☐ Verificar PIX em ambos (37.509.897/0001-93)
```

---

## ✨ INFORMAÇÕES IMPORTANTES

### **CNPJ da Empresa:**
```
Número: 37509897000193
Formatado: 37.509.897/0001-93
Empresa: Giartech Soluções
```

### **Este CNPJ será usado em:**
```
✅ payment_pix de todas as OSs
✅ Seção de pagamento nos PDFs
✅ Dados bancários nos documentos
✅ Chave PIX nos orçamentos/propostas
```

### **Arquivos de Migration:**
```
1. 20251029165500_configure_company_cnpj.sql
2. 20251029160000_migrate_existing_service_orders.sql
3. 20251029170000_fix_payment_pix_all_orders.sql
```

---

**GUIA COMPLETO! SIGA OS PASSOS E SEU SISTEMA ESTARÁ 100% CORRIGIDO!** ✅🚀

**Todas as OSs terão o CNPJ 37.509.897/0001-93 para recebimento de pagamentos!** 💰✨
