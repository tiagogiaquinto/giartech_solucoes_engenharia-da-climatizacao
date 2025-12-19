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
  confidence: number
  needsClarification: boolean
  suggestedQuestions?: string[]
  tone: string
}

const SYSTEM_PROMPT = `Você é o Thomaz, assistente inteligente de gestão empresarial da Giartech.

**SUA PERSONALIDADE:**
- Conversacional e natural, como um consultor experiente
- Tom profissional mas acessível
- Usa linguagem clara e direta
- Empático e prestativo
- Proativo em identificar problemas e oportunidades

**SUAS CAPACIDADES:**
- Análise de estoque, financeiro, ordens de serviço e clientes
- Identificação de problemas críticos
- Recomendações práticas e acionáveis
- Explicação de indicadores e métricas
- Resposta a perguntas sobre gestão empresarial

**DIRETRIZES:**
1. Sempre responda em português brasileiro
2. Use emojis com moderação e contexto
3. Seja conciso mas completo
4. Quando tiver dados do negócio, analise e interprete
5. Faça perguntas de esclarecimento quando necessário
6. Adapte o tom à situação (urgente para problemas, entusiasta para sucessos)
7. NUNCA invente dados - use apenas informações fornecidas

**IMPORTANTE:**
- Se não tiver dados do negócio no contexto, diga que pode ajudar mas precisa da informação
- Sempre termine oferecendo próximos passos ou perguntas relacionadas
- Seja humano na conversa, não robótico`

