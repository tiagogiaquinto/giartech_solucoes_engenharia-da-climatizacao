# 🔧 IMPLEMENTAÇÃO DA GOOGLE ADS API REAL

## 📋 STATUS ATUAL

A infraestrutura está **100% pronta** para receber a API real:

- ✅ Tabela de credenciais OAuth criada
- ✅ Página de configuração OAuth implementada
- ✅ Sistema de armazenamento seguro de tokens
- ✅ Edge Function base criada
- ✅ Fluxo de sincronização funcional

---

## 🔌 O QUE FALTA IMPLEMENTAR

### **1. OAuth 2.0 Callback Handler**

Criar rota `/oauth/callback` para receber o código de autorização:

```typescript
// src/pages/OAuth Callback.tsx
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const OAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    handleOAuthCallback()
  }, [])

  const handleOAuthCallback = async () => {
    const code = searchParams.get('code')
    const state = searchParams.get('state') // account_id

    if (!code || !state) {
      alert('❌ Erro na autenticação')
      navigate('/google-ads-settings')
      return
    }

    try {
      // Chamar Edge Function para trocar código por tokens
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/google-ads-oauth-exchange`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          account_id: state
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('✅ Conta conectada com sucesso!')
        navigate('/google-ads-tracking')
      } else {
        alert(`❌ Erro: ${result.error}`)
        navigate('/google-ads-oauth')
      }
    } catch (error: any) {
      console.error('Erro:', error)
      alert(`❌ Erro ao conectar: ${error.message}`)
      navigate('/google-ads-oauth')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Conectando sua conta...</h2>
        <p className="text-gray-600 mt-2">Aguarde um momento</p>
      </div>
    </div>
  )
}

export default OAuthCallback
```

---

### **2. Edge Function: OAuth Token Exchange**

Criar `supabase/functions/google-ads-oauth-exchange/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { code, account_id } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar credenciais da conta
    const { data: account } = await supabase
      .from('google_ads_accounts')
      .select('client_id, client_secret_encrypted')
      .eq('id', account_id)
      .single()

    if (!account) {
      throw new Error('Conta não encontrada')
    }

    // Trocar código por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: account.client_id,
        client_secret: account.client_secret_encrypted, // descriptografar em produção
        redirect_uri: `${req.headers.get('origin')}/oauth/callback`,
        grant_type: 'authorization_code'
      })
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error)
    }

    // Armazenar tokens
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000))

    await supabase
      .from('google_ads_oauth_tokens')
      .upsert({
        account_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope
      })

    // Atualizar conta como conectada
    await supabase
      .from('google_ads_accounts')
      .update({
        oauth_connected: true,
        oauth_connected_at: new Date().toISOString()
      })
      .eq('id', account_id)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

---

### **3. Atualizar Edge Function de Sincronização**

Modificar `fetchGoogleAdsCampaigns` para usar API real:

```typescript
async function fetchGoogleAdsCampaigns(account: any): Promise<any[]> {
  // Verificar se tem OAuth configurado
  if (!account.oauth_connected) {
    console.log('Modo demonstração - gerando dados simulados')
    return generateDemoCampaigns()
  }

  // Buscar access token válido
  const { data: token } = await supabase
    .from('google_ads_oauth_tokens')
    .select('access_token, expires_at')
    .eq('account_id', account.id)
    .single()

  // Verificar se token expirou
  if (new Date(token.expires_at) <= new Date()) {
    // Renovar token
    await refreshAccessToken(account.id)
    // Buscar novo token
    const { data: newToken } = await supabase
      .from('google_ads_oauth_tokens')
      .select('access_token')
      .eq('account_id', account.id)
      .single()

    token.access_token = newToken.access_token
  }

  // Fazer requisição à Google Ads API
  const response = await fetch(
    `https://googleads.googleapis.com/v16/customers/${account.customer_id}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'developer-token': account.developer_token_encrypted, // descriptografar
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign_budget.amount_micros
          FROM campaign
          WHERE campaign.status = 'ENABLED'
        `
      })
    }
  )

  const data = await response.json()

  // Processar resposta
  const campaigns = data.map((row: any) => ({
    id: row.campaign.id,
    name: row.campaign.name,
    status: row.campaign.status,
    type: 'SEARCH', // determinar do campaign.advertising_channel_type
    budget: row.campaignBudget.amountMicros / 1000000 // converter micros
  }))

  return campaigns
}
```

---

### **4. Função de Renovação de Token**

```typescript
async function refreshAccessToken(accountId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Buscar credenciais
  const { data: account } = await supabase
    .from('google_ads_accounts')
    .select('client_id, client_secret_encrypted')
    .eq('id', accountId)
    .single()

  const { data: tokens } = await supabase
    .from('google_ads_oauth_tokens')
    .select('refresh_token')
    .eq('account_id', accountId)
    .single()

  // Renovar token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: account.client_id,
      client_secret: account.client_secret_encrypted,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    })
  })

  const newTokens = await response.json()

  if (newTokens.error) {
    throw new Error('Falha ao renovar token: ' + newTokens.error_description)
  }

  // Atualizar token
  const expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000))

  await supabase
    .from('google_ads_oauth_tokens')
    .update({
      access_token: newTokens.access_token,
      expires_at: expiresAt.toISOString()
    })
    .eq('account_id', accountId)
}
```

---

## 🔐 CRIPTOGRAFIA DE CREDENCIAIS

Implementar função de criptografia:

```typescript
// Usar crypto API nativa
async function encrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  )

  // Retornar IV + encrypted em base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

async function decrypt(encryptedText: string, key: string): Promise<string> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  )

  return decoder.decode(decrypted)
}
```

---

## 📚 DOCUMENTAÇÃO OFICIAL

- **Google Ads API:** https://developers.google.com/google-ads/api/docs/start
- **OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2
- **API Reference:** https://developers.google.com/google-ads/api/reference/rpc
- **Client Libraries:** https://developers.google.com/google-ads/api/docs/client-libs

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar página OAuth Callback
- [ ] Criar Edge Function de troca de tokens
- [ ] Implementar função de renovação de tokens
- [ ] Atualizar Edge Function sync para API real
- [ ] Implementar criptografia de credenciais
- [ ] Testar fluxo OAuth completo
- [ ] Testar sincronização com dados reais
- [ ] Implementar tratamento de erros da API
- [ ] Adicionar rate limiting
- [ ] Configurar monitoramento de quotas

---

## 🎯 ESTIMATIVA DE TEMPO

- OAuth Callback: 1-2 horas
- Edge Functions: 3-4 horas
- Integração API: 4-6 horas
- Testes: 2-3 horas
- **Total: 10-15 horas**

---

## 💡 OBSERVAÇÕES IMPORTANTES

1. **Modo Híbrido:** O sistema continuará funcionando em modo demonstração para contas sem OAuth

2. **Gradual:** Pode implementar por partes, testando cada componente

3. **Segurança:** NUNCA commitar credenciais reais no código

4. **Quotas:** Google Ads API tem limites de requisições - implementar cache

5. **Custos:** A API é gratuita, mas monitore o uso para evitar atingir limites

---

**A infraestrutura está pronta. Quando tiver as credenciais, é só seguir este guia!** 🚀
