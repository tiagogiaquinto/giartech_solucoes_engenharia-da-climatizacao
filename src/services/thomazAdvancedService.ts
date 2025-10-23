import { supabase } from '../lib/supabase'

interface ReasoningStep {
  step: number
  action: string
  description: string
  result?: any
  sources?: string[]
}

interface WebSearchResult {
  id: string
  title: string
  summary: string
  url: string
  domain: string
  trust_score: number
  relevance: number
  cached: boolean
}

interface ReasoningChain {
  reasoning_id: string
  steps: ReasoningStep[]
  total_steps: number
  reasoning_time_ms: number
  confidence: number
}

class ThomazAdvancedService {
  // Busca inteligente na web (usa cache primeiro)
  async searchWeb(query: string, topic: string = 'geral', maxResults: number = 5): Promise<WebSearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('thomaz_search_web', {
        p_query: query,
        p_topic: topic,
        p_max_results: maxResults
      })

      if (error) throw error

      return data?.results || []
    } catch (error) {
      console.error('Erro na busca web:', error)
      return []
    }
  }

  // Raciocínio em cadeia (Chain of Thought)
  async reasonWithChainOfThought(query: string, context: any = {}): Promise<ReasoningChain | null> {
    try {
      const { data, error } = await supabase.rpc('thomaz_reason_chain_of_thought', {
        p_query: query,
        p_context: context
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro no raciocínio em cadeia:', error)
      return null
    }
  }

  // Aprender com feedback do usuário
  async learnFromFeedback(
    topic: string,
    oldKnowledge: string,
    newKnowledge: string,
    source: string,
    confidence: number = 0.80
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('thomaz_learn_from_feedback', {
        p_topic: topic,
        p_old_knowledge: oldKnowledge,
        p_new_knowledge: newKnowledge,
        p_source: source,
        p_confidence: confidence
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao aprender:', error)
      return null
    }
  }

  // Salvar conhecimento da web
  async saveWebKnowledge(
    query: string,
    topic: string,
    title: string,
    content: string,
    sourceUrl: string,
    sourceDomain: string,
    summary?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('thomaz_web_knowledge')
        .insert({
          query,
          topic,
          title,
          content,
          source_url: sourceUrl,
          source_domain: sourceDomain,
          summary: summary || content.substring(0, 500),
          trust_score: 0.75,
          relevance_score: 0.80
        })
        .select('id')
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('Erro ao salvar conhecimento:', error)
      return null
    }
  }

  // Buscar em memória contextual
  async getContextMemory(userId: string | null, contextType?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('thomaz_context_memory')
        .select('*')
        .order('importance_score', { ascending: false })
        .limit(50)

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (contextType) {
        query = query.eq('context_type', contextType)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar memória:', error)
      return []
    }
  }

  // Salvar em memória contextual
  async saveContextMemory(
    contextType: string,
    contextKey: string,
    contextValue: any,
    userId: string | null = null,
    importanceScore: number = 0.50
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('thomaz_context_memory')
        .insert({
          user_id: userId,
          context_type: contextType,
          context_key: contextKey,
          context_value: contextValue,
          importance_score: importanceScore
        })
        .select('id')
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('Erro ao salvar memória:', error)
      return null
    }
  }

  // Verificar fato
  async verifyFact(claim: string, context?: string): Promise<any | null> {
    try {
      // Buscar verificações existentes
      const { data: existing, error: searchError } = await supabase
        .from('thomaz_fact_verification')
        .select('*')
        .textSearch('claim', claim)
        .order('last_verified', { ascending: false })
        .limit(1)

      if (searchError) throw searchError

      if (existing && existing.length > 0) {
        // Atualizar contador de acesso
        await supabase
          .from('thomaz_fact_verification')
          .update({ last_verified: new Date().toISOString() })
          .eq('id', existing[0].id)

        return existing[0]
      }

      // Se não existe, criar nova verificação (status: unverified)
      const { data: newFact, error: insertError } = await supabase
        .from('thomaz_fact_verification')
        .insert({
          claim,
          context: context || '',
          verification_status: 'unverified',
          confidence_score: 0.50,
          sources_checked: 0
        })
        .select()
        .single()

      if (insertError) throw insertError

      return newFact
    } catch (error) {
      console.error('Erro ao verificar fato:', error)
      return null
    }
  }

  // Obter histórico de aprendizado
  async getLearningHistory(topic?: string, limit: number = 20): Promise<any[]> {
    try {
      let query = supabase
        .from('thomaz_learning_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (topic) {
        query = query.eq('topic', topic)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }
  }

  // Obter estatísticas de inteligência
  async getIntelligenceStats(): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('v_thomaz_intelligence_stats')
        .select('*')
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return null
    }
  }

  // Buscar conhecimento mais relevante
  async getTopKnowledge(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('v_thomaz_top_knowledge')
        .select('*')
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar conhecimento:', error)
      return []
    }
  }

  // Resposta avançada com raciocínio
  async getAdvancedResponse(query: string, conversationHistory: any[] = []): Promise<{
    response: string
    reasoning: ReasoningChain | null
    webResults: WebSearchResult[]
    confidence: number
    sources: string[]
  }> {
    try {
      // 1. Raciocínio em cadeia
      const reasoning = await this.reasonWithChainOfThought(query, {
        history: conversationHistory
      })

      // 2. Buscar na web se necessário
      const needsWebSearch = this.detectWebSearchNeed(query)
      let webResults: WebSearchResult[] = []

      if (needsWebSearch) {
        const topic = this.extractTopic(query)
        webResults = await this.searchWeb(query, topic, 5)
      }

      // 3. Buscar na base de conhecimento local
      const localKnowledge = await this.searchLocalKnowledge(query)

      // 4. Buscar na biblioteca digital
      const libraryDocs = await this.searchLibrary(query)

      // 5. Sintetizar resposta
      const response = await this.synthesizeResponse(
        query,
        reasoning,
        webResults,
        localKnowledge,
        libraryDocs
      )

      // 6. Calcular confiança
      const confidence = this.calculateConfidence(reasoning, webResults, localKnowledge)

      // 7. Coletar fontes
      const sources = this.collectSources(webResults, localKnowledge, libraryDocs)

      // 8. Salvar na memória contextual
      await this.saveContextMemory(
        'conversation_history',
        `query_${Date.now()}`,
        { query, response, confidence, sources },
        null,
        confidence
      )

      return {
        response,
        reasoning,
        webResults,
        confidence,
        sources
      }
    } catch (error) {
      console.error('Erro na resposta avançada:', error)
      return {
        response: 'Desculpe, encontrei um erro ao processar sua pergunta. Pode reformular?',
        reasoning: null,
        webResults: [],
        confidence: 0.30,
        sources: []
      }
    }
  }

  // Detectar se precisa buscar na web
  private detectWebSearchNeed(query: string): boolean {
    const webIndicators = [
      'quando', 'onde', 'quem', 'o que é', 'como funciona',
      'notícia', 'novidade', 'atual', 'recente', 'hoje',
      'preço', 'custo', 'valor', 'cotação', 'moeda',
      'clima', 'tempo', 'temperatura', 'previsão'
    ]

    const lowerQuery = query.toLowerCase()
    return webIndicators.some(indicator => lowerQuery.includes(indicator))
  }

  // Extrair tópico da consulta
  private extractTopic(query: string): string {
    const topics: { [key: string]: string[] } = {
      'ar condicionado': ['ar condicionado', 'split', 'hvac', 'climatização', 'refrigeração'],
      'tecnologia': ['tecnologia', 'software', 'hardware', 'computador', 'internet'],
      'finanças': ['financeiro', 'dinheiro', 'lucro', 'receita', 'despesa', 'custo'],
      'notícias': ['notícia', 'novidade', 'acontecimento', 'atual'],
      'geral': []
    }

    const lowerQuery = query.toLowerCase()

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return topic
      }
    }

    return 'geral'
  }

  // Buscar conhecimento local
  private async searchLocalKnowledge(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('chat_knowledge_base')
        .select('*')
        .textSearch('fts', query)
        .limit(5)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar conhecimento local:', error)
      return []
    }
  }

  // Buscar na biblioteca
  private async searchLibrary(query: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('search_library', {
        p_query: query,
        p_limit: 3
      })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar na biblioteca:', error)
      return []
    }
  }

  // Sintetizar resposta
  private async synthesizeResponse(
    query: string,
    reasoning: ReasoningChain | null,
    webResults: WebSearchResult[],
    localKnowledge: any[],
    libraryDocs: any[]
  ): Promise<string> {
    let response = ''

    // Saudação baseada na hora
    const hour = new Date().getHours()
    let greeting = ''
    if (hour < 12) greeting = 'Bom dia!'
    else if (hour < 18) greeting = 'Boa tarde!'
    else greeting = 'Boa noite!'

    response += `${greeting} Vou ajudá-lo com sua pergunta.\n\n`

    // Adicionar conhecimento local primeiro
    if (localKnowledge.length > 0) {
      response += `📚 **Do meu conhecimento interno:**\n\n`
      response += `${localKnowledge[0].answer || localKnowledge[0].response}\n\n`
    }

    // Adicionar resultados da web
    if (webResults.length > 0) {
      response += `🌐 **Informações da web:**\n\n`
      webResults.slice(0, 2).forEach((result, i) => {
        response += `${i + 1}. **${result.title}**\n`
        response += `   ${result.summary}\n`
        response += `   📍 Fonte: ${result.domain} (Confiabilidade: ${(result.trust_score * 100).toFixed(0)}%)\n\n`
      })
    }

    // Adicionar documentos da biblioteca
    if (libraryDocs.length > 0) {
      response += `📄 **Documentos relacionados:**\n\n`
      libraryDocs.forEach((doc, i) => {
        response += `${i + 1}. ${doc.title}\n`
        if (doc.description) {
          response += `   ${doc.description}\n`
        }
      })
      response += `\n`
    }

    // Se não encontrou nada específico
    if (localKnowledge.length === 0 && webResults.length === 0 && libraryDocs.length === 0) {
      response += `Não encontrei informações específicas sobre isso em minhas bases de dados. `
      response += `Posso ajudá-lo de outra forma? Tente reformular sua pergunta ou perguntar sobre:\n\n`
      response += `• Ordens de Serviço\n`
      response += `• Clientes e Equipamentos\n`
      response += `• Estoque e Materiais\n`
      response += `• Relatórios Financeiros\n`
      response += `• Funcionários e Equipes\n`
    }

    // Adicionar confiança se relevante
    if (reasoning && reasoning.confidence >= 0.80) {
      response += `\n\n✅ Resposta verificada com alta confiança (${(reasoning.confidence * 100).toFixed(0)}%)`
    }

    return response.trim()
  }

  // Calcular confiança
  private calculateConfidence(
    reasoning: ReasoningChain | null,
    webResults: WebSearchResult[],
    localKnowledge: any[]
  ): number {
    let confidence = 0.50

    if (reasoning) {
      confidence = reasoning.confidence
    }

    if (localKnowledge.length > 0) {
      confidence += 0.15
    }

    if (webResults.length > 0) {
      const avgTrust = webResults.reduce((sum, r) => sum + r.trust_score, 0) / webResults.length
      confidence += avgTrust * 0.15
    }

    return Math.min(confidence, 1.0)
  }

  // Coletar fontes
  private collectSources(
    webResults: WebSearchResult[],
    localKnowledge: any[],
    libraryDocs: any[]
  ): string[] {
    const sources: string[] = []

    if (localKnowledge.length > 0) {
      sources.push('Base de Conhecimento Interna')
    }

    webResults.forEach(result => {
      sources.push(`${result.domain} - ${result.title}`)
    })

    libraryDocs.forEach(doc => {
      sources.push(`Biblioteca: ${doc.title}`)
    })

    return sources
  }
}

export const thomazAdvanced = new ThomazAdvancedService()
export default thomazAdvanced
