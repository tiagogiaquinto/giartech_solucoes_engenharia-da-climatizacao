import { supabase } from '../lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Intent {
  intent: string
  confidence: number
  matched_pattern: string
  keywords: string[]
}

interface Memory {
  memory_id: string
  subject: string
  content: string
  confidence: number
  tags: string[]
}

export class ThomazAdvancedService {
  private conversationHistory: Message[] = []
  private sessionId: string
  private userId?: string
  private currentContext: any = {}
  private personality: any = null

  constructor(userId?: string) {
    this.userId = userId
    this.sessionId = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.loadPersonality()
  }

  /**
   * Carregar personalidade
   */
  private async loadPersonality() {
    try {
      const { data } = await supabase
        .from('thomaz_personality_config')
        .select('*')
        .single()

      this.personality = data
    } catch (err) {
      console.error('Erro ao carregar personalidade:', err)
    }
  }

  /**
   * Detectar intenção da mensagem usando NLP
   */
  private async detectIntent(message: string): Promise<Intent | null> {
    try {
      const { data, error } = await supabase.rpc('thomaz_detect_intent', {
        p_message: message.toLowerCase()
      })

      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (err) {
      console.error('Erro ao detectar intenção:', err)
      return null
    }
  }

  /**
   * Expandir query com sinônimos para melhor compreensão
   */
  private async expandQuery(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('thomaz_expand_query', {
        p_query: query
      })

      if (error) throw error
      return data || query
    } catch (err) {
      console.error('Erro ao expandir query:', err)
      return query
    }
  }

  /**
   * Buscar memórias relevantes
   */
  private async recallMemories(query: string): Promise<Memory[]> {
    try {
      const { data, error } = await supabase.rpc('thomaz_recall_memories', {
        p_query: query,
        p_limit: 5
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erro ao buscar memórias:', err)
      return []
    }
  }

  /**
   * Salvar novo aprendizado
   */
  private async saveLearn(query: string, response: string, context: any = {}) {
    try {
      await supabase.rpc('thomaz_save_learning', {
        p_query: query,
        p_response: response,
        p_context: context
      })
    } catch (err) {
      console.error('Erro ao salvar aprendizado:', err)
    }
  }

  /**
   * Buscar no banco de dados do sistema
   */
  private async searchSystemData(query: string): Promise<any> {
    const expandedQuery = await this.expandQuery(query)
    const data: any = {}

    try {
      const queryLower = expandedQuery.toLowerCase()

      if (/ordem|servi[çc]o|os|atendimento|chamado/i.test(queryLower)) {
        const { data: oss } = await supabase.rpc('thomaz_get_service_orders_info', {
          p_filter: query,
          p_limit: 10
        })
        data.serviceOrders = oss || []
      }

      if (/estoque|material|produto|invent[aá]rio/i.test(queryLower)) {
        const { data: inv } = await supabase.rpc('thomaz_get_inventory_info', {
          p_search: query,
          p_low_stock_only: /baixo|falta|m[íi]nimo/i.test(queryLower)
        })
        data.inventory = inv || []
      }

      if (/agenda|compromisso|reuni[ãa]o|hor[aá]rio/i.test(queryLower)) {
        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 7)

        const { data: agenda } = await supabase.rpc('thomaz_get_agenda_info', {
          p_date_from: today.toISOString().split('T')[0],
          p_date_to: endDate.toISOString().split('T')[0]
        })
        data.agenda = agenda || []
      }

      if (/funcion[aá]rio|colaborador|equipe|pessoal/i.test(queryLower)) {
        const { data: emp } = await supabase.rpc('thomaz_get_employees_info', {
          p_search: query,
          p_active_only: true
        })
        data.employees = emp || []
      }

      if (/financeiro|receita|despesa|pagamento|dinheiro/i.test(queryLower)) {
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 30)

        const { data: fin } = await supabase.rpc('thomaz_get_financial_entries_info', {
          p_date_from: startDate.toISOString().split('T')[0],
          p_date_to: today.toISOString().split('T')[0]
        })
        data.finances = fin || []
      }

      if (/estat[íi]stica|resumo|total|dashboard/i.test(queryLower) || Object.keys(data).length === 0) {
        const { data: stats } = await supabase.rpc('thomaz_get_system_stats')
        data.stats = stats
      }

    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    }

    return data
  }

