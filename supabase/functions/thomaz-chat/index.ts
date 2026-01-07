import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface ChatRequest {
  message: string
  sessionId: string
  userId?: string
}

interface ChatResponse {
  response: string
  mode: string
  modeName: string
  intent: string
  confidence: number
  needsClarification: boolean
  suggestedQuestions?: string[]
  tone: string
}

// System Prompts por Modo
const MODE_PROMPTS = {
  CFO: `Você é o Thomaz em MODO CFO - Chief Financial Officer experiente.

**SUA PERSONALIDADE:**
- Analítico e pragmático
- Fala direto, sem enrolação
- Honesto sobre riscos
- Focado em números e projeções
- Forward-thinking (sempre pensando no futuro)

**SEU ESTILO DE FALA:**
- "Financeiramente falando..."
- "Os números mostram que..."
- "O risco aqui é..."
- "Se você continuar nesse ritmo..."
- "Deixa eu ser direto:"

**SUAS CAPACIDADES:**
- Análise de KPIs financeiros
- Projeção de fluxo de caixa 30/60/90 dias
- Análise de margem e lucratividade
- Detecção de riscos financeiros
- Recomendações de investimento vs retorno

**REGRAS:**
1. SEMPRE use dados reais fornecidos
2. NUNCA invente números
3. Seja DIRETO sobre problemas
4. Ofereça SOLUÇÕES práticas
5. Termine com PRÓXIMOS PASSOS claros`,

  ENGINEER: `Você é o Thomaz em MODO ENGENHEIRO - Engenheiro de Climatização experiente.

**SUA PERSONALIDADE:**
- Prático e experiente
- Conecta técnica com custo
- Alerta sobre erros comuns que já viu
- Traduz complexidade técnica para gestão
- Solution-oriented

**SEU ESTILO DE FALA:**
- "Tecnicamente é viável, mas..."
- "Na prática, o que acontece é..."
- "Isso vai te custar mais em..."
- "Já vi isso dar errado quando..."
- "O ideal seria..., mas se o orçamento está apertado..."

**SUAS CAPACIDADES:**
- Análise técnica de equipamentos (VRF, split, cassete, etc.)
- Dimensionamento de carga térmica
- Avaliação de custo vs benefício técnico
- Recomendação de soluções práticas
- PMOC e manutenção preventiva
- Diagnóstico de falhas

**REGRAS:**
1. SEMPRE considere o custo junto com a técnica
2. ALERTE sobre erros comuns
3. TRADUZA técnica para linguagem de gestão
4. Seja PRÁTICO, não apenas teórico
5. Ofereça ALTERNATIVAS se o orçamento for limitado`,

  STRATEGIC: `Você é o Thomaz em MODO ESTRATÉGICO - Conselheiro e Mentor empresarial.

**SUA PERSONALIDADE:**
- Reflexivo e provocativo
- Faz perguntas que levam à resposta
- Organiza o pensamento do outro
- Paciente e estratégico
- Não dá resposta rasa

**SEU ESTILO DE FALA:**
- "Antes disso, deixa eu te perguntar..."
- "Você já parou pra pensar que..."
- "O que realmente está te travando é..."
- "Se a gente olhar de outro ângulo..."
- "Vamos organizar isso:"

**SUAS CAPACIDADES:**
- Organização de pensamento
- Priorização de decisões
- Análise de trade-offs
- Identificação de gargalos
- Planejamento estratégico
- Mentoria em crescimento

**ABORDAGEM SOCRÁTICA:**
1. PERGUNTE antes de responder
2. ORGANIZE o pensamento em etapas
3. IDENTIFIQUE a causa raiz, não sintomas
4. ANALISE trade-offs de cada opção
5. PRIORIZE ações por impacto

**REGRAS:**
1. EVITE respostas rasas
2. FAÇA perguntas provocativas
3. ORGANIZE pensamento em estruturas claras
4. IDENTIFIQUE o problema REAL por trás da pergunta
5. NUNCA dê solução pronta sem contexto`
}

// Função para buscar dados do modo CFO
async function getCFOData(supabase: any) {
  const { data: healthData } = await supabase
    .from('v_thomaz_financial_health_score')
    .select('*')
    .limit(1)
    .single()

  const { data: cashData } = await supabase
    .from('v_thomaz_cash_projection_30d')
    .select('*')
    .limit(5)

  const { data: alertsData } = await supabase
    .from('thomaz_alerts')
    .select('*')
    .neq('status', 'resolvido')
    .order('severity', { ascending: false })
    .limit(5)

  return {
    health_score: healthData,
    cash_projection: cashData,
    alerts: alertsData
  }
}

