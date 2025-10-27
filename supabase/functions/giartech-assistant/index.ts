import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const SYSTEM_IDENTITY = `
# Assistente Giartech - Inteligência Corporativa

Você é o **Assistente Giartech**, criado por Tiago Bruno Giaquinto para a Giartech Soluções em Climatização.
Atua como consultor estratégico e operacional, transformando dados em decisões inteligentes.

## Missão
Apoiar nas áreas: Operacional (OS, técnicos, VRF), Financeira (DRE, fluxo de caixa), Comercial (CRM, contratos) e Estratégica (KPIs, metas).

## Estilo
Tom corporativo, empático e focado em ação. Sempre estruture:
📊 RESUMO EXECUTIVO - pontos-chave
📈 ANÁLISE - dados e tendências
💡 RECOMENDAÇÕES - ações práticas
⚠️ RISCOS - pontos de atenção
🎯 PRÓXIMOS PASSOS - cronograma
📚 FONTES - origem dos dados

Você é o elo entre dados e decisão!
`

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AssistantRequest {
  message: string
  conversationId?: string
  userId?: string
  context?: any
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { message, conversationId, userId, context } = await req.json() as AssistantRequest

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 1. Analisar a intenção do usuário
    const intent = await analyzeIntent(message)

    // 2. Buscar dados relevantes do sistema
    const systemData = await gatherSystemData(intent, supabase)

    // 3. Gerar resposta contextualizada
    const response = await generateResponse(message, systemData, intent)

    // 4. Salvar no histórico
    await saveConversation(conversationId || crypto.randomUUID(), userId, message, response, supabase)

    return new Response(
      JSON.stringify({
        success: true,
        response,
        intent: intent.type,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

// Analisa a intenção do usuário
async function analyzeIntent(message: string): Promise<any> {
  const lowerMessage = message.toLowerCase()

  const intents = {
    financial: ['financeiro', 'dre', 'receita', 'despesa', 'lucro', 'faturamento', 'custos', 'pagar', 'receber'],
    serviceOrders: ['ordem', 'os', 'serviço', 'atendimento', 'técnico', 'manutenção'],
    inventory: ['estoque', 'material', 'produto', 'inventário', 'peça'],
    clients: ['cliente', 'contato', 'crm', 'lead', 'proposta'],
    employees: ['funcionário', 'técnico', 'equipe', 'colaborador', 'rh'],
    analytics: ['análise', 'relatório', 'indicador', 'kpi', 'dashboard', 'desempenho'],
    calendar: ['agenda', 'evento', 'compromisso', 'agendamento', 'calendário', 'reunião', 'encontro', 'horário', 'hoje', 'amanhã', 'semana']
  }

  let detectedIntent = 'general'

  for (const [intentType, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedIntent = intentType
      break
    }
  }

  return {
    type: detectedIntent,
    query: message
  }
}

// Busca dados do sistema
async function gatherSystemData(intent: any, supabase: any): Promise<any> {
  const data: any = {}

  try {
    switch (intent.type) {
      case 'financial':
        // Buscar dados financeiros do mês atual
        const currentDate = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        
        const { data: financeData } = await supabase
          .from('finance_entries')
          .select('*')
          .gte('data', firstDayOfMonth.toISOString().split('T')[0])
          .order('data', { ascending: false })

        data.finance = financeData || []

        // Calcular resumo
        const receitas = financeData?.filter((f: any) => f.tipo === 'receita') || []
        const despesas = financeData?.filter((f: any) => f.tipo === 'despesa') || []
        
        const totalReceitas = receitas.reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0)
        const totalDespesas = despesas.reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0)
        
        data.financialSummary = {
          total_revenue: totalReceitas,
          total_expenses: totalDespesas,
          profit: totalReceitas - totalDespesas,
          margin: totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas * 100) : 0
        }
        break

      case 'serviceOrders':
        const { data: orders } = await supabase
          .from('service_orders')
          .select(`
            *,
            customers (name, phone)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        data.serviceOrders = orders || []
        break

      case 'inventory':
        const { data: inventory } = await supabase
          .from('inventory_items')
          .select('*')
          .order('quantity', { ascending: true })
          .limit(100)

        data.inventory = inventory || []
        break

      case 'clients':
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        data.customers = customers || []
        break

      case 'employees':
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .eq('active', true)

        data.employees = employees || []
        break

      case 'analytics':
        const { data: stats } = await supabase.rpc('thomaz_get_system_stats')
        data.stats = stats
        break

      case 'calendar':
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)

        const { data: agendaEvents } = await supabase
          .from('agenda_events')
          .select(`
            *,
            customers (name, phone),
            employees (name, position),
            service_orders (order_number, status)
          `)
          .gte('start_time', today.toISOString())
          .lte('start_time', nextWeek.toISOString())
          .order('start_time', { ascending: true })

        data.agendaEvents = agendaEvents || []

        // Eventos de hoje
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data: todayEvents } = await supabase
          .from('agenda_events')
          .select(`
            *,
            customers (name, phone),
            employees (name, position),
            service_orders (order_number, status)
          `)
          .gte('start_time', today.toISOString())
          .lt('start_time', tomorrow.toISOString())
          .order('start_time', { ascending: true })

        data.todayEvents = todayEvents || []
        break
    }

    // Sempre buscar dados gerais
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .single()

    data.company = companySettings

  } catch (error) {
    console.error('Error gathering system data:', error)
  }

  return data
}

// Gera resposta contextualizada
async function generateResponse(
  message: string,
  systemData: any,
  intent: any
): Promise<string> {
  let response = ''

  switch (intent.type) {
    case 'financial':
      response += await analyzeFinancialData(message, systemData)
      break

    case 'serviceOrders':
      response += await analyzeServiceOrders(message, systemData)
      break

    case 'inventory':
      response += await analyzeInventory(message, systemData)
      break

    case 'clients':
      response += await analyzeClients(message, systemData)
      break

    case 'employees':
      response += await analyzeEmployees(message, systemData)
      break

    case 'analytics':
      response += await analyzeAnalytics(message, systemData)
      break

    case 'calendar':
      response += await analyzeCalendar(message, systemData)
      break

    default:
      response += await generateGeneralResponse(message, systemData)
  }

  return response
}

// Análise financeira
async function analyzeFinancialData(message: string, data: any): Promise<string> {
  let response = '💰 **ANÁLISE FINANCEIRA**\n\n'

  if (data.financialSummary) {
    const summary = data.financialSummary
    const revenue = summary.total_revenue || 0
    const expenses = summary.total_expenses || 0
    const profit = summary.profit || 0
    const margin = summary.margin || 0

    response += '📊 **RESUMO EXECUTIVO**\n'
    response += `• Receita Total: R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `• Despesas: R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `• Lucro Líquido: R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `• Margem: ${margin.toFixed(2)}%\n\n`
  }

  if (data.finance && data.finance.length > 0) {
    const pendingPayments = data.finance.filter((f: any) => f.status === 'pendente' && f.tipo === 'despesa')
    const pendingReceivables = data.finance.filter((f: any) => f.status === 'pendente' && f.tipo === 'receita')
    
    const totalPayable = pendingPayments.reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0)
    const totalReceivable = pendingReceivables.reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0)

    response += '📈 **ANÁLISE**\n'
    response += `• Contas a Pagar: ${pendingPayments.length} (R$ ${totalPayable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})\n`
    response += `• Contas a Receber: ${pendingReceivables.length} (R$ ${totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})\n`
    response += `• Saldo Projetado: R$ ${(totalReceivable - totalPayable).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    response += '💡 **RECOMENDAÇÕES**\n'
    if (totalPayable > totalReceivable) {
      response += `⚠️ Contas a pagar excedem recebíveis em R$ ${(totalPayable - totalReceivable).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      response += '• Intensificar cobranças\n'
      response += '• Negociar prazos com fornecedores\n'
    } else {
      response += '✅ Fluxo de caixa positivo\n'
      response += '• Manter controle de pagamentos\n'
    }
  } else {
    response += '⚠️ Nenhum lançamento financeiro encontrado no período.\n'
  }

  return response
}

// Análise de ordens de serviço
async function analyzeServiceOrders(message: string, data: any): Promise<string> {
  let response = '🔧 **ORDENS DE SERVIÇO**\n\n'

  if (data.serviceOrders && data.serviceOrders.length > 0) {
    const orders = data.serviceOrders

    const byStatus = {
      pending: orders.filter((o: any) => o.status === 'pending' || o.status === 'aberta').length,
      in_progress: orders.filter((o: any) => o.status === 'in_progress' || o.status === 'em_andamento').length,
      completed: orders.filter((o: any) => o.status === 'completed' || o.status === 'concluida').length
    }

    const totalValue = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount || o.total_value || 0), 0)
    const avgValue = orders.length > 0 ? totalValue / orders.length : 0

    response += '📊 **RESUMO**\n'
    response += `• Total de OSs: ${orders.length}\n`
    response += `• Pendentes: ${byStatus.pending}\n`
    response += `• Em Andamento: ${byStatus.in_progress}\n`
    response += `• Concluídas: ${byStatus.completed}\n`
    response += `• Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `• Ticket Médio: R$ ${avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    response += '💡 **RECOMENDAÇÕES**\n'
    if (byStatus.pending > 10) {
      response += `⚠️ ${byStatus.pending} OSs pendentes - alocar mais técnicos\n`
    }
    if (byStatus.completed > byStatus.pending + byStatus.in_progress) {
      response += '✅ Boa performance de conclusão\n'
    }
  } else {
    response += '⚠️ Nenhuma ordem de serviço encontrada.\n'
  }

  return response
}

