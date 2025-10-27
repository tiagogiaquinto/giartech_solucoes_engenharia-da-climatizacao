import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface AssistantRequest {
  message: string
  conversationId?: string
  userId?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { message, conversationId, userId } = await req.json() as AssistantRequest

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const intent = await analyzeIntent(message)
    const systemData = await gatherSystemData(intent, supabase)
    const response = await generateHumanResponse(message, systemData, intent)

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

// Saudações humanizadas
function getGreeting(): string {
  const hour = new Date().getHours()
  const greetings = [
    'Oi!', 'Olá!', 'E aí!', 'Tudo bem?', 'Beleza?'
  ]
  const random = greetings[Math.floor(Math.random() * greetings.length)]
  
  if (hour < 6) return `${random} Ainda acordado? 😅`
  if (hour < 12) return `${random} Bom dia! ☀️`
  if (hour < 18) return `${random} Boa tarde! 🌤️`
  return `${random} Boa noite! 🌙`
}

// Frases de transição humanizadas
function getTransition(): string {
  const transitions = [
    'Deixa eu ver aqui...',
    'Vou dar uma olhada nos dados...',
    'Já vou te mostrar!',
    'Olha só o que encontrei:',
    'Bom, analisando aqui...',
    'Deixa eu checar pra você...',
    'Já te passo as informações!'
  ]
  return transitions[Math.floor(Math.random() * transitions.length)]
}

// Comentários humanizados
function getPositiveComment(): string {
  const comments = [
    'Isso tá show! 🎉',
    'Olha que legal!',
    'Bacana isso hein!',
    'Tá indo bem!',
    'Excelente!',
    'Boa! 👏'
  ]
  return comments[Math.floor(Math.random() * comments.length)]
}

function getConcernComment(): string {
  const comments = [
    'Opa, preciso te alertar sobre isso...',
    'Hmm, achei algo aqui que merece atenção...',
    'Olha, tem uma coisa que você precisa ver...',
    'Eita, encontrei um ponto de atenção...',
    'Vou te mostrar algo importante...'
  ]
  return comments[Math.floor(Math.random() * comments.length)]
}

async function analyzeIntent(message: string): Promise<any> {
  const lowerMessage = message.toLowerCase()
  const intents = {
    financial: ['financeiro', 'dre', 'receita', 'despesa', 'lucro', 'faturamento', 'dinheiro', 'grana', 'custos', 'pagar', 'receber'],
    serviceOrders: ['ordem', 'os', 'serviço', 'atendimento', 'técnico', 'manutenção', 'chamado'],
    inventory: ['estoque', 'material', 'produto', 'inventário', 'peça'],
    clients: ['cliente', 'contato', 'crm', 'lead'],
    employees: ['funcionário', 'técnico', 'equipe', 'colaborador', 'pessoal'],
    analytics: ['análise', 'relatório', 'indicador', 'dashboard', 'resumo', 'visão'],
    calendar: ['agenda', 'evento', 'compromisso', 'reunião', 'hoje', 'amanhã', 'semana']
  }

  let detectedIntent = 'general'
  for (const [intentType, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      detectedIntent = intentType
      break
    }
  }

  return { type: detectedIntent, query: message }
}

async function gatherSystemData(intent: any, supabase: any): Promise<any> {
  const data: any = {}

  try {
    switch (intent.type) {
      case 'financial':
        const currentDate = new Date()
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        
        const { data: financeData } = await supabase
          .from('finance_entries')
          .select('*')
          .gte('data', firstDay.toISOString().split('T')[0])
          .order('data', { ascending: false })

        data.finance = financeData || []
        
        const receitas = financeData?.filter((f: any) => f.tipo === 'receita') || []
        const despesas = financeData?.filter((f: any) => f.tipo === 'despesa') || []
        
        const totalReceitas = receitas.reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0)
        const totalDespesas = despesas.reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0)
        
        data.financialSummary = {
          total_revenue: totalReceitas,
          total_expenses: totalDespesas,
          profit: totalReceitas - totalDespesas
        }
        break

      case 'serviceOrders':
        const { data: orders } = await supabase
          .from('service_orders')
          .select('*, customers(name, phone)')
          .order('created_at', { ascending: false })
          .limit(50)
        data.serviceOrders = orders || []
        break

      case 'inventory':
        const { data: inventory } = await supabase
          .from('inventory_items')
          .select('*')
          .order('quantity', { ascending: true })
        data.inventory = inventory || []
        break

      case 'clients':
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
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
          .select('*, customers(name), employees(name), service_orders(order_number)')
          .gte('start_time', today.toISOString())
          .lte('start_time', nextWeek.toISOString())
          .order('start_time', { ascending: true })
        data.agendaEvents = agendaEvents || []

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const { data: todayEvents } = await supabase
          .from('agenda_events')
          .select('*, customers(name), employees(name), service_orders(order_number)')
          .gte('start_time', today.toISOString())
          .lt('start_time', tomorrow.toISOString())
          .order('start_time', { ascending: true })
        data.todayEvents = todayEvents || []
        break
    }
  } catch (error) {
    console.error('Error gathering data:', error)
  }

  return data
}

