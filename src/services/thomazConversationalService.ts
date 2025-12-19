import { supabase } from '../lib/supabase'

export interface ConversationalResponse {
  message: string
  needsClarification: boolean
  suggestedQuestions?: string[]
  tone: string
  contextUpdated: boolean
}

class ThomazConversationalService {
  private conversationMemory: Map<string, any> = new Map()

  async chat(
    userMessage: string,
    sessionId: string,
    userId?: string
  ): Promise<ConversationalResponse> {
    try {
      console.log('💬 Thomaz Conversational: Processing...', { userMessage, sessionId })

      const context = this.conversationMemory.get(sessionId) || {}

      const { data: intentData, error: intentError } = await supabase
        .rpc('thomaz_detect_intent_advanced', {
          text_input: userMessage,
          context_data: context
        })

      if (intentError) {
        console.error('Error detecting intent:', intentError)
        return this.generateFallbackResponse(userMessage)
      }

      console.log('🎯 Intent detected:', intentData)

      const response = await this.generateNaturalResponse(
        userMessage,
        intentData,
        context,
        sessionId
      )

      await this.updateContext(sessionId, userId, userMessage, intentData)

      return response

    } catch (error) {
      console.error('Error in conversational service:', error)
      return this.generateFallbackResponse(userMessage)
    }
  }

  private async generateNaturalResponse(
    userMessage: string,
    intentData: any,
    context: any,
    sessionId: string
  ): Promise<ConversationalResponse> {
    const intent = intentData.intent
    const sentiment = intentData.sentiment?.sentiment || 'neutral'
    const tone = intentData.tone || 'professional'
    const entities = intentData.entities?.entities || []

    console.log('🎨 Generating response for intent:', intent, 'tone:', tone)

    switch (intent) {
      case 'greeting':
        return this.handleGreeting(sentiment)

      case 'thanks':
        return this.handleThanks()

      case 'goodbye':
        return this.handleGoodbye()

      case 'system_capabilities':
        return this.handleCapabilitiesQuery()

      case 'help_request':
        return this.handleHelpRequest(userMessage)

      case 'inventory_query':
        return await this.handleInventoryQuery(userMessage, entities)

      case 'financial_query':
        return await this.handleFinancialQuery(userMessage, entities)

      case 'service_order_query':
        return await this.handleServiceOrderQuery(userMessage, entities)

      case 'customer_query':
        return await this.handleCustomerQuery(userMessage, entities)

      case 'open_question':
        return await this.handleOpenQuestion(userMessage, context)

      case 'issue_report':
        return this.handleIssueReport(userMessage)

      case 'uncertainty':
        return this.handleUncertainty(userMessage)

      default:
        return await this.handleConversation(userMessage, context)
    }
  }

  private handleGreeting(sentiment: string): ConversationalResponse {
    const greetings = [
      'Olá! 👋 Como posso ajudar você hoje?',
      'Oi! Estou aqui para facilitar sua gestão. O que você precisa saber?',
      'E aí! Vamos ver como seu negócio está indo?',
      'Hey! Pronto para analisar alguns dados interessantes?'
    ]

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]

