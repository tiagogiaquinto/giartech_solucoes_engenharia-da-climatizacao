/**
 * Thomaz Initializer - Script de Inicialização Automática
 *
 * Executa automaticamente ao carregar o sistema:
 * 1. Verifica health da base de conhecimento
 * 2. Indexa documentos novos
 * 3. Limpa cache expirado
 * 4. Registra métricas de sistema
 */

import { supabase } from '../lib/supabase'
import { ThomazEmbeddingsService } from '../services/thomazEmbeddingsService'
import { ThomazCacheService } from '../services/thomazCacheService'

export interface InitializationResult {
  success: boolean
  duration: number
  checks: {
    database: boolean
    knowledgeBase: boolean
    embeddings: boolean
    cache: boolean
  }
  errors: string[]
  metrics: {
    totalDocuments: number
    totalChunks: number
    conversations24h: number
    highConfidenceRate: number
  }
}

export class ThomazInitializer {
  private embeddingsService: ThomazEmbeddingsService
  private cacheService: ThomazCacheService
  private errors: string[] = []

  constructor() {
    this.embeddingsService = new ThomazEmbeddingsService()
    this.cacheService = new ThomazCacheService()
  }

  /**
   * Inicialização completa do sistema
   */
  async initialize(): Promise<InitializationResult> {
    const startTime = Date.now()

    console.log('🚀 Inicializando ThomazAI...')

    const checks = {
      database: false,
      knowledgeBase: false,
      embeddings: false,
      cache: false
    }

    const metrics = {
      totalDocuments: 0,
      totalChunks: 0,
      conversations24h: 0,
      highConfidenceRate: 0
    }

    // 1. Verificar conexão com banco
    try {
      await this.checkDatabase()
      checks.database = true
      console.log('✅ Database: Conectado')
    } catch (error) {
      this.errors.push(`Database: ${error}`)
      console.error('❌ Database: Falha na conexão')
    }

    // 2. Verificar base de conhecimento
    try {
      const kbMetrics = await this.checkKnowledgeBase()
      checks.knowledgeBase = true
      metrics.totalDocuments = kbMetrics.totalDocuments
      metrics.totalChunks = kbMetrics.totalChunks
      console.log(`✅ Knowledge Base: ${metrics.totalDocuments} docs, ${metrics.totalChunks} chunks`)
    } catch (error) {
      this.errors.push(`Knowledge Base: ${error}`)
      console.error('❌ Knowledge Base: Falha')
    }

    // 3. Verificar/Criar embeddings
    try {
      await this.initializeEmbeddings()
      checks.embeddings = true
      console.log('✅ Embeddings: Inicializados')
    } catch (error) {
      this.errors.push(`Embeddings: ${error}`)
      console.error('⚠️  Embeddings: Usando modo fallback')
      checks.embeddings = true // Não crítico, pode usar fallback
    }

    // 4. Inicializar cache
    try {
      this.cacheService.startAutoCleanup()
      checks.cache = true
      console.log('✅ Cache: Ativo (limpeza automática a cada 5min)')
    } catch (error) {
      this.errors.push(`Cache: ${error}`)
      console.error('❌ Cache: Falha')
    }

    // 5. Coletar métricas de uso
    try {
      const usageMetrics = await this.collectUsageMetrics()
      metrics.conversations24h = usageMetrics.conversations24h
      metrics.highConfidenceRate = usageMetrics.highConfidenceRate
      console.log(`📊 Métricas: ${metrics.conversations24h} conversas (24h), ${metrics.highConfidenceRate}% confiança`)
    } catch (error) {
      console.warn('⚠️  Métricas não disponíveis:', error)
    }

    const duration = Date.now() - startTime
    const success = checks.database && checks.knowledgeBase

    if (success) {
      console.log(`✅ ThomazAI pronto! (${duration}ms)`)
    } else {
      console.error(`❌ ThomazAI com problemas (${this.errors.length} erros)`)
    }

    return {
      success,
      duration,
      checks,
      errors: this.errors,
      metrics
    }
  }

