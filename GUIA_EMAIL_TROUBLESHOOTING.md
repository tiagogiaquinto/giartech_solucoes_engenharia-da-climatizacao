# 🔧 GUIA DE TROUBLESHOOTING - EMAIL CORPORATIVO

## ✅ BUILD APLICADO COM SUCESSO

```
✓ Rotas reorganizadas
✓ /email/compose agora vem ANTES de /email/inbox
✓ Build concluído: 15.86s
✓ Sistema pronto!
```

---

## 🚀 COMO TESTAR AGORA

### 1. **RECARREGUE A PÁGINA**
```
Pressione Ctrl+Shift+R (Windows/Linux)
ou Cmd+Shift+R (Mac)

Isso vai limpar o cache e carregar o novo build
```

### 2. **ACESSE A ROTA DIRETAMENTE**
```
Digite no navegador:
http://seu-dominio/email/compose

Ou clique em "Email Corporativo" no menu
e depois em "Novo Email"
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### PROBLEMA 1: Erro 404 ao acessar /email/compose

**Causa:** Cache do navegador com build antigo

**Solução:**
```
1. Pressione Ctrl+Shift+R para hard refresh
2. Ou limpe o cache do navegador:
   - Chrome: F12 → Network → Disable cache
   - Firefox: F12 → Network → Disable cache
3. Feche e abra o navegador novamente
```

---

### PROBLEMA 2: "Erro ao enviar email"

**Diagnóstico - Abra o Console (F12):**

#### Erro: "Conta de email não encontrada"
```
Causa: Nenhuma conta SMTP configurada

Solução:
1. Vá em /email/settings
2. Clique em "Nova Conta"
3. Configure uma conta Gmail ou Outlook
4. Marque como "Conta padrão"
5. Salve
```

#### Erro: "Authentication failed" (Gmail)
```
Causa: Senha incorreta ou "Senha de app" não configurada

Solução Gmail:
1. Acesse: https://myaccount.google.com
2. Segurança → Verificação em 2 etapas (ative se não estiver)
3. Volte em Segurança → Senhas de app
4. Criar senha de app:
   - Aplicativo: Email
   - Dispositivo: Outro (digite "Sistema ERP")
5. Copie a senha gerada (16 caracteres)
6. Cole no campo "Senha SMTP" nas configurações
```

#### Erro: "Authentication failed" (Outlook)
```
Causa: Usuário ou senha incorretos

Solução:
1. Verifique se o email está correto
2. Use sua senha normal do Outlook
3. Servidor: smtp-mail.outlook.com
4. Porta: 587
5. Conexão segura: ✓ Ativada
```

#### Erro: "Connection timeout"
```
Causa: Servidor ou porta incorretos

Solução:
Gmail:
  - Servidor: smtp.gmail.com
  - Porta: 587

Outlook:
  - Servidor: smtp-mail.outlook.com
  - Porta: 587

Office 365:
  - Servidor: smtp.office365.com
  - Porta: 587
```

#### Erro: "Invalid recipients"
```
Causa: Email do destinatário inválido

Solução:
- Verifique o formato: email@dominio.com
- Remova espaços extras
- Para múltiplos: separe com vírgula
  Correto: email1@dominio.com, email2@dominio.com
  Errado: email1@dominio.com email2@dominio.com
```

---

### PROBLEMA 3: Edge Function não responde

**Diagnóstico:**
```javascript
// Abra o Console (F12) e execute:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

