# 🔐 GUIA COMPLETO: CONECTAR GOOGLE ADS API REAL

## 📋 PASSO A PASSO COMPLETO

### ⏱️ **TEMPO ESTIMADO:** 30-45 minutos

---

## 🎯 FASE 1: CRIAR PROJETO NO GOOGLE CLOUD CONSOLE

### **Passo 1.1: Acessar Google Cloud Console**

1. Acesse: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Se for seu primeiro acesso, aceite os termos de serviço

### **Passo 2: Criar Novo Projeto**

1. No topo da página, clique em **"Select a project"**
2. Clique em **"NEW PROJECT"**
3. Preencha:
   ```
   Nome do Projeto: Giartech Google Ads Integration
   Organization: (deixe em branco se não tiver)
   Location: (deixe em branco)
   ```
4. Clique em **"CREATE"**
5. Aguarde 10-20 segundos
6. Selecione o projeto criado

---

## 🔌 FASE 2: ATIVAR GOOGLE ADS API

### **Passo 1: Ir para APIs & Services**

1. Menu lateral → **"APIs & Services"** → **"Library"**
2. Na barra de busca, digite: **"Google Ads API"**
3. Clique em **"Google Ads API"**
4. Clique em **"ENABLE"**
5. Aguarde a ativação (10-15 segundos)

---

## 🔑 FASE 3: CRIAR CREDENCIAIS OAUTH 2.0

### **Passo 1: Configurar OAuth Consent Screen**

1. Menu lateral → **"APIs & Services"** → **"OAuth consent screen"**
2. Escolha: **"External"** (para uso geral)
3. Clique em **"CREATE"**

### **Passo 2: Preencher Informações do App**

```
App name: Giartech Sistema
User support email: [SEU EMAIL]
App logo: (opcional)

Developer contact information:
Email: [SEU EMAIL]
```

4. Clique em **"SAVE AND CONTINUE"**

### **Passo 3: Configurar Scopes**

1. Clique em **"ADD OR REMOVE SCOPES"**
2. Na busca, digite: **"Google Ads API"**
3. Selecione: `https://www.googleapis.com/auth/adwords`
4. Clique em **"UPDATE"**
5. Clique em **"SAVE AND CONTINUE"**

### **Passo 4: Adicionar Usuários de Teste**

1. Clique em **"ADD USERS"**
2. Adicione seu email do Google Ads
3. Clique em **"ADD"**
4. Clique em **"SAVE AND CONTINUE"**

### **Passo 5: Criar Credenciais OAuth**

1. Menu lateral → **"APIs & Services"** → **"Credentials"**
2. Clique em **"+ CREATE CREDENTIALS"**
3. Selecione: **"OAuth client ID"**
4. Configurar:
   ```
   Application type: Web application
   Name: Giartech Google Ads Client

   Authorized JavaScript origins:
   - http://localhost:5173
   - [SEU DOMÍNIO DE PRODUÇÃO]

   Authorized redirect URIs:
   - http://localhost:5173/oauth/callback
   - [SEU DOMÍNIO]/oauth/callback
   ```
5. Clique em **"CREATE"**

### **Passo 6: COPIAR CREDENCIAIS** ⚠️ IMPORTANTE

Você receberá uma janela com:
```
Client ID: 123456789-abc.apps.googleusercontent.com
Client Secret: GOCSPX-abc123xyz...
```

**⚠️ GUARDE ESSAS INFORMAÇÕES EM SEGURANÇA!**

---

## 🎫 FASE 4: OBTER DEVELOPER TOKEN

### **Passo 1: Acessar Google Ads**

1. Acesse: https://ads.google.com
2. Login na sua conta (Customer ID: 687-563-5815)
3. Clique no ícone de ferramentas (⚙️) no topo
4. Em **"SETUP"**, clique em **"API Center"**

### **Passo 2: Solicitar Developer Token**

1. Você verá **"Developer Token"**
2. Se não tiver, clique em **"Request Token"**
3. Preencha o formulário:
   ```
   Application Name: Giartech Sistema
   Description: Sistema de gestão empresarial integrado
   Purpose: Rastreamento e análise de campanhas
   ```
4. Clique em **"Submit"**

### **Passo 3: Aguardar Aprovação**

