# ⚡ GUIA RÁPIDO: CONFIGURAR RECEBIMENTO DE EMAILS COM ZAPIER

## 🎯 O QUE VOCÊ VAI CONSEGUIR

Após seguir este guia:
- ✅ Receber emails EXTERNOS reais no sistema
- ✅ Emails aparecem na Caixa de Entrada automaticamente
- ✅ Sincronização a cada 5-15 minutos
- ✅ 100% funcional e gratuito (até 100 emails/mês)

---

## 📋 PRÉ-REQUISITOS

```
✅ Conta Zapier (criar grátis em zapier.com)
✅ Email configurado: diretor@giartechsolucoes.com.br
✅ Senha do email (mesma do webmail/SMTP)
✅ URL do Supabase
✅ Chave Anon do Supabase
```

---

## 🚀 PASSO A PASSO (10 MINUTOS)

### **1. CRIAR CONTA NO ZAPIER**

```
1. Acesse: https://zapier.com
2. Clique: "Sign Up" (Criar conta)
3. Use: Email pessoal ou Gmail
4. Confirme email
5. Login
```

---

### **2. CRIAR NOVO ZAP**

```
1. No painel, clique: "+ Create Zap"
2. Nome do Zap: "Giartech - Receber Emails"
3. Continue
```

---

### **3. CONFIGURAR TRIGGER (Emails Recebidos)**

#### **3.1. Escolher App:**
```
Search: "Email"
Selecione: "Email by Zapier"
```

#### **3.2. Escolher Evento:**
```
Trigger Event: "New Inbound Email"
Continue
```

#### **3.3. Configurar Conta IMAP:**
```
Clique: "Sign in to Email by Zapier"

Preencha:
┌────────────────────────────────────────────┐
│ Email Account Setup                        │
├────────────────────────────────────────────┤
│ Email Type: IMAP                          │
│                                            │
│ IMAP Host: mail.giartechsolucoes.com.br  │
│ IMAP Port: 993                            │
│ Username: diretor@giartechsolucoes.com.br │
│ Password: [sua-senha-do-email]            │
│ Use SSL: Yes (✓)                          │
│ Folder: INBOX                             │
└────────────────────────────────────────────┘

Clique: "Yes, Continue"
```

#### **3.4. Testar Trigger:**
```
Zapier vai tentar buscar um email de teste

IMPORTANTE: Envie um email de teste agora!
  - Do seu Gmail pessoal
  - Para: diretor@giartechsolucoes.com.br
  - Assunto: "Teste Zapier"
  - Corpo: "Email de teste"

Aguarde 30 segundos
Clique: "Test trigger"

Resultado: Zapier deve encontrar o email ✅
Continue
```

---

### **4. CONFIGURAR ACTION (Enviar para Sistema)**

#### **4.1. Escolher App:**
```
Search: "Webhooks"
Selecione: "Webhooks by Zapier"
```

#### **4.2. Escolher Evento:**
```
Action Event: "POST"
Continue
```

#### **4.3. Configurar Webhook:**

**Pegue a URL do Supabase:**
```
Abra: /.env do projeto
Copie: VITE_SUPABASE_URL
Exemplo: https://abc123xyz.supabase.co
```

**Pegue a Chave Anon:**
```
Ainda no .env
Copie: VITE_SUPABASE_ANON_KEY
Exemplo: eyJhbGc...
```

**Configure o Webhook:**
```
┌────────────────────────────────────────────┐
│ Webhooks by Zapier Setup                  │
├────────────────────────────────────────────┤
│ URL:                                       │
│ https://[seu-projeto].supabase.co/        │
│ functions/v1/receive-email-webhook         │
│                                            │
│ Payload Type: JSON                        │
│                                            │
│ Data:                                      │
│   subject: [Clique + busque "Subject"]    │
│   from_address: [Busque "From Email"]     │
│   from_name: [Busque "From Name"]         │
│   to_address: [Busque "To"]               │
│   body_text: [Busque "Body Plain"]        │
│   body_html: [Busque "Body Html"]         │
│   received_at: [Busque "Date"]            │
│   message_id: [Busque "Message-ID"]       │
│                                            │
│ Headers:                                   │
│   Content-Type: application/json          │
│   Authorization: Bearer [ANON_KEY]        │
└────────────────────────────────────────────┘
```

**Detalhes de cada campo:**

```json
{
  "subject": "Clique no + → Busque 'Subject' → Selecione",
  "from_address": "Clique no + → Busque 'From Email' → Selecione",
  "from_name": "Clique no + → Busque 'From Name' → Selecione",
  "to_address": "Clique no + → Busque 'To' → Selecione",
  "body_text": "Clique no + → Busque 'Body Plain' → Selecione",
  "body_html": "Clique no + → Busque 'Body Html' → Selecione",
  "received_at": "Clique no + → Busque 'Date' → Selecione",
  "message_id": "Clique no + → Busque 'Message-ID' → Selecione"
}
```

**Headers (importante!):**
```
Content-Type: application/json
Authorization: Bearer [COLE_AQUI_O_ANON_KEY]
```

**Continue**

---