async function generateHumanResponse(message: string, data: any, intent: any): Promise<string> {
  let response = ''

  switch (intent.type) {
    case 'financial':
      response = analyzeFinancial(data)
      break
    case 'serviceOrders':
      response = analyzeServiceOrders(data)
      break
    case 'inventory':
      response = analyzeInventory(data)
      break
    case 'clients':
      response = analyzeClients(data)
      break
    case 'employees':
      response = analyzeEmployees(data)
      break
    case 'analytics':
      response = analyzeStats(data)
      break
    case 'calendar':
      response = analyzeCalendar(data)
      break
    default:
      response = generateWelcome()
  }

  return response
}

function analyzeFinancial(data: any): string {
  const greeting = getGreeting()
  const transition = getTransition()
  let msg = `${greeting}\n\n${transition}\n\n`

  if (data.financialSummary) {
    const { total_revenue, total_expenses, profit } = data.financialSummary
    const margin = total_revenue > 0 ? (profit / total_revenue * 100) : 0

    msg += `**Resumo do mês:**\n\n`
    msg += `💰 Receitas: R$ ${total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    msg += `💸 Despesas: R$ ${total_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    msg += `📊 Resultado: R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    msg += `📈 Margem: ${margin.toFixed(1)}%\n\n`

    if (profit > 0) {
      msg += `${getPositiveComment()} O resultado tá positivo! Continuem assim! 🚀\n`
    } else if (profit < 0) {
      msg += `${getConcernComment()} O resultado tá negativo... Vamos dar uma olhada juntos no que pode melhorar, ok?\n`
    }
  }

  if (data.finance && data.finance.length > 0) {
    const pendingPayments = data.finance.filter((f: any) => f.status === 'pendente' && f.tipo === 'despesa')
    const pendingReceivables = data.finance.filter((f: any) => f.status === 'pendente' && f.tipo === 'receita')

    if (pendingPayments.length > 0 || pendingReceivables.length > 0) {
      msg += `\n**Olha só o que temos pendente:**\n\n`
      if (pendingPayments.length > 0) {
        msg += `🔴 ${pendingPayments.length} contas pra pagar\n`
      }
      if (pendingReceivables.length > 0) {
        msg += `🟢 ${pendingReceivables.length} a receber\n`
      }
    }
  }

  msg += `\nQualquer coisa é só chamar! 😊`
  return msg
}

function analyzeServiceOrders(data: any): string {
  const greeting = getGreeting()
  let msg = `${greeting}\n\n`

  if (data.serviceOrders && data.serviceOrders.length > 0) {
    const orders = data.serviceOrders
    const pending = orders.filter((o: any) => o.status === 'pending' || o.status === 'aberta').length
    const inProgress = orders.filter((o: any) => o.status === 'in_progress' || o.status === 'em_andamento').length
    const completed = orders.filter((o: any) => o.status === 'completed' || o.status === 'concluida').length

    msg += `Bom, sobre as OSs...\n\n`
    msg += `📋 **Total:** ${orders.length} ordens\n`
    msg += `⏳ **Aguardando:** ${pending}\n`
    msg += `⚙️ **Em andamento:** ${inProgress}\n`
    msg += `✅ **Finalizadas:** ${completed}\n\n`

    if (pending > 10) {
      msg += `Opa! Tem bastante OS esperando... Que tal distribuir melhor pra galera da equipe? 👨‍🔧\n`
    } else if (inProgress > pending) {
      msg += `Legal! A equipe tá focada, mais em andamento que paradas. Bom sinal! 💪\n`
    }
  } else {
    msg += `Hmm, não achei OSs recentes por aqui... Tudo tranquilo ou posso ajudar em outra coisa?`
  }

  return msg
}

function analyzeInventory(data: any): string {
  const greeting = getGreeting()
  let msg = `${greeting}\n\n`

  if (data.inventory && data.inventory.length > 0) {
    const lowStock = data.inventory.filter((i: any) => Number(i.quantity) <= Number(i.min_quantity || 5))
    const outOfStock = data.inventory.filter((i: any) => Number(i.quantity) === 0)

    msg += `Sobre o estoque...\n\n`
    msg += `📦 **Total de itens:** ${data.inventory.length}\n\n`

    if (outOfStock.length > 0) {
      msg += `🔴 **Eita!** ${outOfStock.length} itens zerados! Bora repor logo:\n`
      outOfStock.slice(0, 3).forEach((item: any) => {
        msg += `   • ${item.name}\n`
      })
      msg += `\n`
    }

    if (lowStock.length > 0) {
      msg += `⚠️ **Atenção:** ${lowStock.length} itens tão acabando...\n`
      lowStock.slice(0, 3).forEach((item: any) => {
        msg += `   • ${item.name} - só ${item.quantity} restando\n`
      })
    } else if (outOfStock.length === 0) {
      msg += `${getPositiveComment()} Estoque tá tranquilo! 👍`
    }
  }

  return msg
}

function analyzeClients(data: any): string {
  const greeting = getGreeting()
  let msg = `${greeting}\n\n`

  if (data.customers && data.customers.length > 0) {
    const recent = data.customers.filter((c: any) => {
      const created = new Date(c.created_at)
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() - 30)
      return created > thirtyDays
    })

    msg += `Sobre os clientes...\n\n`
    msg += `👥 **Base total:** ${data.customers.length} clientes\n`
    msg += `🆕 **Novos este mês:** ${recent.length}\n\n`

    if (recent.length > 15) {
      msg += `${getPositiveComment()} Caramba! Tá chegando cliente novo demais! O marketing tá voando! 🚀\n`
    } else if (recent.length < 5) {
      msg += `Hmm, poucos clientes novos esse mês... Vamos pensar em algumas ações comerciais? 🤔`
    } else {
      msg += `Bom ritmo de clientes novos! Continuem assim! 💪`
    }
  }

  return msg
}

function analyzeEmployees(data: any): string {
  const greeting = getGreeting()
  let msg = `${greeting}\n\n`

  if (data.employees && data.employees.length > 0) {
    msg += `Sobre a equipe...\n\n`
    msg += `👨‍💼 **Time ativo:** ${data.employees.length} colaboradores\n\n`

    const byPosition = data.employees.reduce((acc: any, emp: any) => {
      const pos = emp.position || 'Não definido'
      acc[pos] = (acc[pos] || 0) + 1
      return acc
    }, {})

    msg += `**Distribuição:**\n`
    Object.entries(byPosition).forEach(([position, count]) => {
      msg += `   • ${position}: ${count}\n`
    })
  }

  return msg
}

function analyzeStats(data: any): string {
  const greeting = getGreeting()
  let msg = `${greeting}\n\n${getTransition()}\n\n`

  if (data.stats) {
    const s = data.stats
    msg += `**Visão geral do sistema:**\n\n`
    msg += `🔧 OSs: ${s.total_oss || 0} no total, ${s.oss_abertas || 0} abertas\n`
    msg += `👥 Clientes: ${s.total_clientes || 0}\n`
    msg += `👨‍💼 Equipe: ${s.total_funcionarios || 0} ativos\n`
    msg += `📦 Estoque: ${s.itens_estoque || 0} itens\n\n`

    if (s.estoque_baixo > 0) {
      msg += `⚠️ Opa! ${s.estoque_baixo} itens com estoque baixo\n\n`
    }

    const receitas = Number(s.receitas_mes || 0)
    const despesas = Number(s.despesas_mes || 0)
    const saldo = receitas - despesas

    msg += `**Financeiro do mês:**\n`
    msg += `💰 Receitas: R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    msg += `💸 Despesas: R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    msg += `📊 Saldo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${saldo >= 0 ? '✅' : '⚠️'}\n\n`

    if (saldo > 0) {
      msg += `${getPositiveComment()} Mês positivo! Bora manter esse ritmo! 🎯`
    }
  }

  return msg
}

function analyzeCalendar(data: any): string {
  const greeting = getGreeting()
  let msg = `${greeting}\n\n`

  if (data.todayEvents && data.todayEvents.length > 0) {
    msg += `**Hoje você tem:**\n\n`
    
    data.todayEvents.slice(0, 5).forEach((event: any) => {
      const time = new Date(event.start_time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
      msg += `⏰ **${time}** - ${event.title}\n`
      if (event.customers?.name) {
        msg += `   Com: ${event.customers.name}\n`
      }
      if (event.location) {
        msg += `   Onde: ${event.location}\n`
      }
      msg += `\n`
    })

    if (data.todayEvents.length > 5) {
      msg += `... e mais ${data.todayEvents.length - 5} eventos! Dia cheio hein! 📅\n`
    }
  } else {
    msg += `Hoje tá tranquilo! Nenhum compromisso agendado. Bom momento pra organizar outras coisas! 😊`
  }

  if (data.agendaEvents && data.agendaEvents.length > 0) {
    msg += `\n\n**Próximos 7 dias:** ${data.agendaEvents.length} eventos agendados`
  }

  return msg
}

function generateWelcome(): string {
  const greeting = getGreeting()
  return `${greeting}\n\nSou o assistente da Giartech! Posso te ajudar com:\n\n💰 Financeiro e DRE\n🔧 Ordens de Serviço\n📦 Estoque\n👥 Clientes\n👨‍💼 Equipe\n📊 Indicadores\n📅 Agenda\n\nÉ só perguntar o que você precisa! 😊`
}

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
    console.error('Error saving:', error)
  }
}