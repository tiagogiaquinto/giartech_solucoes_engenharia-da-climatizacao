# 📥 GUIA - RECEBIMENTO DE EMAILS NO SISTEMA

## ⚠️ IMPORTANTE: COMO FUNCIONA O RECEBIMENTO

O sistema **ENVIA emails perfeitamente** via SMTP.

Para **RECEBER emails**, existem 3 opções:

---

## 🎯 OPÇÃO 1: SINCRONIZAÇÃO MANUAL (IMPLEMENTADA)

### **Como Usar:**

1. **Acesse:** Menu → Email Corporativo → Caixa de Entrada
2. **Clique em:** Botão "Sincronizar" (azul, no topo)
3. **Aguarde:** Sistema busca novos emails do servidor
4. **Resultado:** Emails aparecem na caixa de entrada

### **Vantagens:**
```
✅ Funciona imediatamente
✅ Controle total do usuário
✅ Sem custos adicionais
```

### **Desvantagens:**
```
❌ Precisa clicar manualmente
❌ Não é automático em tempo real
```

---

## 🔄 OPÇÃO 2: SINCRONIZAÇÃO AUTOMÁTICA (RECOMENDADA)

### **Como Configurar:**

#### **1. Configurar IMAP na Conta de Email**

Acesse: `/email/settings` (Configurações de Email)

**Preencha os campos IMAP:**
```
IMAP Host: mail.giartechsolucoes.com.br
IMAP Port: 993
IMAP User: diretor@giartechsolucoes.com.br
IMAP Password: [mesma senha do SMTP]
☑ IMAP Secure (SSL): Ativado
```

#### **2. Ativar Sincronização Automática**

**Opção A: Cron Job no Servidor (Melhor)**
```bash
# Adicionar no crontab do servidor
# Sincroniza a cada 5 minutos
*/5 * * * * curl -X POST https://[seu-projeto].supabase.co/functions/v1/fetch-imap-emails \
  -H "Authorization: Bearer [service-role-key]" \
  -H "Content-Type: application/json"
```

**Opção B: GitHub Actions (Grátis)**
```yaml
# .github/workflows/sync-emails.yml
name: Sync Emails
on:
  schedule:
    - cron: '*/5 * * * *'  # A cada 5 minutos
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync emails
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/fetch-imap-emails \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
```

**Opção C: Serviço Externo (EasyCron, Cron-Job.org)**
```
URL: https://[seu-projeto].supabase.co/functions/v1/fetch-imap-emails
Método: POST
Headers:
  Authorization: Bearer [service-role-key]
  Content-Type: application/json
Frequência: A cada 5 minutos
```

### **Vantagens:**
```
✅ Automático
✅ Emails chegam rapidamente
✅ Sem interação do usuário
```

### **Desvantagens:**
```
⚠️ Requer configuração inicial
⚠️ Consome recursos do servidor
```

---

## 📧 OPÇÃO 3: WEBHOOK DE ENCAMINHAMENTO (AVANÇADA)

### **Como Funcionar:**

Configure no **cPanel da Hostgator**:

1. **Acesse:** cPanel → Filtros de Email
2. **Criar filtro:**
   ```
   De: *@* (todos)
   Ação: Redirecionar para webhook
   URL: https://[seu-projeto].supabase.co/functions/v1/receive-email-webhook
   ```

3. **Sistema recebe instantaneamente**

### **Vantagens:**
```
✅ Instantâneo (tempo real)
✅ Não consome recursos
✅ Mais eficiente
```

### **Desvantagens:**
```
❌ Requer configuração no cPanel
❌ Nem todos os provedores suportam
❌ Necessita edge function adicional
```

---

## 🔧 CONFIGURAÇÃO ATUAL DO SISTEMA

### **✅ O que JÁ ESTÁ funcionando:**

```
✅ Envio de emails via SMTP
✅ Botão de sincronização manual
✅ Edge function de sincronização (básica)
✅ Interface de inbox completa
✅ Campos IMAP na tabela email_accounts
```

### **⚠️ O que PRECISA configurar:**

```
1. Preencher dados IMAP nas contas de email
   → Vá em: /email/settings
   → Edite cada conta
   → Preencha: IMAP Host, Port, User, Password

2. Escolher método de sincronização:
   → MANUAL: Já funciona! (botão Sincronizar)
   → AUTOMÁTICA: Configure cron job
   → WEBHOOK: Configure no cPanel
```

