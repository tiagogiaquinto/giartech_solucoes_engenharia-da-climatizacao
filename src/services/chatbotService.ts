import { supabase } from '../lib/supabase'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata?: any
}

export interface ChatConversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatIntent {
  intent_name: string
  keywords: string[]
  query_template: string
  response_template: string
  description: string
}

class ChatbotService {
  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  private tokenize(text: string): string[] {
    return this.removeAccents(text.toLowerCase())
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2)
  }

  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1)
    const set2 = new Set(tokens2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return union.size > 0 ? intersection.size / union.size : 0
  }

  async createConversation(title: string = 'Nova Conversa'): Promise<ChatConversation | null> {
    const { data, error} = await supabase
      .from('chat_conversations')
      .insert([{ title }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar conversa:', error)
      return null
    }

    return data
  }

  async getConversations(): Promise<ChatConversation[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar conversas:', error)
      return []
    }

    return data || []
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar mensagens:', error)
      return []
    }

    return data || []
  }

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage | null> {
    const userMessage = await this.saveMessage(conversationId, 'user', content)
    if (!userMessage) return null

    const response = await this.processMessage(content)
    const assistantMessage = await this.saveMessage(
      conversationId,
      'assistant',
      response.text,
      response.metadata
    )

    await this.updateConversationTimestamp(conversationId)

    return assistantMessage
  }

  private async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        role,
        content,
        metadata: metadata || {}
      }])
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar mensagem:', error)
      return null
    }

    return data
  }

  private async updateConversationTimestamp(conversationId: string) {
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }

  private async processMessage(userMessage: string): Promise<{ text: string; metadata?: any }> {
    const normalizedMessage = this.removeAccents(userMessage.toLowerCase().trim())

    if (this.isGreeting(normalizedMessage)) {
      return this.getGreetingResponse()
    }

    if (this.isHelpRequest(normalizedMessage)) {
      return this.getExtendedHelp()
    }

    const { data: intents } = await supabase
      .from('chat_intents')
      .select('*')
      .eq('active', true)

    if (!intents || intents.length === 0) {
      return { text: 'Desculpe, não consegui processar sua mensagem. O sistema ainda está sendo configurado.' }
    }

    const matchedIntent = this.findBestMatchingIntent(normalizedMessage, intents)

    if (matchedIntent) {
      return await this.executeIntent(matchedIntent, userMessage)
    }

    return this.getIntelligentFallback(normalizedMessage)
  }

  private isGreeting(message: string): boolean {
    const greetings = ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'opa', 'e ai', 'eai']
    return greetings.some(greeting => message.includes(greeting))
  }

  private isHelpRequest(message: string): boolean {
    const helpWords = ['ajuda', 'help', 'auxilio', 'socorro', 'o que voce faz', 'o que sabe', 'comandos', 'funcoes']
    return helpWords.some(word => message.includes(word))
  }

  private getGreetingResponse(): { text: string } {
    const greetings = [
      '👋 Olá! Como posso ajudar você hoje?',
      '😊 Oi! Estou aqui para ajudar. O que você precisa?',
      '🤖 Olá! Pronto para responder suas perguntas!'
    ]
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]

    return {
      text: `${greeting}\n\n💡 **Dica:** Você pode me perguntar sobre:\n\n` +
        `📋 **Ordens de Serviço**\n` +
        `   • "OS abertas" ou "Ordens pendentes"\n` +
        `   • "OS atrasadas" ou "Serviços com atraso"\n` +
        `   • "Faturamento de OS"\n\n` +
        `📦 **Estoque**\n` +
        `   • "Estoque baixo" ou "O que está acabando"\n` +
        `   • "Buscar material [nome]"\n` +
        `   • "Valor do estoque"\n\n` +
        `💰 **Financeiro**\n` +
        `   • "Contas vencidas" ou "O que preciso pagar"\n` +
        `   • "Faturamento do mês"\n` +
        `   • "Lucro do mês"\n\n` +
        `👥 **Clientes**\n` +
        `   • "Melhores clientes"\n` +
        `   • "Buscar cliente [nome]"\n` +
        `   • "Clientes inativos"\n\n` +
        `📅 **Agenda**\n` +
        `   • "Agenda hoje" ou "O que tenho hoje"\n` +
        `   • "Próximos eventos"\n\n` +
        `Digite "ajuda completa" para ver todos os comandos disponíveis! 🚀`
    }
  }

  private getExtendedHelp(): { text: string } {
    return {
      text: '🤖 **GUIA COMPLETO DO ASSISTENTE IA**\n\n' +
        '═══════════════════════════════════\n\n' +
        '📋 **ORDENS DE SERVIÇO**\n' +
        '• "OS abertas" / "Ordens pendentes"\n' +
        '• "Quantas OS" / "Total de ordens"\n' +
        '• "OS atrasadas" / "Serviços com atraso"\n' +
        '• "OS do cliente [nome]"\n' +
        '• "Faturamento de OS"\n' +
        '• "Últimas vendas"\n\n' +
        '📦 **ESTOQUE & MATERIAIS**\n' +
        '• "Estoque baixo" / "O que está acabando"\n' +
        '• "Buscar material [nome]"\n' +
        '• "Materiais mais caros"\n' +
        '• "Valor do estoque" / "Capital em estoque"\n' +
        '• "Materiais mais usados"\n' +
        '• "Materiais por categoria"\n\n' +
        '💰 **FINANCEIRO**\n' +
        '• "Resumo financeiro" / "Situação financeira"\n' +
        '• "Contas vencidas" / "O que preciso pagar"\n' +
        '• "Contas hoje" / "Vence hoje"\n' +
        '• "Faturamento do mês"\n' +
        '• "Despesas do mês" / "Quanto gastei"\n' +
        '• "Lucro do mês" / "Resultado do mês"\n' +
        '• "Maiores despesas"\n\n' +
        '👥 **CLIENTES**\n' +
        '• "Buscar cliente [nome]"\n' +
        '• "Clientes inativos" / "Quem não compra"\n' +
        '• "Melhores clientes" / "Top clientes"\n' +
        '• "Novos clientes" / "Cadastros recentes"\n' +
        '• "Total de clientes"\n\n' +
        '📅 **AGENDA**\n' +
        '• "Agenda hoje" / "O que tenho hoje"\n' +
        '• "Próximos eventos" / "Agenda da semana"\n' +
        '• "Eventos do mês"\n\n' +
        '👨‍💼 **EQUIPE**\n' +
        '• "Funcionários" / "Listar equipe"\n' +
        '• "Funcionários por função"\n' +
        '• "Custo de folha" / "Folha de pagamento"\n\n' +
        '🏭 **FORNECEDORES**\n' +
        '• "Fornecedores" / "Lista de fornecedores"\n' +
        '• "Fornecedores por categoria"\n\n' +
        '📊 **ESTATÍSTICAS**\n' +
        '• "Dashboard" / "Resumo geral"\n' +
        '• "Performance do mês"\n' +
        '• "Serviços mais vendidos"\n\n' +
        '═══════════════════════════════════\n\n' +
        '💡 **DICAS:**\n' +
        '• Fale naturalmente, eu entendo variações!\n' +
        '• Use sinônimos, gírias ou termos técnicos\n' +
        '• Pergunte de forma direta ou detalhada\n' +
        '• Combine termos para buscas específicas\n\n' +
        '**Exemplos de perguntas que entendo:**\n' +
        '✓ "Quanto faturei esse mês?"\n' +
        '✓ "Quais materiais estão acabando?"\n' +
        '✓ "Mostre os melhores clientes"\n' +
        '✓ "O que tenho para fazer hoje?"\n' +
        '✓ "Quem são meus maiores devedores?"\n\n' +
        'Experimente e descubra mais! 🚀'
    }
  }

  private findBestMatchingIntent(message: string, intents: ChatIntent[]): ChatIntent | null {
    let bestMatch: ChatIntent | null = null
    let bestScore = 0

    const messageTokens = this.tokenize(message)

    for (const intent of intents) {
      for (const keyword of intent.keywords) {
        const keywordTokens = this.tokenize(keyword)

        if (message.includes(keyword.toLowerCase())) {
          return intent
        }

        const similarity = this.calculateSimilarity(messageTokens, keywordTokens)

        if (similarity > bestScore && similarity > 0.3) {
          bestScore = similarity
          bestMatch = intent
        }
      }
    }

    return bestScore > 0.4 ? bestMatch : null
  }

  private async executeIntent(intent: ChatIntent, userMessage: string): Promise<{ text: string; metadata?: any }> {
    if (intent.intent_name === 'help_extended') {
      return this.getExtendedHelp()
    }

    try {
      const param = this.extractParameter(userMessage, intent)
      let query = intent.query_template

      if (param) {
        query = query?.replace(/{param}/g, param)
      }

      if (!query) {
        return { text: 'Desculpe, não consegui processar esse comando ainda.' }
      }

      const { data: fallbackData } = await this.executeFallbackQuery(intent.intent_name, param)
      return this.formatResponse(intent, fallbackData || [])

    } catch (error) {
      console.error('Erro no processamento:', error)
      return { text: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }
    }
  }

  private async executeFallbackQuery(intentName: string, param?: string) {
    try {
      switch (intentName) {
        case 'listar_os_abertas':
          return await supabase
            .from('service_orders')
            .select('id, order_number, customer_name, status, total_value, created_at')
            .in('status', ['pending', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(20)

        case 'contar_os_status':
          return await supabase
            .from('service_orders')
            .select('status')

        case 'os_atrasadas':
          const { data: atrasadas } = await supabase
            .from('service_orders')
            .select('order_number, customer_name, execution_deadline, status')
            .lt('execution_deadline', new Date().toISOString())
            .not('status', 'in', '(completed,cancelled)')
            .order('execution_deadline', { ascending: true })

          return { data: atrasadas }

        case 'os_por_cliente':
          if (!param) return { data: [] }
          return await supabase
            .from('service_orders')
            .select('order_number, status, total_value, created_at')
            .ilike('customer_name', `%${param}%`)
            .order('created_at', { ascending: false })
            .limit(10)

        case 'faturamento_os':
          const { data: osCompleted } = await supabase
            .from('service_orders')
            .select('total_value')
            .eq('status', 'completed')

          const total = osCompleted?.reduce((sum, os) => sum + (os.total_value || 0), 0) || 0
          return { data: [{ total_revenue: total, total_orders: osCompleted?.length || 0 }] }

        case 'estoque_baixo':
          const { data: materialsData } = await supabase
            .from('materials')
            .select('name, quantity, min_quantity, unit, supplier, active')
            .eq('active', true)
            .order('quantity', { ascending: true })

          const lowStock = (materialsData || []).filter(m => m.quantity <= m.min_quantity).slice(0, 20)
          return { data: lowStock }

        case 'buscar_material':
          if (!param) return { data: [] }
          return await supabase
            .from('materials')
            .select('name, quantity, unit, cost_price, sale_price, supplier')
            .eq('active', true)
            .or(`name.ilike.%${param}%,supplier.ilike.%${param}%`)
            .limit(10)

        case 'materiais_mais_caros':
          return await supabase
            .from('materials')
            .select('name, cost_price, sale_price, quantity, unit')
            .eq('active', true)
            .order('cost_price', { ascending: false })
            .limit(10)

        case 'total_investido_estoque':
          const { data: allMaterials } = await supabase
            .from('materials')
            .select('quantity, cost_price')
            .eq('active', true)

          const investment = allMaterials?.reduce((sum, m) => sum + (m.quantity * m.cost_price), 0) || 0
          return { data: [{ total_investment: investment }] }

        case 'materiais_por_categoria':
          const { data: materials } = await supabase
            .from('materials')
            .select('category')
            .eq('active', true)

          const categoryCounts = materials?.reduce((acc: any, m) => {
            acc[m.category || 'Sem categoria'] = (acc[m.category || 'Sem categoria'] || 0) + 1
            return acc
          }, {})

          return { data: Object.entries(categoryCounts || {}).map(([category, quantity]) => ({ category, quantity })) }

        case 'buscar_cliente':
          if (!param) return { data: [] }
          return await supabase
            .from('customers')
            .select('name, email, phone, city, state')
            .or(`name.ilike.%${param}%,email.ilike.%${param}%,phone.ilike.%${param}%`)
            .limit(10)

        case 'melhores_clientes':
          const { data: allOrders } = await supabase
            .from('service_orders')
            .select('customer_name, total_value')
            .eq('status', 'completed')

          const clientTotals = allOrders?.reduce((acc: any, order) => {
            if (!acc[order.customer_name]) {
              acc[order.customer_name] = { customer_name: order.customer_name, total_revenue: 0, total_orders: 0 }
            }
            acc[order.customer_name].total_revenue += order.total_value || 0
            acc[order.customer_name].total_orders += 1
            return acc
          }, {})

          const sortedClients = Object.values(clientTotals || {})
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
            .slice(0, 10)

          return { data: sortedClients }

        case 'novos_clientes':
          return await supabase
            .from('customers')
            .select('name, email, phone, city, created_at')
            .order('created_at', { ascending: false })
            .limit(10)

        case 'total_clientes':
          const { data: customers } = await supabase
            .from('customers')
            .select('active')

          const total_customers = customers?.length || 0
          const active_customers = customers?.filter(c => c.active).length || 0
          return { data: [{ total_customers, active_customers }] }

        case 'resumo_financeiro':
          const { data: finances } = await supabase
            .from('finance_entries')
            .select('status, type, amount')

          const summary = finances?.reduce((acc: any, entry) => {
            const key = `${entry.type}_${entry.status}`
            if (!acc[key]) {
              acc[key] = { status: entry.status, type: entry.type, total: 0, count: 0 }
            }
            acc[key].total += entry.amount || 0
            acc[key].count += 1
            return acc
          }, {})

          return { data: Object.values(summary || {}) }

        case 'contas_vencidas':
          return await supabase
            .from('finance_entries')
            .select('description, amount, due_date, type')
            .lt('due_date', new Date().toISOString())
            .eq('status', 'pending')
            .order('due_date', { ascending: true })
            .limit(15)

        case 'contas_hoje':
          const today = new Date().toISOString().split('T')[0]
          return await supabase
            .from('finance_entries')
            .select('description, amount, type')
            .eq('due_date', today)
            .eq('status', 'pending')

        case 'faturamento_mes':
          const currentMonth = new Date().getMonth() + 1
          const currentYear = new Date().getFullYear()

          const { data: revenues } = await supabase
            .from('finance_entries')
            .select('amount, payment_date')
            .eq('type', 'revenue')
            .eq('status', 'paid')
            .gte('payment_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
            .lt('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)

          const totalRevenue = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
          return { data: [{ total_revenue: totalRevenue }] }

        case 'despesas_mes':
          const month = new Date().getMonth() + 1
          const year = new Date().getFullYear()

          const { data: expenses } = await supabase
            .from('finance_entries')
            .select('amount, payment_date')
            .eq('type', 'expense')
            .eq('status', 'paid')
            .gte('payment_date', `${year}-${month.toString().padStart(2, '0')}-01`)
            .lt('payment_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`)

          const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
          return { data: [{ total_expenses: totalExpenses }] }

        case 'lucro_mes':
          const lucroMonth = new Date().getMonth() + 1
          const lucroYear = new Date().getFullYear()

          const { data: revLucro } = await supabase
            .from('finance_entries')
            .select('amount')
            .eq('type', 'revenue')
            .eq('status', 'paid')
            .gte('payment_date', `${lucroYear}-${lucroMonth.toString().padStart(2, '0')}-01`)
            .lt('payment_date', `${lucroYear}-${(lucroMonth + 1).toString().padStart(2, '0')}-01`)

          const { data: expLucro } = await supabase
            .from('finance_entries')
            .select('amount')
            .eq('type', 'expense')
            .eq('status', 'paid')
            .gte('payment_date', `${lucroYear}-${lucroMonth.toString().padStart(2, '0')}-01`)
            .lt('payment_date', `${lucroYear}-${(lucroMonth + 1).toString().padStart(2, '0')}-01`)

          const revenueTotal = revLucro?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
          const expenseTotal = expLucro?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
          return { data: [{ net_profit: revenueTotal - expenseTotal }] }

        case 'maiores_despesas':
          return await supabase
            .from('finance_entries')
            .select('description, amount, category, due_date')
            .eq('type', 'expense')
            .order('amount', { ascending: false })
            .limit(10)

        case 'agenda_hoje':
          const todayDate = new Date().toISOString().split('T')[0]
          return await supabase
            .from('agenda_events')
            .select('title, start_time, end_time, location, description')
            .gte('start_time', `${todayDate}T00:00:00`)
            .lt('start_time', `${todayDate}T23:59:59`)
            .order('start_time', { ascending: true })

        case 'proximos_eventos':
          return await supabase
            .from('agenda_events')
            .select('title, start_time, end_time, location')
            .gte('start_time', new Date().toISOString())
            .lte('start_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('start_time', { ascending: true })
            .limit(20)

        case 'eventos_mes':
          const currentM = new Date().getMonth() + 1
          const currentY = new Date().getFullYear()
          return await supabase
            .from('agenda_events')
            .select('title, start_time, location')
            .gte('start_time', `${currentY}-${currentM.toString().padStart(2, '0')}-01`)
            .lt('start_time', `${currentY}-${(currentM + 1).toString().padStart(2, '0')}-01`)
            .order('start_time', { ascending: true })

        case 'listar_funcionarios':
          return await supabase
            .from('employees')
            .select('name, role, email, phone')
            .eq('active', true)
            .order('name', { ascending: true })
            .limit(20)

        case 'funcionarios_por_funcao':
          const { data: employees } = await supabase
            .from('employees')
            .select('role')
            .eq('active', true)

          const roleCounts = employees?.reduce((acc: any, e) => {
            acc[e.role || 'Sem função'] = (acc[e.role || 'Sem função'] || 0) + 1
            return acc
          }, {})

          return { data: Object.entries(roleCounts || {}).map(([role, quantity]) => ({ role, quantity })) }

        case 'custo_folha':
          const { data: empData } = await supabase
            .from('employees')
            .select('salary')
            .eq('active', true)

          const totalPayroll = empData?.reduce((sum, e) => sum + (e.salary || 0), 0) || 0
          return { data: [{ total_payroll: totalPayroll, total_employees: empData?.length || 0 }] }

        case 'listar_fornecedores':
          return await supabase
            .from('suppliers')
            .select('name, email, phone, category')
            .eq('active', true)
            .order('name', { ascending: true })
            .limit(20)

        case 'fornecedores_categoria':
          const { data: suppliers } = await supabase
            .from('suppliers')
            .select('category')
            .eq('active', true)

          const supplierCounts = suppliers?.reduce((acc: any, s) => {
            acc[s.category || 'Sem categoria'] = (acc[s.category || 'Sem categoria'] || 0) + 1
            return acc
          }, {})

          return { data: Object.entries(supplierCounts || {}).map(([category, quantity]) => ({ category, quantity })) }

        case 'ultimas_vendas':
          return await supabase
            .from('service_orders')
            .select('order_number, customer_name, total_value, completed_at')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(15)

        case 'materiais_mais_usados':
          return await supabase
            .from('materials')
            .select('name, unit, total_quantity_purchased')
            .gt('total_quantity_purchased', 0)
            .order('total_quantity_purchased', { ascending: false })
            .limit(15)

        case 'servicos_mais_vendidos':
          const { data: services } = await supabase
            .from('service_catalog')
            .select('name')

          const serviceCounts = services?.reduce((acc: any, s) => {
            acc[s.name] = (acc[s.name] || 0) + 1
            return acc
          }, {})

          const sortedServices = Object.entries(serviceCounts || {})
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a: any, b: any) => b.quantity - a.quantity)
            .slice(0, 10)

          return { data: sortedServices }

        case 'dashboard_resumo':
          const { data: orders } = await supabase.from('service_orders').select('id')
          const { data: clients } = await supabase.from('customers').select('id')
          const { data: mats } = await supabase.from('materials').select('id').eq('active', true)
          const { data: emps } = await supabase.from('employees').select('id').eq('active', true)

          return { data: [{
            total_orders: orders?.length || 0,
            total_customers: clients?.length || 0,
            total_materials: mats?.length || 0,
            total_employees: emps?.length || 0
          }] }

        case 'performance_mes':
          const perfMonth = new Date().getMonth() + 1
          const perfYear = new Date().getFullYear()

          const { data: completedOrders } = await supabase
            .from('service_orders')
            .select('total_value, completed_at')
            .eq('status', 'completed')
            .gte('completed_at', `${perfYear}-${perfMonth.toString().padStart(2, '0')}-01`)
            .lt('completed_at', `${perfYear}-${(perfMonth + 1).toString().padStart(2, '0')}-01`)

          const perfRevenue = completedOrders?.reduce((sum, o) => sum + (o.total_value || 0), 0) || 0
          return { data: [{ orders_completed: completedOrders?.length || 0, revenue: perfRevenue }] }

        default:
          return { data: [] }
      }
    } catch (error) {
      console.error('Erro ao executar query:', error)
      return { data: [] }
    }
  }

  private extractParameter(message: string, intent: ChatIntent): string {
    const words = message.split(' ')

    for (const keyword of intent.keywords) {
      const index = message.toLowerCase().indexOf(keyword.toLowerCase())

      if (index !== -1) {
        const afterKeyword = message.substring(index + keyword.length).trim()
        if (afterKeyword) {
          const params = afterKeyword.split(' ').filter(w => w.length > 0)
          if (params.length > 0) {
            return params[0]
          }
        }
      }
    }

    const commonWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'que', 'qual']
    const potentialParams = words.filter(w =>
      w.length > 2 && !commonWords.includes(w.toLowerCase())
    )

    return potentialParams[potentialParams.length - 1] || ''
  }

  private formatResponse(intent: ChatIntent, data: any[]): { text: string; metadata: any } {
    const count = data.length

    if (count === 0) {
      return {
        text: this.getEmptyResponse(intent.intent_name),
        metadata: { intent: intent.intent_name, count: 0 }
      }
    }

    let responseText = intent.response_template.replace('{count}', count.toString())
    responseText += '\n\n'

    switch (intent.intent_name) {
      case 'listar_os_abertas':
        responseText += data.map(os =>
          `📋 **OS ${os.order_number}** - ${os.customer_name}\n` +
          `   Status: ${this.translateStatus(os.status)} | Valor: R$ ${this.formatMoney(os.total_value)}\n` +
          `   Criado: ${this.formatDate(os.created_at)}`
        ).join('\n\n')
        break

      case 'contar_os_status':
        const statusCount = data.reduce((acc: any, os) => {
          acc[os.status] = (acc[os.status] || 0) + 1
          return acc
        }, {})
        responseText = '📊 **Status das Ordens de Serviço:**\n\n'
        responseText += Object.entries(statusCount)
          .map(([status, count]) => `• ${this.translateStatus(status)}: ${count}`)
          .join('\n')
        break

      case 'os_atrasadas':
        if (count === 0) {
          responseText = '✅ Ótimo! Não há ordens de serviço atrasadas no momento.'
        } else {
          responseText = `⚠️ **${count} ordem(ns) de serviço atrasada(s):**\n\n`
          responseText += data.map(os =>
            `🔴 **OS ${os.order_number}** - ${os.customer_name}\n` +
            `   Prazo: ${this.formatDate(os.execution_deadline)} | Status: ${this.translateStatus(os.status)}`
          ).join('\n\n')
        }
        break

      case 'os_por_cliente':
        responseText += data.map(os =>
          `📋 **OS ${os.order_number}**\n` +
          `   Status: ${this.translateStatus(os.status)} | Valor: R$ ${this.formatMoney(os.total_value)}\n` +
          `   Data: ${this.formatDate(os.created_at)}`
        ).join('\n\n')
        break

      case 'faturamento_os':
        const ftData = data[0]
        responseText = `💰 **Faturamento Total de OS:**\n\n` +
          `• Valor total: R$ ${this.formatMoney(ftData.total_revenue)}\n` +
          `• Ordens concluídas: ${ftData.total_orders}\n` +
          `• Ticket médio: R$ ${this.formatMoney(ftData.total_revenue / (ftData.total_orders || 1))}`
        break

      case 'estoque_baixo':
        responseText += data.map(mat =>
          `⚠️ **${mat.name}**\n` +
          `   Estoque: ${mat.quantity} ${mat.unit} (Mínimo: ${mat.min_quantity} ${mat.unit})\n` +
          `   ${mat.supplier ? `Fornecedor: ${mat.supplier}` : 'Sem fornecedor'}`
        ).join('\n\n')
        break

      case 'buscar_material':
        responseText += data.map(mat =>
          `📦 **${mat.name}**\n` +
          `   Estoque: ${mat.quantity} ${mat.unit}\n` +
          `   Custo: R$ ${this.formatMoney(mat.cost_price)} | Venda: R$ ${this.formatMoney(mat.sale_price)}\n` +
          `   ${mat.supplier ? `Fornecedor: ${mat.supplier}` : 'Sem fornecedor'}`
        ).join('\n\n')
        break

      case 'materiais_mais_caros':
        responseText += data.map((mat, idx) =>
          `${idx + 1}. **${mat.name}**\n` +
          `   Custo: R$ ${this.formatMoney(mat.cost_price)} | Venda: R$ ${this.formatMoney(mat.sale_price)}\n` +
          `   Estoque: ${mat.quantity} ${mat.unit}`
        ).join('\n\n')
        break

      case 'total_investido_estoque':
        responseText = `💎 **Investimento em Estoque:**\n\n` +
          `• Valor total investido: R$ ${this.formatMoney(data[0].total_investment)}`
        break

      case 'materiais_por_categoria':
        responseText = '📊 **Materiais por Categoria:**\n\n'
        responseText += data
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .map((cat: any) => `• ${cat.category}: ${cat.quantity} itens`)
          .join('\n')
        break

      case 'buscar_cliente':
        responseText += data.map(client =>
          `👤 **${client.name}**\n` +
          `   📧 ${client.email || 'Sem email'}\n` +
          `   📱 ${client.phone || 'Sem telefone'}\n` +
          `   📍 ${client.city || 'Sem cidade'}${client.state ? ` - ${client.state}` : ''}`
        ).join('\n\n')
        break

      case 'melhores_clientes':
        responseText = `🏆 **Top ${count} Melhores Clientes:**\n\n`
        responseText += data.map((client: any, idx) =>
          `${idx + 1}. **${client.customer_name}**\n` +
          `   💰 Faturamento: R$ ${this.formatMoney(client.total_revenue)}\n` +
          `   📋 Total de OS: ${client.total_orders}`
        ).join('\n\n')
        break

      case 'novos_clientes':
        responseText += data.map(client =>
          `👤 **${client.name}**\n` +
          `   📧 ${client.email || 'Sem email'}\n` +
          `   📱 ${client.phone || 'Sem telefone'}\n` +
          `   📍 ${client.city || 'Sem cidade'}\n` +
          `   📅 Cadastro: ${this.formatDate(client.created_at)}`
        ).join('\n\n')
        break

      case 'total_clientes':
        responseText = `👥 **Total de Clientes:**\n\n` +
          `• Clientes cadastrados: ${data[0].total_customers}\n` +
          `• Clientes ativos: ${data[0].active_customers}`
        break

      case 'resumo_financeiro':
        responseText = '💰 **Resumo Financeiro:**\n\n'
        let totalReceitas = 0
        let totalDespesas = 0

        data.forEach((entry: any) => {
          if (entry.type === 'revenue') totalReceitas += entry.total
          if (entry.type === 'expense') totalDespesas += entry.total

          responseText += `${entry.type === 'revenue' ? '📈' : '📉'} ${this.translateType(entry.type)} - ${this.translateStatus(entry.status)}\n`
          responseText += `   R$ ${this.formatMoney(entry.total)} (${entry.count} lançamentos)\n\n`
        })

        responseText += `\n📊 **Resumo:**\n`
        responseText += `• Total Receitas: R$ ${this.formatMoney(totalReceitas)}\n`
        responseText += `• Total Despesas: R$ ${this.formatMoney(totalDespesas)}\n`
        responseText += `• **Saldo: R$ ${this.formatMoney(totalReceitas - totalDespesas)}**`
        break

      case 'contas_vencidas':
        responseText = `⚠️ **${count} Conta(s) Vencida(s):**\n\n`
        responseText += data.map(conta =>
          `🔴 **${conta.description}**\n` +
          `   Valor: R$ ${this.formatMoney(conta.amount)}\n` +
          `   Tipo: ${this.translateType(conta.type)}\n` +
          `   Vencimento: ${this.formatDate(conta.due_date)}`
        ).join('\n\n')
        break

      case 'contas_hoje':
        responseText = `📅 **${count} Conta(s) Vencendo Hoje:**\n\n`
        responseText += data.map(conta =>
          `• **${conta.description}**: R$ ${this.formatMoney(conta.amount)} (${this.translateType(conta.type)})`
        ).join('\n')
        break

      case 'faturamento_mes':
        responseText = `📈 **Faturamento do Mês:**\n\n` +
          `• **R$ ${this.formatMoney(data[0].total_revenue)}**`
        break

      case 'despesas_mes':
        responseText = `📉 **Despesas do Mês:**\n\n` +
          `• **R$ ${this.formatMoney(data[0].total_expenses)}**`
        break

      case 'lucro_mes':
        const lucro = data[0].net_profit
        responseText = `${lucro >= 0 ? '💚' : '🔴'} **Lucro do Mês:**\n\n` +
          `• **R$ ${this.formatMoney(lucro)}**\n\n` +
          `${lucro >= 0 ? '✅ Resultado positivo!' : '⚠️ Atenção: resultado negativo'}`
        break

      case 'maiores_despesas':
        responseText = `💸 **Top ${count} Maiores Despesas:**\n\n`
        responseText += data.map((desp, idx) =>
          `${idx + 1}. **${desp.description}**\n` +
          `   R$ ${this.formatMoney(desp.amount)} | ${desp.category || 'Sem categoria'}\n` +
          `   Vencimento: ${this.formatDate(desp.due_date)}`
        ).join('\n\n')
        break

      case 'agenda_hoje':
        responseText += data.map(event =>
          `📅 **${event.title}**\n` +
          `   ⏰ ${this.formatTime(event.start_time)} - ${this.formatTime(event.end_time)}\n` +
          `   📍 ${event.location || 'Local não informado'}\n` +
          `   ${event.description ? `📝 ${event.description}` : ''}`
        ).join('\n\n')
        break

      case 'proximos_eventos':
        responseText += data.map(event =>
          `📅 **${event.title}**\n` +
          `   📆 ${this.formatDate(event.start_time)} às ${this.formatTime(event.start_time)}\n` +
          `   📍 ${event.location || 'Local não informado'}`
        ).join('\n\n')
        break

      case 'eventos_mes':
        responseText += data.map(event =>
          `📅 **${event.title}**\n` +
          `   📆 ${this.formatDate(event.start_time)} às ${this.formatTime(event.start_time)}\n` +
          `   📍 ${event.location || 'Local não informado'}`
        ).join('\n\n')
        break

      case 'listar_funcionarios':
        responseText += data.map(emp =>
          `👨‍💼 **${emp.name}**\n` +
          `   💼 ${emp.role || 'Sem função'}\n` +
          `   📧 ${emp.email || 'Sem email'}\n` +
          `   📱 ${emp.phone || 'Sem telefone'}`
        ).join('\n\n')
        break

      case 'funcionarios_por_funcao':
        responseText = '👥 **Funcionários por Função:**\n\n'
        responseText += data
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .map((role: any) => `• ${role.role}: ${role.quantity} ${role.quantity === 1 ? 'funcionário' : 'funcionários'}`)
          .join('\n')
        break

      case 'custo_folha':
        responseText = `💰 **Folha de Pagamento:**\n\n` +
          `• Total mensal: R$ ${this.formatMoney(data[0].total_payroll)}\n` +
          `• Funcionários: ${data[0].total_employees}\n` +
          `• Média salarial: R$ ${this.formatMoney(data[0].total_payroll / (data[0].total_employees || 1))}`
        break

      case 'listar_fornecedores':
        responseText += data.map(sup =>
          `🏭 **${sup.name}**\n` +
          `   📧 ${sup.email || 'Sem email'}\n` +
          `   📱 ${sup.phone || 'Sem telefone'}\n` +
          `   📦 ${sup.category || 'Sem categoria'}`
        ).join('\n\n')
        break

      case 'fornecedores_categoria':
        responseText = '🏭 **Fornecedores por Categoria:**\n\n'
        responseText += data
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .map((cat: any) => `• ${cat.category}: ${cat.quantity} ${cat.quantity === 1 ? 'fornecedor' : 'fornecedores'}`)
          .join('\n')
        break

      case 'ultimas_vendas':
        responseText += data.map(os =>
          `✅ **OS ${os.order_number}** - ${os.customer_name}\n` +
          `   💰 R$ ${this.formatMoney(os.total_value)}\n` +
          `   ✔️ Finalizado: ${this.formatDate(os.completed_at)}`
        ).join('\n\n')
        break

      case 'materiais_mais_usados':
        responseText += data.map((mat, idx) =>
          `${idx + 1}. **${mat.name}**\n` +
          `   📊 ${mat.total_quantity_purchased} ${mat.unit} utilizados`
        ).join('\n\n')
        break

      case 'servicos_mais_vendidos':
        responseText = `🏆 **Top ${count} Serviços Mais Vendidos:**\n\n`
        responseText += data.map((serv: any, idx) =>
          `${idx + 1}. **${serv.name}**: ${serv.quantity} ${serv.quantity === 1 ? 'venda' : 'vendas'}`
        ).join('\n')
        break

      case 'dashboard_resumo':
        const dash = data[0]
        responseText = `📊 **Resumo Geral do Sistema:**\n\n` +
          `📋 Ordens de Serviço: ${dash.total_orders}\n` +
          `👥 Clientes: ${dash.total_customers}\n` +
          `📦 Materiais: ${dash.total_materials}\n` +
          `👨‍💼 Funcionários: ${dash.total_employees}`
        break

      case 'performance_mes':
        const perf = data[0]
        responseText = `📊 **Performance do Mês:**\n\n` +
          `✅ OS Concluídas: ${perf.orders_completed}\n` +
          `💰 Faturamento: R$ ${this.formatMoney(perf.revenue)}\n` +
          `📈 Ticket médio: R$ ${this.formatMoney(perf.revenue / (perf.orders_completed || 1))}`
        break

      default:
        responseText += JSON.stringify(data, null, 2)
    }

    return {
      text: responseText,
      metadata: { intent: intent.intent_name, count, data }
    }
  }

  private getEmptyResponse(intentName: string): string {
    const responses: Record<string, string> = {
      'listar_os_abertas': '✅ Não há ordens de serviço abertas no momento!',
      'estoque_baixo': '✅ Todos os materiais estão com estoque adequado!',
      'agenda_hoje': '📅 Você não tem compromissos agendados para hoje.',
      'ultimas_vendas': '💼 Ainda não há vendas finalizadas.',
      'materiais_mais_usados': '📦 Ainda não há dados sobre materiais utilizados.',
      'buscar_cliente': '🔍 Não encontrei clientes com esse critério.',
      'resumo_financeiro': '💰 Não há lançamentos financeiros no período.',
      'contas_vencidas': '✅ Ótimo! Não há contas vencidas.',
      'contas_hoje': '✅ Não há contas vencendo hoje.',
      'proximos_eventos': '📅 Não há eventos agendados para os próximos dias.',
      'eventos_mes': '📅 Não há eventos agendados para este mês.',
      'listar_funcionarios': '👥 Não há funcionários cadastrados.',
      'listar_fornecedores': '🏭 Não há fornecedores cadastrados.',
      'novos_clientes': '👥 Não há clientes cadastrados recentemente.',
      'os_por_cliente': '🔍 Não encontrei ordens de serviço para este cliente.',
      'buscar_material': '🔍 Material não encontrado no estoque.'
    }

    return responses[intentName] || 'Não encontrei resultados para sua busca.'
  }

  private getIntelligentFallback(message: string): { text: string } {
    const suggestions = [
      '💡 **Não entendi muito bem...**\n\nTente perguntar de outra forma ou use comandos como:\n\n' +
      '• "OS abertas"\n' +
      '• "Estoque baixo"\n' +
      '• "Contas vencidas"\n' +
      '• "Melhores clientes"\n\n' +
      'Digite "ajuda" para ver todos os comandos disponíveis!'
    ]

    return { text: suggestions[0] }
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': '⏳ Pendente',
      'in_progress': '🔄 Em Andamento',
      'completed': '✅ Concluído',
      'cancelled': '❌ Cancelado',
      'paid': '✅ Pago',
      'overdue': '🔴 Vencido'
    }
    return translations[status] || status
  }

  private translateType(type: string): string {
    const translations: Record<string, string> = {
      'revenue': 'Receita',
      'expense': 'Despesa',
      'income': 'Receita',
      'outcome': 'Despesa'
    }
    return translations[type] || type
  }

  private formatMoney(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'Data não informada'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  private formatTime(dateString: string): string {
    if (!dateString) return '--:--'
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', conversationId)

    return !error
  }
}

export const chatbotService = new ChatbotService()
