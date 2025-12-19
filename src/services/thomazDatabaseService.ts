import { supabase } from '../lib/supabase'

export interface TableAccessResult {
  success: boolean
  data: any[]
  error?: string
  metadata?: {
    table: string
    count: number
    timestamp: Date
  }
}

export interface SystemConfig {
  configurations: any[]
  aiProviders: any[]
  systemSettings: any[]
  companySettings: any[]
}

export interface KnowledgeData {
  knowledgeBase: any[]
  businessKnowledge: any[]
  manuals: any[]
  nlpPatterns: any[]
  synonyms: any[]
}

export interface ModulesAndPermissions {
  modules: any[]
  departments: any[]
  permissions: any[]
  automations: any[]
}

class ThomazDatabaseService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000

  private getCached(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  async getSystemConfiguration(): Promise<SystemConfig> {
    const cached = this.getCached('system_config')
    if (cached) return cached

    try {
      const [configRes, providersRes, settingsRes, companyRes] = await Promise.all([
        supabase.from('system_config').select('*'),
        supabase.from('ai_providers').select('*'),
        supabase.from('system_settings').select('*'),
        supabase.from('company_settings').select('*')
      ])

      const result: SystemConfig = {
        configurations: configRes.data || [],
        aiProviders: providersRes.data || [],
        systemSettings: settingsRes.data || [],
        companySettings: companyRes.data || []
      }

      this.setCache('system_config', result)
      return result
    } catch (error) {
      console.error('Erro ao buscar configuração do sistema:', error)
      return {
        configurations: [],
        aiProviders: [],
        systemSettings: [],
        companySettings: []
      }
    }
  }

  async getKnowledgeData(): Promise<KnowledgeData> {
    const cached = this.getCached('knowledge_data')
    if (cached) return cached

    try {
      const [kbRes, businessRes, manualsRes, nlpRes, synonymsRes] = await Promise.all([
        supabase.from('knowledge_base').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('thomaz_business_knowledge').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('system_manuals').select('*').order('created_at', { ascending: false }),
        supabase.from('thomaz_nlp_patterns').select('*').eq('is_active', true),
        supabase.from('thomaz_synonyms').select('*').eq('is_active', true)
      ])

      const result: KnowledgeData = {
        knowledgeBase: kbRes.data || [],
        businessKnowledge: businessRes.data || [],
        manuals: manualsRes.data || [],
        nlpPatterns: nlpRes.data || [],
        synonyms: synonymsRes.data || []
      }

      this.setCache('knowledge_data', result)
      return result
    } catch (error) {
      console.error('Erro ao buscar dados de conhecimento:', error)
      return {
        knowledgeBase: [],
        businessKnowledge: [],
        manuals: [],
        nlpPatterns: [],
        synonyms: []
      }
    }
  }

  async getModulesAndPermissions(): Promise<ModulesAndPermissions> {
    const cached = this.getCached('modules_permissions')
    if (cached) return cached

    try {
      const [modulesRes, deptsRes, permsRes, autoRes] = await Promise.all([
        supabase.from('system_modules').select('*').eq('is_active', true),
        supabase.from('system_departments').select('*').eq('is_active', true),
        supabase.from('user_module_permissions').select('*'),
        supabase.from('automation_rules').select('*').eq('is_active', true)
      ])

      const result: ModulesAndPermissions = {
        modules: modulesRes.data || [],
        departments: deptsRes.data || [],
        permissions: permsRes.data || [],
        automations: autoRes.data || []
      }

      this.setCache('modules_permissions', result)
      return result
    } catch (error) {
      console.error('Erro ao buscar módulos e permissões:', error)
      return {
        modules: [],
        departments: [],
        permissions: [],
        automations: []
      }
    }
  }

  async getCustomerData(query?: string): Promise<TableAccessResult> {
    try {
      let queryBuilder = supabase
        .from('customers')
        .select('id, name, email, phone, whatsapp, created_at, status')
        .order('created_at', { ascending: false })
        .limit(50)

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'customers',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getServiceOrders(filters?: { status?: string; limit?: number }): Promise<TableAccessResult> {
    try {
      let queryBuilder = supabase
        .from('service_orders')
        .select(`
          id,
          order_number,
          status,
          cliente_nome,
          total_geral,
          data_inicio,
          data_fim,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50)

      if (filters?.status) {
        queryBuilder = queryBuilder.eq('status', filters.status)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'service_orders',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getFinancialData(filters?: { startDate?: string; endDate?: string }): Promise<TableAccessResult> {
    try {
      let queryBuilder = supabase
        .from('finance_entries')
        .select(`
          id,
          tipo,
          descricao,
          valor,
          data_vencimento,
          status,
          categoria,
          created_at
        `)
        .order('data_vencimento', { ascending: false })
        .limit(100)

      if (filters?.startDate) {
        queryBuilder = queryBuilder.gte('data_vencimento', filters.startDate)
      }
      if (filters?.endDate) {
        queryBuilder = queryBuilder.lte('data_vencimento', filters.endDate)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'finance_entries',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getEmployees(): Promise<TableAccessResult> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          nome,
          cargo,
          departamento,
          email,
          telefone,
          status,
          data_admissao
        `)
        .order('nome')

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'employees',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getInventoryItems(lowStock = false): Promise<TableAccessResult> {
    try {
      let queryBuilder = supabase
        .from('inventory_items')
        .select(`
          id,
          nome,
          codigo,
          categoria,
          quantidade,
          estoque_minimo,
          preco_custo,
          preco_venda,
          unidade
        `)
        .order('nome')

      if (lowStock) {
        queryBuilder = queryBuilder.lt('quantidade', supabase.raw('estoque_minimo'))
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'inventory_items',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getCRMOpportunities(filters?: { stage?: string }): Promise<TableAccessResult> {
    try {
      let queryBuilder = supabase
        .from('crm_opportunities')
        .select(`
          id,
          titulo,
          valor,
          estagio,
          probabilidade,
          data_fechamento_prevista,
          origem,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (filters?.stage) {
        queryBuilder = queryBuilder.eq('estagio', filters.stage)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'crm_opportunities',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getAgendaEvents(filters?: { startDate?: string; endDate?: string; type?: string }): Promise<TableAccessResult> {
    try {
      let queryBuilder = supabase
        .from('agenda_events')
        .select(`
          id,
          titulo,
          descricao,
          data_inicio,
          data_fim,
          tipo_evento,
          status,
          prioridade,
          created_at
        `)
        .order('data_inicio', { ascending: true })
        .limit(100)

      if (filters?.startDate) {
        queryBuilder = queryBuilder.gte('data_inicio', filters.startDate)
      }
      if (filters?.endDate) {
        queryBuilder = queryBuilder.lte('data_inicio', filters.endDate)
      }
      if (filters?.type) {
        queryBuilder = queryBuilder.eq('tipo_evento', filters.type)
      }

      const { data, error } = await queryBuilder

      if (error) throw error

      return {
        success: true,
        data: data || [],
        metadata: {
          table: 'agenda_events',
          count: data?.length || 0,
          timestamp: new Date()
        }
      }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  async getDashboardMetrics(): Promise<any> {
    const cached = this.getCached('dashboard_metrics')
    if (cached) return cached

    try {
      const [
        customersCount,
        ordersCount,
        financeTotal,
        employeesCount,
        opportunitiesCount
      ] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('service_orders').select('id', { count: 'exact', head: true }),
        supabase.from('finance_entries').select('valor').eq('tipo', 'receita'),
        supabase.from('employees').select('id', { count: 'exact', head: true }),
        supabase.from('crm_opportunities').select('id', { count: 'exact', head: true })
      ])

      const totalReceitas = financeTotal.data?.reduce((sum, entry) => sum + (entry.valor || 0), 0) || 0

      const metrics = {
        clientes: customersCount.count || 0,
        ordens_servico: ordersCount.count || 0,
        receita_total: totalReceitas,
        funcionarios: employeesCount.count || 0,
        oportunidades: opportunitiesCount.count || 0,
        timestamp: new Date()
      }

      this.setCache('dashboard_metrics', metrics)
      return metrics
    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error)
      return {
        clientes: 0,
        ordens_servico: 0,
        receita_total: 0,
        funcionarios: 0,
        oportunidades: 0
      }
    }
  }

  async searchAllTables(searchTerm: string): Promise<any> {
    try {
      const normalizedTerm = searchTerm.toLowerCase().trim()

      const [customers, orders, employees, opportunities] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name, email, phone')
          .or(`name.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%`)
          .limit(5),
        supabase
          .from('service_orders')
          .select('id, order_number, cliente_nome, status')
          .or(`order_number.ilike.%${normalizedTerm}%,cliente_nome.ilike.%${normalizedTerm}%`)
          .limit(5),
        supabase
          .from('employees')
          .select('id, nome, cargo, email')
          .or(`nome.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%`)
          .limit(5),
        supabase
          .from('crm_opportunities')
          .select('id, titulo, valor, estagio')
          .ilike('titulo', `%${normalizedTerm}%`)
          .limit(5)
      ])

      return {
        customers: customers.data || [],
        orders: orders.data || [],
        employees: employees.data || [],
        opportunities: opportunities.data || [],
        totalResults:
          (customers.data?.length || 0) +
          (orders.data?.length || 0) +
          (employees.data?.length || 0) +
          (opportunities.data?.length || 0)
      }
    } catch (error) {
      console.error('Erro na busca global:', error)
      return {
        customers: [],
        orders: [],
        employees: [],
        opportunities: [],
        totalResults: 0
      }
    }
  }

  async getPersonalityConfig(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('thomaz_personality_config')
        .select('*')
        .maybeSingle()

      if (error) throw error

      return data || {
        personality: 'professional',
        tone: 'friendly',
        verbosity: 'balanced',
        proactivity: 'medium'
      }
    } catch (error) {
      console.error('Erro ao buscar configuração de personalidade:', error)
      return {
        personality: 'professional',
        tone: 'friendly',
        verbosity: 'balanced',
        proactivity: 'medium'
      }
    }
  }

  async getSystemPrompts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('thomaz_system_prompts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar prompts do sistema:', error)
      return []
    }
  }

  async saveConversation(conversationData: {
    user_message: string
    assistant_response: string
    context?: any
    metadata?: any
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('thomaz_conversations')
        .insert({
          user_message: conversationData.user_message,
          assistant_response: conversationData.assistant_response,
          context: conversationData.context || {},
          metadata: conversationData.metadata || {},
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erro ao salvar conversa:', error)
      return false
    }
  }

  async saveInteraction(interactionData: {
    query: string
    response: string
    query_type?: string
    success?: boolean
    execution_time?: number
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('thomaz_interactions')
        .insert({
          query: interactionData.query,
          response: interactionData.response,
          query_type: interactionData.query_type || 'general',
          success: interactionData.success !== false,
          execution_time: interactionData.execution_time || 0,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erro ao salvar interação:', error)
      return false
    }
  }

  async saveLearningFeedback(feedbackData: {
    query: string
    response: string
    feedback_type: 'positive' | 'negative' | 'correction'
    correction?: string
    rating?: number
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('thomaz_learning_feedback')
        .insert({
          query: feedbackData.query,
          response: feedbackData.response,
          feedback_type: feedbackData.feedback_type,
          correction: feedbackData.correction,
          rating: feedbackData.rating,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erro ao salvar feedback de aprendizado:', error)
      return false
    }
  }

  clearCache(): void {
    this.cache.clear()
    console.log('Cache do Thomaz limpo com sucesso')
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const thomazDatabaseService = new ThomazDatabaseService()
export default thomazDatabaseService