// Função para buscar dados do modo ENGENHEIRO
async function getEngineerData(supabase: any) {
  const { data: services } = await supabase
    .from('service_catalog')
    .select('*')
    .limit(10)

  const { data: materials } = await supabase
    .from('inventory_items')
    .select('*')
    .or('quantity.lt.min_quantity,quantity.eq.0')
    .limit(10)

  const { data: recentOS } = await supabase
    .from('service_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    services,
    critical_materials: materials,
    recent_orders: recentOS
  }
}

// Função para buscar dados do modo ESTRATÉGICO
async function getStrategicData(supabase: any) {
  const { data: biData } = await supabase
    .from('v_thomaz_business_intelligence')
    .select('*')
    .limit(1)
    .single()

  const { data: performanceData } = await supabase
    .from('v_thomaz_performance_dashboard')
    .select('*')
    .limit(1)
    .single()

  return {
    business_intelligence: biData,
    performance: performanceData
  }
}

// Função para montar contexto por modo
function buildModeContext(mode: string, data: any): string {
  if (mode === 'CFO') {
    const health = data.health_score
    let context = "**DADOS FINANCEIROS ATUAIS:**\n\n"

    if (health) {
      context += `📊 Health Score: ${health.overall_score?.toFixed(1) || 0}/100\n`
      context += `- Lucratividade: ${health.profitability_score?.toFixed(1) || 0}/30\n`
      context += `- Crescimento: ${health.growth_score?.toFixed(1) || 0}/25\n`
      context += `- Liquidez: ${health.liquidity_score?.toFixed(1) || 0}/25\n`
      context += `- Eficiência: ${health.efficiency_score?.toFixed(1) || 0}/20\n\n`
    }

    if (data.alerts && data.alerts.length > 0) {
      context += `⚠️ ALERTAS ATIVOS:\n`
      data.alerts.forEach((alert: any) => {
        context += `- [${alert.severity}] ${alert.title}\n`
      })
      context += `\n`
    }

    if (data.cash_projection && data.cash_projection.length > 0) {
      context += `💰 PROJEÇÃO DE CAIXA (próximos dias):\n`
      data.cash_projection.slice(0, 3).forEach((proj: any) => {
        context += `- ${proj.data}: R$ ${proj.saldo_projetado?.toFixed(2) || 0}\n`
      })
    }

    return context
  }

  if (mode === 'ENGINEER') {
    let context = "**DADOS TÉCNICOS:**\n\n"

    if (data.critical_materials && data.critical_materials.length > 0) {
      context += `🔧 MATERIAIS CRÍTICOS:\n`
      data.critical_materials.forEach((item: any) => {
        context += `- ${item.name}: ${item.quantity} unidades (min: ${item.min_quantity})\n`
      })
      context += `\n`
    }

    if (data.services && data.services.length > 0) {
      context += `📋 SERVIÇOS DISPONÍVEIS: ${data.services.length} serviços cadastrados\n`
    }

    if (data.recent_orders && data.recent_orders.length > 0) {
      context += `\n📝 ÚLTIMAS OS:\n`
      data.recent_orders.slice(0, 3).forEach((os: any) => {
        context += `- OS ${os.order_number}: ${os.status}\n`
      })
    }

    return context
  }

  if (mode === 'STRATEGIC') {
    let context = "**VISÃO DO NEGÓCIO:**\n\n"

    if (data.business_intelligence) {
      const bi = data.business_intelligence
      context += `📈 Performance Geral: ${bi.performance_level || 'N/A'}\n`
      context += `💡 Principais Insights disponíveis\n`
    }

    return context
  }

  return "**CONTEXTO:** Pronto para conversar sobre seu negócio.\n"
}

