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
  private libraryKnowledge: any[] = []

  constructor(userId?: string) {
    this.userId = userId
    this.sessionId = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.loadPersonality()
    this.loadLibraryKnowledge()
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
   * Carregar conhecimento da biblioteca digital
   */
  private async loadLibraryKnowledge() {
    try {
      const { data: library } = await supabase
        .from('library_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (library && library.length > 0) {
        this.libraryKnowledge = library

        // Salvar documentos importantes na memória de longo prazo
        for (const doc of library.slice(0, 20)) {
          const tags = doc.tags || []
          const content = `Documento: ${doc.title}. ${doc.description || ''}`

          await supabase.from('thomaz_long_term_memory').upsert({
            fact: content,
            source: `library_${doc.id}`,
            confidence: 0.95,
            category: 'library_document',
            tags: [...tags, doc.type || 'document'],
            metadata: {
              document_id: doc.id,
              title: doc.title,
              type: doc.type,
              file_url: doc.file_url
            }
          }, {
            onConflict: 'source',
            ignoreDuplicates: false
          })
        }

        console.log(`📚 Thomaz carregou ${library.length} documentos da biblioteca`)
      }
    } catch (err) {
      console.error('Erro ao carregar biblioteca:', err)
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
      return `Eu sou o Thomaz! 🤖✨\n\nSou seu assistente inteligente. Posso te ajudar com:\n\n📋 Ordens de Serviço\n📦 Estoque e Materiais\n📅 Agenda e Compromissos\n👥 Funcionários\n💰 Finanças\n📊 Estatísticas\n🌐 Buscar na internet\n📚 Ler documentos\n\nE muito mais! Posso conversar normalmente contigo, entender suas perguntas, buscar informações na internet e aprender com cada interação. 😊\n\nO que você gostaria de saber?`
    }

    if (intent?.intent === 'help') {
      return `Claro! Estou aqui para ajudar! 🆘\n\nPosso te auxiliar com:\n\n• 📋 Ver e gerenciar ordens de serviço\n• 📦 Consultar estoque e materiais\n• 📅 Checar sua agenda e compromissos\n• 👥 Informações sobre funcionários\n• 💰 Lançamentos financeiros\n• 📊 Estatísticas do sistema\n• 🌐 Buscar informações na internet\n• 📚 Ler documentos da biblioteca\n\nVocê pode me perguntar coisas como:\n- "Quais OSs estão abertas?"\n- "Tem algum item com estoque baixo?"\n- "Compromissos de hoje"\n- "Quanto faturamos este mês?"\n- "Busca informações sobre gestão financeira"\n- "Quais documentos temos sobre segurança?"\n\nOu simplesmente conversar comigo normalmente! 😊\n\nO que você precisa?`
    }

    // Verificar se é uma pergunta que precisa de busca na internet
    const needsWebSearch = /busca|pesquisa|procura|informações sobre|o que é|quem é|define/i.test(message)
    const needsDocuments = /documento|manual|tutorial|guia|biblioteca|arquivo/i.test(message)

    // Buscar na internet se necessário
    if (needsWebSearch && !Object.keys(systemData).length) {
      const savedKnowledge = await this.searchSavedKnowledge(message)
      if (savedKnowledge) {
        response = savedKnowledge
      } else {
        const webResult = await this.searchWeb(message)
        if (webResult) {
          response = webResult
        }
      }
    }

    // Buscar documentos se necessário
    if (needsDocuments) {
      const docsResult = await this.readLibraryDocuments(message)
      if (docsResult) {
        response += (response ? '\n\n' : '') + docsResult
      }
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

      // Processar aprendizado em background
      this.processLearningQueue().catch(err => console.error('Erro no aprendizado:', err))

      const intent = await this.detectIntent(userMessage)
      const memories = await this.recallMemories(userMessage)
      const systemData = await this.searchSystemData(userMessage)
      let response = await this.generateResponse(userMessage, intent, systemData, memories)

      // Melhorar resposta baseado em aprendizados anteriores
      response = await this.improveResponse(userMessage, response)

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

  /**
   * Buscar conhecimento na internet
   */
  private async searchWeb(query: string): Promise<string> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/thomaz-web-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, saveToKnowledge: true })
      })

      if (!response.ok) {
        throw new Error('Erro na busca web')
      }

      const data = await response.json()

      if (data.success && data.content) {
        return `📚 **Encontrei informações na internet sobre "${query}":**\n\n${data.summary}\n\n_Fonte: ${data.source}_`
      }

      return 'Não encontrei informações específicas sobre isso na internet.'
    } catch (error) {
      console.error('Erro na busca web:', error)
      return 'Tive dificuldade para buscar na internet agora. Vou usar meu conhecimento interno!'
    }
  }

  /**
   * Ler documentos da biblioteca digital
   */
  private async readLibraryDocuments(query: string): Promise<string> {
    try {
      // Primeiro, buscar na memória carregada localmente
      const queryLower = query.toLowerCase()
      const localMatches = this.libraryKnowledge.filter(doc => {
        const titleMatch = doc.title?.toLowerCase().includes(queryLower)
        const descMatch = doc.description?.toLowerCase().includes(queryLower)
        const tagsMatch = doc.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))
        return titleMatch || descMatch || tagsMatch
      }).slice(0, 3)

      // Se não encontrou localmente, buscar no banco
      let documents = localMatches
      if (documents.length === 0) {
        const { data: dbDocs } = await supabase
          .from('library_items')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
          .limit(3)

        documents = dbDocs || []
      }

      if (documents.length === 0) {
        // Buscar também na memória de longo prazo
        const { data: memories } = await supabase
          .from('thomaz_long_term_memory')
          .select('*')
          .eq('category', 'library_document')
          .ilike('fact', `%${query}%`)
          .limit(3)

        if (memories && memories.length > 0) {
          let response = `📚 **Tenho conhecimento sobre isso na minha memória:**\n\n`
          memories.forEach((mem, index) => {
            response += `${index + 1}. ${mem.fact}\n\n`
          })
          return response
        }

        return null
      }

      let response = `📚 **Encontrei ${documents.length} documento(s) na biblioteca:**\n\n`

      documents.forEach((doc, index) => {
        response += `${index + 1}. **${doc.title}**\n`
        if (doc.description) {
          response += `   _${doc.description.substring(0, 150)}${doc.description.length > 150 ? '...' : ''}_\n`
        }
        response += `   📁 Tipo: ${doc.type || 'Documento'}\n`
        if (doc.tags && doc.tags.length > 0) {
          response += `   🏷️ Tags: ${doc.tags.join(', ')}\n`
        }
        response += '\n'
      })

      return response
    } catch (error) {
      console.error('Erro ao buscar documentos:', error)
      return null
    }
  }

  /**
   * Buscar no conhecimento web salvo
   */
  private async searchSavedKnowledge(query: string): Promise<string> {
    try {
      const { data: knowledge } = await supabase
        .from('thomaz_web_knowledge')
        .select('*')
        .ilike('query', `%${query}%`)
        .order('relevance_score', { ascending: false })
        .limit(1)

      if (knowledge && knowledge.length > 0) {
        const item = knowledge[0]
        return `💡 **Já busquei isso antes! Aqui está:**\n\n${item.content.substring(0, 600)}...\n\n_Última atualização: ${new Date(item.accessed_at).toLocaleDateString()}_`
      }

      return null
    } catch (error) {
      console.error('Erro ao buscar conhecimento salvo:', error)
      return null
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

    // Informar sobre biblioteca carregada
    if (this.libraryKnowledge.length > 0) {
      greeting += `\n\n📚 Tenho acesso a **${this.libraryKnowledge.length} documentos** da biblioteca digital!`
    }

    greeting += '\n\nPosso conversar normalmente contigo sobre:\n'
    greeting += '• 📋 Ordens de Serviço e Projetos\n'
    greeting += '• 📦 Estoque e Materiais\n'
    greeting += '• 📅 Agenda e Compromissos\n'
    greeting += '• 💰 Finanças e Relatórios\n'
    greeting += '• 🌐 Buscar informações na internet\n'
    greeting += '• 📚 Consultar documentos da biblioteca\n'
    greeting += '• 🤖 Aprender com nossas conversas\n'
    greeting += '• E muito mais!\n\n'
    greeting += '💡 **Dica:** Use o botão 🔄 para reiniciar nossa conversa a qualquer momento!\n\n'
    greeting += 'Como posso te ajudar hoje? 😊'

    return greeting
  }

  /**
   * Aprender com feedback do usuário
   */
  async learnFromFeedback(userMessage: string, aiResponse: string, wasHelpful: boolean) {
    try {
      // Salvar feedback
      await supabase.from('thomaz_feedback_analysis').insert({
        user_query: userMessage,
        response_given: aiResponse,
        feedback_type: wasHelpful ? 'positive' : 'negative',
        score: wasHelpful ? 1.0 : 0.0,
        user_id: this.userId,
        session_id: this.sessionId
      })

      // Se feedback foi positivo, fortalecer padrões
      if (wasHelpful) {
        // Identificar intent da mensagem
        const { data: intents } = await supabase
          .from('thomaz_nlp_patterns')
          .select('*')
          .ilike('pattern', `%${userMessage.toLowerCase().split(' ').slice(0, 3).join('%')}%`)
          .limit(1)

        if (intents && intents.length > 0) {
          const pattern = intents[0]
          await supabase
            .from('thomaz_nlp_patterns')
            .update({
              usage_count: (pattern.usage_count || 0) + 1,
              success_rate: Math.min(0.99, (pattern.success_rate || 0.5) + 0.05)
            })
            .eq('id', pattern.id)
        }

        // Salvar na memória de longo prazo
        await supabase.from('thomaz_long_term_memory').insert({
          fact: `Usuário perguntou: "${userMessage}" e a resposta foi útil`,
          source: 'user_feedback',
          confidence: 0.9,
          category: 'interaction',
          tags: userMessage.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5)
        })
      } else {
        // Se negativo, adicionar à fila de aprendizado
        await supabase.from('thomaz_learning_queue').insert({
          user_query: userMessage,
          response_given: aiResponse,
          feedback_type: 'improvement_needed',
          priority: 8,
          status: 'pending'
        })
      }

      // Processar aprendizado automático
      await this.processLearningQueue()
    } catch (error) {
      console.error('Erro ao aprender com feedback:', error)
    }
  }

  /**
   * Processar fila de aprendizado
   */
  private async processLearningQueue() {
    try {
      const { data: queue } = await supabase
        .from('thomaz_learning_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(5)

      if (!queue || queue.length === 0) return

      for (const item of queue) {
        // Analisar padrão da query
        const words = item.user_query.toLowerCase().split(' ')
        const keywords = words.filter((w: string) => w.length > 3)

        // Verificar se já existe padrão similar
        const { data: existing } = await supabase
          .from('thomaz_nlp_patterns')
          .select('*')
          .containedBy('keywords', keywords)
          .limit(1)

        if (!existing || existing.length === 0) {
          // Criar novo padrão
          await supabase.from('thomaz_nlp_patterns').insert({
            pattern: keywords.join('|'),
            intent: 'general_query',
            confidence: 0.6,
            keywords: keywords,
            examples: [item.user_query],
            usage_count: 1,
            success_rate: 0.5
          })
        }

        // Marcar como processado
        await supabase
          .from('thomaz_learning_queue')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .eq('id', item.id)
      }
    } catch (error) {
      console.error('Erro ao processar fila de aprendizado:', error)
    }
  }

  /**
   * Melhorar resposta baseado em histórico
   */
  async improveResponse(message: string, baseResponse: string): Promise<string> {
    try {
      // Buscar feedbacks similares
      const { data: feedbacks } = await supabase
        .from('thomaz_feedback_analysis')
        .select('*')
        .ilike('user_query', `%${message.split(' ').slice(0, 2).join('%')}%`)
        .eq('feedback_type', 'positive')
        .order('score', { ascending: false })
        .limit(3)

      if (feedbacks && feedbacks.length > 0) {
        // Analisar padrões de respostas bem-sucedidas
        const successfulPatterns = feedbacks.map((f: any) => f.response_given)

        // Se a resposta base é muito curta e há exemplos melhores
        if (baseResponse.length < 100 && successfulPatterns.some((p: string) => p.length > 200)) {
          // Adicionar mais contexto
          return baseResponse + '\n\n💡 **Informação adicional:**\nPosso detalhar mais algum ponto específico se precisar!'
        }
      }

      return baseResponse
    } catch (error) {
      console.error('Erro ao melhorar resposta:', error)
      return baseResponse
    }
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
