/**
 * ThomazRAG Service - Retrieval Augmented Generation
 *
 * Implementa pipeline completo de RAG:
 * 1. Retriever - busca documentos similares
 * 2. Ranker - ordena por relevância
 * 3. Context Builder - monta contexto
 * 4. Response Generator - gera resposta estruturada
 * 5. Confidence Calculator - calcula confiança
 * 6. Fallback Handler - escalação automática
 */

import { supabase } from '../lib/supabase'
import {
  ThomazContext,
  ThomazResponse,
  RetrievedDocument,
  SourceCitation,
  SYSTEM_PROMPT_BASE,
  buildSystemPrompt,
  CONFIDENCE_THRESHOLDS
} from '../config/thomazSystemPrompt'

export interface RAGQuery {
  query: string
  context: ThomazContext
  filters?: {
    sourceType?: string[]
    sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted'
    category?: string[]
  }
  maxDocuments?: number
  similarityThreshold?: number
}

export interface RAGResult {
  response: ThomazResponse
  retrievedDocs: RetrievedDocument[]
  conversationId: string
  executionTimeMs: number
}

export class ThomazRAGService {
  private readonly DEFAULT_MAX_DOCS = 5
  private readonly DEFAULT_SIMILARITY_THRESHOLD = 0.7

  /**
   * Pipeline principal de RAG
   */
  async query(ragQuery: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now()

    try {
      // 1. RETRIEVE: Buscar documentos similares
      const retrievedDocs = await this.retrieveDocuments(
        ragQuery.query,
        ragQuery.filters,
        ragQuery.maxDocuments || this.DEFAULT_MAX_DOCS,
        ragQuery.similarityThreshold || this.DEFAULT_SIMILARITY_THRESHOLD
      )

      // 2. CHECK PERMISSIONS: Filtrar por permissões do usuário
      const authorizedDocs = this.filterByPermissions(
        retrievedDocs,
        ragQuery.context.userRole
      )

      // 3. BUILD CONTEXT: Montar contexto para LLM
      const enhancedContext: ThomazContext = {
        ...ragQuery.context,
        retrievedDocs: authorizedDocs
      }

      // 4. GENERATE RESPONSE: Gerar resposta estruturada
      const response = await this.generateStructuredResponse(
        ragQuery.query,
        enhancedContext
      )

      // 5. CALCULATE CONFIDENCE: Calcular nível de confiança
      const confidenceLevel = this.calculateConfidence(authorizedDocs, response)
      response.confidenceLevel = confidenceLevel

      // 6. HANDLE FALLBACK: Se confiança baixa, criar ticket
      if (confidenceLevel === 'low') {
        response.requiresHumanFallback = true
        response.fallbackReason = 'Conhecimento insuficiente ou conflitante'
      }

      // 7. SAVE CONVERSATION: Salvar no histórico
      const conversationId = await this.saveConversation(
        ragQuery,
        response,
        authorizedDocs
      )

      // 8. AUDIT LOG: Registrar acesso
      await this.logAccess(conversationId, ragQuery.context, authorizedDocs)

      const executionTimeMs = Date.now() - startTime

      return {
        response,
        retrievedDocs: authorizedDocs,
        conversationId,
        executionTimeMs
      }
    } catch (error) {
      console.error('RAG Query Error:', error)
      throw error
    }
  }

  /**
   * STEP 1: Retrieve - Buscar documentos similares
   */
  private async retrieveDocuments(
    query: string,
    filters?: RAGQuery['filters'],
    maxDocs: number = 5,
    threshold: number = 0.7
  ): Promise<RetrievedDocument[]> {
    try {
      // Por enquanto, busca por full-text search
      // TODO: Implementar embeddings reais com OpenAI/HuggingFace
      const { data, error } = await supabase
        .from('thomaz_knowledge_sources')
        .select('*')
        .textSearch('content', query, {
          type: 'websearch',
          config: 'portuguese'
        })
        .eq('is_active', true)
        .limit(maxDocs)

      if (error) throw error

      // Simular similarity score baseado em keywords
      return (data || []).map((doc) => ({
        id: doc.id,
        title: doc.title,
        sourceType: doc.source_type,
        content: doc.content,
        similarity: this.calculateTextSimilarity(query, doc.content),
        version: doc.version
      })).filter(doc => doc.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
    } catch (error) {
      console.error('Retrieve Documents Error:', error)
      return []
    }
  }

  /**
   * Calcular similaridade de texto simples (fallback sem embeddings)
   */
  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()

    const matchCount = queryWords.filter(word => contentLower.includes(word)).length
    const similarity = matchCount / queryWords.length

    return Math.min(similarity + 0.2, 1.0) // Bonus base + matches
  }