fetch(`${supabaseUrl}/functions/v1/send-smtp-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`
  },
  body: JSON.stringify({
    to: 'teste@email.com',
    subject: 'Teste',
    body_text: 'Teste de conexão'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Resposta Esperada:**
```json
{
  "success": false,
  "error": "Nenhuma conta de email padrão configurada"
}
```

Se não responder nada:
```
Problema: Edge Function não está ativa

Solução:
1. Verifique se a função foi deployada
2. Logs no Supabase Dashboard
3. Edge Functions → send-smtp-email → Logs
```

---

## 📋 CHECKLIST DE TESTE COMPLETO

### Passo 1: Verificar Navegação
```
[ ] Acessar /email/inbox (deve carregar)
[ ] Clicar em "Novo Email" (deve ir para /email/compose)
[ ] Acessar diretamente /email/compose (deve carregar)
```

### Passo 2: Configurar Conta
```
[ ] Ir em /email/settings
[ ] Clicar em "Nova Conta"
[ ] Preencher dados SMTP
[ ] Marcar "Conta padrão"
[ ] Salvar com sucesso
[ ] Conta aparece na lista
```

### Passo 3: Enviar Email Teste
```
[ ] Ir em /email/compose
[ ] Conta aparece no dropdown "De"
[ ] Preencher destinatário (seu email pessoal)
[ ] Preencher assunto: "Teste Sistema"
[ ] Preencher mensagem: "Email de teste"
[ ] Clicar em "Enviar Email"
[ ] Ver mensagem "Email enviado com sucesso"
[ ] Verificar inbox do destinatário
[ ] Email foi recebido com assinatura
```

### Passo 4: Verificar Histórico
```
[ ] Ir em /email/inbox
[ ] Clicar em "Enviados"
[ ] Email teste aparece na lista
[ ] Clicar no email
[ ] Conteúdo exibido corretamente
```

---

## 🔐 CONFIGURAÇÃO GMAIL DETALHADA

### Método 1: Senha de App (Recomendado)

1. **Ativar Verificação em 2 Etapas:**
   ```
   https://myaccount.google.com/security

   1. Role até "Verificação em duas etapas"
   2. Clique em "Começar"
   3. Siga as instruções (configure SMS ou app)
   4. Aguarde ativação (pode levar alguns minutos)
   ```

2. **Criar Senha de App:**
   ```
   https://myaccount.google.com/apppasswords

   1. Selecione aplicativo: Email
   2. Selecione dispositivo: Outro
   3. Digite: "Sistema ERP" ou "Sistema Email"
   4. Clique em "Gerar"
   5. Copie os 16 caracteres (ex: abcd efgh ijkl mnop)
   6. IMPORTANTE: Copie SEM os espaços!
      Correto: abcdefghijklmnop
      Errado: abcd efgh ijkl mnop
   ```

3. **Configurar no Sistema:**
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP User: seu-email@gmail.com
   SMTP Password: abcdefghijklmnop (senha de app)
   Conexão Segura: ✓ Ativada
   ```

### Método 2: Acesso de Apps Menos Seguros (Não Recomendado)

```
⚠️ O Google desativou esta opção!
Use apenas Senha de App (Método 1)
```

---

## 🔐 CONFIGURAÇÃO OUTLOOK DETALHADA

### Outlook.com / Hotmail

```
SMTP Host: smtp-mail.outlook.com
SMTP Port: 587
SMTP User: seu-email@outlook.com (ou @hotmail.com)
SMTP Password: sua-senha-normal
Conexão Segura: ✓ Ativada

IMAP Host: outlook.office365.com
IMAP Port: 993
```

### Office 365 / Microsoft 365

```
SMTP Host: smtp.office365.com
SMTP Port: 587
SMTP User: seu-email@empresa.com
SMTP Password: sua-senha-normal
Conexão Segura: ✓ Ativada

IMAP Host: outlook.office365.com
IMAP Port: 993
```

---

## 🐛 DEBUG AVANÇADO

### Verificar Logs da Edge Function

1. **Acessar Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Navegar para Edge Functions:**
   ```
   Project → Edge Functions → send-smtp-email → Logs
   ```

3. **Procurar por erros:**
   ```
   - Authentication failed
   - Connection timeout
   - Invalid credentials
   - Network error
   ```

### Testar SMTP Manualmente

Use este script no console do navegador:

```javascript
// Configuração
const config = {
  to: 'destinatario@email.com',
  subject: 'Teste Manual',
  body_text: 'Testando envio manual',
  account_id: 'cole-o-id-da-conta-aqui' // Opcional
}

// Enviar
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

fetch(`${supabaseUrl}/functions/v1/send-smtp-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseKey}`
  },
  body: JSON.stringify(config)
})
.then(async (response) => {
  const data = await response.json()
  console.log('Status:', response.status)
  console.log('Response:', data)
  if (data.success) {
    console.log('✅ Email enviado!')
  } else {
    console.error('❌ Erro:', data.error)
  }
})
.catch(error => {
  console.error('❌ Erro na requisição:', error)
})
```

---

## 📞 SUPORTE

### Erros Comuns e Soluções Rápidas

| Erro | Causa Provável | Solução Rápida |
|------|---------------|----------------|
| 404 em /email/compose | Cache | Ctrl+Shift+R |
| Authentication failed (Gmail) | Senha normal | Use Senha de App |
| Authentication failed (Outlook) | Senha errada | Verifique senha |
| Connection timeout | Servidor errado | Verifique host/porta |
| Conta não encontrada | Não configurada | Configure em /email/settings |
| Invalid recipients | Email inválido | Verifique formato |
| Network error | Firewall/Proxy | Verifique rede |

---

## ✅ TESTE FINAL

Após seguir este guia, teste:

```bash
# 1. Recarregue a página (Ctrl+Shift+R)

# 2. Configure conta Gmail:
#    - Host: smtp.gmail.com
#    - Port: 587
#    - User: seu-email@gmail.com
#    - Pass: senha-de-app-16-chars
#    - Secure: ✓

# 3. Envie email teste:
#    - Para: seu-email-pessoal@gmail.com
#    - Assunto: Teste Sistema ERP
#    - Mensagem: Funcionou!

# 4. Verifique inbox

# ✅ Email recebido? SUCESSO! 🎉
# ❌ Não recebeu? Veja logs no console (F12)
```

---

**Sistema de Email Corporativo pronto! Siga este guia para resolver qualquer problema! 📧✨**