  /**
   * Verificar conexão com banco
   */
  private async checkDatabase(): Promise<void> {
    const { error } = await supabase
      .from('thomaz_knowledge_sources')
      .select('id')
      .limit(1)

    if (error) throw error
  }

  /**
   * Verificar base de conhecimento
   */
  private async checkKnowledgeBase(): Promise<{
    totalDocuments: number
    totalChunks: number
  }> {
    // Contar documentos ativos
    const { data: docs, error: docsError } = await supabase
      .from('thomaz_knowledge_sources')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    if (docsError) throw docsError

    // Contar chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('thomaz_document_chunks')
      .select('id', { count: 'exact' })

    if (chunksError) throw chunksError

    return {
      totalDocuments: docs?.length || 0,
      totalChunks: chunks?.length || 0
    }
  }

  /**
   * Inicializar embeddings
   */
  private async initializeEmbeddings(): Promise<void> {
    // Verificar se há documentos sem chunks
    const { data: docsWithoutChunks, error } = await supabase
      .from('thomaz_knowledge_sources')
      .select('id, title')
      .eq('is_active', true)

    if (error) throw error

    if (!docsWithoutChunks || docsWithoutChunks.length === 0) {
      return // Nada para indexar
    }

    let needsIndexing = 0

    for (const doc of docsWithoutChunks) {
      const { data: chunks } = await supabase
        .from('thomaz_document_chunks')
        .select('id')
        .eq('source_id', doc.id)
        .limit(1)

      if (!chunks || chunks.length === 0) {
        needsIndexing++
      }
    }

    if (needsIndexing > 0) {
      console.log(`📝 ${needsIndexing} documentos precisam de indexação`)
      console.log('⏳ Indexação será feita em background...')

      // Não aguardar indexação completa para não travar inicialização
      setTimeout(() => {
        this.embeddingsService.indexAllDocuments()
          .then(() => console.log('✅ Indexação em background concluída'))
          .catch(err => console.error('❌ Erro na indexação:', err))
      }, 5000)
    }
  }

  /**
   * Coletar métricas de uso
   */
  private async collectUsageMetrics(): Promise<{
    conversations24h: number
    highConfidenceRate: number
  }> {
    // Conversas nas últimas 24h
    const { data: conversations, error: convError } = await supabase
      .from('thomaz_conversations')
      .select('id, confidence')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (convError) {
      return {
        conversations24h: 0,
        highConfidenceRate: 0
      }
    }

    const total = conversations?.length || 0
    const highConfidence = conversations?.filter(c => c.confidence > 0.85).length || 0

    return {
      conversations24h: total,
      highConfidenceRate: total > 0 ? Math.round((highConfidence / total) * 100) : 0
    }
  }

  /**
   * Health check completo
   */
  async healthCheck(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('thomaz_health_check')

      if (error) throw error

      return data
    } catch (error) {
      console.error('Health check error:', error)
      return null
    }
  }

  /**
   * Forçar reindexação completa
   */
  async forceReindex(): Promise<void> {
    console.log('🔄 Iniciando reindexação completa...')

    try {
      await this.embeddingsService.indexAllDocuments()
      console.log('✅ Reindexação concluída')
    } catch (error) {
      console.error('❌ Erro na reindexação:', error)
      throw error
    }
  }
}

/**
 * Instância singleton
 */
let initializer: ThomazInitializer | null = null

export function getThomazInitializer(): ThomazInitializer {
  if (!initializer) {
    initializer = new ThomazInitializer()
  }
  return initializer
}

/**
 * Auto-inicialização quando módulo for importado
 */
export async function autoInitialize(): Promise<InitializationResult> {
  const init = getThomazInitializer()
  return await init.initialize()
}

// Exportar para uso fácil
export const thomazInit = {
  initialize: autoInitialize,
  healthCheck: () => getThomazInitializer().healthCheck(),
  forceReindex: () => getThomazInitializer().forceReindex()
}
