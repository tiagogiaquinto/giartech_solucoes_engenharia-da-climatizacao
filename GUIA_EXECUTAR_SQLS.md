# Guia: Como Executar os SQLs no Supabase

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Projeto criado no Supabase
- Banco de dados já existente com tabelas base

---

## 🚀 Passo a Passo

### **Passo 1: Acessar o SQL Editor**

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. No menu lateral esquerdo, clique em **"SQL Editor"**
3. Clique em **"New Query"** para criar uma nova consulta

### **Passo 2: Copiar o Arquivo SQL**

1. Abra o arquivo `SQLS_SUPABASE.sql` no seu editor
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase

### **Passo 3: Executar por Seções**

**IMPORTANTE:** Não execute tudo de uma vez! Execute em blocos:

#### **Bloco 1: Bucket de Avatars**
```sql
-- Copie e execute apenas a seção 1
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- E as políticas
CREATE POLICY "Avatars são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
-- ... (resto das políticas)
```

**✅ Verificar:** Vá em Storage → Buckets e confirme que o bucket "avatars" aparece

---

#### **Bloco 2: Coluna Avatar em Users**
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar text;
  END IF;
END $$;
```

**✅ Verificar:** Execute:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'avatar';
```
Deve retornar 1 linha.

---

#### **Bloco 3: Tabela service_order_items**
```sql
-- Copie toda a seção 3 do arquivo
CREATE TABLE IF NOT EXISTS service_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  -- ... resto da tabela
);

ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
-- ... resto da seção
```

**✅ Verificar:** Execute:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'service_order_items';
```
Deve retornar 1 linha.

---

#### **Bloco 4: Tabela service_order_team**
```sql
-- Copie toda a seção 4
CREATE TABLE IF NOT EXISTS service_order_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE NOT NULL,
  -- ... resto da tabela
);
```

**✅ Verificar:** Execute:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'service_order_team';
```
Deve retornar 1 linha.

---

#### **Bloco 5: Novos Campos em service_orders**
```sql
DO $$
BEGIN
  -- show_value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_orders' AND column_name = 'show_value'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN show_value boolean DEFAULT true;
  END IF;
  -- ... resto dos campos
END $$;
```

**✅ Verificar:** Execute:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'service_orders'
  AND column_name IN ('show_value', 'total_estimated_duration', 'generated_contract');
```
Deve retornar 3 linhas.

---

#### **Bloco 6: Função de Cálculo**
```sql
CREATE OR REPLACE FUNCTION calculate_service_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_orders
  SET
    total_value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM service_order_items
      WHERE service_order_id = NEW.service_order_id
    ),
    -- ... resto da função
  WHERE id = NEW.service_order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**✅ Verificar:** Execute:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'calculate_service_order_totals';
```
Deve retornar 1 linha.

---

#### **Bloco 7: Triggers**
```sql
-- Copie toda a seção 7
DROP TRIGGER IF EXISTS trigger_calculate_totals_on_insert ON service_order_items;
CREATE TRIGGER trigger_calculate_totals_on_insert
  AFTER INSERT ON service_order_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_order_totals();
-- ... resto dos triggers
```

**✅ Verificar:** Execute:
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'service_order_items';
```
Deve retornar 3 triggers.

---

### **Passo 4: Executar Verificações Finais**

Copie e execute toda a **Seção 8** do arquivo SQL:

```sql
-- Verificar se as tabelas foram criadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('service_order_items', 'service_order_team')
ORDER BY table_name;
```

**Resultado Esperado:**
```
table_name            | column_count
----------------------|-------------
service_order_items   | 9
service_order_team    | 5
```

```sql
-- Verificar novos campos em service_orders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'service_orders'
  AND column_name IN ('show_value', 'total_estimated_duration', 'generated_contract')
ORDER BY column_name;
```

**Resultado Esperado:**
```
column_name              | data_type | is_nullable | column_default
-------------------------|-----------|-------------|---------------
generated_contract       | text      | YES         | NULL
show_value              | boolean   | YES         | true
total_estimated_duration | integer   | YES         | 0
```

---

## 🔍 Checklist de Verificação

Execute esta checklist para confirmar que tudo foi criado:

- [ ] **Bucket avatars existe** (Storage → Buckets)
- [ ] **Tabela service_order_items existe** (9 colunas)
- [ ] **Tabela service_order_team existe** (5 colunas)
- [ ] **Coluna users.avatar existe**
- [ ] **Coluna service_orders.show_value existe**
- [ ] **Coluna service_orders.total_estimated_duration existe**
- [ ] **Coluna service_orders.generated_contract existe**
- [ ] **Função calculate_service_order_totals existe**
- [ ] **3 triggers em service_order_items existem**
- [ ] **Índices criados** (4 índices)

---

## 🧪 Testar as Funcionalidades

### **Teste 1: Adicionar Itens a uma OS**

```sql
-- 1. Pegar IDs necessários
SELECT id, order_number FROM service_orders LIMIT 1;
SELECT id, name, base_price FROM service_catalog LIMIT 2;

-- 2. Inserir itens (SUBSTITUA os UUIDs)
INSERT INTO service_order_items (
  service_order_id,
  service_catalog_id,
  quantity,
  unit_price,
  total_price,
  estimated_duration
) VALUES
  ('UUID-DA-OS-AQUI', 'UUID-SERVICO-1-AQUI', 2, 350.00, 700.00, 180),
  ('UUID-DA-OS-AQUI', 'UUID-SERVICO-2-AQUI', 1, 180.00, 180.00, 90);

-- 3. Verificar se os totais foram calculados automaticamente
SELECT
  order_number,
  total_value, -- Deve ser 880.00
  total_estimated_duration -- Deve ser 450 (7h 30min)
FROM service_orders
WHERE id = 'UUID-DA-OS-AQUI';
```

