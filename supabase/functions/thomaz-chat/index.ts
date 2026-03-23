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
  explanationMode: string
  confidence: number
  needsClarification: boolean
  suggestedQuestions?: string[]
  tone: string
}

const RULE_2_INSTRUCTIONS = `
REGRA 2 - EXPLICACAO SOB DEMANDA (OBRIGATORIA):

Voce SO explica quando EXPLICITAMENTE autorizado.

COMPORTAMENTO PADRAO (modo EXECUTIVO):
- Frase curta (1-3 linhas no maximo)
- Diagnostico direto
- Orientacao objetiva
- SEM justificar decisao
- SEM didatismo
- SEM explicacoes nao solicitadas

MODO EXPLICATIVO (APENAS se autorizado):
- Fornecer base tecnica
- Detalhar calculos
- Mostrar composicao
- Explicar fundamentos
- Apresentar memoria de calculo

IMPORTANTE: O sistema ja detectou o modo apropriado para esta conversa.
Siga RIGOROSAMENTE o modo informado abaixo.
`

const MODE_PROMPTS = {
  CFO: `Voce e o Thomaz em MODO CFO - Chief Financial Officer experiente.

${RULE_2_INSTRUCTIONS}

SUA PERSONALIDADE:
- Analitico e pragmatico
- Fala direto, sem enrolacao
- Honesto sobre riscos
- Focado em numeros e projecoes
- Forward-thinking (sempre pensando no futuro)

SEU ESTILO DE FALA (modo EXECUTIVO):
- "Financeiramente falando..."
- "Os numeros mostram que..."
- "O risco aqui e..."
- "Se voce continuar nesse ritmo..."
- "Deixa eu ser direto:"

SUAS CAPACIDADES:
- Analise de KPIs financeiros
- Projecao de fluxo de caixa 30/60/90 dias
- Analise de margem e lucratividade
- Deteccao de riscos financeiros
- Recomendacoes de investimento vs retorno
- Analise de contas a pagar e receber
- Avaliacao de saude financeira da empresa

REGRAS:
1. SEMPRE use dados reais fornecidos
2. NUNCA invente numeros
3. Seja DIRETO sobre problemas
4. Ofereça SOLUCOES praticas
5. RESPEITE o modo de explicacao detectado
6. Quando mencionar valores, use o formato R$ X.XXX,XX`,

  ENGINEER: `Voce e o Thomaz em MODO ENGENHEIRO - Engenheiro de Climatizacao experiente.

${RULE_2_INSTRUCTIONS}

SUA PERSONALIDADE:
- Pratico e experiente
- Conecta tecnica com custo
- Alerta sobre erros comuns que ja viu
- Traduz complexidade tecnica para gestao
- Solution-oriented

SEU ESTILO DE FALA (modo EXECUTIVO):
- "Tecnicamente e viavel, mas..."
- "Na pratica, o que acontece e..."
- "Isso vai te custar mais em..."
- "Ja vi isso dar errado quando..."
- "O ideal seria..., mas se o orcamento esta apertado..."

SUAS CAPACIDADES:
- Analise tecnica de equipamentos (VRF, split, cassete, etc.)
- Dimensionamento de carga termica
- Avaliacao de custo vs beneficio tecnico
- Recomendacao de solucoes praticas
- PMOC e manutencao preventiva
- Diagnostico de falhas
- Gestao de estoque de materiais e pecas
- Controle de ordens de servico

REGRAS:
1. SEMPRE considere o custo junto com a tecnica
2. ALERTE sobre erros comuns
3. TRADUZA tecnica para linguagem de gestao
4. Seja PRATICO, nao apenas teorico
5. RESPEITE o modo de explicacao detectado`,

  STRATEGIC: `Voce e o Thomaz em MODO ESTRATEGICO - Conselheiro e Mentor empresarial.

${RULE_2_INSTRUCTIONS}

SUA PERSONALIDADE:
- Reflexivo e provocativo
- Faz perguntas que levam a resposta
- Organiza o pensamento do outro
- Paciente e estrategico
- Nao da resposta rasa

SEU ESTILO DE FALA (modo EXECUTIVO):
- "Antes disso, deixa eu te perguntar..."
- "Voce ja parou pra pensar que..."
- "O que realmente esta te travando e..."
- "Se a gente olhar de outro angulo..."
- "Vamos organizar isso:"

SUAS CAPACIDADES:
- Organizacao de pensamento
- Priorizacao de decisoes
- Analise de trade-offs
- Identificacao de gargalos
- Planejamento estrategico
- Mentoria em crescimento
- Analise de clientes e oportunidades de CRM
- Avaliacao de desempenho da equipe

ABORDAGEM SOCRATICA:
1. PERGUNTE antes de responder
2. ORGANIZE o pensamento em etapas
3. IDENTIFIQUE a causa raiz, nao sintomas
4. ANALISE trade-offs de cada opcao
5. PRIORIZE acoes por impacto

REGRAS:
1. EVITE respostas rasas
2. FACA perguntas provocativas
3. ORGANIZE pensamento em estruturas claras
4. IDENTIFIQUE o problema REAL por tras da pergunta
5. RESPEITE o modo de explicacao detectado`
}

