# 🔧 Guia Completo - Configuração de APIs para Captação de Leads

## ✅ Sistema Implementado

### Página de Configuração de APIs
- **Localização**: Menu > Marketing > Configurar APIs
- **Rota**: `/lead-sources-config`

### 10 Fontes de Leads Configuráveis

1. **Google Maps API** 🗺️
   - Busca de empresas por localização
   - Raio configurável
   - Até 1.000 requisições/dia

2. **Google Places API** 📍
   - Dados detalhados de estabelecimentos
   - Avaliações e fotos
   - Até 1.000 requisições/dia

3. **LinkedIn Sales Navigator** 💼
   - Busca de empresas e executivos
   - Filtros por indústria
   - Até 100 requisições/dia

4. **Facebook Graph API** 📱
   - Busca de páginas comerciais
   - Dados de engajamento
   - Até 200 requisições/dia

5. **Instagram Business API** 📸
   - Contas comerciais
   - Métricas de engajamento
   - Até 200 requisições/dia

6. **Twitter/X API** 🐦
   - Busca de perfis comerciais
   - Análise de tweets
   - Até 500 requisições/dia

7. **Google Ads API** 📊
   - Análise de concorrentes
   - Palavras-chave
   - Até 1.000 requisições/dia

8. **TikTok Business API** 🎵
   - Contas empresariais
   - Vídeos e hashtags
   - Até 100 requisições/dia

9. **YouTube Data API** 🎬
   - Canais empresariais
   - Métricas de vídeos
   - Até 10.000 requisições/dia

10. **WhatsApp Business API** 💬
    - Perfis comerciais
    - Catálogos de produtos
    - Até 1.000 requisições/dia

## 🎯 Funcionalidades Principais

### Dashboard de Status
- **Total de Fontes**: 10 APIs disponíveis
- **Fontes Ativas**: Quantas estão habilitadas
- **Configuradas**: Quantas têm credenciais
- **Testadas**: Quantas foram validadas

### Para Cada Fonte
- ✅ Ativar/Desativar
- ⚙️ Configurar credenciais
- 🧪 Testar conexão
- 📊 Ver limites de taxa
- 📅 Último teste realizado
- ✓ Status do teste (Sucesso/Falhou)

## 📝 Como Configurar Cada API

### 1. Google Maps API

**Passo a passo:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto ou selecione existente
3. Ative a "Maps JavaScript API" e "Places API"
4. Vá em "Credenciais" > "Criar credenciais" > "Chave de API"
5. Configure restrições:
   - Restrições de aplicativo: HTTP referrers
   - Adicione seu domínio
   - Restrições de API: Selecione Maps e Places
6. Copie a API Key
7. Cole no sistema na seção Google Maps

**Campos necessários:**
- API Key: `AIzaSy...`

**Custo:**
- 28.500 requisições grátis/mês
- Depois: US$ 0,007 por requisição

---

### 2. LinkedIn Sales Navigator