    return {
      message: randomGreeting,
      needsClarification: false,
      suggestedQuestions: [
        'Me mostre um resumo do negócio',
        'Como está o estoque?',
        'Qual a situação financeira?',
        'Quantas OS tenho pendentes?'
      ],
      tone: 'friendly',
      contextUpdated: true
    }
  }

  private handleThanks(): ConversationalResponse {
    const responses = [
      'Por nada! 😊 Fico feliz em ajudar! Se precisar de mais alguma coisa, é só falar.',
      'Disponha! Estou aqui para isso! Qualquer outra dúvida, pode me chamar.',
      'Que isso! É sempre um prazer ajudar! Precisa de mais algo?',
      'Sempre às ordens! 👍 Quer saber mais alguma coisa?'
    ]

    return {
      message: responses[Math.floor(Math.random() * responses.length)],
      needsClarification: false,
      tone: 'warm',
      contextUpdated: true
    }
  }

  private handleGoodbye(): ConversationalResponse {
    const goodbyes = [
      'Até logo! 👋 Estarei aqui sempre que precisar!',
      'Tchau! Foi ótimo ajudar você hoje! Até a próxima!',
      'Falou! Qualquer coisa, pode me chamar! 😊',
      'Até mais! Bom trabalho e sucesso nos negócios! 🚀'
    ]

    return {
      message: goodbyes[Math.floor(Math.random() * goodbyes.length)],
      needsClarification: false,
      tone: 'friendly',
      contextUpdated: true
    }
  }

  private handleCapabilitiesQuery(): ConversationalResponse {
    return {
      message: `Opa! Deixa eu te contar o que eu faço! 🤓

Sou seu assistente inteligente de gestão e posso te ajudar com:

✅ **Analisar dados em tempo real**
   - Estoque, financeiro, ordens de serviço e clientes

✅ **Identificar problemas antes que eles cresçam**
   - Itens críticos, contas vencidas, OS atrasadas

✅ **Dar insights e recomendações práticas**
   - Não só números, mas o que eles significam

✅ **Conversar naturalmente sobre seu negócio**
   - Pode perguntar do jeito que você quiser

✅ **Gerar relatórios detalhados**
   - Com análises e ações recomendadas

Quanto mais você conversa comigo, melhor eu te entendo! Então, pode perguntar qualquer coisa sobre seu negócio. Vamos lá, o que você quer saber primeiro?`,
      needsClarification: false,
      suggestedQuestions: [
        'Me dá um panorama geral do negócio',
        'O que precisa da minha atenção agora?'
      ],
      tone: 'enthusiastic',
      contextUpdated: true
    }
  }

  private handleHelpRequest(message: string): ConversationalResponse {
    return {
      message: `Claro! Estou aqui para ajudar! 🤝

Posso te auxiliar com várias coisas:

📦 **Estoque e Materiais**
   - Ver situação, itens críticos, sugestões de compra

💰 **Financeiro**
   - Receitas, despesas, fluxo de caixa, contas a pagar/receber

🔧 **Ordens de Serviço**
   - Status, performance, OS pendentes

👥 **Clientes**
   - Análise de base, top clientes, inativos

📊 **Relatórios e Análises**
   - Qualquer tipo de análise personalizada

Sobre qual dessas áreas você precisa de ajuda? Ou tem algo mais específico em mente?`,
      needsClarification: true,
      suggestedQuestions: [
        'Quero ver o estoque',
        'Me mostra a situação financeira',
        'Como estão as ordens de serviço?'
      ],
      tone: 'supportive',
      contextUpdated: true
    }
  }

  private async handleInventoryQuery(message: string, entities: any[]): Promise<ConversationalResponse> {
    try {
      const { data, error } = await supabase.rpc('thomaz_analyze_inventory')

      if (error || !data) {
        return {
          message: 'Hmm, tive um problema ao acessar os dados do estoque. Pode tentar de novo?',
          needsClarification: false,
          tone: 'apologetic',
          contextUpdated: false
        }
      }

      const resumo = data.resumo
      const analise = data.analise
      const itensCriticos = data.itens_criticos || []

      let response = `Deixa eu te contar sobre seu estoque! 📦\n\n`

      if (resumo.itens_zerados > 0 || resumo.itens_criticos > 5) {
        response += `**Olha, tem algumas coisas que precisam da sua atenção:**\n\n`
      } else {
        response += `**Boa notícia! Seu estoque está razoavelmente saudável:**\n\n`
      }

      response += `📊 **Números Gerais:**\n`
      response += `- Você tem ${resumo.total_itens} itens no total\n`
      response += `- Valor total em estoque: R$ ${parseFloat(resumo.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      response += `- Saúde geral: ${analise.saude_percentual}%\n\n`

      if (resumo.itens_zerados > 0) {
        response += `🚨 **Atenção:** ${resumo.itens_zerados} itens estão **ZERADOS** (sem estoque)\n`
      }
      if (resumo.itens_criticos > 0) {
        response += `⚠️ ${resumo.itens_criticos} itens estão **CRÍTICOS** (abaixo do mínimo)\n`
      }
      if (resumo.itens_baixos > 0) {
        response += `🟡 ${resumo.itens_baixos} itens estão **BAIXOS** (próximo do mínimo)\n`
      }
      if (resumo.itens_ok > 0) {
        response += `✅ ${resumo.itens_ok} itens estão **OK**\n`
      }

      if (itensCriticos.length > 0) {
        response += `\n**Itens que precisam de atenção agora:**\n\n`
        itensCriticos.slice(0, 5).forEach((item: any, idx: number) => {
          response += `${idx + 1}. **${item.name}** - ${item.status}\n`
          response += `   Quantidade: ${item.quantity} (Mínimo: ${item.min_quantity})\n\n`
        })

        if (itensCriticos.length > 5) {
          response += `_...e mais ${itensCriticos.length - 5} itens_\n`
        }
      }

      const suggestions = []
      if (resumo.itens_zerados > 0) {
        suggestions.push('Gerar lista de compras urgentes')
      }
      if (resumo.itens_criticos > 0) {
        suggestions.push('Ver todos os itens críticos')
      }
      suggestions.push('Ver análise por categoria')

      return {
        message: response,
        needsClarification: false,
        suggestedQuestions: suggestions,
        tone: resumo.itens_zerados > 5 ? 'urgent' : 'professional',
        contextUpdated: true
      }

    } catch (error) {
      console.error('Error in inventory query:', error)
      return {
        message: 'Ops! Tive um problema ao buscar os dados do estoque. Vamos tentar de novo?',
        needsClarification: false,
        tone: 'apologetic',
        contextUpdated: false
      }
    }
  }

  private async handleFinancialQuery(message: string, entities: any[]): Promise<ConversationalResponse> {
    try {
      const { data, error } = await supabase.rpc('thomaz_analyze_financials', { periodo_dias: 30 })

      if (error || !data) {
        return {
          message: 'Hmm, não consegui acessar os dados financeiros agora. Pode tentar novamente?',
          needsClarification: false,
          tone: 'apologetic',
          contextUpdated: false
        }
      }

      const resumo = data.resumo
      const indicadores = data.indicadores
      const alertas = data.alertas || []

      let response = `Vamos falar sobre seu financeiro! 💰\n\n`

      const saldo = indicadores.saldo_periodo
      if (saldo > 0) {
        response += `**Boa notícia!** Você está com saldo positivo de R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no último mês! 📈\n\n`
      } else {
        response += `**Atenção!** Seu saldo está negativo em R$ ${Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no último mês. Vamos analisar onde melhorar?\n\n`
      }

      response += `📊 **Resumo dos últimos 30 dias:**\n`
      response += `- Receitas: R$ ${parseFloat(resumo.total_receitas_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      response += `- Despesas: R$ ${parseFloat(resumo.total_despesas_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
      response += `- Margem: ${indicadores.margem_percentual}%\n`

      if (indicadores.margem_percentual < 20) {
        response += `   _(Margem abaixo do ideal - recomendo revisar custos)_\n`
      } else if (indicadores.margem_percentual > 30) {
        response += `   _(Margem saudável! Continue assim!)_\n`
      }

      response += `\n`

      if (resumo.lancamentos_vencidos > 0) {
        response += `🚨 **Atenção:** Você tem ${resumo.lancamentos_vencidos} lançamentos vencidos no valor de R$ ${parseFloat(resumo.valor_vencido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
      }

      if (resumo.receitas_pendentes > 0) {
        response += `💵 Você tem R$ ${parseFloat(resumo.receitas_pendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber\n`
      }
      if (resumo.despesas_pendentes > 0) {
        response += `💳 E R$ ${parseFloat(resumo.despesas_pendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar\n\n`
      }

      if (alertas && alertas.length > 0) {
        response += `**O que precisa de atenção:**\n`
        alertas.forEach((alerta: any) => {
          const icon = alerta.tipo === 'CRÍTICO' ? '🚨' : '⚠️'
          response += `${icon} ${alerta.mensagem}\n`
        })
      }

      const suggestions = []
      if (resumo.lancamentos_vencidos > 0) {
        suggestions.push('Ver lançamentos vencidos')
      }
      if (indicadores.margem_percentual < 20) {
        suggestions.push('Dicas para melhorar margem')
      }
      suggestions.push('Ver fluxo de caixa detalhado')

      return {
        message: response,
        needsClarification: false,
        suggestedQuestions: suggestions,
        tone: resumo.lancamentos_vencidos > 5 ? 'urgent' : 'professional',
        contextUpdated: true
      }

    } catch (error) {
      console.error('Error in financial query:', error)
      return {
        message: 'Ops! Problema ao buscar dados financeiros. Vamos tentar de novo?',
        needsClarification: false,
        tone: 'apologetic',
        contextUpdated: false
      }
    }
  }

  private async handleServiceOrderQuery(message: string, entities: any[]): Promise<ConversationalResponse> {
    try {
      const { data, error } = await supabase.rpc('thomaz_analyze_service_orders', { periodo_dias: 30 })

      if (error || !data) {
        return {
          message: 'Hmm, não consegui acessar as ordens de serviço. Tenta de novo?',
          needsClarification: false,
          tone: 'apologetic',
          contextUpdated: false
        }
      }

      const resumo = data.resumo
      const indicadores = data.indicadores

      let response = `Vamos ver suas ordens de serviço! 🔧\n\n`

      if (resumo.total_os === 0) {
        response += `Você ainda não tem ordens de serviço nos últimos 30 dias. Quer criar uma nova?\n`
      } else {
        response += `📊 **Panorama dos últimos 30 dias:**\n`
        response += `- Total de OS: ${resumo.total_os}\n`

        if (resumo.pendentes > 0) {
          response += `- ⏳ Pendentes: ${resumo.pendentes}\n`
        }
        if (resumo.em_andamento > 0) {
          response += `- 🔄 Em andamento: ${resumo.em_andamento}\n`
        }
        if (resumo.concluidas > 0) {
          response += `- ✅ Concluídas: ${resumo.concluidas}\n`
        }

        response += `\n💰 **Valores:**\n`
        response += `- Ticket médio: R$ ${parseFloat(indicadores.ticket_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        response += `- Faturamento: R$ ${parseFloat(resumo.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        response += `- Margem média: ${indicadores.margem_media}%\n`

        response += `\n📈 **Performance:**\n`
        response += `- Taxa de conclusão: ${indicadores.taxa_conclusao}%\n`

        if (indicadores.taxa_conclusao < 75) {
          response += `   _(Abaixo do ideal - vamos ver onde está o gargalo?)_\n`
        } else if (indicadores.taxa_conclusao > 90) {
          response += `   _(Excelente! Seu time está voando!)_\n`
        }
      }

      const suggestions = []
      if (resumo.pendentes > 5) {
        suggestions.push('Ver OS pendentes')
      }
      if (indicadores.taxa_conclusao < 75) {
        suggestions.push('Análise de gargalos')
      }
      suggestions.push('Performance por técnico')

      return {
        message: response,
        needsClarification: false,
        suggestedQuestions: suggestions,
        tone: 'professional',
        contextUpdated: true
      }

    } catch (error) {
      console.error('Error in service order query:', error)
      return {
        message: 'Ops! Problema ao buscar as OS. Vamos tentar novamente?',
        needsClarification: false,
        tone: 'apologetic',
        contextUpdated: false
      }
    }
  }

  private async handleCustomerQuery(message: string, entities: any[]): Promise<ConversationalResponse> {
    try {
      const { data, error } = await supabase.rpc('thomaz_analyze_customers')

      if (error || !data) {
        return {
          message: 'Hmm, não consegui acessar os dados dos clientes. Pode tentar de novo?',
          needsClarification: false,
          tone: 'apologetic',
          contextUpdated: false
        }
      }

      const resumo = data.resumo
      const topClientes = data.top_clientes || []
      const indicadores = data.indicadores

      let response = `Vamos falar sobre seus clientes! 👥\n\n`

      response += `📊 **Visão Geral:**\n`
      response += `- Total de clientes: ${resumo.total_clientes}\n`
      response += `- Ativos: ${resumo.ativos} (${indicadores.clientes_ativos_percentual}%)\n`
      response += `- Inativos: ${resumo.inativos}\n`
      response += `- Ticket médio: R$ ${parseFloat(indicadores.ticket_medio_cliente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

      if (indicadores.clientes_inativos_90dias > 0) {
        response += `⚠️ **Atenção:** ${indicadores.clientes_inativos_90dias} clientes não compram há mais de 90 dias. Que tal uma campanha de reativação?\n\n`
      }

      if (topClientes.length > 0) {
        response += `🏆 **Seus Top 5 Clientes:**\n\n`
        topClientes.slice(0, 5).forEach((cliente: any, idx: number) => {
          response += `${idx + 1}. **${cliente.name}**\n`
          response += `   - ${cliente.total_os} ordens | R$ ${parseFloat(cliente.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        })
      }

      const suggestions = []
      if (indicadores.clientes_inativos_90dias > 0) {
        suggestions.push('Ver clientes inativos')
      }
      suggestions.push('Análise RFM completa')
      suggestions.push('Sugestões de fidelização')

      return {
        message: response,
        needsClarification: false,
        suggestedQuestions: suggestions,
        tone: 'professional',
        contextUpdated: true
      }

    } catch (error) {
      console.error('Error in customer query:', error)
      return {
        message: 'Ops! Problema ao buscar dados dos clientes. Vamos tentar de novo?',
        needsClarification: false,
        tone: 'apologetic',
        contextUpdated: false
      }
    }
  }

  private async handleOpenQuestion(message: string, context: any): Promise<ConversationalResponse> {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('como') && (lowerMessage.includes('melhorar') || lowerMessage.includes('aumentar'))) {
      return {
        message: `Ótima pergunta! Para te dar uma resposta precisa, preciso saber: você quer melhorar **estoque, financeiro, ordens de serviço** ou **relacionamento com clientes**?\n\nCada área tem estratégias específicas que posso te recomendar!`,
        needsClarification: true,
        suggestedQuestions: [
          'Melhorar estoque',
          'Melhorar financeiro',
          'Melhorar OS',
          'Melhorar relacionamento com clientes'
        ],
        tone: 'helpful',
        contextUpdated: true
      }
    }

    return {
      message: `Interessante! Pode me dar mais detalhes sobre o que você quer saber? Quanto mais específico, melhor posso te ajudar! 😊`,
      needsClarification: true,
      tone: 'curious',
      contextUpdated: true
    }
  }

  private handleIssueReport(message: string): ConversationalResponse {
    return {
      message: `Poxa, sinto muito que esteja tendo problemas! 😟

Vou te ajudar a resolver isso. Pode me contar mais detalhes:

- Onde exatamente está acontecendo o problema?
- O que você estava tentando fazer?
- Tem alguma mensagem de erro?

Com essas informações, posso te ajudar melhor!`,
      needsClarification: true,
      tone: 'empathetic',
      contextUpdated: true
    }
  }

  private handleUncertainty(message: string): ConversationalResponse {
    return {
      message: `Entendo! Quando temos dúvidas, é sempre bom analisar os dados, né? 🤔

Posso te ajudar de várias formas:

📊 Te mostrar dados atuais para te ajudar a decidir
💡 Dar sugestões baseadas nas melhores práticas
📈 Fazer projeções e cenários

O que seria mais útil para você agora?`,
      needsClarification: true,
      suggestedQuestions: [
        'Me mostre os dados',
        'Me dê sugestões',
        'Faça uma projeção'
      ],
      tone: 'supportive',
      contextUpdated: true
    }
  }

  private async handleConversation(message: string, context: any): Promise<ConversationalResponse> {
    return {
      message: `Entendi! Deixa eu ver o que posso fazer por você...

Você está falando sobre algo relacionado ao seu negócio? Posso te ajudar com:

- 📦 Estoque e materiais
- 💰 Finanças e pagamentos
- 🔧 Ordens de serviço
- 👥 Clientes

Ou é outra coisa? Pode me explicar um pouco mais?`,
      needsClarification: true,
      suggestedQuestions: [
        'Quero saber sobre estoque',
        'Quero ver o financeiro',
        'Me fale das OS'
      ],
      tone: 'curious',
      contextUpdated: true
    }
  }

  private generateFallbackResponse(message: string): ConversationalResponse {
    return {
      message: `Hmm, não tenho certeza se entendi direito. Pode reformular? Ou me dizer qual área você quer explorar: estoque, financeiro, OS ou clientes?`,
      needsClarification: true,
      suggestedQuestions: [
        'Ver estoque',
        'Ver financeiro',
        'Ver ordens de serviço',
        'Ver clientes'
      ],
      tone: 'apologetic',
      contextUpdated: false
    }
  }

  private async updateContext(
    sessionId: string,
    userId: string | undefined,
    userMessage: string,
    intentData: any
  ): Promise<void> {
    try {
      const currentContext = this.conversationMemory.get(sessionId) || {}

      const newContext = {
        ...currentContext,
        lastMessage: userMessage,
        lastIntent: intentData.intent,
        lastUpdate: new Date().toISOString(),
        messageCount: (currentContext.messageCount || 0) + 1
      }

      this.conversationMemory.set(sessionId, newContext)

      await supabase
        .from('thomaz_conversation_context')
        .upsert({
          session_id: sessionId,
          user_id: userId,
          context_data: newContext,
          last_interaction_at: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        })

      console.log('✅ Context updated successfully')
    } catch (error) {
      console.error('Error updating context:', error)
    }
  }
}

export default new ThomazConversationalService()