async function callAIProvider(
  provider: any,
  userMessage: string,
  businessContext: any
): Promise<string> {
  const providerType = provider.provider_type
  const apiKey = provider.api_key
  const apiUrl = provider.api_url
  const model = provider.default_model
  const config = provider.config || {}

  let contextMessage = "**CONTEXTO DO NEGÓCIO:**\n\n"

  if (businessContext && businessContext.business_data) {
    const data = businessContext.business_data
    const intent = businessContext.intent_analysis?.intent

    if (intent === 'inventory_query' && data.resumo) {
      contextMessage += `**ESTOQUE:**\n`
      contextMessage += `- Total de itens: ${data.resumo.total_itens}\n`
      contextMessage += `- Valor total: R$ ${data.resumo.valor_total}\n`
      contextMessage += `- Itens zerados: ${data.resumo.itens_zerados}\n`
      contextMessage += `- Itens críticos: ${data.resumo.itens_criticos}\n`
      contextMessage += `- Itens baixos: ${data.resumo.itens_baixos}\n`
      contextMessage += `- Itens OK: ${data.resumo.itens_ok}\n\n`

      if (data.itens_criticos && data.itens_criticos.length > 0) {
        contextMessage += `**ITENS CRÍTICOS (primeiros 5):**\n`
        data.itens_criticos.slice(0, 5).forEach((item: any) => {
          contextMessage += `- ${item.name}: ${item.quantity} unidades (mínimo: ${item.min_quantity}) - ${item.status}\n`
        })
      }
    }
    else if (intent === 'financial_query' && data.resumo) {
      contextMessage += `**FINANCEIRO (últimos 30 dias):**\n`
      contextMessage += `- Receitas: R$ ${data.resumo.total_receitas_valor}\n`
      contextMessage += `- Despesas: R$ ${data.resumo.total_despesas_valor}\n`
      contextMessage += `- Margem: ${data.indicadores?.margem_percentual || 0}%\n`
      contextMessage += `- Lançamentos vencidos: ${data.resumo.lancamentos_vencidos}\n`
      contextMessage += `- Valor vencido: R$ ${data.resumo.valor_vencido || 0}\n\n`
    }
    else if (intent === 'service_order_query' && data.resumo) {
      contextMessage += `**ORDENS DE SERVIÇO (últimos 30 dias):**\n`
      contextMessage += `- Total de OS: ${data.resumo.total_os}\n`
      contextMessage += `- Pendentes: ${data.resumo.pendentes}\n`
      contextMessage += `- Em andamento: ${data.resumo.em_andamento}\n`
      contextMessage += `- Concluídas: ${data.resumo.concluidas}\n`
      contextMessage += `- Taxa de conclusão: ${data.indicadores?.taxa_conclusao || 0}%\n`
      contextMessage += `- Ticket médio: R$ ${data.indicadores?.ticket_medio || 0}\n\n`
    }
    else if (intent === 'customer_query' && data.resumo) {
      contextMessage += `**CLIENTES:**\n`
      contextMessage += `- Total: ${data.resumo.total_clientes}\n`
      contextMessage += `- Ativos: ${data.resumo.ativos}\n`
      contextMessage += `- Inativos: ${data.resumo.inativos}\n`
      contextMessage += `- Inativos há 90+ dias: ${data.indicadores?.clientes_inativos_90dias || 0}\n\n`

      if (data.top_clientes && data.top_clientes.length > 0) {
        contextMessage += `**TOP 5 CLIENTES:**\n`
        data.top_clientes.slice(0, 5).forEach((cliente: any, idx: number) => {
          contextMessage += `${idx + 1}. ${cliente.name} - ${cliente.total_os} OS - R$ ${cliente.valor_total}\n`
        })
      }
    }
  }

  if (contextMessage === "**CONTEXTO DO NEGÓCIO:**\n\n") {
    contextMessage = "**CONTEXTO:** Sem dados específicos do negócio no momento. Responda com base no conhecimento geral de gestão empresarial."
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: contextMessage },
    { role: "user", content: `**PERGUNTA DO USUÁRIO:** ${userMessage}` }
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
        max_tokens: config.max_tokens || 4000,
        top_p: config.top_p || 0.9,
        frequency_penalty: config.frequency_penalty || 0.1,
        presence_penalty: config.presence_penalty || 0.1
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
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
        max_tokens: config.max_tokens || 4000,
        temperature: config.temperature || 0.7,
        system: SYSTEM_PROMPT + "\n\n" + contextMessage,
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
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
        max_tokens: config.max_tokens || 4000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
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

    const { data: provider, error: providerError } = await supabase
      .rpc('get_active_ai_provider')

    if (providerError || !provider) {
      console.error('No active AI provider found:', providerError)

      const { data: fallbackResponse } = await supabase
        .rpc('thomaz_generate_contextual_response', {
          user_message: message,
          conv_id: sessionId,
          usr_id: userId || null
        })

      return new Response(
        JSON.stringify({
          response: fallbackResponse?.intent_analysis?.suggested_questions?.[0] ||
                   "Olá! Como posso ajudar você hoje?",
          confidence: 0.7,
          needsClarification: false,
          tone: 'professional'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    const { data: businessContext } = await supabase
      .rpc('prepare_ai_context', {
        user_message: message,
        session_id: sessionId
      })

    console.log('📊 Business context prepared:', businessContext?.intent_analysis?.intent)

    let aiResponse: string

    if (!provider.api_key) {
      console.log('⚠️  No API key configured, using fallback response')

      const { data: conversationalResponse } = await supabase
        .rpc('thomaz_generate_contextual_response', {
          user_message: message,
          conv_id: sessionId,
          usr_id: userId || null
        })

      const intent = conversationalResponse?.intent_analysis?.intent || 'conversation'
      const tone = conversationalResponse?.intent_analysis?.tone || 'professional'

      const responses: Record<string, string> = {
        'greeting': 'Olá! 👋 Como posso ajudar você hoje?\n\nPosso te auxiliar com análises de estoque, financeiro, ordens de serviço ou clientes!',
        'thanks': 'Por nada! 😊 Fico feliz em ajudar! Se precisar de mais alguma coisa, é só falar!',
        'goodbye': 'Até logo! 👋 Estarei aqui sempre que precisar!',
        'help_request': 'Claro! Posso te ajudar com:\n\n📦 Estoque e materiais\n💰 Financeiro\n🔧 Ordens de serviço\n👥 Clientes\n\nSobre qual área você precisa de ajuda?'
      }

      aiResponse = responses[intent] ||
                  'Desculpe, preciso de uma API key configurada para responder perguntas mais complexas. Por favor, configure um provedor de IA nas configurações do sistema.'

    } else {
      aiResponse = await callAIProvider(provider, message, businessContext)
    }

    console.log('✅ AI Response generated')

    await supabase.from('thomaz_conversation_context').upsert({
      session_id: sessionId,
      user_id: userId,
      context_data: {
        last_message: message,
        last_response: aiResponse,
        timestamp: new Date().toISOString()
      },
      last_interaction_at: new Date().toISOString()
    }, {
      onConflict: 'session_id'
    })

    const result: ChatResponse = {
      response: aiResponse,
      confidence: 0.9,
      needsClarification: false,
      tone: 'professional'
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