**Tempo de espera:**
- Conta teste (sandbox): Aprovação imediata
- Conta produção: 1-5 dias úteis

**Para testar AGORA:**
- Você pode usar o token em modo "Test Account"
- Funcionará apenas com dados da sua conta
- Suficiente para começar!

**Copie o Developer Token quando aparecer:**
```
Developer Token: abc123xyz...
```

---

## 💾 FASE 5: CONFIGURAR NO SISTEMA

### **Agora você tem 3 informações:**

1. ✅ **Client ID**: `123456789-abc.apps.googleusercontent.com`
2. ✅ **Client Secret**: `GOCSPX-abc123xyz...`
3. ✅ **Developer Token**: `abc123xyz...`
4. ✅ **Customer ID**: `687-563-5815`

### **Onde inserir:**

Vou criar uma página de configuração avançada onde você poderá inserir essas credenciais de forma segura.

---

## 🔒 SEGURANÇA DAS CREDENCIAIS

### **NUNCA:**
- ❌ Compartilhe suas credenciais
- ❌ Commite no Git/GitHub
- ❌ Deixe em código-fonte
- ❌ Exponha no frontend

### **SEMPRE:**
- ✅ Use variáveis de ambiente
- ✅ Armazene criptografadas no banco
- ✅ Use apenas no backend (Edge Functions)
- ✅ Renove tokens periodicamente

---

## 📊 O QUE ACONTECE DEPOIS

Com as credenciais configuradas:

1. **Primeira Sincronização:**
   - Sistema pede autorização OAuth
   - Você autoriza no Google
   - Token de acesso é gerado
   - Dados REAIS começam a sincronizar

2. **Dados Sincronizados:**
   - ✅ Campanhas reais
   - ✅ Cliques reais
   - ✅ Conversões reais
   - ✅ Custos reais
   - ✅ Métricas em tempo real

3. **Auto-Refresh:**
   - Token renova automaticamente
   - Sincronização a cada 15 minutos
   - Sem necessidade de reautorizar

---

## 🚀 PRÓXIMOS PASSOS

### **O que vou criar agora:**

1. **Página de Configuração OAuth**
   - Campos seguros para credenciais
   - Botão "Conectar com Google"
   - Fluxo OAuth completo

2. **Edge Function Atualizada**
   - Integração com Google Ads API real
   - Autenticação OAuth
   - Renovação automática de tokens

3. **Armazenamento Seguro**
   - Credenciais criptografadas
   - Tokens no banco de dados
   - RLS para segurança

---

## ⏭️ VOCÊ JÁ TEM AS CREDENCIAIS?

**Opção A:** Ainda não tenho, vou seguir o guia acima
**Opção B:** Já tenho! Estou pronto para configurar
**Opção C:** Preciso de ajuda em algum passo específico

---

## 📞 DÚVIDAS COMUNS

### **1. Quanto custa usar a API?**
- ✅ API do Google Ads é GRATUITA
- Você só paga pelos anúncios (como sempre)

### **2. Preciso de cartão de crédito no Google Cloud?**
- ❌ NÃO! Google Ads API é gratuita
- Não precisa billing no Cloud Console

### **3. Posso testar antes da aprovação?**
- ✅ SIM! Use modo "Test Account"
- Funciona com suas próprias campanhas
- Perfeito para desenvolvimento

### **4. E se eu errar algum passo?**
- 🔄 Tudo pode ser refeito
- Posso guiar passo a passo
- Screenshots disponíveis se precisar

---

## ✅ CHECKLIST DE PROGRESSO

- [ ] Criar projeto no Google Cloud Console
- [ ] Ativar Google Ads API
- [ ] Configurar OAuth Consent Screen
- [ ] Criar credenciais OAuth 2.0
- [ ] Copiar Client ID e Client Secret
- [ ] Solicitar Developer Token no Google Ads
- [ ] Copiar Developer Token
- [ ] Aguardar minha implementação da página de config
- [ ] Inserir credenciais no sistema
- [ ] Autorizar conexão OAuth
- [ ] Ver dados REAIS no dashboard!

---

## 🎯 PRONTO PARA COMEÇAR?

**Me avise quando tiver as credenciais ou se precisar de ajuda em algum passo!**

Enquanto isso, vou preparar toda a infraestrutura no sistema! 🚀