async function callAIProvider(
  provider: any,
  userMessage: string,
  mode: string,
  modeContext: string
): Promise<string> {
  const providerType = provider.provider_type
  const apiKey = provider.api_key
  const apiUrl = provider.api_url
  const model = provider.default_model
  const config = provider.config || {}

  const systemPrompt = MODE_PROMPTS[mode as keyof typeof MODE_PROMPTS] || MODE_PROMPTS.STRATEGIC

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: modeContext },
    { role: "user", content: `**PERGUNTA:** ${userMessage}` }
  ]

  if (providerType === 'openrouter') {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://giartech.com',
        'X-Title': 'Thomaz AI - Giartech'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 3000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${await response.text()}`)
    }

    const data = await response.json()
    return data.choices[0].message.content

  } else if (providerType === 'anthropic') {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: config.max_tokens || 3000,
        temperature: config.temperature || 0.7,
        system: systemPrompt + "\n\n" + modeContext,
        messages: [{ role: "user", content: userMessage }]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${await response.text()}`)
    }

    const data = await response.json()
    return data.content[0].text

  } else if (providerType === 'openai') {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 3000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  throw new Error(`Provedor desconhecido: ${providerType}`)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { message, sessionId, userId }: ChatRequest = await req.json()

    console.log('🤖 Thomaz Chat: Processing message:', message)

    // PASSO 1: Detectar modo e intenção
    const { data: modeDetection } = await supabase
      .rpc('thomaz_detect_mode_and_intent', {
        user_message: message,
        session_id: sessionId
      })

    const detectedMode = modeDetection?.mode || 'STRATEGIC'
    const detectedIntent = modeDetection?.intent || 'general'
    const confidence = modeDetection?.confidence || 0.5

    console.log(`🎯 Modo detectado: ${detectedMode} (${(confidence * 100).toFixed(0)}%)`)
    console.log(`💡 Intenção: ${detectedIntent}`)

    // PASSO 2: Obter personalidade do modo
    const { data: modeData } = await supabase
      .from('thomaz_cognitive_modes')
      .select('*')
      .eq('mode_code', detectedMode)
      .single()

    const modeName = modeData?.mode_name || detectedMode

    // PASSO 3: Buscar dados relevantes ao modo
    let businessData: any = {}

    if (detectedMode === 'CFO') {
      businessData = await getCFOData(supabase)
    } else if (detectedMode === 'ENGINEER') {
      businessData = await getEngineerData(supabase)
    } else if (detectedMode === 'STRATEGIC') {
      businessData = await getStrategicData(supabase)
    }

    // PASSO 4: Montar contexto específico do modo
    const modeContext = buildModeContext(detectedMode, businessData)

    // PASSO 5: Obter provider de IA
    const { data: provider } = await supabase.rpc('get_active_ai_provider')

    let aiResponse: string

    // PASSO 6: Gerar resposta
    if (!provider || !provider.api_key) {
      console.log('⚠️  Modo fallback (sem API key)')

      // Fallback inteligente por modo
      if (detectedMode === 'CFO') {
        aiResponse = `💰 **Modo CFO Ativo**\n\nPara análises financeiras completas, configure uma API key em Configurações → Provedores de IA.\n\nEnquanto isso, posso mostrar dados básicos:\n${modeContext}`
      } else if (detectedMode === 'ENGINEER') {
        aiResponse = `🔧 **Modo Engenheiro Ativo**\n\nPara recomendações técnicas detalhadas, configure uma API key.\n\nDados técnicos disponíveis:\n${modeContext}`
      } else {
        aiResponse = `🤔 **Modo Estratégico Ativo**\n\nPara conversas estratégicas profundas, configure uma API key.\n\nVamos começar: sobre qual aspecto do seu negócio você quer conversar?`
      }

    } else {
      // Usar IA externa com personalidade do modo
      aiResponse = await callAIProvider(provider, message, detectedMode, modeContext)
    }

    console.log('✅ Response generated in mode:', detectedMode)

    // PASSO 7: Registrar interação
    await supabase.from('thomaz_interactions').insert({
      user_id: userId,
      session_id: sessionId,
      user_message: message,
      thomaz_response: aiResponse,
      mode_used: detectedMode,
      intent_detected: detectedIntent,
      confidence_score: confidence
    })

    const result: ChatResponse = {
      response: aiResponse,
      mode: detectedMode,
      modeName: modeName,
      intent: detectedIntent,
      confidence: confidence,
      needsClarification: confidence < 0.6,
      tone: modeData?.personality?.tone || 'professional'
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )

  } catch (error: any) {
    console.error('❌ Error in Thomaz Chat:', error)
    return new Response(
      JSON.stringify({
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        mode: 'STRATEGIC',
        modeName: 'Estratégico',
        intent: 'error',
        confidence: 0,
        needsClarification: false,
        tone: 'apologetic',
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
