import { supabase } from '../lib/supabase'
import thomazAdvanced from './thomazAdvancedService'

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
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
  }

  private tokenize(text: string): string[] {
    const normalized = this.removeAccents(text.toLowerCase())
      // Remove pontuação mas mantém palavras
      .replace(/[^\w\s]/g, ' ')
      // Normaliza espaços
      .replace(/\s+/g, ' ')
      .trim()

    const tokens = normalized.split(' ')

    // Retorna tokens de pelo menos 2 caracteres
    // Mas mantém palavras importantes de 2 letras como "os", "me", etc
    return tokens.filter(token => token.length >= 2)
  }

  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0

    const set1 = new Set(tokens1)
    const set2 = new Set(tokens2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    // Similaridade de Jaccard
    const jaccard = union.size > 0 ? intersection.size / union.size : 0

    // Bonus se tokens importantes estão presentes
    const importantWords = ['os', 'cliente', 'estoque', 'financeiro', 'lucro', 'receita']
    let bonus = 0
    for (const word of importantWords) {
      if (set1.has(word) && set2.has(word)) {
        bonus += 0.1
      }
    }

    return Math.min(jaccard + bonus, 1.0)
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

    return await this.useAIResponse(userMessage, normalizedMessage)
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
      '👋 E aí! Sou o Thomaz, seu assistente inteligente!',
      '😊 Olá! Thomaz aqui, pronto pra te ajudar!',
      '🤖 Fala! Thomaz na área! Como posso ajudar?',
      '✨ Opa! Thomaz aqui! Bora trabalhar?',
      '💼 Salve! Sou o Thomaz, seu parceiro de negócios!'
    ]
    const greeting = greetings[Math.floor(Math.random() * greetings.length)]

    return {
      text: `${greeting}\n\n` +
        `Pode me perguntar qualquer coisa sobre seu negócio! Entendo linguagem natural. 😉\n\n` +
        `💡 **Exemplos do que posso fazer:**\n\n` +
        `💬 **Fale naturalmente:**\n` +
        `   • "E aí, como tá indo?"  \n` +
        `   • "Tamo lucrando?"  \n` +
        `   • "Quem deve dinheiro?"  \n` +
        `   • "Tá faltando material?"\n\n` +
        `📊 **Análises:**\n` +
        `   • "Quanto faturei esse mês?"  \n` +
        `   • "Quais os melhores clientes?"  \n` +
        `   • "Como está a margem de lucro?"  \n` +
        `   • "Comparar este mês com o anterior"\n\n` +
        `📚 **Biblioteca:**\n` +
        `   • "Buscar manual de [assunto]"  \n` +
        `   • "Quais documentos tenho?"  \n` +
        `   • "Procurar na biblioteca"\n\n` +
        `Digite "ajuda" pra ver tudo que sei fazer! Ou "quem é você" pra me conhecer melhor! 🚀`
    }
  }

  private getExtendedHelp(): { text: string } {
    return {
      text: '🤖 **THOMAZ - SEU ASSISTENTE INTELIGENTE**\n\n' +
        '═══════════════════════════════════\n\n' +
        '💬 **LINGUAGEM COLOQUIAL (Fale como quiser!)**\n' +
        '• "E aí, como tá indo?" / "Como anda a coisa?"\n' +
        '• "Tamo lucrando?" / "Tá dando dinheiro?"\n' +
        '• "Quem deve?" / "Quem tá devendo?"\n' +
        '• "Tá faltando grana?" / "Caixa tá baixo?"\n' +
        '• "Quem paga em dia?" / "Clientes certinhos"\n\n' +
        '📋 **ORDENS DE SERVIÇO (Acesso Total)**\n' +
        '• "Todas as OS" / "Lista completa de ordens"\n' +
        '• "OS abertas" / "Ordens pendentes"\n' +
        '• "OS atrasadas" / "Serviços com atraso"\n' +
        '• "OS do cliente [nome]" / "Histórico do cliente"\n' +
        '• "Faturamento de OS" / "Quanto faturei em OS"\n\n' +
        '💰 **FINANCEIRO COMPLETO**\n' +
        '• "ROI" / "Retorno sobre investimento"\n' +
        '• "Ticket médio" / "Valor médio por venda"\n' +
        '• "Margem de lucro" / "Análise de margens"\n' +
        '• "Comparar meses" / "Este mês vs anterior"\n' +
        '• "Previsão de faturamento" / "Projeção"\n' +
        '• "Clientes inadimplentes" / "Quem deve"\n\n' +
        '👥 **CLIENTES (Dados Completos)**\n' +
        '• "Todos os clientes" / "Lista completa"\n' +
        '• "Buscar cliente [nome]" / "Dados do cliente"\n' +
        '• "Melhores clientes" / "Top clientes"\n' +
        '• "Clientes inativos" / "Quem não compra"\n\n' +
        '📦 **ESTOQUE**\n' +
        '• "Estoque baixo" / "O que tá acabando"\n' +
        '• "Buscar material [nome]"\n' +
        '• "Valor do estoque" / "Capital investido"\n' +
        '• "Materiais mais usados"\n\n' +
        '📚 **BIBLIOTECA DE DOCUMENTOS**\n' +
        '• "Buscar documento [assunto]"\n' +
        '• "Procurar manual de [tema]"\n' +
        '• "Lista de documentos" / "O que tem na biblioteca"\n' +
        '• "Manuais disponíveis"\n\n' +
        '📊 **DASHBOARDS E INDICADORES**\n' +
        '• "Dashboard de vendas" / "Painel de vendas"\n' +
        '• "Dashboard financeiro completo"\n' +
        '• "Tendência de vendas" / "Vendas crescendo?"\n' +
        '• "Serviços mais lucrativos"\n\n' +
        '👨‍💼 **EQUIPE E PRODUTIVIDADE**\n' +
        '• "Quem trabalha mais?" / "Ranking de funcionários"\n' +
        '• "Equipe disponível" / "Quem está livre?"\n' +
        '• "Custo por OS" / "Despesa por serviço"\n\n' +
        '🔧 **EQUIPAMENTOS**\n' +
        '• "Lista de equipamentos"\n' +
        '• "Equipamentos em manutenção"\n\n' +
        '═══════════════════════════════════\n\n' +
        '💡 **EU ENTENDO VOCÊ!**\n' +
        '• Fale do seu jeito, use gírias brasileiras\n' +
        '• Pergunte como se estivesse conversando\n' +
        '• Use "tá", "pra", "né", eu entendo tudo!\n' +
        '• Seja direto ou detalhado, como preferir\n\n' +
        '**Exemplos reais que funcionam:**\n' +
        '✓ "E aí, tá tudo certo com as contas?"\n' +
        '✓ "Cadê aquele cliente Silva?"\n' +
        '✓ "Tô precisando de um manual sobre..."\n' +
        '✓ "Mostra os cara que mais gastam aqui"\n' +
        '✓ "Tá sobrando dinheiro ou tá curto?"\n\n' +
        '**Sou o Thomaz, seu parceiro digital! 🚀**'
    }
  }

  private findBestMatchingIntent(message: string, intents: ChatIntent[]): ChatIntent | null {
    let bestMatch: ChatIntent | null = null
    let bestScore = 0

    const messageTokens = this.tokenize(message)
    const messageLower = message.toLowerCase()

    for (const intent of intents) {
      for (const keyword of intent.keywords) {
        const keywordLower = keyword.toLowerCase()

        // Match exato tem prioridade máxima
        if (messageLower === keywordLower) {
          return intent
        }

        // Match parcial forte (contém a keyword completa)
        if (messageLower.includes(keywordLower)) {
          return intent
        }

        // Match de palavras individuais (pelo menos 2 palavras em comum)
        const keywordTokens = this.tokenize(keywordLower)
        let matchCount = 0

        for (const token of keywordTokens) {
          if (messageLower.includes(token) && token.length > 2) {
            matchCount++
          }
        }

        // Se tem 2+ palavras em comum, considera um match forte
        if (matchCount >= 2 && keywordTokens.length <= 3) {
          return intent
        }

        if (matchCount >= 3 && keywordTokens.length > 3) {
          return intent
        }

        // Similaridade por tokens
        const similarity = this.calculateSimilarity(messageTokens, this.tokenize(keywordLower))

        if (similarity > bestScore && similarity > 0.3) {
          bestScore = similarity
          bestMatch = intent
        }
      }
    }

    // Threshold mais baixo para aceitar matches
    return bestScore > 0.3 ? bestMatch : null
  }

  private async executeIntent(intent: ChatIntent, userMessage: string): Promise<{ text: string; metadata?: any }> {
    if (intent.intent_name === 'help_extended') {
      return this.getExtendedHelp()
    }

    // Se for pergunta sobre "como fazer", busca na base de conhecimento
    if (intent.intent_name === 'ajuda_sistema') {
      return await this.searchKnowledge(userMessage)
    }

    try {
      const param = this.extractParameter(userMessage, intent)
      let query = intent.query_template

      if (param) {
        query = query?.replace(/{param}/g, param)
      }

      if (!query) {
        // Tenta buscar na base de conhecimento como fallback
        const knowledgeResult = await this.searchKnowledge(userMessage)
        if (knowledgeResult.text !== 'Não encontrei informações específicas sobre isso.') {
          return knowledgeResult
        }
        return { text: 'Desculpe, não consegui processar esse comando ainda.' }
      }

      const { data: fallbackData } = await this.executeFallbackQuery(intent.intent_name, param)
      return this.formatResponse(intent, fallbackData || [])

    } catch (error) {
      console.error('Erro no processamento:', error)
      return { text: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }
    }
  }

  // Busca inteligente na base de conhecimento
  private async searchKnowledge(query: string): Promise<{ text: string; metadata?: any }> {
    try {
      const { data, error } = await supabase.rpc('search_knowledge', {
        p_query: query,
        p_limit: 3
      })

      if (error || !data || data.length === 0) {
        return {
          text: 'Não encontrei informações específicas sobre isso. Mas posso buscar os dados reais do sistema pra você! O que você gostaria de saber?'
        }
      }

      // Pega o resultado mais relevante
      const bestMatch = data[0]

      let response = `📚 **${bestMatch.title}**\n\n`
      response += `📁 Categoria: ${bestMatch.category_name}\n\n`

      // Se o conteúdo for muito grande, mostra resumo + preview
      if (bestMatch.content.length > 800) {
        response += `${bestMatch.summary}\n\n`
        response += `📖 **Preview:**\n${bestMatch.content.substring(0, 600)}...\n\n`
        response += `💡 *Há mais conteúdo disponível! Quer que eu continue explicando?*`
      } else {
        response += bestMatch.content
      }

      // Registra busca no histórico
      await supabase.from('knowledge_search_history').insert({
        search_query: query,
        results_found: data.length,
        article_clicked: bestMatch.id,
        was_helpful: null
      })

      // Incrementa visualizações
      try {
        await supabase
          .from('knowledge_base')
          .update({ view_count: bestMatch.view_count + 1 })
          .eq('id', bestMatch.id)
      } catch {
        // Ignora erro
      }

      return {
        text: response,
        metadata: {
          source: 'knowledge_base',
          article_id: bestMatch.id,
          category: bestMatch.category_name,
          more_results: data.length - 1
        }
      }

    } catch (error) {
      console.error('Erro ao buscar conhecimento:', error)
      return {
        text: 'Vou buscar essas informações pra você! Um momento... 📚'
      }
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

          const totalRevenueFat = revenues?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0
          return { data: [{ total_revenue: totalRevenueFat }] }

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

        case 'quem_sou_eu':
          return { data: [{
            message: '👋 Oi! Sou o **Thomaz**, seu assistente inteligente!\n\n' +
              '🤖 Fui criado para te ajudar com TUDO relacionado ao seu negócio:\n\n' +
              '✅ Consulto dados em tempo real\n' +
              '✅ Entendo linguagem natural (fala do seu jeito!)\n' +
              '✅ Analiso indicadores e métricas\n' +
              '✅ Busco documentos na biblioteca\n' +
              '✅ Faço cálculos e comparações\n' +
              '✅ Te mantenho informado sobre tudo\n\n' +
              '💬 Pode me perguntar qualquer coisa! Use gírias, abreviações, perguntas diretas... Eu entendo tudo!\n\n' +
              '🚀 Bora trabalhar juntos?'
          }] }

        case 'listar_todos_clientes':
          return await supabase
            .from('customers')
            .select('name, email, phone, city, state, cpf_cnpj')
            .order('name', { ascending: true })
            .limit(50)

        case 'todas_os':
          return await supabase
            .from('service_orders')
            .select('order_number, customer_name, status, total_value, created_at')
            .order('created_at', { ascending: false })
            .limit(50)

        case 'listar_equipamentos':
          return await supabase
            .from('equipments')
            .select('name, brand, model, serial_number')
            .eq('active', true)
            .order('name', { ascending: true })
            .limit(30)

        case 'listar_documentos':
          const { data: docs } = await supabase
            .from('documents')
            .select('id, title, type, category, created_at')
            .order('created_at', { ascending: false })
            .limit(30)
          return { data: docs || [] }

        case 'buscar_documento':
          if (!param) return { data: [] }
          const { data: searchDocs } = await supabase
            .from('documents')
            .select('id, title, type, category, description')
            .or(`title.ilike.%${param}%,description.ilike.%${param}%,category.ilike.%${param}%`)
            .limit(10)
          return { data: searchDocs || [] }

        case 'indicadores_roi':
        case 'ticket_medio':
          const { data: allCompletedOrders } = await supabase
            .from('service_orders')
            .select('total_value, cost_total')
            .eq('status', 'completed')

          const totalRevenueROI = allCompletedOrders?.reduce((sum, o) => sum + (o.total_value || 0), 0) || 0
          const totalCostROI = allCompletedOrders?.reduce((sum, o) => sum + (o.cost_total || 0), 0) || 0
          const countROI = allCompletedOrders?.length || 1
          const profitROI = totalRevenueROI - totalCostROI
          const roiCalc = totalCostROI > 0 ? ((profitROI / totalCostROI) * 100) : 0
          const ticketMedioCalc = totalRevenueROI / countROI

          return { data: [{
            total_revenue: totalRevenueROI,
            total_cost: totalCostROI,
            profit: profitROI,
            roi: roiCalc,
            ticket_medio: ticketMedioCalc,
            orders_count: countROI
          }] }

        case 'como_ta_indo':
        case 'tamo_lucrando':
        case 'ta_ruim':
          const mesAtual = new Date().getMonth() + 1
          const anoAtual = new Date().getFullYear()

          const { data: receitaMes } = await supabase
            .from('finance_entries')
            .select('amount')
            .eq('type', 'revenue')
            .eq('status', 'paid')
            .gte('payment_date', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)

          const { data: despesaMes } = await supabase
            .from('finance_entries')
            .select('amount')
            .eq('type', 'expense')
            .eq('status', 'paid')
            .gte('payment_date', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)

          const { data: osCompletas } = await supabase
            .from('service_orders')
            .select('total_value')
            .eq('status', 'completed')
            .gte('completed_at', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)

          const receitaTotal = (receitaMes?.reduce((s, r) => s + (r.amount || 0), 0) || 0) +
                               (osCompletas?.reduce((s, o) => s + (o.total_value || 0), 0) || 0)
          const despesaTotal = despesaMes?.reduce((s, d) => s + (d.amount || 0), 0) || 0
          const lucroMes = receitaTotal - despesaTotal

          return { data: [{
            receita: receitaTotal,
            despesa: despesaTotal,
            lucro: lucroMes,
            status: lucroMes > 0 ? 'positivo' : 'negativo',
            orders_completed: osCompletas?.length || 0
          }] }

        case 'clientes_inadimplentes':
        case 'quem_paga_em_dia':
          const { data: contasClientes } = await supabase
            .from('finance_entries')
            .select('description, amount, due_date, status, payment_date')
            .eq('type', 'revenue')

          const inadimplentes = contasClientes?.filter(c =>
            c.status === 'pending' && new Date(c.due_date) < new Date()
          ) || []

          const pontuals = contasClientes?.filter(c =>
            c.status === 'paid' && c.payment_date && new Date(c.payment_date) <= new Date(c.due_date)
          ) || []

          return { data: intentName === 'clientes_inadimplentes' ? inadimplentes : pontuals }

        case 'ajuda_sistema':
          if (!param) {
            return await supabase
              .from('system_manuals')
              .select('*')
              .eq('active', true)
              .order('"order"', { ascending: true })
              .limit(10)
          }

          const { data: manualsSearch } = await supabase
            .from('system_manuals')
            .select('*')
            .eq('active', true)
            .or(`title.ilike.%${param}%,topic.ilike.%${param}%,content.ilike.%${param}%`)
            .order('"order"', { ascending: true })
            .limit(5)

          return { data: manualsSearch || [] }

        case 'listar_manuais':
          return await supabase
            .from('system_manuals')
            .select('id, title, category, topic, keywords')
            .eq('active', true)
            .order('category, "order"', { ascending: true })
            .limit(30)

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

      case 'quem_sou_eu':
        responseText = data[0].message
        break

      case 'listar_todos_clientes':
        responseText = `👥 **Lista Completa de Clientes (${count}):**\n\n`
        responseText += data.map((client: any) =>
          `👤 **${client.name}**\n` +
          `   ${client.cpf_cnpj ? `📄 ${client.cpf_cnpj}\n` : ''}` +
          `   📧 ${client.email || 'Sem email'}\n` +
          `   📱 ${client.phone || 'Sem telefone'}\n` +
          `   📍 ${client.city || 'Sem cidade'}${client.state ? ` - ${client.state}` : ''}`
        ).join('\n\n')
        break

      case 'todas_os':
        responseText = `📋 **Histórico Completo de OS (${count}):**\n\n`
        responseText += data.map((os: any) =>
          `**OS ${os.order_number}** - ${os.customer_name}\n` +
          `   Status: ${this.translateStatus(os.status)} | R$ ${this.formatMoney(os.total_value)}\n` +
          `   Data: ${this.formatDate(os.created_at)}`
        ).join('\n\n')
        break

      case 'indicadores_roi':
        const roi = data[0]
        responseText = `📊 **Indicadores de Rentabilidade:**\n\n` +
          `💰 Faturamento Total: R$ ${this.formatMoney(roi.total_revenue)}\n` +
          `💸 Custo Total: R$ ${this.formatMoney(roi.total_cost)}\n` +
          `💚 Lucro: R$ ${this.formatMoney(roi.profit)}\n` +
          `📈 ROI: ${roi.roi.toFixed(2)}%\n` +
          `🎯 Ticket Médio: R$ ${this.formatMoney(roi.ticket_medio)}\n` +
          `📋 OS Analisadas: ${roi.orders_count}\n\n` +
          `${roi.roi > 20 ? '✅ ROI Excelente!' : roi.roi > 10 ? '👍 ROI Bom' : '⚠️ ROI Precisa Melhorar'}`
        break

      case 'ticket_medio':
        const ticket = data[0]
        responseText = `🎯 **Ticket Médio:**\n\n` +
          `• Valor médio por venda: **R$ ${this.formatMoney(ticket.ticket_medio)}**\n` +
          `• Total de vendas: ${ticket.orders_count}\n` +
          `• Faturamento total: R$ ${this.formatMoney(ticket.total_revenue)}`
        break

      case 'como_ta_indo':
      case 'tamo_lucrando':
      case 'ta_ruim':
        const status = data[0]
        const emoji = status.lucro > 0 ? '💚' : status.lucro < 0 ? '🔴' : '⚠️'
        const statusMsg = status.lucro > 5000 ? 'Tá indo muito bem!' :
                          status.lucro > 1000 ? 'Tá indo legal!' :
                          status.lucro > 0 ? 'No azul, mas pode melhorar' :
                          'Tá apertado, precisa atenção!'

        responseText = `${emoji} **Status do Negócio:**\n\n` +
          `📈 Receita do mês: R$ ${this.formatMoney(status.receita)}\n` +
          `📉 Despesa do mês: R$ ${this.formatMoney(status.despesa)}\n` +
          `💰 Lucro: R$ ${this.formatMoney(status.lucro)}\n` +
          `✅ OS Concluídas: ${status.orders_completed}\n\n` +
          `**${statusMsg}**`
        break

      case 'clientes_inadimplentes':
        if (count === 0) {
          responseText = '✅ Ótimo! Não há clientes inadimplentes no momento!'
        } else {
          responseText = `⚠️ **${count} Cliente(s) Inadimplente(s):**\n\n`
          responseText += data.map((conta: any) =>
            `🔴 **${conta.description}**\n` +
            `   Valor: R$ ${this.formatMoney(conta.amount)}\n` +
            `   Vencimento: ${this.formatDate(conta.due_date)}`
          ).join('\n\n')
        }
        break

      case 'quem_paga_em_dia':
        responseText = `✅ **Clientes Pontuais (${count}):**\n\n`
        if (count === 0) {
          responseText = 'Ainda não há histórico de pagamentos pontuais.'
        } else {
          responseText += data.slice(0, 10).map((conta: any) =>
            `✅ **${conta.description}**: R$ ${this.formatMoney(conta.amount)} - Pago em dia`
          ).join('\n')
        }
        break

      case 'listar_equipamentos':
        responseText = `🔧 **Equipamentos Cadastrados (${count}):**\n\n`
        responseText += data.map((eq: any) =>
          `🔧 **${eq.name}**\n` +
          `   Marca: ${eq.brand || 'Não informada'}\n` +
          `   Modelo: ${eq.model || 'Não informado'}\n` +
          `   Serial: ${eq.serial_number || 'Não informado'}`
        ).join('\n\n')
        break

      case 'listar_documentos':
        responseText = `📚 **Biblioteca de Documentos (${count}):**\n\n`
        responseText += data.map((doc: any) =>
          `📄 **${doc.title}**\n` +
          `   Tipo: ${doc.type || 'Não especificado'}\n` +
          `   Categoria: ${doc.category || 'Geral'}\n` +
          `   Data: ${this.formatDate(doc.created_at)}`
        ).join('\n\n')
        break

      case 'buscar_documento':
        if (count === 0) {
          responseText = '🔍 Não encontrei documentos com esse critério.\n\nTente usar outras palavras-chave!'
        } else {
          responseText = `📚 **Documentos Encontrados (${count}):**\n\n`
          responseText += data.map((doc: any) =>
            `📄 **${doc.title}**\n` +
            `   Tipo: ${doc.type}\n` +
            `   Categoria: ${doc.category}\n` +
            `   ${doc.description ? `📝 ${doc.description}` : ''}`
          ).join('\n\n')
        }
        break

      case 'ajuda_sistema':
        if (count === 0) {
          responseText = '🤔 Não encontrei um manual específico sobre isso.\n\n' +
            'Tente perguntar de outra forma ou digite "lista de manuais" para ver todos os tutoriais disponíveis!'
        } else {
          responseText = `📖 **Manual do Sistema:**\n\n`

          data.forEach((manual: any) => {
            responseText += `# ${manual.title}\n\n`
            responseText += `**Categoria:** ${manual.category} • **Tópico:** ${manual.topic}\n\n`
            responseText += `${manual.content}\n\n`
            responseText += `─────────────────────\n\n`
          })

          responseText += `\n💡 **Precisa de mais ajuda?**\n`
          responseText += `• Digite "lista de manuais" para ver todos os tutoriais\n`
          responseText += `• Pergunte algo específico, tipo: "como criar cliente?"`
        }
        break

      case 'listar_manuais':
        responseText = `📚 **Manuais do Sistema Disponíveis (${count}):**\n\n`

        const manualsByCategory = data.reduce((acc: any, manual: any) => {
          if (!acc[manual.category]) {
            acc[manual.category] = []
          }
          acc[manual.category].push(manual)
          return acc
        }, {})

        Object.entries(manualsByCategory).forEach(([category, manuals]: [string, any]) => {
          responseText += `\n**${category}:**\n`
          manuals.forEach((manual: any) => {
            responseText += `   📖 ${manual.title}\n`
            responseText += `      ${manual.topic}\n`
          })
        })

        responseText += `\n\n💡 **Como usar:**\n`
        responseText += `Pergunte ao Thomaz! Exemplos:\n`
        responseText += `• "Como criar uma OS?"\n`
        responseText += `• "Como cadastrar cliente?"\n`
        responseText += `• "Explica como dar entrada no estoque"\n`
        responseText += `• "Tutorial de lançar receita"`
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

  private async useAIResponse(userMessage: string, normalizedMessage: string): Promise<{ text: string; metadata?: any }> {
    try {
      // MODO SUPERINTELIGÊNCIA ATIVADO! 🧠
      console.log('🧠 Thomaz Superinteligência Ativada!')

      // 1. Obter histórico da conversa para contexto
      const conversationHistory = [] // TODO: passar histórico real

      // 2. Usar sistema avançado com raciocínio em cadeia
      const advanced = await thomazAdvanced.getAdvancedResponse(userMessage, conversationHistory)

      if (advanced && advanced.confidence >= 0.60) {
        console.log(`✅ Resposta avançada gerada com confiança: ${(advanced.confidence * 100).toFixed(0)}%`)
        console.log(`📊 Fontes usadas: ${advanced.sources.length}`)
        console.log(`🌐 Resultados web: ${advanced.webResults.length}`)

        let responseText = advanced.response

        // Adicionar informações de raciocínio se disponível
        if (advanced.reasoning && advanced.reasoning.steps.length > 0) {
          responseText += `\n\n🔍 **Processo de Raciocínio:**\n`
          advanced.reasoning.steps.slice(0, 3).forEach(step => {
            responseText += `${step.step}. ${step.description}\n`
          })
        }

        // Adicionar fontes se houver
        if (advanced.sources.length > 0) {
          responseText += `\n\n📚 **Fontes consultadas:**\n`
          advanced.sources.slice(0, 3).forEach((source, i) => {
            responseText += `${i + 1}. ${source}\n`
          })
        }

        return {
          text: responseText,
          metadata: {
            source: 'advanced_ai',
            confidence: advanced.confidence,
            reasoning_steps: advanced.reasoning?.total_steps || 0,
            web_results: advanced.webResults.length,
            sources: advanced.sources
          }
        }
      }

      // 3. Fallback para Edge Function se sistema avançado não tiver confiança
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/thomaz-ai`
      const businessContext = await this.getBusinessContext()

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: 'Conversa em andamento com usuário do sistema',
          systemData: businessContext
        })
      })

      if (response.ok) {
        const { response: aiResponse } = await response.json()
        return {
          text: `🤖 ${aiResponse}\n\n💡 **Dica:** Para comandos específicos, experimente:\n` +
            `• "OS abertas", "Clientes", "Estoque baixo"\n` +
            `• "Como criar OS?", "Como cadastrar cliente?"\n` +
            `• Digite "ajuda" para ver tudo!`,
          metadata: { source: 'ai' }
        }
      }
    } catch (error) {
      console.error('Erro ao usar IA:', error)
    }

    return this.getIntelligentFallback(normalizedMessage)
  }

  private async getBusinessContext(): Promise<any> {
    try {
      const { data: osCount } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact', head: true })

      const { data: clientsCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })

      return {
        total_orders: osCount || 0,
        total_clients: clientsCount || 0,
        system: 'Sistema de Gestão Empresarial'
      }
    } catch {
      return {}
    }
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
