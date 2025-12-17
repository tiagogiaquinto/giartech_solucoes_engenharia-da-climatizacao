# 📧 Guia Completo: Sistema de Convites de Usuários

## 🎯 Visão Geral

Sistema completo para convidar novos funcionários/usuários para acessar a plataforma via **Email** e **WhatsApp**.

---

## ✅ Como Funciona

### 1️⃣ **Processo de Convite**

```
Gestor cria convite → Sistema gera token único → Envia por Email/WhatsApp →
Usuário recebe link → Clica no link → Cria senha → Login normal
```

---

## 🚀 Como Usar (Passo a Passo)

### **ETAPA 1: Acessar Convites**

Acesse: `/user-invitations` ou `/convites-usuarios`

### **ETAPA 2: Criar Novo Convite**

1. Clique em **"Novo Convite"**
2. Preencha os dados:
   - **Email do usuário** (obrigatório)
   - **Função**: Administrador, Técnico ou Externo
   - **Como enviar**:
     - ✉️ **Email**
     - 💬 **WhatsApp**
     - ✅ **Ambos**
3. Se escolher WhatsApp, informe o número com DDD
4. Clique em **"Enviar Convite"**

### **ETAPA 3: Usuário Aceita Convite**

O convidado recebe:

**Via Email:**
```
📧 Assunto: Convite para acessar Giartech Sistema

🎉 Bem-vindo ao Giartech Sistema!

Você foi convidado para acessar nosso sistema como Técnico.

📋 Informações:
• Email: joao@exemplo.com
• Função: Técnico
• Validade: 7 dias

[Botão: Aceitar Convite]

Link: https://seudominio.com/register?token=abc123...
```

**Via WhatsApp:**
```
🎉 Bem-vindo ao Giartech Sistema!

Você foi convidado para acessar nosso sistema.

📋 Informações do Convite:
• Email: joao@exemplo.com
• Função: Técnico
• Validade: 7 dias

🔗 https://seudominio.com/register?token=abc123...

⏰ Importante: Este convite expira em 7 dias.
```

### **ETAPA 4: Criar Conta**

1. Usuário clica no link
2. Abre página de registro (automática)
3. Define senha
4. Conta criada
5. Faz login normalmente

---

## 📊 Gerenciar Convites

### **Visualizar Status**

Na tela de convites você vê:

| Status | Significado |
|--------|-------------|
| 🟡 **Pendente** | Convite enviado, aguardando aceite |
| 🟢 **Aceito** | Usuário criou conta |
| 🔴 **Expirado** | Passou dos 7 dias |
| ⚫ **Cancelado** | Gestor cancelou |

### **Ações Disponíveis**

Para convites **pendentes**:

| Ação | Ícone | Função |
|------|-------|--------|
| Copiar Link | 📋 | Copia link para enviar manualmente |
| Enviar WhatsApp | 💬 | Abre WhatsApp Web com mensagem pronta |
| Cancelar | ❌ | Cancela o convite |

---

## 🎨 Interface

### **Tela Principal**

```
┌─────────────────────────────────────────────────────┐
│  📧 Convites de Usuários        [+ Novo Convite]    │
│  Convide novos usuários via Email ou WhatsApp       │
├─────────────────────────────────────────────────────┤
│  📊 Estatísticas:                                   │
│  ┌────────────┬────────────┬────────────┐          │
│  │ Total: 15  │ Pendentes: │ Aceitos: 8 │          │
│  │            │     5      │            │          │
│  └────────────┴────────────┴────────────┘          │
├─────────────────────────────────────────────────────┤
│  Email          | Função  | Status   | Ações       │
│  joao@email.com | Técnico | Pendente | 📋 💬 ❌   │
│  maria@email.com| Admin   | Aceito   |  -         │
└─────────────────────────────────────────────────────┘
```

### **Modal de Novo Convite**