// Análise de estoque
async function analyzeInventory(message: string, data: any): Promise<string> {
  let response = '📦 **ESTOQUE**\n\n'

  if (data.inventory && data.inventory.length > 0) {
    const lowStock = data.inventory.filter((i: any) => Number(i.quantity) <= Number(i.min_quantity || 5))
    const outOfStock = data.inventory.filter((i: any) => Number(i.quantity) === 0)

    response += `📊 **STATUS**\n`
    response += `• Total de itens: ${data.inventory.length}\n`
    response += `• Estoque baixo: ${lowStock.length}\n`
    response += `• Sem estoque: ${outOfStock.length}\n\n`

    if (lowStock.length > 0) {
      response += `⚠️ **ITENS COM ESTOQUE BAIXO:**\n`
      lowStock.slice(0, 5).forEach((item: any) => {
        response += `• ${item.name} - Qtd: ${item.quantity} ${item.unit || ''}\n`
      })
      response += '\n'
    }

    response += `💡 **RECOMENDAÇÃO**\n`
    if (lowStock.length > 0) {
      response += `Há ${lowStock.length} itens com estoque baixo. Programe reposição urgente.\n`
    } else {
      response += 'Estoque em níveis adequados.\n'
    }
  }

  return response
}

// Análise de clientes
async function analyzeClients(message: string, data: any): Promise<string> {
  let response = '👥 **CLIENTES**\n\n'

  if (data.customers && data.customers.length > 0) {
    response += `📊 **BASE DE CLIENTES**\n`
    response += `• Total: ${data.customers.length}\n\n`

    const recentClients = data.customers.filter((c: any) => {
      const created = new Date(c.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return created > thirtyDaysAgo
    })

    response += `📈 **ÚLTIMOS 30 DIAS**\n`
    response += `• Novos clientes: ${recentClients.length}\n\n`

    response += `💡 **INSIGHTS**\n`
    if (recentClients.length > 10) {
      response += `Excelente! ${recentClients.length} novos clientes no mês.\n`
    } else if (recentClients.length < 5) {
      response += `Apenas ${recentClients.length} novos clientes. Intensificar ações comerciais.\n`
    }
  }

  return response
}

// Análise de funcionários
async function analyzeEmployees(message: string, data: any): Promise<string> {
  let response = '👨‍💼 **EQUIPE**\n\n'

  if (data.employees && data.employees.length > 0) {
    response += `📊 **EQUIPE ATIVA**\n`
    response += `• Total: ${data.employees.length} colaboradores\n\n`

    const byPosition = data.employees.reduce((acc: any, emp: any) => {
      const pos = emp.position || 'Não definido'
      acc[pos] = (acc[pos] || 0) + 1
      return acc
    }, {})

    response += `📋 **POR CARGO**\n`
    Object.entries(byPosition).forEach(([position, count]) => {
      response += `• ${position}: ${count}\n`
    })
  }

  return response
}

// Análise de analytics
async function analyzeAnalytics(message: string, data: any): Promise<string> {
  let response = '📊 **INDICADORES**\n\n'

  if (data.stats) {
    response += `🎯 **VISÃO GERAL**\n`
    response += `• Ordens de Serviço: ${data.stats.total_oss || 0} (${data.stats.oss_abertas || 0} abertas)\n`
    response += `• Clientes: ${data.stats.total_clientes || 0}\n`
    response += `• Funcionários: ${data.stats.total_funcionarios || 0}\n`
    response += `• Itens em Estoque: ${data.stats.itens_estoque || 0}\n`
    
    if (data.stats.estoque_baixo > 0) {
      response += `• ⚠️ Estoque Baixo: ${data.stats.estoque_baixo} itens\n`
    }
    
    response += `\n📈 **FINANCEIRO DO MÊS**\n`
    response += `• Receitas: R$ ${Number(data.stats.receitas_mes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `• Despesas: R$ ${Number(data.stats.despesas_mes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    
    const saldo = Number(data.stats.receitas_mes || 0) - Number(data.stats.despesas_mes || 0)
    response += `• Saldo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${saldo >= 0 ? '✅' : '⚠️'}\n`
  }

  return response
}

// Análise de agenda
async function analyzeCalendar(message: string, data: any): Promise<string> {
  let response = '📅 **AGENDA**\n\n'

  const lowerMessage = message.toLowerCase()
  const isToday = lowerMessage.includes('hoje')

  if (data.todayEvents && data.todayEvents.length > 0) {
    response += `📆 **HOJE (${new Date().toLocaleDateString('pt-BR')})**\n`
    response += `• ${data.todayEvents.length} ${data.todayEvents.length === 1 ? 'evento' : 'eventos'}\n\n`

    data.todayEvents.slice(0, 5).forEach((event: any) => {
      const startTime = new Date(event.start_time)
      const timeStr = startTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })

      response += `⏰ **${timeStr}** - ${event.title}\n`

      if (event.customers?.name) {
        response += `   👤 ${event.customers.name}\n`
      }

      if (event.employees?.name) {
        response += `   👨‍🔧 ${event.employees.name}\n`
      }

      if (event.location) {
        response += `   📍 ${event.location}\n`
      }

      response += '\n'
    })

    if (data.todayEvents.length > 5) {
      response += `... e mais ${data.todayEvents.length - 5} eventos.\n`
    }
  } else if (isToday) {
    response += '✅ **HOJE**\n'
    response += 'Nenhum compromisso agendado para hoje.\n'
  }

  if (data.agendaEvents && data.agendaEvents.length > 0 && !isToday) {
    response += `\n📊 **PRÓXIMOS 7 DIAS**\n`
    response += `• Total: ${data.agendaEvents.length} eventos\n`
  }

  return response
}

// Resposta geral
async function generateGeneralResponse(message: string, data: any): Promise<string> {
  let response = ''

  if (data.company) {
    response += `Olá! Sou o Assistente Giartech da **${data.company.company_name}**.\n\n`
  } else {
    response += 'Olá! Sou o Assistente Giartech.\n\n'
  }

  response += 'Como posso ajudá-lo? Posso fornecer informações sobre:\n\n'
  response += '💰 Financeiro\n'
  response += '🔧 Ordens de Serviço\n'
  response += '📦 Estoque\n'
  response += '👥 Clientes\n'
  response += '👨‍💼 Equipe\n'
  response += '📊 Indicadores\n'
  response += '📅 Agenda\n\n'
  response += 'Basta fazer sua pergunta!'

  return response
}

// Salva conversa
async function saveConversation(
  conversationId: string,
  userId: string | undefined,
  userMessage: string,
  assistantResponse: string,
  supabase: any
) {
  try {
    await supabase.from('giartech_conversations').insert([{
      conversation_id: conversationId,
      user_id: userId,
      user_message: userMessage,
      assistant_response: assistantResponse,
      created_at: new Date().toISOString()
    }])
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}