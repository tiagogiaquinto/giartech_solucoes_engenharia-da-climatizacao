import { supabase } from '../lib/supabase'

interface ThomMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  context?: any
}

interface SystemData {
  serviceOrders?: any[]
  inventory?: any[]
  agenda?: any[]
  employees?: any[]
  finances?: any[]
  stats?: any
}

export class ThomazSuperService {
  private conversationHistory: ThomMessage[] = []
  private sessionId: string
  private userId?: string
  private systemData: SystemData = {}
  private personality: any = null

  constructor(userId?: string) {
    this.userId = userId
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.loadPersonality()
  }

  /**
   * Carregar personalidade humanizada do Thomaz
   */
  private async loadPersonality() {
    try {
      const { data, error } = await supabase
        .from('thomaz_personality_config')
        .select('*')
        .single()

      if (!error && data) {
        this.personality = data
      }
    } catch (err) {
      console.error('Erro ao carregar personalidade:', err)
    }
  }

  /**
   * Gerar saudação humanizada baseada no horário
   */
  private getTimeBasedGreeting(): string {
    const hour = new Date().getHours()
    const greetings = this.personality?.custom_greetings || []

    let timeGreeting = ''
    if (hour < 12) {
      timeGreeting = 'Bom dia'
    } else if (hour < 18) {
      timeGreeting = 'Boa tarde'
    } else {
      timeGreeting = 'Boa noite'
    }

    if (greetings.length > 0) {
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
      return `${timeGreeting}! ${randomGreeting}`
    }

    return `${timeGreeting}! Como posso ajudar você hoje?`
  }

  /**
   * Adicionar frase humanizada aleatória
   */
  private getHumanPhrase(): string {
    const phrases = this.personality?.custom_phrases || [
      'Entendi!',
      'Deixa comigo!',
      'Vou verificar isso!',
      'Interessante...',
      'Encontrei!'
    ]
    return phrases[Math.floor(Math.random() * phrases.length)]
  }

