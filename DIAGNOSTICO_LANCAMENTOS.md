# 🔍 Diagnóstico: Lançamentos não estão sendo salvos

## ✅ O QUE FOI VERIFICADO

### **1. Banco de Dados** ✅
- Tabela `financial_transactions` existe
- Políticas RLS estão corretas
- Teste de inserção SQL funcionou

### **2. Código Frontend** ✅
- Lógica de inserção está correta
- Campos obrigatórios estão sendo validados

---

## 🐛 ADICIONADO LOGS DE DEBUG

Adicionei logs detalhados no código para identificar o erro exato:

```typescript
console.log('💾 Salvando lançamento:', transactionData)
// ... código de inserção ...
console.log('✅ Inserido com sucesso:', data)
// OU
console.error('❌ Erro ao inserir:', error)
```

---

## 🔧 COMO DIAGNOSTICAR

### **Passo 1: Abrir Console do Navegador**

1. Pressione `F12` (Chrome/Edge) ou `Cmd+Option+I` (Mac)
2. Vá na aba **Console**
3. Deixe aberto

### **Passo 2: Tentar Criar um Lançamento**

1. Vá em **Gestão Financeira**
2. Clique no botão **"+ Novo Lançamento"**
3. Preencha os campos:
   - Descrição
   - Valor
   - Tipo (Receita/Despesa)
   - Categoria
   - Data
4. Clique em **Salvar**

### **Passo 3: Ver Logs no Console**

Você verá um destes cenários:

#### **Cenário A - Sucesso** ✅
```
💾 Salvando lançamento: {description: "...", amount: 100, ...}
✅ Inserido com sucesso: [{id: "...", description: "...", ...}]
```
**Ação:** Nenhuma! Está funcionando!

#### **Cenário B - Erro de Autenticação** ❌
```
❌ Erro ao inserir: {code: "401", message: "JWT expired"}
```
**Solução:** Fazer logout e login novamente

#### **Cenário C - Erro de Permissão** ❌
```
❌ Erro ao inserir: {code: "42501", message: "new row violates row-level security policy"}
```
**Solução:** Executar SQL para corrigir políticas RLS

#### **Cenário D - Erro de Validação** ❌
```
❌ Erro ao inserir: {code: "23502", message: "null value in column ... violates not-null constraint"}
```
**Solução:** Campo obrigatório faltando

#### **Cenário E - Erro de Foreign Key** ❌
```
❌ Erro ao inserir: {code: "23503", message: "insert or update on table ... violates foreign key constraint"}
```
**Solução:** Categoria/Conta/Cliente/Fornecedor não existe

---

## 🔨 SOLUÇÕES RÁPIDAS

### **Solução 1: Logout e Login**

Se o erro for de autenticação:
```
1. Canto superior direito → Logout
2. Fazer login novamente
3. Tentar salvar lançamento
```

### **Solução 2: Verificar Categorias**

Se não tem categorias cadastradas:

```sql
-- Inserir categorias básicas
INSERT INTO financial_categories (name, type, color, icon) VALUES
  ('Vendas', 'receita', '#10B981', 'DollarSign'),
  ('Serviços', 'receita', '#3B82F6', 'Briefcase'),
  ('Materiais', 'despesa', '#EF4444', 'Package'),
  ('Salários', 'despesa', '#F59E0B', 'Users')
ON CONFLICT DO NOTHING;
```

### **Solução 3: Corrigir Políticas RLS**

Se erro de permissão:

```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem criar transações" ON financial_transactions;

-- Criar política correta
CREATE POLICY "Usuários autenticados podem criar transações"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verificar
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'financial_transactions' AND cmd = 'INSERT';
```

### **Solução 4: Verificar Conta Bancária**

Se campo account_id está obrigatório:

```sql
-- Tornar account_id opcional
ALTER TABLE financial_transactions
ALTER COLUMN account_id DROP NOT NULL;
```

### **Solução 5: Limpar Cache do Navegador**

```
1. Pressione Ctrl+Shift+Delete (Chrome/Edge)
2. Selecione "Todo o período"
3. Marque:
   - Cookies e dados de sites
   - Imagens e arquivos em cache
4. Limpar dados
5. Recarregar página (F5)
```

---

## 🧪 TESTE RÁPIDO

Execute este SQL para ver se as transações estão sendo salvas:

```sql
-- Ver últimas 5 transações
SELECT
  id,
  description,
  amount,
  type,
  created_at,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM financial_transactions
ORDER BY created_at DESC
LIMIT 5;
```

Se aparecer a transação que você tentou criar, **ESTÁ SALVANDO!**

O problema pode ser apenas visual (não está recarregando a lista).

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Execute na ordem:

- [ ] Console do navegador aberto
- [ ] Tentei criar lançamento
- [ ] Vi logs no console
- [ ] Identifiquei o erro específico
- [ ] Executei a solução correspondente
- [ ] Fiz logout/login
- [ ] Tentei novamente
- [ ] Funcionou!

---

## 🔍 ERROS COMUNS E SOLUÇÕES

### **Erro: "Preencha todos os campos obrigatórios"**

**Causa:** Campos em branco

**Solução:**
- Descrição (obrigatório)
- Valor (obrigatório)
- Categoria (obrigatório)
- Data (já vem preenchida)

### **Erro: "JWT expired" ou "Invalid token"**

**Causa:** Sessão expirou

**Solução:**
```
1. Logout
2. Login novamente
3. Tentar salvar
```

### **Erro: "Category not found" ou "foreign key constraint"**

**Causa:** Categoria não existe

**Solução:**
```sql
-- Listar categorias
SELECT id, name, type FROM financial_categories;

-- Se vazio, criar categorias
INSERT INTO financial_categories (name, type, color) VALUES
  ('Receita Geral', 'receita', '#10B981'),
  ('Despesa Geral', 'despesa', '#EF4444');
```

### **Erro: Nenhuma mensagem, não salva**

**Causa:** JavaScript desabilitado ou erro silencioso

**Solução:**
1. Abrir Console (F12)
2. Ver se há erros em vermelho
3. Copiar erro e enviar

---

## 💡 TESTE MANUAL NO BANCO

Para ter certeza que o banco funciona:

```sql
-- Pegar ID de uma categoria
DO $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT id INTO cat_id FROM financial_categories LIMIT 1;

  -- Inserir manualmente
  INSERT INTO financial_transactions (
    description,
    amount,
    type,
    category_id,
    date,
    payment_method,
    status
  ) VALUES (
    'TESTE MANUAL',
    500.00,
    'income',
    cat_id,
    CURRENT_DATE,
    'money',
    'paid'
  );

  RAISE NOTICE 'Inserido com sucesso!';
END $$;

-- Verificar
SELECT * FROM financial_transactions
WHERE description = 'TESTE MANUAL';
```

Se isso funcionar, o problema é no frontend!

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Abrir console
2. ✅ Tentar criar lançamento
3. ✅ Copiar mensagem de erro EXATA
4. ✅ Enviar para mim

**Com a mensagem de erro, posso corrigir em 5 minutos!**

---

## 📞 INFORMAÇÕES PARA SUPORTE

Se pedir ajuda, envie:

1. **Mensagem de erro do console** (print ou copiar texto)
2. **Dados que tentou inserir**:
   - Descrição
   - Valor
   - Tipo
   - Categoria selecionada
3. **URL atual** (exemplo: `/financial-management`)
4. **Usuário logado** (email)

---

## ✅ BUILD

Sistema compilado com sucesso incluindo logs de debug.

**Próximo passo:** Abrir console e tentar criar lançamento para ver o erro exato!