  /**
   * STEP 2: Filtrar documentos por permissões do usuário
   */
  private filterByPermissions(
    docs: RetrievedDocument[],
    userRole: string
  ): RetrievedDocument[] {
    // Por enquanto, permite tudo em desenvolvimento
    // TODO: Implementar verificação real de required_roles
    return docs
  }

  /**
   * STEP 4: Gerar resposta estruturada
   */
  private async generateStructuredResponse(
    query: string,
    context: ThomazContext
  ): Promise<ThomazResponse> {
    // Analisar tipo de query
    const queryType = this.detectQueryType(query)

    let response: ThomazResponse

    switch (queryType) {
      case 'financial_calculation':
        response = await this.handleFinancialQuery(query, context)
        break
      case 'operational_guide':
        response = await this.handleOperationalQuery(query, context)
        break
      case 'strategic_advice':
        response = await this.handleStrategicQuery(query, context)
        break
      default:
        response = await this.handleGeneralQuery(query, context)
    }

    return response
  }

  /**
   * Detectar tipo de query
   */
  private detectQueryType(query: string): string {
    const lowerQuery = query.toLowerCase()

    if (
      /margem|markup|ebitda|dso|giro|estoque|ponto.*equil[íi]brio|fluxo.*caixa/.test(lowerQuery)
    ) {
      return 'financial_calculation'
    }

    if (
      /como.*criar|passo.*passo|tutorial|procedimento|erro|problema/.test(lowerQuery)
    ) {
      return 'operational_guide'
    }

    if (
      /estrat[ée]gia|crescimento|expans[ãa]o|investimento|decis[ãa]o/.test(lowerQuery)
    ) {
      return 'strategic_advice'
    }

    return 'general'
  }

  /**
   * Handler para queries financeiras
   */
  private async handleFinancialQuery(
    query: string,
    context: ThomazContext
  ): Promise<ThomazResponse> {
    const sources: SourceCitation[] = context.retrievedDocs?.map(doc => ({
      docId: doc.id,
      title: doc.title,
      version: doc.version,
      relevance: doc.similarity
    })) || []

    // Identificar métrica solicitada
    const lowerQuery = query.toLowerCase()
    let metric = ''
    let summary = ''
    let steps: string[] = []
    let strategicSuggestion = ''

    if (/margem/.test(lowerQuery)) {
      metric = 'Margem de Contribuição'
      summary = 'Calcular margem de contribuição para avaliar lucratividade'
      steps = [
        'Identifique a Receita Total do período',
        'Calcule os Custos Variáveis (materiais, mão de obra direta)',
        'Aplique a fórmula: (Receita - Custos Variáveis) / Receita × 100',
        'Compare com a meta: > 30% é saudável',
        'Se < 20%, investigue: precificação, fornecedores, perdas'
      ]
      strategicSuggestion = 'Margem é o indicador mais importante para sustentabilidade. Antes de crescer volume, estabilize a margem acima de 25%. Teste ajustes de preço em 10-15% dos serviços de maior volume e meça impacto em 30 dias.'
    } else if (/dso/.test(lowerQuery)) {
      metric = 'DSO (Days Sales Outstanding)'
      summary = 'Medir eficiência de cobrança e recebimento'
      steps = [
        'Some o total de Contas a Receber atual',
        'Calcule a Receita Média Mensal (últimos 3 meses)',
        'Aplique: (Contas a Receber / Receita Mensal) × 30',
        'Meta ideal: < 45 dias',
        'Se > 60 dias: revisar política de crédito urgentemente'
      ]
      strategicSuggestion = 'DSO alto mata fluxo de caixa. Implemente: 1) desconto de 3-5% para pagamento antecipado, 2) política de bloqueio automático após 30 dias, 3) call center dedicado para cobrança. ROI esperado: redução de 20% no DSO em 60 dias.'
    }

    return {
      summary: `${metric}: ${summary}`,
      steps,
      sources,
      strategicSuggestion,
      confidenceLevel: sources.length > 0 ? 'high' : 'medium',
      requiresHumanFallback: false,
      nextAction: 'Execute os cálculos com os dados reais da empresa e compartilhe os resultados para análise detalhada.'
    }
  }