  /**
   * Gerar resposta conversacional baseada na intenção
   */
  private async generateResponse(message: string, intent: Intent | null, systemData: any, memories: Memory[]): Promise<string> {
    const hour = new Date().getHours()
    let response = ''

    if (intent?.intent === 'greeting') {
      const greetings = [
        `${hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}! 😊`,
        'E aí! Vamos trabalhar juntos? 🚀',
        'Olá! Pronto para te ajudar! ✨',
        'Opa! Como posso facilitar seu dia? 😄'
      ]
      response = greetings[Math.floor(Math.random() * greetings.length)]
      response += '\n\nSou o Thomaz, seu assistente inteligente! Como posso ajudar você hoje?'
      return response
    }

    if (intent?.intent === 'farewell') {
      const farewells = [
        'Até mais! Se precisar de algo, é só chamar! 👋',
        'Tchau! Foi um prazer ajudar! 😊',
        'Até logo! Estou sempre por aqui! ✨',
        'Falou! Conte comigo sempre! 🚀'
      ]
      return farewells[Math.floor(Math.random() * farewells.length)]
    }

    if (intent?.intent === 'gratitude') {
      const thanks = [
        'Por nada! Fico feliz em ajudar! 😊',
        'Sempre às ordens! 🚀',
        'De nada! Estou aqui para isso! ✨',
        'Imagina! Foi um prazer! 😄'
      ]
      return thanks[Math.floor(Math.random() * thanks.length)]
    }

    if (intent?.intent === 'how_are_you') {
      const states = [
        'Estou ótimo, obrigado por perguntar! 😊 E você?',
        'Super bem! Pronto para te ajudar! 🚀',
        'Excelente! E você, como está? ✨',
        'Muito bem! E aí, tudo certo? 😄'
      ]
      return states[Math.floor(Math.random() * states.length)]
    }

    if (intent?.intent === 'about_self') {
      return `Eu sou o Thomaz! 🤖✨\n\nSou seu assistente inteligente. Posso te ajudar com:\n\n📋 Ordens de Serviço\n📦 Estoque e Materiais\n📅 Agenda e Compromissos\n👥 Funcionários\n💰 Finanças\n📊 Estatísticas\n\nE muito mais! Posso conversar normalmente contigo, entender suas perguntas e aprender com cada interação. 😊\n\nO que você gostaria de saber?`
    }

    if (intent?.intent === 'help') {
      return `Claro! Estou aqui para ajudar! 🆘\n\nPosso te auxiliar com:\n\n• 📋 Ver e gerenciar ordens de serviço\n• 📦 Consultar estoque e materiais\n• 📅 Checar sua agenda e compromissos\n• 👥 Informações sobre funcionários\n• 💰 Lançamentos financeiros\n• 📊 Estatísticas do sistema\n\nVocê pode me perguntar coisas como:\n- "Quais OSs estão abertas?"\n- "Tem algum item com estoque baixo?"\n- "Compromissos de hoje"\n- "Quanto faturamos este mês?"\n\nOu simplesmente conversar comigo normalmente! 😊\n\nO que você precisa?`
    }

    if (Object.keys(systemData).length > 0) {
      response += this.formatSystemDataResponse(systemData)
    }

    if (memories.length > 0) {
      response += '\n\n💡 **Lembro de algo relacionado:**\n\n'
      memories.slice(0, 2).forEach(mem => {
        response += `• ${mem.content}\n`
      })
    }

    if (!response) {
      response = this.generateConversationalResponse(message)
    }

    return response
  }

  private formatSystemDataResponse(data: any): string {
    let response = ''
    const useEmoji = this.personality?.emoji_usage !== false

    if (data.serviceOrders && data.serviceOrders.length > 0) {
      response += `${useEmoji ? '📋 ' : ''}**Ordens de Serviço:**\n\n`
      data.serviceOrders.slice(0, 5).forEach((os: any) => {
        const statusEmoji = os.status === 'completed' ? '✅' : os.status === 'in_progress' ? '⚙️' : '📝'
        response += `${useEmoji ? statusEmoji : '•'} **OS #${os.order_number}**\n`
        response += `   Cliente: ${os.customer_name}\n`
        response += `   Status: ${os.status}\n`
        response += `   Valor: R$ ${(os.total_value || 0).toFixed(2)}\n\n`
      })
    }

    if (data.inventory && data.inventory.length > 0) {
      const lowStock = data.inventory.filter((i: any) => i.stock_status !== 'OK')
      if (lowStock.length > 0) {
        response += `${useEmoji ? '⚠️ ' : ''}**Atenção! Itens com estoque baixo:**\n\n`
        lowStock.slice(0, 5).forEach((item: any) => {
          response += `${useEmoji ? '🔴 ' : '•'} ${item.product_name} - Qtd: ${item.current_quantity}\n`
        })
        response += '\n'
      }
    }

    if (data.agenda && data.agenda.length > 0) {
      response += `${useEmoji ? '📅 ' : ''}**Próximos compromissos:**\n\n`
      data.agenda.slice(0, 3).forEach((event: any) => {
        const date = new Date(event.start_time)
        response += `• ${event.title} - ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`
      })
      response += '\n'
    }

    if (data.stats) {
      response += `${useEmoji ? '📊 ' : ''}**Resumo do Sistema:**\n\n`
      response += `• ${data.stats.total_oss} OSs (${data.stats.oss_abertas} abertas)\n`
      response += `• ${data.stats.total_clientes} clientes\n`
      response += `• ${data.stats.total_funcionarios} funcionários ativos\n`
      if (data.stats.estoque_baixo > 0) {
        response += `• ${useEmoji ? '⚠️ ' : ''}${data.stats.estoque_baixo} itens com estoque baixo\n`
      }
      response += '\n'
    }

    return response
  }