**✅ Esperado:**
- `total_value` = 880.00
- `total_estimated_duration` = 450

---

### **Teste 2: Adicionar Equipe a uma OS**

```sql
-- 1. Pegar IDs
SELECT id, order_number FROM service_orders LIMIT 1;
SELECT id, name FROM employees LIMIT 2;

-- 2. Inserir equipe (SUBSTITUA os UUIDs)
INSERT INTO service_order_team (
  service_order_id,
  employee_id,
  role
) VALUES
  ('UUID-DA-OS-AQUI', 'UUID-FUNCIONARIO-1-AQUI', 'leader'),
  ('UUID-DA-OS-AQUI', 'UUID-FUNCIONARIO-2-AQUI', 'technician');

-- 3. Verificar equipe
SELECT
  sot.role,
  e.name as employee_name
FROM service_order_team sot
JOIN employees e ON e.id = sot.employee_id
WHERE sot.service_order_id = 'UUID-DA-OS-AQUI';
```

**✅ Esperado:**
Lista com 2 funcionários e seus papéis.

---

### **Teste 3: Testar Cálculo Automático**

```sql
-- 1. Atualizar quantidade de um item
UPDATE service_order_items
SET quantity = 3, total_price = 1050.00
WHERE service_order_id = 'UUID-DA-OS-AQUI'
  AND service_catalog_id = 'UUID-SERVICO-1-AQUI';

-- 2. Verificar se total foi recalculado
SELECT
  order_number,
  total_value, -- Deve ser 1230.00 (1050 + 180)
  total_estimated_duration
FROM service_orders
WHERE id = 'UUID-DA-OS-AQUI';
```

**✅ Esperado:**
- `total_value` atualizado automaticamente

---

### **Teste 4: Toggle Mostrar Valor**

```sql
-- 1. Ocultar valores de uma OS
UPDATE service_orders
SET show_value = false
WHERE id = 'UUID-DA-OS-AQUI';

-- 2. Verificar
SELECT order_number, show_value
FROM service_orders
WHERE id = 'UUID-DA-OS-AQUI';
```

**✅ Esperado:**
- `show_value` = false

---

## ❌ Resolução de Problemas

### **Erro: "relation does not exist"**

**Problema:** Tabela não foi criada ainda.

**Solução:**
1. Execute novamente a seção CREATE TABLE
2. Verifique se não há erros de sintaxe
3. Confirme que você está no projeto correto

---

### **Erro: "column already exists"**

**Problema:** Você está tentando criar uma coluna que já existe.

**Solução:**
1. Isso é normal! O código usa `IF NOT EXISTS`
2. Se usar `ALTER TABLE` direto, ignore o erro
3. Ou execute a versão com `DO $$ BEGIN ... END $$;`

---

### **Erro: "function already exists"**

**Problema:** Função já foi criada antes.

**Solução:**
1. Use `CREATE OR REPLACE FUNCTION` (já está no script)
2. Ou execute `DROP FUNCTION nome_funcao CASCADE` antes

---

### **Erro: "trigger already exists"**

**Problema:** Trigger já existe.

**Solução:**
1. Execute `DROP TRIGGER IF EXISTS nome_trigger ON tabela;` antes
2. O script já faz isso automaticamente

---

### **Erro: "permission denied"**

**Problema:** Falta de permissões.

**Solução:**
1. Confirme que você está logado como admin/owner do projeto
2. Vá em Settings → Database e verifique suas permissões
3. Execute via SQL Editor (não via CLI)

---

### **Erro no Storage: "bucket not found"**

**Problema:** Bucket avatars não foi criado.

**Solução Alternativa (Via Dashboard)**:
1. Vá em **Storage** → **Buckets**
2. Clique em **"New Bucket"**
3. Preencha:
   - **Name:** avatars
   - **Public:** ✅ Sim
   - **File size limit:** 2 MB
   - **Allowed MIME types:** image/jpeg, image/png, image/gif
4. Clique em **"Create bucket"**

Depois, execute as políticas via SQL:
```sql
CREATE POLICY "Avatars são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
-- ... resto das políticas
```

---

## 📊 Query Útil: Ver Tudo Criado

Execute para ver um resumo completo:

```sql
-- Tabelas criadas
SELECT 'TABELAS' as tipo, table_name as nome
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('service_order_items', 'service_order_team')

UNION ALL

-- Colunas adicionadas
SELECT 'COLUNA', CONCAT(table_name, '.', column_name)
FROM information_schema.columns
WHERE (table_name = 'service_orders' AND column_name IN ('show_value', 'total_estimated_duration', 'generated_contract'))
   OR (table_name = 'users' AND column_name = 'avatar')

UNION ALL

-- Funções criadas
SELECT 'FUNÇÃO', routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%service_order%'

UNION ALL

-- Triggers criados
SELECT 'TRIGGER', trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'service_order_items'

UNION ALL

-- Buckets criados
SELECT 'BUCKET', id::text
FROM storage.buckets
WHERE id = 'avatars';
```

**Resultado Esperado:** ~13 linhas

---

## ✅ Conclusão

Após executar todos os blocos e verificações:

1. ✅ Bucket de avatars configurado
2. ✅ 2 novas tabelas criadas
3. ✅ 4 novas colunas adicionadas
4. ✅ 2 funções criadas
5. ✅ 4 triggers funcionando
6. ✅ 4 índices otimizando queries
7. ✅ Políticas RLS configuradas

**O sistema está pronto para uso!** 🚀

Se tiver qualquer erro, consulte a seção "Resolução de Problemas" acima.