```
┌─────────────────────────────────────────────┐
│  📧 Novo Convite                      [✖]   │
├─────────────────────────────────────────────┤
│  Email do Usuário *                         │
│  [_________________________________]        │
│                                             │
│  Função no Sistema *                        │
│  [Técnico ▼]                                │
│                                             │
│  Como enviar o convite? *                   │
│  ○ ✉️ Enviar por Email                     │
│  ○ 💬 Enviar por WhatsApp                  │
│  ● ✅ Enviar por Email e WhatsApp          │
│                                             │
│  WhatsApp * (com DDD)                       │
│  [_________________________________]        │
│                                             │
│  ℹ️ Validade: O convite expira em 7 dias   │
│                                             │
│  [Cancelar]  [📤 Enviar Convite]           │
└─────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Técnico

### **1. Criar Convite**

```javascript
// Frontend cria convite no banco
const invitation = await createUserInvitation({
  email: 'joao@exemplo.com',
  role: 'technician',
  invited_by: currentUser.id
})
// Token gerado automaticamente: abc123xyz456...

// Envia via Edge Function
await fetch('/functions/v1/send-invitation', {
  method: 'POST',
  body: JSON.stringify({
    email: 'joao@exemplo.com',
    token: invitation.token,
    role: 'technician',
    method: 'both', // email, whatsapp ou both
    whatsapp: '11987654321'
  })
})
```

### **2. Usuário Aceita**

```javascript
// URL: /register?token=abc123xyz456...

// Valida token
const invitation = await supabase
  .from('user_invitations')
  .select('*')
  .eq('token', tokenFromURL)
  .eq('status', 'pending')
  .single()

if (!invitation || new Date(invitation.expires_at) < new Date()) {
  // Token inválido ou expirado
}

// Cria conta
await createAccount({
  email: invitation.email,
  password: userPassword,
  role: invitation.role
})

// Marca convite como aceito
await supabase
  .from('user_invitations')
  .update({ status: 'accepted', accepted_at: new Date() })
  .eq('id', invitation.id)
```

---

## 🔧 Configurações Necessárias

### **Email**

O sistema usa a edge function `send-smtp-email` que deve estar configurada com:

```env
SMTP_HOST=smtp.hostgator.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=suasenha
```

### **WhatsApp**

O sistema usa a edge function `whatsapp-baileys` que deve estar conectada.

---

## ❓ Perguntas Frequentes

### **1. O link pode ser enviado manualmente?**

Sim! Clique em 📋 para copiar o link e envie por qualquer meio.

### **2. Posso reenviar um convite?**

Não. Se expirou, cancele e crie um novo.

### **3. Quantos convites posso criar?**

Ilimitado.

### **4. O usuário pode usar email diferente?**

Não. O email fica vinculado ao token por segurança.

### **5. E se o funcionário não tem WhatsApp?**

Use apenas Email ou copie o link e envie por SMS.

### **6. Posso mudar a validade de 7 dias?**

Sim, edite na migration `20251006172330_add_user_management_system.sql`:

```sql
expires_at timestamptz DEFAULT (now() + interval '7 days'),
-- Mude para: interval '30 days'
```

---

## 🎯 Boas Práticas

### ✅ **Fazer**

- Enviar por ambos (Email + WhatsApp) para garantir recebimento
- Verificar se o email está correto antes de enviar
- Cancelar convites não utilizados após contato com o usuário
- Manter registro de quem convidou quem (campo `invited_by`)

### ❌ **Evitar**

- Criar múltiplos convites para o mesmo email
- Compartilhar links publicamente (são únicos e pessoais)
- Deixar convites pendentes por muito tempo

---

## 📝 Exemplo Completo

```javascript
// 1. Gestor convida novo técnico
const invitation = {
  email: 'tecnico@exemplo.com',
  role: 'technician',
  sendMethod: 'both',
  whatsapp: '11987654321'
}

// 2. Sistema gera token e envia
// Token: 8f7a3b2c1d4e5f6g7h8i9j0k...

// 3. Técnico recebe email e WhatsApp com link:
// https://giartech.com/register?token=8f7a3b2c1d4e5f6g7h8i9j0k...

// 4. Técnico clica, cria senha "SenhaForte123!"

// 5. Login normal:
// Email: tecnico@exemplo.com
// Senha: SenhaForte123!
```

---

## 🎉 Pronto!

Agora você pode convidar todos os funcionários para usar o sistema de forma profissional e organizada!

**Dúvidas?** Acesse `/thomaz-chat` e pergunte para o assistente IA!
