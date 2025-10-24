import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

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

    // 3. Buscar informações externas se necessário
    let externalData = null
    if (intent.needsExternalSearch) {
      externalData = await searchWeb(intent.query)
    }

    // 4. Gerar resposta contextualizada
    const response = await generateResponse(message, systemData, externalData, intent)

    // 5. Salvar no histórico
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

  // Análise de intenção baseada em palavras-chave
  const intents = {
    financial: ['financeiro', 'dre', 'receita', 'despesa', 'lucro', 'faturamento', 'custos'],
    serviceOrders: ['ordem', 'os', 'serviço', 'atendimento', 'técnico', 'manutenção'],
    inventory: ['estoque', 'material', 'produto', 'inventário', 'peça'],
    clients: ['cliente', 'contato', 'crm', 'lead', 'proposta'],
    employees: ['funcionário', 'técnico', 'equipe', 'colaborador', 'rh'],
    analytics: ['análise', 'relatório', 'indicador', 'kpi', 'dashboard', 'desempenho'],
    calendar: ['agenda', 'evento', 'compromisso', 'agendamento', 'calendário', 'reunião', 'encontro', 'horário', 'hoje', 'amanhã', 'semana'],
    comparison: ['comparar', 'diferença', 'versus', 'vs', 'melhor'],
    prediction: ['previsão', 'tendência', 'projeção', 'futuro', 'próximo']
  }

  let detectedIntent = 'general'
  let needsExternalSearch = false

  for (const [intentType, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedIntent = intentType
      break
    }
  }

  // Detecta se precisa de busca externa
  if (lowerMessage.includes('mercado') ||
      lowerMessage.includes('concorrente') ||
      lowerMessage.includes('norma') ||
      lowerMessage.includes('preço de mercado') ||
      lowerMessage.includes('legislação')) {
    needsExternalSearch = true
  }

  return {
    type: detectedIntent,
    needsExternalSearch,
    query: message
  }
}