  private generateConversationalResponse(message: string): string {
    const responses = [
      `Interessante... 🤔 Deixa eu pensar sobre isso.\n\nPelo que entendi, você está perguntando sobre "${message}".\n\nPosso te ajudar de várias formas! Que tal me dar mais detalhes?`,
      `Entendi! Sobre "${message}"...\n\nAinda estou aprendendo sobre este assunto. Pode me explicar melhor o que você precisa?`,
      `Boa pergunta! 😊\n\nVou guardar isso na memória para aprender mais. Enquanto isso, posso te ajudar com:\n• Ordens de Serviço\n• Estoque\n• Agenda\n• Finanças\n\nO que você prefere?`,
      `Hmm... "${message}"\n\nNão tenho dados específicos sobre isso no momento, mas estou sempre aprendendo! 📚\n\nQue tal me contar mais ou tentar outra pergunta?`
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  async processMessage(userMessage: string): Promise<string> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      })

      const intent = await this.detectIntent(userMessage)
      const memories = await this.recallMemories(userMessage)
      const systemData = await this.searchSystemData(userMessage)
      const response = await this.generateResponse(userMessage, intent, systemData, memories)

      await this.saveLearn(userMessage, response, {
        intent: intent?.intent,
        system_data_found: Object.keys(systemData).length > 0,
        memories_recalled: memories.length
      })

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      })

      await this.saveContext()

      return response

    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      return 'Ops! Tive um probleminha aqui... 😅 Pode tentar de novo?'
    }
  }

  private async saveContext() {
    if (!this.userId) return

    try {
      await supabase.from('thomaz_conversation_context').upsert({
        user_id: this.userId,
        session_id: this.sessionId,
        conversation_history: this.conversationHistory,
        context_data: this.currentContext,
        last_interaction_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Erro ao salvar contexto:', err)
    }
  }

  async getInitialGreeting(): Promise<string> {
    await this.loadPersonality()

    const hour = new Date().getHours()
    const timeGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

    const greetings = [
      `${timeGreeting}! 👋\n\nSou o Thomaz, seu assistente inteligente! 🤖✨`,
      `${timeGreeting}! E aí! 😊\n\nThomaz aqui, pronto para te ajudar! 🚀`,
      `${timeGreeting}! Opa! 😄\n\nSou o Thomaz! Vamos trabalhar juntos hoje?`
    ]

    let greeting = greetings[Math.floor(Math.random() * greetings.length)]

    greeting += '\n\nPosso conversar normalmente contigo sobre:\n'
    greeting += '• 📋 Ordens de Serviço\n'
    greeting += '• 📦 Estoque e Materiais\n'
    greeting += '• 📅 Agenda\n'
    greeting += '• 💰 Finanças\n'
    greeting += '• E muito mais!\n\n'
    greeting += 'Como posso te ajudar hoje? 😊'

    return greeting
  }

  async registerFeedback(messageId: string, userQuery: string, response: string, feedbackType: 'positive' | 'negative', score: number) {
    try {
      await supabase.from('thomaz_feedback_analysis').insert({
        message_id: messageId,
        user_query: userQuery,
        thomaz_response: response,
        feedback_type: feedbackType,
        feedback_score: score,
        context_data: this.currentContext
      })
    } catch (err) {
      console.error('Erro ao registrar feedback:', err)
    }
  }
}

export default ThomazAdvancedService