#### **4.4. Testar Action:**
```
Zapier vai enviar uma requisição de teste

Clique: "Test action"

Aguarde: 5 segundos

Resultado esperado:
✅ Status: 200 OK
✅ Response: { "success": true }

Se deu erro:
  - Verifique URL do Supabase
  - Verifique Authorization Bearer
  - Verifique se edge function foi deployada
```

---

### **5. ATIVAR ZAP**

```
Tudo funcionando?

Clique: "Publish" (no canto superior direito)

Zap Status: ON ✅

Pronto! 🎉
```

---

## 🧪 TESTE COMPLETO

### **1. Enviar Email de Teste:**
```
Do seu Gmail/Outlook pessoal:
  Para: diretor@giartechsolucoes.com.br
  Assunto: Teste Sistema Giartech Funcionando
  Mensagem:
    Olá!

    Este é um email de teste para validar
    o recebimento via Zapier.

    Se você está lendo isso no sistema,
    está tudo funcionando perfeitamente! ✅
```

### **2. Aguardar:**
```
Plano Grátis: 5-15 minutos
Plano Pago: 1-2 minutos
```

### **3. Verificar no Sistema:**
```
1. Acesse: /email/inbox
2. Filtro: "Caixa de Entrada"
3. Recarregue: Ctrl+R
4. Deve aparecer: Seu email de teste ✅
```

---

## 📊 MONITORAR ZAP

### **Ver Histórico:**
```
1. Zapier Dashboard
2. Seu Zap: "Giartech - Receber Emails"
3. Aba: "Task History"
4. Veja: Todos os emails processados
```

### **Ver Erros:**
```
Se aparecer erro:
  - Clique no erro
  - Veja detalhes
  - Corrija configuração
```

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### **Mudar Frequência (Plano Pago):**
```
1. Editar Zap
2. Settings
3. Trigger → Update frequency
4. Escolha: 1 minute, 5 minutes, etc
```

### **Filtrar Emails:**
```
Adicionar step "Filter":
  - Só emails com assunto específico
  - Só emails de certos remetentes
  - Etc
```

### **Múltiplas Contas:**
```
Criar Zap separado para:
  - gerente@giartechsolucoes.com.br
  - adm@giartechsolucoes.com.br
```

---

## 💰 LIMITES E CUSTOS

### **Plano Grátis:**
```
✅ 100 tasks/mês (100 emails)
✅ Verificação: a cada 15 minutos
✅ 1 Zap ativo
✅ Histórico: 14 dias
```

### **Plano Starter ($19.99/mês):**
```
✅ 750 tasks/mês
✅ Verificação: a cada 1 minuto
✅ 20 Zaps
✅ Histórico: 30 dias
```

---

## ❓ PROBLEMAS COMUNS

### **Erro: "Authentication failed"**
```
Causa: Senha IMAP incorreta

Solução:
1. Teste senha no webmail:
   https://webmail.giartechsolucoes.com.br
2. Use MESMA senha no Zapier
3. Reconecte conta
```

---

### **Erro: "Could not connect to IMAP server"**
```
Causa: Host ou porta incorretos

Solução:
  Host: mail.giartechsolucoes.com.br (SEM "smtp")
  Port: 993
  SSL: Yes
```

---

### **Emails não chegam no sistema**
```
Verificar:
1. ✅ Zap está ON?
2. ✅ Task History tem execuções?
3. ✅ Webhook URL está correta?
4. ✅ Authorization header correto?
5. ✅ Edge function deployada?
```

---

### **Webhook retorna erro 400**
```
Causa: Campos faltando ou incorretos

Solução:
1. Verificar todos os campos do JSON
2. Certificar que usou campos corretos do trigger
3. Testar webhook manualmente (Postman)
```

---

## 🎓 RESUMO VISUAL

```
┌─────────────┐
│   Gmail     │ → Email enviado
│  (Externo)  │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ mail.giartech... │ → Servidor Hostgator
│   (IMAP Server)  │
└────────┬─────────┘
         │
         ↓
┌────────────────┐
│     Zapier     │ → Monitora IMAP
│  (Cada 5 min)  │ → Busca novos emails
└───────┬────────┘
        │
        ↓
┌───────────────────────┐
│ receive-email-webhook │ → Edge Function
│   (Supabase)          │
└──────────┬────────────┘
           │
           ↓
┌──────────────────────┐
│  email_messages      │ → Banco de Dados
│   (Tabela)           │
└─────────┬────────────┘
          │
          ↓
┌─────────────────┐
│ /email/inbox    │ → Interface
│   (Sistema)     │ → Você vê o email ✅
└─────────────────┘
```

---

## ✅ CHECKLIST FINAL

```
[ ] Conta Zapier criada
[ ] Zap criado: "Giartech - Receber Emails"
[ ] Trigger configurado (IMAP)
[ ] IMAP testado e funcionando
[ ] Action configurada (Webhook)
[ ] URL do Supabase correta
[ ] Authorization header correto
[ ] Webhook testado
[ ] Zap publicado (ON)
[ ] Email de teste enviado
[ ] Email apareceu no sistema
```

---

## 🎉 SUCESSO!

Após completar todos os passos:

✅ **Emails externos chegam automaticamente**
✅ **Aparecem na Caixa de Entrada**
✅ **Sistema 100% funcional**
✅ **Grátis até 100 emails/mês**

---

**Precisa de ajuda? Me mostre prints do Zapier e eu te ajudo!** 🚀
