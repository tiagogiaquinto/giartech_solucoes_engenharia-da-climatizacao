# 🔐 Credenciais de Acesso - Sistema GiarTech

## ✅ Usuários Criados e Configurados

### 🎯 Usuário Principal - Diretor

```
Email: diretor@giartechsolucoes.com.br
Senha: Giar@2024
```

**Informações:**
- **ID**: 571d31c4-b9d7-40ef-aa30-45593a05e89e
- **Nome**: Diretor GiarTech
- **Role**: admin (acesso total)
- **Status**: active
- **Email confirmado**: Sim ✅

---

### 🔧 Usuário Secundário - Admin Demo

```
Email: admin@giartech.com
Senha: admin123
```

**Informações:**
- **ID**: 99ea8ed5-b0d9-43e1-a6b4-4544dd29024f
- **Nome**: Admin GiarTech
- **Role**: admin (acesso total)
- **Status**: active
- **Email confirmado**: Sim ✅

---

## 🚀 Como Acessar o Sistema

### 🎯 Método Recomendado: Login Automático (NOVO!)
1. Abra a aplicação em seu navegador
2. **O sistema fará login automaticamente com o usuário Diretor**
3. Você será redirecionado diretamente para o dashboard
4. A sessão ficará salva - não precisará fazer login novamente!

**Obs:** Se o login automático falhar, o formulário manual será exibido.

### Método Alternativo 1: Login Manual
1. Se precisar trocar de usuário ou o login automático falhar
2. Na tela de login, os campos já estarão preenchidos com:
   - Email: `diretor@giartechsolucoes.com.br`
   - Senha: `Giar@2024`
3. Clique em "Acessar Sistema"

### Método Alternativo 2: Login com Admin Demo
1. Abra a aplicação em seu navegador
2. Na tela de login, digite:
   - Email: `admin@giartech.com`
   - Senha: `admin123`
3. Clique em "Acessar Sistema"

## ✅ O que foi Configurado

### 1. Autenticação Supabase
- ✅ 2 Usuários criados no `auth.users` (tabela de autenticação do Supabase)
- ✅ Senhas criptografadas com bcrypt
- ✅ Emails confirmados automaticamente
- ✅ Login automático habilitado (diretor@giartechsolucoes.com.br)
- ✅ Persistência de sessão ativada (você permanece logado)
- ✅ IDs vinculados à tabela `users` (perfis públicos)

### 2. Perfis dos Usuários
- ✅ Registros criados na tabela `users` (dados públicos)
- ✅ Roles definidas como 'admin'
- ✅ Status ativo para ambos
- ✅ Avatares e telefones configurados

### 3. Sistema de Autenticação
- ✅ Login com email/senha
- ✅ Sessões persistentes
- ✅ Auto-refresh de tokens
- ✅ Detecção de sessão em URL
- ✅ UserContext integrado com Supabase Auth

## 🔧 Engenharia Reversa Aplicada

O sistema foi ajustado para seguir o banco de dados existente:

### UserContext Atualizado
- Busca perfil por ID (auth.uid()) em vez de email
- Tratamento de erros melhorado
- Logs para debug
- Fallback seguro em caso de erro

### Banco de Dados
- Estrutura: 20 tabelas PostgreSQL
- RLS habilitado em todas as tabelas
- Políticas de acesso baseadas em auth.uid()
- ENUMs para validação de dados

## 📊 Níveis de Acesso

Como admin, você tem acesso a:
- ✅ **Dashboard**: Métricas e visão geral
- ✅ **Ordens de Serviço**: Criar, editar, visualizar, deletar
- ✅ **Clientes**: Gerenciar clientes PF e PJ
- ✅ **Estoque**: Controle completo de inventário
- ✅ **Financeiro**: Tarefas de cobrança, notas fiscais, pagamentos
- ✅ **Usuários**: Criar e gerenciar usuários do sistema
- ✅ **Relatórios**: Acesso a todos os relatórios
- ✅ **Configurações**: Acesso a todas as configurações

## 🐛 Solução de Problemas

### Se não conseguir fazer login:

1. **Verifique o Console do Navegador**
   - Abra as Ferramentas de Desenvolvedor (F12)
   - Vá para a aba "Console"
   - Procure por mensagens de erro em vermelho

2. **Verifique se o Supabase está conectado**
   - Abra o arquivo `.env`
   - Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão preenchidos

3. **Limpe o Cache e Cookies**
   - Ctrl+Shift+Delete
   - Limpe os dados de navegação
   - Tente fazer login novamente

4. **Reinicie o Servidor de Desenvolvimento**
   ```bash
   # Pare o servidor atual (Ctrl+C)
   # Inicie novamente
   npm run dev
   ```

### Se aparecer erro "No user profile found":

Execute este SQL no Supabase SQL Editor:

```sql
-- Verificar usuários no auth.users
SELECT id, email FROM auth.users WHERE email IN (
  'diretor@giartechsolucoes.com.br',
  'admin@giartech.com'
);

-- Verificar perfis na tabela users
SELECT id, email, name, role FROM users WHERE email IN (
  'diretor@giartechsolucoes.com.br',
  'admin@giartech.com'
);
```

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt (não armazenadas em texto puro)
- ✅ Tokens JWT com auto-refresh
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Políticas de acesso baseadas em auth.uid()
- ✅ HTTPS obrigatório em produção

## 📞 Suporte

Se continuar tendo problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do servidor (terminal onde rodou `npm run dev`)
3. Verifique se há erros de rede na aba "Network" das ferramentas de desenvolvedor
4. Certifique-se de que o banco de dados Supabase está online

---

## 🎯 Status Atual

- ✅ 2 Usuários admin criados no auth.users
- ✅ Perfis criados na tabela users
- ✅ IDs sincronizados entre as tabelas
- ✅ Emails confirmados
- ✅ UserContext ajustado para buscar por ID
- ✅ Sistema pronto para login

**O sistema está 100% funcional e pronto para uso!** 🚀

---

## 👥 Resumo de Usuários

| Email | Senha | Role | Status |
|-------|-------|------|--------|
| **diretor@giartechsolucoes.com.br** | **Giar@2024** | admin | ✅ Ativo |
| admin@giartech.com | admin123 | admin | ✅ Ativo |

**✨ Recomendação**: Use o usuário `diretor@giartechsolucoes.com.br` para acesso principal ao sistema.

---

**Data de Criação**: 04/10/2025
**Última Atualização**: 04/10/2025 17:35 UTC
**Status**: ✅ Sistema com login automático e persistência de sessão
