# Guia: Como Ativar Acesso ao Sistema

## 🎯 Objetivo
Permitir que usuários criados no banco de dados façam login no sistema.

---

## ✅ MÉTODO RÁPIDO (5 minutos)

### Passo 1: Criar Usuário no Supabase Dashboard

1. Abra https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Authentication** → **Users**
4. Clique em **"Add User"** → **"Create new user"**
5. Preencha:
   - **Email:** admin@giartech.com
   - **Password:** Admin@123
   - **Auto Confirm User:** ✅ **MARQUE ISSO!**
6. Clique em **"Create user"**
7. **COPIE O UUID** do usuário criado (clique no usuário para ver)

### Passo 2: Adicionar na Tabela Users (SQL)

1. Vá em **SQL Editor** → **New Query**
2. Cole este SQL (SUBSTITUA o UUID):

```sql
INSERT INTO users (id, name, email, role, status)
VALUES (
  'COLE-O-UUID-AQUI',  -- UUID copiado do passo anterior
  'Administrador',
  'admin@giartech.com',
  'admin',
  'active'
);
```

3. Clique em **RUN**

### Passo 3: Fazer Login

1. Acesse seu sistema
2. Email: `admin@giartech.com`
3. Senha: `Admin@123`
4. Pronto! ✅

---

## 🔐 Credenciais Criadas

```
Email:    admin@giartech.com
Senha:    Admin@123
Papel:    Administrador
Acesso:   Total (todos os módulos)
```

---

## 👥 Criar Mais Usuários

Repita o processo acima com diferentes emails:

### Técnico
```
Email: tecnico@giartech.com
Role:  'technician'
```

### Funcionário Externo
```
Email: externo@giartech.com
Role:  'external'
```

---

## ❌ Resolução de Problemas

### "Invalid login credentials"

**Solução:**
1. Verifique em Authentication → Users se o email existe
2. Verifique se marcou "Auto Confirm User"
3. Se não marcou, confirme manualmente

### "User not found"

**Solução:**
```sql
-- Verificar se está na tabela
SELECT * FROM users WHERE email = 'admin@giartech.com';

-- Se não estiver, inserir de novo
INSERT INTO users (id, name, email, role, status)
VALUES ('UUID-DO-AUTH', 'Nome', 'email@email.com', 'admin', 'active');
```

### UUID Não Bate

**Solução:**
Os IDs devem ser IGUAIS no Auth e na tabela users!

```sql
-- Ver UUID do Auth
-- Vá em Authentication → Users → Clique no usuário

-- Atualizar na tabela se necessário
UPDATE users
SET id = 'UUID-CORRETO'
WHERE email = 'admin@giartech.com';
```

---

## 🧪 Verificar Se Funcionou

Execute este SQL:

```sql
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.status
FROM users u
WHERE u.email = 'admin@giartech.com';
```

**Resultado esperado:**
- 1 linha retornada
- Role: admin
- Status: active

---

## 📊 Ver Todos os Usuários

```sql
SELECT
  id,
  name,
  email,
  role,
  status,
  created_at
FROM users
ORDER BY created_at DESC;
```

---

## 🎉 Tudo Pronto!

Agora você pode:
- ✅ Fazer login com admin@giartech.com
- ✅ Acessar todos os módulos (é admin)
- ✅ Criar mais usuários pelo sistema
- ✅ Gerenciar permissões

---

## 🔑 Trocar Senha

Se quiser trocar a senha do admin:

1. Authentication → Users
2. Encontre admin@giartech.com
3. Clique nos 3 pontinhos (...)
4. "Send password recovery"
5. OU defina nova senha manualmente

---

## 📌 Importante

- Sempre crie **primeiro no Auth**, depois na tabela
- IDs devem ser **iguais** em ambos
- **Marque "Auto Confirm"** sempre
- Role **'admin'** dá acesso total
- Status deve ser **'active'**

---

**Pronto para usar o sistema!** 🚀