---

## 📋 DADOS IMAP DA HOSTGATOR

Use estas configurações para receber emails:

```
IMAP Host: mail.giartechsolucoes.com.br
IMAP Port: 993
IMAP Secure (SSL): ✓ Ativado
IMAP User: diretor@giartechsolucoes.com.br
IMAP Password: [mesma senha do SMTP]
```

**Para cada conta:**
- diretor@giartechsolucoes.com.br
- gerente@giartechsolucoes.com.br
- adm@giartechsolucoes.com.br

---

## 🧪 TESTE DE RECEBIMENTO

### **Passo 1: Configurar IMAP**
```
1. Acesse: /email/settings
2. Clique em editar conta (diretor@...)
3. Role até seção IMAP
4. Preencha:
   IMAP Host: mail.giartechsolucoes.com.br
   IMAP Port: 993
   IMAP User: diretor@giartechsolucoes.com.br
   IMAP Password: [sua senha]
   ☑ SSL Ativado
5. Salvar
```

### **Passo 2: Enviar email de teste**
```
1. Do seu Gmail/Outlook pessoal
2. Envie para: diretor@giartechsolucoes.com.br
3. Assunto: "Teste de Recebimento"
4. Corpo: qualquer texto
```

### **Passo 3: Sincronizar**
```
1. Acesse: /email/inbox
2. Clique: "Sincronizar" (botão azul)
3. Aguarde mensagem de sucesso
4. Email deve aparecer na caixa de entrada
```

---

## ❌ PROBLEMAS COMUNS

### **Erro: "Configuração IMAP não encontrada"**

**Solução:**
```
✅ Vá em /email/settings
✅ Edite a conta de email
✅ Preencha TODOS os campos IMAP
✅ Salve e tente novamente
```

---

### **Erro: "Authentication failed"**

**Solução:**
```
✅ Verifique se a senha está correta
✅ Teste a senha no webmail: https://webmail.giartechsolucoes.com.br
✅ Use a MESMA senha do SMTP
✅ Senha é case-sensitive (maiúsculas/minúsculas)
```

---

### **Erro: "Connection timeout"**

**Solução:**
```
✅ Confirme: mail.giartechsolucoes.com.br (não "smtp")
✅ Porta: 993 (não 143)
✅ SSL deve estar ATIVADO
✅ Verifique firewall/rede
```

---

### **Botão "Sincronizar" não aparece**

**Solução:**
```
✅ Recarregue a página: Ctrl+Shift+R
✅ Limpe cache do navegador
✅ Acesse: /email/inbox (não /email)
```

---

## 🎯 RESUMO RÁPIDO

### **Para começar a receber emails AGORA:**

```
1. ✅ CONFIGURAR IMAP
   → /email/settings
   → Editar conta
   → Preencher dados IMAP
   → Salvar

2. ✅ SINCRONIZAR
   → /email/inbox
   → Botão "Sincronizar"
   → Aguardar

3. ✅ VERIFICAR
   → Emails aparecem na inbox
```

### **Para recebimento automático:**

```
1. Configure IMAP (passo acima)

2. Escolha método:
   • Cron Job (servidor)
   • GitHub Actions (grátis)
   • Serviço externo (EasyCron)

3. Configure para executar a cada 5-10 minutos
```

---

## 📞 SUPORTE

Se continuar com problemas:

```
1. Verifique no webmail se os emails estão chegando
   https://webmail.giartechsolucoes.com.br

2. Teste configuração IMAP em outro cliente
   (Outlook, Thunderbird, etc)

3. Entre em contato com suporte Hostgator:
   📞 0800 878 3142
   💬 Chat: hostgator.com.br/suporte
```

---

## ✅ CHECKLIST FINAL

Antes de testar:

```
[ ] Conta de email configurada (/email/settings)
[ ] SMTP funcionando (envio OK)
[ ] Campos IMAP preenchidos corretamente
[ ] IMAP Host: mail.giartechsolucoes.com.br
[ ] IMAP Port: 993
[ ] IMAP SSL: Ativado
[ ] Senha testada no webmail
[ ] Página recarregada (Ctrl+Shift+R)
[ ] Enviado email de teste de outro provedor
[ ] Clicado em "Sincronizar"
```

---

**Sistema pronto para receber emails! 📧✨**