// Busca dados do sistema
async function gatherSystemData(intent: any, supabase: any): Promise<any> {
  const data: any = {}

  try {
    switch (intent.type) {
      case 'financial':
        // Buscar dados financeiros
        const { data: financeData } = await supabase
          .from('finance_entries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        data.finance = financeData || []

        // Buscar resumo do DRE
        const { data: summary } = await supabase
          .rpc('get_financial_summary')
          .single()

        data.financialSummary = summary
        break

      case 'serviceOrders':
        // Buscar ordens de serviço
        const { data: orders } = await supabase
          .from('service_orders')
          .select(`
            *,
            customers (name, phone),
            service_order_items (*)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        data.serviceOrders = orders || []
        break

      case 'inventory':
        // Buscar estoque
        const { data: inventory } = await supabase
          .from('inventory_items')
          .select('*')
          .order('quantity', { ascending: true })
          .limit(100)

        data.inventory = inventory || []
        break

      case 'clients':
        // Buscar clientes
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        data.customers = customers || []
        break

      case 'employees':
        // Buscar funcionários
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .eq('is_active', true)

        data.employees = employees || []
        break

      case 'analytics':
        // Buscar KPIs e métricas
        const { data: kpis } = await supabase
          .from('v_business_kpis')
          .select('*')
          .single()

        data.kpis = kpis
        break

      case 'calendar':
        // Buscar eventos da agenda
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

        // Buscar eventos de hoje especificamente
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

    // Sempre buscar dados gerais da empresa
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

// Busca informações na web
async function searchWeb(query: string): Promise<any> {
  // Implementar busca na web usando API de busca
  // Por enquanto, retorna null (será implementado com API externa)
  console.log('Web search:', query)
  return null
}

// Gera resposta contextualizada
async function generateResponse(
  message: string,
  systemData: any,
  externalData: any,
  intent: any
): Promise<string> {
  // Montar contexto para resposta
  let response = ''

  // Identificação
  response += '🤖 **Assistente Giartech**\n\n'

  // Análise baseada na intenção
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
      response += await analyzeKPIs(message, systemData)
      break

    case 'calendar':
      response += await analyzeCalendar(message, systemData)
      break

    default:
      response += await generateGeneralResponse(message, systemData)
  }

  // Adicionar informações externas se disponíveis
  if (externalData) {
    response += '\n\n📊 **Contexto de Mercado:**\n' + externalData
  }

  return response
}

// Análise financeira
async function analyzeFinancialData(message: string, data: any): Promise<string> {
  let response = '💰 **Análise Financeira**\n\n'

  if (data.financialSummary) {
    const summary = data.financialSummary
    response += `📈 **Resumo Atual:**\n`
    response += `• Receitas: R$ ${summary.total_revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}\n`
    response += `• Despesas: R$ ${summary.total_expenses?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}\n`
    response += `• Lucro Líquido: R$ ${summary.net_profit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}\n`
    response += `• Margem: ${summary.profit_margin?.toFixed(2) || '0'}%\n\n`
  }

  if (data.finance && data.finance.length > 0) {
    const pendingPayments = data.finance.filter((f: any) => f.status === 'pending' && f.type === 'expense')
    const pendingReceivables = data.finance.filter((f: any) => f.status === 'pending' && f.type === 'income')

    response += `📊 **Pendências:**\n`
    response += `• Contas a pagar: ${pendingPayments.length}\n`
    response += `• Contas a receber: ${pendingReceivables.length}\n\n`

    response += `💡 **Recomendação:**\n`
    if (pendingPayments.length > 5) {
      response += `Há ${pendingPayments.length} despesas pendentes. Priorize pagamentos próximos do vencimento para evitar juros.\n`
    }
    if (pendingReceivables.length > 10) {
      response += `${pendingReceivables.length} recebíveis pendentes. Considere ações de cobrança ativa.\n`
    }
  }

  return response
}

// Análise de ordens de serviço
async function analyzeServiceOrders(message: string, data: any): Promise<string> {
  let response = '🔧 **Análise de Ordens de Serviço**\n\n'

  if (data.serviceOrders && data.serviceOrders.length > 0) {
    const orders = data.serviceOrders

    const byStatus = {
      pending: orders.filter((o: any) => o.status === 'pending').length,
      in_progress: orders.filter((o: any) => o.status === 'in_progress').length,
      completed: orders.filter((o: any) => o.status === 'completed').length,
      cancelled: orders.filter((o: any) => o.status === 'cancelled').length
    }

    response += `📊 **Status Atual:**\n`
    response += `• Pendentes: ${byStatus.pending}\n`
    response += `• Em andamento: ${byStatus.in_progress}\n`
    response += `• Concluídas: ${byStatus.completed}\n`
    response += `• Canceladas: ${byStatus.cancelled}\n\n`

    const totalValue = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
    response += `💵 **Valor Total:** R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    response += `💡 **Insights:**\n`
    if (byStatus.pending > 10) {
      response += `• Alto volume de OSs pendentes (${byStatus.pending}). Considere redistribuir a equipe.\n`
    }
    if (byStatus.in_progress > 20) {
      response += `• Muitas OSs em andamento simultaneamente. Foque em conclusão para melhorar fluxo de caixa.\n`
    }
  } else {
    response += 'Não há ordens de serviço registradas no período consultado.\n'
  }

  return response
}

// Análise de estoque
async function analyzeInventory(message: string, data: any): Promise<string> {
  let response = '📦 **Análise de Estoque**\n\n'

  if (data.inventory && data.inventory.length > 0) {
    const lowStock = data.inventory.filter((i: any) => i.quantity <= (i.minimum_stock || 5))
    const outOfStock = data.inventory.filter((i: any) => i.quantity === 0)

    response += `📊 **Status do Estoque:**\n`
    response += `• Total de itens: ${data.inventory.length}\n`
    response += `• Estoque baixo: ${lowStock.length}\n`
    response += `• Sem estoque: ${outOfStock.length}\n\n`

    if (lowStock.length > 0) {
      response += `⚠️ **Itens com Estoque Baixo:**\n`
      lowStock.slice(0, 5).forEach((item: any) => {
        response += `• ${item.name} - Qtd: ${item.quantity} ${item.unit || ''}\n`
      })
      response += '\n'
    }

    response += `💡 **Recomendação:**\n`
    if (lowStock.length > 0) {
      response += `Há ${lowStock.length} itens com estoque baixo. Programe reposição urgente.\n`
    }
    if (outOfStock.length > 0) {
      response += `${outOfStock.length} itens zerados podem impactar atendimentos. Priorize compra.\n`
    }
  }

  return response
}

// Análise de clientes
async function analyzeClients(message: string, data: any): Promise<string> {
  let response = '👥 **Análise de Clientes**\n\n'

  if (data.customers && data.customers.length > 0) {
    response += `📊 **Base de Clientes:**\n`
    response += `• Total de clientes: ${data.customers.length}\n\n`

    const recentClients = data.customers.filter((c: any) => {
      const created = new Date(c.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return created > thirtyDaysAgo
    })

    response += `📈 **Últimos 30 dias:**\n`
    response += `• Novos clientes: ${recentClients.length}\n\n`

    response += `💡 **Insights:**\n`
    if (recentClients.length > 10) {
      response += `Excelente! ${recentClients.length} novos clientes no último mês. Mantenha as estratégias de captação.\n`
    } else if (recentClients.length < 5) {
      response += `Apenas ${recentClients.length} novos clientes no mês. Considere intensificar ações comerciais.\n`
    }
  }

  return response
}

// Análise de funcionários
async function analyzeEmployees(message: string, data: any): Promise<string> {
  let response = '👨‍💼 **Análise de Equipe**\n\n'

  if (data.employees && data.employees.length > 0) {
    response += `📊 **Equipe Ativa:**\n`
    response += `• Total de colaboradores: ${data.employees.length}\n\n`

    const byPosition = data.employees.reduce((acc: any, emp: any) => {
      acc[emp.position] = (acc[emp.position] || 0) + 1
      return acc
    }, {})

    response += `📋 **Por Cargo:**\n`
    Object.entries(byPosition).forEach(([position, count]) => {
      response += `• ${position}: ${count}\n`
    })
  }

  return response
}

// Análise de KPIs
async function analyzeKPIs(message: string, data: any): Promise<string> {
  let response = '📊 **Indicadores de Desempenho**\n\n'

  if (data.kpis) {
    response += `🎯 **KPIs Principais:**\n`
    response += `• Taxa de conversão: ${data.kpis.conversion_rate?.toFixed(2) || '0'}%\n`
    response += `• Ticket médio: R$ ${data.kpis.average_ticket?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}\n`
    response += `• Satisfação do cliente: ${data.kpis.customer_satisfaction?.toFixed(1) || '0'}/10\n`
  }

  return response
}

// Resposta geral
async function generateGeneralResponse(message: string, data: any): Promise<string> {
  let response = ''

  if (data.company) {
    response += `Olá! Sou o Assistente Giartech da **${data.company.company_name}**.\n\n`
  }

  response += 'Como posso ajudá-lo hoje? Posso fornecer informações sobre:\n\n'
  response += '💰 Financeiro (receitas, despesas, DRE)\n'
  response += '🔧 Ordens de Serviço\n'
  response += '📦 Estoque e Materiais\n'
  response += '👥 Clientes e CRM\n'
  response += '👨‍💼 Equipe e Colaboradores\n'
  response += '📊 Indicadores e Análises\n'
  response += '📅 Agenda e Compromissos\n\n'
  response += 'Basta fazer sua pergunta!'

  return response
}

// Análise de agenda
async function analyzeCalendar(message: string, data: any): Promise<string> {
  let response = '📅 **Análise de Agenda**\n\n'

  const lowerMessage = message.toLowerCase()
  const isToday = lowerMessage.includes('hoje') || lowerMessage.includes('agora')
  const isTomorrow = lowerMessage.includes('amanhã')
  const isWeek = lowerMessage.includes('semana')

  // Eventos de hoje
  if (data.todayEvents && data.todayEvents.length > 0 && (isToday || !isWeek)) {
    response += '📆 **Hoje:**\n'

    if (data.todayEvents.length === 0) {
      response += '✅ Nenhum compromisso agendado para hoje.\n\n'
    } else {
      response += `📍 ${data.todayEvents.length} ${data.todayEvents.length === 1 ? 'evento agendado' : 'eventos agendados'}:\n\n`

      data.todayEvents.slice(0, 5).forEach((event: any) => {
        const startTime = new Date(event.start_time)
        const timeStr = startTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })

        response += `⏰ **${timeStr}** - ${event.title}\n`

        if (event.customers?.name) {
          response += `   👤 Cliente: ${event.customers.name}\n`
        }

        if (event.employees?.name) {
          response += `   👨‍🔧 Responsável: ${event.employees.name}\n`
        }

        if (event.service_orders?.order_number) {
          response += `   📋 OS: ${event.service_orders.order_number}\n`
        }

        if (event.location) {
          response += `   📍 Local: ${event.location}\n`
        }

        response += '\n'
      })

      if (data.todayEvents.length > 5) {
        response += `... e mais ${data.todayEvents.length - 5} eventos.\n\n`
      }
    }
  }

  // Eventos da semana
  if (data.agendaEvents && data.agendaEvents.length > 0 && (isWeek || !isToday)) {
    const byDay: { [key: string]: any[] } = {}

    data.agendaEvents.forEach((event: any) => {
      const date = new Date(event.start_time)
      const dateKey = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit'
      })

      if (!byDay[dateKey]) {
        byDay[dateKey] = []
      }
      byDay[dateKey].push(event)
    })

    response += '📊 **Próximos 7 Dias:**\n'
    response += `• Total de eventos: ${data.agendaEvents.length}\n`
    response += `• Dias com agenda: ${Object.keys(byDay).length}\n\n`

    response += '📋 **Resumo por Dia:**\n'
    Object.entries(byDay).slice(0, 7).forEach(([day, events]) => {
      response += `• ${day}: ${events.length} ${events.length === 1 ? 'evento' : 'eventos'}\n`
    })
    response += '\n'
  }

  // Estatísticas e insights
  if (data.agendaEvents && data.agendaEvents.length > 0) {
    const serviceOrderEvents = data.agendaEvents.filter((e: any) => e.service_order_id)
    const clientMeetings = data.agendaEvents.filter((e: any) => e.customer_id && !e.service_order_id)

    response += '📈 **Insights:**\n'

    if (serviceOrderEvents.length > 0) {
      response += `• ${serviceOrderEvents.length} eventos vinculados a OSs\n`
    }

    if (clientMeetings.length > 0) {
      response += `• ${clientMeetings.length} reuniões com clientes\n`
    }

    // Verificar conflitos de horário
    let hasConflicts = false
    for (let i = 0; i < data.agendaEvents.length - 1; i++) {
      const current = data.agendaEvents[i]
      const next = data.agendaEvents[i + 1]

      const currentEnd = new Date(current.end_time || current.start_time)
      const nextStart = new Date(next.start_time)

      if (currentEnd > nextStart && current.employee_id === next.employee_id) {
        hasConflicts = true
        break
      }
    }

    if (hasConflicts) {
      response += `⚠️ Atenção: Possíveis conflitos de horário detectados\n`
    }

    response += '\n'
  }

  // Recomendações
  if (data.todayEvents && data.todayEvents.length > 5) {
    response += '💡 **Recomendação:**\n'
    response += `Dia com ${data.todayEvents.length} compromissos. Considere priorizar e reagendar se necessário.\n`
  }

  if (!data.todayEvents || data.todayEvents.length === 0) {
    response += '✨ **Dica:**\n'
    response += 'Agenda livre hoje! Bom momento para planejamento ou tarefas administrativas.\n'
  }

  return response
}

// Salva conversa no histórico
async function saveConversation(
  conversationId: string,
  userId: string | undefined,
  userMessage: string,
  assistantResponse: string,
  supabase: any
) {
  try {
    await supabase.from('giartech_conversations').insert([
      {
        conversation_id: conversationId,
        user_id: userId,
        user_message: userMessage,
        assistant_response: assistantResponse,
        created_at: new Date().toISOString()
      }
    ])
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}