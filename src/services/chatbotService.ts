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
  async createConversation(title: string = 'Nova Conversa'): Promise<ChatConversation | null> {
    const { data, error } = await supabase
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
    const lowerMessage = userMessage.toLowerCase().trim()

    const { data: intents } = await supabase
      .from('chat_intents')
      .select('*')
      .eq('active', true)

    if (!intents) {
      return { text: 'Desculpe, não consegui processar sua mensagem.' }
    }

    const matchedIntent = this.findMatchingIntent(lowerMessage, intents)

    if (matchedIntent) {
      return await this.executeIntent(matchedIntent, userMessage)
    }

    return this.getDefaultResponse(lowerMessage)
  }

  private findMatchingIntent(message: string, intents: ChatIntent[]): ChatIntent | null {
    for (const intent of intents) {
      for (const keyword of intent.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          return intent
        }
      }
    }
    return null
  }

  private async executeIntent(intent: ChatIntent, userMessage: string): Promise<{ text: string; metadata?: any }> {
    try {
      const param = this.extractParameter(userMessage, intent)
      let query = intent.query_template

      if (param) {
        query = query.replace('{param}', param)
      }

      const { data, error } = await supabase.rpc('execute_chatbot_query', { query_text: query })

      if (error) {
        console.error('Erro ao executar query:', error)
        const { data: fallbackData } = await this.executeFallbackQuery(intent.intent_name)
        return this.formatResponse(intent, fallbackData || [])
      }

      return this.formatResponse(intent, data || [])
    } catch (error) {
      console.error('Erro no processamento:', error)
      return { text: 'Desculpe, ocorreu um erro ao processar sua solicitação.' }
    }
  }

  private async executeFallbackQuery(intentName: string) {
    switch (intentName) {
      case 'listar_os_abertas':
        return await supabase
          .from('service_orders')
          .select('id, order_number, customer_name, status, total_value')
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(10)

      case 'estoque_baixo':
        const { data: materialsData } = await supabase
          .from('materials')
          .select('name, quantity, min_quantity, unit, active')
          .eq('active', true)
          .order('quantity', { ascending: true })

        const lowStock = (materialsData || []).filter(m => m.quantity <= m.min_quantity).slice(0, 10)
        return { data: lowStock }

      case 'agenda_hoje':
        const today = new Date().toISOString().split('T')[0]
        return await supabase
          .from('agenda_events')
          .select('title, start_time, end_time, location')
          .gte('start_time', `${today}T00:00:00`)
          .lt('start_time', `${today}T23:59:59`)
          .order('start_time', { ascending: true })

      case 'ultimas_vendas':
        return await supabase
          .from('service_orders')
          .select('order_number, customer_name, total_value, completed_at')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(10)

      case 'materiais_mais_usados':
        return await supabase
          .from('materials')
          .select('name, unit, total_quantity_purchased')
          .gt('total_quantity_purchased', 0)
          .order('total_quantity_purchased', { ascending: false })
          .limit(10)

      default:
        return { data: [] }
    }
  }

  private extractParameter(message: string, intent: ChatIntent): string {
    const words = message.split(' ')

    for (const keyword of intent.keywords) {
      const keywordWords = keyword.toLowerCase().split(' ')
      const index = message.toLowerCase().indexOf(keyword.toLowerCase())

      if (index !== -1) {
        const afterKeyword = message.substring(index + keyword.length).trim()
        if (afterKeyword) {
          return afterKeyword.split(' ')[0]
        }
      }
    }

    const commonWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'para', 'com']
    const potentialParams = words.filter(w =>
      w.length > 2 && !commonWords.includes(w.toLowerCase())
    )

    return potentialParams[potentialParams.length - 1] || ''
  }

  private formatResponse(intent: ChatIntent, data: any[]): { text: string; metadata: any } {
    const count = data.length
    let responseText = intent.response_template.replace('{count}', count.toString())

    if (count === 0) {
      return {
        text: this.getEmptyResponse(intent.intent_name),
        metadata: { intent: intent.intent_name, count: 0 }
      }
    }

    responseText += '\n\n'

    switch (intent.intent_name) {
      case 'listar_os_abertas':
        responseText += data.map(os =>
          `📋 OS ${os.order_number} - ${os.customer_name}\n   Status: ${this.translateStatus(os.status)} | Valor: R$ ${this.formatMoney(os.total_value)}`
        ).join('\n\n')
        break

      case 'estoque_baixo':
        responseText += data.map(mat =>
          `⚠️ ${mat.name}\n   Estoque: ${mat.quantity} ${mat.unit} (Mínimo: ${mat.min_quantity} ${mat.unit})`
        ).join('\n\n')
        break

      case 'agenda_hoje':
        responseText += data.map(event =>
          `📅 ${event.title}\n   Horário: ${this.formatTime(event.start_time)} - ${this.formatTime(event.end_time)}\n   Local: ${event.location || 'Não informado'}`
        ).join('\n\n')
        break

      case 'ultimas_vendas':
        responseText += data.map(os =>
          `✅ OS ${os.order_number} - ${os.customer_name}\n   Valor: R$ ${this.formatMoney(os.total_value)} | Finalizado: ${this.formatDate(os.completed_at)}`
        ).join('\n\n')
        break

      case 'materiais_mais_usados':
        responseText += data.map((mat, idx) =>
          `${idx + 1}. ${mat.name} - ${mat.total_quantity_purchased} ${mat.unit} utilizados`
        ).join('\n')
        break

      case 'buscar_cliente':
        responseText += data.map(client =>
          `👤 ${client.name}\n   📧 ${client.email || 'Sem email'}\n   📱 ${client.phone || 'Sem telefone'}\n   📍 ${client.city || 'Sem cidade'}`
        ).join('\n\n')
        break

      case 'resumo_financeiro':
        const total = data.reduce((sum, entry) => sum + parseFloat(entry.total || 0), 0)
        responseText += data.map(entry =>
          `💰 ${this.translateStatus(entry.status)}: R$ ${this.formatMoney(entry.total)} (${entry.count} lançamentos)`
        ).join('\n')
        responseText += `\n\n📊 Total: R$ ${this.formatMoney(total)}`
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
      'listar_os_abertas': 'Não há ordens de serviço abertas no momento. 🎉',
      'estoque_baixo': 'Todos os materiais estão com estoque adequado! ✅',
      'agenda_hoje': 'Você não tem compromissos agendados para hoje. 📅',
      'ultimas_vendas': 'Ainda não há vendas finalizadas. 💼',
      'materiais_mais_usados': 'Ainda não há dados sobre materiais utilizados. 📦',
      'buscar_cliente': 'Não encontrei clientes com esse critério. 🔍',
      'resumo_financeiro': 'Não há lançamentos financeiros no período. 💰'
    }

    return responses[intentName] || 'Não encontrei resultados para sua busca.'
  }

  private getDefaultResponse(message: string): { text: string; metadata?: any } {
    if (message.includes('olá') || message.includes('oi')) {
      return { text: '👋 Olá! Como posso ajudar você hoje?\n\nVocê pode me perguntar sobre:\n• Ordens de serviço abertas\n• Estoque de materiais\n• Agenda do dia\n• Informações de clientes\n• Resumo financeiro\n• Últimas vendas' }
    }

    if (message.includes('ajuda') || message.includes('help')) {
      return {
        text: '🤖 Posso ajudar você com:\n\n' +
          '📋 Ordens de Serviço\n' +
          '   • "OS abertas"\n' +
          '   • "Últimas vendas"\n\n' +
          '📦 Estoque\n' +
          '   • "Estoque baixo"\n' +
          '   • "Materiais mais usados"\n\n' +
          '👥 Clientes\n' +
          '   • "Buscar cliente [nome]"\n\n' +
          '📅 Agenda\n' +
          '   • "Agenda hoje"\n\n' +
          '💰 Financeiro\n' +
          '   • "Resumo financeiro"'
      }
    }

    return {
      text: 'Desculpe, não entendi sua pergunta. Digite "ajuda" para ver o que posso fazer! 🤔'
    }
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'paid': 'Pago',
      'overdue': 'Vencido'
    }
    return translations[status] || status
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
