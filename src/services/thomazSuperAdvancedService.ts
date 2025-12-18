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

      const analysisContext: AnalysisContext = {
        query: message,
        userId,
        userRole: userContext.userRole || 'user',
        companyId: userContext.companyId,
        conversationHistory: await this.getConversationHistory(conversationId)
      }

      const reasoning = await this.reasoningEngine.reason(message, analysisContext)

      console.log('📊 Reasoning complete:', {
        confidence: reasoning.confidence,
        steps: reasoning.steps.length,
        recommendations: reasoning.recommendations.length
      })

      const suggestedActions = this.extractActionableItems(reasoning)

      await this.saveConversation(userId, message, reasoning.result, conversationId)

      const proactiveInsights = await this.generateProactiveInsights(userContext)

      let enhancedResponse = reasoning.result

      if (proactiveInsights.length > 0) {
        enhancedResponse += '\n\n**🔔 Insights Proativos:**\n'
        proactiveInsights.slice(0, 3).forEach(insight => {
          const icon = insight.type === 'alert' ? '🚨' : insight.type === 'opportunity' ? '💡' : '📊'
          enhancedResponse += `${icon} ${insight.title}: ${insight.description}\n`
        })
      }

      return {
        response: enhancedResponse,
        reasoning,
        suggestedActions,
        confidence: reasoning.confidence,
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