  /**
   * Buscar resposta contextual usando IA do Thomaz
   */
  private async getIntelligentAnswer(query: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('thomaz_get_contextual_answer', {
        user_question: query
      })

      if (error) throw error

      if (data) {
        // Formatar resposta baseada no tipo
        const tipo = data.tipo
        const resposta = data.resposta
        const dados = data.dados

        let mensagem = resposta + '\n\n'

        if (tipo === 'lucro_mensal' && dados) {
          mensagem += `💰 Lucro no período ${dados.periodo}:\n`
          mensagem += `R$ ${parseFloat(dados.lucro_mes_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        } else if (tipo === 'contagem_os' && dados) {
          mensagem += `📋 Status das Ordens de Serviço:\n\n`
          mensagem += `• Total: ${dados.total}\n`
          mensagem += `• Pendentes: ${dados.pendentes}\n`
          mensagem += `• Em Andamento: ${dados.em_andamento}\n`
          mensagem += `• Completadas: ${dados.completadas}\n`
          mensagem += `• Criadas este mês: ${dados.mes_atual}`
        } else if (tipo === 'contagem_clientes' && dados) {
          mensagem += `👥 Seus Clientes:\n\n`
          mensagem += `• Total: ${dados.total} clientes\n`
          mensagem += `• Pessoas Físicas: ${dados.pf}\n`
          mensagem += `• Pessoas Jurídicas: ${dados.pj}\n`
          mensagem += `• Ativos este mês: ${dados.ativos_mes}`
        } else if (tipo === 'top_clientes' && dados) {
          mensagem += `🏆 Top 5 Clientes:\n\n`
          dados.forEach((cliente: any, i: number) => {
            mensagem += `${i + 1}. ${cliente.nome}\n`
            mensagem += `   💵 ${parseFloat(cliente.receita_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`
            mensagem += `   📦 ${cliente.total_pedidos} pedidos\n\n`
          })
        } else if (tipo === 'info_estoque' && dados) {
          mensagem += `📦 Estoque:\n\n`
          mensagem += `• Total de itens: ${dados.total_itens}\n`
          mensagem += `• Valor em estoque: R$ ${parseFloat(dados.valor_estoque).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
          mensagem += `• Itens com baixo estoque: ${dados.itens_baixo_estoque}`
        } else if (tipo === 'busca_conhecimento' && data.conhecimento) {
          mensagem += `📚 Encontrei isso:\n\n`
          data.conhecimento.forEach((item: any) => {
            mensagem += `• ${item.titulo}\n`
            if (item.descricao) mensagem += `  ${item.descricao}\n\n`
          })
        }

        return mensagem
      }

      return 'Desculpe, não consegui processar sua pergunta. Pode tentar novamente?'
    } catch (error) {
      console.error('Erro ao buscar resposta inteligente:', error)
      return 'Ops, tive um problema ao processar sua pergunta. Tente novamente!'
    }
  }

  /**
   * Buscar dados do sistema baseado no contexto
   */
  private async loadSystemData(query: string): Promise<void> {
    const queryLower = query.toLowerCase()

    try {
      // Detectar o que o usuário quer
      const needsOS = /\b(os|ordem|serviço|atendimento|cliente)\b/i.test(queryLower)
      const needsStock = /\b(estoque|material|produto|item|inventário)\b/i.test(queryLower)
      const needsAgenda = /\b(agenda|compromisso|reunião|horário|agendamento)\b/i.test(queryLower)
      const needsEmployee = /\b(funcionário|colaborador|equipe|técnico|pessoa)\b/i.test(queryLower)
      const needsFinance = /\b(financeiro|receita|despesa|pagamento|lançamento|dinheiro)\b/i.test(queryLower)
      const needsStats = /\b(estatística|resumo|dashboard|total|quantidade|relatório)\b/i.test(queryLower)

      // Carregar OSs
      if (needsOS) {
        const { data } = await supabase.rpc('thomaz_get_service_orders_info', {
          p_filter: this.extractSearchTerm(query),
          p_limit: 20
        })
        this.systemData.serviceOrders = data || []
      }

      // Carregar Estoque
      if (needsStock) {
        const { data } = await supabase.rpc('thomaz_get_inventory_info', {
          p_search: this.extractSearchTerm(query),
          p_low_stock_only: /\b(baixo|falta|acabando|mínimo)\b/i.test(queryLower)
        })
        this.systemData.inventory = data || []
      }

      // Carregar Agenda
      if (needsAgenda) {
        const { data } = await supabase.rpc('thomaz_get_agenda_info', {
          p_date_from: new Date().toISOString().split('T')[0],
          p_date_to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        this.systemData.agenda = data || []
      }

      // Carregar Funcionários
      if (needsEmployee) {
        const { data } = await supabase.rpc('thomaz_get_employees_info', {
          p_search: this.extractSearchTerm(query),
          p_active_only: true
        })
        this.systemData.employees = data || []
      }

      // Carregar Finanças
      if (needsFinance) {
        const dateFrom = new Date()
        dateFrom.setDate(dateFrom.getDate() - 30)

        const { data } = await supabase.rpc('thomaz_get_financial_entries_info', {
          p_date_from: dateFrom.toISOString().split('T')[0],
          p_date_to: new Date().toISOString().split('T')[0]
        })
        this.systemData.finances = data || []
      }

      // Carregar Estatísticas
      if (needsStats || query.length < 20) {
        const { data } = await supabase.rpc('thomaz_get_system_stats')
        this.systemData.stats = data
      }

    } catch (err) {
      console.error('Erro ao carregar dados do sistema:', err)
    }
  }

  /**
   * Extrair termo de busca da query
   */
  private extractSearchTerm(query: string): string | null {
    // Remover palavras comuns
    const stopWords = ['o', 'a', 'os', 'as', 'de', 'da', 'do', 'para', 'com', 'me', 'mostre', 'buscar', 'procurar', 'encontrar', 'ver', 'qual', 'quais']
    const words = query.toLowerCase().split(' ').filter(w => w.length > 2 && !stopWords.includes(w))

    // Procurar por números (podem ser SKUs ou números de OS)
    const number = query.match(/\b\d+\b/)
    if (number) return number[0]

    // Retornar palavras relevantes
    return words.length > 0 ? words[0] : null
  }

  /**
   * Gerar resposta humanizada e contextual
   */
  private generateHumanizedResponse(query: string): string {
    const queryLower = query.toLowerCase()
    let response = ''

    // Adicionar frase humanizada
    const useEmoji = this.personality?.emoji_usage !== false
    const phrase = this.getHumanPhrase()

    response += `${phrase} ${useEmoji ? '🔍' : ''}\n\n`

    // Analisar OSs
    if (this.systemData.serviceOrders && this.systemData.serviceOrders.length > 0) {
      response += `📋 **Ordens de Serviço encontradas:**\n\n`
      this.systemData.serviceOrders.slice(0, 5).forEach((os: any) => {
        const statusEmoji = os.status === 'completed' || os.status === 'concluida' ? '✅' :
                           os.status === 'in_progress' || os.status === 'em_andamento' ? '⚙️' : '📝'
        response += `${statusEmoji} **OS #${os.order_number}**\n`
        response += `   Cliente: ${os.customer_name}\n`
        response += `   Status: ${os.status}\n`
        response += `   Valor: R$ ${(os.total_value || 0).toFixed(2)}\n`
        if (os.scheduled_at) {
          response += `   Agendado: ${new Date(os.scheduled_at).toLocaleDateString('pt-BR')}\n`
        }
        response += `\n`
      })

      if (this.systemData.serviceOrders.length > 5) {
        response += `_...e mais ${this.systemData.serviceOrders.length - 5} ordens encontradas._\n\n`
      }
    }

    // Analisar Estoque
    if (this.systemData.inventory && this.systemData.inventory.length > 0) {
      const lowStock = this.systemData.inventory.filter((i: any) => i.stock_status !== 'OK')

      if (lowStock.length > 0) {
        response += `⚠️ **Atenção! Itens com estoque baixo:**\n\n`
        lowStock.slice(0, 5).forEach((item: any) => {
          const statusEmoji = item.stock_status === 'SEM ESTOQUE' ? '🔴' :
                             item.stock_status === 'ESTOQUE BAIXO' ? '🟡' : '🟠'
          response += `${statusEmoji} **${item.product_name}** (${item.sku})\n`
          response += `   Estoque atual: ${item.current_quantity}\n`
          response += `   Estoque mínimo: ${item.minimum_quantity}\n`
          response += `   Status: ${item.stock_status}\n\n`
        })
      } else {
        response += `✅ **Estoque:**\n\n`
        this.systemData.inventory.slice(0, 5).forEach((item: any) => {
          response += `• ${item.product_name} - Qtd: ${item.current_quantity} ✓\n`
        })
        response += `\n`
      }
    }

    // Analisar Agenda
    if (this.systemData.agenda && this.systemData.agenda.length > 0) {
      response += `📅 **Próximos compromissos:**\n\n`
      this.systemData.agenda.slice(0, 5).forEach((event: any) => {
        const date = new Date(event.start_time)
        response += `• **${event.title}**\n`
        response += `  ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`
        if (event.participants) {
          response += `  Participantes: ${event.participants}\n`
        }
        response += `\n`
      })
    }

    // Analisar Funcionários
    if (this.systemData.employees && this.systemData.employees.length > 0) {
      response += `👥 **Funcionários:**\n\n`
      this.systemData.employees.slice(0, 5).forEach((emp: any) => {
        response += `• **${emp.name}**\n`
        response += `  Cargo: ${emp.role || 'Não definido'}\n`
        response += `  Departamento: ${emp.department || 'Não definido'}\n`
        if (emp.phone) {
          response += `  Telefone: ${emp.phone}\n`
        }
        response += `\n`
      })
    }

    // Analisar Finanças
    if (this.systemData.finances && this.systemData.finances.length > 0) {
      const receitas = this.systemData.finances.filter((f: any) => f.entry_type === 'receita')
      const despesas = this.systemData.finances.filter((f: any) => f.entry_type === 'despesa')

      const totalReceitas = receitas.reduce((sum: number, f: any) => sum + Number(f.amount), 0)
      const totalDespesas = despesas.reduce((sum: number, f: any) => sum + Number(f.amount), 0)
      const saldo = totalReceitas - totalDespesas

      response += `💰 **Resumo Financeiro (últimos 30 dias):**\n\n`
      response += `Receitas: R$ ${totalReceitas.toFixed(2)} ${useEmoji ? '📈' : ''}\n`
      response += `Despesas: R$ ${totalDespesas.toFixed(2)} ${useEmoji ? '📉' : ''}\n`
      response += `Saldo: R$ ${saldo.toFixed(2)} ${saldo >= 0 ? (useEmoji ? '✅' : '') : (useEmoji ? '⚠️' : '')}\n\n`

      const pendentes = this.systemData.finances.filter((f: any) => f.status === 'pendente')
      if (pendentes.length > 0) {
        response += `⏳ **${pendentes.length} lançamento(s) pendente(s)**\n\n`
      }
    }

    // Estatísticas Gerais
    if (this.systemData.stats) {
      const stats = this.systemData.stats
      response += `📊 **Visão Geral do Sistema:**\n\n`
      response += `• Ordens de Serviço: ${stats.total_oss} total (${stats.oss_abertas} abertas)\n`
      response += `• Clientes cadastrados: ${stats.total_clientes}\n`
      response += `• Funcionários ativos: ${stats.total_funcionarios}\n`
      response += `• Itens em estoque: ${stats.itens_estoque}`

      if (stats.estoque_baixo > 0) {
        response += ` ${useEmoji ? '⚠️' : ''}(${stats.estoque_baixo} com estoque baixo)`
      }
      response += `\n`

      if (stats.compromissos_hoje > 0) {
        response += `• Compromissos hoje: ${stats.compromissos_hoje} ${useEmoji ? '📅' : ''}\n`
      }
      response += `\n`
    }

    // Se não encontrou nada relevante
    if (response === `${phrase} ${useEmoji ? '🔍' : ''}\n\n`) {
      response = `${phrase}\n\n`
      response += `Não encontrei dados específicos para "${query}".\n\n`
      response += `Mas posso ajudar você com:\n`
      response += `• 📋 Ordens de Serviço\n`
      response += `• 📦 Estoque e Materiais\n`
      response += `• 📅 Agenda e Compromissos\n`
      response += `• 👥 Funcionários\n`
      response += `• 💰 Lançamentos Financeiros\n`
      response += `• 📊 Estatísticas do Sistema\n\n`
      response += `O que você gostaria de saber?`
    }

    return response
  }

  /**
   * Salvar interação para aprendizado
   */
  private async saveInteraction(userMessage: string, response: string) {
    if (!this.userId) return

    try {
      await supabase.from('thomaz_interactions').insert({
        user_id: this.userId,
        session_id: this.sessionId,
        user_message: userMessage,
        thomaz_response: response,
        context: this.systemData,
        created_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Erro ao salvar interação:', err)
    }
  }

  /**
   * Salvar contexto da conversa
   */
  private async saveConversationContext() {
    if (!this.userId) return

    try {
      const context = {
        history: this.conversationHistory.slice(-10),
        system_data: this.systemData,
        last_query: this.conversationHistory[this.conversationHistory.length - 1]?.content
      }

      await supabase.from('thomaz_conversation_context').upsert({
        user_id: this.userId,
        session_id: this.sessionId,
        conversation_history: this.conversationHistory,
        context_data: context,
        last_interaction_at: new Date().toISOString()
      })
    } catch (err) {
      console.error('Erro ao salvar contexto:', err)
    }
  }

  /**
   * Processar mensagem principal
   */
  async processMessage(userMessage: string): Promise<string> {
    try {
      // Adicionar mensagem do usuário ao histórico
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      })

      // NOVA ABORDAGEM: Tentar resposta inteligente primeiro
      const intelligentAnswer = await this.getIntelligentAnswer(userMessage)

      if (intelligentAnswer && !intelligentAnswer.includes('não consegui processar')) {
        // Resposta inteligente bem-sucedida
        this.conversationHistory.push({
          role: 'assistant',
          content: intelligentAnswer,
          timestamp: new Date()
        })

        // Salvar interação
        await this.saveInteraction(userMessage, intelligentAnswer)
        await this.saveConversationContext()

        return intelligentAnswer
      }

      // FALLBACK: Usar método original se IA não conseguiu responder
      // Carregar dados relevantes do sistema
      await this.loadSystemData(userMessage)

      // Gerar resposta humanizada
      let response = this.generateHumanizedResponse(userMessage)

      // Adicionar sugestões proativas
      if (this.personality?.proactivity_level >= 7) {
        response += this.generateProactiveSuggestions()
      }

      // Adicionar resposta ao histórico
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        context: { ...this.systemData }
      })

      // Salvar contexto
      await this.saveConversationContext()

      return response

    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      return 'Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente? 😅'
    }
  }

  /**
   * Gerar sugestões proativas
   */
  private generateProactiveSuggestions(): string {
    let suggestions = '\n\n💡 **Sugestões:**\n\n'
    let hasSuggestions = false

    // Sugerir ações baseadas nos dados carregados
    if (this.systemData.inventory) {
      const lowStock = this.systemData.inventory.filter((i: any) => i.stock_status !== 'OK')
      if (lowStock.length > 0) {
        suggestions += `• Há ${lowStock.length} item(ns) com estoque baixo. Que tal fazer um pedido?\n`
        hasSuggestions = true
      }
    }

    if (this.systemData.serviceOrders) {
      const pendingOS = this.systemData.serviceOrders.filter((os: any) =>
        os.status === 'pending' || os.status === 'aberta'
      )
      if (pendingOS.length > 0) {
        suggestions += `• Você tem ${pendingOS.length} OS(s) pendente(s) aguardando início.\n`
        hasSuggestions = true
      }
    }

    if (this.systemData.finances) {
      const overdue = this.systemData.finances.filter((f: any) =>
        f.status === 'atrasado' || (f.status === 'pendente' && new Date(f.due_date) < new Date())
      )
      if (overdue.length > 0) {
        suggestions += `• Atenção: ${overdue.length} lançamento(s) atrasado(s)!\n`
        hasSuggestions = true
      }
    }

    if (this.systemData.agenda) {
      const today = this.systemData.agenda.filter((e: any) =>
        new Date(e.start_time).toDateString() === new Date().toDateString()
      )
      if (today.length > 0) {
        suggestions += `• Não esqueça: ${today.length} compromisso(s) hoje!\n`
        hasSuggestions = true
      }
    }

    return hasSuggestions ? suggestions : ''
  }

  /**
   * Obter saudação inicial
   */
  async getInitialGreeting(): Promise<string> {
    await this.loadPersonality()
    const greeting = this.getTimeBasedGreeting()

    // Carregar estatísticas para saudação contextual
    const { data: stats } = await supabase.rpc('thomaz_get_system_stats')

    let message = `${greeting}\n\n`
    message += `Sou o Thomaz, seu assistente inteligente! 🤖✨\n\n`

    if (stats) {
      message += `Aqui está um resumo rápido:\n\n`

      if (stats.oss_abertas > 0) {
        message += `• ${stats.oss_abertas} OS(s) em andamento\n`
      }

      if (stats.estoque_baixo > 0) {
        message += `• ⚠️ ${stats.estoque_baixo} item(ns) com estoque baixo\n`
      }

      if (stats.compromissos_hoje > 0) {
        message += `• 📅 ${stats.compromissos_hoje} compromisso(s) hoje\n`
      }

      message += `\n`
    }

    message += `Como posso ajudar você hoje?`

    return message
  }
}

export default ThomazSuperService