**Passo a passo:**
1. Acesse [LinkedIn Developers](https://www.linkedin.com/developers)
2. Crie um aplicativo
3. Preencha informações da empresa
4. Obtenha Client ID e Client Secret
5. Configure permissões: `r_organization_social`, `r_ads`
6. Configure OAuth redirect URL

**Campos necessários:**
- Client ID: `77xzy...`
- Client Secret: `WPL_Ap8...`
- Access Token: Gerado via OAuth

**Custo:**
- Sales Navigator Professional: US$ 79,99/mês
- API incluída no plano

---

### 3. Facebook Graph API

**Passo a passo:**
1. Acesse [Facebook for Developers](https://developers.facebook.com)
2. Crie um aplicativo
3. Adicione produto "Facebook Login"
4. Obtenha App ID e App Secret
5. Gere um Access Token longo prazo
6. Configure permissões: `pages_read_engagement`, `pages_show_list`

**Campos necessários:**
- Client ID (App ID): `1234567890`
- Client Secret (App Secret): `abc123...`
- Access Token: `EAABw...`

**Custo:**
- Gratuito até certos limites
- Rate limit: 200 requisições/hora

---

### 4. Instagram Business API

**Passo a passo:**
1. Mesmo processo do Facebook (usa Graph API)
2. Vincule conta do Instagram ao Facebook
3. Converta conta para Business
4. Use mesmas credenciais do Facebook
5. Adicione permissões: `instagram_basic`, `instagram_manage_insights`

**Campos necessários:**
- Mesmas do Facebook Graph API
- Access Token com permissões do Instagram

**Custo:**
- Gratuito (incluído no Facebook)

---

### 5. Twitter/X API

**Passo a passo:**
1. Acesse [Twitter Developer Portal](https://developer.twitter.com)
2. Candidate-se ao acesso à API
3. Crie um aplicativo
4. Obtenha API Key e API Secret
5. Gere Bearer Token ou Access Tokens

**Campos necessários:**
- API Key: `xvz1ev...`
- API Secret: `LswwdoU...`
- Bearer Token: `AAAAA...`

**Custo:**
- Basic: US$ 100/mês (até 10k tweets/mês)
- Pro: US$ 5.000/mês (até 1M tweets/mês)

---

### 6. Google Ads API

**Passo a passo:**
1. Acesse [Google Ads API Center](https://ads.google.com/home/tools/api-center)
2. Solicite acesso à API
3. Crie OAuth 2.0 credentials
4. Obtenha Developer Token
5. Configure OAuth consent screen

**Campos necessários:**
- Developer Token: `ABC123...`
- Client ID: `123456...`
- Client Secret: `abc123...`
- Refresh Token: Gerado via OAuth

**Custo:**
- Gratuito
- Requer conta Google Ads ativa

---

### 7. TikTok Business API

**Passo a passo:**
1. Acesse [TikTok for Business](https://ads.tiktok.com)
2. Crie conta comercial
3. Acesse Developer Portal
4. Crie um aplicativo
5. Obtenha App ID e Secret

**Campos necessários:**
- App ID: `1234567`
- App Secret: `abc123...`
- Access Token: Gerado via OAuth

**Custo:**
- Gratuito para desenvolvedores
- Rate limits: 100 req/hora

---

### 8. YouTube Data API

**Passo a passo:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Ative "YouTube Data API v3"
3. Crie credenciais (API Key ou OAuth)
4. Configure cotas e limites

**Campos necessários:**
- API Key: `AIzaSy...`

**Custo:**
- 10.000 unidades grátis/dia
- Cada busca = 100 unidades
- = 100 buscas grátis/dia

---

### 9. WhatsApp Business API

**Passo a passo:**
1. Acesse [WhatsApp Business Platform](https://business.whatsapp.com)
2. Configure Meta Business
3. Solicite acesso à API
4. Obtenha número de telefone comercial
5. Configure webhook

**Campos necessários:**
- Phone Number ID: `123456...`
- Access Token: `EAABw...`
- WhatsApp Business Account ID

**Custo:**
- Gratuito até 1.000 conversas/mês
- Depois: US$ 0,005 - 0,09 por conversa

---

### 10. APIs Customizadas

**Para outras fontes:**
1. Configure nome personalizado
2. Adicione endpoint da API
3. Configure autenticação
4. Defina parâmetros de busca

**Campos necessários:**
- Configuração customizada via JSON

---

## 🚀 Como Usar no Sistema

### Passo 1: Acessar Configuração
1. Vá em **Marketing** > **Configurar APIs**
2. Visualize todas as 10 fontes disponíveis

### Passo 2: Configurar uma Fonte
1. Clique em **"Configurar"** na fonte desejada
2. Preencha os campos de credenciais:
   - API Key
   - API Secret (se necessário)
   - Client ID (se necessário)
   - Client Secret (se necessário)
   - Access Token (se necessário)
3. Clique em **"Salvar Configuração"**

### Passo 3: Testar Conexão
1. Clique no ícone de **teste** (tubo de ensaio)
2. Aguarde resultado
3. Verifique status:
   - ✅ **Verde**: Conexão OK
   - ❌ **Vermelho**: Falha (verifique credenciais)

### Passo 4: Ativar Fonte
1. Clique no badge de status
2. Mude de "Inativa" para "Ativa"
3. Fonte pronta para usar em campanhas

### Passo 5: Usar em Campanhas
1. Vá em **Campanhas de Captação**
2. Crie nova campanha
3. Selecione fonte ativa
4. Execute campanha
5. Leads aparecem em **Leads Capturados**

## 📊 Monitoramento

### KPIs Disponíveis
- Total de fontes configuradas
- Fontes ativas no momento
- Última sincronização
- Taxa de sucesso de testes
- Requisições restantes (por fonte)

### Alertas Automáticos
- ⚠️ Credenciais expiradas
- ⚠️ Limite de requisições atingido
- ⚠️ Teste de conexão falhou
- ⚠️ Fonte desativada automaticamente

## 🔒 Segurança

### Boas Práticas
1. **Nunca compartilhe** suas API Keys
2. **Configure restrições** por IP/domínio
3. **Use OAuth** quando disponível
4. **Monitore uso** regularmente
5. **Rotacione credenciais** periodicamente

### Armazenamento
- Credenciais criptografadas no banco
- Acesso restrito a administradores
- Logs de acesso auditados
- Campos sensíveis ocultados por padrão

## ❗ Troubleshooting

### Teste falhou
**Causas:**
- Credenciais incorretas
- API desativada no provedor
- Limite de requisições atingido
- Restrições de IP/domínio

**Solução:**
1. Verifique credenciais copiadas corretamente
2. Confirme API ativa no console do provedor
3. Verifique cotas disponíveis
4. Configure restrições corretas

### Campanha não captura leads
**Causas:**
- Fonte não ativa
- Credenciais não configuradas
- Parâmetros de busca muito restritivos

**Solução:**
1. Ative a fonte
2. Configure e teste credenciais
3. Ajuste parâmetros de busca

### Limite de requisições
**Causas:**
- Muitas campanhas ativas
- Frequência muito alta
- Plano da API limitado

**Solução:**
1. Reduza frequência de campanhas
2. Desative campanhas desnecessárias
3. Faça upgrade do plano da API

## 💡 Dicas Pro

### Combinação de Fontes
Use múltiplas fontes para:
- **Google Maps**: Localização geográfica
- **LinkedIn**: Perfil executivo
- **Facebook/Instagram**: Presença online
- **YouTube**: Conteúdo em vídeo

### Priorização
Ordem recomendada de implementação:
1. **Google Maps** (mais empresas, fácil)
2. **Facebook Graph** (dados ricos)
3. **LinkedIn** (perfil profissional)
4. **Instagram** (engajamento)
5. Demais conforme necessidade

### Custos
Para começar (gratuito):
1. Google Maps: 28.500 req/mês grátis
2. YouTube: 10.000 unidades/dia grátis
3. Facebook: Rate limits generosos

Para escalar (pago):
1. LinkedIn Sales Navigator: US$ 79,99/mês
2. Twitter Basic: US$ 100/mês
3. WhatsApp: US$ 0,005/conversa

## 📞 Próximos Passos

1. Configure **Google Maps** primeiro (mais fácil)
2. Teste com campanha pequena
3. Ajuste parâmetros baseado em resultados
4. Ative mais fontes conforme necessidade
5. Monitore custos e ROI

## 🎓 Recursos Adicionais

### Documentação Oficial
- [Google Maps Platform](https://developers.google.com/maps)
- [LinkedIn API](https://docs.microsoft.com/linkedin/)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Twitter API](https://developer.twitter.com/en/docs)

### Tutoriais em Vídeo
- Pesquise no YouTube por "Como obter API Key [nome da plataforma]"
- Muitos tutoriais passo a passo disponíveis