async function getFullCompanyContext(supabase: any): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('thomaz_get_full_company_context')
    if (error) {
      console.error('Error fetching full company context:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('Exception fetching full company context:', err)
    return null
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function buildFullContext(mode: string, companyData: any): string {
  if (!companyData) {
    return "**CONTEXTO:** Dados da empresa indisponiveis no momento.\n"
  }

  const snapshot = companyData.snapshot || {}
  const osAberto = companyData.os_em_aberto || []
  const agenda = companyData.agenda || []
  const financeiroPendente = companyData.financeiro_pendente || []
  const estoqueAlertas = companyData.estoque_alertas || []
  const crmPipeline = companyData.crm_pipeline || []
  const topClientes = companyData.top_clientes || []
  const funcionarios = companyData.funcionarios || []
  const fornecedores = companyData.fornecedores || []
  const comprasAbertas = companyData.compras_abertas || []
  const contasBancarias = companyData.contas_bancarias || []

  let context = `**DADOS COMPLETOS DA EMPRESA - ${new Date().toLocaleDateString('pt-BR')}**\n\n`

  // ===== VISAO GERAL =====
  context += `## VISAO GERAL DO NEGOCIO\n`
  context += `- Total de Clientes: ${snapshot.total_customers || 0}\n`
  context += `- OS em Aberto: ${snapshot.os_in_progress || 0}\n`
  context += `- Receita do Mes: ${formatCurrency(snapshot.revenue_current_month)}\n`
  context += `- Despesas do Mes: ${formatCurrency(snapshot.expenses_current_month)}\n`
  context += `- Margem do Mes: ${snapshot.margin_current_month?.toFixed(1) || 0}%\n`
  context += `- Contas a Receber: ${formatCurrency(snapshot.accounts_receivable)}\n`
  context += `- Contas a Pagar: ${formatCurrency(snapshot.accounts_payable)}\n`
  context += `- Itens com Estoque Critico: ${snapshot.critical_stock_items || 0}\n`
  context += `- Funcionarios Ativos: ${snapshot.active_employees || 0}\n`
  context += `- Oportunidades CRM Ativas: ${snapshot.crm_opportunities_active || 0}\n\n`

  // ===== ORDENS DE SERVICO =====
  if (osAberto.length > 0) {
    context += `## ORDENS DE SERVICO EM ABERTO (${osAberto.length})\n`
    osAberto.slice(0, 8).forEach((os: any) => {
      const diasAberta = os.dias_em_aberto || 0
      const alerta = diasAberta > 7 ? ' [ATENCAO: mais de 7 dias]' : ''
      context += `- OS ${os.order_number || 'S/N'}: ${os.client_name || 'Cliente'} | ${os.status} | ${os.service_type || ''} | Valor: ${formatCurrency(os.total_value)} | ${diasAberta}d aberta${alerta}\n`
    })
    if (osAberto.length > 8) {
      context += `  ... e mais ${osAberto.length - 8} OS em aberto\n`
    }
    context += `\n`
  }

  // ===== AGENDA =====
  if (agenda.length > 0) {
    context += `## AGENDA - HOJE E PROXIMOS 7 DIAS (${agenda.length} eventos)\n`
    agenda.slice(0, 6).forEach((ev: any) => {
      const data = ev.start_date ? new Date(ev.start_date).toLocaleDateString('pt-BR') : ''
      context += `- ${data}: ${ev.title} | Tipo: ${ev.event_type || ''} | Status: ${ev.status || ''}`
      if (ev.customer_name) context += ` | Cliente: ${ev.customer_name}`
      if (ev.location) context += ` | Local: ${ev.location}`
      context += `\n`
    })
    if (agenda.length > 6) context += `  ... e mais ${agenda.length - 6} eventos\n`
    context += `\n`
  }

  // ===== FINANCEIRO PENDENTE =====
  if (financeiroPendente.length > 0) {
    const receberPendente = financeiroPendente.filter((f: any) => f.tipo === 'receita')
    const pagarPendente = financeiroPendente.filter((f: any) => f.tipo === 'despesa')
    const vencidos = financeiroPendente.filter((f: any) => f.esta_vencido)

    context += `## FINANCEIRO PENDENTE\n`
    context += `- Total a Receber: ${receberPendente.length} lancamentos\n`
    context += `- Total a Pagar: ${pagarPendente.length} lancamentos\n`
    if (vencidos.length > 0) {
      context += `- VENCIDOS: ${vencidos.length} lancamentos em atraso\n`
      vencidos.slice(0, 3).forEach((v: any) => {
        context += `  * ${v.descricao}: ${formatCurrency(v.valor)} | Venceu em: ${v.data_vencimento ? new Date(v.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'} | ${v.dias_atraso || 0} dias atrasado\n`
      })
    }

    const proximos = financeiroPendente.filter((f: any) => !f.esta_vencido).slice(0, 3)
    if (proximos.length > 0) {
      context += `- Proximos vencimentos:\n`
      proximos.forEach((p: any) => {
        context += `  * ${p.descricao}: ${formatCurrency(p.valor)} | Vence: ${p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString('pt-BR') : 'N/A'} | ${p.tipo}\n`
      })
    }
    context += `\n`
  }

  // ===== ESTOQUE =====
  if (estoqueAlertas.length > 0) {
    context += `## ESTOQUE - ITENS QUE PRECISAM DE ATENCAO (${estoqueAlertas.length})\n`
    const semEstoque = estoqueAlertas.filter((i: any) => i.status_estoque === 'sem_estoque')
    const critico = estoqueAlertas.filter((i: any) => i.status_estoque === 'critico')
    const baixo = estoqueAlertas.filter((i: any) => i.status_estoque === 'baixo')

    if (semEstoque.length > 0) {
      context += `- SEM ESTOQUE (${semEstoque.length}):\n`
      semEstoque.slice(0, 3).forEach((i: any) => {
        context += `  * ${i.name} (${i.code || 'sem codigo'}) | Min: ${i.min_quantity} | Custo unit: ${formatCurrency(i.unit_cost)}\n`
      })
    }
    if (critico.length > 0) {
      context += `- CRITICO (${critico.length}):\n`
      critico.slice(0, 3).forEach((i: any) => {
        context += `  * ${i.name} | Atual: ${i.quantity} | Min: ${i.min_quantity}\n`
      })
    }
    if (baixo.length > 0) {
      context += `- BAIXO (${baixo.length} itens)\n`
    }
    context += `\n`
  }

  // ===== CRM =====
  if (crmPipeline.length > 0) {
    const totalValorCRM = crmPipeline.reduce((sum: number, op: any) => sum + (op.valor || 0), 0)
    const totalPonderado = crmPipeline.reduce((sum: number, op: any) => sum + (op.valor_ponderado || 0), 0)
    context += `## CRM - PIPELINE DE OPORTUNIDADES (${crmPipeline.length} ativas)\n`
    context += `- Valor Total em Pipeline: ${formatCurrency(totalValorCRM)}\n`
    context += `- Valor Ponderado (por probabilidade): ${formatCurrency(totalPonderado)}\n`
    crmPipeline.slice(0, 5).forEach((op: any) => {
      context += `- ${op.titulo}: ${formatCurrency(op.valor)} | Lead Score: ${op.lead_score || 0} | Status: ${op.status}\n`
    })
    if (crmPipeline.length > 5) context += `  ... e mais ${crmPipeline.length - 5} oportunidades\n`
    context += `\n`
  }

  // ===== TOP CLIENTES =====
  if (topClientes.length > 0) {
    context += `## TOP CLIENTES\n`
    topClientes.slice(0, 5).forEach((c: any, idx: number) => {
      context += `${idx + 1}. ${c.nome_razao || 'N/A'} | OS: ${c.total_os || 0} | Receita Total: ${formatCurrency(c.receita_total)} | Ultima OS: ${c.ultima_os ? new Date(c.ultima_os).toLocaleDateString('pt-BR') : 'N/A'}\n`
    })
    context += `\n`
  }

  // ===== FUNCIONARIOS =====
  if (funcionarios.length > 0) {
    context += `## EQUIPE (${funcionarios.length} funcionarios ativos)\n`
    funcionarios.slice(0, 6).forEach((f: any) => {
      context += `- ${f.name} | ${f.role || f.department || 'N/A'} | OS atribuidas: ${f.os_atribuidas || 0} | OS concluidas: ${f.os_concluidas || 0}\n`
    })
    if (funcionarios.length > 6) context += `  ... e mais ${funcionarios.length - 6} funcionarios\n`
    context += `\n`
  }

  // ===== CONTAS BANCARIAS =====
  if (contasBancarias.length > 0) {
    const saldoTotal = contasBancarias.reduce((sum: number, c: any) => sum + (c.balance || 0), 0)
    context += `## CONTAS BANCARIAS\n`
    context += `- Saldo Total: ${formatCurrency(saldoTotal)}\n`
    contasBancarias.forEach((c: any) => {
      context += `- ${c.account_name} (${c.bank_name || 'N/A'}): ${formatCurrency(c.balance)}${c.is_default ? ' [PRINCIPAL]' : ''}\n`
    })
    context += `\n`
  }

  // ===== FORNECEDORES / COMPRAS =====
  if (comprasAbertas.length > 0) {
    context += `## COMPRAS EM ABERTO (${comprasAbertas.length})\n`
    comprasAbertas.slice(0, 4).forEach((c: any) => {
      context += `- ${c.order_number || 'S/N'}: ${c.supplier_name || 'N/A'} | ${formatCurrency(c.final_amount)} | Status: ${c.status}\n`
    })
    context += `\n`
  }

  if (fornecedores.length > 0) {
    context += `## FORNECEDORES (${fornecedores.length} ativos)\n`
    fornecedores.slice(0, 4).forEach((f: any) => {
      context += `- ${f.name} | Total compras: ${formatCurrency(f.total_compras)} | Ultima compra: ${f.ultima_compra ? new Date(f.ultima_compra).toLocaleDateString('pt-BR') : 'N/A'}\n`
    })
    context += `\n`
  }

  return context
}

async function callAIProvider(
  provider: any,
  userMessage: string,
  mode: string,
  explanationMode: string,
  modeContext: string
): Promise<string> {
  const providerType = provider.provider_type
  const apiKey = provider.api_key
  const apiUrl = provider.api_url
  const model = provider.default_model
  const config = provider.config || {}

  const systemPrompt = MODE_PROMPTS[mode as keyof typeof MODE_PROMPTS] || MODE_PROMPTS.STRATEGIC

  const explanationInstruction = explanationMode === 'EXPLICATIVO'
    ? '\n\nMODO EXPLICATIVO ATIVADO: Usuario solicitou explicacao. Forneca detalhes tecnicos, calculos e fundamentos. Pode ser mais extenso.'
    : '\n\nMODO EXECUTIVO ATIVO: Responda em 1-3 linhas. Seja direto. SEM explicacoes nao solicitadas.'

  const messages = [
    { role: "system", content: systemPrompt + explanationInstruction },
    { role: "user", content: modeContext },
    { role: "user", content: `**PERGUNTA DO USUARIO:** ${userMessage}` }
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
        max_tokens: explanationMode === 'EXPLICATIVO' ? 3000 : 600
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
        max_tokens: explanationMode === 'EXPLICATIVO' ? 3000 : 600,
        temperature: config.temperature || 0.7,
        system: systemPrompt + explanationInstruction + "\n\n" + modeContext,
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
        max_tokens: explanationMode === 'EXPLICATIVO' ? 3000 : 600
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

    console.log('Thomaz Chat: Processing message:', message)

    // PASSO 1: Detectar modo cognitivo (CFO/ENGINEER/STRATEGIC)
    const { data: modeDetection } = await supabase
      .rpc('thomaz_detect_mode_and_intent', {
        user_message: message,
        p_session_id: sessionId
      })

    const detectedMode = modeDetection?.mode || 'STRATEGIC'
    const detectedIntent = modeDetection?.intent || 'general'
    const confidence = modeDetection?.confidence || 0.5

    console.log(`Modo cognitivo: ${detectedMode} (${(confidence * 100).toFixed(0)}%)`)

    // PASSO 2: Detectar modo de explicacao (EXECUTIVO/EXPLICATIVO)
    const { data: explanationDetection } = await supabase
      .rpc('thomaz_should_explain', {
        user_message: message
      })

    const explanationMode = explanationDetection?.mode || 'EXECUTIVO'
    const shouldExplain = explanationDetection?.should_explain || false

    console.log(`Modo explicacao: ${explanationMode}`)

    // PASSO 3: Obter personalidade do modo
    const { data: modeData } = await supabase
      .from('thomaz_cognitive_modes')
      .select('*')
      .eq('mode_code', detectedMode)
      .maybeSingle()

    const modeName = modeData?.mode_name || detectedMode

    // PASSO 4: Buscar TODOS os dados da empresa em uma unica chamada
    console.log('Buscando contexto completo da empresa...')
    const companyData = await getFullCompanyContext(supabase)

    // PASSO 5: Montar contexto rico com todos os dados
    const modeContext = buildFullContext(detectedMode, companyData)

    console.log(`Contexto gerado: ${modeContext.length} caracteres`)

    // PASSO 6: Obter provider de IA
    const { data: provider } = await supabase.rpc('get_active_ai_provider')

    let aiResponse: string

    // PASSO 7: Gerar resposta
    if (!provider || !provider.api_key) {
      console.log('Modo fallback (sem API key)')

      const snapshot = companyData?.snapshot || {}
      const osAberto = companyData?.os_em_aberto?.length || 0
      const vencidos = companyData?.financeiro_pendente?.filter((f: any) => f.esta_vencido)?.length || 0

      if (detectedMode === 'CFO') {
        aiResponse = `Resumo financeiro: Receita do mes ${formatCurrency(snapshot.revenue_current_month)}, margem ${snapshot.margin_current_month?.toFixed(1) || 0}%. ${vencidos > 0 ? `${vencidos} lancamentos vencidos precisam de atencao.` : 'Sem pendencias vencidas.'} Configure API key para analise completa.`
      } else if (detectedMode === 'ENGINEER') {
        aiResponse = `Resumo operacional: ${osAberto} OS em aberto, ${snapshot.critical_stock_items || 0} itens com estoque critico. Configure API key para analise tecnica completa.`
      } else {
        aiResponse = `Visao geral: ${snapshot.total_customers || 0} clientes, ${osAberto} OS em aberto, receita do mes ${formatCurrency(snapshot.revenue_current_month)}. Configure API key para conversas estrategicas completas.`
      }

    } else {
      aiResponse = await callAIProvider(provider, message, detectedMode, explanationMode, modeContext)
    }

    console.log('Resposta gerada com sucesso')

    // PASSO 8: Registrar interacao
    await supabase.from('thomaz_interactions').insert({
      user_id: userId,
      session_id: sessionId,
      user_message: message,
      thomaz_response: aiResponse,
      mode_used: detectedMode,
      intent_detected: detectedIntent,
      confidence_score: confidence,
      metadata: {
        explanation_mode: explanationMode,
        should_explain: shouldExplain,
        context_size: modeContext.length,
        data_sections: Object.keys(companyData || {}).length
      }
    })

    const result: ChatResponse = {
      response: aiResponse,
      mode: detectedMode,
      modeName: modeName,
      intent: detectedIntent,
      explanationMode: explanationMode,
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
    console.error('Error in Thomaz Chat:', error)
    return new Response(
      JSON.stringify({
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        mode: 'STRATEGIC',
        modeName: 'Estrategico',
        intent: 'error',
        explanationMode: 'EXECUTIVO',
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
