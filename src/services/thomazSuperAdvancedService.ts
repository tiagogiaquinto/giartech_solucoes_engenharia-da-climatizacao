import { supabase } from '../lib/supabase'
import { ThomazReasoningEngine, AnalysisContext, ReasoningResult } from './thomazReasoningEngine'
import { buildSystemPrompt, ThomazContext } from '../config/thomazSystemPrompt'

export interface ThomazConversationResult {
  response: string
  reasoning?: ReasoningResult
  suggestedActions?: SuggestedAction[]
  dataVisualization?: any
  confidence: number
  conversationId?: string
}

export interface SuggestedAction {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
  estimatedTime?: string
  autoExecutable?: boolean
  sqlQuery?: string
}

export interface ProactiveInsight {
  id: string
  type: 'alert' | 'opportunity' | 'recommendation' | 'trend'
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  data: any
  actionable: boolean
  suggestedAction?: string
}

class ThomazSuperAdvancedService {
  private reasoningEngine: ThomazReasoningEngine

  constructor() {
    this.reasoningEngine = new ThomazReasoningEngine()
  }

  async sendMessage(
    message: string,
    userId?: string,
    conversationId?: string
  ): Promise<ThomazConversationResult> {
    try {
      console.log('🧠 Thomaz Ultra: Processing message:', message)

      const userContext = await this.buildUserContext(userId)

      const detectedIntent = this.detectIntent(message)
      console.log('🎯 Detected intent:', detectedIntent)

      let enhancedResponse = ''
      let dataVisualization = null

      if (detectedIntent.requiresAnalysis) {
        const analysisResult = await this.performDeepAnalysis(detectedIntent.type, message)
        enhancedResponse = this.formatAnalysisResponse(analysisResult, detectedIntent.type)
        dataVisualization = analysisResult
      } else {
        const analysisContext: AnalysisContext = {
          query: message,
          userId,
          userRole: userContext.userRole || 'user',
          companyId: userContext.companyId,
          conversationHistory: await this.getConversationHistory(conversationId)
        }

        const reasoning = await this.reasoningEngine.reason(message, analysisContext)
        enhancedResponse = reasoning.result
      }

      const suggestedActions = this.generateContextualActions(detectedIntent.type, message)

      await this.saveConversation(userId, message, enhancedResponse, conversationId)

      const proactiveInsights = await this.generateProactiveInsights(userContext)

      if (proactiveInsights.length > 0) {
        enhancedResponse += '\n\n**🔔 Insights Proativos:**\n'
        proactiveInsights.slice(0, 3).forEach(insight => {
          const icon = insight.type === 'alert' ? '🚨' : insight.type === 'opportunity' ? '💡' : '📊'
          enhancedResponse += `${icon} ${insight.title}: ${insight.description}\n`
        })
      }

      return {
        response: enhancedResponse,
        suggestedActions,
        dataVisualization,
        confidence: detectedIntent.confidence,
        conversationId
      }
    } catch (error) {
      console.error('❌ Error in Thomaz Ultra:', error)
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        confidence: 0,
        conversationId
      }
    }
  }

  private detectIntent(message: string): { type: string; requiresAnalysis: boolean; confidence: number } {
    const lowerMessage = message.toLowerCase()

    const intents = [
      {
        keywords: ['estoque', 'inventario', 'materiais', 'produtos', 'quantidade', 'repor'],
        type: 'inventory',
        requiresAnalysis: true
      },
      {
        keywords: ['financeiro', 'financeira', 'receita', 'despesa', 'pagamento', 'saldo', 'fluxo de caixa'],
        type: 'financial',
        requiresAnalysis: true
      },
      {
        keywords: ['ordem', 'os', 'serviço', 'servico', 'atendimento', 'tecnico'],
        type: 'service_orders',
        requiresAnalysis: true
      },
      {
        keywords: ['cliente', 'customer', 'consumidor', 'comprador'],
        type: 'customers',
        requiresAnalysis: true
      },
      {
        keywords: ['sistema', 'geral', 'tudo', 'overview', 'resumo', 'dashboard'],
        type: 'system',
        requiresAnalysis: true
      }
    ]

    for (const intent of intents) {
      const matchCount = intent.keywords.filter(kw => lowerMessage.includes(kw)).length
      if (matchCount > 0) {
        return {
          type: intent.type,
          requiresAnalysis: intent.requiresAnalysis,
          confidence: Math.min(0.9, matchCount * 0.3)
        }
      }
    }

    return { type: 'general', requiresAnalysis: false, confidence: 0.5 }
  }

  private async performDeepAnalysis(type: string, query: string): Promise<any> {
    console.log(`🔍 Performing deep analysis for: ${type}`)

    try {
      switch (type) {
        case 'inventory':
          return await this.analyzeInventoryAdvanced()

        case 'financial':
          return await this.analyzeFinancialAdvanced()

        case 'service_orders':
          return await this.analyzeServiceOrdersAdvanced()

        case 'customers':
          return await this.analyzeCustomersAdvanced()

        case 'system':
          return await this.analyzeSystemComplete()

        default:
          return null
      }
    } catch (error) {
      console.error('Error in deep analysis:', error)
      return null
    }
  }

  private async analyzeInventoryAdvanced(): Promise<any> {
    const { data, error } = await supabase.rpc('thomaz_analyze_inventory')
    if (error) {
      console.error('Error analyzing inventory:', error)
      return null
    }
    return data
  }

  private async analyzeFinancialAdvanced(): Promise<any> {
    const { data, error } = await supabase.rpc('thomaz_analyze_financials', { periodo_dias: 30 })
    if (error) {
      console.error('Error analyzing financials:', error)
      return null
    }
    return data
  }

  private async analyzeServiceOrdersAdvanced(): Promise<any> {
    const { data, error } = await supabase.rpc('thomaz_analyze_service_orders', { periodo_dias: 30 })
    if (error) {
      console.error('Error analyzing service orders:', error)
      return null
    }
    return data
  }

  private async analyzeCustomersAdvanced(): Promise<any> {
    const { data, error } = await supabase.rpc('thomaz_analyze_customers')
    if (error) {
      console.error('Error analyzing customers:', error)
      return null
    }
    return data
  }

  private async analyzeSystemComplete(): Promise<any> {
    const { data, error } = await supabase.rpc('thomaz_analyze_system')
    if (error) {
      console.error('Error analyzing system:', error)
      return null
    }
    return data
  }

  private formatAnalysisResponse(data: any, type: string): string {
    if (!data) {
      return 'Desculpe, não consegui obter os dados necessários para esta análise.'
    }

    switch (type) {
      case 'inventory':
        return this.formatInventoryAnalysis(data)

      case 'financial':
        return this.formatFinancialAnalysis(data)

      case 'service_orders':
        return this.formatServiceOrdersAnalysis(data)

      case 'customers':
        return this.formatCustomersAnalysis(data)

      case 'system':
        return this.formatSystemAnalysis(data)

      default:
        return JSON.stringify(data, null, 2)
    }
  }

  private formatInventoryAnalysis(data: any): string {
    const { resumo, itens_criticos, por_categoria, analise } = data

    let response = `## 📊 Análise Completa do Estoque\n\n`
    response += `### **Resumo Geral**\n`
    response += `- **Total de itens:** ${resumo.total_itens}\n`
    response += `- **Valor total:** R$ ${parseFloat(resumo.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Custo total:** R$ ${parseFloat(resumo.custo_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Quantidade média por item:** ${resumo.quantidade_media}\n\n`

    response += `### 🚨 **Status do Estoque**\n`
    response += `- ❌ **${resumo.itens_zerados} itens ZERADOS** (sem estoque)\n`
    response += `- 🔴 **${resumo.itens_criticos} itens CRÍTICOS** (abaixo do mínimo)\n`
    response += `- 🟡 **${resumo.itens_baixos} itens BAIXOS** (próximo do mínimo)\n`
    response += `- ✅ **${resumo.itens_ok} itens OK** (estoque saudável)\n\n`

    response += `### 📈 **Análise**\n`
    response += `**Situação:** ${analise.situacao_geral}\n`
    response += `**Saúde do estoque:** ${analise.saude_percentual}%\n\n`

    if (itens_criticos && itens_criticos.length > 0) {
      response += `### ⚠️ **Itens que precisam atenção imediata:**\n\n`
      itens_criticos.slice(0, 10).forEach((item: any, idx: number) => {
        response += `${idx + 1}. **${item.name}**\n`
        response += `   - Status: ${item.status}\n`
        response += `   - Quantidade: ${item.quantity} (Mínimo: ${item.min_quantity})\n`
        response += `   - Valor: R$ ${parseFloat(item.unit_price).toFixed(2)}\n`
        response += `   - Categoria: ${item.category || 'N/A'}\n\n`
      })
    }

    if (analise.acoes_recomendadas && analise.acoes_recomendadas.length > 0) {
      response += `### 💡 **Ações Recomendadas:**\n\n`
      analise.acoes_recomendadas.forEach((acao: string, idx: number) => {
        response += `${idx + 1}. ${acao}\n`
      })
    }

    return response
  }

  private formatFinancialAnalysis(data: any): string {
    const { periodo, resumo, indicadores, alertas } = data

    let response = `## 💰 Análise Financeira Completa\n\n`
    response += `**Período:** ${periodo.inicio} até ${periodo.fim} (${periodo.dias} dias)\n\n`

    response += `### **Resumo Geral**\n`
    response += `- **Total de lançamentos:** ${resumo.total_lancamentos}\n`
    response += `- **Receitas:** ${resumo.total_receitas} lançamentos - R$ ${parseFloat(resumo.total_receitas_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Despesas:** ${resumo.total_despesas} lançamentos - R$ ${parseFloat(resumo.total_despesas_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Saldo do período:** R$ ${indicadores.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    response += `### 📊 **Indicadores**\n`
    response += `- **Margem:** ${indicadores.margem_percentual}%\n`
    response += `- **Saldo realizado:** R$ ${indicadores.saldo_realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Taxa de inadimplência:** ${indicadores.taxa_inadimplencia}%\n\n`

    response += `### 💵 **Situação de Pagamentos**\n`
    response += `- **Receitas pagas:** R$ ${parseFloat(resumo.receitas_pagas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Despesas pagas:** R$ ${parseFloat(resumo.despesas_pagas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Receitas pendentes:** R$ ${parseFloat(resumo.receitas_pendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Despesas pendentes:** R$ ${parseFloat(resumo.despesas_pendentes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    if (resumo.lancamentos_vencidos > 0) {
      response += `### 🚨 **Atenção**\n`
      response += `- **${resumo.lancamentos_vencidos} lançamentos vencidos** no valor de R$ ${parseFloat(resumo.valor_vencido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`
    }

    if (alertas && alertas.length > 0) {
      response += `### ⚠️ **Alertas**\n\n`
      alertas.forEach((alerta: any, idx: number) => {
        const icon = alerta.tipo === 'CRÍTICO' ? '🚨' : alerta.tipo === 'ATENÇÃO' ? '⚠️' : 'ℹ️'
        response += `${icon} ${alerta.mensagem}\n`
      })
    }

    return response
  }

  private formatServiceOrdersAnalysis(data: any): string {
    const { periodo, resumo, indicadores, alertas } = data

    let response = `## 🔧 Análise de Ordens de Serviço\n\n`
    response += `**Período:** ${periodo.inicio} até ${periodo.fim} (${periodo.dias} dias)\n\n`

    response += `### **Resumo Geral**\n`
    response += `- **Total de OS:** ${resumo.total_os}\n`
    response += `- **Pendentes:** ${resumo.pendentes}\n`
    response += `- **Em andamento:** ${resumo.em_andamento}\n`
    response += `- **Concluídas:** ${resumo.concluidas}\n`
    response += `- **Canceladas:** ${resumo.canceladas}\n\n`

    response += `### 💰 **Valores**\n`
    response += `- **Valor médio por OS:** R$ ${parseFloat(resumo.valor_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Valor total:** R$ ${parseFloat(resumo.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Faturamento (OS concluídas):** R$ ${parseFloat(resumo.faturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`

    response += `### 📊 **Indicadores de Performance**\n`
    response += `- **Taxa de conclusão:** ${indicadores.taxa_conclusao}%\n`
    response += `- **Ticket médio:** R$ ${parseFloat(indicadores.ticket_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Margem média:** ${indicadores.margem_media}%\n\n`

    if (alertas && alertas.length > 0) {
      response += `### ⚠️ **Alertas**\n\n`
      alertas.forEach((alerta: any) => {
        const icon = alerta.tipo === 'ATENÇÃO' ? '⚠️' : 'ℹ️'
        response += `${icon} ${alerta.mensagem}\n`
      })
    }

    return response
  }

  private formatCustomersAnalysis(data: any): string {
    const { resumo, top_clientes, indicadores, alertas } = data

    let response = `## 👥 Análise de Clientes\n\n`

    response += `### **Resumo Geral**\n`
    response += `- **Total de clientes:** ${resumo.total_clientes}\n`
    response += `- **Pessoas Físicas:** ${resumo.pessoas_fisicas}\n`
    response += `- **Pessoas Jurídicas:** ${resumo.pessoas_juridicas}\n`
    response += `- **Ativos:** ${resumo.ativos}\n`
    response += `- **Inativos:** ${resumo.inativos}\n\n`

    response += `### 📊 **Indicadores**\n`
    response += `- **Clientes ativos:** ${indicadores.clientes_ativos_percentual}%\n`
    response += `- **Ticket médio por cliente:** R$ ${parseFloat(indicadores.ticket_medio_cliente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    response += `- **Clientes inativos (>90 dias):** ${indicadores.clientes_inativos_90dias}\n\n`

    if (top_clientes && top_clientes.length > 0) {
      response += `### 🏆 **Top 10 Clientes**\n\n`
      top_clientes.slice(0, 10).forEach((cliente: any, idx: number) => {
        response += `${idx + 1}. **${cliente.name}**\n`
        response += `   - Total de OS: ${cliente.total_os}\n`
        response += `   - Valor total: R$ ${parseFloat(cliente.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
        if (cliente.ultima_compra) {
          response += `   - Última compra: ${new Date(cliente.ultima_compra).toLocaleDateString('pt-BR')}\n`
        }
        response += `\n`
      })
    }

    if (alertas && alertas.length > 0) {
      response += `### ⚠️ **Alertas**\n\n`
      alertas.forEach((alerta: any) => {
        response += `⚠️ ${alerta.mensagem}\n`
      })
    }

    return response
  }

  private formatSystemAnalysis(data: any): string {
    let response = `## 🎯 Análise Completa do Sistema\n\n`

    response += `### 📦 **Estoque**\n`
    response += this.formatInventoryAnalysis(data.estoque)

    response += `\n---\n\n### 💰 **Financeiro**\n`
    response += this.formatFinancialAnalysis(data.financeiro)

    response += `\n---\n\n### 🔧 **Ordens de Serviço**\n`
    response += this.formatServiceOrdersAnalysis(data.ordens_servico)

    response += `\n---\n\n### 👥 **Clientes**\n`
    response += this.formatCustomersAnalysis(data.clientes)

    return response
  }

  private generateContextualActions(type: string, query: string): SuggestedAction[] {
    const actions: SuggestedAction[] = []

    switch (type) {
      case 'inventory':
        actions.push({
          id: 'create-purchase-order',
          title: 'Gerar ordem de compra',
          description: 'Criar ordem de compra para itens críticos',
          priority: 'high',
          category: 'inventory'
        })
        break

      case 'financial':
        actions.push({
          id: 'send-payment-reminders',
          title: 'Enviar lembretes de pagamento',
          description: 'Enviar lembretes para lançamentos vencidos',
          priority: 'high',
          category: 'financial'
        })
        break

      case 'service_orders':
        actions.push({
          id: 'review-pending-os',
          title: 'Revisar OS pendentes',
          description: 'Analisar e priorizar ordens de serviço pendentes',
          priority: 'medium',
          category: 'operations'
        })
        break
    }

    return actions
  }

  async analyzeBusinessHealth(userId?: string): Promise<any> {
    console.log('🏥 Analyzing business health...')

    const financialHealth = await this.analyzeFinancialHealth()
    const operationalHealth = await this.analyzeOperationalHealth()
    const customerHealth = await this.analyzeCustomerHealth()
    const inventoryHealth = await this.analyzeInventoryHealth()

    const overallScore = this.calculateOverallHealthScore({
      financial: financialHealth.score,
      operational: operationalHealth.score,
      customer: customerHealth.score,
      inventory: inventoryHealth.score
    })

    return {
      overallScore,
      scoreLabel: this.getScoreLabel(overallScore),
      details: {
        financial: financialHealth,
        operational: operationalHealth,
        customer: customerHealth,
        inventory: inventoryHealth
      },
      criticalIssues: this.identifyCriticalIssues({
        financialHealth,
        operationalHealth,
        customerHealth,
        inventoryHealth
      }),
      opportunities: this.identifyOpportunities({
        financialHealth,
        operationalHealth,
        customerHealth,
        inventoryHealth
      })
    }
  }

  async generateProactiveInsights(userContext: any): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = []

    try {
      const { data: lowStock } = await supabase
        .from('inventory_items')
        .select('*')
        .lt('quantity', supabase.sql`minimum_stock`)
        .limit(5)

      if (lowStock && lowStock.length > 0) {
        insights.push({
          id: 'low-stock-alert',
          type: 'alert',
          title: 'Itens com estoque baixo',
          description: `${lowStock.length} itens precisam de reposição urgente`,
          severity: 'critical',
          data: lowStock,
          actionable: true,
          suggestedAction: 'Gerar ordem de compra automática'
        })
      }

      const { data: overduePayments } = await supabase
        .from('finance_entries')
        .select('*')
        .eq('entry_type', 'receita')
        .eq('status', 'pendente')
        .lt('due_date', new Date().toISOString())
        .limit(10)

      if (overduePayments && overduePayments.length > 0) {
        const total = overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        insights.push({
          id: 'overdue-payments',
          type: 'alert',
          title: 'Pagamentos atrasados',
          description: `R$ ${total.toFixed(2)} em pagamentos vencidos`,
          severity: 'warning',
          data: overduePayments,
          actionable: true,
          suggestedAction: 'Enviar lembretes de cobrança'
        })
      }

      const { data: atRiskCustomers } = await supabase
        .from('v_customer_rfm_analysis')
        .select('*')
        .eq('rfm_segment', 'At Risk')
        .limit(5)

      if (atRiskCustomers && atRiskCustomers.length > 0) {
        insights.push({
          id: 'at-risk-customers',
          type: 'opportunity',
          title: 'Clientes em risco',
          description: `${atRiskCustomers.length} clientes podem ser reativados`,
          severity: 'warning',
          data: atRiskCustomers,
          actionable: true,
          suggestedAction: 'Criar campanha de reativação'
        })
      }

      const { data: recentOS } = await supabase
        .from('service_orders')
        .select('*')
        .eq('status', 'concluida')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      if (recentOS && recentOS.length > 10) {
        const avgValue = recentOS.reduce((sum, os) => sum + (os.total_value || 0), 0) / recentOS.length
        insights.push({
          id: 'growth-trend',
          type: 'trend',
          title: 'Crescimento detectado',
          description: `${recentOS.length} OS concluídas esta semana (Ticket médio: R$ ${avgValue.toFixed(2)})`,
          severity: 'info',
          data: { count: recentOS.length, avgValue },
          actionable: false
        })
      }

      console.log('💡 Generated', insights.length, 'proactive insights')
    } catch (error) {
      console.error('Error generating proactive insights:', error)
    }

    return insights
  }

  async executeSQLAnalysis(query: string): Promise<any> {
    try {
      console.log('📊 Executing SQL analysis...')

      const { data, error } = await supabase.rpc('execute_custom_query', { query_text: query })

      if (error) throw error

      return {
        success: true,
        data,
        rowCount: data?.length || 0
      }
    } catch (error) {
      console.error('Error executing SQL:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async predictFutureMetrics(metric: string, daysAhead: number = 30): Promise<any> {
    console.log(`🔮 Predicting ${metric} for next ${daysAhead} days...`)

    try {
      const historicalData = await this.getHistoricalData(metric, 90)

      if (!historicalData || historicalData.length < 7) {
        return {
          success: false,
          message: 'Dados históricos insuficientes para previsão'
        }
      }

      const trend = this.calculateTrend(historicalData)
      const prediction = this.simpleLinearPrediction(historicalData, daysAhead)

      return {
        success: true,
        metric,
        daysAhead,
        prediction,
        trend,
        confidence: this.calculatePredictionConfidence(historicalData)
      }
    } catch (error) {
      console.error('Error predicting metrics:', error)
      return { success: false, error: error.message }
    }
  }

  async learnFromInteraction(userId: string, query: string, helpful: boolean): Promise<void> {
    try {
      await supabase.from('thomaz_learning_feedback').insert({
        user_id: userId,
        query,
        helpful,
        created_at: new Date().toISOString()
      })

      console.log('📚 Learning feedback recorded')
    } catch (error) {
      console.error('Error recording learning feedback:', error)
    }
  }

  private async buildUserContext(userId?: string): Promise<ThomazContext> {
    if (!userId) {
      return {
        userRole: 'anonymous',
        sessionId: Math.random().toString(36)
      }
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return {
      userId,
      userRole: profile?.role || 'user',
      companyId: profile?.company_id,
      sessionId: Math.random().toString(36),
      lastLogin: profile?.last_login ? new Date(profile.last_login) : undefined
    }
  }

  private async getConversationHistory(conversationId?: string): Promise<any[]> {
    if (!conversationId) return []

    const { data } = await supabase
      .from('thomaz_conversations')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    return data || []
  }

  private extractActionableItems(reasoning: ReasoningResult): SuggestedAction[] {
    const actions: SuggestedAction[] = []

    reasoning.recommendations.forEach((rec, idx) => {
      if (rec.includes('gerar') || rec.includes('criar') || rec.includes('revisar')) {
        const priority = rec.includes('🚨') ? 'high' : rec.includes('⚠️') ? 'medium' : 'low'

        actions.push({
          id: `action-${idx}`,
          title: rec.substring(0, 50),
          description: rec,
          priority,
          category: 'recommendation',
          autoExecutable: false
        })
      }
    })

    return actions
  }

  private async saveConversation(
    userId: string | undefined,
    message: string,
    response: string,
    conversationId?: string
  ): Promise<void> {
    try {
      await supabase.from('thomaz_conversations').insert({
        conversation_id: conversationId || Math.random().toString(36),
        user_id: userId,
        user_message: message,
        thomaz_response: response,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }

  private async analyzeFinancialHealth(): Promise<any> {
    const { data: entries } = await supabase
      .from('finance_entries')
      .select('*')
      .gte('due_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const receitas = entries?.filter(e => e.entry_type === 'receita') || []
    const despesas = entries?.filter(e => e.entry_type === 'despesa') || []

    const totalReceitas = receitas.reduce((sum, r) => sum + (r.amount || 0), 0)
    const totalDespesas = despesas.reduce((sum, d) => sum + (d.amount || 0), 0)
    const margem = totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0

    const score = margem > 30 ? 95 : margem > 20 ? 75 : margem > 10 ? 50 : 25

    return {
      score,
      margem: margem.toFixed(2),
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      status: score > 80 ? 'excelente' : score > 60 ? 'bom' : score > 40 ? 'regular' : 'crítico'
    }
  }

  private async analyzeOperationalHealth(): Promise<any> {
    const { data: orders } = await supabase
      .from('service_orders')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const total = orders?.length || 0
    const concluidas = orders?.filter(o => o.status === 'concluida')?.length || 0
    const taxaConclusao = total > 0 ? (concluidas / total) * 100 : 0

    const score = taxaConclusao > 90 ? 95 : taxaConclusao > 75 ? 80 : taxaConclusao > 60 ? 60 : 40

    return {
      score,
      taxaConclusao: taxaConclusao.toFixed(2),
      total,
      concluidas,
      status: score > 80 ? 'excelente' : score > 60 ? 'bom' : 'regular'
    }
  }

  private async analyzeCustomerHealth(): Promise<any> {
    const { data: customers } = await supabase
      .from('customers')
      .select('*')

    const { data: rfm } = await supabase
      .from('v_customer_rfm_analysis')
      .select('*')

    const champions = rfm?.filter(c => c.rfm_segment === 'Champions')?.length || 0
    const total = customers?.length || 0
    const healthPercentage = total > 0 ? (champions / total) * 100 : 0

    const score = healthPercentage > 20 ? 90 : healthPercentage > 10 ? 70 : 50

    return {
      score,
      total,
      champions,
      healthPercentage: healthPercentage.toFixed(2),
      status: score > 80 ? 'excelente' : score > 60 ? 'bom' : 'regular'
    }
  }

  private async analyzeInventoryHealth(): Promise<any> {
    const { data: items } = await supabase
      .from('inventory_items')
      .select('*')

    const { data: lowStock } = await supabase
      .from('inventory_items')
      .select('*')
      .lt('quantity', supabase.sql`minimum_stock`)

    const total = items?.length || 0
    const lowStockCount = lowStock?.length || 0
    const healthPercentage = total > 0 ? ((total - lowStockCount) / total) * 100 : 100

    const score = healthPercentage > 90 ? 95 : healthPercentage > 70 ? 75 : 50

    return {
      score,
      total,
      lowStockCount,
      healthPercentage: healthPercentage.toFixed(2),
      status: score > 80 ? 'excelente' : score > 60 ? 'bom' : 'crítico'
    }
  }

  private calculateOverallHealthScore(scores: any): number {
    const avg = (scores.financial + scores.operational + scores.customer + scores.inventory) / 4
    return Math.round(avg)
  }

  private getScoreLabel(score: number): string {
    if (score > 85) return 'Excelente'
    if (score > 70) return 'Bom'
    if (score > 50) return 'Regular'
    return 'Crítico'
  }

  private identifyCriticalIssues(healthData: any): string[] {
    const issues: string[] = []

    if (healthData.financialHealth.score < 60) {
      issues.push('Saúde financeira comprometida - margem abaixo do ideal')
    }
    if (healthData.operationalHealth.score < 60) {
      issues.push('Taxa de conclusão de OS abaixo de 75%')
    }
    if (healthData.inventoryHealth.lowStockCount > 5) {
      issues.push(`${healthData.inventoryHealth.lowStockCount} itens com estoque crítico`)
    }

    return issues
  }

  private identifyOpportunities(healthData: any): string[] {
    const opportunities: string[] = []

    if (healthData.financialHealth.margem > 25) {
      opportunities.push('Margem saudável - considere investir em marketing')
    }
    if (healthData.customerHealth.champions > 10) {
      opportunities.push('Base sólida de clientes Champions - lance programa de indicação')
    }
    if (healthData.operationalHealth.taxaConclusao > 85) {
      opportunities.push('Alta eficiência operacional - pode aumentar volume')
    }

    return opportunities
  }

  private async getHistoricalData(metric: string, days: number): Promise<any[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data } = await supabase
      .from('finance_entries')
      .select('created_at, amount')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    return data || []
  }

  private calculateTrend(data: any[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable'

    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))

    const firstAvg = firstHalf.reduce((sum, d) => sum + (d.amount || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d.amount || 0), 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    if (change > 5) return 'up'
    if (change < -5) return 'down'
    return 'stable'
  }

  private simpleLinearPrediction(data: any[], daysAhead: number): number[] {
    if (data.length < 2) return []

    const values = data.map(d => d.amount || 0)
    const n = values.length
    const sumX = (n * (n + 1)) / 2
    const sumY = values.reduce((sum, v) => sum + v, 0)
    const sumXY = values.reduce((sum, v, i) => sum + v * (i + 1), 0)
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    const predictions: number[] = []
    for (let i = 1; i <= daysAhead; i++) {
      predictions.push(slope * (n + i) + intercept)
    }

    return predictions
  }

  private calculatePredictionConfidence(data: any[]): number {
    if (data.length < 7) return 0.3
    if (data.length < 30) return 0.6
    if (data.length < 60) return 0.75
    return 0.85
  }
}

export { ThomazSuperAdvancedService }
export default ThomazSuperAdvancedService

export const sendMessage = async (
  message: string,
  userId?: string,
  conversationId?: string
): Promise<ThomazConversationResult> => {
  const service = new ThomazSuperAdvancedService()
  return service.sendMessage(message, userId, conversationId)
}
