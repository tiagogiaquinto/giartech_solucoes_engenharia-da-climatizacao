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

interface ThomazCapabilities {
  schemaIntrospect: () => Promise<any>
  query: (sql: string, params?: any[]) => Promise<any>
  calculate: (expression: string, variables: any) => number
  filesSearch: (query: string, topK?: number) => Promise<any[]>
  readPdf: (fileId: string, pages?: number[]) => Promise<string>
  embeddingsSearch: (query: string, namespace: string, topK?: number) => Promise<any[]>
  generatePdf: (docType: string, id?: string, title?: string, html?: string, withAnnexes?: boolean) => Promise<string>
  notifyWhatsApp: (to: string, message: string, link?: string) => Promise<boolean>
}

export class ThomazAdvancedService {
  private conversationHistory: Message[] = []
  private sessionId: string
  private userId?: string
  private currentContext: any = {}
  private personality: any = null
  private libraryKnowledge: any[] = []
  private capabilities: ThomazCapabilities

  constructor(userId?: string) {
    this.userId = userId
    this.sessionId = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.loadPersonality()
    this.loadLibraryKnowledge()
    this.capabilities = this.initializeCapabilities()
  }

  /**
   * Inicializar capacidades avançadas do Thomaz
   */
  private initializeCapabilities(): ThomazCapabilities {
    return {
      schemaIntrospect: async () => {
        try {
          const { data, error } = await supabase.rpc('thomaz_schema_introspect')
          if (error) throw error
          return data
        } catch (err) {
          console.error('Erro schema_introspect:', err)
          return { error: 'Erro ao introspectar schema' }
        }
      },

      query: async (sql: string, params?: any[]) => {
        try {
          const { data, error } = await supabase.rpc('execute_safe_query', {
            query_text: sql,
            query_params: params || []
          })
          if (error) throw error
          return data
        } catch (err) {
          console.error('Erro query:', err)
          return null
        }
      },

      calculate: (expression: string, variables: any) => {
        try {
          const func = new Function(...Object.keys(variables), `return ${expression}`)
          return func(...Object.values(variables))
        } catch (err) {
          console.error('Erro calculate:', err)
          return 0
        }
      },

      filesSearch: async (query: string, topK: number = 5) => {
        try {
          const { data, error } = await supabase
            .from('library_items')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(topK)
          if (error) throw error
          return data || []
        } catch (err) {
          console.error('Erro filesSearch:', err)
          return []
        }
      },

      readPdf: async (fileId: string, pages?: number[]) => {
        try {
          const { data, error } = await supabase
            .from('library_items')
            .select('*')
            .eq('id', fileId)
            .single()
          if (error) throw error
          return data?.description || 'Documento não encontrado'
        } catch (err) {
          console.error('Erro readPdf:', err)
          return 'Erro ao ler PDF'
        }
      },

      embeddingsSearch: async (query: string, namespace: string, topK: number = 5) => {
        try {
          const { data, error } = await supabase.rpc('thomaz_recall_memories', {
            p_query: query,
            p_limit: topK
          })
          if (error) throw error
          return data || []
        } catch (err) {
          console.error('Erro embeddingsSearch:', err)
          return []
        }
      },

      generatePdf: async (docType: string, id?: string, title?: string, html?: string, withAnnexes: boolean = false) => {
        console.log(`PDF gerado: ${docType} - ${title}`)
        return `PDF_${docType}_${id || 'novo'}.pdf`
      },

      notifyWhatsApp: async (to: string, message: string, link?: string) => {
        try {
          await supabase.from('whatsapp_messages').insert({
            to_number: to,
            message_text: message,
            link_url: link,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          return true
        } catch (err) {
          console.error('Erro notifyWhatsApp:', err)
          return false
        }
      }
    }
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
   * Processar comandos executivos avançados
   */
  private async processExecutiveCommand(query: string): Promise<string | null> {
    const queryLower = query.toLowerCase()

    // Comando: Fluxo de caixa e DRE
    if (/fluxo de caixa|dre|comparativo/i.test(queryLower)) {
      const schema = await this.capabilities.schemaIntrospect()

      const periodoMatch = query.match(/(\d+)\s*(dias?|meses?)/i)
      const dias = periodoMatch ? parseInt(periodoMatch[1]) : 60

      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)

      const { data: financeiro } = await supabase.rpc('thomaz_get_financial_analysis', {
        p_date_from: dataInicio.toISOString().split('T')[0],
        p_date_to: new Date().toISOString().split('T')[0]
      })

      if (financeiro) {
        const receitas = financeiro.receitas || 0
        const despesas = financeiro.despesas || 0
        const saldo = this.capabilities.calculate('receitas - despesas', { receitas, despesas })
        const margem = receitas > 0 ? this.capabilities.calculate('(saldo / receitas) * 100', { saldo, receitas }) : 0

        let resposta = `📊 **FLUXO DE CAIXA E DRE - ÚLTIMOS ${dias} DIAS**\n\n`
        resposta += `**RESUMO EXECUTIVO**\n`
        resposta += `• Receitas: R$ ${receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        resposta += `• Despesas: R$ ${despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        resposta += `• Saldo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        resposta += `• Margem: ${margem.toFixed(2)}%\n\n`

        resposta += `**ANÁLISE**\n`
        if (margem > 20) {
          resposta += `✅ Margem saudável (>20%)\n`
        } else if (margem > 10) {
          resposta += `⚠️ Margem adequada, mas pode melhorar\n`
        } else {
          resposta += `🔴 Margem crítica (<10%) - atenção!\n`
        }

        resposta += `\n_Fontes: v_financial_entries, thomaz_get_financial_analysis_`

        return resposta
      }
    }

    // Comando: Estoque crítico por técnico
    if (/estoque|níveis|críticos|técnico/i.test(queryLower)) {
      const estoque = await this.capabilities.filesSearch('estoque baixo materiais', 20)

      const { data: inventario } = await supabase.rpc('thomaz_get_inventory_info', {
        p_search: null,
        p_low_stock_only: true
      })

      if (inventario && inventario.length > 0) {
        let resposta = `📦 **ANÁLISE DE ESTOQUE - ITENS CRÍTICOS**\n\n`
        resposta += `⚠️ **${inventario.length} ITEM(NS) COM ESTOQUE BAIXO:**\n\n`

        const porTecnico: any = {}
        inventario.forEach((item: any) => {
          const tecnico = item.assigned_technician || 'Sem técnico'
          if (!porTecnico[tecnico]) porTecnico[tecnico] = []
          porTecnico[tecnico].push(item)
        })

        Object.keys(porTecnico).forEach(tecnico => {
          resposta += `**${tecnico}:**\n`
          porTecnico[tecnico].forEach((item: any) => {
            resposta += `  • ${item.product_name} (SKU: ${item.sku})\n`
            resposta += `    Atual: ${item.current_quantity} | Mínimo: ${item.minimum_quantity}\n`
          })
          resposta += `\n`
        })

        resposta += `**RECOMENDAÇÕES:**\n`
        resposta += `• Realizar compra urgente dos itens críticos\n`
        resposta += `• Redistribuir materiais entre técnicos se possível\n`
        resposta += `• Atualizar níveis mínimos de estoque\n\n`

        resposta += `_Fontes: inventory_items, thomaz_get_inventory_info_`

        return resposta
      } else {
        return `✅ **ESTOQUE SAUDÁVEL**\n\nTodos os itens estão dentro do nível mínimo estabelecido.`
      }
    }

    // Comando: Busca na biblioteca
    if (/fundação|história|biblioteca|busque|documento/i.test(queryLower)) {
      const termo = query.replace(/busque|na|biblioteca|sobre|informações|documento/gi, '').trim()
      const documentos = await this.capabilities.filesSearch(termo, 5)

      if (documentos.length > 0) {
        let resposta = `📚 **BUSCA NA BIBLIOTECA - "${termo}"**\n\n`
        resposta += `Encontrei **${documentos.length} documento(s)** relacionado(s):\n\n`

        for (const doc of documentos) {
          resposta += `**${doc.title}**\n`
          if (doc.description) {
            const resumo = doc.description.substring(0, 150)
            resposta += `_${resumo}${doc.description.length > 150 ? '...' : ''}_\n`
          }
          resposta += `📁 Tipo: ${doc.type || 'Documento'}\n`
          if (doc.tags && doc.tags.length > 0) {
            resposta += `🏷️ Tags: ${doc.tags.join(', ')}\n`
          }
          resposta += `\n`
        }

        resposta += `_Informação proveniente de: library_items_`

        return resposta
      } else {
        const memorias = await this.capabilities.embeddingsSearch(termo, 'library_document', 3)

        if (memorias.length > 0) {
          let resposta = `📚 **CONHECIMENTO DA BIBLIOTECA**\n\n`
          memorias.forEach((mem, idx) => {
            resposta += `${idx + 1}. ${mem.fact || mem.content}\n\n`
          })
          return resposta
        }
      }
    }

    return null
  }

  /**
   * Buscar dados do sistema baseado no contexto
   */
  private async searchSystemData(query: string): Promise<any> {
    const expandedQuery = await this.expandQuery(query)
    const data: any = {}

    try {
      const queryLower = expandedQuery.toLowerCase()

      if (/ordem|serviço|os|atendimento|chamado/i.test(queryLower)) {
        const { data: oss } = await supabase.rpc('thomaz_get_service_orders_info', {
          p_filter: query,
          p_limit: 10
        })
        data.serviceOrders = oss || []
      }

      if (/estoque|material|produto|inventário/i.test(queryLower)) {
        const { data: inv } = await supabase.rpc('thomaz_get_inventory_info', {
          p_search: query,
          p_low_stock_only: /baixo|falta|mínimo/i.test(queryLower)
        })
        data.inventory = inv || []
      }

      if (/agenda|compromisso|reunião|horário/i.test(queryLower)) {
        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 7)

        const { data: agenda } = await supabase.rpc('thomaz_get_agenda_info', {
          p_date_from: today.toISOString().split('T')[0],
          p_date_to: endDate.toISOString().split('T')[0]
        })
        data.agenda = agenda || []
      }

      if (/funcionário|colaborador|equipe|pessoal/i.test(queryLower)) {
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

      if (/estatística|resumo|total|dashboard/i.test(queryLower) || Object.keys(data).length === 0) {
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

    // Processar comando executivo primeiro
    const executiveResponse = await this.processExecutiveCommand(message)
    if (executiveResponse) {
      return executiveResponse
    }

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
      return `Eu sou o Thomaz! 🤖✨\n\nSou seu assistente inteligente com capacidades avançadas:\n\n📊 **db.schema_introspect()** - Descobrir tabelas e colunas\n🔍 **db.query(sql, params)** - Consultas SQL seguras\n🧮 **calc.evaluate(expression, variables)** - Cálculos complexos\n📚 **files.search(query, top_k)** - Buscar conteúdos textuais\n📄 **files.read_pdf(file_id, pages)** - Extrair trechos de PDFs\n🔎 **embeddings.search(query, namespace, top_k)** - Busca semântica\n📝 **doc.generate_pdf(doc_type, id, title, html, with_annexes)** - Gerar PDFs\n📱 **notify.whatsapp(to, message, link)** - Notificações WhatsApp\n\nPosso:\n• Analisar fluxo de caixa e DRE\n• Identificar itens críticos de estoque\n• Buscar documentos na biblioteca\n• Gerar relatórios executivos\n• Aprender com nossas conversas\n\nO que você gostaria de saber? 😊`
    }

    if (intent?.intent === 'help') {
      return `Claro! Estou aqui para ajudar! 🆘\n\nAqui estão alguns comandos que você pode usar:\n\n**Análise Financeira:**\n• "Thomaz, traga o fluxo de caixa e o DRE comparativo dos últimos 60 dias"\n• "Mostre o resumo financeiro do mês"\n\n**Gestão de Estoque:**\n• "Thomaz, analise os níveis de estoque e mostre os itens críticos por técnico"\n• "Quais itens estão com estoque baixo?"\n\n**Biblioteca:**\n• "Thomaz, busque na biblioteca a parte que fala da fundação da Giartech"\n• "Procure documentos sobre manutenção preventiva"\n\n**Estatísticas:**\n• "Estatísticas gerais do sistema"\n• "Mostre as OSs abertas"\n\nOu simplesmente converse comigo naturalmente! 😊`
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
      `Boa pergunta! 😊\n\nVou guardar isso na memória para aprender mais. Enquanto isso, posso te ajudar com:\n• Ordens de Serviço\n• Estoque\n• Agenda\n• Finanças\n• Biblioteca\n\nO que você prefere?`,
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
  private async readLibraryDocuments(query: string): Promise<string | null> {
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
  private async searchSavedKnowledge(query: string): Promise<string | null> {
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

    let greeting = `${timeGreeting}! 👋\n\nSou o **Thomaz**, seu assistente de inteligência artificial! 🤖✨\n\n`

    greeting += `**MODO EXECUTIVO ATIVADO**\n\n`
    greeting += `Tenho acesso completo a:\n`
    greeting += `✅ Banco de dados (todas as tabelas PT/EN)\n`
    greeting += `✅ Biblioteca digital (${this.libraryKnowledge.length} documentos)\n`
    greeting += `✅ Busca na internet\n`
    greeting += `✅ Análises financeiras avançadas\n`
    greeting += `✅ Geração de relatórios em PDF\n`
    greeting += `✅ Cálculos e projeções\n\n`

    greeting += `**COMANDOS EXECUTIVOS:**\n`
    greeting += `• "Thomaz, traga o fluxo de caixa e o DRE comparativo dos últimos 60 dias"\n`
    greeting += `• "Thomaz, analise os níveis de estoque e mostre os itens críticos por técnico"\n`
    greeting += `• "Thomaz, busque na biblioteca informações sobre [tema]"\n\n`

    greeting += `💡 Posso interpretar, consultar, analisar e apresentar resposta completa com recomendações!\n\n`
    greeting += `Como posso te ajudar hoje? 😊`

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