  /**
   * Handler para queries operacionais
   */
  private async handleOperationalQuery(
    query: string,
    context: ThomazContext
  ): Promise<ThomazResponse> {
    const sources: SourceCitation[] = context.retrievedDocs?.map(doc => ({
      docId: doc.id,
      title: doc.title,
      version: doc.version,
      relevance: doc.similarity
    })) || []

    // Usar conteúdo dos documentos recuperados
    const hasGoodDocs = sources.some(s => s.relevance > 0.75)

    if (hasGoodDocs && context.retrievedDocs && context.retrievedDocs.length > 0) {
      const bestDoc = context.retrievedDocs[0]

      return {
        summary: `Encontrei procedimento documentado: ${bestDoc.title}`,
        steps: this.extractStepsFromDocument(bestDoc.content),
        sources,
        strategicSuggestion: 'Recomendo documentar todos os processos operacionais com mesmo nível de detalhe. Processos bem documentados reduzem erros em 60% e tempo de treinamento em 50%.',
        confidenceLevel: 'high',
        requiresHumanFallback: false,
        nextAction: 'Siga o passo a passo acima. Se encontrar dificuldades, me avise qual etapa.'
      }
    }

    return {
      summary: 'Procedimento não encontrado na documentação',
      sources,
      strategicSuggestion: 'Vou criar um rascunho de procedimento baseado em boas práticas. Após validação, podemos incluir na base de conhecimento.',
      confidenceLevel: 'low',
      requiresHumanFallback: true,
      fallbackReason: 'Sem documentação específica. Requer validação de especialista.',
      nextAction: 'Posso abrir um ticket para o time documentar este procedimento?'
    }
  }

  /**
   * Handler para queries estratégicas
   */
  private async handleStrategicQuery(
    query: string,
    context: ThomazContext
  ): Promise<ThomazResponse> {
    const sources: SourceCitation[] = context.retrievedDocs?.map(doc => ({
      docId: doc.id,
      title: doc.title,
      version: doc.version,
      relevance: doc.similarity
    })) || []

    return {
      summary: 'Análise estratégica com perspectiva empreendedora',
      steps: [
        'Levante dados dos últimos 60-90 dias (receita, margem, custos fixos)',
        'Identifique os 3 principais gargalos atuais',
        'Calcule ROI esperado de cada melhoria potencial',
        'Priorize ações com payback < 6 meses',
        'Defina métricas de acompanhamento semanal',
        'Execute teste piloto antes de escalar'
      ],
      sources,
      strategicSuggestion: `Perspectiva empreendedora: Crescimento sem margem saudável é insustentável. Princípios:

1. **Priorize caixa** - Liquidez > Receita
2. **Margem antes de volume** - Estabilize em 25%+ antes de crescer
3. **Teste rápido** - Piloto de 30 dias, depois escala
4. **Decisões com dados** - Histórico mínimo de 60 dias
5. **Risco calculado** - Exposição máxima: 20% do caixa

Ação imediata: Analise as 3 maiores oportunidades de melhoria de margem e prepare business case com ROI claro.`,
      confidenceLevel: 'high',
      requiresHumanFallback: false,
      nextAction: 'Compartilhe os dados atuais para análise detalhada e recomendações personalizadas.'
    }
  }

  /**
   * Handler para queries gerais
   */
  private async handleGeneralQuery(
    query: string,
    context: ThomazContext
  ): Promise<ThomazResponse> {
    const sources: SourceCitation[] = context.retrievedDocs?.map(doc => ({
      docId: doc.id,
      title: doc.title,
      version: doc.version,
      relevance: doc.similarity
    })) || []

    const hasDocs = sources.length > 0

    if (hasDocs) {
      return {
        summary: 'Informação encontrada na base de conhecimento',
        sources,
        confidenceLevel: 'medium',
        requiresHumanFallback: false,
        nextAction: 'Posso detalhar algum aspecto específico?'
      }
    }

    return {
      summary: 'Informação não encontrada na documentação interna',
      sources: [],
      confidenceLevel: 'low',
      requiresHumanFallback: true,
      fallbackReason: 'Sem documentação disponível',
      nextAction: 'Posso buscar em fontes externas ou abrir um ticket para o time?'
    }
  }

  /**
   * Extrair passos de documento
   */
  private extractStepsFromDocument(content: string): string[] {
    // Procurar por listas numeradas
    const lines = content.split('\n')
    const steps: string[] = []

    for (const line of lines) {
      const match = line.match(/^\s*\d+[\.)]\s*(.+)/)
      if (match) {
        steps.push(match[1].trim())
      }
    }

    return steps.length > 0 ? steps : ['Consulte o documento completo para detalhes']
  }

  /**
   * STEP 5: Calcular nível de confiança
   */
  private calculateConfidence(
    docs: RetrievedDocument[],
    response: ThomazResponse
  ): 'high' | 'medium' | 'low' {
    if (docs.length === 0) return 'low'

    const avgSimilarity =
      docs.reduce((sum, doc) => sum + doc.similarity, 0) / docs.length

    if (avgSimilarity >= CONFIDENCE_THRESHOLDS.HIGH && docs.length >= 2) {
      return 'high'
    }

    if (avgSimilarity >= CONFIDENCE_THRESHOLDS.MEDIUM) {
      return 'medium'
    }

    return 'low'
  }

  /**
   * STEP 7: Salvar conversação
   */
  private async saveConversation(
    ragQuery: RAGQuery,
    response: ThomazResponse,
    docs: RetrievedDocument[]
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('thomaz_conversations')
        .insert({
          session_id: ragQuery.context.sessionId,
          user_id: ragQuery.context.userId,
          user_role: ragQuery.context.userRole,
          company_id: ragQuery.context.companyId,
          message_index: 0,
          role: 'assistant',
          content: JSON.stringify(response),
          retrieved_sources: docs.map(d => d.id),
          retrieval_score: docs.length > 0
            ? docs.reduce((sum, d) => sum + d.similarity, 0) / docs.length
            : 0,
          confidence_level: response.confidenceLevel,
          requires_human: response.requiresHumanFallback
        })
        .select()
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('Save Conversation Error:', error)
      return 'unknown'
    }
  }

  /**
   * STEP 8: Log de auditoria
   */
  private async logAccess(
    conversationId: string,
    context: ThomazContext,
    docs: RetrievedDocument[]
  ): Promise<void> {
    try {
      const hasSensitiveData = docs.some(d =>
        d.sourceType === 'CONFIDENTIAL' || d.sourceType === 'RESTRICTED'
      )

      await supabase.from('thomaz_audit_log_rag').insert({
        conversation_id: conversationId,
        user_id: context.userId,
        action_type: 'RAG_QUERY',
        action_description: 'Consulta com RAG',
        data_accessed: { document_ids: docs.map(d => d.id) },
        permissions_checked: [context.userRole],
        permission_granted: true,
        sensitive_data_exposed: hasSensitiveData
      })
    } catch (error) {
      console.error('Log Access Error:', error)
    }
  }

  /**
   * Criar ticket de fallback
   */
  async createFallbackTicket(
    conversationId: string,
    sessionId: string,
    userQuery: string,
    aiResponse: string,
    reason: string
  ): Promise<void> {
    try {
      await supabase.from('thomaz_fallback_tickets').insert({
        conversation_id: conversationId,
        session_id: sessionId,
        user_query: userQuery,
        ai_response: aiResponse,
        confidence_score: 0,
        reason,
        priority: 'medium',
        status: 'open',
        sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      })
    } catch (error) {
      console.error('Create Fallback Ticket Error:', error)
    }
  }
}
